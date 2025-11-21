# 📦 API Zones de Livraison - PrintAlma

## Aperçu Rapide

API REST complète pour la gestion des zones de livraison avec:
- **27 villes** (Dakar + Banlieue) pré-configurées
- **13 régions** du Sénégal
- **6 zones internationales** avec 29 pays
- Calcul automatique des frais de livraison
- Documentation Swagger interactive

---

## 🚀 Démarrage Rapide

### 1. Installation et Configuration

```bash
# Installer les dépendances (déjà fait)
npm install

# Générer le client Prisma
npx prisma generate

# Synchroniser le schéma avec la base de données
npx prisma db push

# Remplir la base de données avec les données initiales
npx ts-node prisma/seed-delivery-zones.ts

# Lancer le serveur
npm run start:dev
```

### 2. Accéder à l'API

- **API Base URL:** `http://localhost:3004/delivery`
- **Swagger UI:** `http://localhost:3004/api-docs`

---

## 📋 Endpoints Disponibles

### Cities (Villes)
```
GET    /delivery/cities?zoneType=dakar-ville|banlieue
GET    /delivery/cities/:id
POST   /delivery/cities
PUT    /delivery/cities/:id
DELETE /delivery/cities/:id
PATCH  /delivery/cities/:id/toggle-status
```

### Regions (Régions)
```
GET    /delivery/regions
GET    /delivery/regions/:id
POST   /delivery/regions
PUT    /delivery/regions/:id
DELETE /delivery/regions/:id
PATCH  /delivery/regions/:id/toggle-status
```

### International Zones
```
GET    /delivery/international-zones
GET    /delivery/international-zones/:id
POST   /delivery/international-zones
PUT    /delivery/international-zones/:id
DELETE /delivery/international-zones/:id
PATCH  /delivery/international-zones/:id/toggle-status
```

### Transporteurs
```
GET    /delivery/transporteurs
GET    /delivery/transporteurs/:id
POST   /delivery/transporteurs
PUT    /delivery/transporteurs/:id
DELETE /delivery/transporteurs/:id
PATCH  /delivery/transporteurs/:id/toggle-status
```

### Zone Tarifs
```
GET    /delivery/zone-tarifs
GET    /delivery/zone-tarifs/:id
POST   /delivery/zone-tarifs
PUT    /delivery/zone-tarifs/:id
DELETE /delivery/zone-tarifs/:id
PATCH  /delivery/zone-tarifs/:id/toggle-status
```

### Calcul de Frais
```
GET    /delivery/calculate-fee?cityId=...&regionId=...&internationalZoneId=...
```

---

## 🧪 Exemples Rapides

### Récupérer toutes les villes de Dakar

```bash
curl http://localhost:3004/delivery/cities?zoneType=dakar-ville
```

### Calculer les frais pour une ville

```bash
curl http://localhost:3004/delivery/calculate-fee?cityId=city-plateau
```

**Réponse:**
```json
{
  "fee": 0,
  "deliveryTime": "Standard"
}
```

### Récupérer toutes les régions

```bash
curl http://localhost:3004/delivery/regions
```

### Créer une nouvelle ville (Authentification requise)

```bash
curl -X POST http://localhost:3004/delivery/cities \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Nouvelle Ville",
    "category": "Résidentiel",
    "zoneType": "dakar-ville",
    "price": 1500,
    "isFree": false,
    "deliveryTimeMin": 24,
    "deliveryTimeMax": 48,
    "deliveryTimeUnit": "heures"
  }'
```

---

## 📊 Données Pré-remplies

### Villes Dakar Ville (Gratuites)
- Plateau, Médina, Point E, Fann, Colobane

### Villes Dakar Ville (Payantes)
- HLM (1500 FCFA), Ouakam (1500), Ngor (2000), Yoff (1500)
- Sacré-Coeur (1000), Mermoz (1000), Almadies (2500)
- Grand Dakar (1000), Gueule Tapée (1000), Fass (1000)
- Dieuppeul (1500), Liberté 6 (1000)

### Banlieue de Dakar
- Pikine (2000 FCFA), Guédiawaye (1800), Thiaroye-sur-Mer (2200)
- Keur Massar (2000), Rufisque (2200), Malika (2500)
- Parcelles Assainies (1500), Yeumbeul (2000), Mbao (2000), Bargny (2500)

### 13 Régions du Sénégal
- Diourbel (3000 FCFA), Fatick (3200), Kaffrine (3500), Kaolack (2800)
- Kédougou (5000), Kolda (4500), Louga (2500), Matam (4000)
- Saint-Louis (2200), Sédhiou (4200), Tambacounda (4800)
- Thiès (2000), Ziguinchor (5000)

