import { Showtime }  from '../models/ShowTime.js';
import { Movie } from '../models/Movie.js';
import { Theater } from '../models/Theater.js';


//Get all showtimes
export const getAllShowtimes = async (req, res) => {
  try {
    const { page = 1, limit = 10, movie, theater, date, city } = req.query;
    const query = { isActive: true };

    if (movie) query.movie = movie;
    if (theater) query.theater = theater;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.startTime = { $gte: start, $lt: end };
    }

    let showtimes = await Showtime.find(query)
      .populate('movie', 'title poster duration rating')
      .populate('theater', 'name location')
      .sort({ startTime: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    if (city) {
      showtimes = showtimes.filter(s =>
        s.theater.location.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    const total = await Showtime.countDocuments(query);

    res.json({
      showtimes,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalShowtimes: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error while fetching showtimes' });
  }
};



//get showtime by Id
export const getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate('movie')
      .populate('theater')
      .select('-__v');
    if (!showtime || !showtime.isActive) return res.status(404).json({ message: 'Showtime not found' });

    res.json(showtime);
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid showtime ID' });
    res.status(500).json({ message: 'Server error while fetching showtime' });
  }
};


// create showtime  (admin)
export const createShowtime = async (req, res) => {
  try {
    const { movie, theater, screenNumber, startTime, endTime, price, totalSeats } = req.body;

    const movieExists = await Movie.findById(movie);
    if (!movieExists) return res.status(400).json({ message: 'Movie not found' });

    const theaterExists = await Theater.findById(theater);
    if (!theaterExists) return res.status(400).json({ message: 'Theater not found' });

    const screen = theaterExists.screens.find(s => s.screenNumber === screenNumber);
    if (!screen) return res.status(400).json({ message: 'Screen not found in theater' });

    const overlapping = await Showtime.findOne({
      theater,
      screenNumber,
      isActive: true,
      $or: [
        { startTime: { $lte: new Date(startTime) }, endTime: { $gt: new Date(startTime) } },
        { startTime: { $lt: new Date(endTime) }, endTime: { $gte: new Date(endTime) } },
        { startTime: { $gte: new Date(startTime) }, endTime: { $lte: new Date(endTime) } }
      ]
    });

    if (overlapping) return res.status(400).json({ message: 'Time slot conflicts with existing showtime' });

    const seatMap = new Map();
    for (let i = 1; i <= totalSeats; i++) {
      const row = String.fromCharCode(65 + Math.floor((i - 1) / 10));
      const number = ((i - 1) % 10) + 1;
      const seat = `${row}${number}`;
      seatMap.set(seat, {
        isBooked: false,
        seatType: i <= totalSeats * 0.2 ? 'premium' : 'standard'
      });
    }

    const showtime = new Showtime({
      movie,
      theater,
      screenNumber,
      startTime,
      endTime,
      price,
      totalSeats,
      availableSeats: totalSeats,
      seatMap
    });

    await showtime.save();
    await showtime.populate('movie', 'title poster');
    await showtime.populate('theater', 'name location');

    res.status(201).json({
      message: 'Showtime created successfully',
      showtime
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error while creating showtime' });
  }
};


//update showtime  (admin)
export const updateShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    })
      .populate('movie', 'title poster')
      .populate('theater', 'name location');

    if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

    res.json({ message: 'Showtime updated successfully', showtime });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid showtime ID' });
    res.status(500).json({ message: 'Server error while updating showtime' });
  }
};


//delete showtime  (admin)
export const deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!showtime) return res.status(404).json({ message: 'Showtime not found' });

    res.json({ message: 'Showtime deleted successfully' });
  } catch (err) {
    if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid showtime ID' });
    res.status(500).json({ message: 'Server error while deleting showtime' });
  }
};


//get available seats in showtime
export const getAvailableSeats = async (req, res) => {
  try {
    const showtimeId = req.params.id;

    const showtime = await Showtime.findById(showtimeId)
      .select('seatMap availableSeats totalSeats isActive movie theater')
      .populate('movie', 'title')
      .populate('theater', 'name');

    if (!showtime) {
      return res.status(404).json({ message: 'Showtime not found' });
    }

    if (!showtime.isActive) {
      return res.status(400).json({ message: 'Showtime is inactive' });
    }

    if (!showtime.seatMap || typeof showtime.seatMap !== 'object') {
      return res.status(500).json({ message: 'Seat map is not available' });
    }

    // Convert Map or Object to array
    let seats;
    if (showtime.seatMap instanceof Map) {
      // If stored as Map
      seats = Array.from(showtime.seatMap.entries()).map(([seatNumber, seatData]) => ({
        seatNumber,
        ...seatData
      }));
    } else {
      // If stored as Object
      seats = Object.entries(showtime.seatMap).map(([seatNumber, seatData]) => ({
        seatNumber,
        ...seatData
      }));
    }

    res.json({
      showtime: {
        id: showtime._id,
        movie: showtime.movie?.title || 'N/A',
        theater: showtime.theater?.name || 'N/A',
        availableSeats: showtime.availableSeats,
        totalSeats: showtime.totalSeats
      },
      seats
    });
  } catch (err) {
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid showtime ID format' });
    }
    res.status(500).json({ message: 'Server error while fetching seats' });
  }
};


//get showtime by movieId
export const getShowtimesByMovie = async (req, res) => {
  try {
    const { date, city } = req.query;
    const movieId = req.params.movieId;

    const query = {
      movie: movieId,
      isActive: true,
      startTime: { $gte: new Date() }
    };

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      query.startTime = { $gte: start, $lt: end };
    }

    let showtimes = await Showtime.find(query)
      .populate('theater', 'name location')
      .sort({ startTime: 1 });

    if (city) {
      showtimes = showtimes.filter(s =>
        s.theater.location.city.toLowerCase().includes(city.toLowerCase())
      );
    }

    res.json({ showtimes });
  } catch (err) {
    res.status(500).json({ message: 'Server error while fetching movie showtimes' });
  }
};
