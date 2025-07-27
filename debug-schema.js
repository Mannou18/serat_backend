const mongoose = require('mongoose');
const Vente = require('./src/models/Vente');
require('dotenv').config();

async function debugSchema() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('MongoDB connected');

    // Get all ventes with installments
    const ventes = await Vente.find({ 'installments.0': { $exists: true } });
    console.log('Total ventes with installments:', ventes.length);

    ventes.forEach((vente, idx) => {
      console.log(`\n=== VENTE ${idx + 1} ===`);
      console.log('ID:', vente._id);
      console.log('Customer:', vente.customer);
      console.log('Payment Type:', vente.paymentType);
      console.log('Is Deleted:', vente.isDeleted);
      console.log('Installments count:', vente.installments.length);
      
      console.log('\nInstallments details:');
      vente.installments.forEach((inst, instIdx) => {
        console.log(`  ${instIdx + 1}. Amount: ${inst.amount} (type: ${typeof inst.amount})`);
        console.log(`     Due Date: ${inst.dueDate} (type: ${typeof inst.dueDate})`);
        console.log(`     Status: ${inst.status} (type: ${typeof inst.status})`);
        console.log(`     Payment Date: ${inst.paymentDate}`);
        console.log(`     Payment Method: ${inst.paymentMethod}`);
        console.log(`     Notes: ${inst.notes}`);
      });
    });

    // Test different queries
    console.log('\n=== TESTING DIFFERENT QUERIES ===');
    
    // Query 1: Just check if installments exist
    const query1 = { 'installments.0': { $exists: true } };
    const result1 = await Vente.find(query1);
    console.log('Query 1 - Has installments:', result1.length);

    // Query 2: Check for pending status
    const query2 = { 'installments.status': 'pending' };
    const result2 = await Vente.find(query2);
    console.log('Query 2 - Has pending status:', result2.length);

    // Query 3: Check for overdue status
    const query3 = { 'installments.status': 'overdue' };
    const result3 = await Vente.find(query3);
    console.log('Query 3 - Has overdue status:', result3.length);

    // Query 4: Check for pending OR overdue
    const query4 = { 'installments.status': { $in: ['pending', 'overdue'] } };
    const result4 = await Vente.find(query4);
    console.log('Query 4 - Has pending OR overdue:', result4.length);

    // Query 5: Use $elemMatch
    const query5 = { 'installments': { $elemMatch: { status: 'pending' } } };
    const result5 = await Vente.find(query5);
    console.log('Query 5 - $elemMatch pending:', result5.length);

    // Query 6: Use $elemMatch with $in
    const query6 = { 'installments': { $elemMatch: { status: { $in: ['pending', 'overdue'] } } } };
    const result6 = await Vente.find(query6);
    console.log('Query 6 - $elemMatch pending OR overdue:', result6.length);

    // Query 7: Full query with $elemMatch
    const query7 = {
      'installments.0': { $exists: true },
      isDeleted: false,
      'installments': { $elemMatch: { status: { $in: ['pending', 'overdue'] } } }
    };
    const result7 = await Vente.find(query7);
    console.log('Query 7 - Full query with $elemMatch:', result7.length);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

debugSchema(); 