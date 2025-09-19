# 🎨 Guide Frontend : Gestion des Vendeurs (Adapté du Backend)

## 🎯 Vue d'ensemble

Ce guide frontend est adapté du guide backend `pro.md` pour créer une interface complète de gestion des vendeurs. Il suit exactement la même architecture et les mêmes patterns que le backend pour assurer une cohérence parfaite.

## 🏗️ Architecture Frontend Adaptée

### 📁 Structure Frontend Recommandée

```
src/
├── components/
│   ├── vendor/                     # Composants vendeurs
│   │   ├── VendorProfile.tsx      # Équivalent AuthService
│   │   ├── VendorProductList.tsx  # Équivalent VendorPublishService
│   │   ├── VendorManagement.tsx   # Équivalent VendorValidationService
│   │   └── VendorDashboard.tsx    # Dashboard principal
│   ├── auth/                       # Authentification
│   │   ├── VendorLogin.tsx
│   │   ├── VendorRegister.tsx
│   │   └── ProfileUpdate.tsx
│   └── admin/                      # Interface admin
│       ├── VendorsList.tsx
│       ├── VendorDetails.tsx
│       └── VendorActions.tsx
├── hooks/                          # Hooks personnalisés
│   ├── useVendorAuth.ts           # Authentification
│   ├── useVendorData.ts           # Données vendeur
│   ├── useVendorStats.ts          # Statistiques
│   └── useVendorManagement.ts     # Gestion admin
├── services/                       # Services API
│   ├── vendorAuthService.ts       # Équivalent AuthService backend
│   ├── vendorPublishService.ts    # Équivalent VendorPublishService
│   └── vendorManagementService.ts # Équivalent VendorValidationService
├── types/                          # Types TypeScript
│   ├── vendor.types.ts            # Types vendeur
│   ├── api.types.ts               # Types API
│   └── auth.types.ts              # Types authentification
└── utils/                          # Utilitaires
    ├── dateUtils.ts               # Équivalent DateHelper backend
    ├── vendorUtils.ts             # Utilitaires vendeur
    └── validationUtils.ts         # Validation
```

## 📊 Types TypeScript (Adaptation du Backend)

### 🔍 **Types de Base Vendeur**

```typescript
// src/types/vendor.types.ts
// ✅ Adapté directement du modèle Prisma backend

export interface VendorUser {
  id: number;

  // 👤 Informations de base (du backend)
  firstName: string;
  lastName: string;
  email: string;
  role: 'VENDEUR' | 'ADMIN' | 'SUPERADMIN';

  // ⚡ Statut et sécurité (du backend)
  status: boolean;                    // Compte actif/désactivé
  login_attempts: number;             // Tentatives de connexion
  locked_until?: string;              // Verrouillage temporaire
  must_change_password: boolean;

  // 📅 Dates importantes (du backend)
  created_at: string;                 // Date d'inscription ISO
  updated_at: string;                 // Dernière modification ISO
  last_login_at?: string;             // Dernière connexion ISO

  // 🏪 Profil vendeur étendu (du backend)
  phone?: string;                     // Téléphone
  country?: string;                   // Pays
  address?: string;                   // Adresse
  shop_name?: string;                 // Nom boutique
  profile_photo_url?: string;         // Photo Cloudinary
  vendeur_type?: 'INDIVIDUEL' | 'ENTREPRISE';

  // 🔐 Activation par email (du backend)
  activation_code?: string;           // Code à 6 chiffres
  activation_code_expires?: string;   // Expiration code
}

export interface VendorStatistics {
  // 📊 Activité (calculé côté backend)
  totalProducts: number;
  publishedProducts: number;
  totalDesigns: number;
  totalOrders: number;
  totalEarnings: number;
  availableBalance: number;

  // 📅 Calculs temporels (calculé côté backend)
  memberSinceDays: number;
  lastSeenDays: number | null;

  // ⚡ Statut enrichi (calculé côté backend)
  isLocked: boolean;
  needsAttention: boolean;
}

export interface VendorWithStats extends VendorUser {
  statistics: VendorStatistics;
}
```

### 🎯 **Types d'API (Correspondant au Backend)**

