const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testCreateGallery() {
  try {
    // Se connecter avec les identifiants du vendeur
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

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✅ Login successful');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test 1: Créer une galerie sans images (devrait échouer)
    console.log('\n--- Test 1: Création sans images ---');
    const form1 = new FormData();
    form1.append('title', 'Galerie Test Sans Images');
    form1.append('description', 'Cette galerie devrait échouer');

    const response1 = await fetch(`http://localhost:3004/vendor/galleries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form1.getHeaders()
      },
      body: form1
    });

    console.log('Status:', response1.status);
    console.log('Response:', await response1.text());

    // Test 2: Créer une galerie avec moins de 5 images
    console.log('\n--- Test 2: Création avec 2 images ---');
    const form2 = new FormData();
    form2.append('title', 'Galerie Test 2 Images');
    form2.append('description', 'Cette galerie a 2 images');

    // Créer 2 fichiers images de test
    for (let i = 1; i <= 2; i++) {
      const imageContent = Buffer.from(`fake-image-content-${i}`);
      form2.append('images', imageContent, {
        filename: `test-image-${i}.jpg`,
        contentType: 'image/jpeg'
      });
    }

    const response2 = await fetch(`http://localhost:3004/vendor/galleries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form2.getHeaders()
      },
      body: form2
    });

    console.log('Status:', response2.status);
    console.log('Response:', await response2.text());

    // Test 3: Créer une galerie avec exactement 5 images
    console.log('\n--- Test 3: Création avec 5 images ---');
    const form3 = new FormData();
    form3.append('title', 'Galerie Test Complète');
    form3.append('description', 'Cette galerie a 5 images, devrait réussir');

    // Créer 5 fichiers images de test
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
        'Authorization': `Bearer ${token}`,
        ...form3.getHeaders()
      },
      body: form3
    });

    console.log('Status:', response3.status);
    const responseText3 = await response3.text();
    console.log('Response:', responseText3);

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

testCreateGallery();