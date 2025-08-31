/**
 * 🧪 TEST: Vérification de la correction du stockage des transformations lors de la création de produit vendeur
 * 
 * Ce test vérifie que quand un vendeur crée un produit, les informations de transformation
 * (x, y, designWidth, designHeight, scale, rotation) sont bien stockées dans la base de données.
 */

const API_BASE_URL = 'http://localhost:3004';

class VendorProductCreationTest {
  constructor() {
    this.authToken = null;
    this.vendorId = null;
    this.designId = null;
    this.baseProductId = 1; // Assumons qu'il y a un produit de base avec ID 1
  }

  async login() {
    console.log('🔐 Connexion vendeur...');
    
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'vendor@test.com',
        password: 'password123'
      })
    });

    if (!response.ok) {
      throw new Error(`Erreur login: ${response.status}`);
    }

    const data = await response.json();
    this.authToken = data.accessToken;
    this.vendorId = data.user.id;
    
    console.log(`✅ Connecté en tant que vendeur ${this.vendorId}`);
    return data;
  }

  async createDesign() {
    console.log('🎨 Création d\'un design de test...');
    
    // Créer une image de test en base64 (petit carré rouge)
    const testImageBase64 = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAGAWA0ddgAAAABJRU5ErkJggg==';
    
    const response = await fetch(`${API_BASE_URL}/vendor/designs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify({
        name: 'Test Design pour Transformation',
        description: 'Design créé pour tester le stockage des transformations',
        category: 'ILLUSTRATION',
        imageBase64: testImageBase64,
        tags: ['test', 'transformation']
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur création design: ${response.status} - ${error}`);
    }

    const data = await response.json();
    this.designId = data.designId;
    
    console.log(`✅ Design créé avec ID: ${this.designId}`);
    console.log(`📸 URL du design: ${data.designUrl}`);
    
    return data;
  }

  async createVendorProductWithTransforms() {
    console.log('📦 Création produit vendeur avec informations de transformation...');
    
    // Données de position avec toutes les informations de transformation
    const designPosition = {
      x: -44,
      y: -68,
      scale: 0.75,
      rotation: 15,
      design_width: 350,
      design_height: 280,
      constraints: {
        minScale: 0.1,
        maxScale: 2.0,
        bounds: { x: -100, y: -100, width: 200, height: 200 }
      }
    };

    const productData = {
      baseProductId: this.baseProductId,
      designId: this.designId,
      vendorName: 'T-shirt Test avec Transformations',
      vendorDescription: 'Produit créé pour tester le stockage des transformations (x, y, designWidth, designHeight)',
      vendorPrice: 25000,
      vendorStock: 50,
      selectedColors: [
        { id: 1, name: 'Blanc', colorCode: '#FFFFFF' }
      ],
      selectedSizes: [
        { id: 1, sizeName: 'M' },
        { id: 2, sizeName: 'L' }
      ],
      productStructure: {
        adminProduct: {
          id: this.baseProductId,
          name: 'T-shirt Basique',
          description: 'T-shirt en coton 100%',
          price: 19000,
          images: {
            colorVariations: [
              {
                id: 1,
                name: 'Blanc',
                colorCode: '#FFFFFF',
                images: [
                  {
                    id: 1,
                    url: 'https://res.cloudinary.com/dsxab4qnu/image/upload/v1736418923/tshirt-blanc-front.jpg',
                    viewType: 'FRONT',
                    delimitations: [
                      { x: 150, y: 200, width: 200, height: 200, coordinateType: 'ABSOLUTE' }
                    ]
                  }
                ]
              }
            ]
          },
          sizes: [
            { id: 1, sizeName: 'M' },
            { id: 2, sizeName: 'L' }
          ]
        },
        designApplication: {
          positioning: 'CENTER',
          scale: 0.6
        }
      },
      designPosition: designPosition, // 🎯 INFORMATIONS DE TRANSFORMATION
      postValidationAction: 'AUTO_PUBLISH'
    };

    console.log('📊 Données de transformation envoyées:', designPosition);

    const response = await fetch(`${API_BASE_URL}/vendor/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Erreur création produit: ${response.status} - ${error}`);
    }

    const data = await response.json();
    console.log(`✅ Produit vendeur créé avec ID: ${data.productId}`);
    
    return data;
  }

  async verifyTransformStorage(productId) {
    console.log('🔍 Vérification du stockage des transformations...');
    
    // 1. Vérifier dans VendorProduct (designWidth, designHeight)
    const productResponse = await fetch(`${API_BASE_URL}/vendor/products/${productId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    if (!productResponse.ok) {
      throw new Error(`Erreur récupération produit: ${productResponse.status}`);
    }

    const productData = await productResponse.json();
    console.log('📦 Données du produit vendeur:', {
      id: productData.id,
      name: productData.name,
      designWidth: productData.designWidth,
      designHeight: productData.designHeight,
      designScale: productData.designScale
    });

    // 2. Vérifier dans ProductDesignPosition (x, y, scale, rotation)
    const positionResponse = await fetch(`${API_BASE_URL}/vendor/design-position/${productId}/${this.designId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.authToken}`
      }
    });

    let positionData = null;
    if (positionResponse.ok) {
      positionData = await positionResponse.json();
      console.log('📍 Données de position stockées:', positionData);
    } else {
      console.log('⚠️ Aucune position trouvée dans ProductDesignPosition');
    }

    // 3. Analyser les résultats
    const results = {
      vendorProduct: {
        hasDesignWidth: !!productData.designWidth,
        hasDesignHeight: !!productData.designHeight,
        designWidth: productData.designWidth,
        designHeight: productData.designHeight
      },
      designPosition: {
        found: !!positionData,
        position: positionData?.position
      }
    };

    console.log('\n📊 RÉSULTATS DE LA VÉRIFICATION:');
    console.log('================================');
    
    if (results.vendorProduct.hasDesignWidth && results.vendorProduct.hasDesignHeight) {
      console.log('✅ designWidth et designHeight stockés dans VendorProduct');
      console.log(`   - designWidth: ${results.vendorProduct.designWidth}px`);
      console.log(`   - designHeight: ${results.vendorProduct.designHeight}px`);
    } else {
      console.log('❌ designWidth et designHeight MANQUANTS dans VendorProduct');
    }

    if (results.designPosition.found) {
      console.log('✅ Position stockée dans ProductDesignPosition');
      console.log(`   - x: ${results.designPosition.position.x}`);
      console.log(`   - y: ${results.designPosition.position.y}`);
      console.log(`   - scale: ${results.designPosition.position.scale}`);
      console.log(`   - rotation: ${results.designPosition.position.rotation}`);
    } else {
      console.log('❌ Position MANQUANTE dans ProductDesignPosition');
    }

    const isFixed = results.vendorProduct.hasDesignWidth && 
                   results.vendorProduct.hasDesignHeight && 
                   results.designPosition.found;

    console.log('\n🎯 STATUT DE LA CORRECTION:');
    console.log(isFixed ? '✅ CORRIGÉ: Les transformations sont bien stockées!' : '❌ PROBLÈME PERSISTE: Les transformations ne sont pas stockées correctement');

    return results;
  }

  async runTest() {
    try {
      console.log('🧪 DÉBUT DU TEST DE CORRECTION DES TRANSFORMATIONS');
      console.log('===================================================\n');

      // 1. Se connecter
      await this.login();

      // 2. Créer un design
      await this.createDesign();

      // 3. Créer un produit avec transformations
      const productResult = await this.createVendorProductWithTransforms();

      // 4. Vérifier le stockage
      await this.verifyTransformStorage(productResult.productId);

      console.log('\n🎉 Test terminé avec succès!');

    } catch (error) {
      console.error('\n❌ Erreur pendant le test:', error.message);
      throw error;
    }
  }
}

// Exécuter le test
if (require.main === module) {
  const test = new VendorProductCreationTest();
  test.runTest()
    .then(() => {
      console.log('\n✅ Test de correction des transformations terminé');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test échoué:', error);
      process.exit(1);
    });
}

module.exports = VendorProductCreationTest; 