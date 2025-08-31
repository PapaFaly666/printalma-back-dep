/**
 * Script de test pour diagnostiquer les problèmes d'accès frontend
 * 
 * UTILISATION:
 * 1. Ouvrir la console du navigateur (F12)
 * 2. Copier-coller ce script complet
 * 3. Appuyer sur Entrée
 * 4. Analyser les résultats
 */

console.log('🚀 DÉBUT DU DIAGNOSTIC FRONTEND');
console.log('================================');

// Configuration
const API_BASE = window.location.origin; // Utilise l'origine actuelle
console.log('🔧 API Base URL:', API_BASE);

// Fonction utilitaire pour décoder JWT
function decodeJWT(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('❌ Erreur décodage JWT:', error);
    return null;
  }
}

// Fonction utilitaire pour vérifier les cookies
function checkCookies() {
  console.log('\n📋 1. VÉRIFICATION DES COOKIES');
  console.log('------------------------------');
  
  const cookies = document.cookie.split(';');
  const authCookie = cookies.find(cookie => cookie.trim().startsWith('auth_token='));
  
  console.log('Tous les cookies:', document.cookie || 'Aucun cookie');
  console.log('Cookie auth_token:', authCookie || 'Absent');
  
  if (authCookie) {
    const token = authCookie.split('=')[1];
    console.log('Token trouvé dans cookie:', token.substring(0, 20) + '...');
    
    const payload = decodeJWT(token);
    if (payload) {
      console.log('✅ Token décodé avec succès');
      console.log('   - ID utilisateur (sub):', payload.sub);
      console.log('   - Rôle:', payload.role);
      console.log('   - Email:', payload.email);
      console.log('   - Expiration:', new Date(payload.exp * 1000));
      console.log('   - Expiré:', payload.exp < Date.now() / 1000 ? '❌ OUI' : '✅ NON');
    }
  } else {
    console.log('❌ Aucun token trouvé dans les cookies');
  }
}

// Fonction utilitaire pour vérifier le localStorage
function checkLocalStorage() {
  console.log('\n💾 2. VÉRIFICATION DU LOCAL STORAGE');
  console.log('-----------------------------------');
  
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  if (token) {
    console.log('✅ Token trouvé dans storage:', token.substring(0, 20) + '...');
    const payload = decodeJWT(token);
    if (payload) {
      console.log('   - ID utilisateur (sub):', payload.sub);
      console.log('   - Rôle:', payload.role);
      console.log('   - Email:', payload.email);
      console.log('   - Expiration:', new Date(payload.exp * 1000));
      console.log('   - Expiré:', payload.exp < Date.now() / 1000 ? '❌ OUI' : '✅ NON');
    }
  } else {
    console.log('❌ Aucun token trouvé dans le storage');
  }
  
  // Afficher tout le localStorage pour debug
  console.log('Contenu localStorage:', { ...localStorage });
  console.log('Contenu sessionStorage:', { ...sessionStorage });
}

