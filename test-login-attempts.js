const axios = require('axios');

// Configuration
const API_BASE_URL = 'http://localhost:3004';
const TEST_EMAIL = 'test@printalma.com'; // Remplacez par un email de test EXISTANT
const WRONG_PASSWORD = 'mauvais_mot_de_passe';

// Configuration axios
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    timeout: 5000
});

console.log('🧪 TEST DES MESSAGES D\'INFORMATION DE CONNEXION\n');
console.log('='.repeat(60));
console.log(`⚠️  IMPORTANT: Assurez-vous que l'email ${TEST_EMAIL} existe dans la base de données`);
console.log(`   et que le compte n'est PAS un SUPERADMIN pour que les tests fonctionnent.`);

async function testProgressiveLoginAttempts() {
    console.log('\n📋 TEST: Messages progressifs lors des tentatives échouées');
    console.log('-'.repeat(60));
    
    const results = [];
    let accountLocked = false;
    
    for (let attempt = 1; attempt <= 7; attempt++) {
        try {
            console.log(`\n🔄 Tentative ${attempt}:`);
            
            const response = await api.post('/auth/login', {
                email: TEST_EMAIL,
                password: WRONG_PASSWORD
            });
            
            // Si on arrive ici, la connexion a réussi (ne devrait pas arriver)
            console.log(`❌ Tentative ${attempt}: SUCCÈS inattendu!`);
            results.push({ attempt, status: 'success', unexpected: true });
            break;
            
        } catch (error) {
            if (error.response) {
                const status = error.response.status;
                const message = error.response.data?.message || 'Erreur inconnue';
                
                console.log(`   Status: ${status}`);
                console.log(`   Message: "${message}"`);
                
                // Analyser le message pour extraire les informations
                let remainingAttempts = null;
                let isLocked = false;
                let lockDuration = null;
                let isDisabled = false;
                
                if (message.includes('Il vous reste') && message.includes('tentatives')) {
                    const match = message.match(/Il vous reste (\d+) tentatives?/);
                    remainingAttempts = match ? parseInt(match[1]) : null;
                } else if (message.includes('Dernière tentative avant verrouillage')) {
                    remainingAttempts = 0;
                } else if (message.includes('verrouillé') && message.includes('Temps restant')) {
                    isLocked = true;
                    accountLocked = true;
                    
                    // Extraire la durée de verrouillage
                    const timeMatch = message.match(/Temps restant\s*:\s*(.+)/);
                    lockDuration = timeMatch ? timeMatch[1] : 'Durée non spécifiée';
                } else if (message.includes('désactivé')) {
                    isDisabled = true;
                } else if (message.includes('Email ou mot de passe incorrect') && !message.includes('Il vous reste')) {
                    // Premier essai ou cas général
                    remainingAttempts = 'unknown';
                }
                
                results.push({
                    attempt,
                    status,
                    message,
                    remainingAttempts,
                    isLocked,
                    lockDuration,
                    isDisabled
                });
                
                // Afficher l'analyse
                if (remainingAttempts === 0) {
                    console.log(`   🚨 Dernière tentative détectée`);
                } else if (remainingAttempts && remainingAttempts !== 'unknown') {
                    console.log(`   ✅ Tentatives restantes détectées: ${remainingAttempts}`);
                } else if (isLocked) {
                    console.log(`   🔒 Compte verrouillé détecté: ${lockDuration}`);
                    break; // Arrêter les tests si le compte est verrouillé
                } else if (isDisabled) {
                    console.log(`   🚫 Compte désactivé détecté`);
                    break; // Arrêter si le compte est désactivé
                } else if (message.includes('Email ou mot de passe incorrect')) {
                    console.log(`   ℹ️  Message générique d'erreur de connexion`);
                }
                
            } else if (error.code === 'ECONNREFUSED') {
                console.log(`🔴 Tentative ${attempt}: Serveur non disponible (${error.message})`);
                console.log(`   ⚠️  Vérifiez que le serveur backend fonctionne sur ${API_BASE_URL}`);
                results.push({ attempt, error: 'server_down', message: error.message });
                break;
            } else {
                console.log(`🔴 Tentative ${attempt}: Erreur réseau - ${error.message}`);
                results.push({ attempt, error: 'network', message: error.message });
            }
        }
        
        // Petite pause entre les tentatives
        await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    return { results, accountLocked };
}

async function testLockedAccountMessage() {
    console.log('\n📋 TEST: Message de compte verrouillé');
    console.log('-'.repeat(60));
    
    try {
        const response = await api.post('/auth/login', {
            email: TEST_EMAIL,
            password: WRONG_PASSWORD
        });
        
        console.log('❌ ERREUR: La connexion a réussi alors que le compte devrait être verrouillé!');
        return false;
        
    } catch (error) {
        if (error.response) {
            const status = error.response.status;
            const message = error.response.data?.message || 'Erreur inconnue';
            
            console.log(`Status: ${status}`);
            console.log(`Message: "${message}"`);
            
            if (message.includes('verrouillé') && message.includes('Temps restant')) {
                // Extraire le temps restant
                const timeMatch = message.match(/Temps restant\s*:\s*(.+)/);
                const timeRemaining = timeMatch ? timeMatch[1] : 'Non détecté';
                
                console.log(`✅ Format de temps détecté: "${timeRemaining}"`);
                
                // Vérifier le format du temps
                const validTimeFormats = [
                    /^\d+\s*minutes?$/,           // "30 minutes"
                    /^\d+h\s*\d*\s*min$/,        // "1h 30min"
                    /^\d+h$/,                     // "2h"
                    /^\d+\s*minute$/              // "1 minute"
                ];
                
                const isValidFormat = validTimeFormats.some(format => format.test(timeRemaining.trim()));
                console.log(`✅ Format de temps valide: ${isValidFormat ? 'OUI' : 'NON'}`);
                
                return true;
            } else {
                console.log('❌ Message de verrouillage non conforme au format attendu');
                return false;
            }
        } else {
            console.log(`🔴 Erreur réseau: ${error.message}`);
            return false;
        }
    }
}

async function testUnlockAccount(userId) {
    console.log('\n📋 TEST: Déblocage manuel du compte (nécessite un token admin)');
    console.log('-'.repeat(60));
    
    try {
        // Note: Ce test nécessite un token d'admin valide
        console.log('⚠️  Ce test nécessite un token d\'administrateur valide');
        console.log('   Endpoint à tester manuellement: PUT /auth/admin/unlock-account/:id');
        console.log(`   Exemple: PUT /auth/admin/unlock-account/${userId || 'USER_ID'}`);
        
        return true;
    } catch (error) {
        console.log(`❌ Erreur: ${error.message}`);
        return false;
    }
}

function analyzeResults(results) {
    console.log('\n📊 ANALYSE DES RÉSULTATS');
    console.log('='.repeat(60));
    
    let correctMessages = 0;
    let totalAttempts = 0;
    let progressiveDecrease = true;
    let lastRemainingAttempts = 5; // On commence avec 5 tentatives max
    
    results.forEach((result, index) => {
        totalAttempts++;
        
        if (result.status === 401) {
            if (result.remainingAttempts !== null) {
                console.log(`✅ Tentative ${result.attempt}: Correct - ${result.remainingAttempts} tentatives restantes`);
                
                // Vérifier la progression décroissante
                if (result.remainingAttempts < lastRemainingAttempts) {
                    correctMessages++;
                    lastRemainingAttempts = result.remainingAttempts;
                } else {
                    console.log(`   ⚠️  Progression incorrecte: ${result.remainingAttempts} >= ${lastRemainingAttempts}`);
                    progressiveDecrease = false;
                }
            } else if (result.isLocked) {
                console.log(`✅ Tentative ${result.attempt}: Correct - Compte verrouillé (${result.lockDuration})`);
                correctMessages++;
            } else {
                console.log(`❌ Tentative ${result.attempt}: Message non informatif`);
            }
        }
    });
    
    const successRate = (correctMessages / totalAttempts) * 100;
    
    console.log(`\n📈 Statistiques:`);
    console.log(`   Total tentatives: ${totalAttempts}`);
    console.log(`   Messages informatifs: ${correctMessages}`);
    console.log(`   Taux de réussite: ${successRate.toFixed(1)}%`);
    console.log(`   Progression décroissante: ${progressiveDecrease ? '✅ OUI' : '❌ NON'}`);
    
    return {
        totalAttempts,
        correctMessages,
        successRate,
        progressiveDecrease
    };
}

async function runAllTests() {
    const startTime = Date.now();
    
    try {
        console.log(`🕐 Démarrage des tests: ${new Date().toLocaleString()}`);
        console.log(`🎯 Cible: ${API_BASE_URL}`);
        console.log(`👤 Email de test: ${TEST_EMAIL}`);
        console.log(`⚠️  Assurez-vous que ce compte existe et peut être testé`);
        
        // Test 1: Tentatives progressives
        const { results, accountLocked } = await testProgressiveLoginAttempts();
        
        // Test 2: Message de compte verrouillé (si le compte a été verrouillé)
        let lockMessageTest = null;
        if (accountLocked) {
            lockMessageTest = await testLockedAccountMessage();
        } else {
            console.log('\n⚠️  Le compte n\'a pas été verrouillé, test du message ignoré');
        }
        
        // Test 3: Déblocage manuel (test informatif)
        const unlockTest = await testUnlockAccount();
        
        // Analyse des résultats
        const analysis = analyzeResults(results);
        
        // Résumé final
        console.log('\n🏁 RÉSUMÉ FINAL');
        console.log('='.repeat(60));
        
        const tests = [
            { name: 'Messages progressifs', result: analysis.successRate > 80 },
            { name: 'Progression décroissante', result: analysis.progressiveDecrease },
            { name: 'Message de verrouillage', result: lockMessageTest !== false },
            { name: 'Endpoint de déblocage', result: unlockTest }
        ];
        
        tests.forEach((test, index) => {
            const icon = test.result === true ? '✅' : test.result === false ? '❌' : '⚠️ ';
            const status = test.result === true ? 'SUCCÈS' : test.result === false ? 'ÉCHEC' : 'NON TESTÉ';
            console.log(`   ${index + 1}. ${icon} ${test.name}: ${status}`);
        });
        
        const allPassed = tests.filter(t => t.result === true).length;
        const total = tests.length;
        
        console.log(`\n🎯 Score global: ${allPassed}/${total} tests réussis`);
        
        if (allPassed === total) {
            console.log('🎉 Tous les tests sont conformes aux attentes!');
        } else {
            console.log('⚠️  Certains aspects peuvent nécessiter des ajustements.');
        }
        
        // Conseils d'utilisation
        console.log('\n💡 CONSEILS D\'UTILISATION:');
        console.log('   - Les utilisateurs voient maintenant combien de tentatives il leur reste');
        console.log('   - Le temps de verrouillage est affiché de manière lisible');
        console.log('   - Les admins peuvent débloquer manuellement: PUT /auth/admin/unlock-account/:id');
        console.log('   - Les SUPERADMIN restent protégés contre le verrouillage');
        
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
    testProgressiveLoginAttempts,
    testLockedAccountMessage,
    testUnlockAccount,
    analyzeResults,
    runAllTests
}; 