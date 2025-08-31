const axios = require('axios');

const API_BASE_URL = 'http://localhost:3004';

async function testDesignUrlMockupUrlFix() {
  console.log('🧪 === TEST CORRECTION DESIGNURL ET MOCKUPURL ===\n');

  try {
    // 1. Test GET pour voir l'état actuel
    console.log('📋 1. VÉRIFICATION ÉTAT ACTUEL DES PRODUITS');
    const getResponse = await axios.get(`${API_BASE_URL}/vendor/products?limit=5&offset=0&status=all`);
    
    if (getResponse.data.success && getResponse.data.data.products.length > 0) {
      console.log(`✅ ${getResponse.data.data.products.length} produits récupérés\n`);
      
      getResponse.data.data.products.forEach((product, index) => {
        console.log(`🏷️  PRODUIT ${product.id}: "${product.vendorName}"`);
        console.log(`   Type: ${product.baseProduct.name}`);
        console.log(`   DesignUrl: ${product.designUrl ? product.designUrl.substring(0, 60) + '...' : 'NULL'}`);
        console.log(`   MockupUrl: ${product.mockupUrl ? product.mockupUrl.substring(0, 60) + '...' : 'NULL'}`);
        console.log(`   OriginalDesignUrl: ${product.originalDesignUrl ? product.originalDesignUrl.substring(0, 60) + '...' : 'NULL'}`);
        
        // Analyser la logique
        const hasDesignUrl = !!product.designUrl;
        const hasMockupUrl = !!product.mockupUrl;
        const hasOriginalDesignUrl = !!product.originalDesignUrl;
        
        console.log(`   📊 Analyse:`);
        console.log(`      - DesignUrl présent: ${hasDesignUrl ? '✅' : '❌'}`);
        console.log(`      - MockupUrl présent: ${hasMockupUrl ? '✅' : '❌'}`);
        console.log(`      - OriginalDesignUrl présent: ${hasOriginalDesignUrl ? '✅' : '❌'}`);
        
        // Vérifier la logique attendue
        if (hasOriginalDesignUrl) {
          const designUrlCorrect = product.designUrl === product.originalDesignUrl;
          const mockupUrlDifferent = product.mockupUrl !== product.designUrl;
          
          console.log(`      - DesignUrl = OriginalDesignUrl: ${designUrlCorrect ? '✅' : '❌'}`);
          console.log(`      - MockupUrl ≠ DesignUrl: ${mockupUrlDifferent ? '✅' : '❌'}`);
          
          if (designUrlCorrect && mockupUrlDifferent) {
            console.log(`      🎉 LOGIQUE CORRECTE !`);
          } else {
            console.log(`      ⚠️ Logique à vérifier`);
          }
        } else {
          // Cas où pas d'original design URL
          if (hasDesignUrl && hasMockupUrl) {
            console.log(`      📝 Pas d'original, mais designUrl et mockupUrl présents`);
          } else {
            console.log(`      ⚠️ Données incomplètes`);
          }
        }
        
        console.log(''); // Ligne vide
      });
    } else {
      console.log('❌ Aucun produit trouvé ou erreur API');
      return;
    }

    // 2. Analyser les patterns d'URLs
    console.log('📊 2. ANALYSE DES PATTERNS D\'URLS');
    const products = getResponse.data.data.products;
    
    const urlPatterns = {
      designUrls: new Set(),
      mockupUrls: new Set(),
      originalDesignUrls: new Set()
    };
    
    products.forEach(product => {
      if (product.designUrl) {
        const pattern = extractUrlPattern(product.designUrl);
        urlPatterns.designUrls.add(pattern);
      }
      if (product.mockupUrl) {
        const pattern = extractUrlPattern(product.mockupUrl);
        urlPatterns.mockupUrls.add(pattern);
      }
      if (product.originalDesignUrl) {
        const pattern = extractUrlPattern(product.originalDesignUrl);
        urlPatterns.originalDesignUrls.add(pattern);
      }
    });
    
    console.log('🎨 Patterns DesignUrl:');
    Array.from(urlPatterns.designUrls).forEach(pattern => {
      console.log(`   - ${pattern}`);
    });
    
    console.log('🖼️ Patterns MockupUrl:');
    Array.from(urlPatterns.mockupUrls).forEach(pattern => {
      console.log(`   - ${pattern}`);
    });
    
    console.log('📄 Patterns OriginalDesignUrl:');
    Array.from(urlPatterns.originalDesignUrls).forEach(pattern => {
      console.log(`   - ${pattern}`);
    });

    // 3. Vérifier la cohérence globale
    console.log('\n📋 3. VÉRIFICATION COHÉRENCE GLOBALE');
    
    let correctProducts = 0;
    let incorrectProducts = 0;
    
    products.forEach(product => {
      const hasOriginal = !!product.originalDesignUrl;
      const designEqualsOriginal = product.designUrl === product.originalDesignUrl;
      const mockupDifferentFromDesign = product.mockupUrl !== product.designUrl;
      
      if (hasOriginal) {
        if (designEqualsOriginal && mockupDifferentFromDesign) {
          correctProducts++;
        } else {
          incorrectProducts++;
          console.log(`⚠️ Produit ${product.id} "${product.vendorName}": logique incorrecte`);
        }
      } else {
        // Pour les produits sans originalDesignUrl, vérifier au moins que designUrl et mockupUrl existent
        if (product.designUrl && product.mockupUrl) {
          correctProducts++;
        } else {
          incorrectProducts++;
          console.log(`⚠️ Produit ${product.id} "${product.vendorName}": URLs manquantes`);
        }
      }
    });
    
    console.log(`\n📊 RÉSULTATS:`);
    console.log(`✅ Produits avec logique correcte: ${correctProducts}`);
    console.log(`❌ Produits avec logique incorrecte: ${incorrectProducts}`);
    console.log(`📈 Pourcentage de succès: ${Math.round((correctProducts / products.length) * 100)}%`);
    
    if (incorrectProducts === 0) {
      console.log(`\n🎉 TOUS LES PRODUITS ONT LA LOGIQUE CORRECTE !`);
    } else {
      console.log(`\n⚠️ ${incorrectProducts} produits nécessitent une correction`);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.data || error.message);
  }
}

function extractUrlPattern(url) {
  if (!url) return 'NULL';
  
  try {
    // Extraire le pattern principal de l'URL Cloudinary
    const parts = url.split('/');
    if (parts.includes('cloudinary.com')) {
      const cloudinaryIndex = parts.findIndex(part => part.includes('cloudinary.com'));
      const relevantParts = parts.slice(cloudinaryIndex + 1);
      
      // Remplacer les timestamps et IDs par des placeholders
      const pattern = relevantParts.map(part => {
        if (part.match(/^\d+$/)) return '[TIMESTAMP]';
        if (part.match(/vendor_\d+_/)) return '[VENDOR_ID]';
        if (part.match(/design_original_\d+/)) return '[DESIGN_ORIGINAL]';
        return part;
      }).join('/');
      
      return pattern;
    }
    
    return 'UNKNOWN_PATTERN';
  } catch (error) {
    return 'PARSE_ERROR';
  }
}

// Exécution
if (require.main === module) {
  testDesignUrlMockupUrlFix().catch(console.error);
}

module.exports = { testDesignUrlMockupUrlFix }; 
 
 
 
 
 
 
 
 
 
 
 