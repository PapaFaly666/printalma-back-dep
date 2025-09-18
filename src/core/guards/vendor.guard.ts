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

    // ✅ Autoriser l'accès aux endpoints de statut de compte même si le compte est désactivé
    const isAccountStatusRoute = (
      (method === 'PATCH' && path.includes('/vendor/account/status')) ||
      (method === 'GET' && path.includes('/vendor/account/status'))
    );

    if (!user.status && !isAccountStatusRoute) {
      throw new ForbiddenException({
        error: 'ACCOUNT_DISABLED',
        message: 'Votre compte vendeur est désactivé. Vous pouvez le réactiver à tout moment.',
        action: 'REACTIVATE_ACCOUNT',
        details: {
          userId: user.id,
          email: user.email,
          canReactivate: true
        }
      });
    }

    return true;
  }
} 