```typescript
// src/types/api.types.ts
// ✅ Types correspondant exactement aux DTOs backend

export interface VendorFilters {
  search?: string;
  status?: 'all' | 'active' | 'inactive' | 'locked';
  country?: string;
  vendeur_type?: 'INDIVIDUEL' | 'ENTREPRISE';
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface VendorProfileUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  address?: string;
  shop_name?: string;
  profile_photo_url?: string;
  vendeur_type?: 'INDIVIDUEL' | 'ENTREPRISE';
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  error?: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface VendorsListResponse {
  vendors: VendorWithStats[];
  stats: {
    total: number;
    active: number;
    inactive: number;
    locked: number;
    needsAttention: number;
    withProducts: number;
    withoutProducts: number;
  };
  pagination: PaginationInfo;
}
```

## 🔧 Services Frontend (Miroir du Backend)

### 1. 🔐 **VendorAuthService** (Équivalent AuthService Backend)

```typescript
// src/services/vendorAuthService.ts
// ✅ Service miroir du AuthService backend

import { VendorUser, VendorProfileUpdate } from '../types/vendor.types';
import { ApiResponse } from '../types/api.types';

export class VendorAuthService {
  private readonly baseUrl = process.env.REACT_APP_API_URL;

  /**
   * 🔑 Connexion vendeur (miroir du login backend)
   * Backend: AuthService.login()
   */
  async login(email: string, password: string): Promise<ApiResponse<{ user: VendorUser }>> {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Pour les cookies httpOnly
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erreur de connexion');
    }

    // ✅ Backend met automatiquement à jour last_login_at
    return data;
  }

  /**
   * 📝 Inscription vendeur (miroir du registerVendor backend)
   * Backend: AuthService.registerVendor()
   */
  async registerVendor(vendorData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    address?: string;
    shop_name?: string;
    vendeur_type?: 'INDIVIDUEL' | 'ENTREPRISE';
  }): Promise<ApiResponse<VendorUser>> {
    const response = await fetch(`${this.baseUrl}/auth/register-vendor`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(vendorData)
    });

    return await response.json();
  }

  /**
   * 👤 Récupération profil complet (miroir backend)
   * Backend: AuthController.getVendorProfile()
   */
  async getVendorProfile(): Promise<ApiResponse<VendorUser>> {
    const response = await fetch(`${this.baseUrl}/auth/vendor/profile`, {
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * ✏️ Mise à jour profil (miroir backend)
   * Backend: AuthController.updateVendorProfile()
   */
  async updateVendorProfile(
    updateData: VendorProfileUpdate,
    profilePhoto?: File
  ): Promise<ApiResponse<VendorUser>> {
    const formData = new FormData();

    // Ajouter les données texte
    Object.entries(updateData).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    // Ajouter la photo si fournie
    if (profilePhoto) {
      formData.append('profile_photo', profilePhoto);
    }

    const response = await fetch(`${this.baseUrl}/auth/vendor/profile`, {
      method: 'PUT',
      credentials: 'include',
      body: formData
    });

    return await response.json();
  }

  /**
   * 📊 Statistiques vendeur (miroir backend)
   * Backend: AuthController.getVendorStats()
   */
  async getVendorStats(): Promise<ApiResponse<{
    vendor: VendorUser;
    statistics: VendorStatistics;
  }>> {
    const response = await fetch(`${this.baseUrl}/auth/vendor/stats`, {
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * 🚪 Déconnexion
   */
  async logout(): Promise<void> {
    await fetch(`${this.baseUrl}/auth/logout`, {
      method: 'POST',
      credentials: 'include'
    });
  }
}

export const vendorAuthService = new VendorAuthService();
```

### 2. 🛍️ **VendorPublishService** (Équivalent VendorPublishService Backend)

