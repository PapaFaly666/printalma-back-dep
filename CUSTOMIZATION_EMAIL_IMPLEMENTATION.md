# Implémentation de l'Email de Personnalisation

## 📧 Vue d'ensemble

Cette fonctionnalité permet d'envoyer automatiquement un email au client lorsqu'il sauvegarde une personnalisation de produit, même **sans passer commande**. Le client reçoit un email avec le mockup généré de son produit personnalisé.

## 🎯 Fonctionnalités

- ✅ Génération automatique de mockup lors de la sauvegarde d'une personnalisation
- ✅ Envoi d'email automatique avec le mockup généré
- ✅ Template d'email professionnel et responsive
- ✅ Support des éléments de design (texte, images, rotation, etc.)
- ✅ Stockage du mockup dans la base de données (`previewImageUrl`)
- ✅ Upload du mockup vers Cloudinary

## 🏗️ Architecture

### 1. Flux de données

```
Client POST /customization/upsert
    ↓
CustomizationService.upsertCustomization()
    ↓
Sauvegarde dans la BD
    ↓
generateAndSendCustomizationEmail()
    ├─→ Extraction des éléments de design
    ├─→ Récupération de l'image produit
    ├─→ OrderMockupGeneratorService.generateOrderMockup()
    │   ├─→ Composition de l'image avec Sharp
    │   └─→ Upload vers Cloudinary
    ├─→ Sauvegarde du mockup URL dans previewImageUrl
    └─→ MailService.sendCustomizationEmail()
        └─→ Envoi email SMTP avec template HTML
```

### 2. Fichiers modifiés

#### **src/customization/dto/create-customization.dto.ts**
Ajout de 2 champs optionnels:
```typescript
clientEmail?: string;  // Email pour recevoir le mockup
clientName?: string;   // Nom pour personnaliser l'email
```

#### **src/customization/customization.service.ts**
- Méthode `generateAndSendCustomizationEmail()` (lignes 804-903)
- Appel automatique après sauvegarde (lignes 207, 248, 274)
- Extraction des éléments depuis `elementsByView`
- Génération du mockup via `OrderMockupGeneratorService`
- Envoi de l'email via `MailService`

#### **src/customization/customization.module.ts**
Ajout des dépendances:
```typescript
imports: [MailModule]
providers: [OrderMockupGeneratorService]
```

#### **src/core/mail/mail.service.ts**
Nouvelle méthode `sendCustomizationEmail()` (lignes 1920-2024):
- Template HTML responsive
- Image du mockup
- Bouton CTA "Commander maintenant"
- Design cohérent avec les autres emails PrintAlma

#### **prisma/schema.prisma**
Ajout de 2 champs au modèle `ProductCustomization`:
```prisma
clientEmail  String?  @map("client_email")
clientName   String?  @map("client_name")
```

#### **migrations/add-customization-client-fields.sql**
Migration SQL pour ajouter les colonnes:
```sql
ALTER TABLE product_customizations
ADD COLUMN IF NOT EXISTS client_email VARCHAR(255);

ALTER TABLE product_customizations
ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
```

## 📝 Utilisation

### API Endpoint

**POST** `/customization/upsert`

```json
{
  "productId": 1,
  "colorVariationId": 1,
  "viewId": 1,
  "clientEmail": "client@example.com",  // ← Nouveau: optionnel
  "clientName": "Jean Dupont",          // ← Nouveau: optionnel
  "designElements": [
    {
      "id": "text-1",
      "type": "text",
      "text": "Mon texte personnalisé",
      "x": 0.5,
      "y": 0.5,
      "width": 300,
      "height": 50,
      "rotation": 0,
      "zIndex": 1,
      "fontSize": 24,
      "fontFamily": "Arial",
      "color": "#000000"
    }
  ]
}
```

### Comportement

1. **Avec email fourni**:
   - ✅ Sauvegarde personnalisation
   - ✅ Génère mockup
   - ✅ Envoie email au client

2. **Sans email**:
   - ✅ Sauvegarde personnalisation
   - ❌ Pas de mockup généré
   - ❌ Pas d'email envoyé

## 🧪 Tests

### Script de test

Utilisez le script fourni:
```bash
./test-customization-email.sh
```

Ce script:
1. Crée une personnalisation avec email
2. Vérifie la génération du mockup
3. Affiche les résultats
4. Guide pour vérifier l'email

### Test manuel avec cURL

```bash
curl -X POST http://localhost:3004/customization/upsert \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "clientEmail": "votre@email.com",
    "clientName": "Votre Nom",
    "sessionId": "test-123",
    "designElements": [
      {
        "id": "text-1",
        "type": "text",
        "text": "Test",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 1,
        "fontSize": 24,
        "fontFamily": "Arial",
        "color": "#000000"
      }
    ]
  }'
```

## 🔧 Configuration

### Variables d'environnement requises

```env
# SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@printalma.com
SMTP_PASS=votre_mot_de_passe
SMTP_FROM=noreply@printalma.com

# Cloudinary (pour l'upload des mockups)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (pour le bouton CTA)
FRONTEND_URL=https://printalma.com
```

## 📊 Logs

Les logs détaillés sont affichés dans la console:

```
🎨 ===== GÉNÉRATION ET ENVOI EMAIL =====
🎨 Email client fourni: client@example.com
📦 Extraction des éléments depuis elementsByView...
🖼️ Récupération de l'image produit...
🎨 Génération du mockup...
📤 [Mockup] Upload vers Cloudinary...
✅ Mockup généré: https://res.cloudinary.com/...
💾 Mockup sauvegardé dans previewImageUrl
📧 Envoi de l'email à client@example.com...
✅ Email envoyé avec succès à client@example.com
===== FIN GÉNÉRATION ET ENVOI =====
```

## 🐛 Dépannage

### L'email n'est pas envoyé

1. **Vérifier les logs** pour les erreurs SMTP
2. **Vérifier la configuration SMTP** dans `.env`
3. **Vérifier que l'email est fourni** dans le DTO
4. **Vérifier les spams** dans la boîte de réception

### Le mockup n'est pas généré

1. **Vérifier que le produit a une image** (colorVariation.images)
2. **Vérifier les logs** pour les erreurs Cloudinary
3. **Vérifier la configuration Cloudinary** dans `.env`
4. **Vérifier que les éléments de design sont valides**

### Erreur "Cannot reach database"

- La migration SQL n'a pas été appliquée
- Exécutez: `psql $DATABASE_URL -f migrations/add-customization-client-fields.sql`

## 📈 Améliorations futures

- [ ] Support multi-vues (générer mockup pour chaque vue)
- [ ] Aperçu email avant envoi
- [ ] File d'attente pour les emails (Redis/Bull)
- [ ] Métriques d'engagement email (ouvertures, clics)
- [ ] Template d'email personnalisable par vendeur
- [ ] Support de plusieurs langues
- [ ] Webhooks pour notification externe

## 📚 Références

- [ORDER_MOCKUP_GENERATION_GUIDE.md](ORDER_MOCKUP_GENERATION_GUIDE.md) - Guide de génération de mockups
- [BACKEND_ORDER_CUSTOMIZATION_GUIDE.md](BACKEND_ORDER_CUSTOMIZATION_GUIDE.md) - Guide complet de personnalisation
- [test-customization-email.sh](test-customization-email.sh) - Script de test

---

**Date d'implémentation**: 2026-03-03
**Version**: 1.0.0
**Auteur**: Claude Code
