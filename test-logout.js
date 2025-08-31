const axios = require('axios');

const BASE_URL = 'http://localhost:3004';

async function testLogout() {
    console.log('🚀 Test de la déconnexion vendeur\n');

    try {
        // 1. D'abord se connecter pour obtenir un cookie
        console.log('1️⃣ Connexion avec un vendeur...');
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email: 'test@example.com', // Remplacez par un email valide de votre DB
            password: 'printalmatest123' // Remplacez par le bon mot de passe
        }, {
            withCredentials: true // Important pour recevoir les cookies
        });

        console.log('✅ Connexion réussie');
        console.log('👤 Utilisateur:', loginResponse.data.user?.firstName, loginResponse.data.user?.lastName);
        
        // Récupérer les cookies de la réponse
        const cookies = loginResponse.headers['set-cookie'];
        console.log('🍪 Cookies reçus:', cookies ? 'Oui' : 'Non');

        // 2. Vérifier l'authentification
        console.log('\n2️⃣ Vérification de l\'authentification...');
        const checkResponse = await axios.get(`${BASE_URL}/auth/check`, {
            withCredentials: true,
            headers: {
                Cookie: cookies?.join('; ') || ''
            }
        });

        console.log('✅ Authentification vérifiée');
        console.log('👤 Utilisateur authentifié:', checkResponse.data.user?.firstName);

        // 3. Test de déconnexion
        console.log('\n3️⃣ Test de déconnexion...');
        const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
            withCredentials: true,
            headers: {
                Cookie: cookies?.join('; ') || ''
            }
        });

        console.log('✅ Déconnexion réussie');
        console.log('📝 Réponse:', logoutResponse.data);

        // 4. Vérifier que l'authentification a bien été supprimée
        console.log('\n4️⃣ Vérification que l\'utilisateur est bien déconnecté...');
        try {
            await axios.get(`${BASE_URL}/auth/check`, {
                withCredentials: true,
                headers: {
                    Cookie: cookies?.join('; ') || ''
                }
            });
            console.log('❌ ERREUR: L\'utilisateur semble encore connecté');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Parfait! L\'utilisateur est bien déconnecté (401 Unauthorized)');
            } else {
                console.log('⚠️ Erreur inattendue:', error.response?.status, error.message);
            }
        }

        // 5. Test de déconnexion sans être connecté
        console.log('\n5️⃣ Test de déconnexion sans être connecté...');
        const logoutWithoutAuthResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
            withCredentials: true
        });

        console.log('✅ Déconnexion sans authentification gérée correctement');
        console.log('📝 Réponse:', logoutWithoutAuthResponse.data);

        console.log('\n🎉 Tous les tests de déconnexion sont passés avec succès!');

    } catch (error) {
        console.error('❌ Erreur pendant les tests:', error.response?.data || error.message);
        
        if (error.response?.status === 401) {
            console.log('\n💡 Info: Erreur 401 - Vérifiez que vous avez un utilisateur avec les bonnes credentials dans votre DB');
        }
    }
}

// Fonction utilitaire pour tester avec différents vendeurs
async function testLogoutWithUser(email, password, userType = 'vendeur') {
    console.log(`\n🧪 Test de déconnexion pour ${userType}: ${email}`);
    
    try {
        // Connexion
        const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
            email,
            password
        }, {
            withCredentials: true
        });

        console.log(`✅ ${userType} connecté:`, loginResponse.data.user?.firstName);

        // Déconnexion
        const logoutResponse = await axios.post(`${BASE_URL}/auth/logout`, {}, {
            withCredentials: true,
            headers: {
                Cookie: loginResponse.headers['set-cookie']?.join('; ') || ''
            }
        });

        console.log(`✅ ${userType} déconnecté:`, logoutResponse.data.message);
        console.log(`🕐 Timestamp:`, logoutResponse.data.timestamp);

        return true;
    } catch (error) {
        console.error(`❌ Erreur pour ${userType}:`, error.response?.data || error.message);
        return false;
    }
}

// Tests multiples
async function runAllTests() {
    console.log('🎯 === TESTS DE DÉCONNEXION PRINTALMA ===\n');

    // Test principal
    await testLogout();

    // Tests avec différents types d'utilisateurs si vous en avez
    console.log('\n🔄 === TESTS AVEC DIFFÉRENTS UTILISATEURS ===');
    
    const testUsers = [
        { email: 'designer@test.com', password: 'test123', type: 'DESIGNER' },
        { email: 'influenceur@test.com', password: 'test123', type: 'INFLUENCEUR' },
        { email: 'artiste@test.com', password: 'test123', type: 'ARTISTE' },
        // Ajoutez vos utilisateurs de test ici
    ];

    for (const user of testUsers) {
        await testLogoutWithUser(user.email, user.password, user.type);
        // Petit délai entre les tests
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✨ Tests terminés!');
}

// Exécuter les tests
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = { testLogout, testLogoutWithUser, runAllTests }; 