/**
 * Interfaces pour les transactions Orange Money
 * Basées sur la documentation officielle Orange Money API v1.0.0
 * Documentation: https://developer.orange-sonatel.com/documentation
 */

/**
 * Statut d'une transaction Orange Money
 * Doc: Transaction Search > Get transactions
 */
export type OrangeTransactionStatus =
  | 'ACCEPTED'
  | 'CANCELLED'
  | 'FAILED'
  | 'INITIATED'
  | 'PENDING'
  | 'PRE_INITIATED'
  | 'REJECTED'
  | 'SUCCESS';

/**
 * Type de transaction Orange Money
 * Doc: Transaction Search > Get transactions
 */
export type OrangeTransactionType =
  | 'CASHIN'
  | 'MERCHANT_PAYMENT'
  | 'WEB_PAYMENT';

/**
 * Objet Money pour les montants
 * Doc: Standard dans toutes les réponses Orange Money
 */
export interface Money {
  unit: string; // Ex: "XOF"
  value: number; // Montant en francs CFA
}

/**
 * Type d'identifiant (MSISDN ou CODE marchand)
 * Doc: Standard dans l'API Orange Money
 */
export type OrangeIdType = 'MSISDN' | 'CODE';

/**
 * Type de wallet
 * Doc: Mobile Money Account > Get User profile
 */
export type OrangeWalletType = 'PRINCIPAL' | 'SALAIRE' | 'BONUS' | 'INTERNATIONAL';

/**
 * Objet Customer complet dans les réponses de transaction
 * Doc: Transaction Search > Get transactions > Response Schema
 */
export interface FullCustomer {
  id: string; // MSISDN du client (ex: "771234567")
  idType: OrangeIdType;
  walletType?: OrangeWalletType;
}

/**
 * Objet Partner (marchand) complet dans les réponses de transaction
 * Doc: Transaction Search > Get transactions > Response Schema
 */
export interface FullPartner {
  id: string; // Code marchand ou MSISDN du partenaire
  idType: OrangeIdType;
  walletType?: OrangeWalletType;
  encryptedPinCode?: string; // Présent uniquement dans les requêtes, pas dans les réponses
}

/**
 * Structure complète d'une transaction Orange Money
 * Doc: Transaction Search > Get transactions > Response Schema (ligne 200)
 *
 * Exemple de réponse :
 * ```json
 * {
 *   "amount": { "unit": "XOF", "value": 1000 },
 *   "channel": "API",
 *   "createdAt": "2019-08-24T14:15:22Z",
 *   "customer": { "id": "771234567", "idType": "MSISDN", "walletType": "PRINCIPAL" },
 *   "metadata": { "orderId": "123", "orderNumber": "ORD-12345" },
 *   "partner": { "id": "781234567", "idType": "MSISDN", "walletType": "PRINCIPAL" },
 *   "receiveNotification": false,
 *   "reference": "0e3efaa9-2734-49c8-b43d-3884a62b8274",
 *   "requestDate": "2019-08-24T14:15:22Z",
 *   "status": "ACCEPTED",
 *   "statusReason": "string",
 *   "transactionId": "string",
 *   "type": "CASHIN",
 *   "updatedAt": "2019-08-24T14:15:22Z"
 * }
 * ```
 */
export interface OrangeTransaction {
  /** Montant de la transaction */
  amount: Money;

  /** Canal de la transaction (ex: "API", "USSD", etc.) */
  channel: string;

  /** Date et heure de création de la transaction (ISO 8601) */
  createdAt: string;

  /** Informations du client */
  customer: FullCustomer;

  /** Métadonnées personnalisées (max 10 paires clé-valeur) */
  metadata?: Record<string, any>;

  /** Informations du partenaire/marchand */
  partner: FullPartner;

  /** Indique si une notification SMS doit être envoyée */
  receiveNotification: boolean;

  /** Référence externe de la transaction (0-50 caractères) */
  reference: string;

  /** Date et heure de création de la transaction côté client (ISO 8601) */
  requestDate: string;

  /** Statut de la transaction */
  status: OrangeTransactionStatus;

  /** Raison du statut (en cas d'échec) */
  statusReason?: string;

  /** ID unique de la transaction généré par Orange Money (0-50 caractères) */
  transactionId: string;

  /** Type de transaction */
  type: OrangeTransactionType;

  /** Date et heure de dernière mise à jour de la transaction (ISO 8601) */
  updatedAt: string;
}

/**
 * Filtres pour la recherche de transactions
 * Doc: Transaction Search > Get transactions > Query Parameters
 */
export interface OrangeTransactionFilters {
  /** ID du bulk (pour les opérations en masse) */
  bulkId?: string;

  /** Date et heure de début (ISO 8601) */
  fromDateTime?: string;

  /** Numéro de page (défaut: 0, min: 0) */
  page?: number;

  /** Référence externe de la transaction */
  reference?: string;

  /** Nombre de résultats par page (défaut: 20, max: 500) */
  size?: number;

  /** Statut de la transaction */
  status?: OrangeTransactionStatus;

  /** Date et heure de fin (ISO 8601) */
  toDateTime?: string;

  /** ID de la transaction Orange Money */
  transactionId?: string;

  /** Type de transaction */
  type?: OrangeTransactionType;
}

/**
 * Réponse de l'API GET /api/eWallet/v1/transactions
 * Doc: Transaction Search > Get transactions > Response (200)
 */
export interface OrangeTransactionsResponse {
  /** Liste des transactions */
  transactions: OrangeTransaction[];

  /** Nombre total de transactions */
  total?: number;

  /** Numéro de page actuelle */
  page?: number;

  /** Taille de la page */
  size?: number;
}

/**
 * Réponse de l'API GET /api/eWallet/v1/transactions/{transactionId}/status
 * Doc: Transaction Search > Get transaction Status > Response (200)
 */
export interface OrangeTransactionStatusResponse {
  /** Statut de la transaction */
  status: OrangeTransactionStatus;
}

/**
 * Structure d'erreur Orange Money
 * Doc: Errors (page 1)
 *
 * Exemple :
 * ```json
 * {
 *   "type": "bad-request",
 *   "title": "Bad Request",
 *   "instance": "/api/eWallet/v1/payments",
 *   "status": "400",
 *   "code": "2000",
 *   "detail": "Customer account does not exist"
 * }
 * ```
 */
export interface OrangeErrorResponse {
  /** Type d'erreur (ex: "bad-request") */
  type: string;

  /** Titre de l'erreur */
  title: string;

  /** Endpoint qui a généré l'erreur */
  instance: string;

  /** Code HTTP */
  status: string;

  /** Code d'erreur Orange Money (voir doc Error Codes) */
  code?: string;

  /** Description détaillée de l'erreur */
  detail: string;

  /** Violations (pour les erreurs de validation) */
  violations?: Array<{
    field?: string;
    message?: string;
  }>;
}
