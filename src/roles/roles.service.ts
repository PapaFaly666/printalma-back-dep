import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupérer tous les rôles avec leurs permissions
   */
  async findAll() {
    const roles = await this.prisma.customRole.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((rp) => rp.permission),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    }));

    return {
      success: true,
      data: formattedRoles,
    };
  }

  /**
   * Récupérer un rôle par ID
   */
  async findOne(id: number) {
    const role = await this.prisma.customRole.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        users: {
          where: { is_deleted: false },
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    return {
      success: true,
      data: {
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description,
        isSystem: role.isSystem,
        permissions: role.permissions.map((rp) => rp.permission),
        users: role.users,
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      },
    };
  }

  /**
   * Créer un nouveau rôle
   */
  async create(dto: CreateRoleDto) {
    // Vérifier si le slug existe déjà
    const existingRole = await this.prisma.customRole.findUnique({
      where: { slug: dto.slug },
    });

    if (existingRole) {
      throw new ConflictException('Ce slug est déjà utilisé');
    }

    // Vérifier que toutes les permissions existent
    const permissions = await this.prisma.permission.findMany({
      where: { id: { in: dto.permissionIds } },
    });

    if (permissions.length !== dto.permissionIds.length) {
      throw new NotFoundException('Certaines permissions sont introuvables');
    }

    // Créer le rôle avec ses permissions
    const role = await this.prisma.customRole.create({
      data: {
        name: dto.name,
        slug: dto.slug,
        description: dto.description,
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

    return {
      success: true,
      message: 'Rôle créé avec succès',
      data: {
        id: role.id,
        name: role.name,
        slug: role.slug,
        description: role.description,
        permissions: role.permissions.map((rp) => rp.permission),
      },
    };
  }

  /**
   * Mettre à jour un rôle
   */
  async update(id: number, dto: UpdateRoleDto) {
    // Vérifier que le rôle existe
    const role = await this.prisma.customRole.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    // Ne pas autoriser la modification des rôles système
    if (role.isSystem) {
      throw new BadRequestException(
        'Les rôles système ne peuvent pas être modifiés'
      );
    }

    // Vérifier que toutes les permissions existent si fournies
    if (dto.permissionIds) {
      const permissions = await this.prisma.permission.findMany({
        where: { id: { in: dto.permissionIds } },
      });

      if (permissions.length !== dto.permissionIds.length) {
        throw new NotFoundException('Certaines permissions sont introuvables');
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;

    // Utiliser une transaction pour mettre à jour le rôle et ses permissions
    const updatedRole = await this.prisma.$transaction(async (tx) => {
      // Mettre à jour les informations du rôle
      const updated = await tx.customRole.update({
        where: { id },
        data: updateData,
      });

      // Si des permissions sont fournies, les remplacer
      if (dto.permissionIds) {
        // Supprimer les anciennes permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Créer les nouvelles permissions
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }

      // Récupérer le rôle avec ses permissions
      return tx.customRole.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    return {
      success: true,
      message: 'Rôle mis à jour avec succès',
      data: {
        id: updatedRole!.id,
        name: updatedRole!.name,
        slug: updatedRole!.slug,
        description: updatedRole!.description,
        permissions: updatedRole!.permissions.map((rp) => rp.permission),
      },
    };
  }

  /**
   * Supprimer un rôle
   */
  async remove(id: number) {
    // Vérifier que le rôle existe
    const role = await this.prisma.customRole.findUnique({
      where: { id },
      include: {
        users: {
          where: { is_deleted: false },
        },
      },
    });

    if (!role) {
      throw new NotFoundException('Rôle non trouvé');
    }

    // Ne pas autoriser la suppression des rôles système
    if (role.isSystem) {
      throw new BadRequestException(
        'Les rôles système ne peuvent pas être supprimés'
      );
    }

    // Vérifier qu'aucun utilisateur n'a ce rôle
    if (role.users.length > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce rôle car ${role.users.length} utilisateur(s) l'utilisent`
      );
    }

    // Supprimer le rôle (les permissions seront supprimées en cascade)
    await this.prisma.customRole.delete({
      where: { id },
    });

    return {
      success: true,
      message: 'Rôle supprimé avec succès',
    };
  }

  /**
   * Récupérer toutes les permissions
   */
  async getAllPermissions() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });

    return {
      success: true,
      data: permissions,
    };
  }

  /**
   * Récupérer les permissions groupées par module
   */
  async getPermissionsByModule() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ module: 'asc' }, { key: 'asc' }],
    });

    const groupedPermissions: Record<string, any[]> = {};
    permissions.forEach((permission) => {
      if (!groupedPermissions[permission.module]) {
        groupedPermissions[permission.module] = [];
      }
      groupedPermissions[permission.module].push(permission);
    });

    return {
      success: true,
      data: groupedPermissions,
    };
  }

  /**
   * Récupérer les rôles disponibles pour créer des utilisateurs
   * Exclut le rôle "vendor" car les vendeurs sont créés via un autre flux
   */
  async getAvailableRolesForUsers() {
    const roles = await this.prisma.customRole.findMany({
      where: {
        slug: {
          not: 'vendor',
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const formattedRoles = roles.map((role) => ({
      id: role.id,
      name: role.name,
      slug: role.slug,
      description: role.description,
      isSystem: role.isSystem,
    }));

    return {
      success: true,
      data: formattedRoles,
    };
  }
}
