import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { WizardProductDataDto } from './dto/wizard-create-product.dto';

interface OrganizedFiles {
  baseImage: Express.Multer.File | null;
  detailImages: Express.Multer.File[];
}

interface UploadedImageData {
  imageUrl: string;
  imageOrder: number;
  columnIndex: number;
  isBaseImage: boolean;
  imageType: 'base' | 'detail';
  fileSize: number;
  fileType: string;
  originalName: string;
}

@Injectable()
export class VendorWizardService {
  private readonly logger = new Logger(VendorWizardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createProductViaWizard(
    vendorId: number,
    productData: WizardProductDataDto,
    files: OrganizedFiles
  ) {
    this.logger.log('Début création produit wizard', { vendorId });

    try {
      // 1. Validations des données
      await this.validateProductData(productData, vendorId);

      // 2. Upload des images
      const uploadedImages = await this.uploadImages(vendorId, files);

      // 3. Charger le thème sélectionné (pour stocker id + nom)
      const selectedThemeId = parseInt(productData.selectedTheme as any);
      const selectedTheme = isNaN(selectedThemeId)
        ? null
        : await this.prisma.designCategory.findUnique({ where: { id: selectedThemeId } });

      // 4. Création en base de données avec transaction
      const result = await this.prisma.$transaction(async (prisma) => {
        // Créer le produit vendeur
        const vendorProduct = await prisma.vendorProduct.create({
          data: {
            vendorId: vendorId,
            baseProductId: productData.selectedMockup.id,

            // Informations produit
            name: productData.productName,
            description: productData.productDescription,
            price: productData.productPrice,
            stock: 100, // Stock par défaut

            // Sélections (JSON)
            colors: JSON.stringify(productData.selectedColors),
            sizes: JSON.stringify(productData.selectedSizes),

            // Statuts
            status: productData.postValidationAction === 'TO_PUBLISHED' ? 'PUBLISHED' : 'PENDING',

            // Informations vendeur
            vendorName: productData.productName,
            vendorDescription: productData.productDescription,
            vendorStock: 100,
            basePriceAdmin: productData.basePrice,

            // 🆕 Thème sélectionné par le vendeur
            vendorSelectedThemeId: selectedTheme?.id ?? null,
            vendorSelectedThemeName: selectedTheme?.name ?? null,

            createdAt: new Date(),
            updatedAt: new Date()
          }
        });

        // Insérer les images avec hiérarchie
        for (const imageData of uploadedImages) {
          await prisma.vendorProductImage.create({
            data: {
              vendorProductId: vendorProduct.id,
              imageType: imageData.imageType,
              cloudinaryUrl: imageData.imageUrl,
              cloudinaryPublicId: `vendor_${vendorProduct.id}_${Date.now()}`,
              fileSize: imageData.fileSize,
              format: imageData.fileType,
              createdAt: new Date(),
              uploadedAt: new Date()
            }
          });
        }

        return vendorProduct;
      });

      // 4. Construire la réponse formatée
      return await this.buildResponse(result.id, productData, uploadedImages);

    } catch (error) {
      this.logger.error('Erreur création produit wizard:', error);
      throw error;
    }
  }

  private async validateProductData(productData: WizardProductDataDto, vendorId: number) {
    // Validation du mockup
    const mockup = await this.prisma.product.findFirst({
      where: {
        id: productData.selectedMockup.id,
        isReadyProduct: false
      },
      include: {
        colorVariations: true,
        sizes: true
      }
    });

    if (!mockup) {
      throw new BadRequestException('Mockup sélectionné introuvable ou invalide');
    }

    // Vérifier cohérence des prix
    if (mockup.price !== productData.basePrice) {
      throw new BadRequestException('Prix de base incohérent avec le mockup sélectionné');
    }

    // Validation marge minimum (10%)
    const minimumPrice = productData.basePrice * 1.1;
    if (productData.productPrice < minimumPrice) {
      throw new BadRequestException(
        `Prix minimum autorisé: ${minimumPrice} FCFA (marge 10% minimum)`,
        {
          cause: {
            baseCost: productData.basePrice,
            minimumPrice: minimumPrice,
            providedPrice: productData.productPrice,
            requiredMargin: '10%'
          }
        }
      );
    }

    // Validation cohérence des calculs
    const expectedProfit = productData.productPrice - productData.basePrice;
    const expectedRevenue = Math.round(expectedProfit * 0.7);

    if (Math.abs(productData.vendorProfit - expectedProfit) > 1) {
      throw new BadRequestException('Erreur dans les calculs de bénéfice');
    }

    if (Math.abs(productData.expectedRevenue - expectedRevenue) > 1) {
      throw new BadRequestException('Erreur dans le calcul du revenu attendu');
    }

    // Validation couleurs sélectionnées
    const validColorIds = mockup.colorVariations.map(c => c.id);
    const invalidColors = productData.selectedColors.filter(
      color => !validColorIds.includes(color.id)
    );

    if (invalidColors.length > 0) {
      throw new BadRequestException(
        'Couleurs sélectionnées non disponibles pour ce mockup',
        {
          cause: {
            invalidColors: invalidColors.map(c => c.name),
            availableColors: mockup.colorVariations.map(c => c.name)
          }
        }
      );
    }

    // Validation tailles sélectionnées
    const validSizeIds = mockup.sizes.map(s => s.id);
    const invalidSizes = productData.selectedSizes.filter(
      size => !validSizeIds.includes(size.id)
    );

    if (invalidSizes.length > 0) {
      throw new BadRequestException(
        'Tailles sélectionnées non disponibles pour ce mockup',
        {
          cause: {
            invalidSizes: invalidSizes.map(s => s.sizeName),
            availableSizes: mockup.sizes.map(s => s.sizeName)
          }
        }
      );
    }

    // Validation catégorie design
    const designCategory = await this.prisma.designCategory.findFirst({
      where: {
        id: parseInt(productData.selectedTheme),
        isActive: true
      }
    });

    if (!designCategory) {
      throw new BadRequestException('Thème sélectionné introuvable ou inactif');
    }
  }

  private async uploadImages(vendorId: number, files: OrganizedFiles): Promise<UploadedImageData[]> {
    const uploadedImages: UploadedImageData[] = [];
    const timestamp = Date.now();

    // Validation des images
    const allImages = [files.baseImage, ...files.detailImages].filter(Boolean);
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    for (const [index, image] of allImages.entries()) {
      const imageType = index === 0 ? 'principale' : 'détail';

      if (!allowedTypes.includes(image.mimetype)) {
        throw new BadRequestException(`Image ${imageType}: type non autorisé (${image.mimetype})`);
      }

      if (image.size > maxSize) {
        throw new BadRequestException(`Image ${imageType}: taille trop importante (max 5MB)`);
      }
    }

    // Upload image principale
    if (files.baseImage) {
      const baseImageResult = await this.cloudinaryService.uploadImage(files.baseImage, `vendor-products/${vendorId}/${timestamp}`);

      uploadedImages.push({
        imageUrl: baseImageResult.secure_url,
        imageOrder: 0,
        columnIndex: 0,
        isBaseImage: true,
        imageType: 'base',
        fileSize: files.baseImage.size,
        fileType: files.baseImage.mimetype,
        originalName: files.baseImage.originalname
      });
    }

    // Upload images de détail
    for (const [index, detailImage] of files.detailImages.entries()) {
      const detailImageResult = await this.cloudinaryService.uploadImage(detailImage, `vendor-products/${vendorId}/${timestamp}`);

      uploadedImages.push({
        imageUrl: detailImageResult.secure_url,
        imageOrder: Math.floor((index + 1) / 4),
        columnIndex: (index + 1) % 4,
        isBaseImage: false,
        imageType: 'detail',
        fileSize: detailImage.size,
        fileType: detailImage.mimetype,
        originalName: detailImage.originalname
      });
    }

    this.logger.log('Images uploadées:', {
      baseImage: files.baseImage?.originalname,
      detailImages: files.detailImages.map(img => img.originalname),
      totalImages: uploadedImages.length
    });

    return uploadedImages;
  }

  private async buildResponse(productId: number, productData: WizardProductDataDto, images: UploadedImageData[]) {
    // Récupérer les informations complémentaires
    const [mockup, theme] = await Promise.all([
      this.prisma.product.findUnique({
        where: { id: productData.selectedMockup.id }
      }),
      this.prisma.designCategory.findUnique({
        where: { id: parseInt(productData.selectedTheme) }
      })
    ]);

    const baseImage = images.find(img => img.isBaseImage);
    const detailImages = images.filter(img => !img.isBaseImage);

    return {
      id: productId,
      vendorId: productData.selectedMockup.id, // Correction: devrait être le vendor ID réel
      productName: productData.productName,
      productPrice: productData.productPrice,
      basePrice: productData.basePrice,
      vendorProfit: productData.vendorProfit,
      expectedRevenue: productData.expectedRevenue,
      platformCommission: productData.vendorProfit - productData.expectedRevenue,
      status: productData.postValidationAction === 'TO_PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
      validationStatus: 'PENDING',

      mockup: {
        id: mockup.id,
        name: mockup.name,
        basePrice: mockup.price
      },

      theme: {
        id: theme.id,
        name: theme.name,
        color: theme.coverImageUrl || '#3b82f6'
      },

      selectedColors: productData.selectedColors,
      selectedSizes: productData.selectedSizes,

      images: {
        baseImage: baseImage ? {
          id: 1, // Temporaire, sera remplacé par l'ID réel
          url: baseImage.imageUrl,
          isBase: true,
          type: 'base'
        } : null,
        detailImages: detailImages.map((img, index) => ({
          id: index + 2, // Temporaire
          url: img.imageUrl,
          isBase: false,
          type: 'detail'
        })),
        totalImages: images.length
      },

      wizard: {
        createdViaWizard: true,
        priceCustomized: productData.isPriceCustomized,
        completedSteps: 5
      },

      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}