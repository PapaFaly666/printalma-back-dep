import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AssignPermissionsDto } from './dto/assign-permissions.dto';
import * as bcrypt from 'bcrypt';
import { UserStatus } from '@prisma/client';

@Injectable()
export class AdminUsersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer tous les utilisateurs avec filtres et pagination
   * Exclut automatiquement les utilisateurs avec le rôle "vendor"
   */
  async findAll(query: ListUsersQueryDto) {
    const { search, roleId, status, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Récupérer le rôle "vendor" pour l'exclure
    const vendorRole = await this.prisma.customRole.findUnique({
      where: { slug: 'vendor' },
    });

    // Construire les filtres
    const where: any = {
      is_deleted: false,
    };

    // Exclure les utilisateurs avec le rôle vendor
    if (vendorRole) {
      where.NOT = {
        roleId: vendorRole.id,
      };
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (status) {
      where.userStatus = status as UserStatus;
    }

    // Récupérer le total et les utilisateurs
    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
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
        orderBy: {
          created_at: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    // Formater les résultats
    const formattedUsers = users.map((user) => {
      // Gérer le cas où firstName ou lastName sont null/undefined
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || user.email;

      return {
        id: user.id,
        name: fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || user.profile_photo_url,
        status: user.userStatus,
        role: user.customRole
          ? {
              id: user.customRole.id,
              name: user.customRole.name,
              slug: user.customRole.slug,
              permissions: user.customRole.permissions.map((rp) => rp.permission),
            }
          : null,
        roleId: user.roleId,
        emailVerified: user.email_verified,
        lastLogin: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    });

    return {
      success: true,
      data: {
        users: formattedUsers,
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Récupérer un utilisateur par ID
   */
  async findOne(id: number) {
    const user = await this.prisma.user.findFirst({
      where: { id, is_deleted: false },
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
        createdByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Gérer le cas où firstName ou lastName sont null/undefined
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim() || user.email;

    // Gérer le createdBy
    const createdByName = user.createdByUser
      ? `${user.createdByUser.firstName || ''} ${user.createdByUser.lastName || ''}`.trim()
      : null;

    return {
      success: true,
      data: {
        id: user.id,
        name: fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        avatar: user.avatar || user.profile_photo_url,
        status: user.userStatus,
        role: user.customRole
          ? {
              id: user.customRole.id,
              name: user.customRole.name,
              slug: user.customRole.slug,
              permissions: user.customRole.permissions.map((rp) => rp.permission),
            }
          : null,
        roleId: user.roleId,
        emailVerified: user.email_verified,
        lastLogin: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        createdBy: createdByName,
      },
    };
  }

  /**
   * Créer un nouvel utilisateur
   */
  async create(dto: CreateUserDto, createdBy?: number) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException('Cet email est déjà utilisé');
    }

    // Vérifier que le rôle existe
    const role = await this.prisma.customRole.findUnique({
      where: { id: dto.roleId },
    });

    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    // Enforcer: seuls les SUPERADMIN peuvent créer des comptes ADMIN ou SUPERADMIN
    if (role.slug === 'admin' || role.slug === 'superadmin') {
      // Récupérer le créateur et son rôle (enum et RBAC customRole)
      const creator = createdBy
        ? await this.prisma.user.findUnique({
            where: { id: createdBy },
            include: { customRole: true },
          })
        : null;

      const creatorRoleSlug = creator?.customRole?.slug;
      const creatorEnumRole = creator?.role; // enum Role.SUPERADMIN | ADMIN | VENDEUR

      const isCreatorSuperadmin =
        creatorRoleSlug === 'superadmin' || creatorEnumRole === ('SUPERADMIN' as any);

      if (!isCreatorSuperadmin) {
        throw new ForbiddenException(
          "Seul un SUPERADMIN peut créer des utilisateurs avec le rôle 'admin' ou 'superadmin'",
        );
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Séparer le nom en prénom et nom
    const nameParts = dto.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || firstName;

    // Créer l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        roleId: dto.roleId,
        userStatus: (dto.status as UserStatus) || UserStatus.ACTIVE,
        created_by: createdBy,
      },
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

    return {
      success: true,
      message: 'Utilisateur créé avec succès',
      data: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone,
        status: user.userStatus,
        roleId: user.roleId,
        createdAt: user.created_at,
      },
    };
  }

  /**
   * Mettre à jour un utilisateur
   */
  async update(id: number, dto: UpdateUserDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findFirst({
      where: { id, is_deleted: false },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier l'unicité de l'email si modifié
    if (dto.email && dto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existingUser) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Vérifier que le rôle existe si modifié
    if (dto.roleId) {
      const role = await this.prisma.customRole.findUnique({
        where: { id: dto.roleId },
      });

      if (!role) {
        throw new NotFoundException('Rôle non trouvé');
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};

    if (dto.name) {
      const nameParts = dto.name.trim().split(' ');
      updateData.firstName = nameParts[0];
      updateData.lastName = nameParts.slice(1).join(' ') || nameParts[0];
    }

    if (dto.email) updateData.email = dto.email;
    if (dto.phone !== undefined) updateData.phone = dto.phone;
    if (dto.roleId) updateData.roleId = dto.roleId;
    if (dto.status) updateData.userStatus = dto.status as UserStatus;

    // Mettre à jour l'utilisateur
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        customRole: true,
      },
    });

    return {
      success: true,
      message: 'Utilisateur mis à jour avec succès',
      data: {
        id: updatedUser.id,
        name: `${updatedUser.firstName} ${updatedUser.lastName}`,
        email: updatedUser.email,
        phone: updatedUser.phone,
        status: updatedUser.userStatus,
        roleId: updatedUser.roleId,
        updatedAt: updatedUser.updated_at,
      },
    };
  }

  /**
   * Supprimer un utilisateur (soft delete)
   */
  async remove(id: number, deletedBy?: number) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findFirst({
      where: { id, is_deleted: false },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Soft delete
    await this.prisma.user.update({
      where: { id },
      data: {
        is_deleted: true,
        deleted_at: new Date(),
        deleted_by: deletedBy,
      },
    });

    return {
      success: true,
      message: 'Utilisateur supprimé avec succès',
    };
  }

  /**
   * Réinitialiser le mot de passe d'un utilisateur
   */
  async resetPassword(id: number, dto: ResetPasswordDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findFirst({
      where: { id, is_deleted: false },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Hasher le nouveau mot de passe
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Mettre à jour le mot de passe
    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        must_change_password: true,
      },
    });

    return {
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
    };
  }

  /**
   * Changer le statut d'un utilisateur
   */
  async updateStatus(id: number, dto: UpdateStatusDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findFirst({
      where: { id, is_deleted: false },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Mettre à jour le statut
    await this.prisma.user.update({
      where: { id },
      data: {
        userStatus: dto.status as UserStatus,
      },
    });

    return {
      success: true,
      message: 'Statut mis à jour avec succès',
    };
  }

  /**
   * Récupérer les statistiques des utilisateurs
   */
  async getStats() {
    const [total, active, inactive, suspended, usersByRole] = await Promise.all([
      this.prisma.user.count({ where: { is_deleted: false } }),
      this.prisma.user.count({
        where: { is_deleted: false, userStatus: UserStatus.ACTIVE },
      }),
      this.prisma.user.count({
        where: { is_deleted: false, userStatus: UserStatus.INACTIVE },
      }),
      this.prisma.user.count({
        where: { is_deleted: false, userStatus: UserStatus.SUSPENDED },
      }),
      this.prisma.user.groupBy({
        by: ['roleId'],
        where: { is_deleted: false },
        _count: true,
      }),
    ]);

    // Récupérer les noms des rôles
    const roleIds = usersByRole.map((r) => r.roleId).filter((id) => id !== null);
    const roles = await this.prisma.customRole.findMany({
      where: { id: { in: roleIds as number[] } },
      select: { id: true, slug: true },
    });

    const byRole: Record<string, number> = {};
    usersByRole.forEach((item) => {
      if (item.roleId) {
        const role = roles.find((r) => r.id === item.roleId);
        if (role) {
          byRole[role.slug] = item._count;
        }
      }
    });

    return {
      success: true,
      data: {
        total,
        active,
        inactive,
        suspended,
        byRole,
      },
    };
  }

  /**
   * Lister uniquement les utilisateurs avec rôles admin/superadmin
   */
  async findAdminsOnly(query: ListUsersQueryDto) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    // Récupérer les rôles admin et superadmin
    const roles = await this.prisma.customRole.findMany({
      where: { slug: { in: ['admin', 'superadmin'] } },
      select: { id: true, slug: true },
    });

    const roleIds = roles.map((r) => r.id);
    if (roleIds.length === 0) {
      return { success: true, data: { users: [], total: 0, page, limit } };
    }

    const where: any = {
      is_deleted: false,
      roleId: { in: roleIds },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        include: {
          customRole: {
            select: { id: true, name: true, slug: true },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const formattedUsers = users.map((user) => {
      const firstName = user.firstName || '';
      const lastName = user.lastName || '';
      const fullName = `${firstName} ${lastName}`.trim() || user.email;
      return {
        id: user.id,
        name: fullName,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        status: user.userStatus,
        role: user.customRole
          ? { id: user.customRole.id, name: user.customRole.name, slug: user.customRole.slug }
          : null,
        roleId: user.roleId,
        emailVerified: user.email_verified,
        lastLogin: user.last_login_at,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    });

    return {
      success: true,
      data: { users: formattedUsers, total, page, limit },
    };
  }

  /**
   * Récupérer les permissions d'un utilisateur
   */
  async getUserPermissions(userId: number) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, is_deleted: false },
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
      throw new NotFoundException('Utilisateur non trouvé');
    }

    const permissions = user.customRole
      ? user.customRole.permissions.map((rp) => rp.permission)
      : [];

    return {
      success: true,
      data: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        role: user.customRole
          ? {
              id: user.customRole.id,
              name: user.customRole.name,
              slug: user.customRole.slug,
            }
          : null,
        permissions,
      },
    };
  }

  /**
   * Attribuer des permissions personnalisées à un utilisateur
   * Crée un rôle personnalisé unique pour cet utilisateur
   */
  async assignCustomPermissions(userId: number, dto: AssignPermissionsDto) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findFirst({
      where: { id: userId, is_deleted: false },
      include: {
        customRole: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que toutes les permissions existent
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds } },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new NotFoundException('Certaines permissions sont introuvables');
    }

    // Utiliser une transaction pour créer le rôle personnalisé et l'assigner
    const result = await this.prisma.$transaction(async (tx) => {
      // Créer un slug unique pour le rôle personnalisé
      const roleSlug = `custom-user-${userId}-${Date.now()}`;
      const roleName = `Rôle personnalisé - ${user.firstName} ${user.lastName}`;

      // Créer le nouveau rôle personnalisé
      const newRole = await tx.customRole.create({
        data: {
          name: roleName,
          slug: roleSlug,
          description: `Rôle personnalisé créé pour l'utilisateur ${user.email}`,
          isSystem: false,
          permissions: {
            create: dto.permissionIds.map((permissionId) => ({
              permissionId,
            })),
          },
        },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      // Si l'utilisateur avait déjà un rôle personnalisé non-système, le supprimer
      if (user.customRole && !user.customRole.isSystem) {
        const oldRoleId = user.customRole.id;

        // Vérifier qu'aucun autre utilisateur n'utilise ce rôle
        const otherUsers = await tx.user.count({
          where: {
            roleId: oldRoleId,
            id: { not: userId },
            is_deleted: false,
          },
        });

        // Si aucun autre utilisateur n'utilise ce rôle, le supprimer
        if (otherUsers === 0) {
          await tx.customRole.delete({
            where: { id: oldRoleId },
          });
        }
      }

      // Assigner le nouveau rôle à l'utilisateur
      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          roleId: newRole.id,
        },
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

      return updatedUser;
    });

    return {
      success: true,
      message: 'Permissions attribuées avec succès',
      data: {
        id: result.id,
        name: `${result.firstName} ${result.lastName}`,
        email: result.email,
        role: {
          id: result.customRole!.id,
          name: result.customRole!.name,
          slug: result.customRole!.slug,
        },
        permissions: result.customRole!.permissions.map((rp) => rp.permission),
      },
    };
  }

  /**
   * Réinitialiser les permissions d'un utilisateur à celles de son rôle de base
   */
  async resetUserPermissions(userId: number, baseRoleId: number) {
    // Vérifier que l'utilisateur existe
    const user = await this.prisma.user.findFirst({
      where: { id: userId, is_deleted: false },
      include: {
        customRole: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    // Vérifier que le rôle de base existe
    const baseRole = await this.prisma.customRole.findUnique({
      where: { id: baseRoleId },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!baseRole) {
      throw new NotFoundException('Rôle de base non trouvé');
    }

    // Utiliser une transaction
    const result = await this.prisma.$transaction(async (tx) => {
      // Si l'utilisateur avait un rôle personnalisé non-système, le supprimer
      if (user.customRole && !user.customRole.isSystem) {
        const oldRoleId = user.customRole.id;

        // Vérifier qu'aucun autre utilisateur n'utilise ce rôle
        const otherUsers = await tx.user.count({
          where: {
            roleId: oldRoleId,
            id: { not: userId },
            is_deleted: false,
          },
        });

        // Si aucun autre utilisateur n'utilise ce rôle, le supprimer
        if (otherUsers === 0) {
          await tx.customRole.delete({
            where: { id: oldRoleId },
          });
        }
      }

      // Assigner le rôle de base à l'utilisateur
      return tx.user.update({
        where: { id: userId },
        data: {
          roleId: baseRoleId,
        },
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
    });

    return {
      success: true,
      message: 'Permissions réinitialisées avec succès',
      data: {
        id: result.id,
        name: `${result.firstName} ${result.lastName}`,
        email: result.email,
        role: {
          id: result.customRole!.id,
          name: result.customRole!.name,
          slug: result.customRole!.slug,
        },
        permissions: result.customRole!.permissions.map((rp) => rp.permission),
      },
    };
  }
}
