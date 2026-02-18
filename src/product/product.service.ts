// products/product.service.ts
import { Injectable, NotFoundException, BadRequestException, ForbiddenException, ConflictException } from '@nestjs/common';
import { CreateProductDto, CoordinateType as DTOCoordinateType } from './dto/create-product.dto';
import { CreateReadyProductDto } from './dto/create-ready-product.dto';
import { UpdateStocksDto } from './dto/update-stocks.dto';
import { RechargeStockDto } from './dto/recharge-stock.dto';
import { CreateStockMovementDto } from './dto/create-stock-movement.dto';
import { StockHistoryQueryDto } from './dto/stock-history-query.dto';
import { CloudinaryService } from '../core/cloudinary/cloudinary.service';
import { PrismaService } from '../prisma.service';
import { PublicationStatus, CoordinateType as PrismaCoordinateType, ProductGenre, StockMovementType } from '@prisma/client';
import { DelimitationService } from '../delimitation/delimitation.service';
import { MailService } from '../core/mail/mail.service';

@Injectable()
export class ProductService {
  constructor(
    private prisma: PrismaService,
    private cloudinaryService: CloudinaryService,
    private delimitationService: DelimitationService,
    private mailService: MailService
  ) {}

  async create(dto: CreateProductDto, files: Express.Multer.File[]) {
    // ✅ LOGS DE DÉBOGAGE POUR LE GENRE ET SUGGESTED PRICE
    console.log('🎨 [BACKEND] === CRÉATION PRODUIT AUTOCOLLANT ===');
    console.log('📋 [BACKEND] create method - DTO reçu:', JSON.stringify(dto, null, 2));
    console.log('📋 [BACKEND] create method - Genre reçu:', dto.genre);
    console.log('📋 [BACKEND] create method - Genre type:', typeof dto.genre);
    console.log('📋 [BACKEND] create method - suggestedPrice reçu:', dto.suggestedPrice);
    console.log('📋 [BACKEND] create method - suggestedPrice type:', typeof dto.suggestedPrice);
    console.log('📋 [BACKEND] create method - suggestedPrice value:', dto.suggestedPrice);
    console.log('📋 [BACKEND] create method - isReadyProduct reçu:', dto.isReadyProduct);
    console.log('📋 [BACKEND] create method - isReadyProduct type:', typeof dto.isReadyProduct);

    // ✅ VALIDATIONS POUR LES AUTOCOLLANTS
    const genreValue = dto.genre || 'UNISEXE';
    let requiresStock = dto.requiresStock ?? true;
    const isAutocollant = genreValue === 'AUTOCOLLANT';
    const isTableau = genreValue === 'TABLEAU';
    const isProductWithoutStock = isAutocollant || isTableau;

    console.log('🎨 [BACKEND] Type de produit:', isAutocollant ? 'AUTOCOLLANT' : (isTableau ? 'TABLEAU' : 'Standard'));
    console.log('📊 [BACKEND] requiresStock (avant correction):', requiresStock);
    console.log('💰 [BACKEND] Prix de base:', dto.price);
    console.log('🎯 [BACKEND] Variations:', dto.colorVariations?.length);
    console.log('📦 [BACKEND] Fichiers reçus:', files.length);

    // Afficher les fichiers pour debug
    files.forEach(file => {
      console.log(`   - ${file.fieldname}: ${file.originalname} (${file.size} bytes)`);
    });

    // ✅ CORRECTION AUTOMATIQUE : Si produit sans stock (AUTOCOLLANT/TABLEAU), forcer requiresStock à false
    if (isProductWithoutStock && requiresStock !== false) {
      const productType = isTableau ? 'TABLEAU' : 'AUTOCOLLANT';
      console.warn(`⚠️ [BACKEND] ${productType} avec requiresStock=true, correction automatique → false`);
      requiresStock = false;
      dto.requiresStock = false;
    }

    // ✅ Pour produits sans stock (AUTOCOLLANT/TABLEAU), forcer stock à 0 (la colonne n'est pas nullable en BDD)
    if (isProductWithoutStock) {
      dto.stock = 0;
      const productType = isTableau ? 'TABLEAU' : 'AUTOCOLLANT';
      console.log(`✅ [BACKEND] ${productType}: stock forcé à 0, requiresStock forcé à false`);
    }

    // Validation : Prix de vente suggéré obligatoire
    if (!dto.suggestedPrice || dto.suggestedPrice <= 0) {
      throw new BadRequestException('Le prix de vente suggéré est obligatoire');
    }

    // Validation : Stock requis uniquement si requiresStock === true
    if (requiresStock === true && dto.stock === undefined) {
      throw new BadRequestException(
        'Le stock initial est requis pour les produits avec gestion de stock'
      );
    }

    // ✅ Pour les produits sans stock (AUTOCOLLANT/TABLEAU), valider que chaque variation de couleur a un prix
    if (isProductWithoutStock && dto.colorVariations) {
      for (const variation of dto.colorVariations) {
        if (!variation.price || variation.price <= 0) {
          const productType = isTableau ? 'TABLEAU' : 'AUTOCOLLANT';
          throw new BadRequestException(
            `Les variations ${productType} doivent avoir un prix. Variation "${variation.name}" sans prix.`
          );
        }
      }
    }

    // ✅ Valider le format des tailles pour produits sans stock (AUTOCOLLANT/TABLEAU)
    if (isProductWithoutStock && dto.sizes && dto.sizes.length > 0) {
      const validateSizeFormat = (size: string): boolean => {
        // Format attendu: "5cm*5cm", "10cm*10cm", "5cm x 10cm" ou "20x30cm"
        const regex = /^\d+(cm|mm)\s*[\*xX]\s*\d+(cm|mm)$/i;
        return regex.test(size.trim());
      };

      for (const size of dto.sizes) {
        if (!validateSizeFormat(size)) {
          const productType = isTableau ? 'tableau' : 'autocollant';
          throw new BadRequestException(
            `Taille de ${productType} invalide: "${size}". Format attendu: "5cm*5cm" ou "20x30cm"`
          );
        }
      }
    }

    // ✅ Validation des délimitations pour les produits mockup admin
    const isMockup = !dto.isReadyProduct;
    if (isMockup) {
      let hasDelimitations = false;

      for (const colorVar of dto.colorVariations) {
        for (const image of colorVar.images) {
          if (image.delimitations && image.delimitations.length > 0) {
            hasDelimitations = true;
            break;
          }
        }
        if (hasDelimitations) break;
      }

      if (!hasDelimitations) {
        throw new BadRequestException(
          'Au moins une zone de personnalisation (délimitation) est requise pour ce produit.'
        );
      }
      console.log('✅ [BACKEND] Délimitations présentes:', hasDelimitations);
    }

    // 🆕 VALIDATION DES PRIX PAR TAILLE
    if (dto.sizes && dto.sizes.length > 0) {
      // ✅ NOUVELLE VALIDATION PLUS SOUPLE
      // Si sizePricing n'est pas fourni, initialiser avec des valeurs par défaut
      if (!dto.sizePricing || dto.sizePricing.length === 0) {
        console.log('⚠️ [BACKEND] sizePricing vide, initialisation avec valeurs par défaut');
        // Initialiser avec des prix par défaut basés sur suggestedPrice du produit
        dto.sizePricing = dto.sizes.map(size => ({
          size,
          suggestedPrice: dto.suggestedPrice || 0,
          costPrice: dto.globalCostPrice || 0
        }));
      }

      // Vérifier que chaque taille a un prix de vente suggéré > 0
      const sizesWithoutPrice = dto.sizes.filter(size =>
        !dto.sizePricing!.find(p => p.size === size && p.suggestedPrice > 0)
      );

      if (sizesWithoutPrice.length > 0) {
        throw new BadRequestException(
          `Prix de vente suggéré manquant pour les tailles: ${sizesWithoutPrice.join(', ')}`
        );
      }

      // Si useGlobalPricing est true, vérifier la cohérence
      if (dto.useGlobalPricing) {
        if (!dto.globalCostPrice || dto.globalCostPrice < 0) {
          throw new BadRequestException('Prix de revient global requis');
        }
        if (!dto.globalSuggestedPrice || dto.globalSuggestedPrice <= 0) {
          throw new BadRequestException('Prix de vente suggéré global requis et doit être > 0');
        }

        // Vérifier que tous les prix correspondent aux prix globaux
        const invalidPrices = dto.sizePricing.filter(p =>
          p.costPrice !== dto.globalCostPrice ||
          p.suggestedPrice !== dto.globalSuggestedPrice
        );

        if (invalidPrices.length > 0) {
          throw new BadRequestException(
            'Les prix par taille doivent correspondre aux prix globaux quand useGlobalPricing est true'
          );
        }
      }

      console.log('✅ [BACKEND] Prix par taille validés:', dto.sizePricing.length);
    }

    // ✅ Valider la cohérence de la hiérarchie Category → SubCategory → Variation
    await this.validateCategoryHierarchy(dto.categoryId, dto.subCategoryId, dto.variationId);

    // 1. Create file mapping
    const fileMap = new Map<string, Express.Multer.File>();
    files.forEach((file) => {
      const fileId = file.fieldname.replace('file_', '');
      fileMap.set(fileId, file);
    });

    // 2. Upload all images to Cloudinary BEFORE starting transaction
    const uploadedImages = new Map<string, any>();
    for (const colorVar of dto.colorVariations) {
      for (const image of colorVar.images) {
        const imageFile = fileMap.get(image.fileId);
        if (!imageFile) {
          throw new BadRequestException(`Image with fileId "${image.fileId}" not found in uploaded files.`);
        }

        try {
          const uploadResult = await this.cloudinaryService.uploadImage(imageFile);
          uploadedImages.set(image.fileId, uploadResult);
        } catch (error) {
          console.error(`❌ Erreur upload image ${image.fileId}:`, error);
          const errorMessage = error?.message || error?.error?.message || JSON.stringify(error) || 'Unknown error';
          throw new BadRequestException(`Failed to upload image with fileId "${image.fileId}": ${errorMessage}`);
        }
      }
    }

    // 3. Use new optimal transaction with advanced retry
    return this.prisma.executeTransaction(async (tx) => {
      // 3.1. Find or create categories and get their IDs
      const categoryPromises = dto.categories.map(async (name) => {
        const category = await tx.category.findFirst({ where: { name } });
        // ⚠️ Si non trouvé, on ignore pour éviter les erreurs de types Prisma non synchronisés
        return category;
      });
      const categories = await Promise.all(categoryPromises);

      // ✅ TRAITER LES CHAMPS GENRE, isReadyProduct ET requiresStock
      const isReadyProduct = dto.isReadyProduct ?? false; // Par défaut false (mockup)
      const genreValue = dto.genre || 'UNISEXE';
      const requiresStockValue = dto.requiresStock ?? true;

      console.log('🔍 [BACKEND] create method - Valeur finale isReadyProduct:', isReadyProduct);
      console.log('🔍 [BACKEND] create method - Valeur finale genre:', genreValue);
      console.log('🔍 [BACKEND] create method - Valeur finale requiresStock:', requiresStockValue);
      console.log('🔍 [BACKEND] create method - Valeur finale suggestedPrice:', dto.suggestedPrice);

      // 3.2. Create the Product first (without categories and sizes)
      const productData = {
        name: dto.name,
        description: dto.description,
        price: dto.price,
        suggestedPrice: dto.suggestedPrice, // ✅ AJOUTER LE CHAMP suggestedPrice
        stock: isProductWithoutStock ? 0 : (dto.stock ?? 0), // 0 pour AUTOCOLLANT/TABLEAU, sinon la valeur du DTO
        status: dto.status === 'published' ? PublicationStatus.PUBLISHED : PublicationStatus.DRAFT,
        isReadyProduct: isReadyProduct, // ✅ AJOUTER LE CHAMP isReadyProduct
        genre: genreValue as ProductGenre, // ✅ AJOUTER LE CHAMP GENRE
        requiresStock: requiresStockValue, // ✅ AJOUTER LE CHAMP requiresStock
        isValidated: true, // ✅ MOCKUPS CRÉÉS PAR ADMIN SONT VALIDÉS PAR DÉFAUT
        // ✅ Hiérarchie de catégories à 3 niveaux
        categoryId: dto.categoryId,
        subCategoryId: dto.subCategoryId,
        variationId: dto.variationId,
        // 🆕 Champs pour la tarification par taille
        useGlobalPricing: dto.useGlobalPricing || false,
        globalCostPrice: dto.globalCostPrice || 0,
        globalSuggestedPrice: dto.globalSuggestedPrice || 0,
      };
      
      console.log('🔍 [BACKEND] create method - productData avant création:', JSON.stringify(productData, null, 2));
      
      const product = await tx.product.create({
        data: productData,
      });

      console.log('💾 [BACKEND] create method - Produit créé avec genre:', product.genre);
      console.log('💾 [BACKEND] create method - Produit créé avec isReadyProduct:', product.isReadyProduct);
      console.log('💾 [BACKEND] create method - Produit créé avec suggestedPrice:', product.suggestedPrice);

      // 3.3. Connect categories to the product (many-to-many via CategoryToProduct junction table)
      if (categories.filter(Boolean).length > 0) {
        await tx.categoryToProduct.createMany({
          data: categories.filter(Boolean).map(c => ({
            A: c.id,
            B: product.id
          })),
          skipDuplicates: true,
        });
      }

      // 3.4. Create product sizes if provided
      if (dto.sizes && dto.sizes.length > 0) {
        await tx.productSize.createMany({
          data: dto.sizes.map((sizeName) => ({
            productId: product.id,
            sizeName: sizeName,
          })),
        });
      }

      // 🆕 3.4.1. Create size pricing if provided
      if (dto.sizePricing && dto.sizePricing.length > 0) {
        await tx.productSizePrice.createMany({
          data: dto.sizePricing.map((pricing) => ({
            productId: product.id,
            size: pricing.size,
            costPrice: pricing.costPrice,
            suggestedPrice: pricing.suggestedPrice,
          })),
        });
        console.log('✅ [BACKEND] Prix par taille créés:', dto.sizePricing.length);
      }

      // 3.5. Create ColorVariations, ProductImages, and Delimitations using pre-uploaded images
      for (const colorVar of dto.colorVariations) {
        const createdColorVariation = await tx.colorVariation.create({
          data: {
            name: colorVar.name,
            colorCode: colorVar.colorCode,
            productId: product.id,
            price: colorVar.price, // ✅ AJOUTER LE CHAMP price pour les autocollants
          },
        });

        for (const image of colorVar.images) {
          const uploadResult = uploadedImages.get(image.fileId);
          if (!uploadResult) {
            throw new BadRequestException(`Upload result not found for fileId "${image.fileId}"`);
          }
          
          // Récupérer les dimensions naturelles de l'image depuis Cloudinary
          const naturalWidth = uploadResult.width;
          const naturalHeight = uploadResult.height;
          
          const createdProductImage = await tx.productImage.create({
            data: {
              view: image.view,
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              naturalWidth: naturalWidth,
              naturalHeight: naturalHeight,
              colorVariationId: createdColorVariation.id,
            },
          });
          
          // Créer les délimitations avec le nouveau système de coordonnées
          if (image.delimitations && image.delimitations.length > 0) {
            for (const delimitation of image.delimitations) {
              let coordinateType: PrismaCoordinateType = PrismaCoordinateType.PERCENTAGE;
              let finalCoords = {
                x: delimitation.x,
                y: delimitation.y,
                width: delimitation.width,
                height: delimitation.height,
              };

              // Si les coordonnées sont absolues, les convertir en pourcentages
              if (delimitation.coordinateType === DTOCoordinateType.ABSOLUTE) {
                coordinateType = PrismaCoordinateType.ABSOLUTE;
                
                // Convertir vers pourcentages si on a les dimensions
                if (naturalWidth && naturalHeight) {
                  finalCoords = DelimitationService.convertAbsoluteToPercentage(
                    finalCoords,
                    { width: naturalWidth, height: naturalHeight }
                  );
                  coordinateType = PrismaCoordinateType.PERCENTAGE;
                }
              }

              await tx.delimitation.create({
                data: {
                  x: finalCoords.x,
                  y: finalCoords.y,
                  width: finalCoords.width,
                  height: finalCoords.height,
                  rotation: delimitation.rotation || 0,
                  name: delimitation.name,
                  coordinateType: coordinateType,
                  // Stocker les coordonnées absolues originales si conversion
                  absoluteX: coordinateType === PrismaCoordinateType.ABSOLUTE ? delimitation.x : null,
                  absoluteY: coordinateType === PrismaCoordinateType.ABSOLUTE ? delimitation.y : null,
                  absoluteWidth: coordinateType === PrismaCoordinateType.ABSOLUTE ? delimitation.width : null,
                  absoluteHeight: coordinateType === PrismaCoordinateType.ABSOLUTE ? delimitation.height : null,
                  originalImageWidth: naturalWidth,
                  originalImageHeight: naturalHeight,
                  referenceWidth: naturalWidth,
                  referenceHeight: naturalHeight,
                  productImageId: createdProductImage.id,
                },
              });
            }
          }
        }
      }

      // 3.6. Return the complete product data
      return tx.product.findUnique({
        where: { id: product.id },
        include: {
          CategoryToProduct: {
            include: {
              categories: true
            }
          },
          sizes: true,
          colorVariations: {
            include: {
              images: {
                include: {
                  delimitations: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async findAll() {
    return this.findAllWithDesignInfo();
  }

  // Nouvelle méthode pour filtrer les produits
  async findAllWithFilters(filters: {
    isReadyProduct?: boolean;
    hasDelimitations?: boolean;
    forVendorDesign?: boolean;
    status?: string;
    category?: string;
    genre?: string;
    requiresStock?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    console.log('🔍 Filtrage backend - Filtres reçus:', filters);

    // Construire les conditions de filtrage
    const where: any = { isDelete: false };

    // 1. Filtre isReadyProduct
    if (filters.isReadyProduct !== undefined) {
      where.isReadyProduct = filters.isReadyProduct;
      console.log('🔍 Filtrage backend - isReadyProduct:', filters.isReadyProduct);
    }

    // 2. Filtre status
    if (filters.status) {
      where.status = filters.status;
      console.log('🔍 Filtrage backend - status:', filters.status);
    }

    // 3. Filtre category
    if (filters.category) {
      where.CategoryToProduct = { some: { categories: { name: filters.category } } };
      console.log('🔍 Filtrage backend - category:', filters.category);
    }

    // 4. ✅ NOUVEAU: Filtre genre
    if (filters.genre) {
      where.genre = filters.genre;
      console.log('🔍 Filtrage backend - genre:', filters.genre);
    }

    // 4.5. ✅ NOUVEAU: Filtre requiresStock
    if (filters.requiresStock !== undefined) {
      where.requiresStock = filters.requiresStock;
      console.log('🔍 Filtrage backend - requiresStock:', filters.requiresStock);
    }

    // 5. Filtre search
    if (filters.search) {
      where.name = {
        contains: filters.search,
        mode: 'insensitive'
      };
      console.log('🔍 Filtrage backend - search:', filters.search);
    }

    // 6. Filtre spécial forVendorDesign (mockups avec délimitations)
    if (filters.forVendorDesign === true) {
      where.isReadyProduct = false;
      where.colorVariations = {
        some: {
          images: {
            some: {
              delimitations: {
                some: {}
              }
            }
          }
        }
      };
      console.log('🔍 Filtrage backend - forVendorDesign: true (mockups avec délimitations)');
    }

    // 7. Filtre hasDelimitations
    if (filters.hasDelimitations !== undefined) {
      if (filters.hasDelimitations === true) {
        where.colorVariations = {
          some: {
            images: {
              some: {
                delimitations: {
                  some: {}
                }
              }
            }
          }
        };
      } else {
        where.colorVariations = {
          some: {
            images: {
              some: {
                delimitations: {
                  none: {}
                }
              }
            }
          }
        };
      }
      console.log('🔍 Filtrage backend - hasDelimitations:', filters.hasDelimitations);
    }

    // Récupérer les produits avec les filtres
    const products = await this.prisma.product.findMany({
      where,
      include: {
        CategoryToProduct: {
          include: {
            categories: true
          }
        },
        sizes: true,
        stocks: true, // 📦 Inclure les stocks
        sizePrices: true, // 🆕 Inclure les prix par taille
        subCategory: true, // ✅ Inclure la sous-catégorie
        variation: true, // ✅ Inclure la variation
        colorVariations: {
          include: {
            images: {
              include: {
                delimitations: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: filters.limit,
      skip: filters.offset,
    });

    // Compter le total pour la pagination
    const total = await this.prisma.product.count({ where });

    console.log('🔍 Filtrage backend - Produits trouvés:', products.length);
    console.log('🔍 Filtrage backend - Total:', total);

    // Enrichir les produits avec les informations de design
    const enrichedProducts = products.map(product => {
      // Calculer les métadonnées de design
      let designCount = 0;
      let hasDesign = false;
      let hasDelimitations = false;

      product.colorVariations.forEach(colorVar => {
        colorVar.images.forEach(image => {
          if (image.designUrl && image.isDesignActive) {
            designCount++;
            hasDesign = true;
          }
          if (image.delimitations && image.delimitations.length > 0) {
            hasDelimitations = true;
          }
        });
      });

      // Transformer les images pour inclure les informations de design
      const transformedColorVariations = product.colorVariations.map(colorVar => {
        // 📦 Organiser les stocks par couleur et taille (ARRAY d'objets)
        const colorStocks = product.stocks
          .filter(s => s.colorId === colorVar.id)
          .map(s => ({
            sizeName: s.sizeName,
            stock: s.stock
          }));

        return {
          ...colorVar,
          stocks: colorStocks, // 📦 Array d'objets [{ sizeName, stock }]
          images: colorVar.images.map(image => ({
            ...image,
            customDesign: image.designUrl ? {
              id: image.designPublicId,
              url: image.designUrl,
              originalName: image.designOriginalName,
              thumbnailUrl: image.designUrl,
              uploadedAt: image.designUploadDate?.toISOString(),
              size: image.designSize,
              isActive: image.isDesignActive,
              description: image.designDescription
            } : null
          }))
        };
      });

      return {
        ...product,
        hasCustomDesigns: hasDesign,
        hasDelimitations,
        designsMetadata: {
          totalDesigns: designCount,
          lastUpdated: hasDesign ? new Date().toISOString() : null
        },
        colorVariations: transformedColorVariations
      };
    });

    return {
      success: true,
      data: enrichedProducts,
      pagination: {
        total,
        limit: filters.limit || products.length,
        offset: filters.offset || 0,
        hasMore: (filters.offset || 0) + (filters.limit || products.length) < total
      },
      filters: {
        applied: filters,
        resultsCount: enrichedProducts.length
      }
    };
  }

  /**
   * Admin: Met à jour les catégories d'un produit avec validation hiérarchique basique.
   * Règle: si subCategoryId est fourni, il doit avoir parentId = categoryId (si fourni).
   * Si variationId est fourni, son parentId doit être subCategoryId (si fourni) ou categoryId (si subCategoryId absent mais variation enfant direct).
   */
  async updateProductCategoriesAdmin(
    productId: number,
    body: { categoryId?: number | null; subCategoryId?: number | null; variationId?: number | null }
  ) {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        CategoryToProduct: {
          include: {
            categories: true
          }
        }
      }
    });
    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    const { categoryId, subCategoryId, variationId } = body;

    const categoriesToConnect: number[] = [];
    const categoriesToEnsure: number[] = [];

    // Charger catégories si nécessaires
    let category: any = null;
    let subCategory: any = null;
    let variation: any = null;

    if (categoryId) {
      category = await this.prisma.category.findUnique({ where: { id: categoryId } });
      if (!category) throw new BadRequestException({ code: 'InvalidTarget', message: 'Catégorie cible introuvable.' });
      categoriesToEnsure.push(categoryId);
    }
    if (subCategoryId) {
      subCategory = await this.prisma.category.findUnique({ where: { id: subCategoryId } });
      if (!subCategory) throw new BadRequestException({ code: 'InvalidTarget', message: 'Sous-catégorie cible introuvable.' });
      categoriesToEnsure.push(subCategoryId);
    }
    if (variationId) {
      variation = await this.prisma.category.findUnique({ where: { id: variationId } });
      if (!variation) throw new BadRequestException({ code: 'InvalidTarget', message: 'Variation cible introuvable.' });
      categoriesToEnsure.push(variationId);
    }

    // Validation hiérarchique supprimée (schéma actuel: catégories plates)

    // Construire la nouvelle liste de catégories liées
    if (categoryId) categoriesToConnect.push(categoryId);
    if (subCategoryId) categoriesToConnect.push(subCategoryId);
    if (variationId) categoriesToConnect.push(variationId);

    // Mise à jour: déconnecter toutes les anciennes catégories et connecter les nouvelles
    // Delete all existing CategoryToProduct entries for this product
    await this.prisma.categoryToProduct.deleteMany({
      where: { B: productId },
    });

    // Create new CategoryToProduct entries
    if (categoriesToConnect.length > 0) {
      await this.prisma.categoryToProduct.createMany({
        data: categoriesToConnect.map((cid) => ({
          A: cid,
          B: productId
        })),
        skipDuplicates: true,
      });
    }

    return this.prisma.product.findUnique({
      where: { id: productId },
      include: {
        CategoryToProduct: {
          include: {
            categories: true
          }
        }
      }
    });
  }

  // Méthode mise à jour pour inclure les informations de design
  async findAllWithDesignInfo() {
    const products = await this.prisma.product.findMany({
      where: { isDelete: false },
      include: {
        CategoryToProduct: {
          include: {
            categories: true
          }
        },
        sizes: true,
        stocks: true, // 📦 Inclure les stocks
        sizePrices: true, // 🆕 Inclure les prix par taille
        colorVariations: {
          include: {
            images: {
              include: {
                delimitations: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Enrichir les produits avec les informations de design et stocks
    const enrichedProducts = products.map(product => {
      // Calculer les métadonnées de design
      let designCount = 0;
      let hasDesign = false;

      product.colorVariations.forEach(colorVar => {
        colorVar.images.forEach(image => {
          if (image.designUrl && image.isDesignActive) {
            designCount++;
            hasDesign = true;
          }
        });
      });

      // Transformer les images pour inclure les informations de design
      const transformedColorVariations = product.colorVariations.map(colorVar => {
        // 📦 Organiser les stocks par couleur et taille (ARRAY d'objets)
        const colorStocks = product.stocks
          .filter(s => s.colorId === colorVar.id)
          .map(s => ({
            sizeName: s.sizeName,
            stock: s.stock
          }));

        return {
          ...colorVar,
          stocks: colorStocks, // 📦 Array d'objets [{ sizeName, stock }]
          images: colorVar.images.map(image => ({
            ...image,
            customDesign: image.designUrl ? {
              id: image.designPublicId,
              url: image.designUrl,
              originalName: image.designOriginalName,
              thumbnailUrl: image.designUrl, // Pour l'instant, même URL
              uploadedAt: image.designUploadDate?.toISOString(),
              size: image.designSize,
              isActive: image.isDesignActive,
              description: image.designDescription
            } : null
          }))
        };
      });

      return {
        ...product,
        hasCustomDesigns: hasDesign,
        designsMetadata: {
          totalDesigns: designCount,
          lastUpdated: hasDesign ? new Date().toISOString() : null
        },
        colorVariations: transformedColorVariations
      };
    });

    return enrichedProducts;
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, isDelete: false },
      include: {
        sizes: true,
        stocks: true, // 📦 Inclure les stocks
        sizePrices: true, // 🆕 Inclure les prix par taille
        subCategory: true, // ✅ Inclure la sous-catégorie
        variation: true, // ✅ Inclure la variation
        colorVariations: {
          include: {
            images: {
              include: {
                delimitations: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }

    // Calculer les métadonnées de design
    let designCount = 0;
    let hasDesign = false;

    product.colorVariations.forEach(colorVar => {
      colorVar.images.forEach(image => {
        if (image.designUrl && image.isDesignActive) {
          designCount++;
          hasDesign = true;
        }
      });
    });

    // Transformer les images pour inclure les informations de design
    const transformedColorVariations = product.colorVariations.map(colorVar => {
      // 📦 Organiser les stocks par couleur et taille (ARRAY d'objets)
      const colorStocks = product.stocks
        .filter(s => s.colorId === colorVar.id)
        .map(s => ({
          sizeName: s.sizeName,
          stock: s.stock
        }));

      return {
        ...colorVar,
        stocks: colorStocks, // 📦 Array d'objets [{ sizeName, stock }]
        images: colorVar.images.map(image => ({
          ...image,
          customDesign: image.designUrl ? {
            id: image.designPublicId,
            url: image.designUrl,
            originalName: image.designOriginalName,
            thumbnailUrl: image.designUrl, // Pour l'instant, même URL
            uploadedAt: image.designUploadDate?.toISOString(),
            size: image.designSize,
            isActive: image.isDesignActive,
            description: image.designDescription
          } : null
        }))
      };
    });

    return {
      ...product,
      hasCustomDesigns: hasDesign,
      designsMetadata: {
        totalDesigns: designCount,
        lastUpdated: hasDesign ? new Date().toISOString() : null
      },
      colorVariations: transformedColorVariations
    };
  }

  async findAllDeleted() {
    return this.prisma.product.findMany({
      where: { isDelete: true },
      include: {
        CategoryToProduct: {
          include: {
            categories: true
          }
        },
        sizes: true,
        colorVariations: {
          include: {
            images: {
              include: {
                delimitations: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async uploadDesign(
    productId: number,
    colorId: number,
    imageId: number,
    designFile: Express.Multer.File,
    options: { 
      originalName?: string; 
      description?: string; 
      replaceExisting?: boolean 
    } = {}
  ) {
    const { originalName, description, replaceExisting = true } = options;

    // Validation du fichier
    this.validateDesignFile(designFile);

    // Vérifier que l'image existe et appartient au produit/couleur
    const productImage = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        colorVariation: {
          id: colorId,
          productId: productId
        }
      }
    });

    if (!productImage) {
      throw new NotFoundException('Image de produit non trouvée');
    }

    // Vérifier si un design existe déjà
    if (productImage.designUrl && !replaceExisting) {
      throw new BadRequestException('Un design existe déjà sur cette image. Utilisez replaceExisting=true pour le remplacer.');
    }

    // Supprimer l'ancien design s'il existe
    if (productImage.designUrl && productImage.designPublicId) {
      try {
        await this.cloudinaryService.deleteImage(productImage.designPublicId);
      } catch (error) {
        console.warn('Erreur lors de la suppression de l\'ancien design:', error.message);
      }
    }

    // Uploader le nouveau design vers Cloudinary
    const designUploadResult = await this.cloudinaryService.uploadImage(
      designFile,
      'designs' // Dossier spécifique pour les designs
    );

    // Mettre à jour l'image avec les informations du design
    const updatedImage = await this.prisma.productImage.update({
      where: { id: imageId },
      data: {
        designUrl: designUploadResult.secure_url,
        designPublicId: designUploadResult.public_id,
        designFileName: designUploadResult.public_id.split('/').pop() + '.webp',
        designOriginalName: originalName || designFile.originalname,
        designDescription: description,
        designSize: designFile.size,
        designUploadDate: new Date(),
        isDesignActive: true
      }
    });

    // Mettre à jour les métadonnées du produit
    await this.updateProductDesignMetadata(productId);

    // Le produit contient désormais un design personnalisé : repasser en brouillon et demander validation admin
    await this.markProductNeedsValidation(productId);

    return {
      success: true,
      design: {
        id: designUploadResult.public_id,
        url: updatedImage.designUrl,
        filename: updatedImage.designFileName,
        size: designFile.size
      }
    };
  }

  async replaceDesign(
    productId: number,
    colorId: number,
    imageId: number,
    designFile: Express.Multer.File,
    options: { originalName?: string } = {}
  ) {
    const { originalName } = options;

    // Validation du fichier
    this.validateDesignFile(designFile);

    // Vérifier que l'image existe et appartient au produit/couleur
    const productImage = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        colorVariation: {
          id: colorId,
          productId: productId
        }
      }
    });

    if (!productImage) {
      throw new NotFoundException('Image de produit non trouvée');
    }

    if (!productImage.designUrl) {
      throw new BadRequestException('Aucun design existant à remplacer');
    }

    const previousDesignId = productImage.designPublicId;
    const previousDesignFilename = productImage.designFileName;

    // Uploader le nouveau design vers Cloudinary
    const designUploadResult = await this.cloudinaryService.uploadImage(
      designFile,
      'designs'
    );

    // Mettre à jour l'image avec les informations du nouveau design
    const updatedImage = await this.prisma.productImage.update({
      where: { id: imageId },
      data: {
        designUrl: designUploadResult.secure_url,
        designPublicId: designUploadResult.public_id,
        designFileName: designUploadResult.public_id.split('/').pop() + '.webp',
        designOriginalName: originalName || designFile.originalname,
        designSize: designFile.size,
        designUploadDate: new Date(),
        isDesignActive: true
      }
    });

    // Supprimer l'ancien design de Cloudinary
    if (previousDesignId) {
      try {
        await this.cloudinaryService.deleteImage(previousDesignId);
      } catch (error) {
        console.warn('Erreur lors de la suppression de l\'ancien design:', error.message);
      }
    }

    // Repasser le produit en attente de validation admin après modification du design
    await this.markProductNeedsValidation(productId);

    return {
      success: true,
      design: {
        id: designUploadResult.public_id,
        url: updatedImage.designUrl,
        filename: updatedImage.designFileName,
        size: designFile.size
      },
      previousDesign: {
        id: previousDesignId,
        deleted: true
      }
    };
  }

  async getDesign(productId: number, colorId: number, imageId: number) {
    // Vérifier que l'image existe et appartient au produit/couleur
    const productImage = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        colorVariation: {
          id: colorId,
          productId: productId
        }
      }
    });

    if (!productImage) {
      throw new NotFoundException('Image de produit non trouvée');
    }

    if (!productImage.designUrl) {
      return { design: null };
    }

    return {
      design: {
        id: productImage.designPublicId,
        url: productImage.designUrl,
        filename: productImage.designFileName,
        originalName: productImage.designOriginalName,
        size: productImage.designSize,
        uploadedAt: productImage.designUploadDate?.toISOString(),
        isActive: productImage.isDesignActive,
        description: productImage.designDescription
      }
    };
  }

  private async updateProductDesignMetadata(productId: number) {
    // Compter le nombre total de designs pour ce produit
    const designCount = await this.prisma.productImage.count({
      where: {
        colorVariation: {
          productId: productId
        },
        designUrl: {
          not: null
        },
        isDesignActive: true
      }
    });

    // Mettre à jour les métadonnées du produit
    await this.prisma.product.update({
      where: { id: productId },
      data: {
        hasCustomDesigns: designCount > 0,
        designsMetadata: {
          totalDesigns: designCount,
          lastUpdated: new Date().toISOString()
        }
      }
    });
  }

  async deleteDesign(productId: number, colorId: number, imageId: number) {
    // Vérifier que l'image existe et appartient au produit/couleur
    const productImage = await this.prisma.productImage.findFirst({
      where: {
        id: imageId,
        colorVariation: {
          id: colorId,
          productId: productId
        }
      }
    });

    if (!productImage) {
      throw new NotFoundException('Image de produit non trouvée');
    }

    if (!productImage.designUrl) {
      throw new BadRequestException('Aucun design n\'est associé à cette image');
    }

    const designId = productImage.designPublicId;
    const designFilename = productImage.designFileName;

    // Supprimer le design de Cloudinary
    if (productImage.designPublicId) {
      try {
        await this.cloudinaryService.deleteImage(productImage.designPublicId);
      } catch (error) {
        console.warn('Erreur lors de la suppression du design de Cloudinary:', error.message);
      }
    }

    // Mettre à jour l'image pour supprimer les références au design
    await this.prisma.productImage.update({
      where: { id: imageId },
      data: {
        designUrl: null,
        designPublicId: null,
        designFileName: null,
        designOriginalName: null,
        designDescription: null,
        designSize: null,
        designUploadDate: null,
        isDesignActive: false
      }
    });

    // Mettre à jour les métadonnées du produit
    await this.updateProductDesignMetadata(productId);

    return {
      success: true,
      deletedDesign: {
        id: designId,
        filename: designFilename
      }
    };
  }

  async getBlankProducts(filters: {
    status?: 'published' | 'draft' | 'all';
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const { status = 'all', limit = 50, offset = 0, search } = filters;

    // Construire les conditions de filtrage
    const where: any = {};

    if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Récupérer les produits avec leurs images
    const products = await this.prisma.product.findMany({
      where: { isDelete: false },
      include: {
        CategoryToProduct: {
          include: {
            categories: true
          }
        },
        sizes: true,
        subCategory: true, // ✅ Inclure la sous-catégorie
        variation: true, // ✅ Inclure la variation
        colorVariations: {
          include: {
            images: {
              include: {
                delimitations: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Filtrer les produits vierges (sans design)
    const blankProducts = products.filter(product => {
      return product.colorVariations.every(colorVar => 
        colorVar.images.every(img => !img.designUrl)
      );
    });

    // Appliquer la pagination
    const paginatedProducts = blankProducts.slice(offset, offset + limit);

    // Ajouter les métadonnées de design
    const productsWithMetadata = paginatedProducts.map(product => ({
      ...product,
      hasDesign: false,
      designCount: 0
    }));

    return {
      success: true,
      data: productsWithMetadata,
      pagination: {
        total: blankProducts.length,
        limit,
        offset,
        hasNext: blankProducts.length > (offset + limit)
      }
    };
  }

  async getDesignStats() {
    // Récupérer tous les produits avec leurs images
    const products = await this.prisma.product.findMany({
      where: { isDelete: false },
      include: {
        colorVariations: {
          include: {
            images: true
          }
        }
      }
    });

    const totalProducts = products.length;
    let productsWithDesign = 0;
    let totalDesigns = 0;

    products.forEach(product => {
      let productHasDesign = false;
      product.colorVariations.forEach(colorVar => {
        colorVar.images.forEach(image => {
          if (image.designUrl) {
            totalDesigns++;
            productHasDesign = true;
          }
        });
      });
      if (productHasDesign) {
        productsWithDesign++;
      }
    });

    const blankProducts = totalProducts - productsWithDesign;
    const designPercentage = totalProducts > 0 ? (productsWithDesign / totalProducts) * 100 : 0;
    const averageDesignsPerProduct = totalProducts > 0 ? totalDesigns / totalProducts : 0;

    return {
      success: true,
      stats: {
        totalProducts,
        productsWithDesign,
        blankProducts,
        designPercentage: Math.round(designPercentage * 100) / 100,
        totalDesigns,
        averageDesignsPerProduct: Math.round(averageDesignsPerProduct * 100) / 100
      }
    };
  }

  private validateDesignFile(file: Express.Multer.File) {
    // Cohérence avec multerConfig.ts
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml'
    ];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const minDimensions = { width: 100, height: 100 };
    const maxDimensions = { width: 4000, height: 4000 };

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Format de fichier non supporté. Formats acceptés: PNG, JPG, JPEG, GIF, WEBP, SVG'
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        'Fichier trop volumineux. Taille maximale: 10MB'
      );
    }

    // Validation basique du nom de fichier
    if (file.originalname && file.originalname.length > 255) {
      throw new BadRequestException(
        'Nom de fichier trop long. Maximum 255 caractères'
      );
    }

    // Nettoyage du nom de fichier pour éviter les caractères dangereux
    const dangerousChars = /[<>:"/\\|?*\x00-\x1f]/g;
    if (file.originalname && dangerousChars.test(file.originalname)) {
      throw new BadRequestException(
        'Nom de fichier contient des caractères non autorisés'
      );
    }

    return true;
  }

  /**
   * MÉTHODES DE VALIDATION ADMIN POUR LES PRODUITS
   */

  /**
   * Soumet un produit pour validation par l'admin
   */
  async submitProductForValidation(id: number, vendorId: number): Promise<any> {
    const existingProduct = await this.prisma.product.findFirst({
      where: { id, isDelete: false },
      include: {
        CategoryToProduct: {
          include: {
            categories: true
          }
        },
        colorVariations: {
          include: { images: true }
        }
      }
    });

    if (!existingProduct) {
      throw new NotFoundException('Produit non trouvé');
    }

    if (existingProduct.status !== PublicationStatus.DRAFT) {
      throw new BadRequestException('Seuls les produits en brouillon peuvent être soumis pour validation');
    }

    const updatedProduct = await this.prisma.product.update({
      where: { id },
      data: {
        submittedForValidationAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        CategoryToProduct: {
          include: {
            categories: true
          }
        },
        colorVariations: {
          include: { images: true }
        }
      }
    });

    // Notifier les admins par email
    await this.notifyAdminsNewProductSubmission(updatedProduct);

    return updatedProduct;
      }
      
  /**
   * Valide un produit (réservé aux admins)
   */
  async validateProduct(
    id: number, 
    adminId: number, 
    approved: boolean, 
    rejectionReason?: string
  ): Promise<any> {
    // Vérifier que l'utilisateur est admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId }
      });
      
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      throw new ForbiddenException('Seuls les administrateurs peuvent valider les produits');
    }

    const existingProduct = await this.prisma.product.findUnique({
      where: { id, isDelete: false },
      include: { 
        CategoryToProduct: { include: { categories: true } },
        colorVariations: {
          include: { images: true }
        }
      }
    });

    if (!existingProduct) {
      throw new NotFoundException('Produit non trouvé');
  }

    if (!existingProduct.submittedForValidationAt) {
      throw new BadRequestException('Ce produit n\'est pas en attente de validation');
    }

    const updatedProduct = await this.prisma.product.update({
        where: { id },
        data: {
        isValidated: approved,
        status: approved ? PublicationStatus.PUBLISHED : PublicationStatus.DRAFT,
        validatedAt: new Date(),
        validatedBy: adminId,
        rejectionReason: approved ? null : rejectionReason,
        submittedForValidationAt: null, // Reset car traité
        updatedAt: new Date()
      },
      include: {
        CategoryToProduct: { include: { categories: true } },
        colorVariations: {
          include: { images: true }
        },
        validator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Envoyer email de notification (nous devrons créer ces templates)
    if (approved) {
      await this.notifyVendorProductApproved(updatedProduct, adminId);
    } else {
      await this.notifyVendorProductRejected(updatedProduct, rejectionReason, adminId);
    }

    return updatedProduct;
  }

  /**
   * Récupère tous les produits en attente de validation (pour les admins)
   */
  async getPendingProducts(adminId: number, queryDto: any): Promise<any> {
    // Vérifier que l'utilisateur est admin
    const admin = await this.prisma.user.findUnique({
      where: { id: adminId }
      });
      
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      throw new ForbiddenException('Seuls les administrateurs peuvent voir les produits en attente');
    }

    const { page, limit, search, sortBy, sortOrder } = queryDto;
    const currentPage = page && !isNaN(Number(page)) && Number(page) > 0 ? Number(page) : 1;
    const take = limit && !isNaN(Number(limit)) && Number(limit) > 0 ? Number(limit) : 20;
    const skip = (currentPage - 1) * take;

    // Construction des filtres pour produits en attente
    const where: any = {
      submittedForValidationAt: { not: null },
      isValidated: false,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Construction du tri
    const orderBy: any = {};
    switch (sortBy) {
      case 'price':
        orderBy.price = sortOrder;
        break;
      case 'name':
        orderBy.name = sortOrder;
        break;
      default:
        orderBy.submittedForValidationAt = sortOrder || 'desc';
    }

    const [products, totalCount] = await Promise.all([
      this.prisma.product.findMany({
        where: { isDelete: false, ...where },
        skip,
        take: take,
        orderBy,
        include: {
          CategoryToProduct: { include: { categories: true } },
          colorVariations: {
            include: { images: true }
          }
        }
      }),
      this.prisma.product.count({ where: { isDelete: false, ...where } })
    ]);

    const totalPages = Math.ceil(totalCount / take);
      
      return {
      products,
      pagination: {
        currentPage: currentPage,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: take
      }
    };
  }

  /**
   * Notifie les admins qu'un nouveau produit a été soumis
   */
  private async notifyAdminsNewProductSubmission(product: any): Promise<void> {
    try {
      // Récupérer tous les admins
      const admins = await this.prisma.user.findMany({
        where: {
          role: { in: ['ADMIN', 'SUPERADMIN'] },
          status: true
        }
      });
      
      // Envoyer un email à chaque admin
      for (const admin of admins) {
        await this.mailService.sendEmail({
          to: admin.email,
          subject: '📦 Nouveau produit à valider - Printalma',
          template: 'product-submission',
          context: {
            adminName: `${admin.firstName} ${admin.lastName}`,
            productName: product.name,
            productPrice: product.price,
            productCategories: product.categories.map(c => c.name).join(', '),
            submissionDate: product.submittedForValidationAt?.toLocaleDateString('fr-FR') || 'Inconnue',
            productImagesCount: product.colorVariations.reduce((acc, cv) => acc + cv.images.length, 0),
            validationUrl: `${process.env.FRONTEND_URL}/admin/products/pending`,
          }
        });
      }
            } catch (error) {
      console.error('Erreur lors de l\'envoi des notifications aux admins (produits):', error);
    }
  }

  /**
   * Notifie le vendeur que son produit a été approuvé
   */
  private async notifyVendorProductApproved(product: any, adminId: number): Promise<void> {
    try {
      // Pour les produits, nous devrons récupérer l'info du vendeur d'une autre façon
      // car les produits de base n'ont pas de vendeur direct
      // TODO: Adapter selon la logique métier
      console.log('Product approved notification - TODO: implement based on business logic');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification d\'approbation (produit):', error);
            }
          }
          
  /**
   * Notifie le vendeur que son produit a été rejeté
   */
  private async notifyVendorProductRejected(product: any, rejectionReason?: string, adminId?: number): Promise<void> {
    try {
      // Pour les produits, nous devrons récupérer l'info du vendeur d'une autre façon
      // TODO: Adapter selon la logique métier
      console.log('Product rejected notification - TODO: implement based on business logic');
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification de rejet (produit):', error);
    }
  }

  /**
   * Lorsqu'un design est ajouté ou remplacé, le produit doit être revu par un administrateur
   */
  private async markProductNeedsValidation(productId: number): Promise<void> {
    try {
      const product = await this.prisma.product.update({
        where: { id: productId },
        data: {
          isValidated: false,
          status: PublicationStatus.DRAFT,
          submittedForValidationAt: new Date(),
          updatedAt: new Date()
      },
      include: {
          CategoryToProduct: { include: { categories: true } },
          colorVariations: { include: { images: true } }
        }
      });

      // Notifier immédiatement les admins qu'un produit a changé de design et nécessite validation
      await this.notifyAdminsNewProductSubmission(product);
    } catch (error) {
      // Ne jamais bloquer l'upload de design à cause de la notification
      console.error('Erreur markProductNeedsValidation:', error);
    }
  }

  async restore(id: number): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id, isDelete: true } });
    if (!product) throw new NotFoundException('Produit supprimé introuvable');
    await this.prisma.product.update({ where: { id }, data: { isDelete: false } });
  }

  async softDeleteProduct(id: number): Promise<void> {
    const product = await this.prisma.product.findFirst({ where: { id, isDelete: false } });
    if (!product) throw new NotFoundException('Produit admin introuvable');
    await this.prisma.product.update({ where: { id }, data: { isDelete: true } });
  }

  async deleteForever(id: number): Promise<void> {
    const product = await this.prisma.product.findUnique({ where: { id } });
    if (!product || !product.isDelete) {
      throw new BadRequestException('Seuls les produits déjà supprimés (soft delete) peuvent être supprimés définitivement');
    }
    // Supprimer tous les VendorProduct liés à ce produit admin
    await this.prisma.vendorProduct.deleteMany({ where: { baseProductId: id } });
    // Supprimer le produit admin
    await this.prisma.product.delete({ where: { id } });
  }

  async updateProduct(id: number, updateDto: any) {
    // 1. Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({ where: { id, isDelete: false } });
    if (!product) throw new NotFoundException('Produit admin introuvable');

    // ✅ LOGS DE DÉBOGAGE POUR SUGGESTED PRICE ET AUTOCOLLANT
    console.log('🎨 [BACKEND] === MISE À JOUR PRODUIT AUTOCOLLANT ===');
    console.log('🔍 [BACKEND] updateProduct - updateDto reçu:', JSON.stringify(updateDto, null, 2));
    console.log('🔍 [BACKEND] updateProduct - suggestedPrice reçu:', updateDto.suggestedPrice);
    console.log('🔍 [BACKEND] updateProduct - suggestedPrice type:', typeof updateDto.suggestedPrice);
    console.log('🔍 [BACKEND] updateProduct - genre reçu:', updateDto.genre);

    const isAutocollant = updateDto.genre === 'AUTOCOLLANT' || product.genre === 'AUTOCOLLANT';
    const isTableau = updateDto.genre === 'TABLEAU' || product.genre === 'TABLEAU';
    const isProductWithoutStock = isAutocollant || isTableau;
    console.log('🎨 [BACKEND] Type de produit:', isAutocollant ? 'AUTOCOLLANT' : (isTableau ? 'TABLEAU' : 'Standard'));

    // ✅ CORRECTION AUTOMATIQUE : Si produit sans stock (AUTOCOLLANT/TABLEAU), forcer requiresStock à false
    if (isProductWithoutStock && updateDto.requiresStock !== false) {
      const productType = isTableau ? 'TABLEAU' : 'AUTOCOLLANT';
      console.warn(`⚠️ [BACKEND] ${productType} avec requiresStock=true, correction automatique → false`);
      updateDto.requiresStock = false;
    }

    // ✅ Valider le prix des variations pour produits sans stock (AUTOCOLLANT/TABLEAU)
    if (isProductWithoutStock && updateDto.colorVariations) {
      for (const variation of updateDto.colorVariations) {
        if (!variation.price || variation.price <= 0) {
          const productType = isTableau ? 'TABLEAU' : 'AUTOCOLLANT';
          throw new BadRequestException(
            `Les variations ${productType} doivent avoir un prix. Variation "${variation.name}" sans prix.`
          );
        }
      }
    }

    // ✅ Valider le format des tailles pour produits sans stock (AUTOCOLLANT/TABLEAU)
    if (isProductWithoutStock && updateDto.sizes && updateDto.sizes.length > 0) {
      const validateSizeFormat = (size: string): boolean => {
        // Format attendu: "5cm*5cm", "10cm*10cm", "5cm x 10cm" ou "20x30cm"
        const regex = /^\d+(cm|mm)\s*[\*xX]\s*\d+(cm|mm)$/i;
        return regex.test(size.trim());
      };

      for (const size of updateDto.sizes) {
        if (typeof size === 'string' && !validateSizeFormat(size)) {
          const productType = isTableau ? 'tableau' : 'autocollant';
          throw new BadRequestException(
            `Taille de ${productType} invalide: "${size}". Format attendu: "5cm*5cm" ou "20x30cm"`
          );
        }
      }
    }

    // 🆕 VALIDATION DES PRIX PAR TAILLE
    if (updateDto.sizes && updateDto.sizes.length > 0) {
      if (!updateDto.sizePricing || updateDto.sizePricing.length === 0) {
        throw new BadRequestException('Les prix par taille sont requis quand des tailles sont définies');
      }

      // Vérifier que chaque taille a un prix de vente suggéré > 0
      const sizesWithoutPrice = updateDto.sizes.filter(size =>
        !updateDto.sizePricing!.find(p => p.size === size && p.suggestedPrice > 0)
      );

      if (sizesWithoutPrice.length > 0) {
        throw new BadRequestException(
          `Prix de vente suggéré manquant pour les tailles: ${sizesWithoutPrice.join(', ')}`
        );
      }

      // Si useGlobalPricing est true, vérifier la cohérence
      if (updateDto.useGlobalPricing) {
        if (!updateDto.globalCostPrice || updateDto.globalCostPrice < 0) {
          throw new BadRequestException('Prix de revient global requis');
        }
        if (!updateDto.globalSuggestedPrice || updateDto.globalSuggestedPrice <= 0) {
          throw new BadRequestException('Prix de vente suggéré global requis et doit être > 0');
        }

        // Vérifier que tous les prix correspondent aux prix globaux
        const invalidPrices = updateDto.sizePricing.filter(p =>
          p.costPrice !== updateDto.globalCostPrice ||
          p.suggestedPrice !== updateDto.globalSuggestedPrice
        );

        if (invalidPrices.length > 0) {
          throw new BadRequestException(
            'Les prix par taille doivent correspondre aux prix globaux quand useGlobalPricing est true'
          );
        }
      }

      console.log('✅ [BACKEND] Prix par taille validés:', updateDto.sizePricing.length);
    }

    // 2. Préparer les données à mettre à jour
    const data: any = {};
    if (updateDto.name !== undefined) data.name = updateDto.name;
    if (updateDto.description !== undefined) data.description = updateDto.description;
    if (updateDto.price !== undefined) data.price = updateDto.price;
    if (updateDto.suggestedPrice !== undefined) data.suggestedPrice = updateDto.suggestedPrice;
    if (updateDto.requiresStock !== undefined) {
      data.requiresStock = updateDto.requiresStock;
      // Si on désactive la gestion de stock (AUTOCOLLANT), mettre le stock à 0 (pas null car la colonne n'est pas nullable)
      if (updateDto.requiresStock === false) {
        data.stock = 0;
      }
    }
    if (updateDto.stock !== undefined && data.requiresStock !== false) data.stock = updateDto.stock;
    if (updateDto.status !== undefined) data.status = updateDto.status;
    if (updateDto.genre !== undefined) data.genre = updateDto.genre;
    // 🆕 Champs pour la tarification par taille
    if (updateDto.useGlobalPricing !== undefined) data.useGlobalPricing = updateDto.useGlobalPricing;
    if (updateDto.globalCostPrice !== undefined) data.globalCostPrice = updateDto.globalCostPrice;
    if (updateDto.globalSuggestedPrice !== undefined) data.globalSuggestedPrice = updateDto.globalSuggestedPrice;
    
    console.log('🔍 [BACKEND] updateProduct - data avant mise à jour:', JSON.stringify(data, null, 2));

    // 3. Mettre à jour le produit principal
    let updatedProduct: any;
    try {
      updatedProduct = await this.prisma.product.update({
        where: { id },
        data,
        include: {
          CategoryToProduct: { include: { categories: true } },
          sizes: true,
          sizePrices: true, // 🆕 Inclure les prix par taille
          colorVariations: {
            include: {
              images: {
                include: {
                  delimitations: true,
                },
              },
            },
          },
        },
      });
    } catch (error) {
      console.error('❌ [BACKEND] updateProduct - Prisma update error:', {
        message: error?.message,
        code: error?.code,
        meta: error?.meta,
        dataAttempted: data
      });
      throw new BadRequestException('Mise à jour invalide: ' + (error?.message || 'Erreur inconnue'));
    }
    
    console.log('🔍 [BACKEND] updateProduct - Produit après mise à jour principale:');
    console.log('   - suggestedPrice:', updatedProduct.suggestedPrice);
    console.log('   - genre:', updatedProduct.genre);
    console.log('   - status:', updatedProduct.status);

    // 4. Mettre à jour les catégories si fourni
    if (updateDto.categories) {
      // Suppression des anciennes associations et ajout des nouvelles
      await this.prisma.categoryToProduct.deleteMany({
        where: { B: id },
      });

      if (updateDto.categories.length > 0) {
        await this.prisma.categoryToProduct.createMany({
          data: updateDto.categories.map((categoryId: number) => ({
            A: Number(categoryId),
            B: id
          })),
          skipDuplicates: true,
        });
      }
    }

    // 5. Mettre à jour les tailles si fourni
    if (updateDto.sizes) {
      // Séparer les strings et les nombres
      const stringSizes = updateDto.sizes.filter(s => typeof s === 'string');
      const numberSizes = updateDto.sizes.filter(s => typeof s === 'number');

      let sizeNames: string[] = [];

      // Pour les nombres, récupérer les sizeName existants
      if (numberSizes.length > 0) {
        const foundProductSizes = await this.prisma.productSize.findMany({
          where: { id: { in: numberSizes } },
        });
        sizeNames = sizeNames.concat(foundProductSizes.map(s => s.sizeName));
      }

      // Ajouter les strings directement
      sizeNames = sizeNames.concat(stringSizes);

      // Récupérer les tailles existantes pour ce produit
      const existingProductSizes = await this.prisma.productSize.findMany({
        where: { productId: id },
      });
      const existingSizeNames = existingProductSizes.map(ps => ps.sizeName);

      // Supprimer les tailles qui ne sont plus présentes
      const sizesToDelete = existingProductSizes.filter(ps => !sizeNames.includes(ps.sizeName));
      if (sizesToDelete.length > 0) {
        await this.prisma.productSize.deleteMany({
          where: {
            productId: id,
            sizeName: { in: sizesToDelete.map(ps => ps.sizeName) },
          },
        });
      }

      // Ajouter les nouvelles tailles qui n'existent pas encore
      const sizesToAdd = sizeNames.filter(sizeName => !existingSizeNames.includes(sizeName));
      if (sizesToAdd.length > 0) {
        await this.prisma.productSize.createMany({
          data: sizesToAdd.map((sizeName) => ({
            productId: id,
            sizeName: String(sizeName), // Sécurité : cast en string
          })),
        });
      }
    }

    // 🆕 5.1. Mettre à jour les prix par taille si fourni
    if (updateDto.sizePricing) {
      // Supprimer les anciens prix par taille
      await this.prisma.productSizePrice.deleteMany({
        where: { productId: id },
      });

      // Créer les nouveaux prix par taille
      if (updateDto.sizePricing.length > 0) {
        await this.prisma.productSizePrice.createMany({
          data: updateDto.sizePricing.map((pricing: any) => ({
            productId: id,
            size: pricing.size,
            costPrice: pricing.costPrice,
            suggestedPrice: pricing.suggestedPrice,
          })),
        });
        console.log('✅ [BACKEND] Prix par taille mis à jour:', updateDto.sizePricing.length);
      }
    }

    // 6. Mettre à jour les variations couleurs, images, délimitations si fourni
    if (updateDto.colorVariations) {
      // Récupérer les variations existantes
      const existingColorVars = await this.prisma.colorVariation.findMany({
        where: { productId: id },
        include: {
          images: { include: { delimitations: true } }
        }
      });
      const payloadColorVarIds = updateDto.colorVariations.filter(cv => cv.id).map(cv => Number(cv.id));
      // Supprimer les variations absentes du payload
      for (const existingCV of existingColorVars) {
        if (!payloadColorVarIds.includes(existingCV.id)) {
          // Supprimer toutes les images et délimitations liées
          for (const img of existingCV.images) {
            await this.prisma.delimitation.deleteMany({ where: { productImageId: img.id } });
          }
          await this.prisma.productImage.deleteMany({ where: { colorVariationId: existingCV.id } });
          await this.prisma.colorVariation.delete({ where: { id: existingCV.id } });
        }
      }
      // Traiter chaque variation du payload
      for (const cv of updateDto.colorVariations) {
        let colorVarId = cv.id ? Number(cv.id) : undefined;
        if (!colorVarId) {
          // Créer la variation
          const created = await this.prisma.colorVariation.create({
            data: {
              name: cv.name,
              colorCode: cv.colorCode,
              productId: id
            }
          });
          colorVarId = created.id;
        } else {
          // Mettre à jour la variation
          await this.prisma.colorVariation.update({
            where: { id: colorVarId },
            data: {
              name: cv.name,
              colorCode: cv.colorCode
            }
          });
        }
        // Gérer les images
        if (cv.images) {
          const existingImages = await this.prisma.productImage.findMany({ where: { colorVariationId: colorVarId }, include: { delimitations: true } });
          const payloadImageIds = cv.images.filter(img => img.id).map(img => Number(img.id));
          // Supprimer les images absentes du payload
          for (const img of existingImages) {
            if (!payloadImageIds.includes(img.id)) {
              await this.prisma.delimitation.deleteMany({ where: { productImageId: img.id } });
              await this.prisma.productImage.delete({ where: { id: img.id } });
            }
          }
          // Traiter chaque image du payload
          for (const img of cv.images) {
            // Ignore les images locales (blob) ou sans publicId
            if (!img.publicId || (img.url && img.url.startsWith('blob:'))) {
              // Optionnel : log
              console.warn('Image locale ignorée dans PATCH produit', img);
              continue;
            }
            // Nettoyer le champ file si présent
            if ('file' in img) {
              delete img.file;
            }
            let imageId = img.id ? Number(img.id) : undefined;
            if (!imageId) {
              // Créer l'image
              const createdImg = await this.prisma.productImage.create({
                data: {
                  view: img.view,
                  url: img.url,
                  publicId: img.publicId,
                  colorVariationId: colorVarId,
                  naturalWidth: img.naturalWidth,
                  naturalHeight: img.naturalHeight
                }
              });
              imageId = createdImg.id;
            } else {
              // Vérifier si l'image existe avant de la mettre à jour
              const existingImage = await this.prisma.productImage.findUnique({
                where: { id: imageId }
              });
              
              if (!existingImage) {
                console.warn(`Image avec ID ${imageId} non trouvée, création d'une nouvelle image`);
                // Créer une nouvelle image au lieu de mettre à jour
                const createdImg = await this.prisma.productImage.create({
                  data: {
                    view: img.view,
                    url: img.url,
                    publicId: img.publicId,
                    colorVariationId: colorVarId,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight
                  }
                });
                imageId = createdImg.id;
              } else {
                // Mettre à jour l'image existante
                await this.prisma.productImage.update({
                  where: { id: imageId },
                  data: {
                    view: img.view,
                    url: img.url,
                    publicId: img.publicId,
                    naturalWidth: img.naturalWidth,
                    naturalHeight: img.naturalHeight
                  }
                });
              }
            }
            // Gérer les délimitations
            if (img.delimitations) {
              const existingDelims = await this.prisma.delimitation.findMany({ where: { productImageId: imageId } });
              const payloadDelimIds = img.delimitations.filter(d => d.id).map(d => Number(d.id));
              // Supprimer les délimitations absentes du payload
              for (const delim of existingDelims) {
                if (!payloadDelimIds.includes(delim.id)) {
                  await this.prisma.delimitation.delete({ where: { id: delim.id } });
                }
              }
              // Traiter chaque délimitation du payload
              for (const delim of img.delimitations) {
                let delimId = delim.id ? Number(delim.id) : undefined;
                if (!delimId) {
                  // Créer
                  await this.prisma.delimitation.create({
                    data: {
                      x: delim.x,
                      y: delim.y,
                      width: delim.width,
                      height: delim.height,
                      rotation: delim.rotation || 0,
                      name: delim.name,
                      coordinateType: delim.coordinateType || 'PERCENTAGE',
                      productImageId: imageId
                    }
                  });
                } else {
                  // Mettre à jour
                  await this.prisma.delimitation.update({
                    where: { id: delimId },
                    data: {
                      x: delim.x,
                      y: delim.y,
                      width: delim.width,
                      height: delim.height,
                      rotation: delim.rotation || 0,
                      name: delim.name,
                      coordinateType: delim.coordinateType || 'PERCENTAGE'
                    }
                  });
                }
              }
            }
          }
        }
      }
    }

    // 7. Retourner le produit mis à jour
    const finalProduct = await this.prisma.product.findUnique({
      where: { id },
      include: {
        CategoryToProduct: { include: { categories: true } },
        sizes: true,
        sizePrices: true, // 🆕 Inclure les prix par taille
        colorVariations: {
          include: {
            images: {
              include: {
                delimitations: true,
              },
            },
          },
        },
      },
    });
    
    console.log('🔍 [BACKEND] updateProduct - Produit final retourné:');
    console.log('   - suggestedPrice:', finalProduct.suggestedPrice);
    console.log('   - genre:', finalProduct.genre);
    console.log('   - status:', finalProduct.status);
    
    return finalProduct;
  }

  async uploadColorImage(productId: number, colorId: number, image: Express.Multer.File) {
    // Vérifier que le produit et la variation existent
    const product = await this.prisma.product.findUnique({ where: { id: productId, isDelete: false } });
    if (!product) throw new NotFoundException('Produit admin introuvable');
    
    const colorVar = await this.prisma.colorVariation.findUnique({ where: { id: colorId } });
    if (!colorVar || colorVar.productId !== productId) throw new NotFoundException('Variation couleur introuvable pour ce produit');
    
    // Vérifier le fichier
    if (!image) throw new BadRequestException('Fichier image requis');
    
    // Upload sur Cloudinary
    const uploadResult = await this.cloudinaryService.uploadImage(image);
    
    // Créer l'image dans la base de données
    const productImage = await this.prisma.productImage.create({
      data: {
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        naturalWidth: uploadResult.width,
        naturalHeight: uploadResult.height,
        view: 'Front', // Par défaut
        colorVariationId: colorId
      },
      include: {
        delimitations: true
      }
    });
    
    return {
      success: true,
      message: 'Image uploadée avec succès',
      image: {
        id: productImage.id,
        url: productImage.url,
        publicId: productImage.publicId,
        view: productImage.view,
        colorVariationId: productImage.colorVariationId,
        delimitations: productImage.delimitations
      }
    };
  }

  // Méthodes pour les produits prêts (sans délimitations)
  async createReadyProduct(dto: CreateReadyProductDto, files: Express.Multer.File[]) {
    // ✅ LOGS DE DÉBOGAGE DÉTAILLÉS
    console.log('🎨 [BACKEND] === CRÉATION PRODUIT PRÊT/AUTOCOLLANT ===');
    console.log('🔍 [BACKEND] createReadyProduct - DTO reçu:', JSON.stringify(dto, null, 2));
    console.log('🔍 [BACKEND] createReadyProduct - isReadyProduct:', dto.isReadyProduct);
    console.log('🔍 [BACKEND] createReadyProduct - Type isReadyProduct:', typeof dto.isReadyProduct);
    console.log('🔍 [BACKEND] createReadyProduct - Genre reçu:', dto.genre);
    console.log('🔍 [BACKEND] createReadyProduct - Genre est-il défini?', !!dto.genre);
    console.log('🔍 [BACKEND] createReadyProduct - Genre est-il différent de UNISEXE?', dto.genre !== 'UNISEXE');
    console.log('🔍 [BACKEND] createReadyProduct - Type de genre:', typeof dto.genre);

    // ✅ VALIDATIONS POUR LES AUTOCOLLANTS
    const genreValue = dto.genre || 'UNISEXE';
    let requiresStock = dto.requiresStock ?? true;
    const isAutocollant = genreValue === 'AUTOCOLLANT';
    const isTableau = genreValue === 'TABLEAU';
    const isProductWithoutStock = isAutocollant || isTableau;

    console.log('🎨 [BACKEND] Type de produit:', isAutocollant ? 'AUTOCOLLANT' : (isTableau ? 'TABLEAU' : 'Standard'));
    console.log('📊 [BACKEND] requiresStock (avant correction):', requiresStock);
    console.log('💰 [BACKEND] Prix de base:', dto.price);
    console.log('🎯 [BACKEND] Variations:', dto.colorVariations?.length);
    console.log('📦 [BACKEND] Fichiers reçus:', files.length);

    // 🆕 VALIDATION DES PRIX PAR TAILLE
    if (dto.sizes && dto.sizes.length > 0) {
      // ✅ NOUVELLE VALIDATION PLUS SOUPLE
      // Si sizePricing n'est pas fourni, initialiser avec des valeurs par défaut
      if (!dto.sizePricing || dto.sizePricing.length === 0) {
        console.log('⚠️ [BACKEND] sizePricing vide, initialisation avec valeurs par défaut');
        // Initialiser avec des prix par défaut basés sur suggestedPrice du produit
        dto.sizePricing = dto.sizes.map(size => ({
          size,
          suggestedPrice: dto.suggestedPrice || 0,
          costPrice: dto.globalCostPrice || 0
        }));
      }

      // Vérifier que chaque taille a un prix de vente suggéré > 0
      const sizesWithoutPrice = dto.sizes.filter(size =>
        !dto.sizePricing!.find(p => p.size === size && p.suggestedPrice > 0)
      );

      if (sizesWithoutPrice.length > 0) {
        throw new BadRequestException(
          `Prix de vente suggéré manquant pour les tailles: ${sizesWithoutPrice.join(', ')}`
        );
      }

      // Si useGlobalPricing est true, vérifier la cohérence
      if (dto.useGlobalPricing) {
        if (!dto.globalCostPrice || dto.globalCostPrice < 0) {
          throw new BadRequestException('Prix de revient global requis');
        }
        if (!dto.globalSuggestedPrice || dto.globalSuggestedPrice <= 0) {
          throw new BadRequestException('Prix de vente suggéré global requis et doit être > 0');
        }

        // Vérifier que tous les prix correspondent aux prix globaux
        const invalidPrices = dto.sizePricing.filter(p =>
          p.costPrice !== dto.globalCostPrice ||
          p.suggestedPrice !== dto.globalSuggestedPrice
        );

        if (invalidPrices.length > 0) {
          throw new BadRequestException(
            'Les prix par taille doivent correspondre aux prix globaux quand useGlobalPricing est true'
          );
        }
      }

      console.log('✅ [BACKEND] Prix par taille validés:', dto.sizePricing.length);
    }

    // Afficher les fichiers pour debug
    files.forEach(file => {
      console.log(`   - ${file.fieldname}: ${file.originalname} (${file.size} bytes)`);
    });

    // ✅ CORRECTION AUTOMATIQUE : Si produit sans stock (AUTOCOLLANT/TABLEAU), forcer requiresStock à false
    if (isProductWithoutStock && requiresStock !== false) {
      const productType = isTableau ? 'TABLEAU' : 'AUTOCOLLANT';
      console.warn(`⚠️ [BACKEND] ${productType} avec requiresStock=true, correction automatique → false`);
      requiresStock = false;
      dto.requiresStock = false;
    }

    // ✅ Pour produits sans stock (AUTOCOLLANT/TABLEAU), forcer stock à 0 (la colonne n'est pas nullable en BDD)
    if (isProductWithoutStock) {
      dto.stock = 0;
      const productType = isTableau ? 'TABLEAU' : 'AUTOCOLLANT';
      console.log(`✅ [BACKEND] ${productType}: stock forcé à 0, requiresStock forcé à false`);
    }

    // Validation : Prix de vente suggéré obligatoire
    if (!dto.suggestedPrice || dto.suggestedPrice <= 0) {
      throw new BadRequestException('Le prix de vente suggéré est obligatoire');
    }

    // ✅ Pour les produits sans stock (AUTOCOLLANT/TABLEAU), valider que chaque variation de couleur a un prix
    if (isProductWithoutStock && dto.colorVariations) {
      for (const variation of dto.colorVariations) {
        if (!variation.price || variation.price <= 0) {
          const productType = isTableau ? 'TABLEAU' : 'AUTOCOLLANT';
          throw new BadRequestException(
            `Les variations ${productType} doivent avoir un prix. Variation "${variation.name}" sans prix.`
          );
        }
      }
    }

    // ✅ Valider le format des tailles pour produits sans stock (AUTOCOLLANT/TABLEAU)
    if (isProductWithoutStock && dto.sizes && dto.sizes.length > 0) {
      const validateSizeFormat = (size: string): boolean => {
        // Format attendu: "5cm*5cm", "10cm*10cm", "5cm x 10cm" ou "20x30cm"
        const regex = /^\d+(cm|mm)\s*[\*xX]\s*\d+(cm|mm)$/i;
        return regex.test(size.trim());
      };

      for (const size of dto.sizes) {
        if (!validateSizeFormat(size)) {
          const productType = isTableau ? 'tableau' : 'autocollant';
          throw new BadRequestException(
            `Taille de ${productType} invalide: "${size}". Format attendu: "5cm*5cm" ou "20x30cm"`
          );
        }
      }
    }

    // 1. Create file mapping
    const fileMap = new Map<string, Express.Multer.File>();
    files.forEach((file) => {
      const fileId = file.fieldname.replace('file_', '');
      fileMap.set(fileId, file);
    });

    // 2. Upload all images to Cloudinary BEFORE starting transaction
    const uploadedImages = new Map<string, any>();
    for (const colorVar of dto.colorVariations) {
      for (const image of colorVar.images) {
        const imageFile = fileMap.get(image.fileId);
        if (!imageFile) {
          throw new BadRequestException(`Image with fileId "${image.fileId}" not found in uploaded files.`);
        }

        try {
          const uploadResult = await this.cloudinaryService.uploadImage(imageFile);
          uploadedImages.set(image.fileId, uploadResult);
        } catch (error) {
          console.error(`❌ Erreur upload image ${image.fileId}:`, error);
          const errorMessage = error?.message || error?.error?.message || JSON.stringify(error) || 'Unknown error';
          throw new BadRequestException(`Failed to upload image with fileId "${image.fileId}": ${errorMessage}`);
        }
      }
    }

    // 3. Use transaction
    return this.prisma.executeTransaction(async (tx) => {
      // 3.1. Find or create categories and get their IDs
      const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      const categoryPromises = dto.categories.map(async (name) => {
        let category = await tx.category.findFirst({ where: { name } });
        if (!category) {
          category = await tx.category.create({ data: { name, slug: slugify(name) } });
        }
        return category;
      });
      const categories = await Promise.all(categoryPromises);

      // 3.2. Create the Product first (without categories and sizes)
      // ✅ UTILISER LA VALEUR ENVOYÉE PAR LE FRONTEND
      const isReadyProduct = dto.isReadyProduct === true;
      const genreValue = dto.genre || 'UNISEXE';
      const requiresStockValue = dto.requiresStock ?? true;

      console.log('🔍 [BACKEND] createReadyProduct - Valeur finale isReadyProduct:', isReadyProduct);
      console.log('🔍 [BACKEND] createReadyProduct - Valeur finale requiresStock:', requiresStockValue);

      // ✅ LOGS POUR LE GENRE
      console.log('🔍 [BACKEND] createReadyProduct - Genre avant création:', genreValue);
      console.log('🔍 [BACKEND] createReadyProduct - Genre est-il HOMME?', genreValue === 'HOMME');
      console.log('🔍 [BACKEND] createReadyProduct - Genre est-il FEMME?', genreValue === 'FEMME');
      console.log('🔍 [BACKEND] createReadyProduct - Genre est-il BEBE?', genreValue === 'BEBE');
      console.log('🔍 [BACKEND] createReadyProduct - Genre est-il UNISEXE?', genreValue === 'UNISEXE');
      console.log('🔍 [BACKEND] createReadyProduct - Genre est-il AUTOCOLLANT?', genreValue === 'AUTOCOLLANT');

      const product = await tx.product.create({
        data: {
          name: dto.name,
          description: dto.description,
          price: dto.price,
          suggestedPrice: dto.suggestedPrice, // ✅ AJOUTER LE CHAMP suggestedPrice
          stock: isProductWithoutStock ? 0 : (dto.stock ?? 0), // 0 pour AUTOCOLLANT/TABLEAU, sinon la valeur du DTO
          status: dto.status === 'published' ? PublicationStatus.PUBLISHED : PublicationStatus.DRAFT,
          isReadyProduct: isReadyProduct, // ✅ UTILISER LA VALEUR DU DTO
          genre: genreValue as ProductGenre, // ✅ AJOUTER LE CHAMP GENRE
          requiresStock: requiresStockValue, // ✅ AJOUTER LE CHAMP requiresStock
          isValidated: true, // ✅ PRODUITS PRÊTS CRÉÉS PAR ADMIN SONT VALIDÉS PAR DÉFAUT
          // 🆕 Champs pour la tarification par taille
          useGlobalPricing: dto.useGlobalPricing || false,
          globalCostPrice: dto.globalCostPrice || 0,
          globalSuggestedPrice: dto.globalSuggestedPrice || 0,
        },
      });

      console.log('💾 Produit créé avec isReadyProduct:', product.isReadyProduct);
      console.log('💾 Produit créé - Genre reçu dans DTO:', genreValue);

      // 3.3. Connect categories to the product (many-to-many via junction table)
      if (categories.length > 0) {
        await tx.categoryToProduct.createMany({
          data: categories.map((category) => ({
            A: category.id,
            B: product.id
          })),
          skipDuplicates: true,
        });
      }

      // 3.4. Create product sizes if provided
      if (dto.sizes && dto.sizes.length > 0) {
        await tx.productSize.createMany({
          data: dto.sizes.map((sizeName) => ({
            productId: product.id,
            sizeName: sizeName,
          })),
        });
      }

      // 🆕 3.4.1. Create size pricing if provided
      if (dto.sizePricing && dto.sizePricing.length > 0) {
        await tx.productSizePrice.createMany({
          data: dto.sizePricing.map((pricing) => ({
            productId: product.id,
            size: pricing.size,
            costPrice: pricing.costPrice,
            suggestedPrice: pricing.suggestedPrice,
          })),
        });
        console.log('✅ [BACKEND] Prix par taille créés:', dto.sizePricing.length);
      }
      
      // 3.5. Create ColorVariations and ProductImages (sans délimitations)
      for (const colorVar of dto.colorVariations) {
        const createdColorVariation = await tx.colorVariation.create({
          data: {
            name: colorVar.name,
            colorCode: colorVar.colorCode,
            productId: product.id,
            price: colorVar.price, // ✅ AJOUTER LE CHAMP price pour les autocollants
          },
        });

        // Create ProductImages for this color variation
        for (const image of colorVar.images) {
          const uploadResult = uploadedImages.get(image.fileId);
          if (!uploadResult) {
            throw new BadRequestException(`Upload result not found for fileId "${image.fileId}"`);
          }

          await tx.productImage.create({
            data: {
              url: uploadResult.secure_url,
              publicId: uploadResult.public_id,
              naturalWidth: uploadResult.width,
              naturalHeight: uploadResult.height,
              view: image.view,
              colorVariationId: createdColorVariation.id,
            },
          });
        }
      }
    });
  }

  async getReadyProducts(filters: {
    status?: 'published' | 'draft' | 'all';
    limit?: number;
    offset?: number;
    search?: string;
  }) {
    const { status = 'all', limit = 20, offset = 0, search = '' } = filters;

    const whereClause: any = {
      isDelete: false,
      isReadyProduct: true, // Seulement les produits prêts
    };

    if (status !== 'all') {
      whereClause.status = status === 'published' ? PublicationStatus.PUBLISHED : PublicationStatus.DRAFT;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        include: {
          CategoryToProduct: { include: { categories: true } },
          sizes: true,
          sizePrices: true, // 🆕 Inclure les prix par taille
          colorVariations: {
            include: {
              images: {
                select: {
                  id: true,
                  url: true,
                  view: true,
                  naturalWidth: true,
                  naturalHeight: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      this.prisma.product.count({ where: whereClause }),
    ]);

    return {
      products,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  async getReadyProduct(id: number) {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        isDelete: false,
        isReadyProduct: true, // Seulement les produits prêts
      },
      include: {
        CategoryToProduct: { include: { categories: true } },
        sizes: true,
        sizePrices: true, // 🆕 Inclure les prix par taille
        colorVariations: {
          include: {
            images: {
              select: {
                id: true,
                url: true,
                view: true,
                naturalWidth: true,
                naturalHeight: true,
              },
            },
          },
        },
      },
    });

    if (!product) {
      throw new NotFoundException('Produit prêt introuvable');
    }

    return product;
  }

  async updateReadyProduct(id: number, updateDto: any, files: Express.Multer.File[] = []) {
    // ✅ LOGS DE DÉBOGAGE
    console.log('🎨 [BACKEND] === MISE À JOUR PRODUIT PRÊT/AUTOCOLLANT ===');
    console.log('🔍 updateReadyProduct - DTO reçu:', JSON.stringify(updateDto, null, 2));
    console.log('🔍 updateReadyProduct - isReadyProduct:', updateDto.isReadyProduct);
    console.log('🔍 updateReadyProduct - genre:', updateDto.genre);
    console.log('🔍 updateReadyProduct - Files count:', files?.length || 0);

    // Vérifier que le produit existe et est un produit prêt
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        id,
        isDelete: false,
        isReadyProduct: true,
      },
      include: {
        CategoryToProduct: { include: { categories: true } },
        sizes: true,
        colorVariations: {
          include: {
            images: true
          }
        }
      }
    });

    if (!existingProduct) {
      throw new NotFoundException('Produit prêt introuvable');
    }

    const isAutocollant = updateDto.genre === 'AUTOCOLLANT' || existingProduct.genre === 'AUTOCOLLANT';
    const isTableau = updateDto.genre === 'TABLEAU' || existingProduct.genre === 'TABLEAU';
    console.log('🎨 [BACKEND] Type de produit:', isAutocollant ? 'AUTOCOLLANT' : (isTableau ? 'TABLEAU' : 'Standard'));

    // ✅ CORRECTION AUTOMATIQUE : Si AUTOCOLLANT/TABLEAU, forcer requiresStock à false
    const isProductWithoutStock = isAutocollant || isTableau;
    if (isProductWithoutStock && updateDto.requiresStock !== false) {
      console.warn('⚠️ [BACKEND] Produit sans stock avec requiresStock=true, correction automatique → false');
      updateDto.requiresStock = false;
    }

    // 🆕 VALIDATION DES PRIX PAR TAILLE
    if (updateDto.sizes && updateDto.sizes.length > 0) {
      if (!updateDto.sizePricing || updateDto.sizePricing.length === 0) {
        throw new BadRequestException('Les prix par taille sont requis quand des tailles sont définies');
      }

      // Vérifier que chaque taille a un prix de vente suggéré > 0
      const sizesWithoutPrice = updateDto.sizes.filter(size =>
        !updateDto.sizePricing!.find(p => p.size === size && p.suggestedPrice > 0)
      );

      if (sizesWithoutPrice.length > 0) {
        throw new BadRequestException(
          `Prix de vente suggéré manquant pour les tailles: ${sizesWithoutPrice.join(', ')}`
        );
      }

      // Si useGlobalPricing est true, vérifier la cohérence
      if (updateDto.useGlobalPricing) {
        if (!updateDto.globalCostPrice || updateDto.globalCostPrice < 0) {
          throw new BadRequestException('Prix de revient global requis');
        }
        if (!updateDto.globalSuggestedPrice || updateDto.globalSuggestedPrice <= 0) {
          throw new BadRequestException('Prix de vente suggéré global requis et doit être > 0');
        }

        // Vérifier que tous les prix correspondent aux prix globaux
        const invalidPrices = updateDto.sizePricing.filter(p =>
          p.costPrice !== updateDto.globalCostPrice ||
          p.suggestedPrice !== updateDto.globalSuggestedPrice
        );

        if (invalidPrices.length > 0) {
          throw new BadRequestException(
            'Les prix par taille doivent correspondre aux prix globaux quand useGlobalPricing est true'
          );
        }
      }

      console.log('✅ [BACKEND] Prix par taille validés:', updateDto.sizePricing.length);
    }

    // ✅ Valider le prix des variations pour AUTOCOLLANT/TABLEAU
    if (isProductWithoutStock && updateDto.colorVariations) {
      for (const variation of updateDto.colorVariations) {
        if (!variation.price || variation.price <= 0) {
          throw new BadRequestException(
            `Les variations AUTOCOLLANT doivent avoir un prix. Variation "${variation.name}" sans prix.`
          );
        }
      }
    }

    // ✅ Valider le format des tailles d'autocollant
    if (isAutocollant && updateDto.sizes && updateDto.sizes.length > 0) {
      const validateAutocollantSize = (size: string): boolean => {
        // Format attendu: "5cm*5cm", "10cm*10cm", "5cm x 10cm"
        const regex = /^\d+(cm|mm)\s*[\*x]\s*\d+(cm|mm)$/i;
        return regex.test(size.trim());
      };

      for (const size of updateDto.sizes) {
        if (typeof size === 'string' && !validateAutocollantSize(size)) {
          throw new BadRequestException(
            `Taille d'autocollant invalide: "${size}". Format attendu: "5cm*5cm" ou "10cm*10cm"`
          );
        }
      }
    }

    // 1. Create file mapping if files are provided
    const fileMap = new Map<string, Express.Multer.File>();
    if (files && files.length > 0) {
      console.log(`📁 Fichiers reçus: ${files.length}`);
      files.forEach((file) => {
        const fileId = file.fieldname.replace('file_', '');
        fileMap.set(fileId, file);
        console.log(`📁 Fichier mappé: ${file.fieldname} -> ${fileId}`);
      });
    } else {
      console.log('📁 Aucun fichier reçu');
    }

    // 2. Upload new images to Cloudinary if provided
    const uploadedImages = new Map<string, any>();
    if (updateDto.colorVariations) {
      console.log(`🎨 Traitement de ${updateDto.colorVariations.length} variations de couleur`);
      for (const colorVar of updateDto.colorVariations) {
        if (colorVar.images) {
          console.log(`🖼️ Traitement de ${colorVar.images.length} images pour ${colorVar.name}`);
          for (const image of colorVar.images) {
            if (image.fileId && fileMap.has(image.fileId)) {
              const imageFile = fileMap.get(image.fileId);
              console.log(`📤 Upload de l'image ${image.fileId} pour ${colorVar.name}`);
              try {
                const uploadResult = await this.cloudinaryService.uploadImage(imageFile);
                uploadedImages.set(image.fileId, uploadResult);
                console.log(`✅ Upload réussi: ${uploadResult.secure_url}`);
              } catch (error) {
                console.error(`❌ Erreur upload: ${error.message}`);
                throw new BadRequestException(`Failed to upload image with fileId "${image.fileId}": ${error.message}`);
              }
            } else if (image.fileId) {
              console.log(`⚠️ Fichier ${image.fileId} non trouvé pour ${colorVar.name}`);
            } else {
              console.log(`📋 Image existante pour ${colorVar.name}: ${image.url}`);
            }
          }
        }
      }
    }

    // 3. Use transaction for update
    return this.prisma.executeTransaction(async (tx) => {
      // 3.1. Update basic product info
      const updateData: any = {};
      if (updateDto.name) updateData.name = updateDto.name;
      if (updateDto.description) updateData.description = updateDto.description;
      if (updateDto.price) updateData.price = updateDto.price;
      if (updateDto.suggestedPrice !== undefined) updateData.suggestedPrice = updateDto.suggestedPrice;
      if (updateDto.requiresStock !== undefined) {
        updateData.requiresStock = updateDto.requiresStock;
        // Si on désactive la gestion de stock (AUTOCOLLANT), mettre le stock à 0 (pas null car la colonne n'est pas nullable)
        if (updateDto.requiresStock === false) {
          updateData.stock = 0;
        }
      }
      if (updateDto.stock !== undefined && updateData.requiresStock !== false) updateData.stock = updateDto.stock;
      if (updateDto.status) {
        updateData.status = updateDto.status === 'published' ? PublicationStatus.PUBLISHED : PublicationStatus.DRAFT;
      }
      if (updateDto.isReadyProduct !== undefined) {
        updateData.isReadyProduct = updateDto.isReadyProduct === true;
      }
      if (updateDto.genre) updateData.genre = updateDto.genre;
      // 🆕 Champs pour la tarification par taille
      if (updateDto.useGlobalPricing !== undefined) updateData.useGlobalPricing = updateDto.useGlobalPricing;
      if (updateDto.globalCostPrice !== undefined) updateData.globalCostPrice = updateDto.globalCostPrice;
      if (updateDto.globalSuggestedPrice !== undefined) updateData.globalSuggestedPrice = updateDto.globalSuggestedPrice;

      if (Object.keys(updateData).length > 0) {
        await tx.product.update({
          where: { id },
          data: updateData,
        });
      }

      // 3.2. Update categories if provided
      if (updateDto.categories) {
        // Remove existing categories via junction table
        await tx.categoryToProduct.deleteMany({
          where: { B: id },
        });

        // Add new categories (by name). Only connect existing to avoid schema mismatches
        const categoryPromises = updateDto.categories.map(async (name: string) => {
          const category = await tx.category.findFirst({ where: { name } });
          return category;
        });
        const categories = await Promise.all(categoryPromises);

        if (categories.filter(Boolean).length > 0) {
          await tx.categoryToProduct.createMany({
            data: categories.filter(Boolean).map((category) => ({
              A: category.id,
              B: id
            })),
            skipDuplicates: true,
          });
        }
      }

      // 3.3. Update sizes if provided
      if (updateDto.sizes) {
        // Remove existing sizes
        await tx.productSize.deleteMany({
          where: { productId: id },
        });

        // Add new sizes
        if (updateDto.sizes.length > 0) {
          await tx.productSize.createMany({
            data: updateDto.sizes.map((sizeName: string) => ({
              productId: id,
              sizeName: sizeName,
            })),
          });
        }
      }

      // 🆕 3.3.1. Update size pricing if provided
      if (updateDto.sizePricing) {
        // Remove existing size prices
        await tx.productSizePrice.deleteMany({
          where: { productId: id },
        });

        // Add new size prices
        if (updateDto.sizePricing.length > 0) {
          await tx.productSizePrice.createMany({
            data: updateDto.sizePricing.map((pricing: any) => ({
              productId: id,
              size: pricing.size,
              costPrice: pricing.costPrice,
              suggestedPrice: pricing.suggestedPrice,
            })),
          });
          console.log('✅ [BACKEND] Prix par taille mis à jour:', updateDto.sizePricing.length);
        }
      }

      // 3.4. Update color variations and images if provided
      if (updateDto.colorVariations) {
        // Remove existing color variations and their images
        for (const colorVar of existingProduct.colorVariations) {
          await tx.productImage.deleteMany({
            where: { colorVariationId: colorVar.id }
          });
          await tx.colorVariation.delete({
            where: { id: colorVar.id }
          });
        }

        // Create new color variations and images
        for (const colorVar of updateDto.colorVariations) {
          const createdColorVariation = await tx.colorVariation.create({
            data: {
              name: colorVar.name,
              colorCode: colorVar.colorCode,
              productId: id,
              price: colorVar.price, // ✅ AJOUTER LE CHAMP price pour les autocollants
            },
          });

          // Create ProductImages for this color variation
          for (const image of colorVar.images) {
            let imageData: any = {
              view: image.view,
              colorVariationId: createdColorVariation.id,
            };

            // If it's a new image (has fileId), use uploaded result
            if (image.fileId && uploadedImages.has(image.fileId)) {
              const uploadResult = uploadedImages.get(image.fileId);
              imageData.url = uploadResult.secure_url;
              imageData.publicId = uploadResult.public_id;
              imageData.naturalWidth = uploadResult.width;
              imageData.naturalHeight = uploadResult.height;
              console.log(`✅ Nouvelle image uploadée pour ${colorVar.name}: ${uploadResult.secure_url}`);
            } else if (image.url) {
              // If it's an existing image, keep the existing data
              imageData.url = image.url;
              imageData.publicId = image.publicId || '';
              imageData.naturalWidth = image.naturalWidth || 0;
              imageData.naturalHeight = image.naturalHeight || 0;
              console.log(`✅ Image existante conservée pour ${colorVar.name}: ${image.url}`);
            } else if (image.id && typeof image.id === 'string' && image.id.startsWith('img_')) {
              // If it's a new image with a temporary ID (from frontend)
              console.log(`⚠️ Image avec ID temporaire ignorée: ${image.id} - Aucun fichier correspondant`);
              continue;
            } else if (image.id && typeof image.id === 'number') {
              // If it's an existing image with a database ID, we need to get its data
              console.log(`🔍 Recherche de l'image existante avec ID: ${image.id}`);
              const existingImage = await tx.productImage.findUnique({
                where: { id: image.id }
              });
              
              if (existingImage) {
                imageData.url = existingImage.url;
                imageData.publicId = existingImage.publicId;
                imageData.naturalWidth = existingImage.naturalWidth;
                imageData.naturalHeight = existingImage.naturalHeight;
                console.log(`✅ Image existante trouvée pour ${colorVar.name}: ${existingImage.url}`);
              } else {
                console.warn(`⚠️ Image avec ID ${image.id} non trouvée en base`);
                continue;
              }
            } else {
              // If no URL is provided, skip this image
              console.warn(`⚠️ Image sans URL ou fileId ignorée pour la couleur ${colorVar.name}`);
              continue;
            }

            await tx.productImage.create({
              data: imageData,
            });
          }
        }
      }

      // 3.5. Return updated product
      return tx.product.findUnique({
        where: { id },
        include: {
          CategoryToProduct: { include: { categories: true } },
          sizes: true,
          sizePrices: true, // 🆕 Inclure les prix par taille
          colorVariations: {
            include: {
              images: {
                select: {
                  id: true,
                  url: true,
                  view: true,
                  naturalWidth: true,
                  naturalHeight: true,
                },
              },
            },
          },
        },
      });
    });
  }

  async deleteReadyProduct(id: number): Promise<void> {
    const product = await this.prisma.product.findFirst({
      where: {
        id,
        isDelete: false,
        isReadyProduct: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Produit prêt introuvable');
    }

    await this.prisma.product.update({
      where: { id },
      data: { isDelete: true },
    });
  }

  // ✅ NOUVELLES MÉTHODES POUR LES FILTRES

  /**
   * Récupère toutes les catégories disponibles avec le nombre de produits
   */
  async getAvailableCategories() {
    const categories = await this.prisma.category.findMany({
      include: {
        directProducts: {
          where: {
            isDelete: false
          },
          select: {
            id: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return {
      success: true,
      categories: categories.map(category => ({
        id: category.id,
        name: category.name,
        productCount: category.directProducts.length
      }))
    };
  }

  /**
   * Récupère tous les genres disponibles avec compteurs
   */
  async getAvailableGenres() {
    const genreStats = await this.prisma.product.groupBy({
      by: ['genre'],
      where: {
        isDelete: false
      },
      _count: {
        genre: true
      },
      orderBy: {
        genre: 'asc'
      }
    });

    const genreLabels = {
      'HOMME': 'Homme',
      'FEMME': 'Femme',
      'BEBE': 'Bébé',
      'UNISEXE': 'Unisexe'
    };

    const total = genreStats.reduce((sum, stat) => sum + stat._count.genre, 0);

    return {
      success: true,
      genres: genreStats.map(stat => ({
        genre: stat.genre,
        count: stat._count.genre,
        label: genreLabels[stat.genre] || stat.genre
      })),
      total
    };
  }

  /**
   * Récupère les statistiques complètes pour les filtres
   */
  async getFilterStats() {
    // Statistiques générales
    const totalProducts = await this.prisma.product.count({
      where: { isDelete: false }
    });

    // Statistiques par statut
    const statusStats = await this.prisma.product.groupBy({
      by: ['status'],
      where: { isDelete: false },
      _count: { status: true }
    });

    // Statistiques par type (mockup vs ready product)
    const typeStats = await this.prisma.product.groupBy({
      by: ['isReadyProduct'],
      where: { isDelete: false },
      _count: { isReadyProduct: true }
    });

    // Statistiques par genre
    const genreStats = await this.prisma.product.groupBy({
      by: ['genre'],
      where: { isDelete: false },
      _count: { genre: true }
    });

    // Formatage des résultats
    const byStatus = {};
    statusStats.forEach(stat => {
      byStatus[stat.status] = stat._count.status;
    });

    const byType = {
      mockups: 0,
      readyProducts: 0
    };
    typeStats.forEach(stat => {
      if (stat.isReadyProduct) {
        byType.readyProducts = stat._count.isReadyProduct;
      } else {
        byType.mockups = stat._count.isReadyProduct;
      }
    });

    const byGenre = {};
    genreStats.forEach(stat => {
      byGenre[stat.genre] = stat._count.genre;
    });

    return {
      success: true,
      stats: {
        total: totalProducts,
        byStatus,
        byType,
        byGenre
      }
    };
  }

  // ==========================================
  // 📦 GESTION DES STOCKS
  // ==========================================

  /**
   * Met à jour les stocks d'un produit
   * @param productId - ID du produit
   * @param updateStocksDto - Données des stocks à mettre à jour
   */
  async updateProductStocks(productId: number, updateStocksDto: UpdateStocksDto) {
    // Vérifier que le produit existe
    const product = await this.prisma.product.findUnique({
      where: { id: productId }
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    // Utiliser upsert pour chaque stock (créer ou mettre à jour)
    const stockOperations = updateStocksDto.stocks.map(stockData =>
      this.prisma.productStock.upsert({
        where: {
          productId_colorId_sizeName: {
            productId,
            colorId: stockData.colorId,
            sizeName: stockData.sizeName
          }
        },
        update: {
          stock: stockData.stock
        },
        create: {
          productId,
          colorId: stockData.colorId,
          sizeName: stockData.sizeName,
          stock: stockData.stock
        }
      })
    );

    await this.prisma.$transaction(stockOperations);

    return {
      success: true,
      message: 'Stocks mis à jour avec succès',
      data: {
        productId,
        totalStockUpdated: updateStocksDto.stocks.length
      }
    };
  }

  /**
   * Récupère tous les stocks d'un produit
   * @param productId - ID du produit
   */
  async getProductStocks(productId: number) {
    const stocks = await this.prisma.productStock.findMany({
      where: { productId },
      include: {
        product: {
          include: {
            colorVariations: true
          }
        }
      }
    });

    // Enrichir avec les noms de couleur
    const enrichedStocks = stocks.map(stock => {
      const color = stock.product.colorVariations.find(c => c.id === stock.colorId);
      return {
        id: stock.id,
        colorId: stock.colorId,
        colorName: color?.name || 'Inconnu',
        sizeName: stock.sizeName,
        stock: stock.stock
      };
    });

    return {
      success: true,
      data: {
        productId,
        stocks: enrichedStocks
      }
    };
  }

  /**
   * Recharge le stock d'un produit spécifique (ajoute au stock existant)
   * @param productId - ID du produit
   * @param stockId - ID du stock
   * @param rechargeDto - Quantité à ajouter
   */
  async rechargeStock(
    productId: number,
    stockId: number,
    rechargeDto: RechargeStockDto
  ) {
    const stock = await this.prisma.productStock.findFirst({
      where: {
        id: stockId,
        productId
      }
    });

    if (!stock) {
      throw new NotFoundException('Stock non trouvé');
    }

    const previousStock = stock.stock;
    const newStock = previousStock + rechargeDto.amount;

    await this.prisma.productStock.update({
      where: { id: stockId },
      data: { stock: newStock }
    });

    return {
      success: true,
      message: 'Stock rechargé avec succès',
      data: {
        previousStock,
        addedAmount: rechargeDto.amount,
        newStock
      }
    };
  }

  /**
   * Met à jour un stock spécifique
   * @param productId - ID du produit
   * @param stockId - ID du stock
   * @param stock - Nouvelle quantité
   */
  async updateSingleStock(productId: number, stockId: number, stock: number) {
    const existingStock = await this.prisma.productStock.findFirst({
      where: {
        id: stockId,
        productId
      }
    });

    if (!existingStock) {
      throw new NotFoundException('Stock non trouvé');
    }

    if (stock < 0) {
      throw new BadRequestException('Le stock ne peut pas être négatif');
    }

    await this.prisma.productStock.update({
      where: { id: stockId },
      data: { stock }
    });

    return {
      success: true,
      message: 'Stock mis à jour avec succès',
      data: {
        stockId,
        previousStock: existingStock.stock,
        newStock: stock
      }
    };
  }

  /**
   * Crée un mouvement de stock (entrée ou sortie)
   * @param productId - ID du produit
   * @param dto - DTO de création de mouvement
   * @param userId - ID de l'utilisateur effectuant le mouvement
   */
  async createStockMovement(
    productId: number,
    dto: CreateStockMovementDto,
    userId?: number
  ) {
    // 1. Vérifier que le produit existe
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isDelete: false },
      include: {
        colorVariations: {
          where: { id: dto.colorId }
        }
      }
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    // 2. Vérifier que la couleur appartient au produit
    if (!product.colorVariations || product.colorVariations.length === 0) {
      throw new NotFoundException('Couleur non trouvée pour ce produit');
    }

    // 3. Récupérer ou créer le stock
    let stock = await this.prisma.productStock.findUnique({
      where: {
        productId_colorId_sizeName: {
          productId,
          colorId: dto.colorId,
          sizeName: dto.sizeName
        }
      }
    });

    if (!stock) {
      // Créer le stock s'il n'existe pas
      stock = await this.prisma.productStock.create({
        data: {
          productId,
          colorId: dto.colorId,
          sizeName: dto.sizeName,
          stock: 0
        }
      });
    }

    // 4. Si sortie, vérifier le stock disponible
    if (dto.type === 'OUT' && stock.stock < dto.quantity) {
      throw new ConflictException(
        `Stock insuffisant. Disponible: ${stock.stock}, Demandé: ${dto.quantity}`
      );
    }

    // 5. Calculer le nouveau stock
    const newStockValue = dto.type === 'IN'
      ? stock.stock + dto.quantity
      : stock.stock - dto.quantity;

    // 6. Utiliser une transaction pour créer le mouvement et mettre à jour le stock
    const result = await this.prisma.$transaction(async (tx) => {
      // Créer le mouvement
      const movement = await tx.stockMovement.create({
        data: {
          productId,
          colorId: dto.colorId,
          sizeName: dto.sizeName,
          type: dto.type as StockMovementType,
          quantity: dto.quantity,
          reason: dto.reason,
          createdBy: userId
        },
        include: {
          product: {
            select: { name: true }
          },
          colorVariation: {
            select: { name: true }
          },
          user: {
            select: { firstName: true, lastName: true }
          }
        }
      });

      // Mettre à jour le stock
      const updatedStock = await tx.productStock.update({
        where: { id: stock.id },
        data: { stock: newStockValue }
      });

      return { movement, updatedStock };
    });

    return {
      success: true,
      message: 'Mouvement de stock enregistré',
      data: {
        movement: {
          id: result.movement.id,
          productId: result.movement.productId,
          colorId: result.movement.colorId,
          sizeName: result.movement.sizeName,
          type: result.movement.type,
          quantity: result.movement.quantity,
          reason: result.movement.reason,
          createdAt: result.movement.createdAt
        },
        newStock: result.updatedStock.stock
      }
    };
  }

  /**
   * Récupère l'historique des mouvements de stock d'un produit
   * @param productId - ID du produit
   * @param query - Paramètres de filtrage et pagination
   */
  async getStockHistory(productId: number, query: StockHistoryQueryDto) {
    // 1. Vérifier que le produit existe
    const product = await this.prisma.product.findFirst({
      where: { id: productId, isDelete: false }
    });

    if (!product) {
      throw new NotFoundException('Produit non trouvé');
    }

    // 2. Construire les filtres
    const where: any = {
      productId
    };

    if (query.colorId) {
      where.colorId = query.colorId;
    }

    if (query.sizeName) {
      where.sizeName = query.sizeName;
    }

    if (query.type) {
      where.type = query.type as StockMovementType;
    }

    // 3. Récupérer le total et les mouvements
    const [total, movements] = await Promise.all([
      this.prisma.stockMovement.count({ where }),
      this.prisma.stockMovement.findMany({
        where,
        include: {
          product: {
            select: { name: true }
          },
          colorVariation: {
            select: { name: true }
          },
          user: {
            select: { firstName: true, lastName: true }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip: query.offset,
        take: query.limit
      })
    ]);

    // 4. Formater les résultats
    const formattedMovements = movements.map(m => ({
      id: m.id,
      productId: m.productId,
      productName: m.product.name,
      colorId: m.colorId,
      colorName: m.colorVariation.name,
      sizeName: m.sizeName,
      type: m.type,
      quantity: m.quantity,
      reason: m.reason,
      createdAt: m.createdAt,
      createdBy: m.user ? `${m.user.firstName} ${m.user.lastName}` : 'Système'
    }));

    return {
      success: true,
      data: {
        movements: formattedMovements,
        total,
        limit: query.limit,
        offset: query.offset
      }
    };
  }

  /**
   * Valider que la hiérarchie Category → SubCategory → Variation est cohérente
   */
  private async validateCategoryHierarchy(
    categoryId?: number,
    subCategoryId?: number,
    variationId?: number
  ): Promise<void> {
    // Si aucun ID n'est fourni, pas besoin de valider
    if (!categoryId && !subCategoryId && !variationId) {
      return;
    }

    // Si une variation est fournie, vérifier qu'elle appartient à la sous-catégorie
    if (variationId && subCategoryId) {
      const variation = await this.prisma.variation.findUnique({
        where: { id: variationId },
        include: { subCategory: true }
      });

      if (!variation) {
        throw new BadRequestException(`Variation avec ID ${variationId} introuvable`);
      }

      if (variation.subCategoryId !== subCategoryId) {
        throw new BadRequestException(
          `La variation ${variationId} n'appartient pas à la sous-catégorie ${subCategoryId}`
        );
      }
    }

    // Si une sous-catégorie est fournie, vérifier qu'elle appartient à la catégorie
    if (subCategoryId && categoryId) {
      const subCategory = await this.prisma.subCategory.findUnique({
        where: { id: subCategoryId },
        include: { category: true }
      });

      if (!subCategory) {
        throw new BadRequestException(`Sous-catégorie avec ID ${subCategoryId} introuvable`);
      }

      if (subCategory.categoryId !== categoryId) {
        throw new BadRequestException(
          `La sous-catégorie ${subCategoryId} n'appartient pas à la catégorie ${categoryId}`
        );
      }
    }

    // Vérifier que les IDs existent individuellement
    if (categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: categoryId }
      });

      if (!category) {
        throw new BadRequestException(`Catégorie avec ID ${categoryId} introuvable`);
      }
    }
  }
}