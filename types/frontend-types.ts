// Types TypeScript pour l'intégration Frontend - PrintAlma
// Copiez ce fichier dans votre projet frontend

// ============================
// ENUMS ET TYPES DE BASE
// ============================

export enum VendeurType {
  DESIGNER = 'DESIGNER',
  INFLUENCEUR = 'INFLUENCEUR',
  ARTISTE = 'ARTISTE'
}

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'ADMIN',
  VENDEUR = 'VENDEUR'
}

// ============================
// INTERFACES AUTHENTIFICATION
// ============================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginSuccessResponse {
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    vendeur_type: VendeurType | null;
    status: boolean;
  };
}

export interface LoginPasswordChangeRequiredResponse {
  mustChangePassword: true;
  userId: number;
  message: string;
}

export type LoginResponse = LoginSuccessResponse | LoginPasswordChangeRequiredResponse;

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface LogoutResponse {
  message: string;
}

// ============================
// INTERFACES RÉINITIALISATION DE MOT DE PASSE
// ============================

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface VerifyResetTokenRequest {
  token: string;
}

export interface VerifyResetTokenResponse {
  valid: boolean;
  message: string;
  userEmail?: string;
  userName?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
  userEmail: string;
}

export interface CleanupResetTokensResponse {
  deletedCount: number;
}

export interface UserProfile {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  vendeur_type: VendeurType | null;
  status: boolean;
  must_change_password: boolean;
  last_login_at: string;
  created_at: string;
  updated_at: string;
}

export interface AuthCheckResponse {
  isAuthenticated: boolean;
  user: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    vendeur_type: VendeurType | null;
  };
}

// ============================
// INTERFACES GESTION CLIENTS
// ============================

export interface CreateClientRequest {
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: VendeurType;
}

export interface CreateClientResponse {
  message: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: 'VENDEUR';
    vendeur_type: VendeurType;
    status: boolean;
    created_at: string;
  };
}

// ============================
// INTERFACES LISTING CLIENTS
// ============================

export interface ListClientsQuery {
  page?: number;
  limit?: number;
  status?: boolean;
  vendeur_type?: VendeurType;
  search?: string;
}

export interface ClientInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: UserRole;
  vendeur_type: VendeurType;
  status: boolean;
  must_change_password: boolean;
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  login_attempts: number;
  locked_until: string | null;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface ListClientsResponse {
  clients: ClientInfo[];
  pagination: PaginationInfo;
  filters: {
    status?: boolean;
    vendeur_type?: VendeurType;
    search?: string;
  };
}

export interface ToggleClientStatusResponse {
  message: string;
  client: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    status: boolean;
    updated_at: string;
  };
}

// ============================
// INTERFACES TYPES DE VENDEURS
// ============================

export interface SellerTypeInfo {
  value: VendeurType;
  label: string;
  description: string;
  icon: string;
  color: string;
}

export interface SellerTypesResponse {
  message: string;
  types: Array<{
    value: VendeurType;
    label: string;
    description: string;
  }>;
}

// ============================
// INTERFACES TEST (DÉVELOPPEMENT)
// ============================

export interface TestEmailRequest {
  email: string;
  firstName: string;
  lastName: string;
  vendeurType: VendeurType;
}

export interface TestEmailResponse {
  message: string;
  sentTo: string;
  vendeurType?: VendeurType;
  temporaryPassword?: string; // À supprimer en production
}

export interface PasswordGenerationResponse {
  message: string;
  password: string;
  length: number;
}

// ============================
// INTERFACES ERREURS
// ============================

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

export interface ValidationError {
  field: string;
  message: string;
}

// ============================
// INTERFACES STATE MANAGEMENT
// ============================

export interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  mustChangePassword: boolean;
  loading: boolean;
  error: string | null;
}

export interface FormErrors {
  [key: string]: string;
}

// ============================
// CONSTANTES UTILES
// ============================

export const SELLER_TYPE_CONFIG: Record<VendeurType, SellerTypeInfo> = {
  [VendeurType.DESIGNER]: {
    value: VendeurType.DESIGNER,
    label: 'Designer',
    description: 'Création de designs graphiques et visuels',
    icon: '🎨',
    color: 'blue'
  },
  [VendeurType.INFLUENCEUR]: {
    value: VendeurType.INFLUENCEUR,
    label: 'Influenceur',
    description: 'Promotion via réseaux sociaux et influence',
    icon: '📱',
    color: 'purple'
  },
  [VendeurType.ARTISTE]: {
    value: VendeurType.ARTISTE,
    label: 'Artiste',
    description: 'Création artistique et œuvres originales',
    icon: '🎭',
    color: 'green'
  }
};

