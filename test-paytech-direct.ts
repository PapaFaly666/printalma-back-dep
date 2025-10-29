import axios from 'axios';

const API_KEY = 'f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa';
const API_SECRET = '70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b';

async function testPayTech() {
  try {
    console.log('🔄 Test de l\'API PayTech...\n');

    const payload = {
      item_name: "Test Order",
      item_price: 1000,
      ref_command: `TEST-${Date.now()}`,
      command_name: "Test Payment",
      currency: "XOF",
      env: "test",
      ipn_url: "https://webhook.site/f6e65778-b5b6-4050-9dfe-2e6ec6f84b69",
      success_url: "http://localhost:5174/payment/success",
      cancel_url: "http://localhost:5174/payment/cancel",
      custom_field: JSON.stringify({ test: true })
    };

    console.log('📤 Payload envoyé:');
    console.log(JSON.stringify(payload, null, 2));
    console.log('\n');

    const response = await axios.post(
      'https://paytech.sn/api/payment/request-payment',
      payload,
      {
        headers: {
          'API_KEY': API_KEY,
          'API_SECRET': API_SECRET,
          'Content-Type': 'application/json',
        }
      }
    );

    console.log('✅ Succès!\n');
    console.log('📥 Réponse PayTech:');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.redirect_url || response.data.redirectUrl) {
      const url = response.data.redirect_url || response.data.redirectUrl;
      console.log('\n🔗 URL DE PAIEMENT:');
      console.log(url);
      console.log('\n👉 Copiez cette URL dans votre navigateur pour tester le paiement');
    }

  } catch (error: any) {
    console.error('❌ Erreur:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

testPayTech();
