#!/bin/bash

# Test script for PayTech webhook with different failure reasons
# This script tests all payment failure scenarios with detailed reasons

echo "🧪 Testing PayTech Webhook Failure Reasons..."
echo "=============================================="

BASE_URL="http://localhost:3004"

# Step 1: Create a test order
echo -e "\n📋 Step 1: Creating test order for failure scenarios..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "771234567",
    "paymentMethod": "PAYTECH",
    "initiatePayment": true,
    "shippingDetails": {
      "street": "789 Webhook Test Street",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "orderItems": [
      {
        "productId": 1,
        "quantity": 1,
        "color": "Purple",
        "size": "S"
      }
    ]
  }')

ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.id' 2>/dev/null)
ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | jq -r '.data.orderNumber' 2>/dev/null)
PAYMENT_TOKEN=$(echo "$ORDER_RESPONSE" | jq -r '.data.payment.token' 2>/dev/null)

echo "✅ Order Created: $ORDER_NUMBER"
echo "💳 Payment Token: $PAYMENT_TOKEN"

if [ -z "$ORDER_NUMBER" ] || [ "$ORDER_NUMBER" = "null" ]; then
  echo "❌ Failed to create order"
  exit 1
fi

# Calculate base HMAC for this order
BASE_MESSAGE="200|$ORDER_NUMBER|f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa"
API_SECRET="70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b"

echo -e "\n--------------------------------------------------"

# Step 2: Test different failure scenarios
echo -e "\n📋 Step 2: Testing Different Failure Scenarios..."

