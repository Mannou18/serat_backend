const mongoose = require('mongoose');
const Vente = require('./src/models/Vente');
require('dotenv').config();

async function updateInstallments() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, { 
      useNewUrlParser: true, 
      useUnifiedTopology: true 
    });
    console.log('MongoDB connected');

    // Find all ventes with installments that don't have status field
    const ventes = await Vente.find({ 'installments.0': { $exists: true } });
    console.log('Found ventes with installments:', ventes.length);

    let updatedCount = 0;

    for (const vente of ventes) {
      let needsUpdate = false;
      
      // Check if any installment is missing the status field
      for (const installment of vente.installments) {
        if (!installment.status) {
          needsUpdate = true;
          break;
        }
      }

      if (needsUpdate) {
        console.log(`Updating vente ${vente._id}...`);
        
        // Update all installments to add status field
        const updatedInstallments = vente.installments.map(inst => ({
          ...inst.toObject(),
          status: inst.status || 'pending', // Default to pending if missing
          paymentDate: inst.paymentDate || null,
          paymentMethod: inst.paymentMethod || null,
          notes: inst.notes || null
        }));

        // Update the vente
        await Vente.findByIdAndUpdate(vente._id, {
          installments: updatedInstallments
        });

        updatedCount++;
        console.log(`Updated vente ${vente._id} with ${updatedInstallments.length} installments`);
      }
    }

    console.log(`\nTotal ventes updated: ${updatedCount}`);

    // Verify the update worked
    console.log('\n=== VERIFYING UPDATE ===');
    const updatedVentes = await Vente.find({ 'installments.0': { $exists: true } });
    
    updatedVentes.forEach((vente, idx) => {
      console.log(`\nVente ${idx + 1}:`);
      console.log('ID:', vente._id);
      console.log('Installments:');
      vente.installments.forEach((inst, instIdx) => {
        console.log(`  ${instIdx + 1}. Amount: ${inst.amount}, Due Date: ${inst.dueDate}, Status: ${inst.status}`);
      });
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected');
  }
}

updateInstallments(); 