```typescript
// src/services/vendorPublishService.ts
// ✅ Service miroir du VendorPublishService backend

import { VendorWithStats } from '../types/vendor.types';
import { ApiResponse, PaginationInfo } from '../types/api.types';

export class VendorPublishService {
  private readonly baseUrl = process.env.REACT_APP_API_URL;

  /**
   * 🌐 Produits publics avec infos vendeur enrichies (miroir backend)
   * Backend: VendorPublishService.getPublicVendorProducts()
   */
  async getPublicVendorProducts(options: {
    limit?: number;
    offset?: number;
    vendorId?: number;
    status?: string;
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    allProducts?: boolean;
  } = {}): Promise<ApiResponse<{
    products: VendorProductWithEnhancedInfo[];
    pagination: PaginationInfo;
    type: 'all_products' | 'best_sellers';
  }>> {
    const params = new URLSearchParams();

    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/public/vendor-products?${params}`);
    return await response.json();
  }

  /**
   * 🔍 Détails produit avec infos vendeur (miroir backend)
   * Backend: VendorPublishService.getPublicVendorProductDetail()
   */
  async getVendorProductDetail(productId: number): Promise<ApiResponse<VendorProductWithEnhancedInfo>> {
    const response = await fetch(`${this.baseUrl}/public/vendor-products/${productId}`);
    return await response.json();
  }

  /**
   * 🏪 Produits d'un vendeur spécifique (miroir backend)
   * Backend: VendorPublishService via PublicProductsController
   */
  async getVendorProducts(
    vendorId: number,
    options: {
      limit?: number;
      offset?: number;
      status?: string;
    } = {}
  ): Promise<ApiResponse<{
    products: VendorProductWithEnhancedInfo[];
    vendor: VendorWithStats;
    pagination: PaginationInfo;
  }>> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/public/vendors/${vendorId}/products?${params}`);
    return await response.json();
  }

  /**
   * 🔍 Recherche produits avec infos vendeur (miroir backend)
   * Backend: VendorPublishService.searchPublicVendorProducts()
   */
  async searchVendorProducts(options: {
    query: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    vendorId?: number;
    limit?: number;
  }): Promise<ApiResponse<{
    products: VendorProductWithEnhancedInfo[];
    pagination: PaginationInfo;
  }>> {
    const params = new URLSearchParams();
    Object.entries(options).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/public/search?${params}`);
    return await response.json();
  }
}

interface VendorProductWithEnhancedInfo {
  id: number;
  name: string;
  price: number;
  status: string;
  createdAt: string;

  // 👤 Informations vendeur enrichies (du backend)
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    shop_name?: string;
    profile_photo_url?: string;
    email: string;
    phone?: string;
    country?: string;
    vendeur_type?: string;

    // 📅 Dates formatées (du backend)
    created_at: string;
    last_login_at?: string;
    updated_at: string;

    // ⚡ Statut (calculé côté backend)
    status: boolean;
    isLocked: boolean;

    // 📊 Statistiques calculées (du backend)
    memberSinceDays: number;
    lastSeenDays: number | null;
  };

  // 🎨 Autres données produit
  baseProduct: any;
  designPositions: any[];
}

export const vendorPublishService = new VendorPublishService();
```

### 3. 📊 **VendorManagementService** (Équivalent VendorValidationService Backend)

```typescript
// src/services/vendorManagementService.ts
// ✅ Service miroir du VendorProductValidationService backend

import { VendorFilters, VendorsListResponse, ApiResponse } from '../types/api.types';
import { VendorWithStats } from '../types/vendor.types';

export class VendorManagementService {
  private readonly baseUrl = process.env.REACT_APP_API_URL;

