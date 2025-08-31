import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../../prisma.service';
import { UpdateDesignPositionDto } from '../dto/update-design-position.dto';
import { normalizePosition } from './design-position.helpers';

@Injectable()
export class DesignPositionService {
  constructor(private readonly prisma: PrismaService) {}

  // ✅ Getter public pour permettre l'accès depuis le controller
  get prismaClient() {
    return this.prisma;
  }

  /**
   * Upsert the position for a given (vendorProductId, designId) pair.
   */
  async upsertPosition(
    vendorId: number,
    vendorProductId: number,
    designId: number,
    dto: UpdateDesignPositionDto,
  ) {
    await this.validatePermissions(vendorId, vendorProductId, designId);

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

  /**
   * 🆕 Sauvegarde position lors de la création/mise à jour de VendorDesignTransform
   * Intégration avec le workflow existant
   */
  async savePositionFromTransform(
    vendorId: number,
    vendorProductId: number,
    designUrl: string,
    transforms: any
  ): Promise<void> {
    console.log(`🔄 savePositionFromTransform: vendorId=${vendorId}, vendorProductId=${vendorProductId}, designUrl=${designUrl?.substring(0, 50)}...`);
    
    // Extraire les données de position depuis transforms
    const positioning = transforms.positioning || transforms.position;
    if (!positioning) {
      console.log(`⚠️ Aucune position trouvée dans transforms:`, transforms);
      return; // Pas de position à sauvegarder
    }

    console.log(`📍 Position extraite:`, positioning);

    // Trouver le design par URL (plusieurs stratégies)
    let design = await this.prisma.design.findFirst({
      where: {
        imageUrl: designUrl,
        vendorId: vendorId
      }
    });

    // Fallback: chercher par URL sans restriction de vendeur
    if (!design) {
      design = await this.prisma.design.findFirst({
        where: {
          imageUrl: designUrl
        }
      });
      console.log(`🔄 Design trouvé sans restriction vendeur: ${design?.id}`);
    }

    // Fallback: chercher par URL partielle (cloudinary peut avoir des variations)
    if (!design && designUrl) {
      const urlParts = designUrl.split('/');
      const publicId = urlParts[urlParts.length - 1]?.split('.')[0];
      if (publicId) {
        design = await this.prisma.design.findFirst({
          where: {
            cloudinaryPublicId: publicId
          }
        });
        console.log(`🔄 Design trouvé par publicId ${publicId}: ${design?.id}`);
      }
    }

    if (!design) {
      console.warn(`❌ Design non trouvé pour URL: ${designUrl}`);
      console.warn(`🔍 Recherche dans tous les designs du vendeur ${vendorId}...`);
      
      // Debug: lister tous les designs du vendeur
      const allDesigns = await this.prisma.design.findMany({
        where: { vendorId },
        select: { id: true, name: true, imageUrl: true, cloudinaryPublicId: true }
      });
      console.warn(`📋 Designs disponibles:`, allDesigns);
      return;
    }

    console.log(`✅ Design trouvé: ${design.id} (${design.name})`);

    // Sauvegarder la position
    const positionJson = normalizePosition(positioning);
    const result = await this.prisma.productDesignPosition.upsert({
      where: {
        vendorProductId_designId: {
          vendorProductId,
          designId: design.id,
        },
      },
      create: {
        vendorProductId,
        designId: design.id,
        position: positionJson,
      },
      update: {
        position: positionJson,
      },
    });
    
    console.log(`💾 Position sauvegardée: Produit ${vendorProductId} ↔ Design ${design.id}`, positionJson);
  }

  /**
   * 🆕 Récupère la position depuis ProductDesignPosition pour un design donné
   */
  async getPositionForDesign(
    vendorId: number,
    vendorProductId: number,
    designId: number,
  ): Promise<any | null> {
    await this.validatePermissions(vendorId, vendorProductId, designId);
    
    // Récupérer la position
    const positionRecord = await this.prisma.productDesignPosition.findUnique({
      where: {
        vendorProductId_designId: {
          vendorProductId,
          designId: designId,
        },
      },
    });

    if (positionRecord) {
      console.log(`📍 Position trouvée pour Produit ${vendorProductId} ↔ Design ${designId}:`, positionRecord.position);
      return normalizePosition(positionRecord.position);
    } else {
      console.log(`⚠️ Aucune position sauvegardée pour Produit ${vendorProductId} ↔ Design ${designId}`);
    }

    return null;
  }

  /**
   * 🆕 Sauvegarde position avec designId directement (plus fiable)
   */
  async savePositionByDesignId(
    vendorId: number,
    vendorProductId: number,
    designId: number,
    positioning: any
  ): Promise<void> {
    console.log(`💾 savePositionByDesignId: vendorId=${vendorId}, vendorProductId=${vendorProductId}, designId=${designId}`);
    console.log(`📍 Position:`, positioning);

    await this.validatePermissions(vendorId, vendorProductId, designId);

    console.log(`✅ Validation OK: Produit ${vendorProductId} ↔ Design ${designId}`);

    // Sauvegarder la position
    const positionJson = normalizePosition(positioning);

    const result_by_id = await this.prisma.productDesignPosition.upsert({
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
    
    console.log(`💾 Position sauvegardée avec succès: Produit ${vendorProductId} ↔ Design ${designId}`);
  }

  /**
   * 🆕 Récupère position par designId directement
   */
  async getPositionByDesignId(
    vendorProductId: number,
    designId: number
  ): Promise<any | null> {
    console.log(`📥 getPositionByDesignId: vendorProductId=${vendorProductId}, designId=${designId}`);

    const positionRecord = await this.prisma.productDesignPosition.findUnique({
      where: {
        vendorProductId_designId: {
          vendorProductId,
          designId,
        },
      },
    });

    if (positionRecord) {
      console.log(`📍 Position trouvée pour Produit ${vendorProductId} ↔ Design ${designId}:`, positionRecord.position);
      return normalizePosition(positionRecord.position);
    } else {
      console.log(`⚠️ Aucune position sauvegardée pour Produit ${vendorProductId} ↔ Design ${designId}`);
    }

    return null;
  }

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
    return record;
  }

  async deletePosition(vendorId: number, vendorProductId: number, designId: number) {
    await this.validatePermissions(vendorId, vendorProductId, designId);

    await this.prisma.productDesignPosition.delete({
      where: {
        vendorProductId_designId: {
          vendorProductId,
          designId,
        },
      },
    });
  }

  private async validatePermissions(vendorId: number, vendorProductId: number, designId: number) {
    const product = await this.prisma.vendorProduct.findUnique({
      where: { id: vendorProductId },
      select: { id: true, vendorId: true },
    });
    if (!product) {
      throw new NotFoundException('Produit vendeur introuvable');
    }
    if (product.vendorId !== vendorId) {
      throw new ForbiddenException('Ce produit ne vous appartient pas');
    }

    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { id: true, name: true, vendorId: true, isPublished: true },
    });
    
    if (!design) {
      throw new NotFoundException('Design introuvable');
    }

    const hasDesignAccess = design.vendorId === vendorId || design.isPublished;
    if (!hasDesignAccess) {
      throw new ForbiddenException('Ce design ne vous est pas accessible');
    }
  }

