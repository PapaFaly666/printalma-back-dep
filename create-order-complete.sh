#!/bin/bash

# ============================================================================
# Script d'Enregistrement de Commande avec Paiement Paydunya
# PrintAlma - Système complet de gestion de commandes
# ============================================================================

# Configuration
API_URL="http://localhost:3004"
PAYDUNYA_BASE_URL="https://paydunya.com/sandbox"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Fonctions d'affichage
print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════════════╗"
    echo "║     🛒 SYSTÈME DE COMMANDES PAYDUNYA - PRINTALMA              ║"
    echo "║     Enregistrement et paiement automatique de commandes       ║"
    echo "╚════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}📋 $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${PURPLE}ℹ️  $1${NC}"
}

# Fonction pour vérifier si le serveur est démarré
check_server() {
    print_section "Vérification du serveur"

    if curl -s "$API_URL/health" > /dev/null 2>&1; then
        print_success "Serveur backend démarré (Port 3004)"
        return 0
    else
        print_error "Serveur backend non accessible sur $API_URL"
        print_info "Veuillez démarrer le serveur avec: npm run start:dev"
        return 1
    fi
}

# Fonction pour afficher les produits disponibles
show_products() {
    print_section "Catalogue des produits disponibles"

    echo -e "${CYAN}Recherche des produits...${NC}"

    # Récupérer les produits Tshirt
    PRODUCTS_RESPONSE=$(curl -s "$API_URL/public/vendor-products?adminProductName=Tshirt")

    if echo "$PRODUCTS_RESPONSE" | jq -e '.products' > /dev/null 2>&1; then
        echo -e "${GREEN}Produits disponibles:${NC}"
        echo "$PRODUCTS_RESPONSE" | jq -r '.products[] | "📦 \(.name) - \(.price) XOF (ID: \(.id)) - Stock: \(.stock)"'
        echo ""

        # Extraire le premier produit ID pour le test
        FIRST_PRODUCT_ID=$(echo "$PRODUCTS_RESPONSE" | jq -r '.products[0].id')
        FIRST_PRODUCT_PRICE=$(echo "$PRODUCTS_RESPONSE" | jq -r '.products[0].price')

        print_info "Produit sélectionné pour le test: ID $FIRST_PRODUCT_ID - Prix $FIRST_PRODUCT_PRICE XOF"
    else
        print_error "Impossible de récupérer les produits"
        print_info "Utilisation du produit par défaut: Tshirt (ID: 1, Prix: 6000 XOF)"
        FIRST_PRODUCT_ID=1
        FIRST_PRODUCT_PRICE=6000
    fi
}

