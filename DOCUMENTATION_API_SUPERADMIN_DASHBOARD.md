# Documentation API - Dashboard Superadmin

## Overview
Cette documentation décrit l'endpoint du dashboard superadmin qui fournit une vue d'ensemble complète de la plateforme PrintAlma, incluant les statistiques financières, vendeurs, produits, designs, commandes et demandes de fonds.

## Endpoint

### Récupérer les statistiques du dashboard
```
GET /superadmin/dashboard
```

**Headers requis :**
- `Authorization: Bearer <token>` - JWT token du superadmin

**Permissions requises :**
- Rôle : `SUPERADMIN` uniquement

**Réponse succès (200) :**
```json
{
  "currentMonth": "December 2025",
  "currentMonthNumber": 12,
  "currentYear": 2025,

  "financialStats": {
    "totalPlatformRevenue": 250000.50,
    "thisMonthPlatformRevenue": 25000.00,
    "totalVendorEarnings": 625000.00,
    "thisMonthVendorEarnings": 60000.00,
    "pendingPayouts": 15000.00,
    "availableForPayout": 35000.00,
    "averageCommissionRate": 40.0
  },

  "vendorStats": {
    "totalVendors": 150,
    "activeVendors": 120,
    "inactiveVendors": 20,
    "suspendedVendors": 10,
    "vendorsByType": {
      "designers": 80,
      "influencers": 50,
      "artists": 20
    },
    "newVendorsThisMonth": 12
  },

  "topVendors": {
    "byRevenue": [
      {
        "vendorId": 45,
        "vendorName": "John Doe",
        "shopName": "John's Designs",
        "email": "john@example.com",
        "vendorType": "DESIGNER",
        "totalRevenue": 50000.00,
        "commissionRate": 40.0,
        "profileImage": "https://..."
      }
    ],
    "bySales": [
      {
        "vendorId": 12,
        "vendorName": "Jane Smith",
        "shopName": "Jane's Shop",
        "email": "jane@example.com",
        "vendorType": "INFLUENCEUR",
        "totalSales": 1500,
        "commissionRate": 35.0,
        "profileImage": "https://..."
      }
    ],
    "byProducts": [
      {
        "vendorId": 78,
        "vendorName": "Bob Artist",
        "shopName": "Bob's Gallery",
        "email": "bob@example.com",
        "vendorType": "ARTISTE",
        "totalProducts": 250,
        "commissionRate": 45.0,
        "profileImage": "https://..."
      }
    ]
  },

  "productStats": {
    "totalProducts": 2500,
    "publishedProducts": 2000,
    "pendingProducts": 150,
    "draftProducts": 300,
    "rejectedProducts": 50,
    "productsAwaitingValidation": [
      {
        "id": 1234,
        "name": "T-Shirt Custom Design",
        "price": 25000,
        "vendorId": 45,
        "vendorName": "John Doe",
        "shopName": "John's Designs",
        "submittedAt": "2025-12-15T10:30:00Z",
        "hasDesign": true,
        "designName": "Cool Design",
        "imageUrl": "https://..."
      }
    ]
  },

  "designStats": {
    "totalDesigns": 1500,
    "publishedDesigns": 1200,
    "pendingDesigns": 100,
    "draftDesigns": 180,
    "validatedDesigns": 1300,
    "designsAwaitingValidation": [
      {
        "id": 567,
        "name": "Abstract Art",
        "price": 5000,
        "vendorId": 78,
        "vendorName": "Bob Artist",
        "shopName": "Bob's Gallery",
        "submittedAt": "2025-12-18T14:20:00Z",
        "thumbnailUrl": "https://...",
        "category": "Abstract",
        "tags": ["art", "modern", "colorful"]
      }
    ],
    "totalDesignUsage": 5000,
    "thisMonthDesignUsage": 450
  },

  "orderStats": {
    "totalOrders": 8500,
    "thisMonthOrders": 750,
    "pendingOrders": 120,
    "confirmedOrders": 450,
    "processingOrders": 200,
    "shippedOrders": 300,
    "deliveredOrders": 7200,
    "cancelledOrders": 230,
    "averageOrderValue": 35000.00,
    "thisMonthRevenue": 26250000.00
  },

  "pendingFundRequests": {
    "count": 25,
    "totalAmount": 125000.00,
    "requests": [
      {
        "id": 89,
        "vendorId": 45,
        "vendorName": "John Doe",
        "shopName": "John's Designs",
        "requestedAmount": 50000.00,
        "paymentMethod": "WAVE",
        "phoneNumber": "+221771234567",
        "bankIban": null,
        "requestedAt": "2025-12-17T09:00:00Z",
        "vendorEmail": "john@example.com"
      }
    ]
  }
}
```

