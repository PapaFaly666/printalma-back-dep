import {
  IsOptional,
  IsString,
  IsInt,
  IsEnum,
  IsDateString,
  IsNumber,
  Min,
  Max,
  IsIn,
  IsNotEmpty,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { OrderStatus } from '@prisma/client';

/**
 * DTO pour les filtres de commandes vendeur
 */
export class VendorOrderFiltersDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(OrderStatus)
  @Transform(({ value }) => value?.toUpperCase())
  status?: OrderStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxAmount?: number;

  @IsOptional()
  @IsString()
  @IsIn(['createdAt', 'updatedAt', 'totalAmount', 'orderNumber'])
  sortBy?: string = 'createdAt';

  @IsOptional()
  @IsString()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

/**
 * DTO pour la mise à jour du statut de commande
 */
export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  @Transform(({ value }) => value?.toUpperCase())
  status: OrderStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * Interfaces pour les réponses API
 */
export interface VendorUser {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  photo_profil?: string;
}

export interface ShippingAddress {
  name: string;
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  region: string;
  country: string;
  fullFormatted: string;
  phone: string;
}

export interface OrderItemProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  designName: string;
  designDescription: string;
  designImageUrl: string;
  categoryId: number;
  categoryName: string;
}

export interface VendorOrderItem {
  id: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  size?: string;
  color?: string;
  colorId?: number;
  productId: number;
  productName: string;
  productImage: string;
  product: OrderItemProduct;
}

export interface VendorOrder {
  id: number;
  orderNumber: string;
  userId: number;
  user: VendorUser;
  status: string;
  totalAmount: number;
  subtotal: number;
  taxAmount: number;
  shippingAmount: number;
  paymentMethod: string;
  shippingAddress: ShippingAddress;
  phoneNumber: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  shippedAt?: string;
  deliveredAt?: string;
  orderItems: VendorOrderItem[];
}

export interface VendorOrdersListData {
  orders: VendorOrder[];
  total: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface VendorStatistics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  monthlyGrowth: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  revenueThisMonth: number;
  ordersThisMonth: number;
  revenueLastMonth: number;
  ordersLastMonth: number;
}

export interface VendorNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId?: number;
  isRead: boolean;
  createdAt: string;
}

/**
 * DTOs de réponse API standardisées
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  statusCode?: number;
}

export type VendorOrderResponseDto = ApiResponse<VendorOrder>;
export type VendorOrdersListResponseDto = ApiResponse<VendorOrdersListData>;
export type VendorStatisticsResponseDto = ApiResponse<VendorStatistics>;
export type NotificationResponseDto = ApiResponse<VendorNotification[]>;

/**
 * Enum pour les types de notifications vendeur (selon la doc)
 */
export enum VendorNotificationType {
  NEW_ORDER = 'NEW_ORDER',
  ORDER_STATUS_CHANGED = 'ORDER_STATUS_CHANGED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
}