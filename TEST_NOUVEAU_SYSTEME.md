# 🧪 Tests du Nouveau Système de Brouillon/Publication

## 🎯 Scénarios de Test

### Test 1: Design Validé + Choix Brouillon
```bash
curl -X PUT "http://localhost:3000/vendor-product-validation/set-draft/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <vendor_token>" \
  -d '{"isDraft": true}'
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Produit mis en brouillon (design validé - prêt à publier)",
  "status": "DRAFT",
  "isValidated": true,
  "canPublish": true,
  "designValidationStatus": "validated"
}
```

### Test 2: Design Validé + Choix Publication
```bash
curl -X PUT "http://localhost:3000/vendor-product-validation/set-draft/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <vendor_token>" \
  -d '{"isDraft": false}'
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Produit publié (design validé)",
  "status": "PUBLISHED",
  "isValidated": true,
  "canPublish": false,
  "designValidationStatus": "validated"
}
```

### Test 3: Design Non Validé + Choix Brouillon
```bash
curl -X PUT "http://localhost:3000/vendor-product-validation/set-draft/456" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <vendor_token>" \
  -d '{"isDraft": true}'
```

**Résultat attendu:**
```json
{
  "success": true,
  "message": "Produit en attente (design non validé par l'admin)",
  "status": "PENDING",
  "isValidated": false,
  "canPublish": false,
  "designValidationStatus": "pending"
}
```

### Test 4: Design Non Validé + Choix Publication (✅ LOGIQUE CORRIGÉE)
```bash
curl -X PUT "http://localhost:3000/vendor-product-validation/set-draft/456" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <vendor_token>" \
  -d '{"isDraft": false}'
```

**Résultat attendu (CORRIGÉ):**
```json
{
  "success": true,
  "message": "Produit en attente de validation du design par l'admin",
  "status": "PENDING",
  "isValidated": false,
  "canPublish": false,
  "designValidationStatus": "pending"
}
```

### Test 5: Publication Directe (Raccourci)
```bash
curl -X POST "http://localhost:3000/vendor-product-validation/publish-direct/123" \
  -H "Authorization: Bearer <vendor_token>"
```

**Résultat attendu:** (identique au Test 2)

## 📊 Table de Validation (✅ LOGIQUE FINALE)

| Design Validé | Choix Vendeur | Statut Final | Peut Publier | Message |
|---------------|---------------|--------------|--------------|---------|
| ✅ Oui | Brouillon | DRAFT | ✅ Oui | "Produit mis en brouillon (design validé - prêt à publier)" |
| ✅ Oui | Publication | PUBLISHED | ❌ Non | "Produit publié (design validé)" |
| ❌ Non | Brouillon | PENDING | ❌ Non | "Produit en attente (design non validé par l'admin)" |
| ❌ Non | Publication | **PENDING** | ❌ Non | "Produit en attente de validation du design par l'admin" |

## 🔄 Tests de Transition

### Scénario A: PENDING → DRAFT (après validation admin)
1. Produit initialement en PENDING (design non validé)
2. Admin valide le design
3. Si le vendeur avait choisi "brouillon", le produit passe à DRAFT
4. Le vendeur peut maintenant publier

### Scénario B: PENDING → PUBLISHED (après validation admin)
1. Produit initialement en PENDING (design non validé)
2. Admin valide le design
3. Si le vendeur avait choisi "publier", le produit passe à PUBLISHED
4. Le produit est immédiatement visible

## ⚠️ Tests d'Erreur

### Produit inexistant
```bash
curl -X PUT "http://localhost:3000/vendor-product-validation/set-draft/99999" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <vendor_token>" \
  -d '{"isDraft": true}'
```

**Résultat attendu:** 404 "Produit non trouvé ou non autorisé"

### Accès non autorisé
```bash
curl -X PUT "http://localhost:3000/vendor-product-validation/set-draft/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <wrong_vendor_token>" \
  -d '{"isDraft": true}'
```

**Résultat attendu:** 404 "Produit non trouvé ou non autorisé"

### Body invalide
```bash
curl -X PUT "http://localhost:3000/vendor-product-validation/set-draft/123" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <vendor_token>" \
  -d '{"isDraft": "invalid"}'
```

**Résultat attendu:** 400 "Validation error"

## 🚀 Comment Tester

1. **Préparer les données** : Créer des produits vendeur avec designs validés et non validés
2. **Obtenir un token** : S'authentifier comme vendeur
3. **Lancer les tests** : Exécuter les commandes curl ci-dessus
4. **Vérifier la base** : Contrôler que les statuts en BDD correspondent
5. **Tester l'interface** : Valider les réponses dans le frontend

## 📝 Logs à Vérifier

Rechercher dans les logs ces messages :
```
📦 Produit 123 → DRAFT (design validé)
📦 Produit 123 → PUBLISHED (design validé)
📦 Produit 456 → PENDING (design non validé)
📦 Produit 789 → PENDING (design non validé)
```