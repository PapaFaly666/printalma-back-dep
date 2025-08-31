/**
 * 🧪 TEST DONNÉES COMPLÈTES ARCHITECTURE V2
 * Vérifie que tous les champs nécessaires sont bien retournés
 */

const BASE_URL = 'http://localhost:3004';

async function testCompleteDataV2() {
  console.log('🧪 TEST DONNÉES COMPLÈTES ARCHITECTURE V2');
  console.log('=' .repeat(60));

  try {
    // 🔐 ÉTAPE 1: Connexion vendeur
    console.log('\n🔐 Test: Connexion vendeur...');
    const loginResponse = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'pf.d@zig.univ.sn',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Erreur connexion: ${loginResponse.status}`);
    }

    const loginData = await loginResponse.json();
    const token = loginData.access_token;
    console.log('✅ Connexion réussie');

    // 🎯 ÉTAPE 2: Test endpoint produits vendeur avec données complètes
    console.log('\n📦 Test: Récupération produits vendeur avec données complètes...');
    const productsResponse = await fetch(`${BASE_URL}/vendor/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!productsResponse.ok) {
      throw new Error(`Erreur produits: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    console.log('✅ Réponse reçue');
    
    // 🔍 VÉRIFICATION STRUCTURE GLOBALE
    console.log('\n🔍 Vérification structure globale...');
    console.log(`- Architecture: ${productsData.architecture}`);
    console.log(`- Succès: ${productsData.success}`);
    console.log(`- Nombre de produits: ${productsData.data?.products?.length || 0}`);
    
    if (productsData.architecture !== 'v2_preserved_admin') {
      console.warn('⚠️ Architecture non v2 détectée');
      return;
    }

    if (!productsData.data?.products?.length) {
      console.warn('⚠️ Aucun produit trouvé');
      return;
    }

    // 🎨 VÉRIFICATION DONNÉES DESIGN ET DÉLIMITATIONS
    const firstProduct = productsData.data.products[0];
    console.log('\n🎨 Vérification données design et délimitations...');
    console.log(`- Produit ID: ${firstProduct.id}`);
    console.log(`- Nom vendeur: ${firstProduct.vendorName}`);
    console.log(`- Nom admin original: ${firstProduct.originalAdminName}`);

    // Vérifier designApplication
    const designApp = firstProduct.designApplication;
    console.log('\n✨ Design Application (Cloudinary):');
    console.log(`- Has Design: ${designApp?.hasDesign}`);
    console.log(`- Design URL: ${designApp?.designUrl ? 'PRÉSENT (' + designApp.designUrl + ')' : 'ABSENT'}`);
    console.log(`- Design Public ID: ${designApp?.designCloudinaryPublicId || 'ABSENT'}`);
    console.log(`- Positioning: ${designApp?.positioning}`);
    console.log(`- Scale: ${designApp?.scale}`);
    console.log(`- Mode: ${designApp?.mode}`);

    // Vérifier adminProduct avec colorVariations et délimitations
    const adminProduct = firstProduct.adminProduct;
    console.log('\n🏗️ Admin Product Structure:');
    console.log(`- ID: ${adminProduct?.id}`);
    console.log(`- Name: ${adminProduct?.name}`);
    console.log(`- Color Variations: ${adminProduct?.colorVariations?.length || 0}`);

    if (adminProduct?.colorVariations?.length > 0) {
      const firstColor = adminProduct.colorVariations[0];
      console.log(`\n🎨 Première couleur (${firstColor.name}):`);
      console.log(`- ID: ${firstColor.id}`);
      console.log(`- Color Code: ${firstColor.colorCode}`);
      console.log(`- Images: ${firstColor.images?.length || 0}`);

      if (firstColor.images?.length > 0) {
        const firstImage = firstColor.images[0];
        console.log(`\n🖼️ Première image (${firstImage.viewType}):`);
        console.log(`- ID: ${firstImage.id}`);
        console.log(`- URL: ${firstImage.url}`);
        console.log(`- Délimitations: ${firstImage.delimitations?.length || 0}`);

        if (firstImage.delimitations?.length > 0) {
          firstImage.delimitations.forEach((delim, index) => {
            console.log(`\n📍 Délimitation ${index + 1}:`);
            console.log(`- Position: (${delim.x}, ${delim.y})`);
            console.log(`- Dimensions: ${delim.width} × ${delim.height}`);
            console.log(`- Type coordonnées: ${delim.coordinateType}`);
          });
        } else {
          console.warn('⚠️ Aucune délimitation trouvée');
        }
      } else {
        console.warn('⚠️ Aucune image trouvée');
      }
    } else {
      console.warn('⚠️ Aucune variation de couleur trouvée');
    }

    // 🎯 ÉTAPE 3: Test détails produit
    console.log('\n📋 Test: Détails produit complets...');
    const detailResponse = await fetch(`${BASE_URL}/vendor/products/${firstProduct.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (detailResponse.ok) {
      const detailData = await detailResponse.json();
      console.log('✅ Détails récupérés');
      console.log(`- Design URL dans détails: ${detailData.data?.designApplication?.designUrl ? 'PRÉSENT' : 'ABSENT'}`);
      console.log(`- Design Public ID dans détails: ${detailData.data?.designApplication?.designCloudinaryPublicId || 'ABSENT'}`);
      console.log(`- Délimitations dans détails: ${detailData.data?.adminProduct?.colorVariations?.[0]?.images?.[0]?.delimitations?.length || 0}`);
    } else {
      console.warn('⚠️ Erreur récupération détails');
    }

    // 📊 RÉSUMÉ FINAL
    console.log('\n' + '=' .repeat(60));
    console.log('📊 RÉSUMÉ DE VÉRIFICATION:');
    console.log('=' .repeat(60));

    const checks = [
      { name: 'Architecture v2', status: productsData.architecture === 'v2_preserved_admin' },
      { name: 'Design URL Cloudinary', status: !!designApp?.designUrl },
      { name: 'Design Public ID', status: !!designApp?.designCloudinaryPublicId },
      { name: 'Admin ColorVariations', status: !!(adminProduct?.colorVariations?.length > 0) },
      { name: 'Images avec délimitations', status: !!(firstColor?.images?.[0]?.delimitations?.length > 0) },
      { name: 'Coordonnées délimitations', status: !!(firstImage?.delimitations?.[0]?.x !== undefined) },
      { name: 'URLs images admin', status: !!(firstImage?.url) },
      { name: 'Données vendeur', status: !!(firstProduct.vendor) },
      { name: 'Sélections couleurs/tailles', status: !!(firstProduct.selectedColors?.length > 0) }
    ];

    checks.forEach(check => {
      const icon = check.status ? '✅' : '❌';
      console.log(`${icon} ${check.name}: ${check.status ? 'OK' : 'MANQUANT'}`);
    });

    const allChecksPass = checks.every(check => check.status);
    
    console.log('\n' + '=' .repeat(60));
    if (allChecksPass) {
      console.log('🎉 TOUTES LES DONNÉES NÉCESSAIRES SONT PRÉSENTES !');
      console.log('🚀 Le frontend peut maintenant afficher les produits avec designs centrés');
    } else {
      console.log('⚠️ Certaines données manquent, vérifiez les points marqués ❌');
    }
    console.log('=' .repeat(60));

    // 💡 EXEMPLE USAGE FRONTEND
    console.log('\n💡 EXEMPLE USAGE FRONTEND (CLOUDINARY):');
    console.log(`
// Récupérer design et délimitations avec Cloudinary
const product = productsData.data.products[0];
const designUrl = product.designApplication.designUrl; // URL Cloudinary directe
const firstColor = product.adminProduct.colorVariations[0];
const firstImage = firstColor.images[0];
const delimitations = firstImage.delimitations;

// Charger le design depuis Cloudinary
const designImg = new Image();
designImg.crossOrigin = 'anonymous';
designImg.src = designUrl; // Plus léger et plus rapide que base64

// Centrer design dans délimitation avec Canvas
designImg.onload = () => {
  delimitations.forEach(delim => {
    const centerX = delim.x + (delim.width / 2);
    const centerY = delim.y + (delim.height / 2);
    const scale = product.designApplication.scale; // 0.6
    
    // Appliquer design centré
    ctx.drawImage(designImg, 
      centerX - (delim.width * scale / 2),
      centerY - (delim.height * scale / 2),
      delim.width * scale,
      delim.height * scale
    );
  });
};

// Optimisations Cloudinary possibles:
// - Miniature: designUrl.replace('/upload/', '/upload/w_200,h_200,c_fit/')
// - Haute qualité: designUrl.replace('/upload/', '/upload/q_90,f_auto/')
// - Format WebP: designUrl.replace('/upload/', '/upload/f_webp/')
    `);

  } catch (error) {
    console.error('❌ Erreur test:', error.message);
  }
}

// Exécuter le test
testCompleteDataV2(); 