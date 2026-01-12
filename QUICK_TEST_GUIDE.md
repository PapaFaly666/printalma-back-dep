# Guide de Test Rapide - Génération de Stickers V2.0

**Objectif:** Tester rapidement la nouvelle fonctionnalité de génération de stickers avec les 24 layers.

---

## 🚀 Test 1 : Création d'un Sticker Simple

### Prérequis
- Backend démarré (`npm start` ou `npm run start:dev`)
- Token d'authentification vendeur valide
- Design validé existant (avec son ID)

### Commande cURL

```bash
curl -X POST http://localhost:3000/vendor/stickers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 123,
    "name": "Test Autocollant avec Effets",
    "description": "Sticker de test avec 24 layers",
    "size": {
      "width": 8.3,
      "height": 10
    },
    "finish": "glossy",
    "shape": "DIE_CUT",
    "price": 2000,
    "stockQuantity": 50,
    "minimumQuantity": 1,
    "stickerType": "autocollant",
    "borderColor": "glossy-white"
  }'
```

**Remplacez:**
- `YOUR_TOKEN_HERE` par votre token JWT
- `123` par l'ID d'un design validé

### Réponse Attendue

```json
{
  "success": true,
  "message": "Sticker créé avec succès",
  "productId": 456,
  "data": {
    "id": 456,
    "vendorId": 1,
    "designId": 123,
    "name": "Test Autocollant avec Effets",
    "imageUrl": "https://res.cloudinary.com/.../sticker_456_design_123_*.png",
    "finalPrice": 2000,
    "status": "PENDING"
  }
}
```

### Logs Backend Attendus

```
🎨 Génération du sticker 980x1181px
📐 Image originale: 800x1000px (png)
🖼️ Ajout bordure épaisse 10px (style cartoon/sticker)
✅ Bordure cartoon créée: 16 layers blanches + 4 layers de définition
🌑 Ajout ombre portée (effet 3D autocollant)
✨ Application effet glossy (brightness +15%, saturation +10%, contrast +10%)
🔵 Application masque circulaire
✅ Sticker généré avec succès (856234 bytes)
☁️ Upload sticker sur Cloudinary (produit 456, design 123)
✅ Sticker uploadé: https://res.cloudinary.com/.../sticker_456.png
✅ Sticker créé avec succès: https://...
```

**Vérifications:**
- ✅ Logs mentionnent "16 layers blanches + 4 layers de définition"
- ✅ Logs mentionnent "Ajout ombre portée"
- ✅ Logs mentionnent "Application effet glossy"
- ✅ Temps de génération entre 2-8 secondes

---

## 🔍 Test 2 : Vérification Visuelle

### 1. Ouvrir l'image générée

Copier l'URL `imageUrl` retournée et l'ouvrir dans un navigateur.

### 2. Checklist Visuelle

**Contour Blanc Épais:**
- [ ] Le contour blanc est bien visible (environ 10px)
- [ ] Le contour est uniforme sur tous les côtés
- [ ] Le contour a un aspect "cartoon/sticker"

**Contour de Définition:**
- [ ] Un fin contour gris foncé est visible autour du design
- [ ] Ce contour aide à définir les bords du design

**Ombre Portée:**
- [ ] Une ombre est visible en bas et à droite de l'image
- [ ] L'ombre a un flou progressif (effet 3D)
- [ ] L'ombre donne de la profondeur au sticker

**Fond Transparent:**
- [ ] Le fond de l'image est transparent (pas de rectangle blanc)
- [ ] L'image peut être placée sur n'importe quel fond

**Effet Glossy:**
- [ ] Les couleurs sont vives et saturées
- [ ] L'image a un aspect brillant
- [ ] Le contraste est augmenté

### 3. Comparaison avec CSS

Si vous avez accès au frontend avec les aperçus CSS:

1. Ouvrir l'aperçu CSS du même design
2. Comparer avec l'image générée
3. Vérifier que les effets sont identiques

**Points de comparaison:**
- Épaisseur du contour blanc
- Présence du contour de définition
- Profondeur de l'ombre portée
- Intensité des couleurs

---

## 🧪 Test 3 : Test avec Différentes Configurations

### Test A : Sans Bordure (transparent)

```bash
curl -X POST http://localhost:3000/vendor/stickers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 123,
    "name": "Test Sans Bordure",
    "size": {"width": 8.3, "height": 10},
    "finish": "glossy",
    "shape": "SQUARE",
    "price": 2000,
    "stockQuantity": 50,
    "stickerType": "autocollant",
    "borderColor": "transparent"
  }'
```

**Vérification:**
- Pas de bordure blanche
- Pas d'ombre portée
- Juste le design redimensionné

### Test B : Pare-chocs (bordure simple)

```bash
curl -X POST http://localhost:3000/vendor/stickers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 123,
    "name": "Test Pare-chocs",
    "size": {"width": 15, "height": 20},
    "finish": "glossy",
    "shape": "RECTANGLE",
    "price": 3500,
    "stockQuantity": 30,
    "stickerType": "pare-chocs"
  }'
```

