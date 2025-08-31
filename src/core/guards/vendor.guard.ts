import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class VendorGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    if (![Role.VENDEUR, Role.ADMIN, Role.SUPERADMIN].includes(user.role)) {
      throw new ForbiddenException('Accès refusé - Rôle vendeur requis');
    }

    if (!user.status) {
      throw new ForbiddenException('Compte vendeur inactif');
    }

    return true;
  }
} 