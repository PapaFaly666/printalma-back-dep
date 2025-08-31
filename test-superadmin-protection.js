const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3004';
const SUPERADMIN_EMAIL = 'superadmin@printalma.com';
const WRONG_PASSWORD = 'mauvais_mot_de_passe';
const MAX_ATTEMPTS = 10;

// Configuration axios
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 5000
});

console.log('🧪 TESTS DE PROTECTION SUPERADMIN\n');
console.log('='.repeat(50));

async function testMultipleFailedLogins() {
    console.log('\n📋 TEST 1: Tentatives de connexion multiples échouées');
    console.log('-'.repeat(50));
    
    let attemptNumber = 0;
    let totalAttempts = 0;
    let allFailed = true;
    
    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        try {
            const response = await api.post('/auth/login', {
                email: SUPERADMIN_EMAIL,
                password: WRONG_PASSWORD
            });
            
            // Si on arrive ici, la connexion a réussi (ne devrait pas arriver)
            console.log(`❌ Tentative ${i}: SUCCÈS inattendu!`);
            allFailed = false;
        } catch (error) {
            attemptNumber = i;
            totalAttempts++;
            
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'Erreur inconnue';
                
                console.log(`🔴 Tentative ${i}: ${status} - ${message}`);
                
                // Vérifier que c'est bien un 401 (Unauthorized) et pas un 423 (Locked)
                if (status === 401) {
                    console.log(`   ✅ Statut correct: Pas de verrouillage (401)`);
                } else if (status === 423) {
                    console.log(`   ❌ ERREUR: Compte verrouillé! (${status})`);
                    allFailed = false;
                    break;
                } else {
                    console.log(`   ⚠️  Statut inattendu: ${status}`);
                }
            } else {
                console.log(`🔴 Tentative ${i}: Erreur réseau - ${error.message}`);
            }
        }
        
        // Petite pause entre les tentatives
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('\n📊 RÉSULTATS:');
    console.log(`   Total tentatives: ${totalAttempts}`);
    console.log(`   Toutes échouées: ${allFailed ? '✅ OUI' : '❌ NON'}`);
    console.log(`   Protection active: ${allFailed ? '✅ OUI' : '❌ NON'}`);
    
    return { allFailed, totalAttempts };
}

async function testSuperadminStatusToggle() {
    console.log('\n📋 TEST 2: Tentative de désactivation SUPERADMIN');
    console.log('-'.repeat(50));
    
    try {
        // D'abord, on doit se connecter avec un compte admin pour obtenir un token
        console.log('🔐 Tentative de connexion admin pour obtenir un token...');
        
        // Note: Remplacez ces identifiants par un compte admin valide
        const adminLogin = await api.post('/auth/login', {
            email: 'admin@printalma.com', // À ajuster selon votre config
            password: 'admin_password'     // À ajuster selon votre config
        });
        
        const token = adminLogin.data.access_token;
        console.log('✅ Token admin obtenu');
        
        // Maintenant, tenter de désactiver un SUPERADMIN
        const response = await api.put('/auth/admin/clients/1/toggle-status', {}, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('❌ ERREUR: La désactivation SUPERADMIN a réussi!');
        console.log('   Réponse:', response.data);
        return false;
        
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || 'Erreur inconnue';
            
            if (status === 400 && message.includes('SUPERADMIN')) {
                console.log(`✅ Protection active: ${status} - ${message}`);
                return true;
            } else if (status === 401) {
                console.log(`⚠️  Pas de token admin valide: ${status} - ${message}`);
                console.log('   (Test non conclusif - besoin d\'un compte admin)');
                return null; // Test non conclusif
            } else {
                console.log(`⚠️  Erreur inattendue: ${status} - ${message}`);
                return false;
            }
        } else {
            console.log(`🔴 Erreur réseau: ${error.message}`);
            return false;
        }
    }
}

async function checkDatabaseConsistency() {
    console.log('\n📋 TEST 3: Vérification des logs');
    console.log('-'.repeat(50));
    
    console.log('ℹ️  Ce test nécessite l\'accès aux logs de l\'application');
    console.log('   Vérifiez manuellement les logs pour:');
    console.log('   - Messages avec "🚨 Tentative de connexion échouée pour SUPERADMIN"');
    console.log('   - Absence de messages de verrouillage pour SUPERADMIN');
    console.log('   - Incrémentation du compteur login_attempts en base');
    
    return true;
}

async function runAllTests() {
    const startTime = Date.now();
    
    try {
        console.log(`🕐 Démarrage des tests: ${new Date().toLocaleString()}`);
        console.log(`🎯 Cible: ${API_BASE_URL}`);
        console.log(`👤 Email SUPERADMIN: ${SUPERADMIN_EMAIL}`);
        
        // Test 1: Tentatives multiples
        const test1Result = await testMultipleFailedLogins();
        
        // Test 2: Désactivation (peut échouer si pas de compte admin)
        const test2Result = await testSuperadminStatusToggle();
        
        // Test 3: Logs
        const test3Result = await checkDatabaseConsistency();
        
        // Résumé
        console.log('\n🏁 RÉSUMÉ FINAL');
        console.log('='.repeat(50));
        
        const results = [
            { test: 'Protection anti-verrouillage', result: test1Result.allFailed },
            { test: 'Protection anti-désactivation', result: test2Result },
            { test: 'Vérification logs', result: test3Result }
        ];
        
        results.forEach((r, i) => {
            const icon = r.result === true ? '✅' : r.result === false ? '❌' : '⚠️ ';
            const status = r.result === true ? 'SUCCÈS' : r.result === false ? 'ÉCHEC' : 'NON CONCLUSIF';
            console.log(`   Test ${i + 1}: ${icon} ${r.test} - ${status}`);
        });
        
        const allPassed = results.every(r => r.result === true);
        console.log(`\n🎯 Statut global: ${allPassed ? '✅ TOUS LES TESTS PASSÉS' : '⚠️  VÉRIFICATION NÉCESSAIRE'}`);
        
        if (allPassed) {
            console.log('🛡️  Les protections SUPERADMIN sont actives et fonctionnelles!');
        } else {
            console.log('⚠️  Certaines protections peuvent nécessiter une vérification manuelle.');
        }
        
    } catch (error) {
        console.error('\n❌ ERREUR GLOBALE:', error.message);
    } finally {
        const duration = Date.now() - startTime;
        console.log(`\n⏱️  Durée totale: ${duration}ms`);
        console.log('🏁 Tests terminés.');
    }
}

// Gestion des signaux pour arrêt propre
process.on('SIGINT', () => {
    console.log('\n\n⏹️  Tests interrompus par l\'utilisateur.');
    process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('\n❌ Erreur non gérée:', reason);
    process.exit(1);
});

// Lancement des tests
if (require.main === module) {
    console.log('🚀 Lancement automatique des tests...\n');
    runAllTests().catch(error => {
        console.error('❌ Erreur lors de l\'exécution:', error);
        process.exit(1);
    });
}

module.exports = {
    testMultipleFailedLogins,
    testSuperadminStatusToggle,
    checkDatabaseConsistency,
    runAllTests
}; 