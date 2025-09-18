import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import * as process from 'process';
import { PrismaService } from '../prisma.service';

export interface UserPayload {
  sub: number;
  email: string;
  role: string;
  vendeur_type: string;
  firstName: string;
  lastName: string;
}

export interface RequestWithUser extends Request {
  user: {
    sub: number;
    email: string;
    role: string;
    vendeur_type: string;
    firstName: string;
    lastName: string;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // Extraire le token JWT des cookies (multiple noms possibles)
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          // Essayer plusieurs noms de cookies
          const token = request?.cookies?.auth_token || 
                       request?.cookies?.jwt || 
                       request?.cookies?.authToken ||
                       request?.cookies?.access_token;
          
          if (!token) {
            return null;
          }
          
          // Log pour debugging (à retirer en production)
          console.log(`🍪 Token trouvé dans cookies:`, {
            auth_token: !!request?.cookies?.auth_token,
            jwt: !!request?.cookies?.jwt,
            authToken: !!request?.cookies?.authToken,
            access_token: !!request?.cookies?.access_token
          });
          
          return token;
        },
        // Fallback - extraire du header Authorization si pas dans les cookies
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      passReqToCallback: true, // Pour avoir accès à la requête dans validate
    });
  }

  async validate(request: Request, payload: UserPayload) {
    // Log pour debugging (à retirer en production)
    console.log(`🔍 Validation JWT pour utilisateur:`, {
      sub: payload.sub,
      email: payload.email,
      role: payload.role
    });

    // Vérifier que l'utilisateur existe toujours en base et est actif
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!user) {
      console.log(`❌ Utilisateur ${payload.sub} non trouvé en base`);
      throw new UnauthorizedException('Utilisateur non trouvé');
    }

    // ⚠️ Ne pas bloquer l'authentification si le vendeur est inactif.
    // Le blocage d'accès aux routes sensibles est géré par VendorGuard.

    // ⭐ CORRECTION: Ne plus restreindre par rôle ici
    // Laisser les guards spécifiques (VendorGuard, AdminGuard) gérer les autorisations
    console.log(`✅ Authentification réussie pour ${user.email} (ID: ${user.id}, Rôle: ${user.role})`);

    // Retourner les informations de l'utilisateur qui seront accessibles via req.user
    return {
      id: user.id,
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      vendeur_type: payload.vendeur_type || user.vendeur_type,
      firstName: payload.firstName,
      lastName: payload.lastName,
      status: user.status // Ajouter le statut pour le VendorGuard
    };
  }
}