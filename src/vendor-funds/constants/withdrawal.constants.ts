/**
 * 💰 Constantes pour la gestion des appels de fonds vendeurs
 */

/**
 * Montant minimum de retrait en FCFA
 * @constant {number}
 */
export const MIN_WITHDRAWAL_AMOUNT = 5000;

/**
 * Montant maximum de retrait en FCFA (optionnel)
 * @constant {number}
 */
export const MAX_WITHDRAWAL_AMOUNT = 10_000_000; // 10 millions FCFA

/**
 * Nombre maximum de demandes de retrait par jour
 * @constant {number}
 */
export const MAX_WITHDRAWALS_PER_DAY = 3;

/**
 * Méthodes de paiement acceptées
 * @constant {string[]}
 */
export const VALID_PAYMENT_METHODS = ['WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER'] as const;

/**
 * Statuts des demandes de fonds
 */
export const FUNDS_REQUEST_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  PAID: 'PAID',
  REJECTED: 'REJECTED',
} as const;
