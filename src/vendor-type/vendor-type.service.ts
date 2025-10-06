import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateVendorTypeDto } from './dto/create-vendor-type.dto';
import { UpdateVendorTypeDto } from './dto/update-vendor-type.dto';

@Injectable()
export class VendorTypeService {
  constructor(private prisma: PrismaService) {}

  /**
   * Créer un nouveau type de vendeur
   */
  async create(createVendorTypeDto: CreateVendorTypeDto) {
    const { label, description } = createVendorTypeDto;

    // Vérifier si le type existe déjà
    const existing = await this.prisma.vendorType.findUnique({
      where: { label },
    });

    if (existing) {
      throw new ConflictException(
        `Le type de vendeur "${label}" existe déjà`,
      );
    }

    // Créer le type
    const vendorType = await this.prisma.vendorType.create({
      data: {
        label,
        description,
      },
    });

    return {
      message: 'Type de vendeur créé avec succès',
      vendorType,
    };
  }

  /**
   * Récupérer tous les types de vendeurs
   */
  async findAll() {
    const vendorTypes = await this.prisma.vendorType.findMany({
      include: {
        _count: {
          select: { users: true },
        },
      },
      orderBy: {
        label: 'asc',
      },
    });

    return vendorTypes.map((type) => ({
      id: type.id,
      label: type.label,
      description: type.description,
      createdAt: type.createdAt,
      updatedAt: type.updatedAt,
      userCount: type._count.users,
    }));
  }

  /**
   * Récupérer un type de vendeur par ID
   */
  async findOne(id: number) {
    const vendorType = await this.prisma.vendorType.findUnique({
      where: { id },
      include: {
        _count: {
          select: { users: true },
        },
      },
    });

    if (!vendorType) {
      throw new NotFoundException(`Type de vendeur #${id} introuvable`);
    }

    return {
      id: vendorType.id,
      label: vendorType.label,
      description: vendorType.description,
      createdAt: vendorType.createdAt,
      updatedAt: vendorType.updatedAt,
      userCount: vendorType._count.users,
    };
  }

  /**
   * Mettre à jour un type de vendeur
   */
  async update(id: number, updateVendorTypeDto: UpdateVendorTypeDto) {
    // Vérifier si le type existe
    await this.findOne(id);

    // Si on modifie le label, vérifier l'unicité
    if (updateVendorTypeDto.label) {
      const existing = await this.prisma.vendorType.findFirst({
        where: {
          label: updateVendorTypeDto.label,
          NOT: { id },
        },
      });

      if (existing) {
        throw new ConflictException(
          `Le type de vendeur "${updateVendorTypeDto.label}" existe déjà`,
        );
      }
    }

    // Mettre à jour
    const vendorType = await this.prisma.vendorType.update({
      where: { id },
      data: updateVendorTypeDto,
    });

    return {
      message: 'Type de vendeur modifié avec succès',
      vendorType,
    };
  }

  /**
   * Supprimer un type de vendeur
   */
  async remove(id: number) {
    // Vérifier si le type existe
    const vendorType = await this.findOne(id);

    // Vérifier si des utilisateurs utilisent ce type
    if (vendorType.userCount > 0) {
      throw new BadRequestException(
        `Impossible de supprimer ce type car ${vendorType.userCount} vendeur(s) l'utilisent actuellement`,
      );
    }

    // Supprimer
    await this.prisma.vendorType.delete({
      where: { id },
    });

    return {
      message: 'Type de vendeur supprimé avec succès',
    };
  }

  /**
   * Vérifier si un type existe par label
   */
  async checkExists(label: string): Promise<boolean> {
    const count = await this.prisma.vendorType.count({
      where: { label },
    });
    return count > 0;
  }
}
