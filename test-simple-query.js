const mongoose = require('mongoose');
const Vente = require('./src/models/Vente');
require('dotenv').config();

async function testSimpleQuery() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('MongoDB connected');

    // Test different query approaches
    console.log('\n=== TESTING DIFFERENT QUERY APPROACHES ===');
    
    // Approach 1: Simple status query
    const query1 = { 'installments.status': 'pending' };
    const result1 = await Vente.find(query1);
    console.log('Approach 1 - Simple status query:', result1.length);

    // Approach 2: $elemMatch with single status
    const query2 = { 'installments': { $elemMatch: { status: 'pending' } } };
    const result2 = await Vente.find(query2);
    console.log('Approach 2 - $elemMatch single status:', result2.length);

    // Approach 3: $elemMatch with $in
    const query3 = { 'installments': { $elemMatch: { status: { $in: ['pending', 'overdue'] } } } };
    const result3 = await Vente.find(query3);
    console.log('Approach 3 - $elemMatch with $in:', result3.length);

    // Approach 4: Using aggregation pipeline
    const result4 = await Vente.aggregate([
      { $match: { 'installments.0': { $exists: true }, isDeleted: false } },
      { $unwind: '$installments' },
      { $match: { 'installments.status': { $in: ['pending', 'overdue'] } } },
      { $group: { _id: '$_id', vente: { $first: '$$ROOT' } } },
      { $replaceRoot: { newRoot: '$vente' } }
    ]);
    console.log('Approach 4 - Aggregation pipeline:', result4.length);

    // Approach 5: Manual filtering in JavaScript
    const allVentes = await Vente.find({ 'installments.0': { $exists: true }, isDeleted: false });
    const filteredVentes = allVentes.filter(vente => 
      vente.installments.some(inst => ['pending', 'overdue'].includes(inst.status))
    );
    console.log('Approach 5 - Manual JavaScript filtering:', filteredVentes.length);

    if (filteredVentes.length > 0) {
      console.log('\n=== MANUAL FILTERING RESULTS ===');
      filteredVentes.forEach((vente, idx) => {
        console.log(`\nVente ${idx + 1}:`);
        console.log('ID:', vente._id);
        console.log('Customer:', vente.customer);
        console.log('Installments:');
        vente.installments.forEach((inst, instIdx) => {
          console.log(`  ${instIdx + 1}. Amount: ${inst.amount}, Status: ${inst.status}, Due Date: ${inst.dueDate}`);
        });
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

testSimpleQuery(); 