  /**
   * 👥 Liste complète des vendeurs avec stats (miroir backend)
   * Backend: VendorValidationService.getAllVendorsWithStats()
   */
  async getAllVendors(filters: VendorFilters = {}): Promise<ApiResponse<VendorsListResponse>> {
    const params = new URLSearchParams();

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/admin/vendors?${params}`, {
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * 👤 Détails complets d'un vendeur (miroir backend)
   * Backend: VendorManagementController.getVendorDetails()
   */
  async getVendorDetails(vendorId: number): Promise<ApiResponse<{
    vendor: VendorWithStats;
    statistics: any;
  }>> {
    const response = await fetch(`${this.baseUrl}/admin/vendors/${vendorId}`, {
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * 🔄 Activation/Désactivation compte (miroir backend)
   * Backend: VendorPublishService.updateVendorAccountStatus()
   */
  async updateVendorStatus(
    vendorId: number,
    status: boolean,
    reason?: string
  ): Promise<ApiResponse<{
    statusChangedAt: string;
    reason: string | null;
  }>> {
    const response = await fetch(`${this.baseUrl}/admin/vendors/${vendorId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status, reason })
    });

    return await response.json();
  }

  /**
   * 🔓 Déverrouillage compte (miroir backend)
   * Backend: VendorValidationService.unlockVendorAccount()
   */
  async unlockVendorAccount(vendorId: number): Promise<ApiResponse<{ message: string }>> {
    const response = await fetch(`${this.baseUrl}/admin/vendors/${vendorId}/unlock`, {
      method: 'POST',
      credentials: 'include'
    });

    return await response.json();
  }

  /**
   * 📊 Export CSV (miroir backend)
   * Backend: VendorManagementController.exportVendorsData()
   */
  async exportVendorsData(filters: VendorFilters = {}): Promise<Blob> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/admin/vendors/export/csv?${params}`, {
      credentials: 'include'
    });

    return await response.blob();
  }

  /**
   * 📧 Notification en masse (miroir backend)
   * Backend: VendorManagementController.notifyVendors()
   */
  async notifyVendors(notification: {
    vendorIds: number[];
    subject: string;
    message: string;
    type: 'email' | 'in-app' | 'both';
  }): Promise<ApiResponse<{
    successful: number;
    failed: number;
    total: number;
  }>> {
    const response = await fetch(`${this.baseUrl}/admin/vendors/notify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(notification)
    });

    return await response.json();
  }
}

export const vendorManagementService = new VendorManagementService();
```

## 🎣 Hooks Personnalisés (Adaptation du Backend)

### 1. 🔐 **useVendorAuth** (Équivalent AuthService)

```typescript
// src/hooks/useVendorAuth.ts
// ✅ Hook miroir du AuthService backend

import { useState, useEffect, useCallback } from 'react';
import { VendorUser, VendorProfileUpdate } from '../types/vendor.types';
import { vendorAuthService } from '../services/vendorAuthService';

