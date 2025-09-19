import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class VendorGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const method = request.method as string;
    const path = (request.originalUrl || request.url || '').toString();

    if (!user) {
      throw new ForbiddenException({
        error: 'AUTHENTICATION_REQUIRED',
        message: 'Vous devez être connecté pour accéder à cette section',
        action: 'LOGIN_REQUIRED'
      });
    }

    if (![Role.VENDEUR, Role.ADMIN, Role.SUPERADMIN].includes(user.role)) {
      throw new ForbiddenException({
        error: 'INSUFFICIENT_PERMISSIONS',
        message: 'Cette section est réservée aux vendeurs',
        action: 'CONTACT_SUPPORT'
      });
    }

    // ✅ ACCÈS COMPLET POUR VENDEURS DÉSACTIVÉS
    // Les vendeurs désactivés gardent l'accès total à leur panel d'administration
    // Seule la visibilité publique de leurs produits est affectée

    return true;
  }
} 