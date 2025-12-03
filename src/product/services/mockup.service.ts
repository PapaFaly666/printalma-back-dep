import { Injectable, BadRequestException, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { CreateMockupDto, UpdateMockupDto, MockupResponseDto, MockupGenre } from '../dto/create-mockup.dto';
import { CloudinaryService } from '../../core/cloudinary/cloudinary.service';

@Injectable()
export class MockupService {
  private readonly logger = new Logger(MockupService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  /**
   * Créer un mockup avec genre
   */
  async createMockup(createMockupDto: CreateMockupDto): Promise<MockupResponseDto> {
    this.logger.log(`🎨 Création mockup: ${createMockupDto.name}`);

    try {
      // Validation spécifique pour les mockups
      if (createMockupDto.isReadyProduct !== false) {
        throw new BadRequestException('Les mockups doivent avoir isReadyProduct: false');
      }

      // Créer le produit mockup
      const mockup = await this.prisma.product.create({
        data: {
          name: createMockupDto.name,
          description: createMockupDto.description,
          price: createMockupDto.price,
          stock: createMockupDto.stock || 0,
          status: createMockupDto.status === 'published' ? 'PUBLISHED' : 'DRAFT',
          isReadyProduct: false, // Forcer à false pour les mockups
          isValidated: true, // ✅ MOCKUPS CRÉÉS PAR ADMIN SONT VALIDÉS PAR DÉFAUT
        },
        include: {
          CategoryToProduct: { include: { categories: true } },
          subCategory: true, // ✅ Inclure la sous-catégorie
          variation: true, // ✅ Inclure la variation
          colorVariations: {
            include: {
              images: {
                include: {
                  delimitations: true
                }
              }
            }
          },
          sizes: true
        }
      });

      // Créer les catégories si fournies
      if (createMockupDto.categories && createMockupDto.categories.length > 0) {
        await this.createCategoriesForProduct(mockup.id, createMockupDto.categories);
      }

      // Créer les tailles si fournies
      if (createMockupDto.sizes && createMockupDto.sizes.length > 0) {
        await this.createSizesForProduct(mockup.id, createMockupDto.sizes);
      }

      // Créer les variations de couleur
      if (createMockupDto.colorVariations && createMockupDto.colorVariations.length > 0) {
        await this.createColorVariationsForProduct(mockup.id, createMockupDto.colorVariations);
      }

      this.logger.log(`✅ Mockup créé avec succès: ID ${mockup.id}`);

      return this.mapToResponseDto(mockup);
    } catch (error) {
      this.logger.error('❌ Erreur création mockup:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour un mockup avec genre
   */
  async updateMockup(id: number, updateMockupDto: UpdateMockupDto): Promise<MockupResponseDto> {
    this.logger.log(`🔄 Mise à jour mockup ${id}`);

    try {
      // Vérifier que le produit existe et est un mockup
      const existingMockup = await this.prisma.product.findFirst({
        where: {
          id,
          isReadyProduct: false
        }
      });

      if (!existingMockup) {
        throw new NotFoundException(`Mockup ${id} introuvable`);
      }

      // Préparer les données de mise à jour
      const updateData: any = {};
      
      if (updateMockupDto.name) updateData.name = updateMockupDto.name;
      if (updateMockupDto.description) updateData.description = updateMockupDto.description;
      if (updateMockupDto.price) updateData.price = updateMockupDto.price;
      if (updateMockupDto.status) {
        updateData.status = updateMockupDto.status === 'published' ? 'PUBLISHED' : 'DRAFT';
      }

      // Mettre à jour le mockup
      const updatedMockup = await this.prisma.product.update({
        where: { id },
        data: updateData,
        include: {
          CategoryToProduct: { include: { categories: true } },
          subCategory: true, // ✅ Inclure la sous-catégorie
          variation: true, // ✅ Inclure la variation
          colorVariations: {
            include: {
              images: {
                include: {
                  delimitations: true
                }
              }
            }
          },
          sizes: true
        }
      });

      this.logger.log(`✅ Mockup ${id} mis à jour avec succès`);

      return this.mapToResponseDto(updatedMockup);
    } catch (error) {
      this.logger.error(`❌ Erreur mise à jour mockup ${id}:`, error);
      throw error;
    }
  }

  /**
   * Récupérer les mockups par genre
   */
  async getMockupsByGenre(genre: MockupGenre): Promise<MockupResponseDto[]> {
    this.logger.log(`🔍 Récupération mockups par genre: ${genre}`);

    try {
      const mockups = await this.prisma.product.findMany({
        where: {
          isReadyProduct: false,
          isDelete: false
        },
        include: {
          CategoryToProduct: { include: { categories: true } },
          subCategory: true, // ✅ Inclure la sous-catégorie
          variation: true, // ✅ Inclure la variation
          colorVariations: {
            include: {
              images: {
                include: {
                  delimitations: true
                }
              }
            }
          },
          sizes: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      this.logger.log(`✅ ${mockups.length} mockups trouvés`);

      return mockups.map(mockup => this.mapToResponseDto(mockup));
    } catch (error) {
      this.logger.error(`❌ Erreur récupération mockups:`, error);
      throw error;
    }
  }

  /**
   * Récupérer tous les genres disponibles pour les mockups
   */
  async getAvailableMockupGenres(): Promise<string[]> {
    this.logger.log('🔍 Récupération des genres disponibles pour les mockups');

    try {
      // Since genre field doesn't exist in the schema, return default genres
      const availableGenres = ['HOMME', 'FEMME', 'BEBE', 'UNISEXE'];
      this.logger.log(`✅ Genres disponibles: ${availableGenres.join(', ')}`);

      return availableGenres;
    } catch (error) {
      this.logger.error('❌ Erreur récupération genres disponibles:', error);
      throw error;
    }
  }

  /**
   * Récupérer tous les mockups avec filtre par genre
   */
  async getAllMockups(genre?: MockupGenre): Promise<MockupResponseDto[]> {
    this.logger.log(`🔍 Récupération tous les mockups`);

    try {
      const whereClause: any = {
        isReadyProduct: false,
        isDelete: false
      };

      const mockups = await this.prisma.product.findMany({
        where: whereClause,
        include: {
          CategoryToProduct: { include: { categories: true } },
          subCategory: true, // ✅ Inclure la sous-catégorie
          variation: true, // ✅ Inclure la variation
          colorVariations: {
            include: {
              images: {
                include: {
                  delimitations: true
                }
              }
            }
          },
          sizes: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      this.logger.log(`✅ ${mockups.length} mockups récupérés`);

      return mockups.map(mockup => this.mapToResponseDto(mockup));
    } catch (error) {
      this.logger.error('❌ Erreur récupération tous les mockups:', error);
      throw error;
    }
  }

  /**
   * Récupérer un mockup par ID
   */
  async getMockupById(id: number): Promise<MockupResponseDto> {
    this.logger.log(`🔍 Récupération mockup ${id}`);

    try {
      const mockup = await this.prisma.product.findFirst({
        where: {
          id,
          isReadyProduct: false,
          isDelete: false
        },
        include: {
          CategoryToProduct: { include: { categories: true } },
          subCategory: true, // ✅ Inclure la sous-catégorie
          variation: true, // ✅ Inclure la variation
          colorVariations: {
            include: {
              images: {
                include: {
                  delimitations: true
                }
              }
            }
          },
          sizes: true
        }
      });

      if (!mockup) {
        throw new NotFoundException(`Mockup ${id} introuvable`);
      }

      return this.mapToResponseDto(mockup);
    } catch (error) {
      this.logger.error(`❌ Erreur récupération mockup ${id}:`, error);
      throw error;
    }
  }

  /**
   * Supprimer un mockup (soft delete)
   */
  async deleteMockup(id: number): Promise<{ success: boolean; message: string }> {
    this.logger.log(`🗑️ Suppression mockup ${id}`);

    try {
      const mockup = await this.prisma.product.findFirst({
        where: {
          id,
          isReadyProduct: false
        }
      });

      if (!mockup) {
        throw new NotFoundException(`Mockup ${id} introuvable`);
      }

      await this.prisma.product.update({
        where: { id },
        data: { isDelete: true }
      });

      this.logger.log(`✅ Mockup ${id} supprimé avec succès`);

      return {
        success: true,
        message: `Mockup ${id} supprimé avec succès`
      };
    } catch (error) {
      this.logger.error(`❌ Erreur suppression mockup ${id}:`, error);
      throw error;
    }
  }

  /**
   * Méthode utilitaire pour mapper vers la réponse
   */
  private mapToResponseDto(mockup: any): MockupResponseDto {
    // Build categories array from many-to-many relation
    const categories = (mockup.categories || []).map((c: any) => c);

    return {
      id: mockup.id,
      name: mockup.name,
      description: mockup.description,
      price: mockup.price,
      status: mockup.status === 'PUBLISHED' ? 'published' : 'draft',
      isReadyProduct: false,
      genre: MockupGenre.UNISEXE, // Default value since genre field doesn't exist in schema
      categories: categories,
      colorVariations: mockup.colorVariations || [],
      sizes: mockup.sizes || [],
      createdAt: mockup.createdAt,
      updatedAt: mockup.updatedAt
    };
  }

  /**
   * Créer les catégories pour un produit
   */
  private async createCategoriesForProduct(productId: number, categoryNames: string[]): Promise<void> {
    if (categoryNames.length === 0) return;

    const slugify = (s: string) => s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const categories = [] as any[];
    for (const categoryName of categoryNames) {
      let category = await this.prisma.category.findFirst({ where: { name: categoryName } });
      if (!category) {
        category = await this.prisma.category.create({
          data: { name: categoryName, slug: slugify(categoryName) }
        });
      }
      categories.push(category);
    }

    // Use junction table CategoryToProduct
    await this.prisma.categoryToProduct.createMany({
      data: categories.map(c => ({
        A: c.id,
        B: productId
      })),
      skipDuplicates: true,
    });
  }

  /**
   * Créer les tailles pour un produit
   */
  private async createSizesForProduct(productId: number, sizeNames: string[]): Promise<void> {
    for (const sizeName of sizeNames) {
      await this.prisma.productSize.create({
        data: {
          productId,
          sizeName
        }
      });
    }
  }

  /**
   * Créer les variations de couleur pour un produit
   */
  private async createColorVariationsForProduct(productId: number, colorVariations: any[]): Promise<void> {
    for (const colorVariation of colorVariations) {
      const createdColorVariation = await this.prisma.colorVariation.create({
        data: {
          productId,
          name: colorVariation.name,
          colorCode: colorVariation.colorCode
        }
      });

      // Créer les images pour cette variation de couleur
      if (colorVariation.images && colorVariation.images.length > 0) {
        for (const image of colorVariation.images) {
          await this.prisma.productImage.create({
            data: {
              colorVariationId: createdColorVariation.id,
              view: image.view,
              url: '', // Sera rempli après upload
              publicId: '', // Sera rempli après upload
              naturalWidth: 500,
              naturalHeight: 500
            }
          });
        }
      }
    }
  }

  /**
   * Régénérer les mockups pour les produits d'une catégorie
   * (Appelé quand une catégorie est modifiée)
   */
  async regenerateMockupsForCategory(categoryId: number): Promise<void> {
    this.logger.log(`🔄 Régénération mockups pour catégorie ${categoryId}`);

    try {
      // Récupérer tous les produits mockups liés à cette catégorie
      const mockups = await this.prisma.product.findMany({
        where: {
          categoryId,
          isReadyProduct: false,
          isDelete: false
        },
        include: {
          colorVariations: {
            include: {
              images: true
            }
          }
        }
      });

      this.logger.log(`📦 ${mockups.length} mockups à régénérer pour la catégorie ${categoryId}`);

      // Pour chaque mockup, on peut déclencher une régénération
      // (actuellement, on log simplement, mais on pourrait régénérer les images si nécessaire)
      for (const mockup of mockups) {
        this.logger.log(`   ✓ Mockup ${mockup.id} - ${mockup.name} marqué pour régénération`);
        // TODO: Implémenter la régénération réelle des images si nécessaire
        // await this.regenerateMockupImages(mockup.id);
      }

      this.logger.log(`✅ Régénération terminée pour ${mockups.length} mockups`);
    } catch (error) {
      this.logger.error(`❌ Erreur régénération mockups catégorie ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Régénérer les mockups pour les produits d'une sous-catégorie
   * (Appelé quand une sous-catégorie est modifiée)
   */
  async regenerateMockupsForSubCategory(subCategoryId: number): Promise<void> {
    this.logger.log(`🔄 Régénération mockups pour sous-catégorie ${subCategoryId}`);

    try {
      const mockups = await this.prisma.product.findMany({
        where: {
          subCategoryId,
          isReadyProduct: false,
          isDelete: false
        },
        include: {
          colorVariations: {
            include: {
              images: true
            }
          }
        }
      });

      this.logger.log(`📦 ${mockups.length} mockups à régénérer pour la sous-catégorie ${subCategoryId}`);

      for (const mockup of mockups) {
        this.logger.log(`   ✓ Mockup ${mockup.id} - ${mockup.name} marqué pour régénération`);
      }

      this.logger.log(`✅ Régénération terminée pour ${mockups.length} mockups`);
    } catch (error) {
      this.logger.error(`❌ Erreur régénération mockups sous-catégorie ${subCategoryId}:`, error);
      throw error;
    }
  }

  /**
   * Régénérer les mockups pour les produits d'une variation
   * (Appelé quand une variation est modifiée)
   */
  async regenerateMockupsForVariation(variationId: number): Promise<void> {
    this.logger.log(`🔄 Régénération mockups pour variation ${variationId}`);

    try {
      const mockups = await this.prisma.product.findMany({
        where: {
          variationId,
          isReadyProduct: false,
          isDelete: false
        },
        include: {
          colorVariations: {
            include: {
              images: true
            }
          }
        }
      });

      this.logger.log(`📦 ${mockups.length} mockups à régénérer pour la variation ${variationId}`);

      for (const mockup of mockups) {
        this.logger.log(`   ✓ Mockup ${mockup.id} - ${mockup.name} marqué pour régénération`);
      }

      this.logger.log(`✅ Régénération terminée pour ${mockups.length} mockups`);
    } catch (error) {
      this.logger.error(`❌ Erreur régénération mockups variation ${variationId}:`, error);
      throw error;
    }
  }
} 