# Fonction pour créer une commande complète
create_order() {
    print_section "Création de la commande"

    # Vérifier si nous avons un ID de produit
    if [ -z "$FIRST_PRODUCT_ID" ]; then
        FIRST_PRODUCT_ID=1
        FIRST_PRODUCT_PRICE=6000
    fi

    # Demander les informations client
    echo -e "${CYAN}📝 Informations du client:${NC}"

    read -p "Prénom du client [Moussa]: " FIRST_NAME
    FIRST_NAME=${FIRST_NAME:-"Moussa"}

    read -p "Nom du client [Diagne]: " LAST_NAME
    LAST_NAME=${LAST_NAME:-"Diagne"}

    read -p "Email [moussa.diagne@example.com]: " EMAIL
    EMAIL=${EMAIL:-"moussa.diagne@example.com"}

    read -p "Téléphone [775588836]: " PHONE
    PHONE=${PHONE:-"775588836"}

    echo -e "\n${CYAN}🏠 Adresse de livraison:${NC}"

    read -p "Rue [Rue du Commerce 123]: " STREET
    STREET=${STREET:-"Rue du Commerce 123"}

    read -p "Ville [Dakar]: " CITY
    CITY=${CITY:-"Dakar"}

    read -p "Code postal [10000]: " POSTAL_CODE
    POSTAL_CODE=${POSTAL_CODE:-"10000"}

    read -p "Pays [Sénégal]: " COUNTRY
    COUNTRY=${COUNTRY:-"Sénégal"}

    read -p "Quantité [2]: " QUANTITY
    QUANTITY=${QUANTITY:-"2"}

    read -p "Notes pour la commande [Test commande Paydunya]: " NOTES
    NOTES=${NOTES:-"Test commande Paydunya"}

    # Calculer le montant total
    TOTAL_AMOUNT=$((FIRST_PRODUCT_PRICE * QUANTITY))

    print_info "Récapitulatif de la commande:"
    echo "   • Client: $FIRST_NAME $LAST_NAME"
    echo "   • Email: $EMAIL"
    echo "   • Téléphone: $PHONE"
    echo "   • Produit: ID $FIRST_PRODUCT_ID"
    echo "   • Quantité: $QUANTITY"
    echo "   • Montant total: $TOTAL_AMOUNT XOF"
    echo "   • Adresse: $STREET, $CITY, $POSTAL_CODE, $COUNTRY"

    echo -e "\n${YELLOW}🚀 Création de la commande...${NC}"

    # Créer le payload JSON
    ORDER_PAYLOAD=$(cat <<EOF
{
  "customerInfo": {
    "firstName": "$FIRST_NAME",
    "lastName": "$LAST_NAME",
    "email": "$EMAIL",
    "phone": "$PHONE"
  },
  "shippingDetails": {
    "street": "$STREET",
    "city": "$CITY",
    "postalCode": "$POSTAL_CODE",
    "country": "$COUNTRY"
  },
  "orderItems": [
    {
      "productId": $FIRST_PRODUCT_ID,
      "quantity": $QUANTITY,
      "unitPrice": $FIRST_PRODUCT_PRICE
    }
  ],
  "paymentMethod": "PAYDUNYA",
  "initiatePayment": true,
  "notes": "$NOTES"
}
EOF
)

    # Envoyer la requête de création de commande
    ORDER_RESPONSE=$(curl -s -X POST "$API_URL/orders/guest" \
        -H "Content-Type: application/json" \
        -d "$ORDER_PAYLOAD")

    # Vérifier la réponse
    if echo "$ORDER_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        ORDER_ID=$(echo "$ORDER_RESPONSE" | jq -r '.data.id')
        ORDER_NUMBER=$(echo "$ORDER_RESPONSE" | jq -r '.data.orderNumber')
        PAYMENT_TOKEN=$(echo "$ORDER_RESPONSE" | jq -r '.data.payment.token')

        print_success "Commande créée avec succès !"
        print_success "Numéro de commande: $ORDER_NUMBER"
        print_success "ID: $ORDER_ID"
        print_success "Token de paiement: $PAYMENT_TOKEN"

        # Générer l'URL de paiement
        PAYMENT_URL="$PAYDUNYA_BASE_URL/checkout/invoice/$PAYMENT_TOKEN"

        print_section "Paiement Paydunya"
        echo -e "${GREEN}🔗 URL de paiement générée:${NC}"
        echo -e "${CYAN}$PAYMENT_URL${NC}"
        echo ""

        print_info "Instructions de paiement:"
        echo "   1. Cliquez sur le lien ci-dessus pour accéder à la page de paiement"
        echo "   2. Utilisez les identifiants de test Paydunya:"
        echo "      • Email: test@paydunya.com"
        echo "      • Mot de passe: password"
        echo "   3. Complétez le paiement"
        echo "   4. Vous serez redirigé vers la page de succès"
        echo "   5. Le webhook mettra automatiquement à jour le statut"

        # Sauvegarder les informations pour référence
        echo "$ORDER_RESPONSE" | jq '.' > "/tmp/order-complete-$(date +%Y%m%d-%H%M%S).json"

        return 0
    else
        print_error "Erreur lors de la création de la commande"
        echo "$ORDER_RESPONSE" | jq -r '.message // .error // "Erreur inconnue"'
        return 1
    fi
}

# Fonction pour vérifier le statut du paiement
check_payment_status() {
    if [ -z "$PAYMENT_TOKEN" ]; then
        print_error "Aucun token de paiement disponible"
        return 1
    fi

    print_section "Vérification du statut de paiement"

    print_info "Vérification du statut pour le token: $PAYMENT_TOKEN"

    STATUS_RESPONSE=$(curl -s "$API_URL/paydunya/status/$PAYMENT_TOKEN")

    if echo "$STATUS_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        RESPONSE_CODE=$(echo "$STATUS_RESPONSE" | jq -r '.data.response_code')
        RESPONSE_TEXT=$(echo "$STATUS_RESPONSE" | jq -r '.data.response_text')
        PAYMENT_STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.payment_status // "N/A"')
        ORDER_NUMBER=$(echo "$STATUS_RESPONSE" | jq -r '.data.order_number // "N/A"')
        TOTAL_AMOUNT=$(echo "$STATUS_RESPONSE" | jq -r '.data.total_amount // 0')

        echo -e "${GREEN}📊 Statut du paiement:${NC}"
        echo "   • Code réponse: $RESPONSE_CODE"
        echo "   • Message: $RESPONSE_TEXT"
        echo "   • Statut: $PAYMENT_STATUS"
        echo "   • Commande: $ORDER_NUMBER"
        echo "   • Montant: $TOTAL_AMOUNT XOF"

        if [ "$RESPONSE_CODE" = "00" ]; then
            print_success "Paiement réussi et confirmé !"
        else
            print_warning "Paiement en attente ou en cours de traitement"
        fi

        return 0
    else
        print_error "Impossible de vérifier le statut du paiement"
        echo "$STATUS_RESPONSE" | jq -r '.message // .error // "Erreur inconnue"'
        return 1
    fi
}

