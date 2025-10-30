#!/bin/bash

# Test script for PayTech payment integration
# This script tests the complete payment flow

echo "🧪 Testing PayTech Payment Integration..."
echo "======================================"

BASE_URL="http://localhost:3004"

# Step 1: Test PayTech configuration
echo -e "\n📋 Step 1: Testing PayTech configuration..."
curl -X GET "$BASE_URL/paytech/test-config" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n"

echo -e "\n--------------------------------------------------"

# Step 2: Create a test order with PayTech payment
echo -e "\n📋 Step 2: Creating test order with PayTech payment..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "771234567",
    "paymentMethod": "PAYTECH",
    "initiatePayment": true,
    "shippingDetails": {
      "street": "123 Test Street",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "orderItems": [
      {
        "productId": 1,
        "quantity": 2,
        "color": "Noir",
        "size": "L"
      }
    ]
  }')

echo "Order Response:"
echo "$ORDER_RESPONSE" | jq '.' 2>/dev/null || echo "$ORDER_RESPONSE"

# Extract order ID and payment token if available
ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.id' 2>/dev/null)
PAYMENT_TOKEN=$(echo "$ORDER_RESPONSE" | jq -r '.data.payment.token' 2>/dev/null)
ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | jq -r '.data.orderNumber' 2>/dev/null)

echo -e "\nExtracted Info:"
echo "Order ID: $ORDER_ID"
echo "Order Number: $ORDER_NUMBER"
echo "Payment Token: $PAYMENT_TOKEN"

echo -e "\n--------------------------------------------------"

# Step 3: Test payment status check
if [ -n "$PAYMENT_TOKEN" ] && [ "$PAYMENT_TOKEN" != "null" ]; then
  echo -e "\n📋 Step 3: Checking payment status..."
  STATUS_RESPONSE=$(curl -s -X GET "$BASE_URL/paytech/status/$PAYMENT_TOKEN" \
    -H "Content-Type: application/json")

  echo "Payment Status Response:"
  echo "$STATUS_RESPONSE" | jq '.' 2>/dev/null || echo "$STATUS_RESPONSE"
else
  echo -e "\n⚠️  No payment token available, skipping status check"
fi

echo -e "\n--------------------------------------------------"

# Step 4: Test IPN webhook simulation
if [ -n "$ORDER_NUMBER" ] && [ "$ORDER_NUMBER" != "null" ]; then
  echo -e "\n📋 Step 4: Simulating IPN webhook callback..."

  # Simulate successful payment IPN
  IPN_DATA=$(cat <<EOF
{
  "type_event": "sale_complete",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "5000",
  "transaction_id": "TEST_TXN_$(date +%s)",
  "success": "1",
  "hmac_compute": "$(echo -n "5000|$ORDER_NUMBER|f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa" | openssl dgst -sha256 -hmac "70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b" | cut -d' ' -f2)"
}
EOF
)

  echo "Sending IPN data:"
  echo "$IPN_DATA" | jq '.' 2>/dev/null || echo "$IPN_DATA"

  IPN_RESPONSE=$(curl -s -X POST "$BASE_URL/paytech/ipn-callback" \
    -H "Content-Type: application/json" \
    -d "$IPN_DATA")

  echo "IPN Response:"
  echo "$IPN_RESPONSE" | jq '.' 2>/dev/null || echo "$IPN_RESPONSE"
else
  echo -e "\n⚠️  No order number available, skipping IPN simulation"
fi

echo -e "\n--------------------------------------------------"

# Step 5: Verify order status update
if [ -n "$ORDER_ID" ] && [ "$ORDER_ID" != "null" ]; then
  echo -e "\n📋 Step 5: Verifying order status after payment..."

  # Get order details
  ORDER_DETAILS=$(curl -s -X GET "$BASE_URL/orders/$ORDER_ID" \
    -H "Content-Type: application/json")

  echo "Updated Order Details:"
  echo "$ORDER_DETAILS" | jq '.' 2>/dev/null || echo "$ORDER_DETAILS"

  # Extract payment status
  PAYMENT_STATUS=$(echo "$ORDER_DETAILS" | jq -r '.data.paymentStatus' 2>/dev/null)
  ORDER_STATUS=$(echo "$ORDER_DETAILS" | jq -r '.data.status' 2>/dev/null)

  echo -e "\nFinal Status:"
  echo "Payment Status: $PAYMENT_STATUS"
  echo "Order Status: $ORDER_STATUS"

  if [ "$PAYMENT_STATUS" = "PAID" ] && [ "$ORDER_STATUS" = "CONFIRMED" ]; then
    echo -e "\n✅ SUCCESS: Payment integration working correctly!"
  else
    echo -e "\n⚠️  Payment status not updated as expected"
  fi
else
  echo -e "\n⚠️  No order ID available, skipping order verification"
fi

echo -e "\n======================================"
echo "🧪 PayTech Integration Test Complete"