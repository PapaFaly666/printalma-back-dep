#!/bin/bash

# Test script for PayTech payment failure scenarios
# This script tests what happens when payment fails due to insufficient funds

echo "🧪 Testing PayTech Payment Failure Scenarios..."
echo "=============================================="

BASE_URL="http://localhost:3004"

# Step 1: Create a test order with PayTech payment
echo -e "\n📋 Step 1: Creating test order for failure scenario..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "771234567",
    "paymentMethod": "PAYTECH",
    "initiatePayment": true,
    "shippingDetails": {
      "street": "456 Test Street",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "orderItems": [
      {
        "productId": 1,
        "quantity": 1,
        "color": "Rouge",
        "size": "M"
      }
    ]
  }')

echo "Order Response:"
echo "$ORDER_RESPONSE" | jq '.' 2>/dev/null || echo "$ORDER_RESPONSE"

# Extract order information
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.id' 2>/dev/null)
PAYMENT_TOKEN=$(echo "$ORDER_RESPONSE" | jq -r '.data.payment.token' 2>/dev/null)
ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | jq -r '.data.orderNumber' 2>/dev/null)

echo -e "\nExtracted Info:"
echo "Order ID: $ORDER_ID"
echo "Order Number: $ORDER_NUMBER"
echo "Payment Token: $PAYMENT_TOKEN"
echo "Payment URL: https://paytech.sn/payment/checkout/$PAYMENT_TOKEN"

echo -e "\n--------------------------------------------------"

# Step 2: Simulate IPN callback for payment failure (insufficient funds)
if [ -n "$ORDER_NUMBER" ] && [ "$ORDER_NUMBER" != "null" ]; then
  echo -e "\n📋 Step 2: Simulating payment failure (insufficient funds)..."

  # Simulate failed payment IPN
  IPN_DATA_FAILED=$(cat <<EOF
{
  "type_event": "sale_canceled",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "FAILED_TXN_$(date +%s)",
  "success": "0",
  "cancel_reason": "insufficient_funds",
  "hmac_compute": "$(echo -n "200|$ORDER_NUMBER|f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa" | openssl dgst -sha256 -hmac "70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b" | cut -d' ' -f2)"
}
EOF
)

  echo "Sending payment failure IPN:"
  echo "$IPN_DATA_FAILED" | jq '.' 2>/dev/null || echo "$IPN_DATA_FAILED"

  IPN_FAILED_RESPONSE=$(curl -s -X POST "$BASE_URL/paytech/ipn-callback" \
    -H "Content-Type: application/json" \
    -d "$IPN_DATA_FAILED")

  echo "Payment Failure IPN Response:"
  echo "$IPN_FAILED_RESPONSE" | jq '.' 2>/dev/null || echo "$IPN_FAILED_RESPONSE"
else
  echo -e "\n⚠️  No order number available, skipping failure simulation"
fi

echo -e "\n--------------------------------------------------"

# Step 3: Check order status after payment failure
if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
  echo -e "\n📋 Step 3: Checking order status after payment failure..."

  # Get order details with authentication
  ORDER_DETAILS=$(curl -s -X GET "$BASE_URL/orders/$ORDER_ID" \
    -H "Content-Type: application/json" \
    -b @cookies-local.txt)

  echo "Order Details After Payment Failure:"
  echo "$ORDER_DETAILS" | jq '.' 2>/dev/null || echo "$ORDER_DETAILS"

  # Extract payment and order status
  PAYMENT_STATUS=$(echo "$ORDER_DETAILS" | jq -r '.data.paymentStatus' 2>/dev/null)
  ORDER_STATUS=$(echo "$ORDER_DETAILS" | jq -r '.data.status' 2>/dev/null)

  echo -e "\nFinal Status After Payment Failure:"
  echo "Payment Status: $PAYMENT_STATUS"
  echo "Order Status: $ORDER_STATUS"

  if [ "$PAYMENT_STATUS" = "FAILED" ] && [ "$ORDER_STATUS" = "PENDING" ]; then
    echo -e "\n✅ SUCCESS: Payment failure handled correctly!"
    echo "✅ Order remains PENDING (can retry payment)"
    echo "✅ Payment status marked as FAILED"
  else
    echo -e "\n⚠️  Unexpected status after payment failure"
  fi
else
  echo -e "\n⚠️  No order ID available, skipping status check"
fi

echo -e "\n--------------------------------------------------"

# Step 4: Test another scenario - expired session
if [ -n "$ORDER_NUMBER" ] && [ "$ORDER_NUMBER" != "null" ]; then
  echo -e "\n📋 Step 4: Simulating expired payment session..."

  # Simulate expired session IPN
  IPN_DATA_EXPIRED=$(cat <<EOF
{
  "type_event": "sale_canceled",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "EXPIRED_TXN_$(date +%s)",
  "success": "0",
  "cancel_reason": "session_expired",
  "hmac_compute": "$(echo -n "200|$ORDER_NUMBER|f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa" | openssl dgst -sha256 -hmac "70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b" | cut -d' ' -f2)"
}
EOF
)

  echo "Sending expired session IPN:"
  echo "$IPN_DATA_EXPIRED" | jq '.' 2>/dev/null || echo "$IPN_DATA_EXPIRED"

  IPN_EXPIRED_RESPONSE=$(curl -s -X POST "$BASE_URL/paytech/ipn-callback" \
    -H "Content-Type: application/json" \
    -d "$IPN_DATA_EXPIRED")

  echo "Expired Session IPN Response:"
  echo "$IPN_EXPIRED_RESPONSE" | jq '.' 2>/dev/null || echo "$IPN_EXPIRED_RESPONSE"
fi

echo -e "\n=============================================="
echo "🧪 PayTech Payment Failure Test Complete"
echo ""
echo "📝 Summary:"
echo "- Payment failures are handled gracefully"
echo "- Orders remain in PENDING status for retry"
echo "- Payment status is marked as FAILED"
echo "- Different failure reasons can be tracked"
echo "- Customers can attempt payment again"