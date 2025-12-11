// Test script pour valider le calcul des gains du vendeur
console.log('📊 Test de calcul des gains du vendeur');

// Simulation des données
const orderItemTotal = 9000; // Prix de vente total
const baseCostPerUnit = 6300; // Prix de revient par unité (70% du prix de base du produit)
const quantity = 1;
const totalBaseCost = baseCostPerUnit * quantity;

// Ancien calcul (incorrect)
const oldVendorAmount = orderItemTotal - (orderItemTotal * 0.30); // 6300
console.log('🔴 Ancien calcul (vendorAmount après commission):', oldVendorAmount);

// Nouveau calcul (correct)
const vendorProfit = orderItemTotal - totalBaseCost; // 9000 - 6300 = 2700
console.log('✅ Nouveau calcul (prix vente - prix revient):', vendorProfit);

console.log('\n📈 Résumé:');
console.log('- Prix de vente:', orderItemTotal, 'FCFA');
console.log('- Prix de revient:', totalBaseCost, 'FCFA');
console.log('- Gain du vendeur (marge):', vendorProfit, 'FCFA');
console.log('- Taux de marge:', ((vendorProfit / orderItemTotal) * 100).toFixed(2) + '%');