const mongoose = require('mongoose');
const Vente = require('./src/models/Vente');
require('dotenv').config();

async function testDBQuery() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('MongoDB connected');

    // Test the FIXED query as the API
    const query = {
      'installments.0': { $exists: true },
      isDeleted: false,
      'installments': {
        $elemMatch: {
          status: { $in: ['pending', 'overdue'] }
        }
      }
    };

    console.log('FIXED Query:', JSON.stringify(query, null, 2));

    const ventes = await Vente.find(query)
      .populate('customer', 'fname lname name phoneNumber cin')
      .populate('articles.product', 'title name')
      .populate('services.service', 'title name');

    console.log('Found ventes with FIXED query:', ventes.length);

    if (ventes.length > 0) {
      ventes.forEach((vente, idx) => {
        console.log(`\nVente ${idx + 1}:`);
        console.log('  ID:', vente._id);
        console.log('  Customer:', vente.customer?.fname + ' ' + vente.customer?.lname);
        console.log('  Payment Type:', vente.paymentType);
        console.log('  Installments:');
        
        vente.installments.forEach((inst, instIdx) => {
          console.log(`    ${instIdx + 1}. Amount: ${inst.amount}, Due Date: ${inst.dueDate}, Status: ${inst.status}`);
        });
      });
    } else {
      console.log('No ventes found with the FIXED query!');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

testDBQuery(); 