export const useVendorAuth = () => {
  const [vendor, setVendor] = useState<VendorUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔑 Connexion (miroir AuthService.login)
  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const response = await vendorAuthService.login(email, password);

      if (response.success) {
        setVendor(response.data.user);
        // ✅ Le backend a automatiquement mis à jour last_login_at
        return { success: true };
      } else {
        setError(response.message || 'Erreur de connexion');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de connexion';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // 📝 Inscription (miroir AuthService.registerVendor)
  const register = useCallback(async (vendorData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
    country?: string;
    address?: string;
    shop_name?: string;
    vendeur_type?: 'INDIVIDUEL' | 'ENTREPRISE';
  }) => {
    try {
      setLoading(true);
      setError(null);

      const response = await vendorAuthService.registerVendor(vendorData);

      if (response.success) {
        // ✅ Backend a créé le vendeur avec created_at automatique
        return { success: true, vendor: response.data };
      } else {
        setError(response.message || 'Erreur d\'inscription');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur d\'inscription';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // ✏️ Mise à jour profil (miroir AuthService.updateVendorProfile)
  const updateProfile = useCallback(async (
    updateData: VendorProfileUpdate,
    profilePhoto?: File
  ) => {
    try {
      setLoading(true);
      setError(null);

      const response = await vendorAuthService.updateVendorProfile(updateData, profilePhoto);

      if (response.success) {
        setVendor(response.data);
        // ✅ Backend a automatiquement mis à jour updated_at
        return { success: true, vendor: response.data };
      } else {
        setError(response.message || 'Erreur de mise à jour');
        return { success: false, error: response.message };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur de mise à jour';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // 🚪 Déconnexion
  const logout = useCallback(async () => {
    try {
      await vendorAuthService.logout();
      setVendor(null);
      setError(null);
    } catch (err) {
      console.error('Erreur déconnexion:', err);
    }
  }, []);

  // 🔄 Rechargement du profil
  const refreshProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await vendorAuthService.getVendorProfile();

      if (response.success) {
        setVendor(response.data);
      } else {
        setVendor(null);
      }
    } catch (err) {
      setVendor(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // ✅ Chargement initial du profil
  useEffect(() => {
    refreshProfile();
  }, [refreshProfile]);

  return {
    vendor,
    loading,
    error,
    login,
    register,
    updateProfile,
    logout,
    refreshProfile,

    // 📊 Informations calculées (miroir du backend)
    isAuthenticated: !!vendor,
    isActive: vendor?.status || false,
    isLocked: vendor?.locked_until ? new Date(vendor.locked_until) > new Date() : false,
    memberSinceDays: vendor?.created_at ?
      Math.floor((Date.now() - new Date(vendor.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0,
    lastSeenDays: vendor?.last_login_at ?
      Math.floor((Date.now() - new Date(vendor.last_login_at).getTime()) / (1000 * 60 * 60 * 24)) : null,
  };
};
```

### 2. 📊 **useVendorStats** (Équivalent Statistics Backend)

```typescript
// src/hooks/useVendorStats.ts
// ✅ Hook miroir des statistiques backend

import { useState, useEffect, useCallback } from 'react';
import { VendorStatistics } from '../types/vendor.types';
import { vendorAuthService } from '../services/vendorAuthService';

export const useVendorStats = (vendorId?: number) => {
  const [stats, setStats] = useState<VendorStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // ✅ Utilise les mêmes calculs que le backend
      const response = await vendorAuthService.getVendorStats();

      if (response.success) {
        setStats(response.data.statistics);
      } else {
        setError(response.message || 'Erreur récupération statistiques');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur statistiques');
    } finally {
      setLoading(false);
    }
  }, [vendorId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // 🎯 Fonctions utilitaires (miroir du backend)
  const calculateActivityScore = useCallback((stats: VendorStatistics): number => {
    // ✅ Même algorithme que StatsCalculator.calculateActivityScore() backend
    let score = 0;

    // Connexion récente (30 points max)
    if (stats.lastSeenDays !== null) {
      score += Math.max(0, 30 - stats.lastSeenDays);
    }

    // Produits (30 points max)
    score += Math.min(30, stats.totalProducts * 3);

    // Designs (20 points max)
    score += Math.min(20, stats.totalDesigns * 2);

    // Ancienneté (20 points max)
    score += Math.min(20, Math.floor(stats.memberSinceDays / 7) * 2);

    return Math.min(100, Math.round(score));
  }, []);

  const needsAttention = useCallback((stats: VendorStatistics): boolean => {
    // ✅ Même logique que le backend
    // Pas connecté depuis 30 jours
    if (stats.lastSeenDays !== null && stats.lastSeenDays > 30) return true;

    // Compte récent sans activité (plus de 7 jours)
    if (stats.memberSinceDays > 7 && stats.totalProducts === 0) return true;

    return false;
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,

    // 🎯 Fonctions calculées (miroir backend)
    activityScore: stats ? calculateActivityScore(stats) : 0,
    needsAttention: stats ? needsAttention(stats) : false,
    productionRate: stats ?
      Math.round((stats.totalProducts / Math.max(1, Math.floor(stats.memberSinceDays / 30))) * 100) / 100 : 0
  };
};
```

### 3. 👥 **useVendorManagement** (Équivalent VendorValidationService)

```typescript
// src/hooks/useVendorManagement.ts
// ✅ Hook miroir du VendorValidationService backend

import { useState, useCallback } from 'react';
import { VendorFilters, VendorsListResponse } from '../types/api.types';
import { VendorWithStats } from '../types/vendor.types';
import { vendorManagementService } from '../services/vendorManagementService';

export const useVendorManagement = () => {
  const [vendors, setVendors] = useState<VendorWithStats[]>([]);
  const [stats, setStats] = useState<VendorsListResponse['stats'] | null>(null);
  const [pagination, setPagination] = useState<VendorsListResponse['pagination'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 👥 Récupération liste vendeurs (miroir VendorValidationService.getAllVendorsWithStats)
  const fetchVendors = useCallback(async (filters: VendorFilters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response = await vendorManagementService.getAllVendors(filters);

      if (response.success) {
        setVendors(response.data.vendors);
        setStats(response.data.stats);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Erreur récupération vendeurs');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur récupération vendeurs');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔄 Mise à jour statut vendeur (miroir VendorPublishService.updateVendorAccountStatus)
  const updateVendorStatus = useCallback(async (
    vendorId: number,
    status: boolean,
    reason?: string
  ) => {
    try {
      const response = await vendorManagementService.updateVendorStatus(vendorId, status, reason);

      if (response.success) {
        // ✅ Mettre à jour localement (optimistic update)
        setVendors(prev => prev.map(vendor =>
          vendor.id === vendorId
            ? { ...vendor, status, updated_at: response.data.statusChangedAt }
            : vendor
        ));

        return { success: true };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur mise à jour statut'
      };
    }
  }, []);

  // 🔓 Déverrouillage compte (miroir VendorValidationService.unlockVendorAccount)
  const unlockVendorAccount = useCallback(async (vendorId: number) => {
    try {
      const response = await vendorManagementService.unlockVendorAccount(vendorId);

      if (response.success) {
        // ✅ Mettre à jour localement
        setVendors(prev => prev.map(vendor =>
          vendor.id === vendorId
            ? {
                ...vendor,
                login_attempts: 0,
                locked_until: undefined,
                statistics: { ...vendor.statistics, isLocked: false }
              }
            : vendor
        ));

        return { success: true, message: response.data.message };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur déverrouillage'
      };
    }
  }, []);

  // 📧 Notification en masse (miroir VendorManagementController.notifyVendors)
  const notifyVendors = useCallback(async (notification: {
    vendorIds: number[];
    subject: string;
    message: string;
    type: 'email' | 'in-app' | 'both';
  }) => {
    try {
      const response = await vendorManagementService.notifyVendors(notification);

      if (response.success) {
        return {
          success: true,
          data: response.data
        };
      } else {
        return { success: false, error: response.message };
      }
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur notification'
      };
    }
  }, []);

  // 📊 Export CSV (miroir VendorManagementController.exportVendorsData)
  const exportVendorsData = useCallback(async (filters: VendorFilters = {}) => {
    try {
      const blob = await vendorManagementService.exportVendorsData(filters);

      // ✅ Déclencher le téléchargement
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vendors-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Erreur export'
      };
    }
  }, []);

  return {
    vendors,
    stats,
    pagination,
    loading,
    error,
    fetchVendors,
    updateVendorStatus,
    unlockVendorAccount,
    notifyVendors,
    exportVendorsData,

    // 🎯 Fonctions utilitaires
    getVendorById: useCallback((id: number) =>
      vendors.find(vendor => vendor.id === id), [vendors]),

    getVendorsByStatus: useCallback((status: 'active' | 'inactive' | 'locked') => {
      switch (status) {
        case 'active':
          return vendors.filter(v => v.status && !v.statistics.isLocked);
        case 'inactive':
          return vendors.filter(v => !v.status);
        case 'locked':
          return vendors.filter(v => v.statistics.isLocked);
        default:
          return vendors;
      }
    }, [vendors])
  };
};
```

## 🔧 Utilitaires Frontend (Miroir du Backend)

### 📅 **DateUtils** (Équivalent DateHelper Backend)

```typescript
// src/utils/dateUtils.ts
// ✅ Utilitaires miroir du DateHelper backend

import { formatDistanceToNow, format, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';

export class DateUtils {
  /**
   * 📊 Calculer jours depuis une date (miroir DateHelper.daysSince)
   */
  static daysSince(date: string | Date): number {
    const targetDate = typeof date === 'string' ? new Date(date) : date;
    if (!isValid(targetDate)) return 0;
    return Math.floor((Date.now() - targetDate.getTime()) / (1000 * 60 * 60 * 24));
  }

  /**
   * 📅 Formater "Membre depuis" (miroir frontend guides)
   */
  static formatMemberSince(dateString: string, variant: 'short' | 'long' | 'exact' = 'short'): string {
    const date = new Date(dateString);
    if (!isValid(date)) return 'Date invalide';

    switch (variant) {
      case 'short':
        return formatDistanceToNow(date, { addSuffix: true, locale: fr });
      case 'long':
        return `Membre depuis ${formatDistanceToNow(date, { locale: fr })}`;
      case 'exact':
        return format(date, 'dd MMMM yyyy', { locale: fr });
      default:
        return formatDistanceToNow(date, { addSuffix: true, locale: fr });
    }
  }

  /**
   * 🕐 Formater "Dernière connexion" (miroir frontend guides)
   */
  static formatLastSeen(dateString?: string): string {
    if (!dateString) return 'Jamais connecté';

    const date = new Date(dateString);
    if (!isValid(date)) return 'Date invalide';

    return `Vu ${formatDistanceToNow(date, { addSuffix: true, locale: fr })}`;
  }

  /**
   * 🎯 Vérifier si une date est récente
   */
  static isRecent(dateString: string, thresholdDays: number = 7): boolean {
    return this.daysSince(dateString) <= thresholdDays;
  }

  /**
   * 📊 Convertir en format d'affichage local
   */
  static toLocalDisplay(dateString: string): string {
    const date = new Date(dateString);
    if (!isValid(date)) return 'Date invalide';
    return format(date, 'dd/MM/yyyy à HH:mm', { locale: fr });
  }
}
```

### 🎯 **VendorUtils** (Équivalent SecurityHelper + ValidationHelper Backend)

```typescript
// src/utils/vendorUtils.ts
// ✅ Utilitaires miroir des helpers backend

import { VendorWithStats } from '../types/vendor.types';

export class VendorUtils {
  /**
   * 🔒 Vérifier si compte verrouillé (miroir SecurityHelper.isAccountLocked)
   */
  static isAccountLocked(vendor: { locked_until?: string }): boolean {
    return vendor.locked_until ? new Date(vendor.locked_until) > new Date() : false;
  }

  /**
   * ⚠️ Détecter besoin d'attention (miroir StatsCalculator.needsAttention)
   */
  static needsAttention(vendor: VendorWithStats): boolean {
    // Pas connecté depuis 30 jours
    if (vendor.statistics.lastSeenDays !== null && vendor.statistics.lastSeenDays > 30) {
      return true;
    }

    // Compte récent sans activité (plus de 7 jours)
    if (vendor.statistics.memberSinceDays > 7 && vendor.statistics.totalProducts === 0) {
      return true;
    }

    // Tentatives de connexion élevées
    if (vendor.login_attempts >= 3) {
      return true;
    }

    return false;
  }

  /**
   * 🎯 Calculer score d'activité (miroir StatsCalculator.calculateActivityScore)
   */
  static calculateActivityScore(vendor: VendorWithStats): number {
    let score = 0;

    // Connexion récente (30 points max)
    if (vendor.statistics.lastSeenDays !== null) {
      score += Math.max(0, 30 - vendor.statistics.lastSeenDays);
    }

    // Produits (30 points max)
    score += Math.min(30, vendor.statistics.totalProducts * 3);

    // Designs (20 points max)
    score += Math.min(20, vendor.statistics.totalDesigns * 2);

    // Ancienneté (20 points max)
    score += Math.min(20, Math.floor(vendor.statistics.memberSinceDays / 7) * 2);

    return Math.min(100, Math.round(score));
  }

  /**
   * 📈 Calculer taux de production (miroir StatsCalculator.calculateProductionRate)
   */
  static calculateProductionRate(vendor: VendorWithStats): number {
    const memberSinceMonths = Math.max(1, Math.floor(vendor.statistics.memberSinceDays / 30));
    return Math.round((vendor.statistics.totalProducts / memberSinceMonths) * 100) / 100;
  }

  /**
   * 🏪 Valider nom de boutique (miroir ValidationHelper.isValidShopName)
   */
  static validateShopName(shopName: string): { isValid: boolean; error?: string } {
    if (!shopName || shopName.trim().length < 3) {
      return { isValid: false, error: 'Le nom de boutique doit contenir au moins 3 caractères' };
    }

    if (shopName.length > 50) {
      return { isValid: false, error: 'Le nom de boutique ne peut pas dépasser 50 caractères' };
    }

    const validChars = /^[a-zA-ZÀ-ÿ0-9\s\-']+$/;
    if (!validChars.test(shopName)) {
      return { isValid: false, error: 'Le nom de boutique contient des caractères non autorisés' };
    }

    return { isValid: true };
  }

  /**
   * 📧 Valider email (miroir ValidationHelper.isValidEmail)
   */
  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * 📱 Valider téléphone français (miroir ValidationHelper.isValidFrenchPhone)
   */
  static isValidFrenchPhone(phone: string): boolean {
    const phoneRegex = /^(?:\+33|0)[1-9](?:[0-9]{8})$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  }

  /**
   * 🎨 Obtenir couleur de statut pour UI
   */
  static getStatusColor(vendor: VendorWithStats): {
    bg: string;
    text: string;
    badge: string;
  } {
    if (this.isAccountLocked(vendor)) {
      return {
        bg: 'bg-red-50',
        text: 'text-red-700',
        badge: 'bg-red-100 text-red-800'
      };
    }

    if (!vendor.status) {
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-700',
        badge: 'bg-gray-100 text-gray-800'
      };
    }

    if (this.needsAttention(vendor)) {
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        badge: 'bg-yellow-100 text-yellow-800'
      };
    }

    return {
      bg: 'bg-green-50',
      text: 'text-green-700',
      badge: 'bg-green-100 text-green-800'
    };
  }

  /**
   * 📊 Obtenir texte de statut pour affichage
   */
  static getStatusText(vendor: VendorWithStats): string {
    if (this.isAccountLocked(vendor)) return '🔒 Verrouillé';
    if (!vendor.status) return '❌ Désactivé';
    if (this.needsAttention(vendor)) return '⚠️ Attention';
    return '✅ Actif';
  }

  /**
   * 🎯 Formater nom complet
   */
  static getFullName(vendor: { firstName: string; lastName: string; shop_name?: string }): string {
    return vendor.shop_name || `${vendor.firstName} ${vendor.lastName}`;
  }

  /**
   * 🔍 Filtrer vendeurs par terme de recherche
   */
  static filterBySearch(vendors: VendorWithStats[], searchTerm: string): VendorWithStats[] {
    if (!searchTerm.trim()) return vendors;

    const term = searchTerm.toLowerCase().trim();

    return vendors.filter(vendor =>
      vendor.firstName.toLowerCase().includes(term) ||
      vendor.lastName.toLowerCase().includes(term) ||
      vendor.email.toLowerCase().includes(term) ||
      (vendor.shop_name && vendor.shop_name.toLowerCase().includes(term)) ||
      (vendor.country && vendor.country.toLowerCase().includes(term))
    );
  }
}
```

## ✅ Checklist d'Implémentation

### 🏗️ **Architecture**
- [ ] Créer la structure des dossiers selon le guide
- [ ] Implémenter les types TypeScript correspondant au backend
- [ ] Configurer les services API miroir du backend

### 🔧 **Services Frontend**
- [ ] **VendorAuthService** - Authentification (AuthService backend)
- [ ] **VendorPublishService** - Produits publics (VendorPublishService backend)
- [ ] **VendorManagementService** - Gestion admin (VendorValidationService backend)

### 🎣 **Hooks Personnalisés**
- [ ] **useVendorAuth** - État d'authentification
- [ ] **useVendorStats** - Statistiques en temps réel
- [ ] **useVendorManagement** - Gestion administrative

### 🛠️ **Utilitaires**
- [ ] **DateUtils** - Formatage dates (DateHelper backend)
- [ ] **VendorUtils** - Validation et calculs (SecurityHelper backend)

### 🎨 **Composants**
- [ ] Créer les composants d'authentification
- [ ] Implémenter les vues de gestion vendeur
- [ ] Ajouter les interfaces admin correspondantes

---

## 🎯 **Avantages de cette Approche**

✅ **Cohérence parfaite** avec l'architecture backend
✅ **Types synchronisés** - Évite les erreurs de types
✅ **Logique miroir** - Mêmes calculs frontend/backend
✅ **Maintenance simplifiée** - Structure identique
✅ **Performance optimisée** - Hooks spécialisés
✅ **Sécurité renforcée** - Validation côté client alignée

Ce guide garantit une **intégration parfaite** entre le frontend et le backend ! 🚀