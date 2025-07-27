const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    console.log('Testing Dashboard API...\n');
    
    // Test 1: Include all pending/overdue installments
    console.log('=== TEST 1: Include All Installments ===');
    const response1 = await fetch('http://localhost:5000/api/installments/dashboard/upcoming?includeAll=true');
    const data1 = await response1.json();
    
    console.log('Status:', response1.status);
    console.log('Total Customers:', data1.stats.totalCustomers);
    console.log('Total Amount:', data1.stats.totalUpcomingAmount);
    console.log('Pending Count:', data1.stats.totalPendingCount);
    console.log('Overdue Count:', data1.stats.totalOverdueCount);
    
    if (data1.customers.length > 0) {
      console.log('\nCustomers with installments:');
      data1.customers.forEach((customer, idx) => {
        console.log(`${idx + 1}. ${customer.customer.name} - ${customer.upcomingInstallments.length} installments`);
        customer.upcomingInstallments.forEach((inst, instIdx) => {
          console.log(`   ${instIdx + 1}. ${inst.installment.amount} DA - Due: ${new Date(inst.installment.dueDate).toISOString().split('T')[0]} - Status: ${inst.installment.status}`);
        });
      });
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Test 2: Only next 30 days
    console.log('=== TEST 2: Next 30 Days Only ===');
    const response2 = await fetch('http://localhost:5000/api/installments/dashboard/upcoming');
    const data2 = await response2.json();
    
    console.log('Status:', response2.status);
    console.log('Total Customers:', data2.stats.totalCustomers);
    console.log('Total Amount:', data2.stats.totalUpcomingAmount);
    console.log('Pending Count:', data2.stats.totalPendingCount);
    console.log('Overdue Count:', data2.stats.totalOverdueCount);
    
    if (data2.customers.length > 0) {
      console.log('\nCustomers with installments:');
      data2.customers.forEach((customer, idx) => {
        console.log(`${idx + 1}. ${customer.customer.name} - ${customer.upcomingInstallments.length} installments`);
        customer.upcomingInstallments.forEach((inst, instIdx) => {
          console.log(`   ${instIdx + 1}. ${inst.installment.amount} DA - Due: ${new Date(inst.installment.dueDate).toISOString().split('T')[0]} - Status: ${inst.installment.status}`);
        });
      });
    }
    
  } catch (error) {
    console.error('Error testing API:', error);
  }
}

testAPI(); 