const fetch = require('node-fetch');

async function checkLogin() {
  try {
    const loginResponse = await fetch('http://localhost:3004/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'pf.d@zig.univ.sn',
        password: 'printalmatest123'
      })
    });

    console.log('Status:', loginResponse.status);
    const loginData = await loginResponse.json();
    console.log('Response structure:', JSON.stringify(loginData, null, 2));

    if (loginData.access_token) {
      console.log('Token found:', loginData.access_token.substring(0, 50) + '...');
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkLogin();