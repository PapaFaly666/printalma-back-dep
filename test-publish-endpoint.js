#!/usr/bin/env node

/**
 * 🧪 TEST ENDPOINT - PATCH /vendor/products/:id/publish
 * Script de test pour vérifier que l'endpoint de publication existe et fonctionne
 */

const http = require('http');

console.log('🧪 Test de l\'endpoint de publication produit vendeur');
console.log('==================================================');

// Test sans authentification (devrait retourner 401)
const testOptions = {
  hostname: 'localhost',
  port: 3004,
  path: '/vendor/products/122/publish',
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('📡 Test de l\'endpoint PATCH /vendor/products/122/publish...');

const req = http.request(testOptions, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📄 Réponse:');
    try {
      const jsonResponse = JSON.parse(data);
      console.log(JSON.stringify(jsonResponse, null, 2));
    } catch (e) {
      console.log('📄 Réponse brute:', data);
    }
    
    if (res.statusCode === 401) {
      console.log('✅ Test réussi ! L\'endpoint existe et demande une authentification');
    } else if (res.statusCode === 404) {
      console.log('❌ L\'endpoint n\'existe pas (404 Not Found)');
    } else {
      console.log(`⚠️  Statut inattendu: ${res.statusCode}`);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erreur de connexion:', e.message);
  console.log('💡 Assurez-vous que le serveur est démarré sur le port 3004');
});

req.end();