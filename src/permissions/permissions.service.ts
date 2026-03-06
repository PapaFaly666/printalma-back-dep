import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Vérifie si un utilisateur a une permission spécifique
   * @param userId ID de l'utilisateur
   * @param permissionKey Clé de la permission (ex: "products.mockups.view")
   * @returns true si l'utilisateur a la permission
   */
  async userHasPermission(userId: number, permissionKey: string): Promise<boolean> {
    try {
      // Récupérer l'utilisateur avec son rôle et customRole
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
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

      if (!user) {
        return false;
      }

      // SUPERADMIN a toutes les permissions
      if (user.role === Role.SUPERADMIN) {
        return true;
      }

      // Vérifier si l'utilisateur a un customRole avec la permission
      if (user.customRole) {
        const hasPermission = user.customRole.permissions.some(
          (rp) => rp.permission.key === permissionKey,
        );
        return hasPermission;
      }

      return false;
    } catch (error) {
      console.error(`❌ Erreur vérification permission:`, error);
      return false;
    }
  }

  /**
   * Vérifie si un utilisateur a AU MOINS UNE des permissions listées
   * @param userId ID de l'utilisateur
   * @param permissionKeys Liste de clés de permissions
   * @returns true si l'utilisateur a au moins une permission
   */
  async userHasAnyPermission(userId: number, permissionKeys: string[]): Promise<boolean> {
    for (const key of permissionKeys) {
      if (await this.userHasPermission(userId, key)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Vérifie si un utilisateur a TOUTES les permissions listées
   * @param userId ID de l'utilisateur
   * @param permissionKeys Liste de clés de permissions
   * @returns true si l'utilisateur a toutes les permissions
   */
  async userHasAllPermissions(userId: number, permissionKeys: string[]): Promise<boolean> {
    for (const key of permissionKeys) {
      if (!(await this.userHasPermission(userId, key))) {
        return false;
      }
    }
    return true;
  }

  /**
   * Récupère toutes les permissions d'un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Liste des permissions
   */
  async getUserPermissions(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
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

      if (!user) {
        return [];
      }

      // SUPERADMIN a toutes les permissions
      if (user.role === Role.SUPERADMIN) {
        return await this.prisma.permission.findMany();
      }

      if (!user.customRole) {
        return [];
      }

      return user.customRole.permissions.map((rp) => rp.permission);
    } catch (error) {
      console.error(`❌ Erreur récupération permissions:`, error);
      return [];
    }
  }

  /**
   * Récupère tous les rôles personnalisés disponibles
   * @returns Liste des rôles personnalisés
   */
  async getAllCustomRoles() {
    return await this.prisma.customRole.findMany({
      include: {
        _count: {
          select: {
            users: true,
            permissions: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  /**
   * Récupère un rôle personnalisé avec ses permissions
   * @param roleId ID du rôle
   * @returns Rôle avec permissions
   */
  async getCustomRoleWithPermissions(roleId: number) {
    return await this.prisma.customRole.findUnique({
      where: { id: roleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Récupère toutes les permissions disponibles groupées par module
   * @returns Permissions groupées par module
   */
  async getAllPermissionsGrouped() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });

    const grouped: Record<string, any[]> = {};
    for (const perm of permissions) {
      if (!grouped[perm.module]) {
        grouped[perm.module] = [];
      }
      grouped[perm.module].push(perm);
    }

    return grouped;
  }

  /**
   * Met à jour les permissions d'un rôle personnalisé
   * @param roleId ID du rôle
   * @param permissionIds IDs des permissions à assigner
   * @returns Rôle mis à jour
   */
  async updateRolePermissions(roleId: number, permissionIds: number[]) {
    try {
      // Supprimer les permissions existantes
      await this.prisma.rolePermission.deleteMany({
        where: { roleId },
      });

      // Ajouter les nouvelles permissions
      await this.prisma.rolePermission.createMany({
        data: permissionIds.map((permissionId) => ({
          roleId,
          permissionId,
        })),
      });

      return await this.getCustomRoleWithPermissions(roleId);
    } catch (error) {
      console.error(`❌ Erreur mise à jour permissions du rôle:`, error);
      throw error;
    }
  }

  /**
   * Créer un nouveau rôle personnalisé
   * @param data Données du rôle
   * @returns Rôle créé
   */
  async createCustomRole(data: {
    name: string;
    slug: string;
    description?: string;
    permissionIds?: number[];
  }) {
    try {
      const role = await this.prisma.customRole.create({
        data: {
          name: data.name,
          slug: data.slug,
          description: data.description,
          isSystem: false,
        },
      });

      if (data.permissionIds && data.permissionIds.length > 0) {
        await this.prisma.rolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            roleId: role.id,
            permissionId,
          })),
        });
      }

      return await this.getCustomRoleWithPermissions(role.id);
    } catch (error) {
      console.error(`❌ Erreur création rôle:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un rôle personnalisé (sauf rôles système)
   * @param roleId ID du rôle
   * @returns Rôle supprimé
   */
  async deleteCustomRole(roleId: number) {
    try {
      const role = await this.prisma.customRole.findUnique({
        where: { id: roleId },
      });

      if (!role) {
        throw new Error('Rôle introuvable');
      }

      if (role.isSystem) {
        throw new Error('Impossible de supprimer un rôle système');
      }

      // Vérifier s'il y a des utilisateurs avec ce rôle
      const usersCount = await this.prisma.user.count({
        where: { roleId },
      });

      if (usersCount > 0) {
        throw new Error(
          `Impossible de supprimer ce rôle car ${usersCount} utilisateur(s) l'utilisent`,
        );
      }

      await this.prisma.customRole.delete({
        where: { id: roleId },
      });

      return role;
    } catch (error) {
      console.error(`❌ Erreur suppression rôle:`, error);
      throw error;
    }
  }
}
