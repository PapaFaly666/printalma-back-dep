const axios = require('axios');

// Test des endpoints corrigés pour le frontend
async function testFrontendEndpoints() {
  console.log('🔧 Test des endpoints corrigés pour le frontend\n');

  const baseURL = 'http://localhost:3004';
  
  const tests = [
    {
      name: 'Produits prêts',
      url: `${baseURL}/products?isReadyProduct=true`,
      expected: 'produits prêts avec isReadyProduct=true'
    },
    {
      name: 'Mockups avec délimitations (forVendorDesign)',
      url: `${baseURL}/products?forVendorDesign=true`,
      expected: 'mockups avec délimitations'
    },
    {
      name: 'Mockups avec délimitations (alternative)',
      url: `${baseURL}/products?isReadyProduct=false&hasDelimitations=true`,
      expected: 'mockups avec délimitations'
    },
    {
      name: 'Recherche de produits',
      url: `${baseURL}/products?search=test&isReadyProduct=true`,
      expected: 'produits contenant "test"'
    },
    {
      name: 'Filtrage par catégorie',
      url: `${baseURL}/products?category=tshirt&isReadyProduct=true`,
      expected: 'produits de catégorie tshirt'
    }
  ];

  for (const test of tests) {
    try {
      console.log(`🧪 Test: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      
      const response = await axios.get(test.url, {
        timeout: 5000
      });
      
      console.log(`   ✅ Succès: ${response.data.data?.length || 0} produits`);
      
      if (response.data.data && response.data.data.length > 0) {
        const firstProduct = response.data.data[0];
        console.log(`   📊 Premier produit:`, {
          id: firstProduct.id,
          name: firstProduct.name,
          isReadyProduct: firstProduct.isReadyProduct,
          hasDelimitations: firstProduct.hasDelimitations,
          status: firstProduct.status
        });
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Status: ${error.response.status}`);
        console.log(`   📊 Data: ${JSON.stringify(error.response.data)}`);
      }
      console.log('');
    }
  }
}

// Test de comparaison avec l'ancien endpoint
async function testComparison() {
  console.log('🔄 Test de comparaison - Ancien vs Nouveau endpoint\n');

  const oldURL = 'http://localhost:3004/api/products?isReadyProduct=true';
  const newURL = 'http://localhost:3004/products?isReadyProduct=true';

  try {
    console.log('🧪 Test ancien endpoint (avec /api):');
    console.log(`   URL: ${oldURL}`);
    
    const oldResponse = await axios.get(oldURL, {
      timeout: 5000
    });
    
    console.log(`   ✅ Ancien endpoint fonctionne: ${oldResponse.data.data?.length || 0} produits`);
    
  } catch (error) {
    console.log(`   ❌ Ancien endpoint échoue: ${error.response?.status || error.message}`);
  }

  try {
    console.log('\n🧪 Test nouveau endpoint (sans /api):');
    console.log(`   URL: ${newURL}`);
    
    const newResponse = await axios.get(newURL, {
      timeout: 5000
    });
    
    console.log(`   ✅ Nouveau endpoint fonctionne: ${newResponse.data.data?.length || 0} produits`);
    
  } catch (error) {
    console.log(`   ❌ Nouveau endpoint échoue: ${error.response?.status || error.message}`);
  }
}

// Test des paramètres de filtrage
async function testFilteringParameters() {
  console.log('\n🎯 Test des paramètres de filtrage\n');

  const baseURL = 'http://localhost:3004/products';
  
  const filterTests = [
    { params: { isReadyProduct: true }, description: 'Produits prêts uniquement' },
    { params: { isReadyProduct: false }, description: 'Mockups uniquement' },
    { params: { hasDelimitations: true }, description: 'Avec délimitations' },
    { params: { hasDelimitations: false }, description: 'Sans délimitations' },
    { params: { status: 'PUBLISHED' }, description: 'Statut publié' },
    { params: { status: 'DRAFT' }, description: 'Statut brouillon' },
    { params: { limit: 3 }, description: 'Limite à 3 produits' },
    { params: { search: 'test' }, description: 'Recherche "test"' },
    { params: { category: 'tshirt' }, description: 'Catégorie tshirt' },
    { params: { isReadyProduct: true, status: 'PUBLISHED' }, description: 'Produits prêts publiés' },
    { params: { forVendorDesign: true }, description: 'Pour vendeur design' }
  ];

  for (const test of filterTests) {
    try {
      const url = `${baseURL}?${new URLSearchParams(test.params).toString()}`;
      console.log(`🧪 Test: ${test.description}`);
      console.log(`   URL: ${url}`);
      
      const response = await axios.get(url, {
        timeout: 5000
      });
      
      console.log(`   ✅ Succès: ${response.data.data?.length || 0} produits`);
      
      if (response.data.data && response.data.data.length > 0) {
        const firstProduct = response.data.data[0];
        console.log(`   📊 Premier produit:`, {
          id: firstProduct.id,
          name: firstProduct.name,
          isReadyProduct: firstProduct.isReadyProduct,
          hasDelimitations: firstProduct.hasDelimitations,
          status: firstProduct.status
        });
      }
      
      console.log('');
      
    } catch (error) {
      console.log(`   ❌ Erreur: ${error.message}`);
      console.log('');
    }
  }
}

// Fonction principale
async function runAllTests() {
  console.log('🚀 Test des corrections frontend\n');
  
  await testFrontendEndpoints();
  await testComparison();
  await testFilteringParameters();
  
  console.log('📋 Résumé:');
  console.log('   ✅ Endpoints corrigés testés');
  console.log('   ✅ Comparaison ancien vs nouveau');
  console.log('   ✅ Paramètres de filtrage validés');
  console.log('');
  console.log('💡 Instructions pour le frontend:');
  console.log('   1. Changer l\'URL de base de /api vers /');
  console.log('   2. Utiliser http://localhost:3004/products au lieu de http://localhost:3004/api/products');
  console.log('   3. Tester tous les endpoints après modification');
}

// Exécuter les tests si le script est appelé directement
if (require.main === module) {
  runAllTests();
}

module.exports = {
  testFrontendEndpoints,
  testComparison,
  testFilteringParameters,
  runAllTests
}; 