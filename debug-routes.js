#!/usr/bin/env node

/**
 * 🔍 DIAGNOSTIC ROUTES - Vérification des routes disponibles
 */

const http = require('http');

const routes = [
  { path: '/vendor/products', method: 'GET', desc: 'Liste des produits vendeur' },
  { path: '/vendor/products/122', method: 'GET', desc: 'Détail produit vendeur' },
  { path: '/vendor/products/122/publish', method: 'PATCH', desc: 'Publication produit (RECHERCHÉ)' },
  { path: '/vendor/health', method: 'GET', desc: 'Health check' },
  { path: '/', method: 'GET', desc: 'Route racine' },
  { path: '/api-docs', method: 'GET', desc: 'Documentation Swagger' }
];

console.log('🔍 === DIAGNOSTIC DES ROUTES ===\n');

async function testRoute(route) {
  return new Promise((resolve) => {
    const req = http.request({
      host: 'localhost',
      port: 3004,
      path: route.path,
      method: route.method,
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      resolve({
        ...route,
        status: res.statusCode,
        available: res.statusCode !== 404
      });
    });
    
    req.on('error', () => {
      resolve({
        ...route,
        status: 'ERROR',
        available: false
      });
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      resolve({
        ...route,
        status: 'TIMEOUT',
        available: false
      });
    });
    
    req.end();
  });
}

async function diagnoseProblem() {
  console.log('⏳ Test des routes...\n');
  
  for (const route of routes) {
    const result = await testRoute(route);
    const icon = result.available ? '✅' : '❌';
    const status = result.status === 'ERROR' ? 'SERVEUR OFF' : result.status;
    
    console.log(`${icon} ${result.method.padEnd(5)} ${result.path.padEnd(35)} [${status}] ${result.desc}`);
    
    if (result.status === 'ERROR') {
      console.log('\n❌ SERVEUR NON ACCESSIBLE');
      console.log('🔧 Vérifications nécessaires:');
      console.log('   1. Le serveur est-il démarré? npm run start:dev');
      console.log('   2. Le serveur écoute-t-il sur le port 3004?');
      console.log('   3. Y a-t-il des erreurs de compilation?');
      return;
    }
  }
  
  console.log('\n📊 RÉSUMÉ:');
  const available = routes.filter(r => r.path === '/vendor/products/122/publish')[0];
  if (available) {
    console.log('✅ Endpoint trouvé - Problème résolu!');
  } else {
    console.log('❌ Endpoint /vendor/products/122/publish toujours manquant');
    console.log('');
    console.log('🔧 Actions à vérifier:');
    console.log('   1. Le contrôleur VendorPublishController contient-il @Patch(\'products/:id/publish\')?');
    console.log('   2. Le module VendorProductModule exporte-t-il le contrôleur?');
    console.log('   3. AppModule importe-t-il VendorProductModule?');
    console.log('   4. Le serveur a-t-il été redémarré après les modifications?');
  }
}

// Attendre un peu avant de tester
setTimeout(diagnoseProblem, 1000);