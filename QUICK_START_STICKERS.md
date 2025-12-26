# 🚀 Quick Start - Système de Stickers Printalma

## Installation rapide (5 minutes)

### 1. Générer Prisma Client
```bash
npx prisma generate
```

### 2. Appliquer la migration
```bash
# Option A: Via Prisma (Développement)
npx prisma migrate dev --name add_sticker_system

# Option B: Via SQL (Production)
psql $DATABASE_URL -f prisma/migrations/add_sticker_system.sql
```

### 3. Insérer les données (tailles et finitions)
```bash
psql $DATABASE_URL -f prisma/seed-sticker-data.sql
```

### 4. Démarrer l'application
```bash
npm run start:dev
```

## ✅ Vérification

### Tester que tout fonctionne
```bash
# 1. Obtenir les configurations
curl http://localhost:3004/public/stickers/configurations

# Résultat attendu: 4 tailles et 5 finitions
```

## 📖 Endpoints disponibles

### Public (sans auth)
- `GET /public/stickers/configurations` - Tailles et finitions
- `GET /public/stickers` - Liste des stickers
- `GET /public/stickers/:id` - Détails

### Vendeur (avec JWT)
- `POST /vendor/stickers` - Créer
- `GET /vendor/stickers` - Lister mes stickers  
- `PUT /vendor/stickers/:id` - Modifier
- `DELETE /vendor/stickers/:id` - Supprimer

## 📝 Exemple de création

```bash
curl -X POST http://localhost:3004/vendor/stickers \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "designId": 1,
    "name": "Mon Super Sticker",
    "description": "Sticker personnalisé",
    "size": {"id": "medium", "width": 10, "height": 10},
    "finish": "glossy",
    "shape": "DIE_CUT",
    "price": 1100,
    "stockQuantity": 100
  }'
```

## 🔗 Documentation complète

- **Guide détaillé:** `STICKER_IMPLEMENTATION_GUIDE.md`
- **Postman:** `STICKER_POSTMAN_COLLECTION.json`
- **Résumé:** `STICKER_SYSTEM_COMPLETE.md`

