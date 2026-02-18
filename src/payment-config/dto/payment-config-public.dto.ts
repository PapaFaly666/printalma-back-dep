/**
 * DTO pour exposer les informations de configuration de paiement au frontend
 * Ne contient que les informations publiques et sécurisées
 */
export class PaymentConfigPublicDto {
  provider: string;
  isActive: boolean;
  mode: string; // 'test' ou 'live'
  publicKey?: string;
  apiUrl: string; // URL calculée selon le mode
}
