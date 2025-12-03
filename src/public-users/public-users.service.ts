import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { VendorUserResponseDto } from './dto/vendor-user-response.dto';

@Injectable()
export class PublicUsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getVendorsByType(vendeurType?: 'DESIGNER' | 'INFLUENCEUR' | 'ARTISTE'): Promise<VendorUserResponseDto[]> {
    const whereClause: any = {
      is_deleted: false,
      status: true,
      vendeur_type: {
        not: null
      }
    };

    // Si un type spécifique est demandé
    if (vendeurType) {
      whereClause.vendeur_type = vendeurType;
    } else {
      // Sinon, filtrer pour n'inclure que les types demandés
      whereClause.vendeur_type = {
        in: ['DESIGNER', 'INFLUENCEUR', 'ARTISTE']
      };
    }

    const users = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        shop_name: true,
        vendeur_type: true,
        photo_profil: true,
        profile_photo_url: true,
        phone: true,
        country: true,
        address: true,
        status: true,
        created_at: true,
        updated_at: true
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return users as VendorUserResponseDto[];
  }

  async getVendorById(id: number): Promise<VendorUserResponseDto | null> {
    const user = await this.prisma.user.findFirst({
      where: {
        id,
        is_deleted: false,
        status: true,
        vendeur_type: {
          in: ['DESIGNER', 'INFLUENCEUR', 'ARTISTE']
        }
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        shop_name: true,
        vendeur_type: true,
        photo_profil: true,
        profile_photo_url: true,
        phone: true,
        country: true,
        address: true,
        status: true,
        created_at: true,
        updated_at: true
      }
    });

    return user as VendorUserResponseDto | null;
  }

  async getVendorsByTypes(): Promise<{ DESIGNER: VendorUserResponseDto[], INFLUENCEUR: VendorUserResponseDto[], ARTISTE: VendorUserResponseDto[] }> {
    const [designers, influenceurs, artistes] = await Promise.all([
      this.getVendorsByType('DESIGNER'),
      this.getVendorsByType('INFLUENCEUR'),
      this.getVendorsByType('ARTISTE')
    ]);

    return {
      DESIGNER: designers,
      INFLUENCEUR: influenceurs,
      ARTISTE: artistes
    };
  }
}