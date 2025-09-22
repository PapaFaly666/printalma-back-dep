import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { CreateWizardProductDto, WizardProductResponseDto } from './dto/wizard-product.dto';

@Injectable()
export class VendorWizardProductService {
  private readonly logger = new Logger(VendorWizardProductService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {
    // Vérification de l'injection des dépendances
    if (!this.prisma) {
      this.logger.error('❌ PrismaService is not injected properly');
      throw new Error('PrismaService dependency injection failed');
    }
    if (!this.cloudinaryService) {
      this.logger.error('❌ CloudinaryService is not injected properly');
      throw new Error('CloudinaryService dependency injection failed');
    }
    this.logger.log('✅ VendorWizardProductService initialized successfully');
  }

  async createWizardProduct(
    createWizardProductDto: CreateWizardProductDto,
    vendorId: number,
  ): Promise<WizardProductResponseDto> {
    this.logger.log(`🎨 Début création produit WIZARD pour vendeur ${vendorId}`);
    this.logger.log(`📥 Données reçues: ${JSON.stringify(createWizardProductDto)}`);

    const {
      baseProductId,
      vendorName,
      vendorDescription,
      vendorPrice,
      vendorStock = 10,
      selectedColors,
      selectedSizes,
      productImages,
      forcedStatus = 'DRAFT',
    } = createWizardProductDto;

    this.logger.log(`🔍 baseProductId extrait: ${baseProductId} (type: ${typeof baseProductId})`);
    this.logger.log(`🔍 vendorName: ${vendorName}`);
    this.logger.log(`🔍 vendorPrice: ${vendorPrice}`);

    // Validation des paramètres critiques
    if (!baseProductId || typeof baseProductId !== 'number') {
      throw new BadRequestException(`baseProductId invalide: ${baseProductId}. Doit être un nombre.`);
    }

    try {
      // 1. Vérifier que le mockup existe
      const baseProduct = await this.prisma.product.findUnique({
        where: { id: baseProductId },
      });

      if (!baseProduct) {
        throw new NotFoundException('Produit de base introuvable');
      }

      this.logger.log(`✅ Mockup trouvé: ${baseProduct.name} - Prix: ${baseProduct.price} FCFA`);

      // 2. Validation marge minimum 10%
      const minimumPrice = Math.ceil(baseProduct.price * 1.1);
      if (vendorPrice < minimumPrice) {
        throw new BadRequestException(
          `Prix trop bas. Minimum: ${minimumPrice} FCFA (marge 10%)`
        );
      }

      this.logger.log(`✅ Prix validé: ${vendorPrice} FCFA (minimum: ${minimumPrice} FCFA)`);

      // 3. Calculer les métadonnées financières
      const vendorProfit = vendorPrice - baseProduct.price;
      const expectedRevenue = Math.round(vendorProfit * 0.7);
      const platformCommission = Math.round(vendorProfit * 0.3);
      const marginPercentage = ((vendorProfit / baseProduct.price) * 100).toFixed(2);

      this.logger.log(`💰 Calculs: Profit=${vendorProfit}, Revenue=${expectedRevenue}, Commission=${platformCommission}, Marge=${marginPercentage}%`);

      // 4. Traiter les images
      const savedImages = await this.processWizardImages(productImages);

      // 5. Créer le produit wizard dans une transaction
      const wizardProduct = await this.prisma.$transaction(async (tx) => {
        // Créer le produit
        const product = await tx.vendorProduct.create({
          data: {
            vendorId: vendorId,
            baseProductId: baseProductId,
            name: vendorName, // Nom personnalisé du vendeur
            description: vendorDescription,
            price: vendorPrice,
            stock: vendorStock,
            status: forcedStatus as any,
            designId: null, // PAS de design pour wizard
            // Stocker les variantes dans les champs JSON requis par le schéma
            sizes: selectedSizes as unknown as any,
            colors: selectedColors as unknown as any,
            // 🔧 Mémoriser quelques infos admin du produit de base
            adminProductName: baseProduct.name || `Produit base ${baseProductId}`,
            adminProductPrice: Math.round(baseProduct.price),
            // Champs mémo optionnels
            vendorName: vendorName,
            vendorDescription: vendorDescription,
            vendorStock: vendorStock,
          },
          include: {
            baseProduct: true,
            design: true,
            validator: true,
            vendor: true,
            images: true,
          },
        });

        // Créer les images associées
        for (const imageData of savedImages) {
          await tx.vendorProductImage.create({
            data: {
              vendorProductId: product.id,
              cloudinaryUrl: imageData.url,
              cloudinaryPublicId: `wizard-${product.id}-${imageData.orderIndex}`,
              imageType: imageData.type.toLowerCase(),
              width: 800,
              height: 800,
            },
          });
        }

        // Recharger le produit avec ses images et relations nécessaires
        const productWithImages = await tx.vendorProduct.findUnique({
          where: { id: product.id },
          include: {
            baseProduct: true,
            images: true,
            vendor: true,
            design: true,
            validator: true,
          },
        });

        return productWithImages!;
      });

      this.logger.log(`🎉 Produit wizard créé avec succès: ID=${wizardProduct.id}`);

      // 6. Construire la réponse
      const baseImage = wizardProduct.images?.find((img) => (img.imageType || '').toUpperCase() === 'BASE');
      return {
        success: true,
        message: 'Produit wizard créé avec succès',
        data: {
          id: wizardProduct.id,
          vendorId: wizardProduct.vendorId,
          name: wizardProduct.name,
          description: wizardProduct.description,
          price: wizardProduct.price,
          status: wizardProduct.status,
          productType: 'WIZARD',
          baseProduct: {
            id: baseProduct.id,
            name: baseProduct.name,
            price: baseProduct.price,
          },
          baseImage: baseImage
            ? {
                id: baseImage.id,
                url: baseImage.cloudinaryUrl,
                isMain: true,
                orderIndex: 0,
              }
            : null,
          images: wizardProduct.images
            ? wizardProduct.images
                .sort((a, b) => (a.id ?? 0) - (b.id ?? 0))
                .map((img) => ({
                  id: img.id,
                  url: img.cloudinaryUrl,
                  isMain: (img.imageType || '').toUpperCase() === 'BASE',
                  orderIndex: (img.imageType || '').toUpperCase() === 'BASE' ? 0 : undefined,
                }))
            : [],
          calculations: {
            basePrice: baseProduct.price,
            vendorProfit: vendorProfit,
            expectedRevenue: expectedRevenue,
            platformCommission: platformCommission,
            marginPercentage: marginPercentage,
          },
          selectedColors: selectedColors,
          selectedSizes: selectedSizes,
          wizard: {
            createdViaWizard: true,
            hasDesign: false,
            imageCount: savedImages.length,
          },
          createdAt: wizardProduct.createdAt,
          updatedAt: wizardProduct.updatedAt,
        },
      };

    } catch (error) {
      this.logger.error(`❌ Erreur création produit wizard: ${error.message}`);

      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }

      throw new BadRequestException(
        error.message || 'Erreur lors de la création du produit wizard'
      );
    }
  }

