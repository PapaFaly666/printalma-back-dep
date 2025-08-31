const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000';
let authToken = '';

// Fonction utilitaire pour les requêtes authentifiées
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        ...(authToken && { 'Authorization': `Bearer ${authToken}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ Erreur ${method} ${endpoint}:`, error.response?.data || error.message);
    throw error;
  }
};

// Tests de la fonctionnalité image de couleur
async function testColorImageFunctionality() {
  console.log('🚀 Test de la fonctionnalité Images de Couleur dans les Commandes\n');

  try {
    // 1. Connexion
    console.log('1️⃣ Connexion en tant qu\'admin...');
    const loginResponse = await apiCall('POST', '/auth/login', {
      email: 'admin@printalma.com',
      password: 'Admin123!'
    });
    authToken = loginResponse.token || loginResponse.access_token;
    console.log('✅ Connexion réussie\n');

    // 2. Récupération des produits avec couleurs
    console.log('2️⃣ Récupération des produits avec couleurs...');
    const products = await apiCall('GET', '/products');
    
    if (!products || products.length === 0) {
      console.log('❌ Aucun produit trouvé');
      return;
    }

    const productWithColors = products.find(p => p.colors && p.colors.length > 0);
    if (!productWithColors) {
      console.log('❌ Aucun produit avec couleurs trouvé');
      return;
    }

    console.log(`✅ Produit trouvé: ${productWithColors.name}`);
    console.log(`   Couleurs disponibles: ${productWithColors.colors.length}`);
    productWithColors.colors.forEach(color => {
      console.log(`   - ${color.name} (ID: ${color.id}) - Image: ${color.imageUrl}`);
    });
    console.log('');

    // 3. Test de création de commande avec colorId (nouveau système)
    console.log('3️⃣ Test de création de commande avec colorId...');
    const selectedColor = productWithColors.colors[0];
    
    const orderWithColorId = {
      shippingDetails: {
        firstName: "Test",
        lastName: "ColorImage",
        street: "123 Rue du Test",
        city: "Paris",
        postalCode: "75001",
        country: "France"
      },
      phoneNumber: "+33123456789",
      notes: "Test commande avec colorId",
      orderItems: [
        {
          productId: productWithColors.id,
          quantity: 1,
          size: "M",
          colorId: selectedColor.id, // 🆕 Nouveau système
          color: selectedColor.name  // Garde pour compatibilité
        }
      ]
    };

    const createdOrder = await apiCall('POST', '/orders', orderWithColorId);
    console.log(`✅ Commande créée: ${createdOrder.orderNumber}`);
    
    // Vérification des données de couleur dans la réponse
    const orderItem = createdOrder.orderItems[0];
    console.log('   Données de couleur dans la réponse:');
    console.log(`   - color (legacy): ${orderItem.color}`);
    console.log(`   - orderedColorName: ${orderItem.product.orderedColorName}`);
    console.log(`   - orderedColorHexCode: ${orderItem.product.orderedColorHexCode}`);
    console.log(`   - orderedColorImageUrl: ${orderItem.product.orderedColorImageUrl}`);
    
    if (orderItem.product.orderedColorImageUrl) {
      console.log('✅ Image de couleur présente dans la réponse');
    } else {
      console.log('❌ Image de couleur manquante');
    }
    console.log('');

    // 4. Test de récupération de la commande
    console.log('4️⃣ Test de récupération de la commande...');
    const retrievedOrder = await apiCall('GET', `/orders/${createdOrder.id}`);
    
    const retrievedItem = retrievedOrder.orderItems[0];
    console.log('   Données de couleur après récupération:');
    console.log(`   - orderedColorName: ${retrievedItem.product.orderedColorName}`);
    console.log(`   - orderedColorImageUrl: ${retrievedItem.product.orderedColorImageUrl}`);
    
    if (retrievedItem.product.orderedColorImageUrl === orderItem.product.orderedColorImageUrl) {
      console.log('✅ Cohérence des données de couleur confirmée');
    } else {
      console.log('❌ Incohérence dans les données de couleur');
    }
    console.log('');

    // 5. Test de compatibilité backward (ancien système)
    console.log('5️⃣ Test de compatibilité backward (color string)...');
    const orderWithColorString = {
      shippingDetails: {
        firstName: "Test",
        lastName: "Backward",
        street: "123 Rue Backward",
        city: "Paris", 
        postalCode: "75001",
        country: "France"
      },
      phoneNumber: "+33123456789",
      notes: "Test compatibilité backward",
      orderItems: [
        {
          productId: productWithColors.id,
          quantity: 1,
          size: "L",
          color: selectedColor.name // Ancien système (string seulement)
          // Pas de colorId
        }
      ]
    };

    const backwardOrder = await apiCall('POST', '/orders', orderWithColorString);
    console.log(`✅ Commande backward créée: ${backwardOrder.orderNumber}`);
    
    const backwardItem = backwardOrder.orderItems[0];
    console.log('   Données de couleur (ancien système):');
    console.log(`   - color: ${backwardItem.color}`);
    console.log(`   - orderedColorName: ${backwardItem.product.orderedColorName}`);
    console.log(`   - orderedColorImageUrl: ${backwardItem.product.orderedColorImageUrl}`);
    
    if (backwardItem.product.orderedColorImageUrl) {
      console.log('✅ Image de couleur récupérée malgré l\'ancien système');
    } else {
      console.log('⚠️ Image de couleur non trouvée avec l\'ancien système');
    }
    console.log('');

    // 6. Test avec colorId invalide
    console.log('6️⃣ Test avec colorId invalide...');
    const orderWithInvalidColorId = {
      shippingDetails: {
        firstName: "Test",
        lastName: "Invalid",
        street: "123 Rue Invalid",
        city: "Paris",
        postalCode: "75001", 
        country: "France"
      },
      phoneNumber: "+33123456789",
      orderItems: [
        {
          productId: productWithColors.id,
          quantity: 1,
          size: "S",
          colorId: 99999 // ID invalide
        }
      ]
    };

    try {
      await apiCall('POST', '/orders', orderWithInvalidColorId);
      console.log('❌ L\'ordre avec colorId invalide n\'a pas été rejeté');
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('✅ Validation correcte: colorId invalide rejeté');
      } else {
        console.log('❌ Erreur inattendue:', error.response?.status);
      }
    }
    console.log('');

    // 7. Récapitulatif des commandes créées
    console.log('7️⃣ Récapitulatif des commandes créées...');
    const allOrders = await apiCall('GET', '/orders');
    
    const testOrders = allOrders.orders.filter(order => 
      order.notes && (order.notes.includes('Test') || order.notes.includes('colorId'))
    );
    
    console.log(`✅ ${testOrders.length} commandes de test trouvées:`);
    testOrders.forEach(order => {
      console.log(`   - ${order.orderNumber}: ${order.notes}`);
      order.orderItems.forEach(item => {
        const hasImage = item.product.orderedColorImageUrl ? '✅' : '❌';
        console.log(`     ${hasImage} ${item.product.name} - ${item.product.orderedColorName || 'N/A'}`);
      });
    });

  } catch (error) {
    console.error('❌ Erreur durante les tests:', error.message);
  }
}