## Description des champs

### Informations temporelles
- `currentMonth` : Mois actuel au format texte (ex: "December 2025")
- `currentMonthNumber` : Numéro du mois (1-12)
- `currentYear` : Année en cours

### Statistiques financières (`financialStats`)
- `totalPlatformRevenue` : Total des commissions générées par la plateforme (tous temps)
- `thisMonthPlatformRevenue` : Commissions générées ce mois
- `totalVendorEarnings` : Total versé aux vendeurs (tous temps)
- `thisMonthVendorEarnings` : Total versé aux vendeurs ce mois
- `pendingPayouts` : Montants en attente de paiement (fonds validés mais pas encore payés)
- `availableForPayout` : Montants disponibles pour retrait par les vendeurs
- `averageCommissionRate` : Taux de commission moyen sur la plateforme (%)

### Statistiques vendeurs (`vendorStats`)
- `totalVendors` : Nombre total de vendeurs (non supprimés)
- `activeVendors` : Vendeurs avec statut ACTIVE et compte actif
- `inactiveVendors` : Vendeurs avec statut INACTIVE
- `suspendedVendors` : Vendeurs avec statut SUSPENDED
- `vendorsByType` : Répartition par type (DESIGNER, INFLUENCEUR, ARTISTE)
- `newVendorsThisMonth` : Nouveaux vendeurs inscrits ce mois

### Meilleurs vendeurs (`topVendors`)
Chaque catégorie contient le top 10 :
- `byRevenue` : Classés par revenus totaux générés
- `bySales` : Classés par nombre de ventes (salesCount)
- `byProducts` : Classés par nombre de produits publiés

**Champs d'un vendeur top :**
- `vendorId` : ID du vendeur
- `vendorName` : Nom complet du vendeur
- `shopName` : Nom de la boutique
- `email` : Email du vendeur
- `vendorType` : Type (DESIGNER, INFLUENCEUR, ARTISTE)
- `totalRevenue` : Revenus totaux (pour byRevenue uniquement)
- `totalSales` : Nombre de ventes (pour bySales uniquement)
- `totalProducts` : Nombre de produits (pour byProducts uniquement)
- `commissionRate` : Taux de commission appliqué au vendeur
- `profileImage` : URL de l'image de profil

### Statistiques produits (`productStats`)
- `totalProducts` : Total de produits vendeurs (non supprimés)
- `publishedProducts` : Produits publiés et visibles
- `pendingProducts` : Produits en attente de validation
- `draftProducts` : Produits en brouillon
- `rejectedProducts` : Produits rejetés
- `productsAwaitingValidation` : Liste des 50 produits les plus anciens en attente

**Champs d'un produit en attente :**
- `id` : ID du produit
- `name` : Nom du produit
- `price` : Prix
- `vendorId` : ID du vendeur
- `vendorName` : Nom du vendeur
- `shopName` : Nom de la boutique
- `submittedAt` : Date de soumission
- `hasDesign` : Indique si le produit utilise un design
- `designName` : Nom du design (si applicable)
- `imageUrl` : URL de la première image

### Statistiques designs (`designStats`)
- `totalDesigns` : Total de designs (non supprimés)
- `publishedDesigns` : Designs publiés
- `pendingDesigns` : Designs en attente de validation
- `draftDesigns` : Designs en brouillon
- `validatedDesigns` : Designs validés
- `designsAwaitingValidation` : Liste des 50 designs les plus anciens en attente
- `totalDesignUsage` : Nombre total d'utilisations de designs dans les commandes
- `thisMonthDesignUsage` : Utilisations de designs ce mois

**Champs d'un design en attente :**
- `id` : ID du design
- `name` : Nom du design
- `price` : Prix
- `vendorId` : ID du vendeur
- `vendorName` : Nom du vendeur
- `shopName` : Nom de la boutique
- `submittedAt` : Date de soumission
- `thumbnailUrl` : URL de la miniature
- `category` : Catégorie du design
- `tags` : Tags associés au design

