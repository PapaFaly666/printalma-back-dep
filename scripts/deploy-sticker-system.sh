#!/bin/bash

# Script de déploiement du système de stickers
# Date: 2025-12-24

set -e  # Arrêter en cas d'erreur

echo "🚀 Déploiement du système de stickers Printalma"
echo "================================================"
echo ""

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Fonction pour afficher les messages
function info() {
    echo -e "${GREEN}✓${NC} $1"
}

function warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

function error() {
    echo -e "${RED}✗${NC} $1"
}

# Vérifier que nous sommes dans le bon répertoire
if [ ! -f "package.json" ]; then
    error "Erreur: package.json introuvable. Êtes-vous dans le bon répertoire?"
    exit 1
fi

info "Répertoire de travail: $(pwd)"
echo ""

# Étape 1: Générer le client Prisma
echo "📦 Étape 1/4: Génération du client Prisma..."
npx prisma generate
info "Client Prisma généré"
echo ""

# Étape 2: Appliquer les migrations (mode développement)
echo "🗄️ Étape 2/4: Application des migrations..."
read -p "Voulez-vous appliquer les migrations via Prisma? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    npx prisma migrate dev --name add_sticker_system
    info "Migrations appliquées via Prisma"
else
    warning "Migration non appliquée. Vous devrez l'appliquer manuellement."
    echo "Utilisez: psql -d votre_database -f prisma/migrations/add_sticker_system.sql"
fi
echo ""

# Étape 3: Insérer les données de seed
echo "🌱 Étape 3/4: Insertion des données de seed..."
read -p "Voulez-vous insérer les données de seed (tailles et finitions)? (o/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Oo]$ ]]; then
    # Vérifier si DATABASE_URL est défini
    if [ -z "$DATABASE_URL" ]; then
        warning "DATABASE_URL non défini. Chargement depuis .env..."
        export $(cat .env | grep DATABASE_URL | xargs)
    fi

    # Extraire les informations de connexion depuis DATABASE_URL
    if command -v psql &> /dev/null; then
        psql $DATABASE_URL -f prisma/seed-sticker-data.sql
        info "Données de seed insérées"
    else
        error "psql non trouvé. Installez PostgreSQL client ou exécutez le script manuellement"
        echo "Commande: psql -d votre_database -f prisma/seed-sticker-data.sql"
    fi
else
    warning "Données de seed non insérées"
fi
echo ""

# Étape 4: Vérifier la compilation TypeScript
echo "🔧 Étape 4/4: Vérification de la compilation..."
if npm run build > /dev/null 2>&1; then
    info "Compilation TypeScript réussie"
else
    error "Erreur de compilation TypeScript"
    echo "Exécutez 'npm run build' pour voir les erreurs détaillées"
    exit 1
fi
echo ""

# Résumé
echo "================================================"
echo "🎉 Déploiement terminé avec succès!"
echo ""
echo "📋 Résumé:"
echo "  - Schema Prisma: ✓"
echo "  - Migrations: $([ $REPLY =~ ^[Oo]$ ] && echo '✓' || echo '⚠ Manuel requis')"
echo "  - Seed data: $([ $REPLY =~ ^[Oo]$ ] && echo '✓' || echo '⚠ Manuel requis')"
echo "  - Compilation: ✓"
echo ""
echo "📚 Prochaines étapes:"
echo "  1. Redémarrer l'application: npm run start:dev"
echo "  2. Tester les endpoints: /vendor/stickers et /public/stickers"
echo "  3. Importer la collection Postman: STICKER_POSTMAN_COLLECTION.json"
echo "  4. Consulter la documentation: STICKER_IMPLEMENTATION_GUIDE.md"
echo ""
echo "🔗 Endpoints disponibles:"
echo "  - POST   /vendor/stickers          (Créer un sticker)"
echo "  - GET    /vendor/stickers          (Lister mes stickers)"
echo "  - GET    /vendor/stickers/:id      (Détails d'un sticker)"
echo "  - PUT    /vendor/stickers/:id      (Mettre à jour)"
echo "  - DELETE /vendor/stickers/:id      (Supprimer)"
echo "  - GET    /public/stickers          (Liste publique)"
echo "  - GET    /public/stickers/configurations (Tailles/finitions)"
echo "  - GET    /public/stickers/:id      (Détails publics)"
echo ""
echo "================================================"
