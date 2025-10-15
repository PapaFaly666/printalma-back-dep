# 🗄️ Initialisation de la Base de Données Printalma

## 📖 Guide Rapide

### Commandes NPM disponibles

```bash
# Seed complet de la base (première fois)
npm run db:seed

# Vérifier le contenu de la base
npm run db:check

# Ajouter seulement des appels de fonds
npm run db:seed:funds

# Ajouter commandes et appels de fonds
npm run db:seed:remaining
```

### Reset complet + Seed

```bash
# Réinitialiser complètement et re-seed
npx prisma migrate reset --force && npm run db:seed
```

## 📊 Ce qui a été initialisé

### ✅ Données Créées

- **34 Utilisateurs**
  - 2 Super Admins
  - 2 Admins
  - 20 Vendeurs (avec boutiques)
  - 10 Clients

- **21 Catégories** (Hiérarchie à 3 niveaux)
  - 4 catégories principales
  - 7 sous-catégories
  - 10 variations

- **8 Produits**
  - Avec tailles et couleurs
  - 18 variations de couleur
  - Stocks configurés
  - Images placeholder

- **62 Commandes**
  - Statuts variés (Pending, Confirmed, Shipped, Delivered, Cancelled)
  - Articles multiples par commande
  - Réparties sur 3 mois

- **30 Appels de Fonds**
  - Statuts: Pending, Approved, Paid, Rejected
  - Liés aux vendeurs
  - Montants réalistes

- **20 Commissions Vendeur**
  - Entre 30% et 50%
  - Avec historique d'audit

- **20 Comptes de Gains Vendeur**
  - Montants disponibles
  - Historique mensuel

## 🔑 Identifiants de Test

### Super Admin
```
Email: superadmin@printalma.com
Mot de passe: password123
```

### Admin
```
Email: admin1@printalma.com
Mot de passe: password123
```

### Vendeur (exemple)
```
Email: ahmed.diop@vendor.com
Mot de passe: password123
Boutique: Ahmed Design Studio
```

### Client (exemple)
```
Email: sophie.martin@client.com
Mot de passe: password123
```

## 📁 Structure des Scripts

```
prisma/
├── seed.ts                    # ⭐ Script principal (tout en un)
├── seed-categories.ts         # Catégories hiérarchiques
├── seed-users.ts              # Utilisateurs + Types vendeur
├── seed-products.ts           # Produits avec variantes
├── seed-orders.ts             # Commandes avec articles
├── seed-funds-requests.ts     # Appels de fonds complets
├── seed-funds-only.ts         # ⚡ Appels de fonds rapides
├── seed-remaining.ts          # Commandes + Fonds seulement
└── check-seed.ts              # 🔍 Vérification du contenu
```

## 🎯 Cas d'Usage

### 1. Première initialisation
```bash
# Générer le client Prisma
npx prisma generate

# Appliquer les migrations
npx prisma migrate deploy

# Seed initial
npm run db:seed
```

### 2. Reset complet
```bash
npx prisma migrate reset --force
npm run db:seed
```

### 3. Ajouter plus de données
```bash
# Ajouter plus d'appels de fonds
npm run db:seed:funds

# Ajouter commandes + appels de fonds
npm run db:seed:remaining
```

### 4. Vérification rapide
```bash
# Voir un résumé du contenu
npm run db:check

# Ouvrir Prisma Studio
npx prisma studio
```

## 🔧 Personnalisation

### Modifier le nombre d'entités

Les scripts sont modulaires et facilement personnalisables :

**Utilisateurs** (`seed-users.ts`):
```typescript
// Ligne ~82: Modifier le tableau vendorNames
const vendorNames = [
  // Ajouter/Retirer des vendeurs ici
];

// Ligne ~145: Modifier le tableau clientNames
const clientNames = [
  // Ajouter/Retirer des clients ici
];
```

**Commandes** (`seed-orders.ts`):
```typescript
// Ligne ~8: Changer le nombre de commandes
for (let i = 0; i < 100; i++) { // Modifier 100
```

**Appels de Fonds** (`seed-funds-only.ts`):
```typescript
// Ligne ~46: Changer le nombre de demandes
for (let i = 0; i < 30; i++) { // Modifier 30
```

## 📈 Statistiques Actuelles

```
👥 USERS:
   Total: 34
   ├─ Super Admins: 2
   ├─ Admins: 2
   ├─ Vendors: 20
   └─ Clients: 10

🏷️ CATEGORIES:
   Main Categories: 4
   Sub-Categories: 7
   Variations: 10

🛍️ PRODUCTS:
   Products: 8
   Color Variations: 18

📦 ORDERS:
   Total: 62
   ├─ Pending: 6
   ├─ Confirmed: 10
   ├─ Shipped: 21
   ├─ Delivered: 12
   └─ Cancelled: 6

💰 FUNDS REQUESTS:
   Total: 30
   ├─ Pending: 7
   ├─ Approved: 3
   ├─ Paid: 10
   └─ Rejected: 10

💵 VENDOR FINANCES:
   Commissions: 20
   Earnings Tracked: 20
```

## 🐛 Dépannage

### Le seeding prend trop de temps
**Solution:** Utilisez les scripts modulaires:
```bash
npm run db:seed:funds        # Plus rapide
npm run db:seed:remaining    # Moyen
```

### Erreur "Unique constraint failed"
**Solution:** Réinitialisez la base:
```bash
npx prisma migrate reset --force
```

### Le client Prisma n'est pas à jour
**Solution:**
```bash
npx prisma generate
```

### Timeout après 2 minutes
**Solution:** C'est normal, le script continue en arrière-plan. Vérifiez avec:
```bash
npm run db:check
```

## 📚 Documentation Complète

- **SEEDING_GUIDE.md** - Guide détaillé de seeding
- **DATABASE_SEEDING_COMPLETE.md** - Récapitulatif complet avec tous les détails
- **FRONTEND_FIX_CATEGORY_ERROR_GUIDE.md** - Guide pour résoudre l'erreur des catégories

## ⚠️ Important

1. **Développement uniquement** - Ces données sont pour le dev/test
2. **Mot de passe unique** - Tous les comptes utilisent `password123`
3. **Images placeholder** - Les images produits sont des placeholders
4. **Données sensibles** - Ne jamais commit les fichiers `.env`
5. **Performance** - Le seed complet peut prendre 2-3 minutes

## 🚀 Prochaines Étapes

1. Tester l'authentification avec les différents rôles
2. Vérifier les permissions admin/vendeur
3. Tester le flux de commandes
4. Valider les appels de fonds
5. Tester les calculs de commission
6. Vérifier les filtres et la recherche

## 🎉 Succès !

Votre base de données est maintenant prête avec des données réalistes pour le développement et les tests !

---

**Créé le:** 2025-10-14
**Version:** 1.0.0
**Status:** ✅ Opérationnel
