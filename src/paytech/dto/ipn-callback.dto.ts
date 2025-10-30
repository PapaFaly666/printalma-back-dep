import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

/**
 * IPN (Instant Payment Notification) callback DTO
 * Based on official PayTech documentation
 *
 * PayTech sends webhooks with payment status updates
 * Two verification methods are supported:
 * 1. HMAC-SHA256 (recommended): hmac_compute parameter
 * 2. SHA256 hashing: api_key_sha256 and api_secret_sha256 parameters
 */
export class IpnCallbackDto {
  @IsOptional()
  @IsString()
  type_event?: string; // 'sale_complete', 'sale_canceled', 'refund_complete'

  @IsOptional()
  success?: boolean | number | string; // Can be boolean, number (0/1), or string

  @IsOptional()
  @IsString()
  ref_command?: string;

  @IsOptional()
  @IsString()
  item_name?: string;

  @IsOptional()
  @IsNumber()
  item_price?: number;

  @IsOptional()
  @IsString()
  currency?: string; // XOF, EUR, USD, CAD, GBP, MAD

  @IsOptional()
  @IsString()
  command_name?: string;

  @IsOptional()
  @IsString()
  payment_method?: string; // Orange Money, Wave, etc.

  @IsOptional()
  @IsString()
  client_phone?: string; // Customer phone number

  @IsOptional()
  @IsString()
  transaction_id?: string;

  @IsOptional()
  @IsString()
  token?: string;

  // SHA256 verification fields
  @IsOptional()
  @IsString()
  api_key_sha256?: string;

  @IsOptional()
  @IsString()
  api_secret_sha256?: string;

  // HMAC-SHA256 verification field (recommended)
  @IsOptional()
  @IsString()
  hmac_compute?: string;

  // Custom field (returned as sent during payment request)
  @IsOptional()
  @IsString()
  custom_field?: string;

  @IsOptional()
  @IsString()
  paid_at?: string;

  // Payment failure reasons
  @IsOptional()
  @IsString()
  cancel_reason?: string; // 'insufficient_funds', 'session_expired', 'user_cancelled', 'card_declined', etc.

  @IsOptional()
  @IsString()
  error_code?: string; // Error code from PayTech

  @IsOptional()
  @IsString()
  error_message?: string; // Detailed error message

  @IsOptional()
  @IsString()
  processor_response?: string; // Payment processor response

  // Additional fields
  [key: string]: any;
}