### Statistiques commandes (`orderStats`)
- `totalOrders` : Total de commandes (tous statuts)
- `thisMonthOrders` : Commandes créées ce mois
- `pendingOrders` : Commandes en attente de paiement
- `confirmedOrders` : Commandes confirmées (paiement validé)
- `processingOrders` : Commandes en traitement
- `shippedOrders` : Commandes expédiées
- `deliveredOrders` : Commandes livrées
- `cancelledOrders` : Commandes annulées
- `averageOrderValue` : Valeur moyenne d'une commande (hors commandes annulées/rejetées)
- `thisMonthRevenue` : Chiffre d'affaires total ce mois (commandes confirmées et suivantes)

### Demandes de fonds en attente (`pendingFundRequests`)
- `count` : Nombre de demandes en attente
- `totalAmount` : Montant total demandé
- `requests` : Liste de toutes les demandes en attente

**Champs d'une demande de fonds :**
- `id` : ID de la demande
- `vendorId` : ID du vendeur
- `vendorName` : Nom du vendeur
- `shopName` : Nom de la boutique
- `requestedAmount` : Montant demandé
- `paymentMethod` : Méthode de paiement (WAVE, ORANGE_MONEY, BANK_TRANSFER)
- `phoneNumber` : Numéro de téléphone (pour WAVE/Orange Money)
- `bankIban` : IBAN bancaire (pour virement)
- `requestedAt` : Date de la demande
- `vendorEmail` : Email du vendeur

## Codes d'erreur

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```
Token JWT manquant ou invalide.

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```
L'utilisateur n'a pas le rôle SUPERADMIN.

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```
Erreur interne du serveur.

## Exemples d'utilisation

### Avec curl
```bash
curl -X GET https://api.printalma.com/superadmin/dashboard \
  -H "Authorization: Bearer your-jwt-token-here"
```

### Avec JavaScript (Fetch API)
```javascript
const response = await fetch('https://api.printalma.com/superadmin/dashboard', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer your-jwt-token-here',
    'Content-Type': 'application/json'
  }
});

const dashboardData = await response.json();
console.log('Dashboard stats:', dashboardData);
```

### Avec Axios
```javascript
import axios from 'axios';

const getDashboardStats = async () => {
  try {
    const response = await axios.get('https://api.printalma.com/superadmin/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    throw error;
  }
};
```

## Notes importantes

1. **Performance** : L'endpoint utilise des requêtes parallèles pour optimiser les temps de réponse. Les statistiques sont calculées en temps réel à chaque appel.

2. **Cache** : Pour améliorer les performances en production, il est recommandé d'implémenter un système de cache avec une durée de vie appropriée (ex: 5-15 minutes).

3. **Pagination** : Les listes de produits/designs en attente sont limitées à 50 éléments pour éviter les réponses trop volumineuses. Les éléments les plus anciens sont retournés en priorité.

4. **Filtres** : Pour le moment, aucun filtre n'est disponible. Toutes les statistiques sont globales.

5. **Sécurité** : Cet endpoint est strictement réservé aux superadmins. Toute tentative d'accès avec un autre rôle sera rejetée avec un code 403.

## Cas d'utilisation

### Dashboard principal
Afficher une vue d'ensemble complète de la plateforme au superadmin :
- Santé financière (revenus, commissions)
- État des vendeurs (actifs, inactifs, suspendus)
- Pipeline de validation (produits et designs en attente)
- Performance des meilleurs vendeurs
- État des commandes

### Alertes et notifications
- Notifications pour les demandes de fonds en attente
- Alertes pour les produits/designs en attente de validation depuis longtemps
- Suivi des nouveaux vendeurs

### Rapports
- Génération de rapports mensuels
- Analyse des tendances (revenus, nombre de vendeurs, etc.)
- Identification des vendeurs performants

## Améliorations futures possibles

1. **Filtres temporels** : Ajouter des paramètres pour filtrer par période (semaine, mois, trimestre, année)
2. **Comparaisons** : Comparer les statistiques actuelles avec les périodes précédentes
3. **Graphiques** : Ajouter des données pour générer des graphiques (évolution temporelle)
4. **Export** : Permettre l'export des données en CSV/Excel
5. **Webhooks** : Notifications automatiques pour certains événements (nouvelle demande de fonds, seuil de validations atteint, etc.)
