// controllers/reservationController.js
import { Reservation } from '../models/Reservation.js';
import { Showtime } from '../models/ShowTime.js';

// Get Logged-in User's Reservations
export const getUserReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.user._id };

    if (status) query.status = status;

    const reservations = await Reservation.find(query)
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title poster duration rating' },
          { path: 'theater', select: 'name location' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Reservation.countDocuments(query);

    res.json({
      reservations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReservations: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching reservations' });
  }
};

// Get All Reservations (Admin)
export const getAllReservations = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, user } = req.query;
    const query = {};

    if (status) query.status = status;
    if (user) query.user = user;

    const reservations = await Reservation.find(query)
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title poster' },
          { path: 'theater', select: 'name location' }
        ]
      })
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Reservation.countDocuments(query);

    res.json({
      reservations,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalReservations: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching reservations' });
  }
};

// Get Reservation by ID
export const getReservationById = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate({
        path: 'showtime',
        populate: [
          { path: 'movie', select: 'title poster duration rating' },
          { path: 'theater', select: 'name location' }
        ]
      });

    if (!reservation) {
      return res.status(404).json({ message: 'Reservation not found' });
    }

    if (req.user.role !== 'admin' && reservation.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(reservation);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching reservation' });
  }
};

// Create Reservation
export const createReservation = async (req, res) => {
  try {
    const { showtime: showtimeId, seats } = req.body;
    const showtime = await Showtime.findById(showtimeId);

    if (!showtime || !showtime.isActive) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    if (new Date(showtime.startTime) <= new Date()) {
      return res.status(400).json({ message: 'Cannot book past showtimes' });
    }

    const requestedSeats = seats.map(seat => seat.seatNumber);
    const unavailableSeats = [];

    for (const seatNumber of requestedSeats) {
      const seatData = showtime.seatMap.get(seatNumber);
      if (!seatData) {
        return res.status(400).json({ message: `Seat ${seatNumber} does not exist` });
      }
      if (seatData.isBooked) {
        unavailableSeats.push(seatNumber);
      }
    }

    if (unavailableSeats.length) {
      return res.status(400).json({ message: 'Some seats are already booked', unavailableSeats });
    }

    if (showtime.availableSeats < requestedSeats.length) {
      return res.status(400).json({ message: 'Not enough available seats' });
    }

    let totalAmount = 0;
    const reservationSeats = [];

    for (const seat of seats) {
      const seatData = showtime.seatMap.get(seat.seatNumber);
      const price =
        seatData.seatType === 'premium' ? showtime.price * 1.5 :
        seatData.seatType === 'vip' ? showtime.price * 2 :
        showtime.price;

      totalAmount += price;
      reservationSeats.push({ seatNumber: seat.seatNumber, seatType: seatData.seatType });
    }

    const reservation = new Reservation({
      user: req.user._id,
      showtime: showtimeId,
      seats: reservationSeats,
      totalAmount,
      status: 'pending'
    });

    await reservation.save();

    for (const seatNumber of requestedSeats) {
      const seatData = showtime.seatMap.get(seatNumber);
      seatData.isBooked = true;
      showtime.seatMap.set(seatNumber, seatData);
    }

    showtime.availableSeats -= requestedSeats.length;
    await showtime.save();

    await reservation.populate({
      path: 'showtime',
      populate: [
        { path: 'movie', select: 'title poster duration' },
        { path: 'theater', select: 'name location' }
      ]
    });

    res.status(201).json({ message: 'Reservation created successfully', reservation });
  } catch (error) {
    console.error('Reservation Error:', error);
    res.status(500).json({ message: 'Server error while creating reservation' });
  }
};

// Update Reservation Status (Admin)
export const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    const oldStatus = reservation.status;
    reservation.status = status;
    await reservation.save();

    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const showtime = await Showtime.findById(reservation.showtime);
      if (showtime) {
        for (const seat of reservation.seats) {
          const seatData = showtime.seatMap.get(seat.seatNumber);
          if (seatData) {
            seatData.isBooked = false;
            showtime.seatMap.set(seat.seatNumber, seatData);
          }
        }
        showtime.availableSeats += reservation.seats.length;
        await showtime.save();
      }
    }

    res.json({ message: 'Reservation status updated successfully', reservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating reservation' });
  }
};

// Cancel Reservation (User or Admin)
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) return res.status(404).json({ message: 'Reservation not found' });

    if (req.user.role !== 'admin' && reservation.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (reservation.status === 'cancelled') {
      return res.status(400).json({ message: 'Reservation is already cancelled' });
    }

    const showtime = await Showtime.findById(reservation.showtime);
    const hoursBeforeShow = (new Date(showtime.startTime) - new Date()) / (1000 * 60 * 60);

    if (hoursBeforeShow < 2) {
      return res.status(400).json({ message: 'Cannot cancel reservation less than 2 hours before showtime' });
    }

    reservation.status = 'cancelled';
    await reservation.save();

    for (const seat of reservation.seats) {
      const seatData = showtime.seatMap.get(seat.seatNumber);
      if (seatData) {
        seatData.isBooked = false;
        showtime.seatMap.set(seat.seatNumber, seatData);
      }
    }

    showtime.availableSeats += reservation.seats.length;
    await showtime.save();

    res.json({ message: 'Reservation cancelled successfully', reservation });
  } catch (error) {
    res.status(500).json({ message: 'Server error while cancelling reservation' });
  }
};

// Reservation Analytics (Admin)
export const getReservationAnalytics = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Total reservations today
    const todayReservations = await Reservation.countDocuments({
      createdAt: { $gte: startOfDay }
    });

    // Total reservations this month
    const monthReservations = await Reservation.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Revenue for confirmed reservations this month
    const monthRevenueAgg = await Reservation.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfMonth },
          status: 'confirmed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$totalAmount' }
        }
      }
    ]);

    const monthRevenue = monthRevenueAgg.length > 0 ? monthRevenueAgg[0].total : 0;

    // Status distribution (renaming _id to status)
    const statusDistribution = await Reservation.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          status: '$_id',
          count: 1
        }
      }
    ]);

    // Final response
    res.json({
      todayReservations,
      monthReservations,
      monthRevenue,
      statusDistribution
    });

  } catch (error) {
    console.error('Analytics Error:', error);
    res.status(500).json({ message: 'Server error while fetching analytics' });
  }
};