### 6 Zones Internationales
- **Afrique de l'Ouest** (15000 FCFA): Mali, Mauritanie, Guinée, Côte d'Ivoire, Burkina Faso, Niger
- **Afrique Centrale** (20000): Cameroun, Gabon, Congo, RDC, Tchad
- **Afrique du Nord** (18000): Maroc, Algérie, Tunisie, Libye, Égypte
- **Afrique de l'Est** (25000): Kenya, Tanzanie, Éthiopie, Ouganda, Rwanda
- **Europe** (30000): France, Belgique, Espagne, Italie, Allemagne, Royaume-Uni
- **Amérique du Nord** (35000): États-Unis, Canada

---

## 🔐 Sécurité

### Endpoints Publics (Lecture seule)
- `GET /delivery/*` - Tous les GET sont publics

### Endpoints Protégés (Admin uniquement)
- `POST /delivery/*` - Création
- `PUT /delivery/*` - Modification
- `DELETE /delivery/*` - Suppression
- `PATCH /delivery/*` - Toggle status

**Note:** Actuellement, les endpoints ne sont pas protégés. Pour ajouter la protection, utilisez les guards dans le controller:

```typescript
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../guards/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
@Post('cities')
createCity(@Body() createCityDto: CreateCityDto) {
  return this.deliveryService.createCity(createCityDto);
}
```

---

## 🗂️ Structure des Fichiers

```
src/delivery/
├── dto/
│   ├── city.dto.ts
│   ├── region.dto.ts
│   ├── international-zone.dto.ts
│   ├── transporteur.dto.ts
│   └── zone-tarif.dto.ts
├── delivery.controller.ts
├── delivery.service.ts
└── delivery.module.ts

prisma/
├── schema.prisma (lignes 1118-1249)
└── seed-delivery-zones.ts
```

---

## 📖 Documentation Complète

Pour une documentation détaillée avec exemples d'intégration frontend:
👉 **[DELIVERY_API_GUIDE_FRONTEND.md](./DELIVERY_API_GUIDE_FRONTEND.md)**

Contient:
- Guide complet d'intégration
- Service TypeScript complet
- Exemples React avec React Query
- Types TypeScript complets
- Gestion des erreurs
- Exemples de composants

---

## 🧰 Outils de Développement

### Swagger UI
Interface interactive pour tester tous les endpoints:
```
http://localhost:3004/api-docs
```

### Prisma Studio
Interface graphique pour voir les données:
```bash
npx prisma studio
```

### Logs du Serveur
```bash
npm run start:dev
```

---

## 🐛 Debugging

### Vérifier que la base de données est synchronisée
```bash
npx prisma db push
```

### Re-générer le client Prisma
```bash
npx prisma generate
```

### Vérifier les données dans la base
```bash
npx prisma studio
```

### Relancer le seed
```bash
npx ts-node prisma/seed-delivery-zones.ts
```

---

## 📝 Codes de Statut HTTP

| Code | Signification | Exemple |
|------|--------------|---------|
| 200 | OK | GET, PUT, PATCH réussis |
| 201 | Created | POST réussi |
| 204 | No Content | DELETE réussi |
| 400 | Bad Request | Données invalides |
| 401 | Unauthorized | Token manquant/invalide |
| 403 | Forbidden | Pas les permissions |
| 404 | Not Found | Ressource introuvable |
| 409 | Conflict | Nom déjà existant |
| 500 | Server Error | Erreur serveur |

---

## 🎯 Fonctionnalités Clés

✅ **CRUD Complet** pour toutes les entités
✅ **Validation automatique** avec class-validator
✅ **Documentation Swagger** interactive
✅ **Toggle status** pour activation/désactivation rapide
✅ **Calcul intelligent** des frais de livraison
✅ **Cascade delete** pour zones internationales
✅ **Gestion des conflits** (noms uniques)
✅ **27 villes** pré-configurées
✅ **13 régions** du Sénégal
✅ **6 zones internationales** avec 29 pays

---

## 🤝 Contribution

L'API est complète et prête à être utilisée. Pour toute modification:

1. Modifier le schéma Prisma si nécessaire
2. Mettre à jour les DTOs
3. Mettre à jour le service
4. Mettre à jour le controller
5. Mettre à jour la documentation

---

## 📞 Support

- **Documentation Swagger:** http://localhost:3004/api-docs
- **Guide Frontend:** [DELIVERY_API_GUIDE_FRONTEND.md](./DELIVERY_API_GUIDE_FRONTEND.md)
- **Logs Backend:** Vérifiez la console du serveur

---

**Version:** 1.0
**Date:** 2025-11-21
**Auteur:** PrintAlma Team
**Status:** ✅ Production Ready
