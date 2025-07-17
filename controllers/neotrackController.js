const Neotrack = require('../models/Neotrack');
const Customer = require('../models/Customer');
const User = require('../models/User');
const Log = require('../models/Log');
const axios = require('axios');

function neotrackToJSON(neotrack) {
  const obj = neotrack.toObject ? neotrack.toObject() : neotrack;
  return {
    ...obj,
    price: obj.price ? parseFloat(obj.price.toString()) : 0,
    customer: obj.customer && obj.customer.fname ? obj.customer : undefined,
    activatedBy: obj.activatedBy && obj.activatedBy.name ? obj.activatedBy : undefined
  };
}

exports.createNeotrack = async (req, res) => {
  try {
    // Log incoming request body
    console.log('createNeotrack: received body:', req.body);
    // Get data from frontend
    const {
      fname, lname, cin, dob, phone, profile_photo,
      plate_number, brand, model, year, imei, sim_device
    } = req.body;

    // Prepare external API call
    const apiKey = process.env.EXTERNAL_APP_API_KEY;
    console.log('createNeotrack: using API key:', apiKey);
    const externalApiUrl = 'https://track.neos.tn/api/users/with-car';
    console.log('createNeotrack: calling external API', externalApiUrl);

    // Convert empty strings to null for all fields
    const payload = {
      fname: fname || null,
      lname: lname || null,
      cin: cin || null,
      dob: dob || null,
      phone: phone || null,
      profile_photo: profile_photo || null,
      plate_number: plate_number || null,
      brand: brand || null,
      model: model || null,
      year: year || null,
      imei: imei || null,
      sim_device: sim_device || null
    };

    // Call external API
    const response = await axios.post(
      externalApiUrl,
      payload,
      {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('createNeotrack: external API response status:', response.status);
    console.log('createNeotrack: external API response data:', response.data);

    // Robustly extract user, car, password from any response shape
    let user, car, password;
    let data = response.data;
    if (response.status === 200 || response.status === 201) {
      if (Array.isArray(data) && data[0]?.user && data[0]?.car) {
        ({ user, car, password } = data[0]);
      } else if (data.user && data.car) {
        ({ user, car, password } = data);
      } else if (data.data && data.data.user && data.data.car) {
        ({ user, car, password } = data.data);
      }
      console.log('DEBUG: user:', user, 'car:', car, 'password:', password);
    } else {
      // If not 200 or 201, return error message and response data
      return res.status(response.status).json({
        message: 'External API error',
        data: response.data
      });
    }

    if (user && typeof user === 'object' && car && typeof car === 'object') {
      // Save all relevant info in Neotrack
      const neotrack = new Neotrack({
        user: user._id,
        car: car._id,
        customer: user._id, // use the real user._id as customer
        serialNumber: req.body.serialNumber || car.device_id || 'STATIC-SERIAL',
        purchaseDate: req.body.purchaseDate || new Date(),
        price: req.body.price || 0,
        plate_number: car.plate_number,
        brand: car.brand,
        model: car.model,
        year: car.year,
        imei: car.imei,
        sim_device: car.sim_device,
        details: {
          user,
          car,
          password // Save password for linking
        },
        // Add any other fields you want to save
      });

      await neotrack.save();
      console.log('createNeotrack: saved neotrack:', neotrack);

      // Log neotrack creation only if user is present
      if (req.user && req.user._id) {
        await Log.create({
          user: req.user._id,
          action: 'create_neotrack',
          entityType: 'Neotrack',
          entityId: neotrack._id,
          details: neotrack.toObject()
        });
      }

      // Return the saved neotrack (including password) to frontend
      return res.status(201).json(neotrack);
    } else {
      console.log('createNeotrack: unexpected external API data:', response.data);
      return res.status(400).json({ message: 'External API did not return expected data', data: response.data });
    }
  } catch (error) {
    if (error.response) {
      if (error.response.status === 400) {
        // Duplicate phone or plate number
        return res.status(400).json({
          message: 'Duplicate phone or plate number. Please use unique values.',
          details: error.response.data
        });
      }
      console.log('createNeotrack: external API error:', error.response.status, error.response.data);
      return res.status(error.response.status).json({ message: 'External API error', error: error.response.data });
    }
    console.log('createNeotrack: server error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getAllNeotracks = async (req, res) => {
  try {
    const neotracks = await Neotrack.find()
      .populate('customer', 'fname lname phoneNumber')
      .populate('activatedBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ neotracks });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getNeotrack = async (req, res) => {
  try {
    const neotrack = await Neotrack.findById(req.params.id)
      .populate('customer', 'fname lname phoneNumber')
      .populate('activatedBy', 'name');
    if (!neotrack) {
      return res.status(404).json({ message: 'Neotrack not found' });
    }
    res.json(neotrack);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateNeotrack = async (req, res) => {
  try {
    const { serialNumber, customer, price, purchaseDate, notes, isActive, activatedBy, activatedAt } = req.body;
    const updateData = {};
    if (serialNumber) updateData.serialNumber = serialNumber;
    if (customer) updateData.customer = customer;
    if (price) updateData.price = price;
    if (purchaseDate) updateData.purchaseDate = purchaseDate;
    if (notes !== undefined) updateData.notes = notes;
    if (typeof isActive === 'boolean') updateData.isActive = isActive;
    if (activatedBy) updateData.activatedBy = activatedBy;
    if (activatedAt) updateData.activatedAt = activatedAt;
    const neotrack = await Neotrack.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    ).populate([
      { path: 'customer', select: 'fname lname phoneNumber' },
      { path: 'activatedBy', select: 'name' }
    ]);
    if (!neotrack) {
      return res.status(404).json({ message: 'Neotrack not found' });
    }
    // Log neotrack activation if isActive is set to true
    if (updateData.isActive === true) {
      await Log.create({
        user: req.user._id,
        action: 'activate_neotrack',
        entityType: 'Neotrack',
        entityId: neotrack._id,
        details: neotrack.toObject()
      });
    }
    res.json({ message: 'Neotrack updated successfully', neotrack: neotrackToJSON(neotrack) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteNeotrack = async (req, res) => {
  try {
    const neotrack = await Neotrack.findByIdAndDelete(req.params.id);
    if (!neotrack) {
      return res.status(404).json({ message: 'Neotrack not found' });
    }
    res.json({ message: 'Neotrack deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
}; 