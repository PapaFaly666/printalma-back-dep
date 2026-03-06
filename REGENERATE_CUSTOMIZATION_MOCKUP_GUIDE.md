# Guide de Régénération des Mockups de Personnalisation

## ❌ Problème: `finalImageUrlCustom` est NULL

Si `finalImageUrlCustom` est NULL, c'est parce que:

1. ❌ **Pas d'email fourni** lors de la sauvegarde → Pas de génération automatique
2. ❌ **Erreur lors de la génération** → Mockup non créé
3. ❌ **Personnalisation créée avant l'implémentation** → Champ vide

## ✅ Solution: Régénérer manuellement

### Option 1: Via API (Recommandé)

**Endpoint:** `POST /customizations/:id/regenerate-mockup`

```bash
curl -X POST http://localhost:3004/customizations/123/regenerate-mockup
```

**Réponse:**
```json
{
  "success": true,
  "customizationId": 123,
  "finalImageUrlCustom": "https://res.cloudinary.com/.../mockup-1234567890.png",
  "message": "Mockup régénéré avec succès"
}
```

### Option 2: Via script de test

```bash
./test-regenerate-customization-mockup.sh <CUSTOMIZATION_ID>
```

**Exemple:**
```bash
./test-regenerate-customization-mockup.sh 123
```

## 🔍 Comment trouver l'ID d'une personnalisation

### Dans la base de données

```sql
-- Toutes les personnalisations SANS mockup
SELECT id, client_email, product_id, created_at
FROM product_customizations
WHERE final_image_url_custom IS NULL
ORDER BY created_at DESC
LIMIT 10;
```

### Via une requête complète

```sql
-- Voir l'état de toutes les personnalisations
SELECT
  id,
  product_id,
  client_email,
  client_name,
  CASE
    WHEN final_image_url_custom IS NULL THEN '❌ NULL'
    ELSE '✅ Généré'
  END as status,
  created_at
FROM product_customizations
ORDER BY created_at DESC
LIMIT 20;
```

## 🔄 Régénération en masse

Pour régénérer tous les mockups manquants:

```bash
#!/bin/bash
# Script pour régénérer tous les mockups manquants

# Récupérer tous les IDs sans mockup
IDS=$(psql $DATABASE_URL -t -c "SELECT id FROM product_customizations WHERE final_image_url_custom IS NULL AND client_email IS NOT NULL;")

for ID in $IDS; do
  ID=$(echo $ID | xargs)  # Trim
  echo "🔄 Régénération mockup pour customization $ID..."
  curl -s -X POST "http://localhost:3004/customizations/$ID/regenerate-mockup" | jq '.'
  echo ""
  sleep 2  # Pause de 2 secondes entre chaque régénération
done
```

## 📊 Workflow complet

### 1. Vérifier l'état actuel

```bash
psql $DATABASE_URL -c "
SELECT
  COUNT(*) as total,
  COUNT(final_image_url_custom) as avec_mockup,
  COUNT(*) - COUNT(final_image_url_custom) as sans_mockup
FROM product_customizations;"
```

### 2. Identifier les personnalisations à régénérer

```bash
psql $DATABASE_URL -c "
SELECT id, client_email, created_at
FROM product_customizations
WHERE final_image_url_custom IS NULL
  AND client_email IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;"
```

### 3. Régénérer une personnalisation

```bash
./test-regenerate-customization-mockup.sh <ID>
```

### 4. Vérifier le résultat

```bash
psql $DATABASE_URL -c "
SELECT id, final_image_url_custom
FROM product_customizations
WHERE id = <ID>;"
```

## 🎯 Cas d'usage

### Cas 1: Personnalisation récente sans mockup

**Problème:** Client a personnalisé mais n'a pas fourni d'email

**Solution:**
```bash
# Trouver la personnalisation
psql $DATABASE_URL -c "SELECT id FROM product_customizations ORDER BY created_at DESC LIMIT 1;"

# Régénérer
./test-regenerate-customization-mockup.sh 123
```

