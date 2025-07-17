const mongoose = require('mongoose');
const Log = require('../models/Log');

// Get logs by user ID (with pagination)
exports.getLogsByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Convert userId to ObjectId
    const filter = { user: new mongoose.Types.ObjectId(userId) };
    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Log.countDocuments(filter);

    res.json({
      logs,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get logs by customer ID (search in entityId)
exports.getLogsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Debug log to confirm correct code is running
    console.log('USING DETAILS.CUSTOMER FILTER in getLogsByCustomer');
    console.log('customerId param:', customerId);

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid customerId format.' });
    }
    const filter = { 'details.customer': new mongoose.Types.ObjectId(customerId) };
    console.log('Log API filter:', filter);

    const logs = await Log.find(filter)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    console.log('Log API results:', logs);
    const total = await Log.countDocuments(filter);
    console.log('Log API total:', total);

    // Add a user-friendly detail field to each log
    const logsWithDetail = logs.map(log => {
      let detail = '';
      switch (log.action) {
        case 'create_service':
          detail = `Service type: ${log.details?.serviceType || 'N/A'}, Car: ${log.details?.car || 'N/A'}`;
          break;
        case 'create_achat':
          detail = `Achat for customer: ${log.details?.customer || 'N/A'}`;
          break;
        // Add more cases for other actions as needed
        default:
          detail = JSON.stringify(log.details);
      }
      return {
        ...log.toObject(),
        detail
      };
    });

    if (!logsWithDetail.length) {
      return res.status(404).json({ message: 'No logs found for this customer.' });
    }

    res.json({
      logs: logsWithDetail,
      pagination: {
        current: page,
        total: Math.ceil(total / limit),
        totalRecords: total
      }
    });
  } catch (error) {
    console.error('Log API error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 