import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto, PaymentMethod } from './dto/create-order.dto';
import { OrderStatus } from '@prisma/client';
import { SalesStatsUpdaterService } from '../vendor-product/services/sales-stats-updater.service';
import { PaytechService } from '../paytech/paytech.service';
import { PaydunyaService } from '../paydunya/paydunya.service';
import { ConfigService } from '@nestjs/config';
import { PayTechCurrency, PayTechEnvironment } from '../paytech/dto/payment-request.dto';
import { CustomizationService } from '../customization/customization.service';
import { CustomizationValidator } from './validators/customization.validator';
import { CustomizationEnricherHelper } from './helpers/customization-enricher.helper';
import { DeliveryValidator } from './validators/delivery.validator';
import { DeliveryEnricherHelper } from './helpers/delivery-enricher.helper';
import { DesignUsageTracker } from '../utils/designUsageTracker';
import { MailService } from '../core/mail/mail.service';
import { OrderMockupGeneratorService } from './services/order-mockup-generator.service';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    private prisma: PrismaService,
    private salesStatsUpdaterService: SalesStatsUpdaterService,
    private paytechService: PaytechService,
    private paydunyaService: PaydunyaService,
    private configService: ConfigService,
    private customizationService: CustomizationService,
    private mailService: MailService,
    private mockupGenerator: OrderMockupGeneratorService
  ) {}

  async createGuestOrder(createOrderDto: CreateOrderDto) {
    // Pour les commandes invitées, userId doit être null (pas d'utilisateur connecté)
    this.logger.log(`👤 Création d'une commande invité (userId = null)`);
    return this.createOrder(null, createOrderDto);
  }

  async createOrder(userId: number | null, createOrderDto: CreateOrderDto) {
    try {
      // 📦 LOG DÉTAILLÉ POUR MULTI-TAILLES
      const itemsSummary = createOrderDto.orderItems.reduce((acc, item) => {
        const key = `${item.productId}-${item.colorId || 'no-color'}`;
        if (!acc[key]) {
          acc[key] = { productId: item.productId, colorId: item.colorId, sizes: {} };
        }
        const size = item.size || 'default';
        acc[key].sizes[size] = (acc[key].sizes[size] || 0) + item.quantity;
        return acc;
      }, {} as Record<string, any>);

      this.logger.log(`📦 [ORDER] Nouvelle commande: ${createOrderDto.orderItems.length} item(s), ${Object.keys(itemsSummary).length} produit(s) unique(s)`);

      for (const [key, summary] of Object.entries(itemsSummary)) {
        const sizesStr = Object.entries(summary.sizes).map(([size, qty]) => `${size}:${qty}`).join(', ');
        this.logger.log(`📦 [ORDER] Produit ${summary.productId} (couleur ${summary.colorId}): ${sizesStr}`);
      }

      console.log('📦 [ORDER] Données reçues:', JSON.stringify(createOrderDto, null, 2));

      // 🆕 Construction du nom complet du client
      const fullName = [
        createOrderDto.shippingDetails.firstName || '',
        createOrderDto.shippingDetails.lastName || ''
      ].filter(Boolean).join(' ').trim() || 'Client';

      // 🆕 Construction de l'adresse complète
      const fullAddress = [
        createOrderDto.shippingDetails.street,
        createOrderDto.shippingDetails.city,
        createOrderDto.shippingDetails.postalCode,
        createOrderDto.shippingDetails.country
      ].filter(Boolean).join(', ');

      // 🆕 Calcul du subtotal (somme des prix totaux des items)
      const subtotal = createOrderDto.orderItems.reduce((sum, item) => {
        const itemTotalPrice = (item.unitPrice || 0) * item.quantity;
        return sum + itemTotalPrice;
      }, 0);

      // 🚚 TRAITEMENT DES INFORMATIONS DE LIVRAISON
      let enrichedDeliveryInfo = null;
      let deliveryFee = 0;
      let deliveryMetadata = null;

      if (createOrderDto.deliveryInfo) {
        // Valider les données de livraison
        DeliveryValidator.validateOrThrow(createOrderDto.deliveryInfo);

        // Enrichir avec les données complètes depuis la BDD
        enrichedDeliveryInfo = await DeliveryEnricherHelper.enrichDeliveryInfo(
          createOrderDto.deliveryInfo,
          this.prisma
        );

        deliveryFee = createOrderDto.deliveryInfo.deliveryFee || 0;
        deliveryMetadata = DeliveryEnricherHelper.buildDeliveryMetadata(enrichedDeliveryInfo);

        this.logger.log(`🚚 [ORDER] Livraison configurée:`, {
          type: enrichedDeliveryInfo.deliveryType,
          transporteur: enrichedDeliveryInfo.transporteur?.name,
          fee: deliveryFee,
          location: enrichedDeliveryInfo.location?.name
        });
      }

      // 🆕 Calcul du montant total (subtotal + frais de livraison)
      const totalAmount = subtotal + deliveryFee;

      // 💰 CALCUL ET STOCKAGE DE LA COMMISSION AU MOMENT DE LA CRÉATION
      let commissionRate = 40.0; // Taux par défaut
      let commissionAmount = 0;
      let vendorAmount = totalAmount;

      try {
        // Récupérer le vendeur à partir du premier produit de la commande
        const firstItem = createOrderDto.orderItems[0];
        let vendorId = null;

        if (firstItem?.vendorProductId) {
          const vendorProduct = await this.prisma.vendorProduct.findUnique({
            where: { id: firstItem.vendorProductId },
            select: { vendorId: true }
          });
          vendorId = vendorProduct?.vendorId;
        }

        if (vendorId) {
          // Récupérer la commission personnalisée du vendeur directement avec Prisma
          const vendorCommission = await this.prisma.vendorCommission.findUnique({
            where: { vendorId }
          });
          if (vendorCommission) {
            commissionRate = vendorCommission.commissionRate;
          }
        }

        // Calcul du bénéfice du vendeur et de la commission basée sur le bénéfice
        let totalProfit = 0;
        let totalDesignRevenue = 0; // Revenue total des designs utilisés

        // Calculer le bénéfice total pour cette commande
        for (const item of createOrderDto.orderItems) {
          // Récupérer le prix de reviens du produit
          const product = await this.prisma.product.findUnique({
            where: { id: item.productId },
            select: { price: true }
          });

          const productCost = product?.price || 0;
          const sellingPrice = item.unitPrice || 0;
          const quantity = item.quantity || 1;
          const itemProfit = (sellingPrice - productCost) * quantity;
          totalProfit += itemProfit;

          // 🎨 CALCUL DES REVENUS DESIGNS
          // Vérifier si cet item utilise des designs vendeurs payants
          if (item.customizationIds && Object.keys(item.customizationIds).length > 0) {
            const recordedDesigns = new Set<number>(); // Pour éviter les doublons

            for (const [viewKey, customizationId] of Object.entries(item.customizationIds)) {
              try {
                const customization = await this.prisma.productCustomization.findUnique({
                  where: { id: customizationId as number },
                  select: {
                    designElements: true,
                    elementsByView: true,
                  },
                });

                if (customization) {
                  let designElements: any[] = [];

                  if (customization.elementsByView && typeof customization.elementsByView === 'object') {
                    const elementsByView = customization.elementsByView as Record<string, any[]>;
                    designElements = elementsByView[viewKey] || [];
                  } else if (customization.designElements && Array.isArray(customization.designElements)) {
                    designElements = customization.designElements as any[];
                  }

                  // Parcourir les éléments pour trouver les designs payants
                  for (const element of designElements) {
                    if (element.type === 'image' && element.designId && element.designPrice) {
                      const designId = parseInt(element.designId);
                      const designPrice = parseFloat(element.designPrice);

                      // Éviter les doublons
                      if (!recordedDesigns.has(designId)) {
                        totalDesignRevenue += designPrice;
                        recordedDesigns.add(designId);
                        this.logger.log(`🎨 [DESIGN COMMISSION] Design ${designId} détecté - Prix: ${designPrice} FCFA`);
                      }
                    }
                  }
                }
              } catch (error) {
                this.logger.error(`❌ Erreur extraction design revenue pour customization ${customizationId}:`, error);
              }
            }
          }
        }

        // 💰 CALCUL FINAL DE LA COMMISSION
        // La commission est calculée sur:
        // 1. Le bénéfice des produits (prix vente - prix reviens)
        // 2. Le prix total des designs utilisés (100% du prix design)
        const totalCommissionableAmount = totalProfit + totalDesignRevenue;
        commissionAmount = totalCommissionableAmount * (commissionRate / 100);

        // Le vendeur reçoit:
        // - Son bénéfice sur les produits APRÈS commission
        // - Sa part des designs APRÈS commission (les designs sont comptés dans totalDesignRevenue)
        vendorAmount = totalCommissionableAmount - commissionAmount;

        this.logger.log(`💰 [COMMISSION] Bénéfice produits: ${totalProfit} XOF, Revenue designs: ${totalDesignRevenue} XOF`);
        this.logger.log(`💰 [COMMISSION] Total commissionable: ${totalCommissionableAmount} XOF, commission: ${commissionRate}% (${commissionAmount} XOF), vendeur net: ${vendorAmount} XOF`);

        this.logger.log(`💰 [COMMISSION] Commande: commission ${commissionRate}% (${commissionAmount} XOF), vendeur: ${vendorAmount} XOF`);
      } catch (error) {
        this.logger.warn(`⚠️ [COMMISSION] Erreur calcul commission, utilisation du taux par défaut ${commissionRate}%:`, error);
        // En cas d'erreur, calculer avec le montant total comme fallback (ancienne logique)
        commissionAmount = totalAmount * (commissionRate / 100);
        vendorAmount = totalAmount - commissionAmount;
      }

      console.log('📊 [ORDER] Informations calculées:', {
        fullName,
        fullAddress,
        subtotal,
        deliveryFee,
        totalAmount,
        itemsCount: createOrderDto.orderItems.length,
        email: createOrderDto.email
      });

      // 📦 VALIDATION DU STOCK PAR TAILLE
      await this.validateStockForOrderItems(createOrderDto.orderItems);

      // ✅ VALIDATION DES STICKERS (quantités min/max, statut, prix)
      const validatedOrderItems = await this.validateStickerOrderItems(createOrderDto.orderItems);

      // 🎨 GÉNÉRATION AUTOMATIQUE DES MOCKUPS POUR LES PRODUITS PERSONNALISÉS
      await this.generateMockupsForOrderItems(validatedOrderItems);

      const order = await this.prisma.order.create({
        data: {
          orderNumber: `ORD-${Date.now()}`,
          userId: userId,
          subtotal: subtotal, // 🆕 Somme des prix totaux des items
          totalAmount: totalAmount,
          phoneNumber: createOrderDto.phoneNumber,
          email: createOrderDto.email || null, // 🆕 Email du client
          notes: createOrderDto.notes,
          status: OrderStatus.PENDING,
          paymentMethod: createOrderDto.paymentMethod || 'CASH_ON_DELIVERY',
          paymentStatus: 'PENDING',

          // 💰 Champs de commission figés au moment de la création
          commissionRate: commissionRate,
          commissionAmount: commissionAmount,
          vendorAmount: vendorAmount,
          commissionAppliedAt: new Date(),

          // 🆕 Informations de livraison complètes
          shippingName: fullName,
          shippingStreet: createOrderDto.shippingDetails.street,
          shippingCity: createOrderDto.shippingDetails.city,
          shippingRegion: createOrderDto.shippingDetails.region || createOrderDto.shippingDetails.city,
          shippingPostalCode: createOrderDto.shippingDetails.postalCode || null,
          shippingCountry: createOrderDto.shippingDetails.country,
          shippingAddressFull: fullAddress,

          // 🚚 SYSTÈME DE LIVRAISON DYNAMIQUE
          deliveryType: enrichedDeliveryInfo?.deliveryType || null,
          deliveryCityId: enrichedDeliveryInfo?.location?.type === 'city' ? enrichedDeliveryInfo.location.id : null,
          deliveryCityName: enrichedDeliveryInfo?.location?.type === 'city' ? enrichedDeliveryInfo.location.name : null,
          deliveryRegionId: enrichedDeliveryInfo?.location?.type === 'region' ? enrichedDeliveryInfo.location.id : null,
          deliveryRegionName: enrichedDeliveryInfo?.location?.type === 'region' ? enrichedDeliveryInfo.location.name : null,
          deliveryZoneId: enrichedDeliveryInfo?.location?.type === 'international' ? enrichedDeliveryInfo.location.id : null,
          deliveryZoneName: enrichedDeliveryInfo?.location?.type === 'international' ? enrichedDeliveryInfo.location.name : null,
          transporteurId: enrichedDeliveryInfo?.transporteur?.id || null,
          transporteurName: enrichedDeliveryInfo?.transporteur?.name || null,
          transporteurLogo: enrichedDeliveryInfo?.transporteur?.logo || null,
          transporteurPhone: enrichedDeliveryInfo?.transporteur?.phone || null,
          deliveryFee: deliveryFee,
          deliveryTime: enrichedDeliveryInfo?.tarif?.deliveryTime || null,
          zoneTarifId: createOrderDto.deliveryInfo?.zoneTarifId || null,
          deliveryMetadata: deliveryMetadata,

          orderItems: {
            create: await Promise.all(validatedOrderItems.map(async (item) => {
              // 🔍 DEBUG: Log complet des données de customisation AVANT validation
              console.log(`🔍 [DEBUG] Données customisation reçues:`, {
                productId: item.productId,
                vendorProductId: item.vendorProductId,
                hasCustomizationIds: !!item.customizationIds,
                customizationIds: item.customizationIds,
                hasDesignElementsByView: !!item.designElementsByView,
                designElementsByViewKeys: item.designElementsByView ? Object.keys(item.designElementsByView) : [],
                hasViewsMetadata: !!item.viewsMetadata,
                hasDelimitation: !!item.delimitation,
                hasDelimitations: !!item.delimitations
              });

              // 🎨 VALIDATION DES DONNÉES DE CUSTOMISATION
              if (item.customizationIds || item.designElementsByView) {
                try {
                  CustomizationValidator.validateOrThrow(item);
                  this.logger.log(`✅ Validation customisation réussie pour productId ${item.productId}`);
                } catch (error) {
                  this.logger.error(`❌ Validation customisation échouée pour productId ${item.productId}:`, error);
                  // Log détaillé des erreurs
                  if (error.response && error.response.errors) {
                    console.error(`❌ Erreurs de validation:`, JSON.stringify(error.response.errors, null, 2));
                  }
                  throw error;
                }
              }

              // 🆕 Calcul préliminaire du totalPrice pour les logs
              const logTotalPrice = (item.unitPrice || 0) * item.quantity;

              console.log(`📦 [ORDER] Création orderItem:`, {
                productId: item.productId,
                vendorProductId: item.vendorProductId,
                colorId: item.colorId,
                color: item.color,
                size: item.size,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: logTotalPrice, // 🆕 Prix total calculé
                // 🎨 Informations de design
                mockupUrl: item.mockupUrl,
                designId: item.designId,
                customizationId: item.customizationId,
                // 🎨 NOUVEAU: Système multi-vues
                customizationIds: item.customizationIds,
                hasDesignElementsByView: !!item.designElementsByView,
                hasViewsMetadata: !!item.viewsMetadata,
                viewsCount: item.viewsMetadata ? item.viewsMetadata.length : (item.customizationIds ? Object.keys(item.customizationIds).length : 0),
                hasDesignPositions: !!item.designPositions,
                hasDesignMetadata: !!item.designMetadata
              });

              // 🔥 CORRECTION: Utiliser baseProductId du vendorProduct au lieu de productId
              let finalProductId = item.productId;
              if (item.vendorProductId) {
                try {
                  const vendorProduct = await this.prisma.vendorProduct.findUnique({
                    where: { id: item.vendorProductId },
                    select: { baseProductId: true }
                  });
                  if (vendorProduct) {
                    finalProductId = vendorProduct.baseProductId;
                    console.log(`🔄 [ORDER] Utilisation de baseProductId: ${finalProductId} pour vendorProductId: ${item.vendorProductId}`);
                  }
                } catch (error) {
                  console.error(`❌ [ORDER] Erreur récupération baseProductId:`, error);
                  // Garder productId original si erreur
                }
              }

              // 🆕 Calcul du prix total pour cet item
              const itemTotalPrice = (item.unitPrice || 0) * item.quantity;

              // 🎯 DÉTERMINER LE TYPE D'ITEM (STICKER ou PRODUIT NORMAL)
              const isSticker = !!item.stickerId;

              // 🆕 ENRICHISSEMENT DES DONNÉES DE CUSTOMISATION
              // Initialiser de manière conditionnelle selon le type (sticker ou produit)
              let enrichedItem: any = {
                quantity: item.quantity,
                unitPrice: item.unitPrice || 0,
                totalPrice: itemTotalPrice,
              };

              if (isSticker) {
                // ✅ POUR LES STICKERS: Structure simplifiée
                // ⚠️ IMPORTANT: Ne PAS inclure productId du tout (même pas null) pour éviter l'erreur de contrainte FK
                this.logger.log(`🎯 [STICKER] Item avant transformation:`, JSON.stringify(item));
                enrichedItem.stickerId = item.stickerId;
                enrichedItem.size = item.size || null;
                enrichedItem.color = item.color || 'N/A'; // Valeur par défaut pour les stickers
                // Ne pas définir les champs optionnels pour les stickers
                // Prisma gérera automatiquement les valeurs null/undefined
                this.logger.log(`🎯 [STICKER] enrichedItem après transformation:`, JSON.stringify(enrichedItem));
              } else {
                // ✅ POUR LES PRODUITS NORMAUX: Structure complète avec personnalisations
                enrichedItem.productId = finalProductId;
                enrichedItem.vendorProductId = item.vendorProductId || null;
                enrichedItem.size = item.size || null;
                enrichedItem.color = item.color || null;
                enrichedItem.colorId = item.colorId || null;
                // 🎨 Design et mockup
                enrichedItem.mockupUrl = item.mockupUrl || null;
                enrichedItem.designId = item.designId || null;
                enrichedItem.designPositions = item.designPositions || null;
                enrichedItem.designMetadata = item.designMetadata || null;
                enrichedItem.customizationId = item.customizationId || null;
                // 🎨 Système multi-vues - Données de base
                enrichedItem.customizationIds = item.customizationIds ? JSON.parse(JSON.stringify(item.customizationIds)) : null;
                enrichedItem.designElementsByView = item.designElementsByView ? JSON.parse(JSON.stringify(item.designElementsByView)) : null;
                enrichedItem.viewsMetadata = item.viewsMetadata ? JSON.parse(JSON.stringify(item.viewsMetadata)) : null;
                enrichedItem.delimitation = item.delimitation ? JSON.parse(JSON.stringify(item.delimitation)) : null;
                // 🆕 NOUVEAUX CHAMPS
                enrichedItem.delimitations = item.delimitations ? JSON.parse(JSON.stringify(item.delimitations)) : null;
                enrichedItem.colorVariationData = item.colorVariationData ? JSON.parse(JSON.stringify(item.colorVariationData)) : null;
              }

              // 🆕 ENRICHIR avec colorVariation complète si colorId présent (uniquement pour produits normaux)
              if (!isSticker && item.colorId && (item.designElementsByView || item.customizationIds)) {
                try {
                  const enrichedData = await CustomizationEnricherHelper.enrichOrderItemWithColorVariation(
                    enrichedItem,
                    this.prisma
                  );

                  // Mettre à jour les champs enrichis
                  enrichedItem.colorVariationData = enrichedData.colorVariationData;
                  enrichedItem.delimitations = enrichedData.delimitations;
                  enrichedItem.delimitation = enrichedData.delimitation;

                  // 🆕 Validation des dimensions de référence
                  const validation = CustomizationEnricherHelper.validateDelimitationDimensions(
                    enrichedData.delimitations
                  );
                  if (!validation.isValid) {
                    this.logger.warn(`⚠️ Problèmes de délimitations pour productId ${item.productId}:`, validation.warnings);
                  }
                } catch (error) {
                  this.logger.error(`❌ Erreur enrichissement pour productId ${item.productId}:`, error);
                  // Continuer sans enrichissement en cas d'erreur
                }
              }

              return enrichedItem;
            }))
          }
        },
        include: {
          orderItems: {
            include: {
              product: true,
              stickerProduct: { // 🆕 Inclure le sticker pour les commandes de stickers
                include: {
                  vendor: {
                    select: {
                      id: true,
                      shop_name: true,
                    }
                  },
                  design: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                    }
                  }
                }
              },
              colorVariation: true,
              vendorProduct: { // 🆕 Inclure le produit vendeur
                include: {
                  vendor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      shop_name: true,
                      email: true,
                      phone: true
                    }
                  }
                }
              }
            }
          },
          user: userId ? true : false // Inclure user seulement si userId existe
        }
      });

      // 🎨 MARQUER LES PERSONNALISATIONS COMME COMMANDÉES
      try {
        // Collecter TOUS les IDs de customization (ancien système + nouveau système multi-vues)
        const allCustomizationIds = new Set<number>();

        createOrderDto.orderItems.forEach(item => {
          // Ancien système: customizationId (singulier)
          if (item.customizationId) {
            allCustomizationIds.add(item.customizationId);
          }

          // 🆕 NOUVEAU système: customizationIds (pluriel) - Multi-vues
          if (item.customizationIds) {
            const ids = Object.values(item.customizationIds);
            ids.forEach(id => {
              if (typeof id === 'number') {
                allCustomizationIds.add(id);
              }
            });
          }
        });

        const customizationIdsArray = Array.from(allCustomizationIds);

        if (customizationIdsArray.length > 0) {
          this.logger.log(`🎨 Marquage de ${customizationIdsArray.length} personnalisation(s) comme commandée(s)`);
          this.logger.log(`🎨 IDs: ${customizationIdsArray.join(', ')}`);

          // Marquer chaque personnalisation comme "ordered"
          const updatePromises = customizationIdsArray.map(customizationId =>
            this.customizationService.markAsOrdered(customizationId, order.id)
          );

          await Promise.all(updatePromises);
          this.logger.log(`✅ ${customizationIdsArray.length} personnalisation(s) marquée(s) comme commandée(s) pour commande ${order.id}`);
        } else {
          this.logger.log(`ℹ️ Aucune personnalisation à marquer pour commande ${order.id}`);
        }
      } catch (error) {
        this.logger.error(`❌ Erreur marquage personnalisations pour commande ${order.id}:`, error);
        // Ne pas faire échouer la création de commande pour cette erreur
      }

      // 🎯 TRACKER LES DESIGNS VENDEURS UTILISÉS
      try {
        this.logger.log(`🎨 [Design Revenue] Début tracking des designs pour commande ${order.id}`);

        // Parcourir chaque orderItem pour extraire et enregistrer les designs vendeurs
        for (const orderItem of order.orderItems) {
          // Récupérer les customizationIds depuis createOrderDto (données originales)
          const originalItem = createOrderDto.orderItems.find(
            item => item.productId === orderItem.productId && item.colorId === orderItem.colorId
          );

          if (originalItem && originalItem.customizationIds) {
            this.logger.log(`🎨 [Design Revenue] Analyse orderItem ${orderItem.id} avec ${Object.keys(originalItem.customizationIds).length} customization(s)`);

            await DesignUsageTracker.extractAndRecordDesignUsages(
              this.prisma,
              order,
              orderItem,
              originalItem.customizationIds
            );
          } else {
            this.logger.debug(`ℹ️ [Design Revenue] Pas de customizations pour orderItem ${orderItem.id}`);
          }
        }

        this.logger.log(`✅ [Design Revenue] Tracking designs terminé pour commande ${order.id}`);
      } catch (error) {
        this.logger.error(`❌ [Design Revenue] Erreur tracking designs pour commande ${order.id}:`, error);
        // Ne pas faire échouer la création de commande pour cette erreur
      }

      // 🆕 MISE À JOUR AUTOMATIQUE DES STATISTIQUES - Création de commande
      try {
        await this.salesStatsUpdaterService.updateStatsOnOrderCreation(order.id);
        this.logger.log(`📊 Statistiques de création mises à jour pour commande ${order.id}`);
      } catch (error) {
        this.logger.error(`❌ Erreur mise à jour statistiques création commande ${order.id}:`, error);
        // Ne pas faire échouer la création de commande pour cette erreur
      }

      // 🆕 NOTIFICATION DES VENDEURS CONCERNÉS
      try {
        await this.notifyVendorsOfNewOrder(order.id);
        this.logger.log(`🔔 Notifications vendeurs envoyées pour commande ${order.id}`);
      } catch (error) {
        this.logger.error(`❌ Erreur notification vendeurs pour commande ${order.id}:`, error);
        // Ne pas faire échouer la création de commande pour cette erreur
      }

      // 📦 DÉCRÉMENTATION DU STOCK PAR TAILLE
      try {
        await this.decrementStockForOrderItems(createOrderDto.orderItems);
        this.logger.log(`📦 Stock décrémenté pour commande ${order.id}`);
      } catch (error) {
        this.logger.error(`❌ Erreur décrémentation stock pour commande ${order.id}:`, error);
        // Ne pas faire échouer la création de commande pour cette erreur
      }

      // 💳 Payment Integration (PayDunya or PayTech)
      let paymentData = null;

      // 💰 PayDunya Payment Integration
      if (createOrderDto.paymentMethod === PaymentMethod.PAYDUNYA && createOrderDto.initiatePayment) {
        try {
          this.logger.log(`💳 Initializing PayDunya payment for order: ${order.orderNumber}`);

          // Construire l'URL de retour avec les paramètres nécessaires
          // PayDunya va rediriger vers cette URL après le paiement
          const frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:5174';
          const baseReturnUrl = `${frontendUrl}/order-confirmation`;

          // Note: On ne peut pas mettre le token ici car on ne l'a pas encore
          // PayDunya va automatiquement append le token dans les query params
          const returnUrl = `${baseReturnUrl}?orderNumber=${encodeURIComponent(order.orderNumber)}&totalAmount=${encodeURIComponent(order.totalAmount)}&email=${encodeURIComponent(createOrderDto.email || '')}`;
          const cancelUrl = `${baseReturnUrl}?orderNumber=${encodeURIComponent(order.orderNumber)}&status=cancelled`;

          this.logger.log(`🔗 Return URL: ${returnUrl}`);
          this.logger.log(`❌ Cancel URL: ${cancelUrl}`);

          const paymentResponse = await this.paydunyaService.createInvoice({
            invoice: {
              total_amount: order.totalAmount,
              description: `Commande Printalma - ${order.orderNumber}`,
              customer: {
                name: fullName,
                email: createOrderDto.email || undefined,
                phone: createOrderDto.phoneNumber
              }
            },
            store: {
              name: 'Printalma',
              tagline: 'Impression personnalisée de qualité',
              postal_address: 'Dakar, Sénégal',
              phone: this.configService.get('STORE_PHONE') || '+221338234567',
              website_url: this.configService.get('STORE_URL') || 'https://printalma.com'
            },
            custom_data: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              userId: userId
            },
            actions: {
              return_url: returnUrl,
              cancel_url: cancelUrl,
              callback_url: this.configService.get('PAYDUNYA_CALLBACK_URL') || `${this.configService.get('API_URL') || 'http://localhost:3004'}/paydunya/webhook`
            }
          });

          // 🔧 CORRECTION: Toujours construire l'URL nous-mêmes en utilisant la config BDD
          // PayDunya retourne parfois des URLs avec "paydunya.com" au lieu de "app.paydunya.com"
          // ce qui cause des erreurs en production

          // Récupérer le mode actif depuis la configuration de la base de données
          const paymentConfig = await this.prisma.paymentConfig.findFirst({
            where: {
              provider: 'PAYDUNYA',
              isActive: true
            }
          });

          // Utiliser le mode de la config BDD (priorité) ou fallback sur les variables d'environnement
          const paydunyaMode = paymentConfig?.activeMode || this.configService.get('PAYDUNYA_MODE', 'test');
          const baseUrl = paydunyaMode === 'live'
            ? 'https://paydunya.com/checkout/invoice'
            : 'https://app.paydunya.com/sandbox-checkout/invoice';
          const paymentUrl = `${baseUrl}/${paymentResponse.token}`;

          this.logger.log(`🔗 PayDunya mode: ${paydunyaMode} (from ${paymentConfig ? 'database' : 'env'})`);
          this.logger.log(`🔗 Constructed payment URL: ${paymentUrl}`);

          // 🆕 Sauvegarder le token PayDunya dans transactionId pour le cron job
          await this.prisma.order.update({
            where: { id: order.id },
            data: { transactionId: paymentResponse.token }
          });

          // 🆕 Créer un PaymentAttempt pour la traçabilité du cron job
          await this.prisma.paymentAttempt.create({
            data: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              paymentMethod: 'paydunya',
              paytechToken: paymentResponse.token,
              amount: order.totalAmount,
              attemptedAt: new Date()
            }
          });

          this.logger.log(`💾 Saved PayDunya token ${paymentResponse.token} in transactionId for order ${order.orderNumber}`);
          this.logger.log(`📝 Created PaymentAttempt record for order ${order.orderNumber}`);

          paymentData = {
            token: paymentResponse.token,
            redirect_url: paymentUrl,
            payment_url: paymentUrl,
            mode: paydunyaMode
          };

          this.logger.log(`💳 PayDunya payment initialized successfully: ${paymentResponse.token}`);
        } catch (error) {
          this.logger.error(`❌ Failed to initialize PayDunya payment: ${error.message}`, error.stack);
          // Don't fail order creation if payment initialization fails
          // The user can try to pay later
        }
      }

      // 💳 PayTech Payment Integration
      else if (createOrderDto.paymentMethod === PaymentMethod.PAYTECH && createOrderDto.initiatePayment) {
        try {
          this.logger.log(`💳 Initializing PayTech payment for order: ${order.orderNumber}`);

          const paymentResponse = await this.paytechService.requestPayment({
            item_name: `Order ${order.orderNumber}`,
            item_price: order.totalAmount,
            ref_command: order.orderNumber,
            command_name: `Printalma Order - ${order.orderNumber}`,
            currency: PayTechCurrency.XOF,
            env: (this.configService.get('PAYTECH_ENVIRONMENT') === 'test'
              ? PayTechEnvironment.TEST
              : PayTechEnvironment.PROD),
            ipn_url: this.configService.get('PAYTECH_IPN_URL'),
            success_url: this.configService.get('PAYTECH_SUCCESS_URL'),
            cancel_url: this.configService.get('PAYTECH_CANCEL_URL'),
            custom_field: JSON.stringify({ orderId: order.id, userId })
          });

          // 🆕 Sauvegarder le token PayTech dans transactionId pour le cron job
          await this.prisma.order.update({
            where: { id: order.id },
            data: { transactionId: paymentResponse.token }
          });

          // 🆕 Créer un PaymentAttempt pour la traçabilité du cron job
          await this.prisma.paymentAttempt.create({
            data: {
              orderId: order.id,
              orderNumber: order.orderNumber,
              paymentMethod: 'paytech',
              paytechToken: paymentResponse.token,
              amount: order.totalAmount,
              attemptedAt: new Date()
            }
          });

          this.logger.log(`💾 Saved PayTech token ${paymentResponse.token} in transactionId for order ${order.orderNumber}`);
          this.logger.log(`📝 Created PaymentAttempt record for order ${order.orderNumber}`);

          paymentData = {
            token: paymentResponse.token,
            redirect_url: paymentResponse.redirect_url || paymentResponse.redirectUrl
          };

          this.logger.log(`💳 PayTech payment initialized successfully: ${paymentResponse.token}`);
        } catch (error) {
          this.logger.error(`❌ Failed to initialize PayTech payment: ${error.message}`, error.stack);
          // Don't fail order creation if payment initialization fails
          // The user can try to pay later
        }
      }

      const formattedOrder = this.formatOrderResponse(order);

      // Debug: vérifier les données de paiement
      this.logger.log(`🔍 PaymentData check:`, {
        hasPaymentData: !!paymentData,
        paymentDataToken: paymentData?.token,
        paymentDataUrl: paymentData?.redirect_url
      });

      const finalResponse = paymentData
        ? { ...formattedOrder, payment: paymentData }
        : formattedOrder;

      this.logger.log(`🔍 Final response payment field:`, finalResponse.payment);

      return finalResponse;
    } catch (error) {
      console.error('Erreur lors de la création de la commande:', error);
      throw new BadRequestException(`Erreur lors de la création de la commande: ${error.message}`);
    }
  }

  /**
   * Update order payment status after PayTech IPN callback
   * This should be called by the PayTech IPN handler
   *
   * 🆕 Enhanced with automatic insufficient funds tracking
   */
  async updateOrderPaymentStatus(
    orderNumber: string,
    paymentStatus: 'PAID' | 'FAILED',
    transactionId?: string,
    failureDetails?: {
      reason: string;
      code?: string;
      message?: string;
      processorResponse?: string;
      category: string;
    },
    attemptNumber?: number
  ) {
    try {
      this.logger.log(`💳 Updating payment status for order ${orderNumber}: ${paymentStatus}`);

      const order = await this.prisma.order.findFirst({
        where: { orderNumber }
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderNumber} not found`);
      }

      // Prepare update data
      const updateData: any = {
        paymentStatus,
        transactionId,
        // If payment is successful, update order status to CONFIRMED
        ...(paymentStatus === 'PAID' && { status: OrderStatus.CONFIRMED }),
        // 🆕 Update payment attempts counter
        ...(attemptNumber && { paymentAttempts: attemptNumber }),
        // 🆕 Update last payment attempt timestamp
        lastPaymentAttemptAt: new Date(),
      };

      // Store failure details if payment failed
      if (paymentStatus === 'FAILED' && failureDetails) {
        // Store as JSON string in notes field or add custom fields
        const failureInfo = {
          reason: failureDetails.reason,
          category: failureDetails.category,
          code: failureDetails.code,
          message: failureDetails.message,
          processorResponse: failureDetails.processorResponse,
          timestamp: new Date().toISOString(),
          attemptNumber: attemptNumber || 1
        };

        // 🆕 Update insufficient funds flag
        if (failureDetails.category === 'insufficient_funds') {
          updateData.hasInsufficientFunds = true;
          updateData.lastPaymentFailureReason = failureDetails.reason;
          this.logger.log(`💰 Insufficient funds detected for order ${orderNumber}`);
        } else {
          updateData.lastPaymentFailureReason = failureDetails.reason;
        }

        // Add failure info to notes field (or you could add new fields to the schema)
        updateData.notes = order.notes
          ? `${order.notes}\n\n💳 PAYMENT FAILED (Attempt #${attemptNumber || 1}): ${JSON.stringify(failureInfo, null, 2)}`
          : `💳 PAYMENT FAILED (Attempt #${attemptNumber || 1}): ${JSON.stringify(failureInfo, null, 2)}`;

        this.logger.log(
          `💳 Payment failure details stored for order ${orderNumber}: ${failureDetails.reason} (${failureDetails.category})`
        );
      }

      // 🆕 Reset insufficient funds flag if payment succeeds
      if (paymentStatus === 'PAID' && order.hasInsufficientFunds) {
        updateData.hasInsufficientFunds = false;
        updateData.lastPaymentFailureReason = null;
        this.logger.log(`✅ Payment succeeded - insufficient funds flag reset for order ${orderNumber}`);
      }

      const updatedOrder = await this.prisma.order.update({
        where: { id: order.id },
        data: updateData,
        include: {
          orderItems: {
            include: {
              product: true, // 🔧 Produit de base (l'image est déjà dans mockupUrl de l'orderItem)
              vendorProduct: {
                select: {
                  id: true,
                  name: true,
                  finalImageUrl: true, // 🔧 Image finale du produit vendeur
                }
              },
              colorVariation: true,
            }
          },
          user: true
        }
      });

      this.logger.log(`✅ Payment status updated for order ${orderNumber}`);
      this.logger.log(`📧 [Invoice] Email présent dans la commande: ${updatedOrder.email ? 'OUI ✅' : 'NON ❌'} - Email: ${updatedOrder.email || 'AUCUN'}`);

      // ✅ METTRE À JOUR LES STATISTIQUES DE VENTE SI PAIEMENT RÉUSSI
      if (paymentStatus === 'PAID' && order.status !== OrderStatus.CONFIRMED) {
        this.logger.log(`✅ Commande ${orderNumber} confirmée suite au paiement, mise à jour des statistiques de vente`);

        try {
          await this.salesStatsUpdaterService.updateSalesStatsOnConfirmation(order.id);
          this.logger.log(`📊 Statistiques de vente mises à jour pour commande confirmée ${orderNumber}`);
        } catch (error) {
          this.logger.error(`❌ Erreur mise à jour statistiques confirmation commande ${orderNumber}:`, error);
          // Ne pas faire échouer la mise à jour du statut pour cette erreur
        }
      }

      // 🎯 METTRE À JOUR LE STATUT DES DESIGN USAGES SI PAIEMENT RÉUSSI
      if (paymentStatus === 'PAID') {
        try {
          const updatedCount = await DesignUsageTracker.updatePaymentStatus(
            this.prisma,
            order.id,
            'CONFIRMED'
          );
          this.logger.log(`✅ [Design Revenue] ${updatedCount} design usage(s) confirmé(s) pour commande ${orderNumber}`);
        } catch (error) {
          this.logger.error(`❌ [Design Revenue] Erreur mise à jour design usages:`, error);
          // Ne pas faire échouer la mise à jour de commande
        }

        // 📧 ENVOYER LA FACTURE PAR EMAIL
        if (!updatedOrder.email) {
          this.logger.warn(`⚠️  [Invoice] IMPOSSIBLE d'envoyer la facture pour ${orderNumber} : EMAIL MANQUANT`);
          this.logger.warn(`   💡 L'email doit être fourni lors de la création de commande (champ "email" dans le payload)`);
        } else {
          try {
            this.logger.log(`📧 [Invoice] ✅ Email présent: ${updatedOrder.email}`);
            this.logger.log(`📧 [Invoice] Envoi de la facture pour commande ${orderNumber}...`);
            await this.mailService.sendOrderInvoice(updatedOrder);
            this.logger.log(`✅ [Invoice] Facture envoyée avec succès à ${updatedOrder.email} pour commande ${orderNumber}`);
          } catch (error) {
            this.logger.error(`❌ [Invoice] Erreur lors de l'envoi de la facture pour ${orderNumber}:`, error.message);
            this.logger.error(`   Stack:`, error.stack);
            // Ne pas faire échouer la mise à jour de commande si l'email échoue
          }
        }
      }

      return this.formatOrderResponse(updatedOrder);
    } catch (error) {
      this.logger.error(`❌ Failed to update payment status: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllOrders(page: number = 1, limit: number = 10, status?: OrderStatus) {
    const skip = (page - 1) * limit;
    const where = status ? { status } : {};

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          orderItems: {
            include: {
              product: true,
              stickerProduct: { // 🆕 Inclure le sticker
                include: {
                  vendor: {
                    select: {
                      id: true,
                      shop_name: true,
                    }
                  },
                  design: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                    }
                  }
                }
              },
              colorVariation: true,
              vendorProduct: {
                include: {
                  vendor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      shop_name: true,
                      profile_photo_url: true
                    }
                  },
                  baseProduct: {
                    include: {
                      colorVariations: {
                        include: {
                          images: {
                            include: {
                              delimitations: true
                            }
                          }
                        }
                      }
                    }
                  },
                  design: true
                }
              },
              // 🎨 Inclure les données de personnalisation client
              customization: {
                select: {
                  id: true,
                  designElements: true,
                  elementsByView: true,
                  previewImageUrl: true,
                  colorVariationId: true,
                  viewId: true,
                  sizeSelections: true,
                  status: true,
                  createdAt: true,
                  updatedAt: true
                }
              }
            }
          },
          user: true,
          validator: true,
          // 🆕 Inclure l'historique des tentatives de paiement
          paymentAttemptsHistory: {
            orderBy: {
              attemptedAt: 'desc',
            },
            take: 3, // Dernières 3 tentatives
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    this.prisma.order.count({ where })
  ]);

    const enrichedOrders = await Promise.all(
      orders.map(order => this.enrichOrderWithProductData(order))
    );

    return {
      orders: enrichedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * 🆕 Enrichir les commandes avec les données complètes des produits vendeurs
   * Ajoute les images, designs et positions comme dans l'endpoint /public/vendor-products
   */
  private async enrichOrderWithProductData(order: any) {
    try {
      // Enrichir chaque orderItem avec les données du produit vendeur
      const enrichedOrderItems = await Promise.all(
        order.orderItems.map(async (item: any) => {
          let enrichedProductData = null;

          // Si l'item a un vendorProductId, enrichir avec les données complètes
          if (item.vendorProductId && item.vendorProduct) {
            enrichedProductData = await this.createEnrichedProductData(item.vendorProduct);
          } else {
            // Sinon, créer une structure de base avec le produit admin
            enrichedProductData = {
              id: item.product?.id,
              vendorName: item.product?.name || 'Produit inconnu',
              price: item.unitPrice,
              status: 'PUBLISHED',

              // Structure de base pour les produits sans vendor
              adminProduct: {
                id: item.product?.id,
                name: item.product?.name,
                description: item.product?.description,
                colorVariations: item.colorVariation ? [{
                  name: item.colorVariation.name,
                  colorCode: item.colorVariation.colorCode,
                  images: item.colorVariation.images || []
                }] : []
              },

              // Informations de base
              designApplication: {
                hasDesign: false,
                designUrl: null,
                positioning: 'CENTER',
                scale: 0.6,
                mode: 'PRESERVED'
              },

              designDelimitations: [],
              design: null,
              designPositions: [],

              vendor: null,
              images: {
                adminReferences: item.colorVariation ? [{
                  colorName: item.colorVariation.name,
                  colorCode: item.colorVariation.colorCode,
                  adminImageUrl: item.colorVariation.images?.[0]?.url || null,
                  imageType: 'admin_reference'
                }] : [],
                total: item.colorVariation ? 1 : 0,
                primaryImageUrl: item.colorVariation?.images?.[0]?.url || null
              },

              selectedSizes: [],
              selectedColors: item.colorVariation ? [{
                id: item.colorVariation.id,
                name: item.colorVariation.name,
                colorCode: item.colorVariation.colorCode
              }] : [],
              designId: null
            };
          }

          return {
            ...item,
            // Garder les informations existantes du produit
            product: {
              ...item.product,
              orderedColorName: item.colorVariation?.name || null,
              orderedColorHexCode: item.colorVariation?.colorCode || null,
              orderedColorImageUrl: item.colorVariation?.images?.[0]?.url || null,
            },
            // 🆕 Ajouter les données enrichies du produit vendeur
            enrichedVendorProduct: enrichedProductData
          };
        })
      );

      // Formatter la commande avec les items enrichis
      const formattedOrder = this.formatOrderResponse({
        ...order,
        orderItems: enrichedOrderItems
      });

      return formattedOrder;
    } catch (error) {
      this.logger.error(`❌ Erreur enrichissement commande ${order.id}:`, error);
      // En cas d'erreur, retourner la commande formatée de base
      return this.formatOrderResponse(order);
    }
  }

  /**
   * Créer des données de produit enrichi si le service n'est pas disponible
   */
  private async createEnrichedProductData(vendorProduct: any) {
    try {
      // Structure de base similaire à celle du VendorPublishService
      return {
        id: vendorProduct.id,
        vendorName: vendorProduct.name,
        price: vendorProduct.price,
        status: vendorProduct.status,

        // 🏆 MEILLEURES VENTES
        bestSeller: {
          isBestSeller: vendorProduct.isBestSeller || false,
          salesCount: vendorProduct.salesCount || 0,
          totalRevenue: vendorProduct.totalRevenue || 0
        },

        // 🎨 STRUCTURE ADMIN CONSERVÉE
        adminProduct: {
          id: vendorProduct.baseProduct?.id,
          name: vendorProduct.baseProduct?.name,
          description: vendorProduct.baseProduct?.description,
          price: vendorProduct.baseProduct?.price,
          genre: vendorProduct.baseProduct?.genre,
          colorVariations: vendorProduct.baseProduct?.colorVariations || [],
          sizes: vendorProduct.baseProduct?.sizes || []
        },

        // 🎨 APPLICATION DESIGN
        designApplication: {
          hasDesign: !!vendorProduct.design,
          designUrl: vendorProduct.design?.imageUrl || null,
          positioning: 'CENTER',
          scale: vendorProduct.designScale || 0.6,
          mode: 'PRESERVED'
        },

        // 🎨 DÉLIMITATIONS DU DESIGN
        designDelimitations: vendorProduct.baseProduct?.colorVariations?.map((colorVar: any) => ({
          colorName: colorVar.name,
          colorCode: colorVar.colorCode,
          imageUrl: colorVar.images?.[0]?.url || null,
          naturalWidth: colorVar.images?.[0]?.naturalWidth || 800,
          naturalHeight: colorVar.images?.[0]?.naturalHeight || 600,
          delimitations: colorVar.images?.[0]?.delimitations || []
        })) || [],

        // 🎨 INFORMATIONS DESIGN COMPLÈTES
        design: vendorProduct.design ? {
          id: vendorProduct.design.id,
          name: vendorProduct.design.name,
          description: vendorProduct.design.description,
          category: vendorProduct.design.category,
          imageUrl: vendorProduct.design.imageUrl,
          tags: vendorProduct.design.tags || [],
          isValidated: vendorProduct.design.isValidated
        } : null,

        // 🎨 POSITIONNEMENTS DU DESIGN (basiques)
        designPositions: vendorProduct.designPositions || [{
          designId: vendorProduct.designId,
          position: {
            x: 0,
            y: 0,
            scale: vendorProduct.designScale || 0.6,
            rotation: 0,
            designWidth: vendorProduct.designWidth || 1200,
            designHeight: vendorProduct.designHeight || 1200
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }],

        // 👤 INFORMATIONS VENDEUR
        vendor: vendorProduct.vendor ? {
          id: vendorProduct.vendor.id,
          fullName: `${vendorProduct.vendor.firstName} ${vendorProduct.vendor.lastName}`,
          shop_name: vendorProduct.vendor.shop_name,
          profile_photo_url: vendorProduct.vendor.profile_photo_url
        } : null,

        // 🖼️ IMAGES ADMIN CONSERVÉES
        images: {
          adminReferences: vendorProduct.baseProduct?.colorVariations?.map((colorVar: any) => ({
            colorName: colorVar.name,
            colorCode: colorVar.colorCode,
            adminImageUrl: colorVar.images?.[0]?.url || null,
            imageType: 'admin_reference'
          })) || [],
          total: vendorProduct.baseProduct?.colorVariations?.length || 0,
          primaryImageUrl: vendorProduct.baseProduct?.colorVariations?.[0]?.images?.[0]?.url || null
        },

        // 📏 SÉLECTIONS VENDEUR
        selectedSizes: this.parseJsonSafely(vendorProduct.sizes) || [],
        selectedColors: this.parseJsonSafely(vendorProduct.colors) || [],
        designId: vendorProduct.designId
      };
    } catch (error) {
      this.logger.error(`❌ Erreur création données enrichies:`, error);
      return null;
    }
  }

  /**
   * Parser du JSON en toute sécurité
   */
  private parseJsonSafely(jsonString: string | null): any {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch {
      return null;
    }
  }

  async getUserOrders(userId: number) {
    const orders = await this.prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
          include: {
            product: true,
            stickerProduct: { // 🆕 Inclure le sticker
              include: {
                vendor: {
                  select: {
                    id: true,
                    shop_name: true,
                  }
                },
                design: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                  }
                }
              }
            },
            colorVariation: true,
          },
        },
        // 🆕 Inclure l'historique des tentatives de paiement
        paymentAttemptsHistory: {
          orderBy: {
            attemptedAt: 'desc',
          },
          take: 3, // Dernières 3 tentatives
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return orders.map(order => this.formatOrderResponse(order));
  }

  /**
   * Récupère uniquement les commandes contenant des produits du vendeur
   * Un vendeur ne doit voir que les commandes de ses produits, pas ses commandes personnelles
   */
  async getVendorOrders(vendorId: number) {
    // Récupérer les informations du vendeur
    const vendor = await this.prisma.user.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        shop_name: true,
        role: true
      }
    });

    // Récupérer tous les produits de base liés à ce vendeur via VendorProduct
    const vendorProducts = await this.prisma.vendorProduct.findMany({
      where: { vendorId },
      select: { baseProductId: true }
    });

    const baseProductIds = vendorProducts.map(vp => vp.baseProductId);

    if (baseProductIds.length === 0) {
      this.logger.log(`Vendeur ${vendorId} n'a aucun produit`);
      return [];
    }

    // Récupérer uniquement les commandes contenant les produits du vendeur
    // Un vendeur ne doit voir que les commandes de ses produits, pas ses commandes personnelles de client
    const orders = await this.prisma.order.findMany({
      where: {
        // 🎯 Uniquement les commandes contenant spécifiquement les produits vendeur de ce vendeur
        orderItems: {
          some: {
            vendorProduct: {
              vendorId: vendorId
            }
          }
        }
      },
      select: {
        id: true,
        orderNumber: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        deliveryFee: true,
        createdAt: true,
        updatedAt: true,
        validatedAt: true,
        // 🔑 CHAMPS DE COMMISSION EXPLICITES
        commissionRate: true,
        commissionAmount: true,
        vendorAmount: true,
        commissionAppliedAt: true,
        orderItems: {
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            product: true,
            colorVariation: true,
          },
        },
        user: true,
        validator: true,
        // 🆕 Inclure l'historique des tentatives de paiement
        paymentAttemptsHistory: {
          orderBy: {
            attemptedAt: 'desc',
          },
          take: 3,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    this.logger.log(`Vendeur ${vendorId}: ${orders.length} commande(s) trouvée(s)`);

    // Récupérer les informations de commission du vendeur directement depuis la base de données
    const commissionRecord = await this.prisma.vendorCommission.findUnique({
      where: { vendorId },
      select: { commissionRate: true }
    });

    const commissionRate = commissionRecord ? commissionRecord.commissionRate : 40.0; // Taux par défaut

    this.logger.log(`Commission pour vendeur ${vendorId}: ${commissionRate}%`);

    // Ajouter les informations du vendeur et les détails de commission à chaque commande
    return orders.map(order => {
      // Formatter la commande d'abord pour obtenir les calculs corrects de commission
      const formattedOrder = this.formatOrderResponse(order);

      // 🛡️ UTILISER LES COMMISSIONS RECALCULÉES DANS formatOrderResponse (basées sur le bénéfice)
      // formatOrderResponse a déjà recalculé vendorAmount et commissionAmount sur le bénéfice
      const calculatedCommissionAmount = formattedOrder.commissionAmount;
      const calculatedVendorAmount = formattedOrder.vendorAmount;
      const storedCommissionRate = order.commissionRate || commissionRate;
      const storedCommissionAppliedAt = order.commissionAppliedAt;

      // ✅ Toujours utiliser les valeurs calculées (basées sur le bénéfice)
      const commissionInfo = {
        commission_rate: storedCommissionRate,
        commission_amount: calculatedCommissionAmount,
        vendor_amount: calculatedVendorAmount,
        total_amount: order.totalAmount,
        applied_rate: storedCommissionRate,
        has_custom_rate: commissionRecord !== null,
        commission_applied_at: storedCommissionAppliedAt?.toISOString() || null,
        is_legacy_order: !order.commissionRate || order.commissionAmount == null || order.vendorAmount == null
      };

      return {
        ...formattedOrder,
        vendor: {
          id: vendor.id,
          firstName: vendor.firstName,
          lastName: vendor.lastName,
          email: vendor.email,
          shopName: vendor.shop_name,
          role: vendor.role
        },
        // 🛡️ Commission correcte basée sur le bénéfice
        commission_info: commissionInfo
      };
    });
  }

  async getOrderById(id: number, userId?: number) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const order = await this.prisma.order.findUnique({
      where,
      include: {
        orderItems: {
          include: {
            product: true,
            stickerProduct: { // 🆕 Inclure le sticker
              include: {
                vendor: {
                  select: {
                    id: true,
                    shop_name: true,
                  }
                },
                design: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                  }
                }
              }
            },
            colorVariation: true,
            // 🎨 Inclure les données de personnalisation client
            customization: {
              select: {
                id: true,
                designElements: true,
                elementsByView: true,
                previewImageUrl: true,
                colorVariationId: true,
                viewId: true,
                sizeSelections: true,
                status: true,
                createdAt: true,
                updatedAt: true
              }
            }
          },
        },
        user: true,
        validator: true,
        // 🆕 Inclure TOUTES les tentatives de paiement pour la vue détaillée
        paymentAttemptsHistory: {
          orderBy: {
            attemptedAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID ${id} not found`);
    }

    return this.formatOrderResponse(order);
  }

  async getOrderByNumber(orderNumber: string) {
    const order = await this.prisma.order.findFirst({
      where: { orderNumber },
      include: {
        orderItems: {
          include: {
            product: true,
            stickerProduct: {
              include: {
                vendor: {
                  select: {
                    id: true,
                    shop_name: true,
                  }
                },
                design: {
                  select: {
                    id: true,
                    name: true,
                    imageUrl: true,
                  }
                }
              }
            },
            colorVariation: true,
            customization: {
              select: {
                id: true,
                designElements: true,
                elementsByView: true,
                previewImageUrl: true,
                colorVariationId: true,
                viewId: true,
                sizeSelections: true,
                status: true,
                createdAt: true,
                updatedAt: true
              }
            }
          },
        },
        user: true,
        validator: true,
        paymentAttemptsHistory: {
          orderBy: {
            attemptedAt: 'desc',
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Commande ${orderNumber} non trouvée`);
    }

    return this.formatOrderResponse(order);
  }

  public formatOrderResponse(order: any) {
    // Recalculer les valeurs de commission et vendorAmount avec la nouvelle logique
    let calculatedVendorAmount = order.vendorAmount;
    let calculatedCommissionAmount = order.commissionAmount;

    // Recalculer seulement si la commande est payée et a des items
    if (order.paymentStatus === 'PAID' && order.orderItems && order.orderItems.length > 0) {
      let totalCommissionBase = 0; // Base sur laquelle on calcule la commission
      let totalDesignsRevenue = 0; // Revenus des designs de vendeur

      // Calculer la base de commission pour chaque item
      for (const item of order.orderItems) {
        const isCustomizedProduct = !!(item.customization || item.customizationId || item.customizationIds);

        if (isCustomizedProduct) {
          // 🎨 PRODUIT CUSTOMISÉ : Commission uniquement sur les designs de vendeur utilisés
          let itemDesignsTotal = 0;

          // Extraire les designs depuis designElementsByView
          if (item.designElementsByView) {
            for (const viewKey in item.designElementsByView) {
              const elements = item.designElementsByView[viewKey];
              if (Array.isArray(elements)) {
                for (const element of elements) {
                  if (element.type === 'image' && element.designPrice) {
                    itemDesignsTotal += element.designPrice;
                  }
                }
              }
            }
          }

          // Ou depuis customization.designElements
          if (itemDesignsTotal === 0 && item.customization?.designElements) {
            for (const element of item.customization.designElements) {
              if (element.type === 'image' && element.designPrice) {
                itemDesignsTotal += element.designPrice;
              }
            }
          }

          totalDesignsRevenue += itemDesignsTotal;
          totalCommissionBase += itemDesignsTotal;

          this.logger.debug(`📊 Item ${item.id} (customisé): Designs = ${itemDesignsTotal} XOF`);
        } else {
          // 🏪 PRODUIT VENDEUR : Commission sur le bénéfice (prix vente - prix base)
          const productCost = item.product?.price || 0;
          const sellingPrice = item.unitPrice || 0;
          const quantity = item.quantity || 1;
          const itemProfit = (sellingPrice - productCost) * quantity;
          totalCommissionBase += itemProfit;

          this.logger.debug(`📊 Item ${item.id} (vendeur): Profit = ${itemProfit} XOF`);
        }
      }

      // Recalculer la commission sur la base appropriée
      const commissionRate = (order.commissionRate || 59) / 100;
      calculatedCommissionAmount = totalCommissionBase * commissionRate;
      calculatedVendorAmount = totalCommissionBase - calculatedCommissionAmount;

      this.logger.log(`💰 Commande ${order.id}: Base commission = ${totalCommissionBase}, Commission admin = ${calculatedCommissionAmount}, Revenus vendeur/designer = ${calculatedVendorAmount}`);
    }

    // Calculer le bénéfice total de la commande (sans déduire la commission)
    let beneficeCommande = 0;
    if (order.orderItems && order.orderItems.length > 0) {
      for (const item of order.orderItems) {
        const isCustomizedProduct = !!(item.customization || item.customizationId || item.customizationIds);

        if (isCustomizedProduct) {
          // Pour produits customisés : bénéfice = prix total des designs
          let itemDesignsTotal = 0;

          if (item.designElementsByView) {
            for (const viewKey in item.designElementsByView) {
              const elements = item.designElementsByView[viewKey];
              if (Array.isArray(elements)) {
                for (const element of elements) {
                  if (element.type === 'image' && element.designPrice) {
                    itemDesignsTotal += element.designPrice;
                  }
                }
              }
            }
          }

          if (itemDesignsTotal === 0 && item.customization?.designElements) {
            for (const element of item.customization.designElements) {
              if (element.type === 'image' && element.designPrice) {
                itemDesignsTotal += element.designPrice;
              }
            }
          }

          beneficeCommande += itemDesignsTotal;
        } else {
          // Pour produits vendeur : bénéfice = prix vente - prix base
          const productCost = item.product?.price || 0;
          const sellingPrice = item.unitPrice || 0;
          const quantity = item.quantity || 1;
          const itemProfit = (sellingPrice - productCost) * quantity;
          beneficeCommande += itemProfit;
        }
      }
    }

    const baseOrder = {
      ...order,
      // Ajouter le bénéfice de la commande
      beneficeCommande: beneficeCommande,
      // Utiliser les valeurs recalculées
      vendorAmount: calculatedVendorAmount,
      commissionAmount: calculatedCommissionAmount,
      orderItems: order.orderItems.map((item: any) => {
        // 🎯 DÉTERMINER LE TYPE D'ITEM
        const isSticker = !!item.stickerId;

        console.log('🎨 Données de couleur récupérées:', {
          itemColorId: item.colorId,
          itemColor: item.color,
          colorFromJoin: item.colorVariation,
          isSticker: isSticker,
          stickerId: item.stickerId
        });

        // 🎯 STRUCTURE DE BASE COMMUNE
        const baseItem = {
          ...item,
          // 🆕 Prix et quantité
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice || (item.unitPrice * item.quantity), // 🆕 Prix total = unitPrice * quantity
          colorId: item.colorId,
          color: item.color,
        };

        // ✅ POUR LES STICKERS
        if (isSticker) {
          return {
            ...baseItem,
            // Type d'item
            itemType: 'STICKER',
            // Informations du sticker
            stickerProduct: item.stickerProduct ? {
              id: item.stickerProduct.id,
              name: item.stickerProduct.name,
              imageUrl: item.stickerProduct.imageUrl,
              finalPrice: item.stickerProduct.finalPrice,
              minQuantity: item.stickerProduct.minQuantity,
              maxQuantity: item.stickerProduct.maxQuantity,
              shape: item.stickerProduct.shape,
              finish: item.stickerProduct.finish,
            } : null,
            // Design associé (si chargé)
            design: item.stickerProduct?.design ? {
              id: item.stickerProduct.design.id,
              name: item.stickerProduct.design.name,
              imageUrl: item.stickerProduct.design.imageUrl,
            } : null,
            // Vendeur
            vendor: item.stickerProduct?.vendor ? {
              id: item.stickerProduct.vendor.id,
              shopName: item.stickerProduct.vendor.shop_name,
            } : null,
          };
        }

        // ✅ POUR LES PRODUITS NORMAUX
        return {
          ...baseItem,
          itemType: 'PRODUCT',
          product: {
            ...item.product,
            orderedColorName: item.colorVariation?.name || null,
            orderedColorHexCode: item.colorVariation?.colorCode || null,
            orderedColorImageUrl: item.colorVariation?.images?.[0]?.url || null,
          },

          // 🎨 Inclure les données de personnalisation si présentes
          customization: item.customization ? {
            id: item.customization.id,
            designElements: item.customization.designElements,
            elementsByView: item.customization.elementsByView,
            previewImageUrl: item.customization.previewImageUrl,
            colorVariationId: item.customization.colorVariationId,
            viewId: item.customization.viewId,
            sizeSelections: item.customization.sizeSelections,
            status: item.customization.status,
            createdAt: item.customization.createdAt,
            updatedAt: item.customization.updatedAt,
            // 🎨 Indicateur de produit personnalisé
            isCustomized: true,
            hasDesignElements: Array.isArray(item.customization.designElements) && item.customization.designElements.length > 0,
            hasMultiViewDesign: item.customization.elementsByView && Object.keys(item.customization.elementsByView).length > 0
          } : null,

          // 🎨 Indicateur rapide de personnalisation
          isCustomizedProduct: !!item.customization || !!item.customizationId || !!item.customizationIds,

          // 🏪 Ajouter les informations du vendeur si le produit n'est pas personnalisé
          ...(!!item.customization || !!item.customizationId || !!item.customizationIds ? {} : {
            vendorInfo: item.vendorProduct?.vendor ? {
              id: item.vendorProduct.vendor.id,
              firstName: item.vendorProduct.vendor.firstName,
              lastName: item.vendorProduct.vendor.lastName,
              shopName: item.vendorProduct.vendor.shop_name,
              profilePhotoUrl: item.vendorProduct.vendor.profile_photo_url,
              email: `${item.vendorProduct.vendor.firstName}.${item.vendorProduct.vendor.lastName}@example.com`,
              phone: '+221' + '00000000', // Format placeholder
              address: item.vendorProduct.vendor.address || null,
              country: item.vendorProduct.vendor.country || null,
              vendorType: item.vendorProduct.vendor.vendeur_type || 'ARTISTE',
              status: item.vendorProduct.vendor.status ? 'ACTIVE' : 'INACTIVE',
              createdAt: item.vendorProduct.vendor.created_at,
              lastLogin: item.vendorProduct.vendor.last_login_at,
              shopDescription: `Boutique ${item.vendorProduct.vendor.shop_name} - Spécialisé dans les produits personnalisés`,
              specialties: ['Personnalisation', 'Design personnalisé', 'Impression qualité'],
              responseTime: 'Quelques heures',
              rating: 4.5,
              totalSales: item.vendorProduct.salesCount || 0,
              totalRevenue: item.vendorProduct.totalRevenue || 0
            } : null
          }),

          // 🎨 MULTI-VUES: Métadonnées des vues avec imageUrl (IMPORTANT pour le frontend)
          viewsMetadata: item.viewsMetadata || null,
          designElementsByView: item.designElementsByView || null,
          customizationIds: item.customizationIds || null
        };
      })
    };

    // 🆕 Ajouter les informations de paiement enrichies
    const paymentInfo: any = {
      status: order.paymentStatus,
      status_text: this.getPaymentStatusText(order.paymentStatus),
      status_icon: this.getPaymentStatusIcon(order.paymentStatus),
      status_color: this.getPaymentStatusColor(order.paymentStatus),
      method: order.paymentMethod,
      method_text: this.getPaymentMethodText(order.paymentMethod),
      transaction_id: order.transactionId,
      attempts_count: order.paymentAttempts || 0,
      last_attempt_at: order.lastPaymentAttemptAt,
    };

    // 🆕 Ajouter détails sur les fonds insuffisants si applicable
    if (order.hasInsufficientFunds) {
      paymentInfo.insufficient_funds = {
        detected: true,
        last_failure_reason: order.lastPaymentFailureReason,
        message: '💰 Paiement échoué - Fonds insuffisants',
        user_message: '❌ Fonds insuffisants. Veuillez vérifier votre solde ou utiliser une autre méthode de paiement.',
        can_retry: true,
        retry_available: true,
      };
    }

    // 🆕 Inclure historique des tentatives si disponible
    if (order.paymentAttemptsHistory && order.paymentAttemptsHistory.length > 0) {
      paymentInfo.recent_attempts = order.paymentAttemptsHistory.slice(0, 3).map((attempt: any) => ({
        attempt_number: attempt.attemptNumber,
        status: attempt.status,
        attempted_at: attempt.attemptedAt,
        failure_reason: attempt.failureReason,
        failure_category: attempt.failureCategory,
        payment_method: attempt.paymentMethod,
      }));
    }

    // 🆕 Informations complètes du client pour l'admin
    const customerInfo: any = {
      // Informations utilisateur si disponible
      user_id: order.userId || null,
      user_firstname: order.user?.firstName || null,
      user_lastname: order.user?.lastName || null,
      user_email: order.user?.email || null,
      user_phone: order.user?.phone || null,
      user_role: order.user?.role || null,

      // Informations de livraison de la commande
      shipping_name: order.shippingName || null,
      shipping_email: order.email || null,
      shipping_phone: order.phoneNumber || null,

      // Informations de contact principales
      email: order.email || order.user?.email || null,
      phone: order.phoneNumber || order.user?.phone || null,

      // Nom complet pour affichage
      full_name: order.shippingName ||
        (order.user ? `${order.user.firstName} ${order.user.lastName}`.trim() : 'Client inconnu'),

      // Détails de livraison
      shipping_address: order.shippingDetails ? {
        address: order.shippingDetails.address || null,
        city: order.shippingDetails.city || null,
        postal_code: order.shippingDetails?.postalCode || null,
        country: order.shippingDetails.country || null,
        additional_info: order.shippingDetails.additionalInfo || null,
      } : null,

      // Notes client
      notes: order.notes || null,

      // Dates importantes
      created_at: order.createdAt || null,
      updated_at: order.updatedAt || null,
    };

    // 🚚 INFORMATIONS DE LIVRAISON
    const deliveryInfo = DeliveryEnricherHelper.buildDeliveryInfoFromOrder(order);

    return {
      ...baseOrder,
      // 🆕 Inclure les champs de paiement directement pour le frontend
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      transactionId: order.transactionId,
      paymentAttempts: order.paymentAttempts || 0,
      lastPaymentAttemptAt: order.lastPaymentAttemptAt,
      lastPaymentFailureReason: order.lastPaymentFailureReason,
      hasInsufficientFunds: order.hasInsufficientFunds || false,
      // 🚚 Informations de livraison enrichies
      deliveryInfo: deliveryInfo,
      deliveryFee: order.deliveryFee || 0,

      // 🆕 Garder payment_info pour compatibilité
      payment_info: paymentInfo,

      // 🆕 Informations complètes du client pour l'admin
      customer_info: customerInfo,
    };
  }

  async updateOrderStatus(id: number, updateData: any, validatedBy?: number) {
    try {
      const previousOrder = await this.prisma.order.findUnique({
        where: { id },
        select: { status: true }
      });

      const order = await this.prisma.order.update({
        where: { id },
        data: {
          status: updateData.status,
          notes: updateData.notes,
          validatedBy: validatedBy || null,
          validatedAt: updateData.status === OrderStatus.CONFIRMED ? new Date() : null,
        },
        include: {
          orderItems: {
            include: {
              product: true,
              stickerProduct: { // 🆕 Inclure le sticker
                include: {
                  vendor: {
                    select: {
                      id: true,
                      shop_name: true,
                    }
                  },
                  design: {
                    select: {
                      id: true,
                      name: true,
                      imageUrl: true,
                    }
                  }
                }
              },
              colorVariation: true,
            },
          },
          user: true,
          validator: true,
        },
      });

      // ✅ MISE À JOUR AUTOMATIQUE DES STATISTIQUES - Commande confirmée
      if (updateData.status === OrderStatus.CONFIRMED && previousOrder?.status !== OrderStatus.CONFIRMED) {
        this.logger.log(`✅ Commande ${id} marquée comme confirmée, mise à jour des statistiques de vente`);

        try {
          await this.salesStatsUpdaterService.updateSalesStatsOnConfirmation(id);
          this.logger.log(`📊 Statistiques de vente mises à jour pour commande confirmée ${id}`);
        } catch (error) {
          this.logger.error(`❌ Erreur mise à jour statistiques confirmation commande ${id}:`, error);
          // Ne pas faire échouer la mise à jour du statut pour cette erreur
        }
      }

      // 🆕 MISE À JOUR AUTOMATIQUE DES STATISTIQUES - Commande livrée
      if (updateData.status === OrderStatus.DELIVERED && previousOrder?.status !== OrderStatus.DELIVERED) {
        this.logger.log(`🚚 Commande ${id} marquée comme livrée, mise à jour des statistiques de vente`);

        try {
          await this.salesStatsUpdaterService.updateSalesStatsOnDelivery(id);
          this.logger.log(`📊 Statistiques de vente mises à jour pour commande livrée ${id}`);
        } catch (error) {
          this.logger.error(`❌ Erreur mise à jour statistiques livraison commande ${id}:`, error);
          // Ne pas faire échouer la mise à jour du statut pour cette erreur
        }

        // 🎯 METTRE À JOUR LE STATUT DES DESIGN USAGES À READY_FOR_PAYOUT
        try {
          const updatedCount = await DesignUsageTracker.updatePaymentStatus(
            this.prisma,
            id,
            'READY_FOR_PAYOUT'
          );
          this.logger.log(`✅ [Design Revenue] ${updatedCount} design usage(s) prêt(s) pour paiement pour commande ${id}`);
        } catch (error) {
          this.logger.error(`❌ [Design Revenue] Erreur mise à jour design usages:`, error);
          // Ne pas faire échouer la mise à jour de commande
        }
      }

      return this.formatOrderResponse(order);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw new BadRequestException(`Error updating order status: ${error.message}`);
    }
  }

  async cancelOrder(id: number, userId?: number) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    try {
      const order = await this.prisma.order.update({
        where,
        data: {
          status: OrderStatus.CANCELLED,
      },
      include: {
        orderItems: {
          include: {
              product: true,
            },
          },
          user: true,
        },
      });

      // 🎯 METTRE À JOUR LE STATUT DES DESIGN USAGES À CANCELLED
      try {
        const updatedCount = await DesignUsageTracker.updatePaymentStatus(
          this.prisma,
          id,
          'CANCELLED'
        );
        this.logger.log(`✅ [Design Revenue] ${updatedCount} design usage(s) annulé(s) pour commande ${id}`);
      } catch (error) {
        this.logger.error(`❌ [Design Revenue] Erreur annulation design usages:`, error);
        // Ne pas faire échouer l'annulation de commande
      }

      return order;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw new BadRequestException(`Error cancelling order: ${error.message}`);
    }
  }

  async getStatistics() {
    const [totalOrders, pendingOrders, confirmedOrders, shippedOrders, cancelledOrders] = await Promise.all([
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: OrderStatus.PENDING } }),
      this.prisma.order.count({ where: { status: OrderStatus.CONFIRMED } }),
      this.prisma.order.count({ where: { status: OrderStatus.SHIPPED } }),
      this.prisma.order.count({ where: { status: OrderStatus.CANCELLED } }),
    ]);

    const totalRevenue = await this.prisma.order.aggregate({
      where: { status: { in: [OrderStatus.CONFIRMED, OrderStatus.SHIPPED, OrderStatus.DELIVERED] } },
      _sum: { totalAmount: true },
    });

    return {
      totalOrders,
      pendingOrders,
      confirmedOrders,
      shippedOrders,
      cancelledOrders,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
    };
  }

  async getFrontendStatistics() {
    const recentOrders = await this.prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        orderItems: true,
      },
    });

    const stats = await this.getStatistics();
    
    return {
      ...stats,
      recentOrders,
    };
  }

  async create(createOrderDto: CreateOrderDto) {
    return this.createOrder(1, createOrderDto);
  }

  async findAll() {
    const result = await this.getAllOrders();
    return result.orders;
  }

  async findOne(id: number) {
    return this.getOrderById(id);
  }

  async update(id: number, updateOrderDto: any) {
    return this.updateOrderStatus(id, updateOrderDto);
  }

  async remove(id: number) {
    try {
      await this.prisma.order.delete({
        where: { id },
      });
      return { message: `Order with ID ${id} has been deleted` };
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Order with ID ${id} not found`);
      }
      throw new BadRequestException(`Error deleting order: ${error.message}`);
    }
  }

  async findByUser(userId: number) {
    return this.getUserOrders(userId);
        }

  async updateStatus(id: number, status: OrderStatus, validatedBy?: number) {
    return this.updateOrderStatus(id, { status }, validatedBy);
  }

  /**
   * Retry payment for a failed order
   * This method allows customers to retry payment after a failed attempt
   * Particularly useful for insufficient funds scenarios
   *
   * @param orderNumber Order number to retry payment for
   * @param paymentMethod Optional new payment method
   * @returns Payment data with new token and redirect URL
   */
  async retryPayment(orderNumber: string, paymentMethod?: string) {
    try {
      this.logger.log(`💳 Retry payment requested for order: ${orderNumber}`);

      // Find the order
      const order = await this.prisma.order.findFirst({
        where: { orderNumber },
        include: { user: true }
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderNumber} not found`);
      }

      // Verify order is in a state that allows payment retry
      if (order.paymentStatus === 'PAID') {
        throw new BadRequestException('Order has already been paid');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw new BadRequestException('Cannot retry payment for cancelled order');
      }

      // Déterminer la méthode de paiement (PayDunya ou PayTech)
      const isPayDunya = order.paymentMethod === 'PAYDUNYA';
      this.logger.log(`💳 Initializing retry payment for order: ${orderNumber} (${isPayDunya ? 'PayDunya' : 'PayTech'})`);

      let paymentResponse: any;
      let redirectUrl: string;
      let token: string;

      if (isPayDunya) {
        // Incrémenter le compteur de tentatives
        const attemptNumber = order.paymentAttempts + 1;

        // Créer un nouveau paiement PayDunya
        const paydunyaPayload = {
          invoice: {
            total_amount: order.totalAmount,
            description: `Commande ${order.orderNumber} - Tentative ${attemptNumber}`,
            customer: {
              name: order.shippingName || order.user?.firstName || 'Client Printalma',
              email: order.email || order.user?.email,
              phone: order.phoneNumber || order.user?.phone
            }
          },
          store: {
            name: 'Printalma',
            website_url: this.configService.get('FRONTEND_URL', 'http://localhost:5174'),
          },
          actions: {
            callback_url: this.configService.get('PAYDUNYA_CALLBACK_URL'),
            return_url: this.configService.get('PAYDUNYA_SUCCESS_URL'),
            cancel_url: this.configService.get('PAYDUNYA_CANCEL_URL'),
          },
          custom_data: {
            order_number: order.orderNumber,
            order_id: order.id,
            user_id: order.userId,
            retry_attempt: true,
            attempt_number: attemptNumber,
            previous_failure: order.notes?.includes('INSUFFICIENT FUNDS') ? 'insufficient_funds' : 'unknown'
          }
        };

        paymentResponse = await this.paydunyaService.createInvoice(paydunyaPayload);
        token = paymentResponse.token;

        // 🔧 Récupérer le mode actif depuis la configuration de la base de données
        const paymentConfig = await this.prisma.paymentConfig.findFirst({
          where: {
            provider: 'PAYDUNYA',
            isActive: true
          }
        });

        // Utiliser le mode de la config BDD (priorité) ou fallback sur les variables d'environnement
        const mode = paymentConfig?.activeMode || this.configService.get('PAYDUNYA_MODE', 'test');
        const baseUrl = mode === 'live'
          ? 'https://paydunya.com/checkout/invoice'
          : 'https://app.paydunya.com/sandbox-checkout/invoice';
        redirectUrl = paymentResponse.response_url || `${baseUrl}/${token}`;

        this.logger.log(`🔄 PayDunya retry token created: ${token} (mode: ${mode})`);
      } else {
        // PayTech retry (code existant)
        paymentResponse = await this.paytechService.requestPayment({
          item_name: `Order ${order.orderNumber} (Retry)`,
          item_price: order.totalAmount,
          ref_command: order.orderNumber,
          command_name: `Printalma Order - ${order.orderNumber} (Retry Payment)`,
          currency: PayTechCurrency.XOF,
          env: (this.configService.get('PAYTECH_ENVIRONMENT') === 'test'
            ? PayTechEnvironment.TEST
            : PayTechEnvironment.PROD),
          ipn_url: this.configService.get('PAYTECH_IPN_URL'),
          success_url: this.configService.get('PAYTECH_SUCCESS_URL'),
          cancel_url: this.configService.get('PAYTECH_CANCEL_URL'),
          custom_field: JSON.stringify({
            orderId: order.id,
            userId: order.userId,
            retryAttempt: true,
            previousFailure: order.notes?.includes('INSUFFICIENT FUNDS') ? 'insufficient_funds' : 'unknown'
          }),
          ...(paymentMethod && { target_payment: paymentMethod })
        });

        token = paymentResponse.token;
        redirectUrl = paymentResponse.redirect_url || paymentResponse.redirectUrl;
      }

      // Mettre à jour la commande avec le nouveau token et incrémenter les tentatives
      const retryNote = `\n\n🔄 Payment retry initiated at ${new Date().toISOString()}\nNew token: ${token}\nAttempt: ${order.paymentAttempts + 1}`;
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          transactionId: token, // Mettre à jour avec le nouveau token
          paymentAttempts: { increment: 1 }, // Incrémenter les tentatives
          notes: order.notes ? order.notes + retryNote : retryNote
        }
      });

      this.logger.log(`✅ Retry payment initialized successfully: ${token}`);

      return {
        success: true,
        message: 'Payment retry initialized successfully',
        data: {
          order_id: order.id,
          order_number: order.orderNumber,
          amount: order.totalAmount,
          currency: 'XOF',
          payment_method: isPayDunya ? 'PAYDUNYA' : 'PAYTECH',
          payment: {
            token: token,
            redirect_url: redirectUrl,
            is_retry: true,
            attempt_number: order.paymentAttempts + 1
          }
        }
      };
    } catch (error) {
      this.logger.error(`❌ Failed to retry payment: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Get orders with insufficient funds failures for analytics
   * 🆕 Enhanced with hasInsufficientFunds flag
   */
  async getInsufficientFundsOrders(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          // 🆕 Use the new flag for faster queries
          hasInsufficientFunds: true
        },
        include: {
          orderItems: {
            include: {
              product: true,
              colorVariation: true,
            }
          },
          user: true,
          paymentAttemptsHistory: {
            orderBy: {
              attemptedAt: 'desc'
            },
            take: 5 // Show last 5 attempts
          }
        },
        orderBy: {
          lastPaymentAttemptAt: 'desc' // Most recent attempts first
        },
        skip,
        take: limit
      }),
      this.prisma.order.count({
        where: {
          hasInsufficientFunds: true
        }
      })
    ]);

    return {
      orders: orders.map(order => ({
        ...this.formatOrderResponse(order),
        payment_attempts_count: order.paymentAttempts,
        last_payment_attempt: order.lastPaymentAttemptAt,
        last_failure_reason: order.lastPaymentFailureReason,
        recent_attempts: order.paymentAttemptsHistory
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * 🆕 Get payment attempts history for an order
   * Shows all payment attempts with detailed information
   */
  async getPaymentAttempts(orderNumber: string) {
    try {
      const order = await this.prisma.order.findFirst({
        where: { orderNumber },
        include: {
          paymentAttemptsHistory: {
            orderBy: {
              attemptedAt: 'desc'
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!order) {
        throw new NotFoundException(`Order ${orderNumber} not found`);
      }

      return {
        success: true,
        message: 'Payment attempts retrieved successfully',
        data: {
          order_id: order.id,
          order_number: order.orderNumber,
          total_amount: order.totalAmount,
          payment_status: order.paymentStatus,
          total_attempts: order.paymentAttempts,
          has_insufficient_funds: order.hasInsufficientFunds,
          last_payment_attempt: order.lastPaymentAttemptAt,
          last_failure_reason: order.lastPaymentFailureReason,
          customer: order.user,
          attempts: order.paymentAttemptsHistory.map(attempt => ({
            id: attempt.id,
            attempt_number: attempt.attemptNumber,
            status: attempt.status,
            amount: attempt.amount,
            currency: attempt.currency,
            payment_method: attempt.paymentMethod,
            is_retry: attempt.isRetry,
            failure: attempt.failureCategory ? {
              category: attempt.failureCategory,
              reason: attempt.failureReason,
              code: attempt.failureCode,
              message: attempt.failureMessage,
              processor_response: attempt.processorResponse
            } : null,
            attempted_at: attempt.attemptedAt,
            completed_at: attempt.completedAt,
            failed_at: attempt.failedAt,
            paytech_token: attempt.paytechToken,
            paytech_transaction_id: attempt.paytechTransactionId
          }))
        }
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get payment attempts: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * 🆕 Notifier les vendeurs concernés par une nouvelle commande
   * Envoie une notification en base de données pour chaque vendeur
   */
  private async notifyVendorsOfNewOrder(orderId: number) {
    try {
      // Récupérer la commande avec tous les items et produits vendeurs
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              product: {
                select: { id: true, name: true }
              },
              vendorProduct: {
                include: {
                  vendor: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      shop_name: true,
                      email: true
                    }
                  }
                }
              }
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });

      if (!order) {
        this.logger.warn(`⚠️ Commande ${orderId} non trouvée pour notification`);
        return;
      }

      // Identifier tous les vendeurs uniques concernés par cette commande
      const vendorIds = new Set<number>();
      const vendorNames = new Map<number, string>();

      for (const item of order.orderItems) {
        if (item.vendorProduct && item.vendorProduct.vendor) {
          const vendor = item.vendorProduct.vendor;
          vendorIds.add(vendor.id);
          vendorNames.set(vendor.id, vendor.shop_name || `${vendor.firstName} ${vendor.lastName}`);
        }
      }

      if (vendorIds.size === 0) {
        this.logger.log(`ℹ️ Aucun vendeur trouvé pour la commande ${order.orderNumber}`);
        return;
      }

      this.logger.log(`🔔 Notification de ${vendorIds.size} vendeur(s) pour commande ${order.orderNumber}`);

      // Créer une notification pour chaque vendeur
      const notificationPromises = Array.from(vendorIds).map(async (vendorId) => {
        try {
          await this.prisma.notification.create({
            data: {
              userId: vendorId,
              type: 'ORDER_NEW', // ✅ Utiliser ORDER_NEW au lieu de NEW_ORDER
              title: '🛍️ Nouvelle commande reçue !',
              message: `Une nouvelle commande (${order.orderNumber}) contenant vos produits a été passée par ${order.shippingName}.`,
              metadata: {
                orderId: order.id,
                orderNumber: order.orderNumber,
                totalAmount: order.totalAmount,
                customerName: order.shippingName,
                customerPhone: order.phoneNumber,
                customerEmail: order.email,
                itemsCount: order.orderItems.length,
                createdAt: order.createdAt.toISOString()
              },
              isRead: false
            }
          });

          this.logger.log(`✅ Notification envoyée au vendeur ${vendorNames.get(vendorId)} (ID: ${vendorId})`);
        } catch (error) {
          this.logger.error(`❌ Erreur notification vendeur ${vendorId}:`, error);
        }
      });

      await Promise.all(notificationPromises);

      this.logger.log(`🎉 Notifications envoyées à tous les vendeurs pour commande ${order.orderNumber}`);

    } catch (error) {
      this.logger.error(`❌ Erreur lors de la notification des vendeurs:`, error);
      throw error;
    }
  }

  /**
   * 🆕 Get detailed information about a specific payment attempt
   * Admin only - includes complete IPN data for debugging
   */
  async getPaymentAttemptDetails(attemptId: number) {
    try {
      const attempt = await this.prisma.paymentAttempt.findUnique({
        where: { id: attemptId },
        include: {
          order: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  phone: true
                }
              }
            }
          }
        }
      });

      if (!attempt) {
        throw new NotFoundException(`Payment attempt ${attemptId} not found`);
      }

      return {
        success: true,
        message: 'Payment attempt details retrieved',
        data: {
          ...attempt,
          order: {
            id: attempt.order.id,
            order_number: attempt.order.orderNumber,
            total_amount: attempt.order.totalAmount,
            status: attempt.order.status,
            payment_status: attempt.order.paymentStatus,
            customer: attempt.order.user
          }
        }
      };
    } catch (error) {
      this.logger.error(`❌ Failed to get payment attempt details: ${error.message}`, error.stack);
      throw error;
    }
  }

// 🎨 Utilitaires pour l'affichage admin des statuts de paiement

  /**
   * Obtenir le texte lisible pour un statut de paiement
   */
  private getPaymentStatusText(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'En attente de paiement';
      case 'PAID':
        return 'Payé';
      case 'FAILED':
        return 'Échoué';
      case 'CANCELLED':
        return 'Annulé';
      case 'REFUNDED':
        return 'Remboursé';
      case 'PROCESSING':
        return 'En traitement';
      default:
        return status;
    }
  }

  /**
   * Obtenir l'icône pour un statut de paiement
   */
  private getPaymentStatusIcon(status: string): string {
    switch (status) {
      case 'PENDING':
        return '⏳';
      case 'PAID':
        return '✅';
      case 'FAILED':
        return '❌';
      case 'CANCELLED':
        return '🚫';
      case 'REFUNDED':
        return '💰';
      case 'PROCESSING':
        return '🔄';
      default:
        return '❓';
    }
  }

  /**
   * Obtenir la couleur pour un statut de paiement
   */
  private getPaymentStatusColor(status: string): string {
    switch (status) {
      case 'PENDING':
        return '#FFA500'; // Orange
      case 'PAID':
        return '#28A745'; // Vert
      case 'FAILED':
        return '#DC3545'; // Rouge
      case 'CANCELLED':
        return '#6C757D'; // Gris
      case 'REFUNDED':
        return '#17A2B8'; // Cyan
      case 'PROCESSING':
        return '#007BFF'; // Bleu
      default:
        return '#6C757D'; // Gris par défaut
    }
  }

  /**
   * Obtenir le texte lisible pour une méthode de paiement
   */
  private getPaymentMethodText(method: string): string {
    switch (method) {
      case 'PAYDUNYA':
        return 'PayDunya';
      case 'PAYTECH':
        return 'PayTech';
      case 'CASH_ON_DELIVERY':
        return 'Paiement à la livraison';
      case 'WAVE':
        return 'Wave';
      case 'ORANGE_MONEY':
        return 'Orange Money';
      case 'FREE_MONEY':
        return 'Free Money';
      case 'CARD':
        return 'Carte bancaire';
      case 'OTHER':
        return 'Autre';
      default:
        return method;
    }
  }

  // 📦 VALIDATION DU STOCK PAR TAILLE
  private async validateStockForOrderItems(orderItems: any[]): Promise<void> {
    // Grouper les quantités par productId + colorId + size
    const stockRequirements = new Map<string, { productId: number; colorId: number; sizeName: string; totalQuantity: number }>();

    for (const item of orderItems) {
      // 🎯 Skip les stickers (pas de gestion de stock traditionnelle)
      if (item.stickerId) {
        this.logger.debug(`📦 Skip validation stock pour sticker: stickerId=${item.stickerId}`);
        continue;
      }

      if (!item.size || !item.colorId) {
        // Si pas de taille ou colorId, skip la validation de stock
        this.logger.debug(`📦 Skip validation stock pour item sans taille/colorId: productId=${item.productId}`);
        continue;
      }

      const key = `${item.productId}-${item.colorId}-${item.size}`;
      const existing = stockRequirements.get(key);

      if (existing) {
        existing.totalQuantity += item.quantity;
      } else {
        stockRequirements.set(key, {
          productId: item.productId,
          colorId: item.colorId,
          sizeName: item.size,
          totalQuantity: item.quantity
        });
      }
    }

    // Vérifier le stock pour chaque combinaison
    for (const [key, requirement] of stockRequirements) {
      const productStock = await this.prisma.productStock.findUnique({
        where: {
          productId_colorId_sizeName: {
            productId: requirement.productId,
            colorId: requirement.colorId,
            sizeName: requirement.sizeName
          }
        }
      });

      // Si pas de stock trouvé, on récupère le nom du produit pour le message d'erreur
      if (!productStock) {
        this.logger.warn(`📦 Pas de stock configuré pour: productId=${requirement.productId}, colorId=${requirement.colorId}, taille=${requirement.sizeName}`);
        // On peut choisir de continuer ou de bloquer - ici on continue car le stock n'est peut-être pas géré
        continue;
      }

      if (productStock.stock < requirement.totalQuantity) {
        const product = await this.prisma.product.findUnique({
          where: { id: requirement.productId },
          select: { name: true }
        });

        throw new BadRequestException(
          `Stock insuffisant pour ${product?.name || `Produit ${requirement.productId}`} (taille: ${requirement.sizeName}). ` +
          `Disponible: ${productStock.stock}, Demandé: ${requirement.totalQuantity}`
        );
      }

      this.logger.debug(`📦 Stock OK: ${key} - Disponible: ${productStock.stock}, Demandé: ${requirement.totalQuantity}`);
    }

    this.logger.log(`✅ Validation du stock réussie pour ${stockRequirements.size} combinaison(s) produit/couleur/taille`);
  }

  // 📦 DÉCRÉMENTATION DU STOCK PAR TAILLE
  private async decrementStockForOrderItems(orderItems: any[]): Promise<void> {
    // Grouper les quantités par productId + colorId + size
    const stockDecrements = new Map<string, { productId: number; colorId: number; sizeName: string; totalQuantity: number }>();

    for (const item of orderItems) {
      // 🎯 Skip les stickers (pas de gestion de stock traditionnelle)
      if (item.stickerId) {
        continue;
      }

      if (!item.size || !item.colorId) {
        // Si pas de taille ou colorId, skip la décrémentation
        continue;
      }

      const key = `${item.productId}-${item.colorId}-${item.size}`;
      const existing = stockDecrements.get(key);

      if (existing) {
        existing.totalQuantity += item.quantity;
      } else {
        stockDecrements.set(key, {
          productId: item.productId,
          colorId: item.colorId,
          sizeName: item.size,
          totalQuantity: item.quantity
        });
      }
    }

    // Décrémenter le stock pour chaque combinaison
    for (const [key, decrement] of stockDecrements) {
      try {
        // Utiliser upsert pour créer le stock s'il n'existe pas
        const existingStock = await this.prisma.productStock.findUnique({
          where: {
            productId_colorId_sizeName: {
              productId: decrement.productId,
              colorId: decrement.colorId,
              sizeName: decrement.sizeName
            }
          }
        });

        if (existingStock) {
          // Stock existe, le décrémenter
          await this.prisma.productStock.update({
            where: {
              productId_colorId_sizeName: {
                productId: decrement.productId,
                colorId: decrement.colorId,
                sizeName: decrement.sizeName
              }
            },
            data: {
              stock: {
                decrement: decrement.totalQuantity
              }
            }
          });
        } else {
          // Stock n'existe pas, créer avec stock à 0 (commande possible car le produit ne nécessite pas de stock)
          this.logger.warn(`📦 Stock non trouvé pour ${key}, création automatique avec stock initial à 0`);
          await this.prisma.productStock.create({
            data: {
              productId: decrement.productId,
              colorId: decrement.colorId,
              sizeName: decrement.sizeName,
              stock: 0 - decrement.totalQuantity // Stock négatif pour indiquer la dette
            }
          });
        }

        // Créer un mouvement de stock pour traçabilité
        await this.prisma.stockMovement.create({
          data: {
            productId: decrement.productId,
            colorId: decrement.colorId,
            sizeName: decrement.sizeName,
            type: 'OUT',
            quantity: decrement.totalQuantity,
            reason: 'Commande client'
          }
        });

        this.logger.debug(`📦 Stock décrémenté: ${key} - Quantité: ${decrement.totalQuantity}`);
      } catch (error) {
        this.logger.warn(`📦 Impossible de décrémenter stock pour: ${key} - ${error.message}`);
        // Continue avec les autres items
      }
    }

    this.logger.log(`📦 Décrémentation terminée pour ${stockDecrements.size} combinaison(s) produit/couleur/taille`);
  }

  // 📦 RESTAURATION DU STOCK (en cas d'annulation)
  async restoreStockForOrder(orderId: number): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true }
    });

    if (!order) {
      throw new NotFoundException(`Commande ${orderId} non trouvée`);
    }

    for (const item of order.orderItems) {
      if (!item.size || !item.colorId) {
        continue;
      }

      try {
        await this.prisma.productStock.update({
          where: {
            productId_colorId_sizeName: {
              productId: item.productId,
              colorId: item.colorId,
              sizeName: item.size
            }
          },
          data: {
            stock: {
              increment: item.quantity
            }
          }
        });

        // Créer un mouvement de stock pour traçabilité
        await this.prisma.stockMovement.create({
          data: {
            productId: item.productId,
            colorId: item.colorId,
            sizeName: item.size,
            type: 'IN',
            quantity: item.quantity,
            reason: `Annulation commande ${order.orderNumber}`
          }
        });

        this.logger.debug(`📦 Stock restauré: productId=${item.productId}, colorId=${item.colorId}, taille=${item.size}, quantité=${item.quantity}`);
      } catch (error) {
        this.logger.warn(`📦 Impossible de restaurer stock pour item ${item.id}: ${error.message}`);
      }
    }

    this.logger.log(`📦 Stock restauré pour commande ${order.orderNumber}`);
  }

  /**
   * ✅ VALIDATION DES ITEMS DE COMMANDE STICKERS
   * Valide les quantités min/max, le statut et le prix pour chaque item sticker
   */
  private async validateStickerOrderItems(orderItems: any[]): Promise<any[]> {
    const validatedItems: any[] = [];

    for (const item of orderItems) {
      // 🔍 DÉTECTION AUTOMATIQUE: Si productId pointe vers un sticker, corriger
      let itemToValidate = { ...item };

      if (item.productId && !item.stickerId) {
        // Vérifier si ce productId est en fait un sticker
        const possibleSticker = await this.prisma.stickerProduct.findUnique({
          where: { id: item.productId },
          select: { id: true }
        });

        if (possibleSticker) {
          this.logger.warn(
            `⚠️ ProductId ${item.productId} détecté comme sticker - correction automatique`
          );
          itemToValidate.stickerId = item.productId;
          delete itemToValidate.productId;
        }
      }

      // Si c'est un sticker
      if (itemToValidate.stickerId) {
        const sticker = await this.prisma.stickerProduct.findUnique({
          where: { id: itemToValidate.stickerId },
          select: {
            id: true,
            finalPrice: true,
            minQuantity: true,
            maxQuantity: true,
            status: true,
            name: true,
          }
        });

        if (!sticker) {
          throw new NotFoundException(`Sticker ${item.stickerId} introuvable`);
        }

        // Vérifier le statut (PUBLISHED ou DRAFT validé)
        if (sticker.status !== 'PUBLISHED') {
          throw new BadRequestException(
            `Le sticker "${sticker.name}" n'est pas disponible à la vente`
          );
        }

        // ✅ Valider les quantités min/max
        if (item.quantity < sticker.minQuantity) {
          throw new BadRequestException(
            `La quantité minimale pour "${sticker.name}" est de ${sticker.minQuantity} autocollant(s)`
          );
        }

        if (item.quantity > sticker.maxQuantity) {
          throw new BadRequestException(
            `La quantité maximale pour "${sticker.name}" est de ${sticker.maxQuantity} autocollants`
          );
        }

        // Vérifier et corriger le prix si nécessaire
        if (itemToValidate.unitPrice !== sticker.finalPrice) {
          this.logger.warn(
            `⚠️ Prix unitaire incorrect pour sticker ${itemToValidate.stickerId}: ` +
            `reçu ${itemToValidate.unitPrice}, attendu ${sticker.finalPrice}`
          );
          // Utiliser le prix de la base de données
          itemToValidate.unitPrice = sticker.finalPrice;
        }

        this.logger.log(`✅ Sticker validé: ${sticker.name} (qty: ${itemToValidate.quantity}, prix: ${itemToValidate.unitPrice})`);

        // ✅ IMPORTANT: Supprimer productId pour les stickers (éviter l'erreur de FK)
        const { productId, vendorProductId, ...stickerItem } = itemToValidate;
        validatedItems.push(stickerItem);
      } else {
        // Ce n'est pas un sticker, garder l'item tel quel
        validatedItems.push(itemToValidate);
      }
    }

    return validatedItems;
  }

  /**
   * 🎨 Générer automatiquement les mockups pour les items de commande personnalisés
   * Cette méthode parcourt tous les items et génère une image finale
   * pour ceux qui ont des éléments de personnalisation (designElementsByView)
   *
   * @param orderItems - Items de commande à traiter
   */
  private async generateMockupsForOrderItems(orderItems: any[]): Promise<void> {
    this.logger.log(`\n🎨 ====== GÉNÉRATION AUTOMATIQUE DES MOCKUPS ======`);
    this.logger.log(`📦 Traitement de ${orderItems.length} item(s) de commande`);

    for (let i = 0; i < orderItems.length; i++) {
      const item = orderItems[i];

      // Ignorer les items sans personnalisation ou qui ont déjà un mockup
      if (!item.designElementsByView || item.mockupUrl) {
        this.logger.log(`⏭️  Item ${i + 1}: Pas de personnalisation ou mockup déjà présent`);
        continue;
      }

      this.logger.log(`\n🎨 [Item ${i + 1}/${orderItems.length}] Génération du mockup pour productId ${item.productId || 'N/A'}, vendorProductId ${item.vendorProductId || 'N/A'}`);

      try {
        // 1. Déterminer l'URL de l'image du produit
        let productImageUrl: string | null = null;

        // Cas 1: Produit vendeur - utiliser finalImageUrl
        if (item.vendorProductId) {
          this.logger.log(`  🔍 Recherche de l'image du produit vendeur ${item.vendorProductId}...`);

          const vendorProduct = await this.prisma.vendorProduct.findUnique({
            where: { id: item.vendorProductId },
            select: { finalImageUrl: true }
          });

          if (vendorProduct?.finalImageUrl) {
            productImageUrl = vendorProduct.finalImageUrl;
            this.logger.log(`  ✅ Image produit vendeur trouvée: ${productImageUrl}`);
          }
        }

        // Cas 2: Produit normal - utiliser l'image de la variation de couleur
        if (!productImageUrl && item.productId && item.colorId) {
          this.logger.log(`  🔍 Recherche de l'image du produit ${item.productId}, couleur ${item.colorId}...`);

          const colorVariation = await this.prisma.colorVariation.findFirst({
            where: {
              id: item.colorId,
              productId: item.productId
            },
            include: {
              images: {
                orderBy: { id: 'asc' },
                take: 1
              }
            }
          });

          if (colorVariation?.images?.[0]?.url) {
            productImageUrl = colorVariation.images[0].url;
            this.logger.log(`  ✅ Image produit normal trouvée: ${productImageUrl}`);
          }
        }

        // Cas 3: Utiliser colorVariationData si disponible
        if (!productImageUrl && item.colorVariationData?.images?.[0]?.url) {
          productImageUrl = item.colorVariationData.images[0].url;
          this.logger.log(`  ✅ Image trouvée dans colorVariationData: ${productImageUrl}`);
        }

        if (!productImageUrl) {
          this.logger.warn(`  ⚠️  Impossible de trouver l'image du produit pour cet item - mockup non généré`);
          continue;
        }

        // 2. Extraire les éléments de design de la première vue
        const viewKeys = Object.keys(item.designElementsByView);
        if (viewKeys.length === 0) {
          this.logger.warn(`  ⚠️  Aucune vue trouvée dans designElementsByView - mockup non généré`);
          continue;
        }

        const firstViewKey = viewKeys[0];
        const elements = item.designElementsByView[firstViewKey];

        if (!Array.isArray(elements) || elements.length === 0) {
          this.logger.warn(`  ⚠️  Aucun élément de design dans la vue ${firstViewKey} - mockup non généré`);
          continue;
        }

        this.logger.log(`  🎨 ${elements.length} élément(s) de design trouvé(s) dans la vue ${firstViewKey}`);

        // 3. Récupérer la délimitation (zone imprimable)
        let delimitation = null;

        if (item.delimitations && Array.isArray(item.delimitations) && item.delimitations.length > 0) {
          delimitation = item.delimitations[0];
        } else if (item.delimitation) {
          delimitation = item.delimitation;
        }

        if (delimitation) {
          this.logger.log(`  📐 Délimitation trouvée: ${delimitation.width}x${delimitation.height}px à (${delimitation.x}, ${delimitation.y})`);
        } else {
          this.logger.warn(`  ⚠️  Aucune délimitation trouvée - génération sans zone imprimable définie`);
        }

        // 4. Générer le mockup
        this.logger.log(`  🎨 Appel du générateur de mockup...`);

        const mockupUrl = await this.mockupGenerator.generateOrderMockup({
          productImageUrl,
          elements,
          delimitation: delimitation ? {
            x: delimitation.x,
            y: delimitation.y,
            width: delimitation.width,
            height: delimitation.height
          } : undefined
        });

        // 5. Stocker l'URL du mockup dans l'item
        item.mockupUrl = mockupUrl;

        this.logger.log(`  ✅ Mockup généré et stocké: ${mockupUrl}`);

      } catch (error) {
        this.logger.error(`  ❌ Erreur lors de la génération du mockup pour l'item ${i + 1}:`, error.message);
        this.logger.error(`     Stack:`, error.stack);
        // Continuer même si la génération échoue pour cet item
      }
    }

    this.logger.log(`\n✅ ====== FIN DE LA GÉNÉRATION DES MOCKUPS ======\n`);
  }

} 