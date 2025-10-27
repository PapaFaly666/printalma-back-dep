# PayTech Payment Gateway Integration Guide

This guide provides comprehensive documentation for the PayTech payment gateway integration in the Printalma backend application.

## Table of Contents

1. [Overview](#overview)
2. [Installation & Setup](#installation--setup)
3. [Configuration](#configuration)
4. [API Endpoints](#api-endpoints)
5. [Payment Flow](#payment-flow)
6. [Frontend Integration](#frontend-integration)
7. [Webhook/IPN Handling](#webhookipn-handling)
8. [Testing](#testing)
9. [Security Best Practices](#security-best-practices)
10. [Troubleshooting](#troubleshooting)

---

## Overview

PayTech is a West African payment gateway supporting multiple payment methods including:
- Orange Money (Senegal, Côte d'Ivoire, Mali)
- MTN Money (Côte d'Ivoire, Benin)
- Moov Money (Côte d'Ivoire, Mali, Benin)
- Wave (Senegal, Côte d'Ivoire)
- Carte Bancaire (Credit/Debit Cards)
- And more...

**Official Documentation:** https://doc.intech.sn/doc_paytech.php

---

## Installation & Setup

### Prerequisites
- NestJS backend application
- PostgreSQL database with Prisma ORM
- PayTech API credentials (API Key and Secret Key)

### Database Migration

The integration adds two fields to the `Order` model:

```sql
-- Run this migration
npx prisma migrate dev --name add_paytech_payment_fields
```

Or apply manually:
```sql
ALTER TABLE "Order" ADD COLUMN "paymentStatus" TEXT;
ALTER TABLE "Order" ADD COLUMN "transactionId" TEXT;
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");
CREATE INDEX "Order_transactionId_idx" ON "Order"("transactionId");
```

---

## Configuration

### Environment Variables

Add the following variables to your `.env` file:

```env
# PayTech Payment Gateway Configuration
PAYTECH_API_KEY="your-paytech-api-key"
PAYTECH_API_SECRET="your-paytech-api-secret"
PAYTECH_ENVIRONMENT="prod"  # or "test" for testing

# IPN URL must be HTTPS in production
PAYTECH_IPN_URL="https://your-backend.com/paytech/ipn-callback"
PAYTECH_SUCCESS_URL="https://your-frontend.com/payment/success"
PAYTECH_CANCEL_URL="https://your-frontend.com/payment/cancel"
```

### Your Current Configuration

```env
PAYTECH_API_KEY="f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa"
PAYTECH_API_SECRET="70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b"
PAYTECH_ENVIRONMENT="prod"
```

**⚠️ IMPORTANT SECURITY NOTES:**
1. Never commit API credentials to version control
2. Use different credentials for test and production
3. IPN callback URL MUST use HTTPS in production
4. Keep API keys confidential on the server side only

---

## API Endpoints

**Tableau récapitulatif:**

| Endpoint | Méthode | Authentification | Description |
|----------|---------|------------------|-------------|
| `/paytech/payment` | POST | 🌐 **Public** | Initialiser un paiement |
| `/paytech/ipn-callback` | POST | 🔒 **HMAC** | Webhook de notification |
| `/paytech/status/:token` | GET | 🌐 **Public** | Vérifier le statut d'un paiement |
| `/paytech/refund` | POST | 👮 **Admin** | Demander un remboursement |
| `/paytech/test-config` | GET | 👮 **Admin** | Tester la configuration |

### 1. Initialize Payment (Public)

**Endpoint:** `POST /paytech/payment`
**Authentication:** Not Required (Public endpoint)
**Description:** Initialize a payment and get the redirect URL

**Request Body:**
```json
{
  "item_name": "Order ORD-123456",
  "item_price": 50000,
  "ref_command": "ORD-123456",
  "command_name": "Printalma Order - ORD-123456",
  "currency": "XOF",
  "env": "prod",
  "ipn_url": "https://your-backend.com/paytech/ipn-callback",
  "success_url": "https://your-frontend.com/payment/success",
  "cancel_url": "https://your-frontend.com/payment/cancel",
  "custom_field": "{\"orderId\": 123, \"userId\": 45}"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Payment initialized successfully",
  "data": {
    "token": "abc123xyz789",
    "redirect_url": "https://paytech.sn/payment/checkout/abc123xyz789",
    "ref_command": "ORD-123456"
  }
}
```

---

### 2. Create Order with Payment

**Endpoint:** `POST /orders`
**Authentication:** Required (Bearer Token)
**Description:** Create an order and optionally initialize payment

**Request Body:**
```json
{
  "shippingDetails": {
    "name": "John Doe",
    "street": "123 Main St",
    "city": "Dakar",
    "region": "Dakar",
    "postalCode": "12000",
    "country": "Senegal"
  },
  "phoneNumber": "+221771234567",
  "notes": "Please deliver before 5 PM",
  "orderItems": [
    {
      "productId": 1,
      "quantity": 2,
      "size": "L",
      "colorId": 5
    }
  ],
  "paymentMethod": "PAYTECH",
  "initiatePayment": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Commande créée avec succès",
  "data": {
    "id": 123,
    "orderNumber": "ORD-1234567890",
    "totalAmount": 50000,
    "status": "PENDING",
    "payment": {
      "token": "abc123xyz789",
      "redirect_url": "https://paytech.sn/payment/checkout/abc123xyz789"
    }
  }
}
```

---

### 3. IPN Callback (Public)

**Endpoint:** `POST /paytech/ipn-callback`
**Authentication:** None (validated via HMAC signature)
**Description:** Receives payment status updates from PayTech

**PayTech sends POST request:**
```json
{
  "type_event": "sale_complete",
  "ref_command": "ORD-123456",
  "item_name": "Order ORD-123456",
  "item_price": 50000,
  "currency": "XOF",
  "payment_method": "orange_money_sn",
  "transaction_id": "PAYTECH_TXN_789456123",
  "hmac_compute": "3f5a8b7c2e9d1f4a6b8c7d5e3f2a9b1c",
  "custom_field": "{\"orderId\": 123, \"userId\": 45}",
  "paid_at": "2025-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "success": true,
  "message": "IPN processed successfully",
  "data": {
    "ref_command": "ORD-123456",
    "payment_status": "success",
    "verified": true
  }
}
```

---

### 4. Check Payment Status (Public)

**Endpoint:** `GET /paytech/status/:token`
**Authentication:** Not Required (Public endpoint)
**Description:** Check the status of a payment

**Response:**
```json
{
  "success": true,
  "message": "Payment status retrieved successfully",
  "data": {
    "token": "abc123xyz789",
    "ref_command": "ORD-123456",
    "amount": 50000,
    "currency": "XOF",
    "status": "completed",
    "payment_method": "orange_money_sn",
    "transaction_id": "PAYTECH_TXN_789456123",
    "paid_at": "2025-01-15T10:30:00Z"
  }
}
```

---

### 5. Request Refund (Admin Only)

**Endpoint:** `POST /paytech/refund`
**Authentication:** Required (Admin Role)
**Description:** Request a refund for a completed payment

**Request Body:**
```json
{
  "ref_command": "ORD-123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "ref_command": "ORD-123456",
    "refund_status": "pending"
  }
}
```

---

## Payment Flow

### Standard Payment Flow

```
1. User creates order → POST /orders with paymentMethod: "PAYTECH", initiatePayment: true
                      ↓
2. Backend creates order and calls PayTech API
                      ↓
3. Backend receives payment token and redirect URL
                      ↓
4. Frontend redirects user → https://paytech.sn/payment/checkout/{token}
                      ↓
5. User completes payment on PayTech page
                      ↓
6. PayTech sends IPN callback → POST /paytech/ipn-callback
                      ↓
7. Backend verifies HMAC signature and updates order
                      ↓
8. User redirected to success/cancel URL
```

### Verification Process

PayTech uses **HMAC-SHA256** for webhook verification:

```typescript
// Computation (handled automatically by PaytechService)
const message = `${amount}|${ref_command}|${api_key}`;
const hmac = crypto.createHmac('sha256', api_secret)
  .update(message)
  .digest('hex');
```

---

## Frontend Integration

### React/Vue/Angular Example

```typescript
// Option 1: Create order with payment initialization (requires auth)
const createOrderWithPayment = async (orderData: OrderData) => {
  try {
    const response = await axios.post('/orders', {
      ...orderData,
      paymentMethod: 'PAYTECH',
      initiatePayment: true
    }, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (response.data.payment?.redirect_url) {
      // Redirect user to PayTech payment page
      window.location.href = response.data.payment.redirect_url;
    }
  } catch (error) {
    console.error('Order creation failed:', error);
  }
};

// Option 2: Direct payment initialization (no auth required)
const initializePayment = async (orderNumber: string, amount: number) => {
  try {
    const response = await axios.post('/paytech/payment', {
      item_name: `Order ${orderNumber}`,
      item_price: amount,
      ref_command: orderNumber,
      command_name: `Printalma Order - ${orderNumber}`,
      currency: 'XOF',
      ipn_url: 'https://your-backend.com/paytech/ipn-callback',
      success_url: 'https://your-frontend.com/payment/success',
      cancel_url: 'https://your-frontend.com/payment/cancel'
    });

    if (response.data.data?.redirect_url) {
      // Redirect user to PayTech payment page
      window.location.href = response.data.data.redirect_url;
    }
  } catch (error) {
    console.error('Payment initialization failed:', error);
  }
};

// 2. Handle success/cancel redirects
// On /payment/success page
const paymentSuccessPage = () => {
  // Extract order number from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const orderNumber = urlParams.get('ref_command');

  // Display success message
  return <div>Payment successful for order {orderNumber}!</div>;
};

// On /payment/cancel page
const paymentCancelPage = () => {
  return <div>Payment was cancelled. Please try again.</div>;
};
```

### Axios Configuration

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3004', // Your backend URL
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

---

## Webhook/IPN Handling

### Setting Up IPN URL

1. **Development:** Use ngrok or similar tool to expose localhost
   ```bash
   ngrok http 3004
   # Use: https://abc123.ngrok.io/paytech/ipn-callback
   ```

2. **Production:** Use your actual domain with HTTPS
   ```
   https://api.yourdomain.com/paytech/ipn-callback
   ```

### Webhook Security

The `PaytechService` automatically:
- ✅ Verifies HMAC-SHA256 signature
- ✅ Validates payment status
- ✅ Updates order in database
- ✅ Prevents replay attacks
- ✅ Logs all webhook activities

---

## Testing

### Test Mode

Set environment to test mode:
```env
PAYTECH_ENVIRONMENT="test"
```

### Manual Testing

1. **Test Payment Initialization (No Auth Required):**
```bash
curl -X POST http://localhost:3004/paytech/payment \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test Order",
    "item_price": 1000,
    "ref_command": "TEST-001",
    "command_name": "Test Payment",
    "currency": "XOF",
    "ipn_url": "http://localhost:3004/paytech/ipn-callback",
    "success_url": "http://localhost:5174/payment/success",
    "cancel_url": "http://localhost:5174/payment/cancel"
  }'
```

2. **Test IPN Callback (simulate PayTech webhook):**
```bash
curl -X POST http://localhost:3004/paytech/ipn-callback \
  -H "Content-Type: application/json" \
  -d '{
    "type_event": "sale_complete",
    "ref_command": "TEST-001",
    "item_price": 1000,
    "transaction_id": "TEST_TXN_123",
    "hmac_compute": "COMPUTED_HMAC_HERE"
  }'
```

### Check Logs

Monitor application logs for PayTech operations:
```bash
# Look for PayTech service logs
npm run start:dev | grep PayTech
```

---

## Security Best Practices

### 1. API Key Management
- ✅ Store credentials in `.env` file (never in code)
- ✅ Use different keys for test/production
- ✅ Rotate keys periodically
- ✅ Never expose keys in frontend code

### 2. HTTPS Requirements
- ✅ IPN callback URL MUST use HTTPS in production
- ✅ Use valid SSL certificate
- ✅ Test webhooks with real HTTPS endpoint

### 3. Webhook Verification
- ✅ Always verify HMAC signature
- ✅ Validate payment amounts match order totals
- ✅ Check for duplicate IPNs
- ✅ Log all webhook activities

### 4. Error Handling
- ✅ Handle payment failures gracefully
- ✅ Provide clear error messages to users
- ✅ Implement retry mechanisms
- ✅ Monitor failed payments

---

## Troubleshooting

### Common Issues

#### 1. Payment Initialization Fails

**Error:** `PayTech API credentials missing`

**Solution:**
- Check `.env` file has `PAYTECH_API_KEY` and `PAYTECH_API_SECRET`
- Restart server after updating environment variables
- Verify credentials are correct

#### 2. IPN Callback Not Received

**Possible Causes:**
- IPN URL not accessible (firewall, incorrect URL)
- Not using HTTPS in production
- Server not running

**Solutions:**
- Test IPN URL accessibility: `curl https://your-domain.com/paytech/ipn-callback`
- Use ngrok for local testing
- Check server logs for errors
- Verify IPN URL in PayTech dashboard

#### 3. HMAC Verification Fails

**Error:** `Invalid IPN signature`

**Solutions:**
- Verify API credentials are correct
- Check that amount and ref_command match
- Ensure no extra whitespace in credentials
- Check PayTech documentation for HMAC format changes

#### 4. Order Status Not Updating

**Check:**
- Database connection is active
- Order with `ref_command` exists
- IPN callback is being received
- Check application logs for errors

### Debug Mode

Enable detailed logging:

```typescript
// In paytech.service.ts, the logger is already configured
// Check logs with:
npm run start:dev
```

### Support

- **PayTech Support:** https://doc.intech.sn/doc_paytech.php
- **Check Swagger Docs:** http://localhost:3004/api-docs
- **Backend Logs:** Monitor console output for detailed error messages

---

## Additional Features

### Currency Support

PayTech supports multiple currencies:
- XOF (West African CFA franc) - Default
- EUR (Euro)
- USD (US Dollar)
- CAD (Canadian Dollar)
- GBP (British Pound)
- MAD (Moroccan Dirham)

### Payment Methods

Available payment methods (use in `target_payment`):
- `orange_money` - Orange Money Senegal
- `orange_money_ci` - Orange Money Côte d'Ivoire
- `mtn_money_ci` - MTN Money Côte d'Ivoire
- `moov_money_ci` - Moov Money Côte d'Ivoire
- `wave` - Wave Senegal
- `wave_ci` - Wave Côte d'Ivoire
- `carte_bancaire` - Credit/Debit Cards
- And more...

---

## Swagger Documentation

Access interactive API documentation at:
```
http://localhost:3004/api-docs
```

Look for the **PayTech** tag to see all available endpoints.

---

## Next Steps

1. ✅ Test payment flow in test environment
2. ✅ Implement frontend payment UI
3. ✅ Set up production IPN webhook (HTTPS required)
4. ✅ Monitor payment transactions
5. ✅ Implement payment notifications
6. ✅ Set up payment analytics

---

## Contact & Support

For issues or questions:
1. Check PayTech official documentation
2. Review application logs
3. Test with Postman/curl
4. Contact PayTech support if needed

---

**Last Updated:** January 2025
**Integration Version:** 1.0.0
**Based on:** PayTech Official Documentation (https://doc.intech.sn/doc_paytech.php)
