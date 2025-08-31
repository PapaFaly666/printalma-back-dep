const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkDesignUrlMockupUrl() {
  console.log('🔍 === VÉRIFICATION DIRECTE DESIGNURL ET MOCKUPURL ===\n');

  try {
    // Récupérer les produits récents avec leurs données
    const products = await prisma.vendorProduct.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        vendorName: true,
        designUrl: true,
        mockupUrl: true,
        originalDesignUrl: true,
        createdAt: true,
        baseProduct: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`📊 ${products.length} produits trouvés\n`);

    products.forEach((product, index) => {
      console.log(`🏷️  PRODUIT ${product.id}: "${product.vendorName}"`);
      console.log(`   Type: ${product.baseProduct.name}`);
      console.log(`   Créé le: ${product.createdAt.toLocaleString()}`);
      console.log(`   DesignUrl: ${product.designUrl ? product.designUrl.substring(0, 70) + '...' : 'NULL'}`);
      console.log(`   MockupUrl: ${product.mockupUrl ? product.mockupUrl.substring(0, 70) + '...' : 'NULL'}`);
      console.log(`   OriginalDesignUrl: ${product.originalDesignUrl ? product.originalDesignUrl.substring(0, 70) + '...' : 'NULL'}`);
      
      // Analyser la logique
      const hasDesignUrl = !!product.designUrl;
      const hasMockupUrl = !!product.mockupUrl;
      const hasOriginalDesignUrl = !!product.originalDesignUrl;
      
      console.log(`\n   📊 ANALYSE:`);
      console.log(`      ✅ DesignUrl présent: ${hasDesignUrl}`);
      console.log(`      ✅ MockupUrl présent: ${hasMockupUrl}`);
      console.log(`      ✅ OriginalDesignUrl présent: ${hasOriginalDesignUrl}`);
      
      // Test logique attendue APRÈS correction
      if (hasOriginalDesignUrl) {
        const designEqualsOriginal = product.designUrl === product.originalDesignUrl;
        const mockupIsDifferent = product.mockupUrl !== product.designUrl;
        
        console.log(`      📝 DesignUrl = OriginalDesignUrl: ${designEqualsOriginal ? '✅ CORRECT' : '❌ INCORRECT'}`);
        console.log(`      📝 MockupUrl ≠ DesignUrl: ${mockupIsDifferent ? '✅ CORRECT' : '❌ INCORRECT'}`);
        
        if (designEqualsOriginal && mockupIsDifferent && hasMockupUrl) {
          console.log(`      🎉 LOGIQUE POST-CORRECTION PARFAITE !`);
        } else {
          console.log(`      ⚠️ Logique post-correction à vérifier`);
          
          // Diagnostic détaillé
          if (!designEqualsOriginal) {
            console.log(`         💡 Problème: designUrl devrait être égal à originalDesignUrl`);
          }
          if (!mockupIsDifferent) {
            console.log(`         💡 Problème: mockupUrl devrait être différent de designUrl`);
          }
          if (!hasMockupUrl) {
            console.log(`         💡 Problème: mockupUrl est NULL`);
          }
        }
      } else {
        // Cas sans originalDesignUrl
        if (hasDesignUrl && hasMockupUrl) {
          const urlsAreDifferent = product.designUrl !== product.mockupUrl;
          console.log(`      📝 URLs différentes: ${urlsAreDifferent ? '✅ BIEN' : '⚠️ IDENTIQUES'}`);
          
          if (urlsAreDifferent) {
            console.log(`      📝 Logique correcte (pas d'original, mais URLs distinctes)`);
          } else {
            console.log(`      ⚠️ URLs identiques - mode fallback`);
          }
        } else {
          console.log(`      ❌ URLs manquantes`);
        }
      }
      
      // Extraire les patterns des URLs pour identification
      console.log(`\n   🔍 PATTERNS D'URLS:`);
      if (product.designUrl) {
        const designPattern = extractPattern(product.designUrl);
        console.log(`      Design: ${designPattern}`);
      }
      if (product.mockupUrl) {
        const mockupPattern = extractPattern(product.mockupUrl);
        console.log(`      Mockup: ${mockupPattern}`);
      }
      
      console.log('\n' + '='.repeat(80) + '\n');
    });

    // Résumé global
    console.log('📈 RÉSUMÉ GLOBAL:');
    
    let productsWithCorrectLogic = 0;
    let productsWithIncorrectLogic = 0;
    let productsWithMissingData = 0;
    
    products.forEach(product => {
      const hasDesignUrl = !!product.designUrl;
      const hasMockupUrl = !!product.mockupUrl;
      const hasOriginalDesignUrl = !!product.originalDesignUrl;
      
      if (!hasDesignUrl || !hasMockupUrl) {
        productsWithMissingData++;
      } else if (hasOriginalDesignUrl) {
        const designEqualsOriginal = product.designUrl === product.originalDesignUrl;
        const mockupIsDifferent = product.mockupUrl !== product.designUrl;
        
        if (designEqualsOriginal && mockupIsDifferent) {
          productsWithCorrectLogic++;
        } else {
          productsWithIncorrectLogic++;
        }
      } else {
        // Sans originalDesignUrl, accepter si les URLs sont présentes
        const urlsAreDifferent = product.designUrl !== product.mockupUrl;
        if (urlsAreDifferent) {
          productsWithCorrectLogic++;
        } else {
          productsWithIncorrectLogic++;
        }
      }
    });
    
    console.log(`✅ Produits avec logique correcte: ${productsWithCorrectLogic}`);
    console.log(`❌ Produits avec logique incorrecte: ${productsWithIncorrectLogic}`);
    console.log(`⚠️ Produits avec données manquantes: ${productsWithMissingData}`);
    
    const successRate = products.length > 0 
      ? Math.round((productsWithCorrectLogic / products.length) * 100) 
      : 0;
    
    console.log(`📊 Taux de succès: ${successRate}%`);
    
    if (productsWithCorrectLogic === products.length) {
      console.log(`\n🎉 TOUTES LES CORRECTIONS SONT APPLIQUÉES CORRECTEMENT !`);
    } else if (productsWithIncorrectLogic > 0) {
      console.log(`\n⚠️ ${productsWithIncorrectLogic} produits nécessitent encore une correction`);
      console.log(`💡 Cela peut être normal si ces produits ont été créés avant la correction`);
    }

  } catch (error) {
    console.error('❌ Erreur lors de la vérification:', error);
  } finally {
    await prisma.$disconnect();
  }
}

function extractPattern(url) {
  if (!url) return 'NULL';
  
  try {
    // Extraire le pattern pour identifier le type d'URL
    if (url.includes('design_original_')) {
      return 'DESIGN_ORIGINAL (correct pour designUrl)';
    } else if (url.includes('vendor_') && url.includes('_blanc')) {
      return 'MOCKUP_BLANC (correct pour mockupUrl)';
    } else if (url.includes('vendor_') && (url.includes('_noir') || url.includes('_blue') || url.includes('_rouge'))) {
      return 'MOCKUP_COULEUR (correct pour mockupUrl)';
    } else if (url.includes('vendor_')) {
      return 'MOCKUP_GENERAL (probablement correct pour mockupUrl)';
    } else {
      return 'PATTERN_INCONNU';
    }
  } catch (error) {
    return 'ERREUR_PATTERN';
  }
}

// Exécution
if (require.main === module) {
  checkDesignUrlMockupUrl().catch(console.error);
}

module.exports = { checkDesignUrlMockupUrl }; 
 
 
 
 
 
 
 
 
 
 
 