// Test d'authentification
async function testAuth() {
  console.log('\n🔐 3. TEST D\'AUTHENTIFICATION');
  console.log('-----------------------------');
  
  try {
    const response = await fetch(`${API_BASE}/orders/test-auth`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status HTTP:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Authentification réussie');
      console.log('Données utilisateur:', result.data);
      return result.data;
    } else {
      const errorText = await response.text();
      console.log('❌ Échec authentification');
      console.log('Erreur:', errorText);
      return null;
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
    return null;
  }
}

// Test d'accès admin
async function testAdmin() {
  console.log('\n👨‍💼 4. TEST D\'ACCÈS ADMIN');
  console.log('-------------------------');
  
  try {
    const response = await fetch(`${API_BASE}/orders/test-admin`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status HTTP:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Accès admin confirmé');
      console.log('Données:', result.data);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Accès admin refusé');
      console.log('Erreur:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
    return false;
  }
}

// Test d'un endpoint protégé réel
async function testProtectedEndpoint() {
  console.log('\n🛡️ 5. TEST ENDPOINT PROTÉGÉ');
  console.log('----------------------------');
  
  try {
    const response = await fetch(`${API_BASE}/orders/admin/all?page=1&limit=1`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status HTTP:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Endpoint protégé accessible');
      console.log('Succès:', result.success);
      console.log('Données:', result.data);
      return true;
    } else {
      const errorText = await response.text();
      console.log('❌ Endpoint protégé inaccessible');
      console.log('Erreur:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Erreur réseau:', error.message);
    return false;
  }
}

// Test de configuration CORS
async function testCORS() {
  console.log('\n🌐 6. TEST CONFIGURATION CORS');
  console.log('------------------------------');
  
  try {
    // Test simple pour vérifier CORS
    const response = await fetch(`${API_BASE}/orders/test-auth`, {
      method: 'OPTIONS'
    });
    
    console.log('Status OPTIONS:', response.status);
    console.log('Headers CORS:');
    console.log('  - Access-Control-Allow-Origin:', response.headers.get('Access-Control-Allow-Origin'));
    console.log('  - Access-Control-Allow-Credentials:', response.headers.get('Access-Control-Allow-Credentials'));
    console.log('  - Access-Control-Allow-Methods:', response.headers.get('Access-Control-Allow-Methods'));
    
  } catch (error) {
    console.log('❌ Erreur test CORS:', error.message);
  }
}

// Fonction principale de diagnostic
async function runFullDiagnostic() {
  // Vérifications de base
  checkCookies();
  checkLocalStorage();
  
  // Tests réseau
  const authData = await testAuth();
  const adminAccess = await testAdmin();
  const endpointAccess = await testProtectedEndpoint();
  
  // Test CORS
  await testCORS();
  
  // Résumé
  console.log('\n📊 RÉSUMÉ DU DIAGNOSTIC');
  console.log('=======================');
  
  const hasCookie = document.cookie.includes('auth_token=');
  const hasStorage = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  console.log('✅ Token présent (cookie):', hasCookie ? 'OUI' : 'NON');
  console.log('✅ Token présent (storage):', hasStorage ? 'OUI' : 'NON');
  console.log('✅ Authentification:', authData ? 'OK' : 'ÉCHEC');
  console.log('✅ Accès admin:', adminAccess ? 'OK' : 'ÉCHEC');
  console.log('✅ Endpoint protégé:', endpointAccess ? 'OK' : 'ÉCHEC');
  
  // Recommandations
  console.log('\n💡 RECOMMANDATIONS');
  console.log('==================');
  
  if (!hasCookie && !hasStorage) {
    console.log('❌ PROBLÈME: Aucun token trouvé');
    console.log('   → Vous devez vous reconnecter');
    console.log('   → Vérifiez que la connexion fonctionne');
  } else if (authData && !adminAccess) {
    console.log('❌ PROBLÈME: Authentifié mais pas d\'accès admin');
    console.log('   → Vérifiez que votre compte a le rôle SUPERADMIN');
    console.log('   → Contactez l\'administrateur système');
  } else if (authData && adminAccess && !endpointAccess) {
    console.log('❌ PROBLÈME: Tests OK mais endpoint réel échoue');
    console.log('   → Problème possible avec le RolesGuard');
    console.log('   → Vérifiez la configuration backend');
  } else if (!authData) {
    console.log('❌ PROBLÈME: Échec d\'authentification');
    console.log('   → Token expiré ou invalide');
    console.log('   → Reconnectez-vous');
  } else {
    console.log('✅ TOUT FONCTIONNE CORRECTEMENT');
    console.log('   → Votre accès admin est opérationnel');
  }
  
  // Informations de debug
  console.log('\n🔧 INFORMATIONS DE DEBUG');
  console.log('========================');
  console.log('URL actuelle:', window.location.href);
  console.log('User Agent:', navigator.userAgent);
  console.log('Timestamp:', new Date().toISOString());
  
  console.log('\n🏁 FIN DU DIAGNOSTIC');
  console.log('====================');
}

// Exécuter le diagnostic
runFullDiagnostic().catch(error => {
  console.error('❌ Erreur lors du diagnostic:', error);
});

// Fonctions utilitaires disponibles après le script
window.frontendDebug = {
  testAuth,
  testAdmin,
  testProtectedEndpoint,
  checkCookies,
  checkLocalStorage,
  decodeJWT,
  runFullDiagnostic
};

console.log('\n🛠️ FONCTIONS DISPONIBLES');
console.log('========================');
console.log('Vous pouvez maintenant utiliser:');
console.log('- frontendDebug.testAuth()');
console.log('- frontendDebug.testAdmin()');
console.log('- frontendDebug.runFullDiagnostic()');
console.log('- frontendDebug.checkCookies()');
console.log('- frontendDebug.decodeJWT(token)'); 