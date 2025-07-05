import { User } from '../models/User.js';
import { Reservation } from '../models/Reservation.js';
import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';

// GET all users (admin)
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    if (role) query.role = role;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await User.countDocuments(query);

    res.json({
      users,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalUsers: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch {
    res.status(500).json({ message: 'Server error while fetching users' });
  }
};

// GET user by ID (admin)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reservationStats = await Reservation.aggregate([
      { $match: { user: user._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]);

    const totalReservations = await Reservation.countDocuments({ user: user._id });
    const totalSpent = await Reservation.aggregate([
      { $match: { user: user._id, status: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);

    const recentReservations = await Reservation.find({ user: user._id })
      .populate('movie', 'title')
      .populate('showtime', 'date time')
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      user,
      stats: {
        totalReservations,
        totalSpent: totalSpent[0]?.total || 0,
        reservationsByStatus: reservationStats,
        recentReservations
      }
    });
  } catch {
    res.status(500).json({ message: 'Server error while fetching user details' });
  }
};



// DELETE user (permanent delete) (admin)
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const active = await Reservation.countDocuments({
      user: userId,
      status: { $in: ['pending', 'confirmed'] }
    });

    if (active > 0) {
      return res.status(400).json({
        message: 'Cannot delete user with active reservations. Cancel or complete them first.'
      });
    }

    // Permanently delete the user
    await User.findByIdAndDelete(userId);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
};


// GET user’s reservations (admin)
export const getUserReservations = async (req, res) => {
  try {
    const userId = req.params.id;
    const { page = 1, limit = 10, status, sortBy = 'createdAt' } = req.query;

    if (req.user.role !== 'admin' && req.user.id !== userId)
      return res.status(403).json({ message: 'You can only view your own reservations' });

    const query = { user: userId };
    if (status) query.status = status;

    const reservations = await Reservation.find(query)
      .populate('movie', 'title poster duration genre')
      .populate('showtime', 'date time cinema')
      .sort({ [sortBy]: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

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
  } catch {
    res.status(500).json({ message: 'Server error while fetching user reservations' });
  }
};


//block/unblock user  (admin)
export const blockOrUnblockUser = async (req, res) => {
  try {
    const userId = req.params.id;
    let { isActive } = req.body;

    // Convert string to boolean if necessary
    if (typeof isActive === 'string') {
      if (isActive.toLowerCase() === 'true') isActive = true;
      else if (isActive.toLowerCase() === 'false') isActive = false;
      else return res.status(400).json({ message: 'isActive must be a boolean value (true/false)' });
    }

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ message: 'isActive must be a boolean value' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (userId === req.user.id)
      return res.status(400).json({ message: 'You cannot block/unblock yourself' });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select('-password');

    res.json({
      message: `User ${isActive ? 'activated' : 'blocked'} successfully`,
      user: updatedUser
    });
  } catch (error) {
    console.error("Error while blocking/unblocking user:", error);
    res.status(500).json({ message: 'Server error while updating user status' });
  }
};


// GET user dashboard
export const getUserDashboard = async (req, res) => {
  try {
    const userId = req.params.id;
    if (req.user.role !== 'admin' && req.user.id !== userId)
      return res.status(403).json({ message: 'You can only view your own dashboard' });

    const user = await User.findById(userId).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });

    const reservationStats = await Reservation.aggregate([
      { $match: { user: user._id } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalAmount: { $sum: '$totalAmount' } } }
    ]);

    const monthlySpending = await Reservation.aggregate([
      {
        $match: {
          user: user._id,
          status: 'confirmed',
          createdAt: { $gte: new Date(new Date().getFullYear(), 0, 1) }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          totalAmount: { $sum: '$totalAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    const favoriteGenres = await Reservation.aggregate([
      { $match: { user: user._id, status: 'confirmed' } },
      { $lookup: { from: 'movies', localField: 'movie', foreignField: '_id', as: 'movieData' } },
      { $unwind: '$movieData' },
      { $unwind: '$movieData.genre' },
      { $group: { _id: '$movieData.genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);

    const upcomingReservations = await Reservation.find({
      user: userId,
      status: 'confirmed'
    })
      .populate('movie', 'title poster')
      .populate('showtime', 'date time cinema')
      .sort({ 'showtime.date': 1 })
      .limit(3);

    res.json({
      user,
      stats: {
        reservationsByStatus: reservationStats,
        monthlySpending,
        favoriteGenres,
        upcomingReservations
      }
    });
  } catch {
    res.status(500).json({ message: 'Server error while fetching dashboard data' });
  }
};
