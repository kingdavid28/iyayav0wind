const Contract = require('../models/Contract');
const User = require('../models/User');
const { validationResult } = require('express-validator');

exports.createContract = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    const { providerId, serviceType, startDate, endDate, hours, rate, address, specialInstructions } = req.body;
    
    // Validate provider exists
    const provider = await User.findById(providerId);
    if (!provider || provider.userType !== 'provider') {
      return res.status(404).json({ 
        success: false,
        error: 'Provider not found' 
      });
    }
    
    const totalAmount = hours * rate;
    
    const contract = new Contract({
      clientId: req.user.id,
      providerId,
      serviceType,
      startDate,
      endDate,
      hours,
      rate,
      totalAmount,
      address,
      specialInstructions,
      status: 'pending'
    });
    
    await contract.save();
    
    // Populate provider details in response
    const populatedContract = await Contract.populate(contract, {
      path: 'providerId',
      select: 'name profileImage'
    });
    
    res.status(201).json({
      success: true,
      contract: populatedContract
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ 
      success: false,
      error: 'Failed to create contract',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Other contract methods with similar improvements

// Get client contracts
exports.getClientContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ clientId: req.params.clientId })
      .populate('providerId', 'name profileImage')
      .sort({ createdAt: -1 });
      
    res.json(contracts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get provider contracts
exports.getProviderContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({ providerId: req.user.id })
      .populate('clientId', 'name profileImage')
      .sort({ createdAt: -1 });
      
    res.json(contracts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update contract status
exports.updateContractStatus = async (req, res) => {
  try {
    const { status } = req.body;
    
    const contract = await Contract.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    
    res.json(contract);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};