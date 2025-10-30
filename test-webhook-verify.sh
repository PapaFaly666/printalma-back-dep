#!/bin/bash

# Test script for the new webhook verification endpoint
# This script demonstrates how to use the webhook verification tool

echo "🔍 Testing PayTech Webhook Verification Endpoint"
echo "=============================================="

BASE_URL="http://localhost:3004"

echo "📍 Available endpoints:"
echo "  - POST /paytech/webhook-verify (New verification tool)"
echo "  - POST /paytech/ipn-callback (Production webhook)"
echo ""

# Test 1: Create a test order first
echo "📋 Step 1: Creating test order for webhook verification..."
ORDER_RESPONSE=$(curl -s -X POST "$BASE_URL/orders/guest" \
  -H "Content-Type: application/json" \
  -d '{
    "phoneNumber": "771234567",
    "paymentMethod": "PAYTECH",
    "initiatePayment": true,
    "shippingDetails": {
      "street": "789 Webhook Verify Street",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "orderItems": [
      {
        "productId": 1,
        "quantity": 1,
        "color": "Magenta",
        "size": "L"
      }
    ]
  }')

ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.id' 2>/dev/null)
ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | jq -r '.data.orderNumber' 2>/dev/null)

echo "✅ Test Order Created: $ORDER_NUMBER"
echo "📦 Order ID: $ORDER_ID"

if [ -z "$ORDER_NUMBER" ] || [ "$ORDER_NUMBER" = "null" ]; then
  echo "❌ Failed to create order"
  exit 1
fi

echo ""
echo "=============================================================="

# Test 2: Verify webhook with correct HMAC (success case)
echo "📋 Step 2: Testing webhook verification - SUCCESS CASE"
echo "----------------------------------------------------"

# Calculate correct HMAC
BASE_MESSAGE="200|$ORDER_NUMBER|f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa"
API_SECRET="70315dc3646985f2e89732e4b505cf94b3057d34aad70db1f623ecc5d016856b"
CORRECT_HMAC=$(echo -n "$BASE_MESSAGE" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)

echo "🔐 Correct HMAC: $CORRECT_HMAC"

SUCCESS_WEBHOOK=$(cat <<EOF
{
  "type_event": "sale_complete",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "VERIFY_SUCCESS_TEST",
  "success": "1",
  "hmac_compute": "$CORRECT_HMAC"
}
EOF
)

echo "📤 Sending SUCCESS webhook to verification endpoint..."
echo "Data: $SUCCESS_WEBHOOK" | jq '.' 2>/dev/null

VERIFY_RESPONSE=$(curl -s -X POST "$BASE_URL/paytech/webhook-verify" \
  -H "Content-Type: application/json" \
  -d "$SUCCESS_WEBHOOK")

echo "📥 Verification Response:"
echo "$VERIFY_RESPONSE" | jq '.' 2>/dev/null || echo "$VERIFY_RESPONSE"

echo ""
echo "=============================================================="

# Test 3: Verify webhook with failure case
echo "📋 Step 3: Testing webhook verification - FAILURE CASE"
echo "-----------------------------------------------------"

FAILURE_WEBHOOK=$(cat <<EOF
{
  "type_event": "sale_canceled",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "VERIFY_FAILED_TEST",
  "success": "0",
  "cancel_reason": "insufficient_funds",
  "error_code": "INSUFFICIENT_FUNDS",
  "error_message": "Solde insuffisant pour le paiement",
  "processor_response": "Bank declined: insufficient funds",
  "hmac_compute": "$CORRECT_HMAC"
}
EOF
)

echo "📤 Sending FAILURE webhook to verification endpoint..."
echo "Data: $FAILURE_WEBHOOK" | jq '.' 2>/dev/null

VERIFY_FAILURE_RESPONSE=$(curl -s -X POST "$BASE_URL/paytech/webhook-verify" \
  -H "Content-Type: application/json" \
  -d "$FAILURE_WEBHOOK")

echo "📥 Failure Verification Response:"
echo "$VERIFY_FAILURE_RESPONSE" | jq '.data.verification_results, .data.failure_analysis' 2>/dev/null || echo "$VERIFY_FAILURE_RESPONSE"