### Cas 2: Anciennes personnalisations

**Problème:** Personnalisations créées avant l'implémentation de finalImageUrlCustom

**Solution:**
```bash
# Trouver toutes les anciennes personnalisations
psql $DATABASE_URL -c "
SELECT id, created_at
FROM product_customizations
WHERE final_image_url_custom IS NULL
  AND created_at < '2026-03-03'
ORDER BY created_at DESC;"

# Régénérer une par une
./test-regenerate-customization-mockup.sh 101
./test-regenerate-customization-mockup.sh 102
```

### Cas 3: Erreur lors de la génération initiale

**Problème:** L'email a été fourni mais la génération a échoué

**Solution:**
```bash
# Vérifier les logs du serveur pour l'erreur
# Puis régénérer
curl -X POST http://localhost:3004/customizations/123/regenerate-mockup
```

## 🛠️ Dépannage

### Erreur: "Aucun élément de design"

```json
{
  "statusCode": 400,
  "message": "Aucun élément de design - impossible de générer le mockup"
}
```

**Cause:** La personnalisation n'a pas d'éléments dans `elementsByView`

**Solution:** Cette personnalisation ne peut pas être régénérée (données manquantes)

### Erreur: "Image du produit introuvable"

```json
{
  "statusCode": 400,
  "message": "Image du produit introuvable"
}
```

**Cause:** La variation de couleur n'a pas d'image associée

**Solution:** Vérifier que `colorVariationId` correspond à une variation avec images

### Erreur de timeout Cloudinary

```json
{
  "statusCode": 500,
  "message": "Échec de la génération du mockup: timeout"
}
```

**Cause:** Upload vers Cloudinary trop lent

**Solution:** Réessayer après quelques secondes

## 📈 Statistiques

### Voir le taux de succès

```sql
SELECT
  COUNT(*) as total_customizations,
  COUNT(final_image_url_custom) as mockups_generes,
  ROUND(
    COUNT(final_image_url_custom)::numeric / COUNT(*)::numeric * 100,
    2
  ) as pourcentage_reussite
FROM product_customizations
WHERE client_email IS NOT NULL;
```

### Voir par date

```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as total,
  COUNT(final_image_url_custom) as avec_mockup
FROM product_customizations
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## 🔑 Points importants

1. ✅ **La migration SQL a été appliquée** - La colonne existe
2. ✅ **L'endpoint de régénération existe** - POST `/customizations/:id/regenerate-mockup`
3. ✅ **Le script de test est prêt** - `./test-regenerate-customization-mockup.sh`
4. ⚠️ **La génération est manuelle** - Utiliser l'endpoint ou le script
5. 📧 **L'email n'est plus obligatoire** pour la génération avec l'endpoint de régénération

## 🚀 Automatisation future

Pour générer automatiquement tous les mockups manquants:

```typescript
// Dans CustomizationService
async regenerateAllMissingMockups() {
  const customizations = await this.prisma.productCustomization.findMany({
    where: {
      finalImageUrlCustom: null,
      elementsByView: { not: null }
    }
  });

  for (const customization of customizations) {
    try {
      await this.regenerateCustomizationMockup(customization.id);
    } catch (error) {
      this.logger.error(`Erreur pour ${customization.id}:`, error.message);
    }
  }
}
```

## 📝 Résumé

| Situation | Action |
|-----------|--------|
| **Nouvelle personnalisation avec email** | ✅ Automatique |
| **Nouvelle personnalisation sans email** | 🔄 Régénération manuelle |
| **Ancienne personnalisation** | 🔄 Régénération manuelle |
| **Erreur lors de la génération** | 🔄 Régénération manuelle |

**Pour régénérer:** `./test-regenerate-customization-mockup.sh <ID>`

---

**Date**: 2026-03-03
**Endpoint**: `POST /customizations/:id/regenerate-mockup`
**Script**: `test-regenerate-customization-mockup.sh`
