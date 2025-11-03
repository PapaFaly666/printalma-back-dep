# 📚 Index - Documentation API Designers

## 🎯 Démarrage rapide

**Pour commencer rapidement**, lisez dans cet ordre:

1. **[NEXT_STEPS.md](./NEXT_STEPS.md)** ← Commencez ici!
   - Instructions étape par étape pour démarrer
   - Configuration de la base de données
   - Tests des endpoints

2. **[DESIGNERS_QUICKSTART.md](./DESIGNERS_QUICKSTART.md)**
   - Guide condensé de démarrage rapide
   - Exemples de requêtes curl
   - Commandes essentielles

3. **[IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md)**
   - Vue d'ensemble de l'implémentation
   - Résumé des fonctionnalités
   - Checklist de vérification

---

## 📖 Documentation technique

### Pour les développeurs backend

1. **[DESIGNERS_API_IMPLEMENTATION.md](./DESIGNERS_API_IMPLEMENTATION.md)**
   - Spécifications complètes de l'API
   - Détails de chaque endpoint
   - Formats de requêtes/réponses
   - Codes d'erreur

2. **[src/designer/README.md](./src/designer/README.md)**
   - Documentation technique du module
   - Architecture interne
   - DTOs et validation
   - Gestion des erreurs

### Pour les développeurs frontend

3. **[GUIDE_FRONTEND_FEATURED_THEMES.md](./GUIDE_FRONTEND_FEATURED_THEMES.md)**
   - Guide d'intégration frontend
   - Exemples de code TypeScript/React
   - Interface avec l'API

---

## 🗂️ Structure du projet

```
printalma-back-dep/
│
├── 📝 Documentation
│   ├── INDEX_DESIGNERS.md ...................... (ce fichier)
│   ├── NEXT_STEPS.md ........................... Étapes pour démarrer
│   ├── DESIGNERS_QUICKSTART.md ................. Guide rapide
│   ├── DESIGNERS_API_IMPLEMENTATION.md ......... Doc complète API
│   ├── IMPLEMENTATION_COMPLETE.md .............. Résumé implémentation
│   ├── COMMIT_MESSAGE.md ....................... Message pour commit git
│   └── GUIDE_FRONTEND_FEATURED_THEMES.md ....... Guide frontend
│
├── 🏗️ Code source
│   └── src/designer/
│       ├── designer.controller.ts .............. Contrôleur REST (7 endpoints)
│       ├── designer.service.ts ................. Logique métier
│       ├── designer.module.ts .................. Configuration NestJS
│       ├── README.md ........................... Doc technique module
│       └── dto/
│           ├── create-designer.dto.ts .......... DTO création
│           ├── update-designer.dto.ts .......... DTO modification
│           └── update-featured-designers.dto.ts  DTO featured
│
├── 🗄️ Base de données
│   └── prisma/
│       ├── schema.prisma ....................... Modèle Designer ajouté
│       └── seed-designers.ts ................... Script de seed (6 designers)
│
└── 🧪 Tests
    └── test-designers-api.sh ................... Script de test complet
```

---

## 🔗 Liens rapides vers les endpoints

