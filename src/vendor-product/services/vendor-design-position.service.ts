import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { UpdateDesignPositionDto } from '../dto/update-design-position.dto';
import { normalizePosition } from './design-position.helpers';

@Injectable()
export class VendorDesignPositionService {
  constructor(private readonly prisma: PrismaService) {}

  async getPosition(vendorProductId: number, designId: number) {
    const record = await this.prisma.productDesignPosition.findUnique({
      where: {
        vendorProductId_designId: {
          vendorProductId,
          designId,
        },
      },
    });

    if (!record) {
      throw new NotFoundException('Position non trouvée');
    }
    return normalizePosition(record.position);
  }

  async getAllPositions(vendorProductId: number) {
    const records = await this.prisma.productDesignPosition.findMany({
      where: { vendorProductId },
    });
    return records.map((rec) => ({
      ...normalizePosition(rec.position),
      designId: rec.designId,
    }));
  }

  async upsertPosition(
    vendorId: number,
    vendorProductId: number,
    designId: number,
    dto: UpdateDesignPositionDto,
  ) {
    const product = await this.prisma.vendorProduct.findUnique({
      where: { id: vendorProductId },
      select: { vendorId: true },
    });
    if (!product) {
      throw new NotFoundException('Produit vendeur introuvable');
    }
    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('Ce produit ne vous appartient pas');
    }

    const positionJson = normalizePosition(dto.position);

    const record = await this.prisma.productDesignPosition.upsert({
      where: {
        vendorProductId_designId: {
          vendorProductId,
          designId,
        },
      },
      create: {
        vendorProductId,
        designId,
        position: positionJson,
      },
      update: {
        position: positionJson,
      },
    });

    return record;
  }
} 
 
 
 
 