const axios = require('axios');

// Configuration pour test frontend-backend
const API_BASE_URL = 'http://localhost:3004';
const TEST_EMAIL = 'vendeur@printalma.com'; // Changez par un email existant
const WRONG_PASSWORD = 'motdepasseincorrect';

console.log('🧪 TEST MESSAGES FRONTEND-BACKEND');
console.log('==========================================\n');

// Simuler le service d'authentification frontend
class AuthService {
    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            withCredentials: true,
            timeout: 5000
        });
    }

    async login(email, password) {
        try {
            const response = await this.api.post('/auth/login', {
                email: email,
                password: password
            });

            // ✅ Connexion réussie
            if (response.data.user) {
                return {
                    success: true,
                    user: response.data.user,
                    mustChangePassword: false
                };
            }

            // 🔑 Changement de mot de passe requis
            if (response.data.mustChangePassword) {
                return {
                    success: false,
                    mustChangePassword: true,
                    userId: response.data.userId,
                    message: response.data.message
                };
            }

        } catch (error) {
            return this.handleLoginError(error);
        }
    }

    handleLoginError(error) {
        if (error.response) {
            const { status, data } = error.response;
            const message = data.message || 'Erreur de connexion';

            return {
                success: false,
                error: this.categorizeError(message),
                message: message, // MESSAGE EXACT DU BACKEND
                statusCode: status,
                remainingAttempts: this.extractRemainingAttempts(message),
                remainingTime: this.extractRemainingTime(message)
            };
        } else if (error.code === 'ECONNREFUSED') {
            return {
                success: false,
                error: 'SERVER_DOWN',
                message: 'Serveur non accessible. Vérifiez votre connexion.',
                statusCode: 0
            };
        } else {
            return {
                success: false,
                error: 'NETWORK_ERROR',
                message: 'Erreur de réseau. Vérifiez votre connexion.',
                statusCode: 0
            };
        }
    }

    categorizeError(message) {
        // Prioriser les messages avec tentatives restantes
        if (message.includes('Il vous reste') && message.includes('tentative')) {
            const remaining = this.extractRemainingAttempts(message);
            return remaining > 2 ? 'ATTEMPTS_REMAINING_SAFE' : 'ATTEMPTS_REMAINING_WARNING';
        }
        
        if (message.includes('Dernière tentative avant verrouillage')) {
            return 'LAST_ATTEMPT';
        }
        
        if (message.includes('verrouillé') && message.includes('Temps restant')) {
            return 'ACCOUNT_LOCKED';
        }
        
        if (message.includes('désactivé')) {
            return 'ACCOUNT_DISABLED';
        }
        
        if (message.includes('Email ou mot de passe incorrect')) {
            return 'INVALID_CREDENTIALS';
        }
        
        return 'UNKNOWN_ERROR';
    }

    extractRemainingAttempts(message) {
        const match = message.match(/Il vous reste (\d+) tentative/);
        return match ? parseInt(match[1]) : null;
    }

    extractRemainingTime(message) {
        const timeMatch = message.match(/Temps restant\s*:\s*(.+)/);
        return timeMatch ? timeMatch[1].trim() : null;
    }
}

// Simuler l'affichage frontend
function displayError(errorResult) {
    console.log(`📱 AFFICHAGE FRONTEND:`);
    console.log(`   Type: ${errorResult.error}`);
    console.log(`   Message affiché: "${errorResult.message}"`);
    
    if (errorResult.remainingAttempts !== null) {
        console.log(`   🔢 Tentatives extraites: ${errorResult.remainingAttempts}`);
        console.log(`   🎯 Indicateur visuel: ${errorResult.remainingAttempts} points verts sur 5`);
    }
    
    if (errorResult.remainingTime) {
        console.log(`   ⏰ Temps de déblocage: ${errorResult.remainingTime}`);
    }
    
    console.log(`   🎨 Classe CSS: error-${errorResult.error.toLowerCase().replace('_', '-')}`);
}

async function testMultipleLoginAttempts() {
    const authService = new AuthService();
    
    console.log(`📧 Email de test: ${TEST_EMAIL}`);
    console.log(`🔑 Mot de passe incorrect: ${WRONG_PASSWORD}\n`);
    
    for (let attempt = 1; attempt <= 7; attempt++) {
        console.log(`\n🔄 TENTATIVE ${attempt}:`);
        console.log('-'.repeat(50));
        
        try {
            const result = await authService.login(TEST_EMAIL, WRONG_PASSWORD);
            
            if (result.success) {
                console.log(`✅ Connexion réussie (inattendu)`);
                break;
            } else if (result.mustChangePassword) {
                console.log(`🔑 Changement de mot de passe requis`);
                console.log(`   Message: "${result.message}"`);
                break;
            } else {
                console.log(`❌ Connexion échouée`);
                console.log(`   Status: ${result.statusCode}`);
                console.log(`   Message backend: "${result.message}"`);
                
                displayError(result);
                
                // Si compte verrouillé, arrêter les tests
                if (result.error === 'ACCOUNT_LOCKED') {
                    console.log(`\n🔒 Compte verrouillé, arrêt des tests`);
                    break;
                }
            }
        } catch (error) {
            console.log(`💥 Erreur inattendue: ${error.message}`);
            break;
        }
        
        // Pause entre les tentatives
        await new Promise(resolve => setTimeout(resolve, 500));
    }
}

async function main() {
    console.log(`🎯 Test de l'intégration Frontend-Backend`);
    console.log(`⚠️  Assurez-vous que:`);
    console.log(`   - Le backend est démarré sur ${API_BASE_URL}`);
    console.log(`   - L'email ${TEST_EMAIL} existe dans la base`);
    console.log(`   - Ce compte N'EST PAS un SUPERADMIN`);
    console.log(`\n⏳ Démarrage dans 3 secondes...\n`);
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await testMultipleLoginAttempts();
    
    console.log(`\n🏁 RÉSULTATS ATTENDUS:`);
    console.log(`✅ Messages du backend affichés tels quels`);
    console.log(`✅ "Email ou mot de passe incorrect. Il vous reste X tentatives."`);
    console.log(`✅ Extraction correcte du nombre de tentatives`);
    console.log(`✅ Indicateurs visuels basés sur les données extraites`);
    console.log(`✅ Message de verrouillage avec temps restant`);
}

// Gestion des interruptions
process.on('SIGINT', () => {
    console.log('\n\n👋 Test interrompu par l\'utilisateur');
    process.exit(0);
});

// Lancement
main().catch(console.error); 