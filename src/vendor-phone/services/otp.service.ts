import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

/**
 * Service de gestion des codes OTP (One-Time Password)
 * Génère et vérifie des codes à 6 chiffres pour la sécurité des téléphones
 */
@Injectable()
export class OTPService {
  /**
   * Génère un code OTP aléatoire à 6 chiffres
   * @returns Code OTP sous forme de chaîne de 6 chiffres
   */
  generateCode(): string {
    // Génère un nombre aléatoire entre 100000 et 999999
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hash un code OTP pour un stockage sécurisé en base de données
   * @param code Le code OTP à hasher
   * @returns Hash bcrypt du code
   */
  async hashCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  /**
   * Vérifie si un code OTP correspond à son hash
   * @param code Le code à vérifier
   * @param hash Le hash stocké en base de données
   * @returns true si le code correspond au hash, false sinon
   */
  async verifyCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  /**
   * Vérifie si un code OTP est expiré
   * @param expiresAt Date d'expiration du code
   * @returns true si le code est expiré, false sinon
   */
  isExpired(expiresAt: Date): boolean {
    return new Date() > expiresAt;
  }

  /**
   * Calcule la date d'expiration d'un code OTP (5 minutes par défaut)
   * @param minutes Durée de validité en minutes (par défaut: 5)
   * @returns Date d'expiration
   */
  getExpirationDate(minutes: number = 5): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }
}