  private async processWizardImages(productImages: {
    baseImage: string;
    detailImages?: string[];
  }): Promise<Array<{
    url: string;
    type: 'BASE' | 'DETAIL';
    isMain: boolean;
    orderIndex: number;
  }>> {
    const savedImages = [];

    try {
      // Image principale (obligatoire)
      if (productImages.baseImage) {
        this.logger.log('📸 Upload image principale...');

        const baseImageResult = await this.cloudinaryService.uploadBase64(
          productImages.baseImage,
          {
            folder: 'wizard-products',
            public_id: `wizard-base-${Date.now()}`,
            quality: 90,
          }
        );

        savedImages.push({
          url: baseImageResult.secure_url,
          type: 'BASE' as const,
          isMain: true,
          orderIndex: 0,
        });

        this.logger.log(`✅ Image principale uploadée: ${baseImageResult.secure_url}`);
      }

      // Images de détail (optionnelles)
      if (productImages.detailImages && productImages.detailImages.length > 0) {
        this.logger.log(`📸 Upload ${productImages.detailImages.length} images de détail...`);

        for (let i = 0; i < productImages.detailImages.length; i++) {
          const detailImageResult = await this.cloudinaryService.uploadBase64(
            productImages.detailImages[i],
            {
              folder: 'wizard-products',
              public_id: `wizard-detail-${Date.now()}-${i + 1}`,
              quality: 90,
            }
          );

          savedImages.push({
            url: detailImageResult.secure_url,
            type: 'DETAIL' as const,
            isMain: false,
            orderIndex: i + 1,
          });

          this.logger.log(`✅ Image détail ${i + 1} uploadée: ${detailImageResult.secure_url}`);
        }
      }

      this.logger.log(`🎯 Total images traitées: ${savedImages.length}`);
      return savedImages;

    } catch (error) {
      this.logger.error(`❌ Erreur traitement images: ${error.message}`);
      throw new BadRequestException('Échec sauvegarde images: ' + error.message);
    }
  }
}