  /**
   * 🔍 Debug method pour diagnostiquer les problèmes de permissions
   */
  async debugPermissions(vendorId: number, vendorProductId: number, designId: number) {
    console.log(`🔍 DEBUG: vendorId=${vendorId}, vendorProductId=${vendorProductId}, designId=${designId}`);
    
    // Vérifier le produit
    const product = await this.prisma.vendorProduct.findUnique({
      where: { id: vendorProductId },
      select: { 
        id: true, 
        vendorId: true, 
        name: true, 
        baseProductId: true,
        status: true 
      },
    });
    
    // Vérifier le design
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      select: { 
        id: true, 
        name: true, 
        vendorId: true,
        imageUrl: true,
        isPublished: true
      },
    });
    
    // Lister tous les produits du vendeur
    const allVendorProducts = await this.prisma.vendorProduct.findMany({
      where: { vendorId },
      select: { 
        id: true, 
        name: true, 
        baseProductId: true,
        status: true 
      },
    });
    
    // Lister tous les designs du vendeur
    const allDesigns = await this.prisma.design.findMany({
      where: { vendorId },
      select: { 
        id: true, 
        name: true,
        imageUrl: true,
        isPublished: true
      },
    });
    
    const debugInfo = {
      requestedVendorId: vendorId,
      requestedProductId: vendorProductId,
      requestedDesignId: designId,
      product: product || null,
      design: design || null,
      productBelongsToVendor: product?.vendorId === vendorId,
      designBelongsToVendor: design?.vendorId === vendorId,
      allVendorProducts,
      allDesigns,
      recommendations: []
    };
    
    // Générer des recommandations
    if (!product) {
      debugInfo.recommendations.push(`Produit ${vendorProductId} introuvable`);
    } else if (product.vendorId !== vendorId) {
      debugInfo.recommendations.push(`Produit ${vendorProductId} appartient au vendeur ${product.vendorId}, pas au vendeur ${vendorId}`);
    }
    
    if (!design) {
      debugInfo.recommendations.push(`Design ${designId} introuvable`);
    } else if (design.vendorId !== vendorId) {
      debugInfo.recommendations.push(`Design ${designId} appartient au vendeur ${design.vendorId}, pas au vendeur ${vendorId}`);
    }
    
    console.log(`🔍 DEBUG INFO:`, debugInfo);
    return debugInfo;
  }
} 
 
 
 
 