// 🎯 Fonction pour tester la récupération des couleurs d'un produit
async function testProductColorsEndpoint() {
  console.log('\n🎨 Test de récupération des couleurs de produit...');
  
  try {
    const products = await apiCall('GET', '/products');
    
    if (products && products.length > 0) {
      const productId = products[0].id;
      const product = await apiCall('GET', `/products/${productId}`);
      
      console.log(`✅ Produit: ${product.name}`);
      console.log(`   Couleurs disponibles: ${product.colors?.length || 0}`);
      
      if (product.colors && product.colors.length > 0) {
        product.colors.forEach(color => {
          console.log(`   - ID: ${color.id}, Nom: ${color.name}, Image: ${color.imageUrl}`);
        });
        
        console.log('\n📋 Structure recommandée pour le frontend:');
        const frontendColors = product.colors.map(color => ({
          id: color.id,
          name: color.name,
          hexCode: color.hexCode,
          imageUrl: color.imageUrl
        }));
        console.log(JSON.stringify(frontendColors, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Erreur lors du test des couleurs:', error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🔬 Tests de la fonctionnalité Images de Couleur PrintAlma');
  console.log('=' .repeat(60));
  
  await testColorImageFunctionality();
  await testProductColorsEndpoint();
  
  console.log('\n' + '=' .repeat(60));
  console.log('✅ Tests terminés');
  console.log('\n📝 Points clés à retenir:');
  console.log('   1. Utilisez colorId pour garantir l\'image de couleur');
  console.log('   2. Le champ color (string) reste pour la compatibilité');
  console.log('   3. orderedColorImageUrl est présent dans les réponses');
  console.log('   4. La validation rejette les colorId invalides');
  console.log('   5. L\'ancien système fonctionne encore mais moins fiable');
}

// Gestion des erreurs globales
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Erreur non gérée:', reason);
  process.exit(1);
});

// Exécution
main().catch(console.error);

module.exports = {
  testColorImageFunctionality,
  testProductColorsEndpoint
}; 