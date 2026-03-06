import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PermissionsService } from './permissions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { Role } from '@prisma/client';
import { PermissionsGuard } from './permissions.guard';
import { RequirePermissions } from './permissions.decorator';

@ApiTags('Permissions & Roles')
@Controller('admin/permissions')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@ApiBearerAuth()
export class PermissionsController {
  constructor(private readonly permissionsService: PermissionsService) {}

  /**
   * Récupère toutes les permissions disponibles groupées par module
   */
  @Get('all')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('settings.view')
  @ApiOperation({
    summary: 'Récupère toutes les permissions disponibles',
    description: 'Liste toutes les permissions du système groupées par module',
  })
  @ApiResponse({ status: 200, description: 'Permissions récupérées avec succès' })
  async getAllPermissions() {
    try {
      const permissions = await this.permissionsService.getAllPermissionsGrouped();

      return {
        success: true,
        message: 'Permissions récupérées avec succès',
        data: permissions,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des permissions',
        data: null,
      };
    }
  }

  /**
   * Récupère tous les rôles personnalisés
   */
  @Get('roles')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('users.admins.view')
  @ApiOperation({
    summary: 'Récupère tous les rôles personnalisés',
    description: 'Liste tous les rôles disponibles avec le nombre d\'utilisateurs',
  })
  @ApiResponse({ status: 200, description: 'Rôles récupérés avec succès' })
  async getAllRoles() {
    try {
      const roles = await this.permissionsService.getAllCustomRoles();

      return {
        success: true,
        message: 'Rôles récupérés avec succès',
        data: roles,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des rôles',
        data: null,
      };
    }
  }

  /**
   * Récupère un rôle avec ses permissions et utilisateurs
   */
  @Get('roles/:id')
  @Roles(Role.SUPERADMIN, Role.ADMIN)
  @RequirePermissions('users.admins.view')
  @ApiOperation({
    summary: 'Récupère les détails d\'un rôle',
    description: 'Récupère un rôle avec ses permissions et utilisateurs associés',
  })
  @ApiResponse({ status: 200, description: 'Rôle récupéré avec succès' })
  async getRoleById(@Param('id') id: string) {
    try {
      const role = await this.permissionsService.getCustomRoleWithPermissions(+id);

      if (!role) {
        return {
          success: false,
          message: 'Rôle introuvable',
          data: null,
        };
      }

      return {
        success: true,
        message: 'Rôle récupéré avec succès',
        data: role,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération du rôle',
        data: null,
      };
    }
  }

  /**
   * Récupère les permissions de l'utilisateur connecté
   */
  @Get('my-permissions')
  @Roles(Role.SUPERADMIN, Role.ADMIN, Role.MODERATEUR, Role.SUPPORT, Role.COMPTABLE)
  @ApiOperation({
    summary: 'Récupère les permissions de l\'utilisateur connecté',
    description: 'Liste toutes les permissions que l\'utilisateur possède',
  })
  @ApiResponse({ status: 200, description: 'Permissions récupérées avec succès' })
  async getMyPermissions(@Req() req: any) {
    try {
      const userId = req.user.id;
      const permissions = await this.permissionsService.getUserPermissions(userId);

      return {
        success: true,
        message: 'Permissions récupérées avec succès',
        data: permissions,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la récupération des permissions',
        data: null,
      };
    }
  }

  /**
   * Créer un nouveau rôle personnalisé
   */
  @Post('roles')
  @Roles(Role.SUPERADMIN)
  @RequirePermissions('users.admins.roles')
  @ApiOperation({
    summary: 'Créer un nouveau rôle personnalisé',
    description: 'Crée un nouveau rôle avec les permissions spécifiées',
  })
  @ApiResponse({ status: 201, description: 'Rôle créé avec succès' })
  async createRole(
    @Body()
    data: {
      name: string;
      slug: string;
      description?: string;
      permissionIds?: number[];
    },
  ) {
    try {
      const role = await this.permissionsService.createCustomRole(data);

      return {
        success: true,
        message: 'Rôle créé avec succès',
        data: role,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la création du rôle',
        data: null,
      };
    }
  }

  /**
   * Mettre à jour les permissions d'un rôle
   */
  @Put('roles/:id/permissions')
  @Roles(Role.SUPERADMIN)
  @RequirePermissions('users.admins.roles')
  @ApiOperation({
    summary: 'Mettre à jour les permissions d\'un rôle',
    description: 'Modifie les permissions assignées à un rôle',
  })
  @ApiResponse({ status: 200, description: 'Permissions mises à jour avec succès' })
  async updateRolePermissions(
    @Param('id') id: string,
    @Body() data: { permissionIds: number[] },
  ) {
    try {
      const role = await this.permissionsService.updateRolePermissions(
        +id,
        data.permissionIds,
      );

      return {
        success: true,
        message: 'Permissions du rôle mises à jour avec succès',
        data: role,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la mise à jour des permissions',
        data: null,
      };
    }
  }

  /**
   * Supprimer un rôle personnalisé
   */
  @Delete('roles/:id')
  @Roles(Role.SUPERADMIN)
  @RequirePermissions('users.admins.roles')
  @ApiOperation({
    summary: 'Supprimer un rôle personnalisé',
    description: 'Supprime un rôle non-système s\'il n\'est pas utilisé',
  })
  @ApiResponse({ status: 200, description: 'Rôle supprimé avec succès' })
  async deleteRole(@Param('id') id: string) {
    try {
      const role = await this.permissionsService.deleteCustomRole(+id);

      return {
        success: true,
        message: 'Rôle supprimé avec succès',
        data: role,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Erreur lors de la suppression du rôle',
        data: null,
      };
    }
  }
}
