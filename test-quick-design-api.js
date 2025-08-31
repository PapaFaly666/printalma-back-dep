const { exec } = require('child_process');
const util = require('util');

const execAsync = util.promisify(exec);

async function quickTestDesign() {
  console.log('🚀 Test rapide de l\'API Design');
  console.log('==============================\n');
  
  try {
    // 1. Test simple de connexion au serveur
    console.log('📡 Test 1: Connexion serveur...');
    try {
      const { stdout } = await execAsync('curl -s -o /dev/null -w "%{http_code}" http://localhost:3004/api/products');
      console.log(`   Code de retour: ${stdout}`);
      
      if (stdout.trim() === '200') {
        console.log('✅ Serveur accessible et fonctionnel');
      } else {
        console.log('❌ Serveur non accessible - Démarrez le serveur avec: npm run start:dev');
        return false;
      }
    } catch (error) {
      console.log('❌ Serveur non accessible - Démarrez le serveur avec: npm run start:dev');
      return false;
    }
    
    // 2. Test de l'authentification
    console.log('\n🔐 Test 2: Authentification...');
    const loginCommand = `curl -s -X POST http://localhost:3004/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\": \\"test@vendor.com\\", \\"password\\": \\"testpassword\\"}"`;
    
    try {
      const { stdout } = await execAsync(loginCommand);
      const response = JSON.parse(stdout);
      
      if (response.access_token) {
        console.log('✅ Authentification réussie');
        console.log(`   Token: ${response.access_token.substring(0, 20)}...`);
        
        // 3. Test de récupération des designs
        console.log('\n📋 Test 3: Récupération des designs...');
        const getDesignsCommand = `curl -s -H "Authorization: Bearer ${response.access_token}" http://localhost:3004/api/designs`;
        
        const { stdout: designsResponse } = await execAsync(getDesignsCommand);
        const designsData = JSON.parse(designsResponse);
        
        if (designsData.success) {
          console.log('✅ Récupération des designs réussie');
          console.log(`   Nombre de designs: ${designsData.data.designs.length}`);
          console.log(`   Total: ${designsData.data.stats.total}`);
          console.log(`   Publiés: ${designsData.data.stats.published}`);
          console.log(`   Brouillons: ${designsData.data.stats.draft}`);
        } else {
          console.log('❌ Erreur récupération designs:', designsData);
        }
        
        // 4. Test des statistiques
        console.log('\n📊 Test 4: Statistiques...');
        const statsCommand = `curl -s -H "Authorization: Bearer ${response.access_token}" http://localhost:3004/api/designs/stats/overview`;
        
        const { stdout: statsResponse } = await execAsync(statsCommand);
        const statsData = JSON.parse(statsResponse);
        
        if (statsData.success) {
          console.log('✅ Statistiques récupérées');
          console.log(`   Total designs: ${statsData.data.total}`);
          console.log(`   Gains totaux: ${statsData.data.totalEarnings} FCFA`);
          console.log(`   Vues totales: ${statsData.data.totalViews}`);
        } else {
          console.log('❌ Erreur statistiques:', statsData);
        }
        
        return true;
        
      } else {
        console.log('❌ Erreur d\'authentification:', response);
        return false;
      }
    } catch (error) {
      console.log('❌ Erreur lors du test d\'authentification:', error.message);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Erreur générale:', error);
    return false;
  }
}

async function runServerAndTest() {
  console.log('🎯 Démarrage du serveur et tests complets...\n');
  
  // Démarrer le serveur en arrière-plan
  console.log('🚀 Démarrage du serveur...');
  const serverProcess = exec('npm run start:dev');
  
  // Attendre un peu que le serveur démarre
  console.log('⏳ Attente du démarrage (15 secondes)...');
  await new Promise(resolve => setTimeout(resolve, 15000));
  
  // Exécuter les tests
  const testResult = await quickTestDesign();
  
  if (testResult) {
    console.log('\n🎉 Tous les tests de base sont passés !');
    console.log('\n📚 Endpoints API disponibles:');
    console.log('=============================');
    console.log('POST   /api/designs                 - Créer un design');
    console.log('GET    /api/designs                 - Liste des designs');
    console.log('GET    /api/designs/:id             - Détails d\'un design');
    console.log('PUT    /api/designs/:id             - Modifier un design');
    console.log('PATCH  /api/designs/:id/publish     - Publier/dépublier');
    console.log('DELETE /api/designs/:id             - Supprimer un design');
    console.log('GET    /api/designs/stats/overview  - Statistiques');
    
    console.log('\n💡 Pour tester la création avec fichier:');
    console.log('curl -X POST http://localhost:3004/api/designs \\');
    console.log('  -H "Authorization: Bearer <YOUR_TOKEN>" \\');
    console.log('  -F "file=@image.png" \\');
    console.log('  -F "name=Mon Logo" \\');
    console.log('  -F "description=Description du logo" \\');
    console.log('  -F "price=2500" \\');
    console.log('  -F "category=logo" \\');
    console.log('  -F "tags=logo,test"');
  } else {
    console.log('\n⚠️ Certains tests ont échoué. Vérifiez les logs ci-dessus.');
  }
  
  // Arrêter le serveur
  console.log('\n🛑 Arrêt du serveur...');
  serverProcess.kill();
}

// Détecter la commande à exécuter
const command = process.argv[2];

if (command === 'full') {
  runServerAndTest().catch(console.error);
} else {
  quickTestDesign().catch(console.error);
}

module.exports = { quickTestDesign, runServerAndTest }; 