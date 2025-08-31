import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Vérifier si l'utilisateur a le rôle ADMIN ou SUPERADMIN
    if (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN) {
      throw new ForbiddenException('Accès refusé : droits administrateur requis');
    }

    return true;
  }
} 