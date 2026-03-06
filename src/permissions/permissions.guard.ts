import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY, REQUIRE_ANY_PERMISSION_KEY } from './permissions.decorator';
import { PermissionsService } from './permissions.service';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionsService: PermissionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Récupérer les permissions requises depuis le decorator
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Si aucune permission n'est requise, autoriser l'accès
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Récupérer l'utilisateur depuis la requête
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      console.log('❌ [PermissionsGuard] Utilisateur non authentifié');
      return false;
    }

    // Vérifier si on doit exiger toutes les permissions ou juste une
    const requireAny = this.reflector.getAllAndOverride<boolean>(
      REQUIRE_ANY_PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requireAny) {
      // L'utilisateur doit avoir AU MOINS UNE des permissions
      const hasPermission = await this.permissionsService.userHasAnyPermission(
        user.id,
        requiredPermissions,
      );

      if (!hasPermission) {
        console.log(
          `❌ [PermissionsGuard] Utilisateur ${user.id} n'a aucune des permissions requises: ${requiredPermissions.join(', ')}`,
        );
        return false;
      }

      console.log(
        `✅ [PermissionsGuard] Utilisateur ${user.id} a au moins une des permissions requises`,
      );
      return true;
    } else {
      // L'utilisateur doit avoir TOUTES les permissions
      const hasPermissions = await this.permissionsService.userHasAllPermissions(
        user.id,
        requiredPermissions,
      );

      if (!hasPermissions) {
        console.log(
          `❌ [PermissionsGuard] Utilisateur ${user.id} n'a pas toutes les permissions requises: ${requiredPermissions.join(', ')}`,
        );
        return false;
      }

      console.log(
        `✅ [PermissionsGuard] Utilisateur ${user.id} a toutes les permissions requises`,
      );
      return true;
    }
  }
}
