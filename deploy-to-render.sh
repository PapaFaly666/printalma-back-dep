#!/bin/bash

echo "🚀 Script de déploiement vers Render"

# Configuration Git si nécessaire
echo "🔧 Configuration Git..."
git config --global user.name "Printalma Dev"
git config --global user.email "dev@printalma.com"

# Vérification du statut
echo "📊 Statut Git actuel:"
git status

# Ajout des fichiers modifiés
echo "📦 Ajout des fichiers modifiés..."
git add src/product/product.service.ts
git add src/product/dto/update-product.dto.ts

# Commit avec message détaillé
echo "💾 Création du commit..."
git commit -m "🔧 Fix suggestedPrice not being saved in products

✅ Corrections appliquées:
- Add suggestedPrice to create() method in ProductService
- Add suggestedPrice to createReadyProduct() method  
- Add suggestedPrice to updateReadyProduct() method
- Update UpdateProductDto validation for suggestedPrice
- Add error handling in updateProduct() method

🎯 Problème résolu: Le suggestedPrice n'était pas sauvegardé lors de la création/modification de produits

🚀 Déployé automatiquement sur Render"

# Push vers origin
echo "🌐 Push vers GitHub/Render..."
git push origin main

if [ $? -eq 0 ]; then
    echo "✅ Déploiement réussi!"
    echo "⏳ Attendez quelques minutes que Render redéploie automatiquement"
    echo "🔍 Surveillez les logs de déploiement sur render.com"
else
    echo "❌ Erreur lors du push"
    echo "📋 Actions manuelles requises:"
    echo "   1. Allez sur render.com"
    echo "   2. Trouvez votre service printalma-back-dep" 
    echo "   3. Cliquez sur 'Manual Deploy'"
    echo "   4. Sélectionnez 'Deploy latest commit'"
fi