| Endpoint | Méthode | Auth | Description |
|----------|---------|------|-------------|
| `/designers/health` | GET | Non | [Health check](./DESIGNERS_API_IMPLEMENTATION.md#1-health-check) |
| `/designers/featured` | GET | Non | [Liste featured](./DESIGNERS_API_IMPLEMENTATION.md#6-lister-les-designers-en-vedette-public) |
| `/designers/admin` | GET | Admin | [Liste complète](./DESIGNERS_API_IMPLEMENTATION.md#2-lister-tous-les-designers-admin) |
| `/designers/admin` | POST | Admin | [Créer](./DESIGNERS_API_IMPLEMENTATION.md#3-créer-un-designer-admin) |
| `/designers/admin/:id` | PUT | Admin | [Modifier](./DESIGNERS_API_IMPLEMENTATION.md#4-modifier-un-designer-admin) |
| `/designers/admin/:id` | DELETE | Admin | [Supprimer](./DESIGNERS_API_IMPLEMENTATION.md#5-supprimer-un-designer-admin) |
| `/designers/featured/update` | PUT | Admin | [Update featured](./DESIGNERS_API_IMPLEMENTATION.md#7-mettre-à-jour-les-designers-en-vedette-admin) |

---

## 🚀 Commandes essentielles

### Mise en place initiale
```bash
# 1. Appliquer la migration
npx prisma db push

# 2. Créer les données de test
npx ts-node prisma/seed-designers.ts

# 3. Démarrer le serveur
npm run start:dev
```

### Tests
```bash
# Test simple
curl http://localhost:3004/designers/health

# Test complet (avec JWT)
./test-designers-api.sh YOUR_JWT_TOKEN
```

### Base de données
```bash
# Ouvrir Prisma Studio
npx prisma studio

# Générer le client Prisma
npx prisma generate

# Reset la base (ATTENTION: supprime toutes les données)
npx prisma migrate reset
```

---

## 📊 Modèle de données

### Table `designers`

```
┌─────────────────┬──────────────┬──────────┬─────────────┐
│ Colonne         │ Type         │ Nullable │ Default     │
├─────────────────┼──────────────┼──────────┼─────────────┤
│ id              │ SERIAL       │ Non      │ auto        │
│ name            │ VARCHAR(255) │ Non      │ -           │
│ display_name    │ VARCHAR(255) │ Oui      │ null        │
│ bio             │ TEXT         │ Oui      │ null        │
│ avatar_url      │ VARCHAR(500) │ Oui      │ null        │
│ avatar_public_id│ VARCHAR(255) │ Oui      │ null        │
│ is_active       │ BOOLEAN      │ Non      │ true        │
│ sort_order      │ INTEGER      │ Non      │ 0           │
│ featured_order  │ INTEGER      │ Oui      │ null        │
│ is_featured     │ BOOLEAN      │ Non      │ false       │
│ created_at      │ TIMESTAMP    │ Non      │ now()       │
│ updated_at      │ TIMESTAMP    │ Non      │ now()       │
│ created_by      │ INTEGER      │ Non      │ -           │
└─────────────────┴──────────────┴──────────┴─────────────┘

Indexes:
- idx_designers_is_active (is_active)
- idx_designers_is_featured (is_featured)
- idx_designers_sort_order (sort_order)
- idx_designers_featured_order (featured_order)

Relations:
- created_by → users.id (créateur du designer)
```

---

## 🎨 Fonctionnalités clés

### ✅ Gestion CRUD complète
- Créer, lire, modifier, supprimer des designers
- Validation stricte des données
- Messages d'erreur en français

### ✅ Upload d'avatars
- Intégration Cloudinary
- Transformation automatique (400x400px)
- Optimisation de la qualité
- Suppression automatique des anciens avatars

### ✅ Designers "en vedette"
- Exactement 6 designers featured
- Transaction atomique pour la cohérence
- Ordre personnalisable
- Validation que les designers sont actifs

### ✅ Sécurité
- Authentification JWT
- Autorisation par rôles (ADMIN, SUPERADMIN)
- Validation des entrées (class-validator)
- Protection CORS

---

## 🐛 Dépannage

| Problème | Solution |
|----------|----------|
| Table not found | `npx prisma db push` |
| No admin user | Créer un admin via Prisma Studio |
| 401 Unauthorized | Vérifier le token JWT et le rôle |
| Build timeout | Vérifier les erreurs TypeScript |
| Cloudinary error | Vérifier les credentials |

Voir [NEXT_STEPS.md](./NEXT_STEPS.md#dépannage) pour plus de détails.

---

## 📞 Support

### Questions fréquentes

**Q: Combien de designers peuvent être en vedette?**
R: Exactement 6 designers (validation stricte).

**Q: Quel format d'image accepté pour les avatars?**
R: jpg, jpeg, png, gif, webp (max 2MB).

**Q: Peut-on supprimer un designer en vedette?**
R: Oui, mais il faut d'abord le retirer des featured.

**Q: Les designers sont-ils soft-deleted?**
R: Non, c'est un hard delete (suppression définitive).

### Ressources additionnelles

- Documentation NestJS: https://docs.nestjs.com
- Documentation Prisma: https://www.prisma.io/docs
- Documentation Cloudinary: https://cloudinary.com/documentation

---

## 🎉 Prêt à commencer!

👉 **Commencez par lire [NEXT_STEPS.md](./NEXT_STEPS.md)**

Toute la documentation est à jour et prête à l'emploi.
Bon développement! 🚀
