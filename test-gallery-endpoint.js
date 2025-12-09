const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function testCreateGallery() {
  try {
    // D'abord, se connecter pour obtenir un token
    const loginResponse = await fetch('http://localhost:3004/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'vendor1@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('Login failed:', await loginResponse.text());
      return;
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('Token obtained:', token.substring(0, 50) + '...');

    // Créer des données de test pour le formulaire multipart
    const form = new FormData();
    form.append('title', 'Ma Galerie de Test');
    form.append('description', 'Ceci est une description de test pour ma galerie');

    // Créer 5 fichiers images de test
    for (let i = 1; i <= 5; i++) {
      const imageContent = Buffer.from(`fake-image-content-${i}`);
      form.append('images', imageContent, {
        filename: `test-image-${i}.jpg`,
        contentType: 'image/jpeg'
      });
    }

    // Envoyer la requête
    const response = await fetch(`http://localhost:3004/vendor/galleries`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...form.getHeaders()
      },
      body: form
    });

    console.log('Status:', response.status);
    console.log('Response:', await response.text());

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testCreateGallery();