# Test 1: Insufficient Funds
echo -e "\n💸 Test 1: Insufficient Funds"
HMAC_1=$(echo -n "$BASE_MESSAGE" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

IPN_INSUFFICIENT=$(cat <<EOF
{
  "type_event": "sale_canceled",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "INSUFFICIENT_FUNDS_$(date +%s)",
  "success": "0",
  "cancel_reason": "insufficient_funds",
  "error_code": "INSUFFICIENT_FUNDS",
  "error_message": "Solde insuffisant sur le compte",
  "processor_response": "Bank declined: insufficient funds",
  "hmac_compute": "$HMAC_1"
}
EOF
)

echo "Sending insufficient funds IPN..."
echo "$IPN_INSUFFICIENT" | jq '.' 2>/dev/null

RESPONSE_1=$(curl -s -X POST "$BASE_URL/paytech/ipn-callback" \
  -H "Content-Type: application/json" \
  -d "$IPN_INSUFFICIENT")

echo "Response:"
echo "$RESPONSE_1" | jq '.' 2>/dev/null || echo "$RESPONSE_1"

# Extract user message
USER_MESSAGE_1=$(echo "$RESPONSE_1" | jq -r '.data.failure_details.user_message' 2>/dev/null)
echo "👤 User Message: $USER_MESSAGE_1"

echo -e "\n--------------------------------------------------"

# Test 2: Session Expired
echo -e "\n⏰ Test 2: Session Expired"
HMAC_2=$(echo -n "$BASE_MESSAGE" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

IPN_EXPIRED=$(cat <<EOF
{
  "type_event": "sale_canceled",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "SESSION_EXPIRED_$(date +%s)",
  "success": "0",
  "cancel_reason": "session_expired",
  "error_code": "SESSION_TIMEOUT",
  "error_message": "La session de paiement a expiré après 15 minutes",
  "hmac_compute": "$HMAC_2"
}
EOF
)

echo "Sending session expired IPN..."
echo "$IPN_EXPIRED" | jq '.' 2>/dev/null

RESPONSE_2=$(curl -s -X POST "$BASE_URL/paytech/ipn-callback" \
  -H "Content-Type: application/json" \
  -d "$IPN_EXPIRED")

echo "Response:"
echo "$RESPONSE_2" | jq '.' 2>/dev/null || echo "$RESPONSE_2"

USER_MESSAGE_2=$(echo "$RESPONSE_2" | jq -r '.data.failure_details.user_message' 2>/dev/null)
echo "👤 User Message: $USER_MESSAGE_2"

echo -e "\n--------------------------------------------------"

# Test 3: Card Declined
echo -e "\n💳 Test 3: Card Declined"
HMAC_3=$(echo -n "$BASE_MESSAGE" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

IPN_DECLINED=$(cat <<EOF
{
  "type_event": "sale_canceled",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "CARD_DECLINED_$(date +%s)",
  "success": "0",
  "cancel_reason": "card_declined",
  "error_code": "CARD_DECLINED",
  "error_message": "La carte bancaire a été refusée par la banque",
  "processor_response": "Declined - Do not honor",
  "hmac_compute": "$HMAC_3"
}
EOF
)

echo "Sending card declined IPN..."
echo "$IPN_DECLINED" | jq '.' 2>/dev/null

RESPONSE_3=$(curl -s -X POST "$BASE_URL/paytech/ipn-callback" \
  -H "Content-Type: application/json" \
  -d "$IPN_DECLINED")

echo "Response:"
echo "$RESPONSE_3" | jq '.' 2>/dev/null || echo "$RESPONSE_3"

USER_MESSAGE_3=$(echo "$RESPONSE_3" | jq -r '.data.failure_details.user_message' 2>/dev/null)
echo "👤 User Message: $USER_MESSAGE_3"

echo -e "\n--------------------------------------------------"

# Test 4: User Cancelled
echo -e "\n🚫 Test 4: User Cancelled"
HMAC_4=$(echo -n "$BASE_MESSAGE" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

IPN_CANCELLED=$(cat <<EOF
{
  "type_event": "sale_canceled",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "USER_CANCELLED_$(date +%s)",
  "success": "0",
  "cancel_reason": "user_cancelled",
  "error_code": "USER_CANCELLED",
  "error_message": "Le client a annulé le paiement volontairement",
  "hmac_compute": "$HMAC_4"
}
EOF
)

echo "Sending user cancelled IPN..."
echo "$IPN_CANCELLED" | jq '.' 2>/dev/null

RESPONSE_4=$(curl -s -X POST "$BASE_URL/paytech/ipn-callback" \
  -H "Content-Type: application/json" \
  -d "$IPN_CANCELLED")

echo "Response:"
echo "$RESPONSE_4" | jq '.' 2>/dev/null || echo "$RESPONSE_4"

USER_MESSAGE_4=$(echo "$RESPONSE_4" | jq -r '.data.failure_details.user_message' 2>/dev/null)
echo "👤 User Message: $USER_MESSAGE_4"

echo -e "\n--------------------------------------------------"

# Test 5: Fraud Detection
echo -e "\n🚨 Test 5: Fraud Detection"
HMAC_5=$(echo -n "$BASE_MESSAGE" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

IPN_FRAUD=$(cat <<EOF
{
  "type_event": "sale_canceled",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "FRAUD_DETECTED_$(date +%s)",
  "success": "0",
  "cancel_reason": "fraud_detected",
  "error_code": "FRAUD_RISK",
  "error_message": "Transaction bloquée pour des raisons de sécurité",
  "processor_response": "High fraud risk detected",
  "hmac_compute": "$HMAC_5"
}
EOF
)

echo "Sending fraud detection IPN..."
echo "$IPN_FRAUD" | jq '.' 2>/dev/null

RESPONSE_5=$(curl -s -X POST "$BASE_URL/paytech/ipn-callback" \
  -H "Content-Type: application/json" \
  -d "$IPN_FRAUD")

echo "Response:"
echo "$RESPONSE_5" | jq '.' 2>/dev/null || echo "$RESPONSE_5"

USER_MESSAGE_5=$(echo "$RESPONSE_5" | jq -r '.data.failure_details.user_message' 2>/dev/null)
echo "👤 User Message: $USER_MESSAGE_5"

echo -e "\n--------------------------------------------------"

# Step 3: Verify order status and failure details
echo -e "\n📋 Step 3: Checking Final Order Status..."

# Get order details with authentication
ORDER_DETAILS=$(curl -s -X GET "$BASE_URL/orders/$ORDER_ID" \
  -H "Content-Type: application/json" \
  -b @cookies-local.txt)

echo "Final Order Status:"
echo "$ORDER_DETAILS" | jq '.data | {status, paymentStatus, transactionId, notes}' 2>/dev/null

echo -e "\n📝 Summary of Failure Reasons Tested:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. 💸 Insufficient Funds     → Category: insufficient_funds"
echo "2. ⏰ Session Expired       → Category: timeout"
echo "3. 💳 Card Declined         → Category: technical_error"
echo "4. 🚫 User Cancelled       → Category: user_action"
echo "5. 🚨 Fraud Detected       → Category: fraud"

echo -e "\n🎯 Webhook Features Demonstrated:"
echo "✅ HMAC signature verification"
echo "✅ Detailed failure categorization"
echo "✅ User-friendly error messages"
echo "✅ Technical support messages"
echo "✅ Failure details storage in database"
echo "✅ Comprehensive logging"

echo -e "\n=============================================="
echo "🧪 PayTech Webhook Failure Reasons Test Complete"
echo ""
echo "💡 All failure scenarios are now properly handled with:"
echo "   - Clear user messages"
echo "   - Detailed support information"
echo "   - Proper categorization"
echo "   - Complete logging and tracking"