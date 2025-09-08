/**
 * Utilitaires pour le système de commission PrintAlma
 * 
 * @file commission-utils.ts
 * @author PrintAlma Team
 * @version 1.0.0
 */

export interface RevenueSplit {
  totalAmount: number;
  commissionRate: number;
  commissionAmount: number;
  vendorRevenue: number;
}

export interface CommissionValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Valide un taux de commission
 * @param rate Taux de commission à valider
 * @returns True si le taux est valide, false sinon
 */
export function validateCommissionRate(rate: any): rate is number {
  if (typeof rate !== 'number' || isNaN(rate)) {
    return false;
  }
  
  return rate >= 0 && rate <= 100;
}

/**
 * Validation complète avec message d'erreur détaillé
 * @param rate Taux de commission à valider
 * @returns Résultat de validation avec message d'erreur si applicable
 */
export function validateCommissionRateDetailed(rate: any): CommissionValidationResult {
  if (rate === null || rate === undefined) {
    return {
      isValid: false,
      error: 'Le taux de commission est requis'
    };
  }

  if (typeof rate !== 'number') {
    return {
      isValid: false,
      error: 'Le taux de commission doit être un nombre'
    };
  }

  if (isNaN(rate)) {
    return {
      isValid: false,
      error: 'Le taux de commission doit être un nombre valide'
    };
  }

  if (rate < 0) {
    return {
      isValid: false,
      error: 'Le taux de commission ne peut pas être négatif'
    };
  }

  if (rate > 100) {
    return {
      isValid: false,
      error: 'Le taux de commission ne peut pas dépasser 100%'
    };
  }

  return { isValid: true };
}

/**
 * Calcule la répartition des revenus entre commission et vendeur
 * @param totalAmount Montant total de la vente
 * @param commissionRate Taux de commission (0-100)
 * @returns Répartition détaillée des revenus
 */
export function calculateRevenueSplit(totalAmount: number, commissionRate: number): RevenueSplit {
  if (!validateCommissionRate(commissionRate)) {
    throw new Error('Taux de commission invalide');
  }

  if (totalAmount < 0) {
    throw new Error('Le montant total ne peut pas être négatif');
  }

  const commission = (totalAmount * commissionRate) / 100;
  const vendorRevenue = totalAmount - commission;

  return {
    totalAmount,
    commissionRate,
    commissionAmount: Math.round(commission * 100) / 100, // Arrondi à 2 décimales
    vendorRevenue: Math.round(vendorRevenue * 100) / 100, // Arrondi à 2 décimales
  };
}

/**
 * Formate un montant en Francs CFA
 * @param amount Montant à formater
 * @returns Montant formaté en FCFA
 */
export function formatCFA(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return '0 FCFA';
  }

  return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
}

/**
 * Formate un taux de commission pour l'affichage
 * @param rate Taux de commission
 * @returns Taux formaté avec le symbole %
 */
export function formatCommissionRate(rate: number): string {
  if (typeof rate !== 'number' || isNaN(rate)) {
    return '0%';
  }

  return `${rate.toFixed(1)}%`;
}

/**
 * Normalise un taux de commission pour le stockage en base
 * @param rate Taux de commission (peut être une string ou un number)
 * @returns Taux normalisé en number avec 2 décimales max
 */
export function normalizeCommissionRate(rate: string | number): number {
  let numRate: number;

  if (typeof rate === 'string') {
    numRate = parseFloat(rate);
  } else {
    numRate = rate;
  }

  if (isNaN(numRate)) {
    throw new Error('Impossible de convertir le taux de commission');
  }

  // Arrondir à 2 décimales maximum
  return Math.round(numRate * 100) / 100;
}

/**
 * Calcule les statistiques de commission pour un ensemble de vendeurs
 * @param commissions Liste des taux de commission
 * @returns Statistiques calculées
 */
export function calculateCommissionStats(commissions: number[]) {
  if (!commissions.length) {
    return {
      average: 0,
      min: 0,
      max: 0,
      total: 0,
      count: 0
    };
  }

  const total = commissions.length;
  const sum = commissions.reduce((acc, rate) => acc + rate, 0);
  const average = sum / total;
  const min = Math.min(...commissions);
  const max = Math.max(...commissions);

  return {
    average: Math.round(average * 100) / 100,
    min,
    max,
    total,
    count: total
  };
}

/**
 * Valide si un utilisateur peut gérer les commissions (admin/superadmin)
 * @param userRole Rôle de l'utilisateur
 * @returns True si l'utilisateur peut gérer les commissions
 */
export function canManageCommissions(userRole: string): boolean {
  return ['ADMIN', 'SUPERADMIN'].includes(userRole?.toUpperCase());
}

/**
 * Génère un message d'audit pour un changement de commission
 * @param oldRate Ancien taux
 * @param newRate Nouveau taux
 * @param adminName Nom de l'admin qui fait le changement
 * @param vendorName Nom du vendeur concerné
 * @returns Message d'audit formaté
 */
export function generateAuditMessage(
  oldRate: number | null,
  newRate: number,
  adminName: string,
  vendorName: string
): string {
  if (oldRate === null) {
    return `Commission initiale définie à ${formatCommissionRate(newRate)} pour ${vendorName} par ${adminName}`;
  }
  
  return `Commission de ${vendorName} modifiée de ${formatCommissionRate(oldRate)} à ${formatCommissionRate(newRate)} par ${adminName}`;
}