export const API_ENDPOINTS = {
  // Authentification
  LOGIN: '/auth/login',
  LOGOUT: '/auth/logout',
  CHANGE_PASSWORD: '/auth/change-password',
  PROFILE: '/auth/profile',
  CHECK_AUTH: '/auth/check',
  
  // Réinitialisation de mot de passe
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY_RESET_TOKEN: '/auth/verify-reset-token',
  RESET_PASSWORD: '/auth/reset-password',
  CLEANUP_RESET_TOKENS: '/auth/admin/cleanup-reset-tokens',
  
  // Listing vendeurs (pour vendeurs authentifiés)
  LIST_VENDORS: '/auth/vendors',
  VENDORS_STATS: '/auth/vendors/stats',
  
  // Gestion clients (Admin)
  CREATE_CLIENT: '/auth/admin/create-client',
  LIST_CLIENTS: '/auth/admin/clients',
  TOGGLE_CLIENT_STATUS: '/auth/admin/clients/{id}/toggle-status',
  
  // Tests et types
  SELLER_TYPES: '/mail/seller-types',
  TEST_EMAIL: '/mail/test-send-email',
  TEST_EMAIL_WITH_TYPE: '/mail/test-send-email-with-type',
  TEST_PASSWORD_GENERATION: '/mail/test-password-generation'
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  VALIDATION_ERROR: 422,
  INTERNAL_SERVER_ERROR: 500
} as const;

// ============================
// CONSTANTES STATUT CLIENT
// ============================

export const CLIENT_STATUS = {
  ACTIVE: true,
  INACTIVE: false
} as const;

export const CLIENT_STATUS_LABELS = {
  true: 'Actif',
  false: 'Inactif'
} as const;

export const CLIENT_STATUS_COLORS = {
  true: 'green',
  false: 'red'
} as const;

// ============================
// TYPES UTILITAIRES
// ============================

export type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: ApiError;
};

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export type PermissionLevel = 'user' | 'admin' | 'superadmin';

export type ClientStatusFilter = 'all' | 'active' | 'inactive';

// ============================
// GUARDS DE TYPE
// ============================

export function isLoginSuccess(response: LoginResponse): response is LoginSuccessResponse {
  return 'user' in response;
}

export function isPasswordChangeRequired(response: LoginResponse): response is LoginPasswordChangeRequiredResponse {
  return 'mustChangePassword' in response;
}

export function isVendeur(user: UserProfile): boolean {
  return user.role === UserRole.VENDEUR;
}

export function isAdmin(user: UserProfile): boolean {
  return user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN;
}

export function hasVendeurType(user: UserProfile): user is UserProfile & { vendeur_type: VendeurType } {
  return user.vendeur_type !== null;
}

export function isClientActive(client: ClientInfo): boolean {
  return client.status === CLIENT_STATUS.ACTIVE;
}

export function isClientLocked(client: ClientInfo): boolean {
  return client.locked_until ? new Date(client.locked_until) > new Date() : false;
}

export function mustChangePassword(client: ClientInfo): boolean {
  return client.must_change_password;
}

// ============================
// UTILITAIRES
// ============================

export function getSellerTypeInfo(type: VendeurType): SellerTypeInfo {
  return SELLER_TYPE_CONFIG[type];
}

export function getSellerTypeIcon(type: VendeurType | null): string {
  if (!type) return '';
  return SELLER_TYPE_CONFIG[type].icon;
}

export function getSellerTypeLabel(type: VendeurType | null): string {
  if (!type) return 'Non défini';
  return SELLER_TYPE_CONFIG[type].label;
}

export function getSellerTypeColor(type: VendeurType | null): string {
  if (!type) return 'gray';
  return SELLER_TYPE_CONFIG[type].color;
}

export function getClientStatusLabel(status: boolean): string {
  return CLIENT_STATUS_LABELS[status.toString() as keyof typeof CLIENT_STATUS_LABELS];
}

export function getClientStatusColor(status: boolean): string {
  return CLIENT_STATUS_COLORS[status.toString() as keyof typeof CLIENT_STATUS_COLORS];
}

export function formatLastLoginDate(date: string | null): string {
  if (!date) return 'Jamais connecté';
  
  const loginDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - loginDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Aujourd\'hui';
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
  return loginDate.toLocaleDateString('fr-FR');
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Le mot de passe doit contenir au moins 8 caractères');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une majuscule');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins une minuscule');
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Le mot de passe doit contenir au moins un chiffre');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

export function buildClientFiltersQuery(filters: {
  page?: number;
  limit?: number;
  status?: ClientStatusFilter;
  vendeur_type?: VendeurType;
  search?: string;
}): ListClientsQuery {
  const query: ListClientsQuery = {};
  
  if (filters.page) query.page = filters.page;
  if (filters.limit) query.limit = filters.limit;
  if (filters.vendeur_type) query.vendeur_type = filters.vendeur_type;
  if (filters.search) query.search = filters.search;
  
  // Convertir le filtre de statut
  if (filters.status === 'active') query.status = true;
  if (filters.status === 'inactive') query.status = false;
  // 'all' ne définit pas query.status
  
  return query;
}

// ============================
// INTERFACES LISTING VENDEURS
// ============================

export interface VendorInfo {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: VendeurType;
  created_at: string;
  last_login_at: string | null;
}

export interface ListVendorsResponse {
  vendors: VendorInfo[];
  total: number;
  message: string;
}

export interface VendorStats {
  type: VendeurType;
  count: number;
  label: string;
  icon: string;
}

export interface VendorsStatsResponse {
  stats: VendorStats[];
  total: number;
  message: string;
}
 