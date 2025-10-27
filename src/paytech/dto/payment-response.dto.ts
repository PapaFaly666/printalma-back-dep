/**
 * PayTech API response for payment initialization
 * Based on official PayTech documentation
 */
export class PaymentResponseDto {
  success: number; // 1 for success, 0 for failure
  token: string;
  redirect_url: string;
  redirectUrl?: string; // Alternative field name
  message?: string; // Error message if success = 0
}

/**
 * Response for payment status check
 */
export class PaymentStatusResponseDto {
  success: number;
  message: string;
  data?: {
    token: string;
    ref_command: string;
    amount: number;
    currency: string;
    status: string; // e.g., 'completed', 'pending', 'cancelled'
    payment_method?: string;
    transaction_id?: string;
    paid_at?: string;
  };
}

/**
 * Response for refund request
 */
export class RefundResponseDto {
  success: number;
  message: string;
  data?: {
    ref_command: string;
    refund_status: string;
  };
}
