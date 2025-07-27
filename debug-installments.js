const mongoose = require('mongoose');
const Vente = require('./src/models/Vente');
const Customer = require('./src/models/Customer');
require('dotenv').config();

async function debugInstallments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('MongoDB connected');

    // Check all ventes with installments
    const ventesWithInstallments = await Vente.find({
      'installments.0': { $exists: true },
      isDeleted: false
    });

    console.log('\n=== ALL VENTES WITH INSTALLMENTS ===');
    console.log('Total ventes with installments:', ventesWithInstallments.length);

    // Get customers for reference
    const customers = await Customer.find({});
    const customerMap = {};
    customers.forEach(cust => {
      customerMap[cust._id.toString()] = cust;
    });

    ventesWithInstallments.forEach((vente, idx) => {
      const customer = customerMap[vente.customer.toString()];
      const customerName = customer ? 
        (customer.fname && customer.lname ? `${customer.fname} ${customer.lname}` : customer.name) : 
        'Unknown Customer';

      console.log(`\nVente ${idx + 1}:`);
      console.log('  ID:', vente._id);
      console.log('  Customer:', customerName);
      console.log('  Payment Type:', vente.paymentType);
      console.log('  Installments:');
      
      vente.installments.forEach((inst, instIdx) => {
        console.log(`    ${instIdx + 1}. Amount: ${inst.amount}, Due Date: ${inst.dueDate}, Status: ${inst.status}`);
      });
    });

    // Check for facilité payments specifically
    const faciliteVentes = ventesWithInstallments.filter(v => v.paymentType === 'facilite');
    console.log('\n=== FACILITÉ VENTES ===');
    console.log('Total facilité ventes:', faciliteVentes.length);

    faciliteVentes.forEach((vente, idx) => {
      const customer = customerMap[vente.customer.toString()];
      const customerName = customer ? 
        (customer.fname && customer.lname ? `${customer.fname} ${customer.lname}` : customer.name) : 
        'Unknown Customer';

      console.log(`\nFacilité Vente ${idx + 1}:`);
      console.log('  ID:', vente._id);
      console.log('  Customer:', customerName);
      console.log('  Installments:');
      
      vente.installments.forEach((inst, instIdx) => {
        const dueDate = new Date(inst.dueDate);
        const today = new Date();
        const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
        
        console.log(`    ${instIdx + 1}. Amount: ${inst.amount}, Due Date: ${dueDate.toISOString().split('T')[0]}, Status: ${inst.status}, Days until due: ${daysUntilDue}`);
      });
    });

    // Check upcoming installments (next 30 days)
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);

    console.log('\n=== UPCOMING INSTALLMENTS (Next 30 days) ===');
    console.log('Date range:', today.toISOString().split('T')[0], 'to', futureDate.toISOString().split('T')[0]);

    let upcomingCount = 0;
    faciliteVentes.forEach(vente => {
      const customer = customerMap[vente.customer.toString()];
      const customerName = customer ? 
        (customer.fname && customer.lname ? `${customer.fname} ${customer.lname}` : customer.name) : 
        'Unknown Customer';

      const upcomingInstallments = vente.installments.filter(inst => {
        const dueDate = new Date(inst.dueDate);
        const isUpcoming = dueDate >= today && dueDate <= futureDate;
        const isPendingOrOverdue = ['pending', 'overdue'].includes(inst.status);
        return isUpcoming && isPendingOrOverdue;
      });

      if (upcomingInstallments.length > 0) {
        console.log(`\nCustomer: ${customerName}`);
        upcomingInstallments.forEach((inst, idx) => {
          const dueDate = new Date(inst.dueDate);
          const daysUntilDue = Math.ceil((dueDate - today) / (1000 * 60 * 60 * 24));
          console.log(`  ${idx + 1}. Amount: ${inst.amount}, Due: ${dueDate.toISOString().split('T')[0]}, Status: ${inst.status}, Days: ${daysUntilDue}`);
          upcomingCount++;
        });
      }
    });

    console.log(`\nTotal upcoming installments: ${upcomingCount}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

debugInstallments(); 