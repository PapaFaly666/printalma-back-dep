# PayTech Insufficient Funds Webhook Guide

> **Documentation Sources:**
> - Official PayTech API Docs: https://doc.intech.sn/doc_paytech.php
> - PayTech Postman Collection: https://doc.intech.sn/PayTech%20x%20DOC.postman_collection.json

## Table of Contents

1. [Overview](#overview)
2. [Webhook Endpoints](#webhook-endpoints)
3. [Configuration](#configuration)
4. [API Reference](#api-reference)
5. [Frontend Integration](#frontend-integration)
6. [Testing Guide](#testing-guide)
7. [Best Practices](#best-practices)

---

## Overview

This guide covers the specialized **Insufficient Funds Webhook** implementation for PayTech payment gateway integration. When a payment fails due to insufficient funds, this webhook provides enhanced functionality beyond standard IPN callbacks.

### Key Features

- ✅ **Dedicated webhook endpoint** for insufficient funds scenarios
- ✅ **Automatic failure detection** and categorization
- ✅ **Payment retry mechanism** for customers
- ✅ **Analytics tracking** for insufficient funds incidents
- ✅ **Customer notification preparation** (email, SMS ready)
- ✅ **Alternative payment method suggestions**

### Architecture

```
Customer Payment Attempt
        ↓
    PayTech API
        ↓
   Payment Failed (Insufficient Funds)
        ↓
PayTech sends IPN webhook
        ↓
/paytech/ipn-insufficient-funds endpoint
        ↓
[Verify HMAC → Categorize Failure → Update Order → Prepare Notifications]
        ↓
Return retry URL + alternative payment options
```

---

## Webhook Endpoints

### 1. Main IPN Callback (Standard)
**Endpoint:** `POST /paytech/ipn-callback`

Handles ALL PayTech webhook events including:
- ✅ `sale_complete` - Payment successful
- ❌ `sale_canceled` - Payment failed (all reasons)
- 💰 `refund_complete` - Refund processed
- 📤 `transfer_success` - Transfer successful
- ❌ `transfer_failed` - Transfer failed

### 2. Insufficient Funds Webhook (Specialized)
**Endpoint:** `POST /paytech/ipn-insufficient-funds`

Specialized endpoint for insufficient funds scenarios with enhanced features:
- Detailed failure analysis
- Customer notification preparation
- Retry payment URL generation
- Alternative payment suggestions
- Analytics logging

---

## Configuration

### Step 1: Environment Variables

Add the following to your `.env` file:

```bash
# PayTech API Credentials
PAYTECH_API_KEY=your_api_key_here
PAYTECH_API_SECRET=your_api_secret_here

# PayTech Environment (test or prod)
PAYTECH_ENVIRONMENT=test

# Webhook URLs (update with your domain)
PAYTECH_IPN_URL=https://yourdomain.com/paytech/ipn-callback

# Optional: Secondary IPN for insufficient funds
PAYTECH_IPN_INSUFFICIENT_FUNDS_URL=https://yourdomain.com/paytech/ipn-insufficient-funds

# Redirect URLs
PAYTECH_SUCCESS_URL=https://yourdomain.com/payment/success
PAYTECH_CANCEL_URL=https://yourdomain.com/payment/cancel

# Frontend URL for retry payment links
FRONTEND_URL=https://yourdomain.com
```

### Step 2: PayTech Dashboard Configuration

According to **PayTech official documentation**:

1. **Login to PayTech Dashboard** at https://paytech.sn
2. Navigate to **Settings → API Configuration**
3. Configure **IPN URL**: `https://yourdomain.com/paytech/ipn-callback`
4. Configure **Refund Notification URL**: `https://yourdomain.com/paytech/ipn-insufficient-funds`
   - Note: You can use the insufficient funds endpoint here for specialized handling
5. **IMPORTANT**: IPN URLs must use HTTPS (HTTP not supported in production)

### Step 3: HMAC Verification

Per **PayTech documentation**, webhook security uses HMAC-SHA256:

```typescript
// Already implemented in PaytechService
message = amount|ref_command|api_key
hmac = HMAC-SHA256(message, api_secret)
// Compare with received hmac_compute parameter
```

---

## API Reference

### 1. Insufficient Funds Webhook Handler

**Endpoint:** `POST /paytech/ipn-insufficient-funds`

**Authentication:** None (webhook from PayTech, verified via HMAC)

**Request Body** (from PayTech):

```json
{
  "type_event": "sale_canceled",
  "success": 0,
  "ref_command": "ORD-1234567890",
  "item_name": "Order ORD-1234567890",
  "item_price": 25000,
  "currency": "XOF",
  "payment_method": "Orange Money",
  "transaction_id": "TXN123456",
  "cancel_reason": "insufficient_funds",
  "error_code": "INS_001",
  "error_message": "Fonds insuffisants dans le compte",
  "api_key_sha256": "sha256_hash_of_api_key",
  "api_secret_sha256": "sha256_hash_of_api_secret",
  "hmac_compute": "hmac_signature",
  "client_phone": "+221771234567"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Insufficient funds webhook processed successfully",
  "data": {
    "order_id": 123,
    "order_number": "ORD-1234567890",
    "payment_status": "FAILED",
    "failure_category": "insufficient_funds",
    "failure_details": {
      "reason": "insufficient_funds",
      "message": "Fonds insuffisants dans le compte",
      "code": "INS_001",
      "user_message": "❌ Fonds insuffisants. Veuillez vérifier votre solde ou utiliser une autre carte bancaire."
    },
    "customer_notification": {
      "orderId": 123,
      "orderNumber": "ORD-1234567890",
      "amount": 25000,
      "currency": "XOF",
      "customerEmail": "client@example.com",
      "customerPhone": "+221771234567",
      "message": "❌ Fonds insuffisants. Veuillez vérifier votre solde...",
      "retryPaymentUrl": "https://yourdomain.com/orders/ORD-1234567890/retry-payment"
    },
    "actions": {
      "retry_payment": {
        "available": true,
        "url": "https://yourdomain.com/orders/ORD-1234567890/retry-payment",
        "method": "POST",
        "note": "Customer can retry payment with sufficient funds"
      },
      "alternative_payment": {
        "available": true,
        "methods": ["cash_on_delivery", "bank_transfer"],
        "note": "Suggest alternative payment methods"
      }
    },
    "next_steps": [
      "Send SMS/Email notification to customer",
      "Customer can retry payment via retry URL",
      "Order remains in PENDING status until payment succeeds"
    ]
  }
}
```

### 2. Retry Payment Endpoint

**Endpoint:** `POST /orders/:orderNumber/retry-payment`

**Authentication:** None (public - uses order number for authorization)

**Request Body:**

```json
{
  "paymentMethod": "Wave" // Optional: specific payment method
}
```

**Response:**

```json
{
  "success": true,
  "message": "Payment retry initialized successfully",
  "data": {
    "order_id": 123,
    "order_number": "ORD-1234567890",
    "amount": 25000,
    "currency": "XOF",
    "payment": {
      "token": "new_payment_token_here",
      "redirect_url": "https://paytech.sn/payment/checkout/new_token",
      "is_retry": true
    }
  }
}
```

### 3. Insufficient Funds Orders Analytics (Admin)

**Endpoint:** `GET /orders/admin/insufficient-funds?page=1&limit=10`

**Authentication:** Required (Admin/SuperAdmin role)

**Headers:**
```
Authorization: Bearer <your_jwt_token>
```

**Response:**

```json
{
  "success": true,
  "message": "Commandes avec fonds insuffisants récupérées",
  "data": {
    "orders": [
      {
        "id": 123,
        "orderNumber": "ORD-1234567890",
        "totalAmount": 25000,
        "paymentStatus": "FAILED",
        "status": "PENDING",
        "notes": "💰 INSUFFICIENT FUNDS: Fonds insuffisants...",
        "createdAt": "2025-10-30T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 50,
      "page": 1,
      "limit": 10,
      "totalPages": 5
    }
  }
}
```

---

## Frontend Integration

### React/Next.js Example

#### 1. Retry Payment Component

```typescript
// components/RetryPayment.tsx
import { useState } from 'react';
import axios from 'axios';

interface RetryPaymentProps {
  orderNumber: string;
  amount: number;
  currency: string;
}

export default function RetryPayment({ orderNumber, amount, currency }: RetryPaymentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRetryPayment = async (paymentMethod?: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/${orderNumber}/retry-payment`,
        paymentMethod ? { paymentMethod } : {}
      );

      if (response.data.success) {
        // Redirect to PayTech payment page
        window.location.href = response.data.data.payment.redirect_url;
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la réinitialisation du paiement');
      setLoading(false);
    }
  };

  return (
    <div className="retry-payment-container">
      <div className="alert alert-warning">
        <h3>❌ Paiement échoué - Fonds insuffisants</h3>
        <p>Votre paiement de {amount} {currency} n'a pas pu être traité.</p>
      </div>

      <div className="payment-options">
        <h4>Options de paiement:</h4>

        <button
          onClick={() => handleRetryPayment()}
          disabled={loading}
          className="btn btn-primary"
        >
          {loading ? 'Chargement...' : '🔄 Réessayer le paiement'}
        </button>

        <div className="alternative-methods">
          <h5>Ou choisissez un autre moyen de paiement:</h5>
          <button
            onClick={() => handleRetryPayment('Wave')}
            disabled={loading}
            className="btn btn-secondary"
          >
            Wave
          </button>
          <button
            onClick={() => handleRetryPayment('Orange Money')}
            disabled={loading}
            className="btn btn-secondary"
          >
            Orange Money
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
    </div>
  );
}
```

#### 2. Payment Status Handler

```typescript
// pages/payment/status.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import RetryPayment from '@/components/RetryPayment';

export default function PaymentStatus() {
  const router = useRouter();
  const { status, orderNumber, reason } = router.query;

  if (status === 'failed' && reason === 'insufficient_funds') {
    return (
      <RetryPayment
        orderNumber={orderNumber as string}
        amount={25000}
        currency="XOF"
      />
    );
  }

  return <div>Vérification du statut du paiement...</div>;
}
```

#### 3. Admin Dashboard - Insufficient Funds Analytics

```typescript
// components/admin/InsufficientFundsAnalytics.tsx
import { useEffect, useState } from 'react';
import axios from 'axios';

export default function InsufficientFundsAnalytics() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInsufficientFundsOrders();
  }, []);

  const fetchInsufficientFundsOrders = async () => {
    try {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/orders/admin/insufficient-funds`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setOrders(response.data.data.orders);
    } catch (error) {
      console.error('Error fetching insufficient funds orders:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div className="insufficient-funds-analytics">
      <h2>📊 Commandes avec fonds insuffisants</h2>
      <table className="table">
        <thead>
          <tr>
            <th>Numéro de commande</th>
            <th>Montant</th>
            <th>Date</th>
            <th>Statut</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order: any) => (
            <tr key={order.id}>
              <td>{order.orderNumber}</td>
              <td>{order.totalAmount} XOF</td>
              <td>{new Date(order.createdAt).toLocaleDateString()}</td>
              <td>
                <span className="badge badge-danger">{order.paymentStatus}</span>
              </td>
              <td>
                <button onClick={() => window.open(`/orders/${order.orderNumber}`)}>
                  Voir détails
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Testing Guide

### 1. Testing with PayTech Sandbox

Per **PayTech documentation**, the sandbox environment:
- Uses `env=test` parameter
- Charges random amount between 100-150 XOF (regardless of actual amount)
- Available immediately upon registration

**Test Insufficient Funds Scenario:**

```bash
# Use the test script provided in your repository
bash test-paytech-echec.sh
```

### 2. Manual Testing with cURL

```bash
# Test the insufficient funds webhook endpoint
curl -X POST https://yourapi.com/paytech/ipn-insufficient-funds \
  -H "Content-Type: application/json" \
  -d '{
    "type_event": "sale_canceled",
    "success": 0,
    "ref_command": "ORD-1234567890",
    "item_name": "Test Order",
    "item_price": 25000,
    "currency": "XOF",
    "cancel_reason": "insufficient_funds",
    "error_message": "Fonds insuffisants dans le compte",
    "api_key_sha256": "YOUR_API_KEY_SHA256",
    "api_secret_sha256": "YOUR_API_SECRET_SHA256",
    "hmac_compute": "COMPUTED_HMAC"
  }'
```

### 3. Test Retry Payment

```bash
# Test retry payment endpoint
curl -X POST https://yourapi.com/orders/ORD-1234567890/retry-payment \
  -H "Content-Type: application/json" \
  -d '{
    "paymentMethod": "Wave"
  }'
```

### 4. Webhook Verification Endpoint

Test your webhook processing logic without affecting real orders:

```bash
curl -X POST https://yourapi.com/paytech/webhook-verify \
  -H "Content-Type: application/json" \
  -d '{
    "type_event": "sale_canceled",
    "ref_command": "TEST-ORDER",
    "item_price": 1000,
    "hmac_compute": "your_hmac_here"
  }'
```

---

## Best Practices

### 1. Security

✅ **Always verify HMAC signatures** before processing webhooks
```typescript
const isValid = this.paytechService.verifyIpn(ipnData);
if (!isValid) {
  throw new BadRequestException('Invalid webhook signature');
}
```

✅ **Use HTTPS for all webhook URLs** (required by PayTech in production)

✅ **Never expose API keys** in frontend code - always use server-side controllers

### 2. Error Handling

Per **PayTech documentation**, categorize failures properly:

```typescript
const failureCategories = {
  insufficient_funds: 'Fonds insuffisants',
  timeout: 'Session expirée',
  user_action: 'Annulé par l\'utilisateur',
  fraud: 'Bloqué pour raison de sécurité',
  technical_error: 'Erreur technique'
};
```

### 3. Customer Communication

✅ **Send immediate notification** when payment fails
✅ **Provide retry URL** in email/SMS
✅ **Suggest alternative payment methods**
✅ **Set clear expectations** about order status

### 4. Analytics & Monitoring

✅ Track insufficient funds rate: `(insufficient_funds_orders / total_orders) * 100`
✅ Monitor retry success rate
✅ Log all webhook events for debugging

### 5. Payment Method Support

Per **PayTech documentation**, supported payment methods include:
- Orange Money (SN, CI, ML)
- Wave (SN, CI)
- Mtn Money (CI, BJ)
- Moov Money (CI, ML, BJ)
- Wizall
- Carte Bancaire
- Emoney
- Tigo Cash
- Free Money

---

## Troubleshooting

### Issue: Webhook not received

**Solution:**
1. Verify webhook URL is HTTPS in production
2. Check PayTech dashboard configuration
3. Ensure server firewall allows PayTech IP addresses
4. Test with `/paytech/webhook-verify` endpoint first

### Issue: HMAC verification fails

**Solution:**
1. Verify API_KEY and API_SECRET in `.env`
2. Check message format: `amount|ref_command|api_key`
3. Ensure no extra spaces or newlines
4. Use `/paytech/webhook-verify` to debug HMAC calculation

### Issue: Order not found

**Solution:**
1. Ensure order is created before payment initialization
2. Verify `ref_command` matches `orderNumber` in database
3. Check database connection and schema

---

## Summary

This implementation provides a robust solution for handling insufficient funds scenarios with PayTech:

✅ **Dedicated webhook endpoint** for specialized handling
✅ **Based exclusively on official PayTech documentation**
✅ **Payment retry mechanism** for improved conversion
✅ **Analytics tracking** for business insights
✅ **Frontend integration examples** for React/Next.js
✅ **Comprehensive testing guide**

For additional support:
- PayTech Documentation: https://doc.intech.sn/doc_paytech.php
- PayTech Contact: contact@paytech.sn
- PayTech Support: https://paytech.sn

---

**Last Updated:** October 30, 2025
**Version:** 1.0.0
**Based on:** Official PayTech API Documentation
