const axios = require('axios');

async function testEndpoint() {
  try {
    console.log('🚀 Testing the admin products validation endpoint...');

    const response = await axios.get('http://localhost:3000/vendor-product/admin/products/validation', {
      headers: {
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjMsImVtYWlsIjoiaGlua28uZGVsaXZlcnlAZ21haWwuY29tIiwiaXNBZG1pbiI6dHJ1ZSwiaWF0IjoxNzU4NTU1NzgyLCJleHAiOjE3NTk3NjUzODJ9.xoT4O3Z2LCg4Dd2eFPL7FKKKZbWTaQ2_QXIQy5LDhbw',
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Response status:', response.status);

    if (response.data && response.data.data && response.data.data.products) {
      const products = response.data.data.products;
      console.log(`📦 Found ${products.length} products`);

      products.forEach((product, index) => {
        console.log(`\n--- Product ${index + 1} (ID: ${product.id}) ---`);
        console.log(`Name: ${product.vendorName}`);
        console.log(`adminValidated: ${product.adminValidated}`);
        console.log(`isValidated: ${product.isValidated}`);
        console.log(`finalStatus: ${product.finalStatus}`);
        console.log(`isWizardProduct: ${product.isWizardProduct}`);
      });
    }

  } catch (error) {
    console.error('❌ Error testing endpoint:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

testEndpoint();