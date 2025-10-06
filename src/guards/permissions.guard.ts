import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../prisma.service';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Récupérer les permissions requises depuis le décorateur
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si aucune permission n'est requise, autoriser l'accès
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Récupérer l'utilisateur depuis la requête (injecté par JwtAuthGuard)
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Utilisateur non authentifié');
    }

    // Récupérer les permissions de l'utilisateur depuis la base de données
    const userWithPermissions = await this.prisma.user.findUnique({
      where: { id: user.sub },
      include: {
        customRole: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!userWithPermissions) {
      throw new ForbiddenException('Utilisateur non trouvé');
    }

    // ⭐ SUPERADMIN bypass - Le superadmin a TOUTES les permissions
    // Vérifier ANCIEN système (role enum) ET nouveau système (customRole)
    if (
      userWithPermissions.customRole?.slug === 'superadmin' ||
      userWithPermissions.role === 'SUPERADMIN'
    ) {
      return true;
    }

    // Vérifier si l'utilisateur a un rôle avec des permissions
    if (!userWithPermissions.customRole) {
      throw new ForbiddenException(
        'Vous n\'avez pas de rôle assigné. Contactez l\'administrateur.',
      );
    }

    // Extraire les clés de permissions de l'utilisateur
    const userPermissions = userWithPermissions.customRole.permissions.map(
      (rp) => rp.permission.key,
    );

    // Vérifier si l'utilisateur a au moins une des permissions requises
    const hasPermission = requiredPermissions.some((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Accès refusé. Vous n'avez pas la permission nécessaire pour effectuer cette action.`,
      );
    }

    return true;
  }
}
