const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testWithAuth() {
  try {
    console.log('Testing with authentication...\n');
    
    // Step 1: Login to get token
    console.log('=== STEP 1: Login ===');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: 'admin',
        password: 'admin123'
      })
    });
    
    console.log('Login status:', loginResponse.status);
    
    if (loginResponse.status !== 200) {
      const loginError = await loginResponse.text();
      console.log('Login error:', loginError);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful, token received');
    
    const token = loginData.token;
    
    // Step 2: Test dashboard API with token
    console.log('\n=== STEP 2: Test Dashboard API ===');
    const dashboardResponse = await fetch('http://localhost:5000/api/installments/dashboard/upcoming?includeAll=true', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('Dashboard API status:', dashboardResponse.status);
    
    if (dashboardResponse.status !== 200) {
      const errorText = await dashboardResponse.text();
      console.log('Dashboard API error:', errorText);
      return;
    }
    
    const dashboardData = await dashboardResponse.json();
    
    console.log('Success! Dashboard data:');
    console.log('Total Customers:', dashboardData.stats.totalCustomers);
    console.log('Total Amount:', dashboardData.stats.totalUpcomingAmount);
    console.log('Pending Count:', dashboardData.stats.totalPendingCount);
    console.log('Overdue Count:', dashboardData.stats.totalOverdueCount);
    
    if (dashboardData.customers.length > 0) {
      console.log('\nCustomers with installments:');
      dashboardData.customers.forEach((customer, idx) => {
        console.log(`${idx + 1}. ${customer.customer.name} - ${customer.upcomingInstallments.length} installments`);
        customer.upcomingInstallments.forEach((inst, instIdx) => {
          console.log(`   ${instIdx + 1}. ${inst.installment.amount} DA - Due: ${new Date(inst.installment.dueDate).toISOString().split('T')[0]} - Status: ${inst.installment.status}`);
        });
      });
    } else {
      console.log('\nNo customers found with upcoming installments');
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testWithAuth(); 