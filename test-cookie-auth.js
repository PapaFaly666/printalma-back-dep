const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

// Test d'authentification par cookies
async function testCookieAuth() {
  console.log('🔐 Test d\'authentification par cookies');
  console.log('=' .repeat(50));
  
  try {
    // Étape 1: Login
    console.log('1️⃣ Tentative de connexion...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'pf.d@zig.univ.sn',
      password: 'test123456'
    }, {
      withCredentials: true
    });
    
    console.log('✅ Login réussi');
    console.log('📄 Response headers:', Object.keys(loginResponse.headers));
    console.log('🍪 Set-Cookie:', loginResponse.headers['set-cookie']);
    console.log('👤 User data:', loginResponse.data.user);
    
    // Extraire le cookie
    const setCookieHeader = loginResponse.headers['set-cookie'];
    let authCookie = null;
    
    if (setCookieHeader) {
      const cookieString = setCookieHeader.find(cookie => cookie.includes('auth_token'));
      if (cookieString) {
        authCookie = cookieString.split(';')[0]; // Prendre juste "auth_token=value"
        console.log('🔑 Cookie extrait:', authCookie.substring(0, 30) + '...');
      }
    }
    
    // Étape 2: Test du profil avec cookie
    console.log('\n2️⃣ Test du profil avec cookie...');
    
    if (authCookie) {
      try {
        const profileResponse = await axios.get(`${BASE_URL}/auth/profile`, {
          headers: {
            'Cookie': authCookie
          }
        });
        
        console.log('✅ Profil récupéré avec succès');
        console.log('👤 Profil:', profileResponse.data);
        
        // Étape 3: Test de l'endpoint de position
        console.log('\n3️⃣ Test de l\'endpoint de position...');
        
        try {
          const positionResponse = await axios.get(
            `${BASE_URL}/api/vendor-products/2/designs/1/position/debug`,
            {
              headers: {
                'Cookie': authCookie
              }
            }
          );
          
          console.log('✅ Endpoint de position accessible');
          console.log('🔧 Debug info:', JSON.stringify(positionResponse.data.debug, null, 2));
          
        } catch (positionError) {
          console.log('❌ Erreur endpoint position:', positionError.response?.data || positionError.message);
        }
        
      } catch (profileError) {
        console.log('❌ Erreur profil:', profileError.response?.data || profileError.message);
      }
    } else {
      console.log('❌ Aucun cookie auth_token trouvé');
    }
    
  } catch (error) {
    console.error('❌ Erreur login:', error.response?.data || error.message);
  }
}

// Test avec axios instance configurée pour cookies
async function testWithAxiosInstance() {
  console.log('\n🔄 Test avec axios instance configurée...');
  
  const axiosInstance = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 10000
  });
  
  try {
    // Login
    const loginResponse = await axiosInstance.post('/auth/login', {
      email: 'pf.d@zig.univ.sn',
      password: 'test123456'
    });
    
    console.log('✅ Login avec instance réussi');
    console.log('👤 User:', loginResponse.data.user.email);
    
    // Test profil
    const profileResponse = await axiosInstance.get('/auth/profile');
    console.log('✅ Profil avec instance réussi');
    console.log('👤 Profil:', profileResponse.data.email);
    
    // Test endpoint position
    const positionResponse = await axiosInstance.get('/api/vendor-products/2/designs/1/position/debug');
    console.log('✅ Position endpoint avec instance réussi');
    console.log('🔧 Debug:', positionResponse.data.debug);
    
  } catch (error) {
    console.error('❌ Erreur avec instance:', error.response?.data || error.message);
  }
}

async function main() {
  await testCookieAuth();
  await testWithAxiosInstance();
}

main().catch(console.error); 
 
 
 
 