echo ""
echo "=============================================================="

# Test 4: Verify webhook with WRONG HMAC (security test)
echo "📋 Step 4: Testing webhook verification - WRONG HMAC"
echo "---------------------------------------------------"

WRONG_HMAC="1234567890abcdef1234567890abcdef12345678"

WRONG_WEBHOOK=$(cat <<EOF
{
  "type_event": "sale_complete",
  "ref_command": "$ORDER_NUMBER",
  "item_price": "200",
  "transaction_id": "VERIFY_WRONG_HMAC_TEST",
  "success": "1",
  "hmac_compute": "$WRONG_HMAC"
}
EOF
)

echo "📤 Sending webhook with WRONG HMAC..."
echo "Expected HMAC: $CORRECT_HMAC"
echo "Wrong HMAC: $WRONG_HMAC"

VERIFY_WRONG_RESPONSE=$(curl -s -X POST "$BASE_URL/paytech/webhook-verify" \
  -H "Content-Type: application/json" \
  -d "$WRONG_WEBHOOK")

echo "📥 Wrong HMAC Verification Response:"
echo "$VERIFY_WRONG_RESPONSE" | jq '.data.hmac_calculation, .data.verification_results.signature_status, .data.recommendations' 2>/dev/null || echo "$VERIFY_WRONG_RESPONSE"

echo ""
echo "=============================================================="

# Test 5: Verify webhook with NON-EXISTENT ORDER
echo "📋 Step 5: Testing webhook verification - NON-EXISTENT ORDER"
echo "----------------------------------------------------------------"

NONEXISTENT_ORDER="ORD-NONEXISTENT-999999"

NONEXISTENT_WEBHOOK=$(cat <<EOF
{
  "type_event": "sale_complete",
  "ref_command": "$NONEXISTENT_ORDER",
  "item_price": "200",
  "transaction_id": "VERIFY_NONEXISTENT_TEST",
  "success": "1",
  "hmac_compute": "$(echo -n "200|$NONEXISTENT_ORDER|f0f53dfdf8c227f94f3e62a63b27da1bcf9eebee92fb5383bd6a12ac9c3ff1aa" | openssl dgst -sha256 -hmac "$API_SECRET" | cut -d' ' -f2)"
}
EOF
)

echo "📤 Sending webhook for non-existent order: $NONEXISTENT_ORDER"

VERIFY_NONEXISTENT_RESPONSE=$(curl -s -X POST "$BASE_URL/paytech/webhook-verify" \
  -H "Content-Type: application/json" \
  -d "$NONEXISTENT_WEBHOOK")

echo "📥 Non-existent Order Verification Response:"
echo "$VERIFY_NONEXISTENT_RESPONSE" | jq '.data.verification_results.order_lookup_status, .data.recommendations' 2>/dev/null || echo "$VERIFY_NONEXISTENT_RESPONSE"

echo ""
echo "=============================================================="

# Summary
echo "🎯 WEBHOOK VERIFICATION TEST SUMMARY"
echo "===================================="
echo ""
echo "✅ Test 1: Order creation - SUCCESS"
echo "✅ Test 2: Correct HMAC (Success) - See verification details"
echo "✅ Test 3: Correct HMAC (Failure) - See failure analysis"
echo "✅ Test 4: Wrong HMAC - Security verification"
echo "✅ Test 5: Non-existent order - Error handling"
echo ""
echo "🔍 What the verification endpoint provides:"
echo "  • ✅ HMAC signature validation"
echo "  • 📊 Expected vs received HMAC comparison"
echo "  • 💳 Payment success/failure detection"
echo "  • 📝 Failure reason categorization"
echo "  • 🔍 Order lookup verification"
echo "  • 💡 Recommendations for fixes"
echo "  • 🚀 Production endpoint guidance"
echo ""
echo "📚 Usage in Swagger:"
echo "  1. Go to: http://localhost:3004/api"
echo "  2. Find: POST /paytech/webhook-verify"
echo "  3. Use this endpoint to test webhooks safely"
echo "  4. When ready, use: POST /paytech/ipn-callback for production"
echo ""
echo "🚀 Webhook verification endpoint ready for use!"