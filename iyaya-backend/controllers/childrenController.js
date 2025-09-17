const Child = require('../models/Child');
const mongoose = require('mongoose');

const getUserId = (req) => {
  // Use the user ID set by authentication middleware
  const userId = req.user?.mongoId || req.user?.id;
  console.log('🔍 getUserId:', { mongoId: req.user?.mongoId, id: req.user?.id, resolved: userId });
  return userId;
};

// Get all children for the authenticated user
exports.getMyChildren = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const children = await Child.find({ parentId: userId }).sort({ createdAt: -1 });
    
    res.json({
      success: true,
      children
    });
  } catch (err) {
    console.error('Get children error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to get children'
    });
  }
};

// Create a new child
exports.createChild = async (req, res) => {
  try {
    console.log('👶 Creating child - Request:', {
      body: req.body,
      user: req.user?.id || req.user?.mongoId,
      headers: req.headers.authorization ? 'Present' : 'Missing'
    });
    
    const userId = getUserId(req);
    console.log('👶 User ID resolved:', userId);
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { name, age, allergies, preferences } = req.body;
    console.log('👶 Child data:', { name, age, allergies, preferences });

    if (!name || age === undefined || age === null) {
      return res.status(400).json({ 
        success: false, 
        error: 'Name and age are required' 
      });
    }

    const childData = {
      parentId: userId,
      name: String(name).trim(),
      age: Number(age),
      allergies: allergies || '',
      preferences: preferences || ''
    };
    
    console.log('👶 Creating child with data:', childData);
    
    const child = await Child.create(childData);
    console.log('✅ Child created successfully:', child._id);

    res.status(201).json({
      success: true,
      child
    });
  } catch (err) {
    console.error('❌ Create child error:', {
      name: err.name,
      message: err.message,
      code: err.code,
      stack: err.stack?.split('\n').slice(0, 5),
      userId: getUserId(req),
      requestBody: req.body
    });
    
    let errorMessage = 'Failed to create child';
    if (err.name === 'ValidationError') {
      errorMessage = Object.values(err.errors).map(e => e.message).join(', ');
    } else if (err.code === 11000) {
      errorMessage = 'Child ID already exists';
    }
    
    res.status(500).json({
      success: false,
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Update a child
exports.updateChild = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { id } = req.params;
    const { name, age, allergies, preferences } = req.body;

    const child = await Child.findOneAndUpdate(
      { _id: id, parentId: userId },
      {
        name: name?.trim(),
        age: age ? Number(age) : undefined,
        allergies,
        preferences
      },
      { new: true, runValidators: true }
    );

    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    res.json({
      success: true,
      child
    });
  } catch (err) {
    console.error('Update child error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to update child'
    });
  }
};

// Delete a child
exports.deleteChild = async (req, res) => {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const { id } = req.params;

    const child = await Child.findOneAndDelete({ _id: id, parentId: userId });

    if (!child) {
      return res.status(404).json({ success: false, error: 'Child not found' });
    }

    res.json({
      success: true,
      message: 'Child deleted successfully'
    });
  } catch (err) {
    console.error('Delete child error:', err);
    res.status(500).json({
      success: false,
      error: 'Failed to delete child'
    });
  }
};