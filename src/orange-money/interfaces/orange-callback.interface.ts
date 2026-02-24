/**
 * Interfaces pour les callbacks webhook Orange Money
 * Basées sur la documentation officielle Orange Money API v1.0.0
 */

import { Money, FullCustomer, FullPartner, OrangeTransactionStatus, OrangeTransactionType } from './orange-transaction.interface';

/**
 * Format COMPLET du callback Orange Money
 * Reçu via POST sur votre callbackUrl après un paiement
 *
 * Doc: Merchant Payment > Generate QR Code > Callback payload samples
 *
 * Exemple :
 * ```json
 * {
 *   "amount": { "value": 2, "unit": "XOF" },
 *   "partner": { "idType": "CODE", "id": "12345" },
 *   "customer": { "idType": "MSISDN", "id": 786258731 },
 *   "reference": "eaed4551-8f07-497d-afb4-ded49d9e92d6",
 *   "type": "MERCHANT_PAYMENT",
 *   "channel": "API",
 *   "transactionId": "MP220928.1029.C58502",
 *   "paymentMethod": "QRCODE",
 *   "status": "SUCCESS",
 *   "metadata": { "orderId": "123", "orderNumber": "ORD-12345" }
 * }
 * ```
 */
export interface OrangeCallbackPayloadFull {
  /** Montant de la transaction */
  amount: Money;

  /** Informations du partenaire/marchand */
  partner: FullPartner;

  /** Informations du client */
  customer: FullCustomer;

  /** Référence UUID générée par Orange Money */
  reference: string;

  /** Type de transaction */
  type: OrangeTransactionType;

  /** Canal de la transaction (ex: "API") */
  channel: string;

  /** ID unique de la transaction Orange Money (ex: "MP220928.1029.C58502") */
  transactionId: string;

  /** Méthode de paiement (ex: "QRCODE", "USSD", etc.) */
  paymentMethod: string;

  /** Statut de la transaction */
  status: OrangeTransactionStatus;

  /** Métadonnées personnalisées que vous avez envoyées lors de la génération du QR Code */
  metadata?: Record<string, any>;
}

/**
 * Format SIMPLIFIÉ du callback Orange Money
 * Certaines implémentations Orange Money peuvent envoyer un format plus simple
 *
 * Exemple :
 * ```json
 * {
 *   "transactionId": "MP240224.1234.AB3456",
 *   "status": "SUCCESS",
 *   "amount": { "value": 2500, "unit": "XOF" },
 *   "reference": "uuid-12345-xyz",
 *   "type": "MERCHANT_PAYMENT"
 * }
 * ```
 */
export interface OrangeCallbackPayloadSimple {
  /** ID unique de la transaction Orange Money */
  transactionId: string;

  /** Statut de la transaction */
  status: OrangeTransactionStatus;

  /** Montant de la transaction */
  amount: Money;

  /** Référence de la transaction */
  reference: string;

  /** Type de transaction */
  type: OrangeTransactionType;
}

/**
 * Union des deux formats de callback possibles
 * Votre handler doit gérer les deux cas
 */
export type OrangeCallbackPayload = OrangeCallbackPayloadFull | OrangeCallbackPayloadSimple;

/**
 * Payload pour enregistrer le callback URL auprès d'Orange Money
 * Doc: Webhooks > Set Merchant CallBack
 *
 * Endpoint: POST /api/notification/v1/merchantcallback
 *
 * Exemple :
 * ```json
 * {
 *   "apiKey": "YOUR_API_KEY",
 *   "code": "123456",
 *   "name": "My Store Callback",
 *   "callbackUrl": "https://mybackend.com/orange-money/callback"
 * }
 * ```
 */
export interface OrangeSetCallbackPayload {
  /** Clé API fournie par Orange Money pour authentifier le callback */
  apiKey: string;

  /** Code marchand (6 chiffres) */
  code: string;

  /** Nom descriptif du callback */
  name: string;

  /** URL HTTPS où Orange Money enverra les callbacks POST */
  callbackUrl: string;
}

/**
 * Réponse de GET /api/notification/v1/merchantcallback
 * Doc: Webhooks > Get merchant CallBack
 *
 * Exemple :
 * ```json
 * [
 *   {
 *     "apiKey": "YOUR_API_KEY",
 *     "callbackUrl": "https://mybackend.com/orange-money/callback",
 *     "code": "123456",
 *     "name": "My Store Callback"
 *   }
 * ]
 * ```
 */
export interface OrangeGetCallbackResponse {
  /** Clé API */
  apiKey: string;

  /** URL de callback enregistrée */
  callbackUrl: string;

  /** Code marchand */
  code: string;

  /** Nom du callback */
  name: string;
}

/**
 * Helper pour vérifier si le callback est au format complet
 */
export function isFullCallbackPayload(
  payload: OrangeCallbackPayload,
): payload is OrangeCallbackPayloadFull {
  return 'partner' in payload && 'customer' in payload && 'channel' in payload;
}

/**
 * Helper pour vérifier si le callback est au format simplifié
 */
export function isSimpleCallbackPayload(
  payload: OrangeCallbackPayload,
): payload is OrangeCallbackPayloadSimple {
  return !('partner' in payload) && !('customer' in payload);
}

/**
 * Helper pour extraire l'orderNumber d'un callback, quel que soit son format
 *
 * Logique :
 * 1. Si format complet avec metadata.orderNumber → utiliser metadata.orderNumber
 * 2. Si format simple avec reference → chercher la commande par transactionId/reference
 *
 * @param payload - Payload du callback Orange Money
 * @returns orderNumber si trouvé, undefined sinon
 */
export function extractOrderNumber(payload: OrangeCallbackPayload): string | undefined {
  if (isFullCallbackPayload(payload)) {
    return payload.metadata?.orderNumber;
  }

  // Pour le format simple, on ne peut pas extraire directement l'orderNumber
  // Il faudra chercher dans la BDD par transactionId ou reference
  return undefined;
}
