const mongoose = require('mongoose');
require('dotenv').config();

async function debugRaw() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('MongoDB connected');

    // Get the raw collection
    const db = mongoose.connection.db;
    const ventesCollection = db.collection('ventes');

    // Find all documents with installments
    const ventes = await ventesCollection.find({ 'installments.0': { $exists: true } }).toArray();
    console.log('Raw ventes with installments:', ventes.length);

    ventes.forEach((vente, idx) => {
      console.log(`\n=== RAW VENTE ${idx + 1} ===`);
      console.log('ID:', vente._id);
      console.log('Customer:', vente.customer);
      console.log('Payment Type:', vente.paymentType);
      console.log('Is Deleted:', vente.isDeleted);
      console.log('Installments:', JSON.stringify(vente.installments, null, 2));
    });

    // Test raw queries
    console.log('\n=== TESTING RAW QUERIES ===');
    
    // Query 1: Raw query for pending status
    const result1 = await ventesCollection.find({ 'installments.status': 'pending' }).toArray();
    console.log('Raw Query 1 - Has pending status:', result1.length);

    // Query 2: Raw query with $elemMatch
    const result2 = await ventesCollection.find({ 
      'installments': { $elemMatch: { status: 'pending' } } 
    }).toArray();
    console.log('Raw Query 2 - $elemMatch pending:', result2.length);

    // Query 3: Raw query with $in
    const result3 = await ventesCollection.find({ 
      'installments': { $elemMatch: { status: { $in: ['pending', 'overdue'] } } } 
    }).toArray();
    console.log('Raw Query 3 - $elemMatch pending OR overdue:', result3.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

debugRaw(); 