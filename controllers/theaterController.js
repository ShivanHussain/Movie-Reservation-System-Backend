import { Theater } from '../models/Theater.js';

// get all theaters
export const getAllTheaters = async (req, res) => {
  try {
    const { page = 1, limit = 10, city, search } = req.query;
    const query = { isActive: true };

    if (city) {
      query['location.city'] = { $regex: city, $options: 'i' };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { 'location.address': { $regex: search, $options: 'i' } },
        { 'location.city': { $regex: search, $options: 'i' } }
      ];
    }

    const theaters = await Theater.find(query)
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-__v');

    const total = await Theater.countDocuments(query);

    res.json({
      theaters,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / limit),
        totalTheaters: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching theaters' });
  }
};


// get theater by id
export const getTheaterById = async (req, res) => {
  try {
    const theater = await Theater.findById(req.params.id).select('-__v');

    if (!theater || !theater.isActive) {
      return res.status(404).json({ message: 'Theater not found' });
    }

    res.json(theater);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid theater ID' });
    }
    res.status(500).json({ message: 'Server error while fetching theater' });
  }
};


// create theater  (admin)
export const createTheater = async (req, res) => {
  try {
    const theater = new Theater(req.body);
    await theater.save();

    res.status(201).json({
      message: 'Theater created successfully',
      theater
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error while creating theater' });
  }
};


//update theater  (admin)
export const updateTheater = async (req, res) => {
  try {
    const theater = await Theater.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }

    res.json({
      message: 'Theater updated successfully',
      theater
    });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid theater ID' });
    }
    res.status(500).json({ message: 'Server error while updating theater' });
  }
};


//delete theater  (admin)
export const deleteTheater = async (req, res) => {
  try {
    const theater = await Theater.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!theater) {
      return res.status(404).json({ message: 'Theater not found' });
    }

    res.json({ message: 'Theater deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid theater ID' });
    }
    res.status(500).json({ message: 'Server error while deleting theater' });
  }
};


//get theaters in cities
export const getCities = async (req, res) => {
  try {
    const cities = await Theater.distinct('location.city', { isActive: true });
    res.json({ cities });
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching cities' });
  }
};
