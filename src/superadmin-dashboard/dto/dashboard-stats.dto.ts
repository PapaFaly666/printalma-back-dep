export class SuperadminDashboardDto {
  // Informations temporelles
  currentMonth: string; // Format: "December 2025"
  currentMonthNumber: number; // 1-12
  currentYear: number;

  // Statistiques financières
  financialStats: {
    totalPlatformRevenue: number; // Total des commissions générées
    thisMonthPlatformRevenue: number; // Commissions du mois en cours
    totalVendorEarnings: number; // Total versé aux vendeurs
    thisMonthVendorEarnings: number; // Versé aux vendeurs ce mois
    pendingPayouts: number; // Montants en attente de paiement
    availableForPayout: number; // Montants disponibles pour paiement
    averageCommissionRate: number; // Taux de commission moyen
    totalAdminGains: number; // Gains totaux de l'admin (toutes commissions)
  };

  // Statistiques vendeurs
  vendorStats: {
    totalVendors: number; // Nombre total de vendeurs
    activeVendors: number; // Vendeurs actifs
    inactiveVendors: number; // Vendeurs inactifs
    suspendedVendors: number; // Vendeurs suspendus
    vendorsByType: {
      designers: number;
      influencers: number;
      artists: number;
    };
    newVendorsThisMonth: number; // Nouveaux vendeurs ce mois
  };

  // Meilleurs vendeurs
  topVendors: {
    byRevenue: TopVendorDto[]; // Top 10 par revenus
    bySales: TopVendorDto[]; // Top 10 par nombre de ventes
    byProducts: TopVendorDto[]; // Top 10 par nombre de produits
  };

  // Statistiques produits
  productStats: {
    totalProducts: number; // Total produits vendeurs
    publishedProducts: number; // Produits publiés
    pendingProducts: number; // Produits en attente de validation
    draftProducts: number; // Produits en brouillon
    rejectedProducts: number; // Produits rejetés
    productsAwaitingValidation: PendingProductDto[]; // Liste détaillée des produits en attente
  };

  // Statistiques designs
  designStats: {
    totalDesigns: number; // Total designs
    publishedDesigns: number; // Designs publiés
    pendingDesigns: number; // Designs en attente de validation
    draftDesigns: number; // Designs en brouillon
    validatedDesigns: number; // Designs validés
    designsAwaitingValidation: PendingDesignDto[]; // Liste détaillée des designs en attente
    totalDesignUsage: number; // Nombre total d'utilisations de designs
    thisMonthDesignUsage: number; // Utilisations ce mois
  };

  // Statistiques commandes
  orderStats: {
    totalOrders: number; // Total commandes
    thisMonthOrders: number; // Commandes ce mois
    pendingOrders: number; // Commandes en attente
    confirmedOrders: number; // Commandes confirmées
    processingOrders: number; // Commandes en traitement
    shippedOrders: number; // Commandes expédiées
    deliveredOrders: number; // Commandes livrées
    cancelledOrders: number; // Commandes annulées
    averageOrderValue: number; // Valeur moyenne d'une commande
    thisMonthRevenue: number; // Chiffre d'affaires ce mois
  };

  // Demandes de fonds en attente
  pendingFundRequests: {
    count: number; // Nombre de demandes en attente
    totalAmount: number; // Montant total demandé
    requests: PendingFundRequestDto[]; // Liste détaillée
  };
}

export class TopVendorDto {
  vendorId: number;
  vendorName: string;
  shopName: string;
  email: string;
  vendorType: string;
  totalRevenue?: number;
  totalSales?: number;
  totalProducts?: number;
  commissionRate: number;
  profileImage?: string;
}

export class PendingProductDto {
  id: number;
  name: string;
  price: number;
  vendorId: number;
  vendorName: string;
  shopName: string;
  submittedAt: Date;
  hasDesign: boolean;
  designName?: string;
  imageUrl?: string;
}

export class PendingDesignDto {
  id: number;
  name: string;
  price: number;
  vendorId: number;
  vendorName: string;
  shopName: string;
  submittedAt: Date;
  thumbnailUrl?: string;
  category?: string;
  tags: string[];
}

export class PendingFundRequestDto {
  id: number;
  vendorId: number;
  vendorName: string;
  shopName: string;
  requestedAmount: number;
  paymentMethod: string;
  phoneNumber?: string;
  bankIban?: string;
  requestedAt: Date;
  vendorEmail: string;
}