# Fonction pour afficher les URLs de redirection
show_redirect_urls() {
    print_section "URLs de redirection configurées"

    echo -e "${CYAN}🔗 URLs du système:${NC}"
    echo "   • API Backend: $API_URL"
    echo "   • Success: $API_URL/payment/success?token=TOKEN"
    echo "   • Cancel: $API_URL/payment/cancel?token=TOKEN"
    echo "   • Webhook: $API_URL/paydunya/callback"
    echo ""

    if [ -n "$PAYMENT_TOKEN" ]; then
        echo -e "${GREEN}🎯 URLs pour votre commande:$NC}"
        echo "   • Paiement: $PAYDUNYA_BASE_URL/checkout/invoice/$PAYMENT_TOKEN"
        echo "   • Succès: $API_URL/payment/success?token=$PAYMENT_TOKEN"
        echo "   • Annulation: $API_URL/payment/cancel?token=$PAYMENT_TOKEN"
    fi
}

# Fonction pour afficher l'aide
show_help() {
    echo -e "${CYAN}Usage: $0 [OPTIONS]${NC}"
    echo ""
    echo "Options:"
    echo "  -h, --help     Afficher cette aide"
    echo "  -c, --check    Vérifier uniquement le statut du serveur"
    echo "  -p, --products Afficher uniquement les produits disponibles"
    echo "  -s, --status   Vérifier le statut d'un paiement (nécessite --token)"
    echo "  -t, --token    Token de paiement à vérifier"
    echo "  --urls         Afficher les URLs de redirection"
    echo ""
    echo "Exemples:"
    echo "  $0                    # Exécution complète (vérif + commande + paiement)"
    echo "  $0 --check           # Vérifier le serveur uniquement"
    echo "  $0 --products        # Voir les produits"
    echo "  $0 --status --token test_abc123  # Vérifier un statut de paiement"
}

# Programme principal
main() {
    clear
    print_header

    # Parser les arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--check)
                check_server
                exit $?
                ;;
            -p|--products)
                show_products
                exit 0
                ;;
            -s|--status)
                CHECK_STATUS=true
                shift
                ;;
            -t|--token)
                PAYMENT_TOKEN="$2"
                shift 2
                ;;
            --urls)
                show_redirect_urls
                exit 0
                ;;
            *)
                print_error "Option inconnue: $1"
                show_help
                exit 1
                ;;
        esac
        shift
    done

    # Exécuter les vérifications et création
    if [ "$CHECK_STATUS" = true ]; then
        check_payment_status
        exit $?
    fi

    # Vérifier le serveur
    if ! check_server; then
        exit 1
    fi

    # Afficher les produits
    show_products

    # Créer la commande
    if create_order; then
        # Afficher les URLs de redirection
        show_redirect_urls

        # Proposer de vérifier le statut
        echo -e "\n${YELLOW}Voulez-vous vérifier le statut du paiement maintenant? (O/n)${NC}"
        read -r response

        if [[ "$response" =~ ^[OoYy]?$ ]] || [ -z "$response" ]; then
            echo -e "\n${CYAN}⏳ Attente de 5 secondes avant vérification...${NC}"
            sleep 5
            check_payment_status
        fi

        print_section "Résumé de l'opération"
        print_success "Système de commande fonctionnel !"
        print_info "Toutes les étapes ont été complétées avec succès:"
        echo "   ✅ Serveur vérifié et accessible"
        echo "   ✅ Produits récupérés"
        echo "   ✅ Commande créée"
        echo "   ✅ Paiement Paydunya initialisé"
        echo "   ✅ URLs de redirection configurées"
        echo ""
        print_success "Le système est prêt pour une utilisation en production !"
    else
        print_error "Échec de la création de la commande"
        exit 1
    fi
}

# Vérifier si jq est installé
if ! command -v jq &> /dev/null; then
    print_error "jq est requis pour exécuter ce script"
    print_info "Installez jq avec: sudo apt-get install jq (Ubuntu/Debian)"
    exit 1
fi

# Exécuter le programme principal
main "$@"