/**
 * Script de test pour envoyer un email de facture
 * Usage: node test-send-email-order.js <ORDER_NUMBER>
 * Exemple: node test-send-email-order.js ORD-1234567890
 */

const axios = require('axios');

const API_BASE_URL = process.env.API_URL || 'http://localhost:3000';

async function testSendInvoiceEmail(orderNumber) {
  try {
    console.log(`\n📧 Test d'envoi d'email pour la commande ${orderNumber}\n`);

    // Endpoint de test existant
    const response = await axios.post(
      `${API_BASE_URL}/orders/${orderNumber}/send-invoice`
    );

    console.log('✅ Résultat:', response.data);

    if (response.data.success) {
      console.log(`\n✅ Email envoyé avec succès à ${response.data.data.email}`);
    }
  } catch (error) {
    console.error('\n❌ Erreur lors de l\'envoi:', error.response?.data || error.message);

    if (error.response?.status === 404) {
      console.log('\n💡 La commande n\'existe pas. Assurez-vous que le numéro est correct.');
    } else if (error.response?.status === 400) {
      console.log('\n💡 La commande n\'a pas d\'email associé.');
      console.log('   Vérifiez que l\'email a été fourni lors de la création de la commande.');
    }
  }
}

// Récupérer le numéro de commande depuis les arguments
const orderNumber = process.argv[2];

if (!orderNumber) {
  console.error('❌ Usage: node test-send-email-order.js <ORDER_NUMBER>');
  console.error('   Exemple: node test-send-email-order.js ORD-1234567890');
  process.exit(1);
}

testSendInvoiceEmail(orderNumber);
