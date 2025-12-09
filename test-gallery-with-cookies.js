const FormData = require('form-data');
const fetch = require('node-fetch');

async function testCreateGallery() {
  try {
    // Se connecter pour obtenir le cookie
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

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Cookies received:', cookies);

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    console.log('✅ Login successful');
    console.log('User:', loginData.user.email, '(ID:', loginData.user.id, ')');

    // Test 1: Créer une galerie sans images (devrait échouer en 400)
    console.log('\n--- Test 1: Création sans images ---');
    const form1 = new FormData();
    form1.append('title', 'Galerie Sans Images');
    form1.append('description', 'Test sans images');

    const response1 = await fetch(`http://localhost:3004/vendor/galleries`, {
      method: 'POST',
      headers: {
        'Cookie': cookies,
        ...form1.getHeaders()
      },
      body: form1
    });

    console.log('Status:', response1.status);
    const result1 = await response1.json();
    console.log('Response:', JSON.stringify(result1, null, 2));

    // Test 2: Créer une galerie avec 3 images (devrait échouer)
    console.log('\n--- Test 2: Création avec 3 images ---');
    const form2 = new FormData();
    form2.append('title', 'Galerie 3 Images');
    form2.append('description', 'Test avec 3 images');

    for (let i = 1; i <= 3; i++) {
      const imageContent = Buffer.from(`fake-image-content-${i}`);
      form2.append('images', imageContent, {
        filename: `test-image-${i}.jpg`,
        contentType: 'image/jpeg'
      });
    }

    const response2 = await fetch(`http://localhost:3004/vendor/galleries`, {
      method: 'POST',
      headers: {
        'Cookie': cookies,
        ...form2.getHeaders()
      },
      body: form2
    });

    console.log('Status:', response2.status);
    const result2 = await response2.json();
    console.log('Response:', JSON.stringify(result2, null, 2));

    // Test 3: Créer une galerie avec 5 images (devrait réussir)
    console.log('\n--- Test 3: Création avec 5 images ---');
    const form3 = new FormData();
    form3.append('title', 'Galerie Complète 5 Images');
    form3.append('description', 'Test avec 5 images - devrait réussir');

    for (let i = 1; i <= 5; i++) {
      const imageContent = Buffer.from(`fake-image-content-${i}`);
      form3.append('images', imageContent, {
        filename: `test-image-${i}.jpg`,
        contentType: 'image/jpeg'
      });
    }

    const response3 = await fetch(`http://localhost:3004/vendor/galleries`, {
      method: 'POST',
      headers: {
        'Cookie': cookies,
        ...form3.getHeaders()
      },
      body: form3
    });

    console.log('Status:', response3.status);
    const result3 = await response3.json();
    console.log('Response:', JSON.stringify(result3, null, 2));

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testCreateGallery();