**Vérification:**
- Bordure blanche large (25px) mais simple
- Pas de layers complexes (1 seule bordure)
- Fond blanc opaque

### Test C : Forme Circulaire

```bash
curl -X POST http://localhost:3000/vendor/stickers \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 123,
    "name": "Test Circulaire",
    "size": {"width": 10, "height": 10},
    "finish": "glossy",
    "shape": "CIRCLE",
    "price": 2500,
    "stockQuantity": 50,
    "stickerType": "autocollant",
    "borderColor": "glossy-white"
  }'
```

**Logs Attendus Supplémentaires:**
```
🔵 Application masque circulaire
```

**Vérification:**
- L'image est découpée en cercle
- La bordure suit le cercle
- L'ombre suit le cercle

---

## ⏱️ Test 4 : Performance

### Mesurer le Temps de Génération

Exécuter le test 1 et chronométrer le temps entre l'envoi de la requête et la réception de la réponse.

**Temps attendus:**
- Petit sticker (5x5 cm): 2-4 secondes
- Moyen (8-10 cm): 4-8 secondes
- Grand (15-20 cm): 8-15 secondes

**Si le temps est trop long:**
1. Vérifier la vitesse de connexion à Cloudinary
2. Vérifier la taille du design original
3. Considérer l'implémentation d'une queue de jobs

### Mesurer le Temps d'Affichage Frontend

1. Créer plusieurs stickers (au moins 10)
2. Afficher une grille de stickers dans le frontend
3. Mesurer le temps de rendu avec les DevTools

**Temps attendus:**
- Avec images PNG: <50ms pour 10 stickers
- Avec CSS (avant): 500-1000ms pour 10 stickers

---

## 🐛 Troubleshooting

### Erreur: "Design introuvable ou non validé"

**Solution:**
- Vérifier que le `designId` existe
- Vérifier que le design est validé (`isValidated: true`)
- Vérifier que le design appartient au vendeur authentifié

### Erreur: "Impossible de télécharger l'image"

**Solution:**
- Vérifier que l'URL Cloudinary du design est accessible
- Vérifier la connexion internet
- Vérifier les credentials Cloudinary

### Erreur: "Upload Cloudinary échoué"

**Solution:**
- Vérifier les variables d'environnement Cloudinary
- Vérifier le quota Cloudinary
- Vérifier les permissions du dossier "vendor-stickers"

### Pas d'effets visuels visibles

**Solution:**
- Vérifier les logs backend (doivent mentionner les layers)
- Vérifier que `stickerType: "autocollant"` (pas "pare-chocs")
- Vérifier que `borderColor` n'est pas "transparent"

### Temps de génération très long (>30s)

**Raisons possibles:**
- Design original très grand (>10 MB)
- Connexion Cloudinary lente
- Serveur surchargé

**Solutions:**
- Réduire la taille des designs originaux
- Implémenter une queue de jobs (Bull + Redis)
- Augmenter les ressources serveur

---

## ✅ Checklist Complète

### Backend
- [ ] Serveur démarré sans erreurs
- [ ] Sharp installé (`npm list sharp`)
- [ ] Cloudinary configuré (variables d'environnement)
- [ ] Prisma client généré (`npx prisma generate`)

### Test API
- [ ] Création sticker réussie (status 201)
- [ ] Image générée et uploadée
- [ ] URL Cloudinary retournée
- [ ] Logs complets visibles

### Test Visuel
- [ ] Contour blanc épais visible
- [ ] Contour de définition présent
- [ ] Ombre portée 3D visible
- [ ] Fond transparent
- [ ] Effet glossy (couleurs vives)

### Performance
- [ ] Génération en <15 secondes
- [ ] Affichage frontend rapide (<5ms)
- [ ] Pas de lag avec 10+ stickers

---

## 📝 Rapport de Test

**Format suggéré:**

```
Date: [DATE]
Testeur: [NOM]
Version: 2.0.0

RÉSULTATS:
- Test 1 (Création simple): ✅/❌
  Temps: [X] secondes
  URL: [URL]

- Test 2 (Vérification visuelle): ✅/❌
  Contours: ✅/❌
  Ombre: ✅/❌
  Glossy: ✅/❌

- Test 3 (Configurations): ✅/❌
  Sans bordure: ✅/❌
  Pare-chocs: ✅/❌
  Circulaire: ✅/❌

- Test 4 (Performance): ✅/❌
  Génération: [X]s (attendu: <8s)
  Affichage: [X]ms (attendu: <5ms)

NOTES:
[Observations, bugs, améliorations suggérées]
```

---

## 🎯 Critères de Succès

Le test est réussi si:

1. ✅ Le sticker est créé sans erreurs
2. ✅ Les logs mentionnent les 24 layers (16+4+3+1)
3. ✅ L'image a un contour blanc épais visible
4. ✅ L'ombre portée est présente
5. ✅ Le fond est transparent
6. ✅ Les couleurs sont vives (effet glossy)
7. ✅ Le temps de génération est acceptable (<15s)
8. ✅ Le rendu est identique à l'aperçu CSS

---

**Auteur:** Claude Sonnet 4.5
**Date:** 11 janvier 2026
**Version:** 1.0.0
