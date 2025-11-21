# 📦 Guide API - Gestion des Zones de Livraison
## Documentation Frontend - PrintAlma

---

## 📚 Table des Matières

1. [Vue d'ensemble](#vue-densemble)
2. [Configuration](#configuration)
3. [Endpoints API](#endpoints-api)
   - [Cities (Villes)](#1-cities-villes-dakar--banlieue)
   - [Regions (Régions)](#2-regions-13-régions-du-sénégal)
   - [International Zones](#3-international-zones-zones-internationales)
   - [Transporteurs](#4-transporteurs)
   - [Zone Tarifs](#5-zone-tarifs)
   - [Calcul de Frais](#6-calcul-de-frais-de-livraison)
4. [Exemples d'Intégration](#exemples-dintégration)
5. [Gestion des Erreurs](#gestion-des-erreurs)
6. [Types TypeScript](#types-typescript)

---

## Vue d'ensemble

L'API de gestion des zones de livraison permet de:
- Gérer les villes de Dakar et sa banlieue
- Gérer les 13 régions du Sénégal
- Gérer les zones internationales
- Gérer les transporteurs et leurs zones
- Gérer les tarifs par zone et transporteur
- Calculer les frais de livraison pour une commande

**Base URL:** `http://localhost:3004/delivery`

**Format:** JSON

**Documentation Swagger:** `http://localhost:3004/api-docs`

---

## Configuration

### Installation du Client HTTP (Axios)

```bash
npm install axios
```

### Configuration du Service API

```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;
```

---

## Endpoints API

### 1. CITIES (Villes Dakar & Banlieue)

#### 🔹 Récupérer toutes les villes

```http
GET /delivery/cities?zoneType={zoneType}
```

**Query Parameters:**
- `zoneType` (optionnel): `'dakar-ville'` ou `'banlieue'`

**Exemple de requête:**

```typescript
// Toutes les villes
const response = await apiClient.get('/delivery/cities');

// Seulement Dakar ville
const dakarVille = await apiClient.get('/delivery/cities?zoneType=dakar-ville');

// Seulement Banlieue
const banlieue = await apiClient.get('/delivery/cities?zoneType=banlieue');
```

**Réponse (200 OK):**

```json
[
  {
    "id": "city-plateau",
    "name": "Plateau",
    "category": "Centre",
    "zoneType": "dakar-ville",
    "status": "active",
    "price": "0.00",
    "isFree": true,
    "deliveryTimeMin": null,
    "deliveryTimeMax": null,
    "deliveryTimeUnit": null,
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:00:00.000Z"
  },
  {
    "id": "city-hlm",
    "name": "HLM",
    "category": "Résidentiel",
    "zoneType": "dakar-ville",
    "status": "active",
    "price": "1500.00",
    "isFree": false,
    "deliveryTimeMin": 24,
    "deliveryTimeMax": 48,
    "deliveryTimeUnit": "heures",
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:00:00.000Z"
  }
]
```

---

#### 🔹 Récupérer une ville par ID

```http
GET /delivery/cities/:id
```

**Exemple:**

```typescript
const city = await apiClient.get('/delivery/cities/city-plateau');
```

**Réponse (200 OK):**

```json
{
  "id": "city-plateau",
  "name": "Plateau",
  "category": "Centre",
  "zoneType": "dakar-ville",
  "status": "active",
  "price": "0.00",
  "isFree": true,
  "deliveryTimeMin": null,
  "deliveryTimeMax": null,
  "deliveryTimeUnit": null,
  "createdAt": "2025-11-21T10:00:00.000Z",
  "updatedAt": "2025-11-21T10:00:00.000Z"
}
```

**Erreur (404 Not Found):**

```json
{
  "statusCode": 404,
  "message": "City with ID city-xyz not found",
  "error": "Not Found"
}
```

---

#### 🔹 Créer une ville

```http
POST /delivery/cities
```

**Body:**

```json
{
  "name": "Nouvelle Ville",
  "category": "Résidentiel",
  "zoneType": "dakar-ville",
  "status": "active",
  "price": 1500,
  "isFree": false,
  "deliveryTimeMin": 24,
  "deliveryTimeMax": 48,
  "deliveryTimeUnit": "heures"
}
```

**Exemple:**

```typescript
const newCity = await apiClient.post('/delivery/cities', {
  name: 'Nouvelle Ville',
  category: 'Résidentiel',
  zoneType: 'dakar-ville',
  status: 'active',
  price: 1500,
  isFree: false,
  deliveryTimeMin: 24,
  deliveryTimeMax: 48,
  deliveryTimeUnit: 'heures',
});
```

**Réponse (201 Created):**

```json
{
  "id": "generated-uuid",
  "name": "Nouvelle Ville",
  "category": "Résidentiel",
  "zoneType": "dakar-ville",
  "status": "active",
  "price": "1500.00",
  "isFree": false,
  "deliveryTimeMin": 24,
  "deliveryTimeMax": 48,
  "deliveryTimeUnit": "heures",
  "createdAt": "2025-11-21T12:00:00.000Z",
  "updatedAt": "2025-11-21T12:00:00.000Z"
}
```

---

#### 🔹 Mettre à jour une ville

```http
PUT /delivery/cities/:id
```

**Body (tous les champs optionnels):**

```json
{
  "name": "Nom Modifié",
  "price": 2000,
  "status": "inactive"
}
```

**Exemple:**

```typescript
const updated = await apiClient.put('/delivery/cities/city-plateau', {
  price: 2000,
  status: 'inactive',
});
```

**Réponse (200 OK):** Ville mise à jour

---

#### 🔹 Supprimer une ville

```http
DELETE /delivery/cities/:id
```

**Exemple:**

```typescript
await apiClient.delete('/delivery/cities/city-plateau');
```

**Réponse (204 No Content):** Pas de contenu

---

#### 🔹 Changer le statut d'une ville

```http
PATCH /delivery/cities/:id/toggle-status
```

**Exemple:**

```typescript
const toggled = await apiClient.patch('/delivery/cities/city-plateau/toggle-status');
```

**Réponse (200 OK):** Ville avec statut inversé (active ↔ inactive)

---

### 2. REGIONS (13 Régions du Sénégal)

#### 🔹 Récupérer toutes les régions

```http
GET /delivery/regions
```

**Exemple:**

```typescript
const regions = await apiClient.get('/delivery/regions');
```

**Réponse (200 OK):**

```json
[
  {
    "id": "region-diourbel",
    "name": "Diourbel",
    "status": "active",
    "price": "3000.00",
    "deliveryTimeMin": 2,
    "deliveryTimeMax": 4,
    "deliveryTimeUnit": "jours",
    "mainCities": "Diourbel, Bambey, Mbacké",
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:00:00.000Z"
  },
  {
    "id": "region-thies",
    "name": "Thiès",
    "status": "active",
    "price": "2000.00",
    "deliveryTimeMin": 1,
    "deliveryTimeMax": 2,
    "deliveryTimeUnit": "jours",
    "mainCities": "Thiès, Mbour, Tivaouane",
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:00:00.000Z"
  }
]
```

---

#### 🔹 Récupérer une région par ID

```http
GET /delivery/regions/:id
```

**Exemple:**

```typescript
const region = await apiClient.get('/delivery/regions/region-diourbel');
```

**Réponse (200 OK):** Région complète

---

#### 🔹 Créer une région

```http
POST /delivery/regions
```

**Body:**

```json
{
  "name": "Nouvelle Région",
  "status": "active",
  "price": 3500,
  "deliveryTimeMin": 3,
  "deliveryTimeMax": 5,
  "deliveryTimeUnit": "jours",
  "mainCities": "Ville1, Ville2, Ville3"
}
```

**Exemple:**

```typescript
const newRegion = await apiClient.post('/delivery/regions', {
  name: 'Nouvelle Région',
  status: 'active',
  price: 3500,
  deliveryTimeMin: 3,
  deliveryTimeMax: 5,
  deliveryTimeUnit: 'jours',
  mainCities: 'Ville1, Ville2, Ville3',
});
```

**Réponse (201 Created):** Région créée

**Erreur (409 Conflict):**

```json
{
  "statusCode": 409,
  "message": "Region with name Diourbel already exists",
  "error": "Conflict"
}
```

---

#### 🔹 Mettre à jour une région

```http
PUT /delivery/regions/:id
```

**Body:** Champs partiels

**Exemple:**

```typescript
const updated = await apiClient.put('/delivery/regions/region-diourbel', {
  price: 3200,
});
```

---

#### 🔹 Supprimer une région

```http
DELETE /delivery/regions/:id
```

**Réponse (204 No Content)**

---

#### 🔹 Changer le statut d'une région

```http
PATCH /delivery/regions/:id/toggle-status
```

**Réponse (200 OK):** Région avec statut inversé

---

### 3. INTERNATIONAL ZONES (Zones Internationales)

#### 🔹 Récupérer toutes les zones internationales

```http
GET /delivery/international-zones
```

**Exemple:**

```typescript
const zones = await apiClient.get('/delivery/international-zones');
```

**Réponse (200 OK):**

```json
[
  {
    "id": "zone-afrique-de-louest",
    "name": "Afrique de l'Ouest",
    "status": "active",
    "price": "15000.00",
    "deliveryTimeMin": 5,
    "deliveryTimeMax": 10,
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:00:00.000Z",
    "countries": ["Mali", "Mauritanie", "Guinée", "Côte d'Ivoire", "Burkina Faso", "Niger"]
  },
  {
    "id": "zone-europe",
    "name": "Europe",
    "status": "active",
    "price": "30000.00",
    "deliveryTimeMin": 7,
    "deliveryTimeMax": 14,
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:00:00.000Z",
    "countries": ["France", "Belgique", "Espagne", "Italie", "Allemagne", "Royaume-Uni"]
  }
]
```

---

#### 🔹 Récupérer une zone internationale par ID

```http
GET /delivery/international-zones/:id
```

**Exemple:**

```typescript
const zone = await apiClient.get('/delivery/international-zones/zone-afrique-de-louest');
```

**Réponse (200 OK):** Zone avec ses pays

---

#### 🔹 Créer une zone internationale

```http
POST /delivery/international-zones
```

**Body:**

```json
{
  "name": "Nouvelle Zone",
  "countries": ["Pays1", "Pays2", "Pays3"],
  "status": "active",
  "price": 20000,
  "deliveryTimeMin": 7,
  "deliveryTimeMax": 14
}
```

**Exemple:**

```typescript
const newZone = await apiClient.post('/delivery/international-zones', {
  name: 'Nouvelle Zone',
  countries: ['Pays1', 'Pays2', 'Pays3'],
  status: 'active',
  price: 20000,
  deliveryTimeMin: 7,
  deliveryTimeMax: 14,
});
```

**Réponse (201 Created):** Zone créée avec ses pays

---

#### 🔹 Mettre à jour une zone internationale

```http
PUT /delivery/international-zones/:id
```

**Body:**

```json
{
  "name": "Nom Modifié",
  "countries": ["Nouveau1", "Nouveau2"],
  "price": 22000
}
```

**Note:** Si vous modifiez `countries`, les anciens pays seront supprimés et remplacés.

**Exemple:**

```typescript
const updated = await apiClient.put('/delivery/international-zones/zone-afrique-de-louest', {
  price: 16000,
  countries: ['Mali', 'Mauritanie', 'Guinée', 'Burkina Faso'], // Nouvelle liste
});
```

---

#### 🔹 Supprimer une zone internationale

```http
DELETE /delivery/international-zones/:id
```

**Note:** Les pays associés seront automatiquement supprimés (cascade).

**Réponse (204 No Content)**

---

#### 🔹 Changer le statut d'une zone internationale

```http
PATCH /delivery/international-zones/:id/toggle-status
```

**Réponse (200 OK):** Zone avec statut inversé

---

### 4. TRANSPORTEURS

#### 🔹 Récupérer tous les transporteurs

```http
GET /delivery/transporteurs
```

**Exemple:**

```typescript
const transporteurs = await apiClient.get('/delivery/transporteurs');
```

**Réponse (200 OK):**

```json
[
  {
    "id": "transporteur-uuid",
    "name": "DHL",
    "logoUrl": "https://example.com/dhl-logo.png",
    "status": "active",
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:00:00.000Z",
    "deliveryZones": ["zone-afrique-de-louest", "zone-europe"]
  }
]
```

---

#### 🔹 Récupérer un transporteur par ID

```http
GET /delivery/transporteurs/:id
```

**Exemple:**

```typescript
const transporteur = await apiClient.get('/delivery/transporteurs/transporteur-uuid');
```

---

#### 🔹 Créer un transporteur

```http
POST /delivery/transporteurs
```

**Body:**

```json
{
  "name": "FedEx",
  "logoUrl": "https://example.com/fedex-logo.png",
  "deliveryZones": ["zone-europe", "zone-amerique-du-nord"],
  "status": "active"
}
```

**Exemple:**

```typescript
const newTransporteur = await apiClient.post('/delivery/transporteurs', {
  name: 'FedEx',
  logoUrl: 'https://example.com/fedex-logo.png',
  deliveryZones: ['zone-europe'],
  status: 'active',
});
```

**Réponse (201 Created):** Transporteur créé

---

#### 🔹 Mettre à jour un transporteur

```http
PUT /delivery/transporteurs/:id
```

**Body:**

```json
{
  "name": "DHL Express",
  "logoUrl": "https://example.com/new-logo.png",
  "deliveryZones": ["zone-afrique-de-louest", "zone-europe", "zone-asie"]
}
```

---

#### 🔹 Supprimer un transporteur

```http
DELETE /delivery/transporteurs/:id
```

**Réponse (204 No Content)**

---

#### 🔹 Changer le statut d'un transporteur

```http
PATCH /delivery/transporteurs/:id/toggle-status
```

---

### 5. ZONE TARIFS

#### 🔹 Récupérer tous les tarifs de zones

```http
GET /delivery/zone-tarifs
```

**Exemple:**

```typescript
const tarifs = await apiClient.get('/delivery/zone-tarifs');
```

**Réponse (200 OK):**

```json
[
  {
    "id": "tarif-uuid",
    "zoneId": "zone-afrique-de-louest",
    "zoneName": "Afrique de l'Ouest",
    "transporteurId": "transporteur-uuid",
    "transporteurName": "DHL",
    "prixTransporteur": "25000.00",
    "prixStandardInternational": "15000.00",
    "delaiLivraisonMin": 5,
    "delaiLivraisonMax": 10,
    "status": "active",
    "createdAt": "2025-11-21T10:00:00.000Z",
    "updatedAt": "2025-11-21T10:00:00.000Z"
  }
]
```

---

#### 🔹 Récupérer un tarif par ID

```http
GET /delivery/zone-tarifs/:id
```

---

#### 🔹 Créer un tarif de zone

```http
POST /delivery/zone-tarifs
```

**Body:**

```json
{
  "zoneId": "zone-afrique-de-louest",
  "zoneName": "Afrique de l'Ouest",
  "transporteurId": "transporteur-uuid",
  "transporteurName": "DHL",
  "prixTransporteur": 25000,
  "prixStandardInternational": 15000,
  "delaiLivraisonMin": 5,
  "delaiLivraisonMax": 10,
  "status": "active"
}
```

---

#### 🔹 Mettre à jour un tarif de zone

```http
PUT /delivery/zone-tarifs/:id
```

---

#### 🔹 Supprimer un tarif de zone

```http
DELETE /delivery/zone-tarifs/:id
```

---

#### 🔹 Changer le statut d'un tarif de zone

```http
PATCH /delivery/zone-tarifs/:id/toggle-status
```

---

### 6. CALCUL DE FRAIS DE LIVRAISON

#### 🔹 Calculer les frais de livraison

```http
GET /delivery/calculate-fee?cityId={cityId}&regionId={regionId}&internationalZoneId={internationalZoneId}
```

**Query Parameters (UN SEUL requis):**
- `cityId`: ID de la ville
- `regionId`: ID de la région
- `internationalZoneId`: ID de la zone internationale

**Exemples:**

```typescript
// Pour une ville
const feeCity = await apiClient.get('/delivery/calculate-fee?cityId=city-plateau');

// Pour une région
const feeRegion = await apiClient.get('/delivery/calculate-fee?regionId=region-diourbel');

// Pour une zone internationale
const feeInternational = await apiClient.get('/delivery/calculate-fee?internationalZoneId=zone-afrique-de-louest');
```

**Réponse (200 OK):**

```json
{
  "fee": 1500,
  "deliveryTime": "24-48 heures"
}
```

**Erreur (400 Bad Request):**

```json
{
  "statusCode": 400,
  "message": "At least one parameter (cityId, regionId, or internationalZoneId) must be provided",
  "error": "Bad Request"
}
```

```json
{
  "statusCode": 400,
  "message": "Only one parameter (cityId, regionId, or internationalZoneId) can be provided",
  "error": "Bad Request"
}
```

---

## Exemples d'Intégration

### Service Complet pour le Frontend

```typescript
// src/services/deliveryService.ts
import apiClient from './api';

export interface City {
  id: string;
  name: string;
  category: string;
  zoneType: 'dakar-ville' | 'banlieue';
  status: 'active' | 'inactive';
  price: string;
  isFree: boolean;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  deliveryTimeUnit?: 'heures' | 'jours';
  createdAt: string;
  updatedAt: string;
}

export interface Region {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  price: string;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryTimeUnit: string;
  mainCities?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InternationalZone {
  id: string;
  name: string;
  status: 'active' | 'inactive';
  price: string;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Transporteur {
  id: string;
  name: string;
  logoUrl?: string;
  status: 'active' | 'inactive';
  deliveryZones: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ZoneTarif {
  id: string;
  zoneId: string;
  zoneName: string;
  transporteurId: string;
  transporteurName: string;
  prixTransporteur: string;
  prixStandardInternational: string;
  delaiLivraisonMin: number;
  delaiLivraisonMax: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface DeliveryFee {
  fee: number;
  deliveryTime: string;
}

class DeliveryService {
  // ========== CITIES ==========
  async getCities(zoneType?: 'dakar-ville' | 'banlieue'): Promise<City[]> {
    const params = zoneType ? { zoneType } : {};
    const response = await apiClient.get('/delivery/cities', { params });
    return response.data;
  }

  async getCityById(id: string): Promise<City> {
    const response = await apiClient.get(`/delivery/cities/${id}`);
    return response.data;
  }

  async createCity(data: Partial<City>): Promise<City> {
    const response = await apiClient.post('/delivery/cities', data);
    return response.data;
  }

  async updateCity(id: string, data: Partial<City>): Promise<City> {
    const response = await apiClient.put(`/delivery/cities/${id}`, data);
    return response.data;
  }

  async deleteCity(id: string): Promise<void> {
    await apiClient.delete(`/delivery/cities/${id}`);
  }

  async toggleCityStatus(id: string): Promise<City> {
    const response = await apiClient.patch(`/delivery/cities/${id}/toggle-status`);
    return response.data;
  }

  // ========== REGIONS ==========
  async getRegions(): Promise<Region[]> {
    const response = await apiClient.get('/delivery/regions');
    return response.data;
  }

  async getRegionById(id: string): Promise<Region> {
    const response = await apiClient.get(`/delivery/regions/${id}`);
    return response.data;
  }

  async createRegion(data: Partial<Region>): Promise<Region> {
    const response = await apiClient.post('/delivery/regions', data);
    return response.data;
  }

  async updateRegion(id: string, data: Partial<Region>): Promise<Region> {
    const response = await apiClient.put(`/delivery/regions/${id}`, data);
    return response.data;
  }

  async deleteRegion(id: string): Promise<void> {
    await apiClient.delete(`/delivery/regions/${id}`);
  }

  async toggleRegionStatus(id: string): Promise<Region> {
    const response = await apiClient.patch(`/delivery/regions/${id}/toggle-status`);
    return response.data;
  }

  // ========== INTERNATIONAL ZONES ==========
  async getInternationalZones(): Promise<InternationalZone[]> {
    const response = await apiClient.get('/delivery/international-zones');
    return response.data;
  }

  async getInternationalZoneById(id: string): Promise<InternationalZone> {
    const response = await apiClient.get(`/delivery/international-zones/${id}`);
    return response.data;
  }

  async createInternationalZone(data: Partial<InternationalZone>): Promise<InternationalZone> {
    const response = await apiClient.post('/delivery/international-zones', data);
    return response.data;
  }

  async updateInternationalZone(id: string, data: Partial<InternationalZone>): Promise<InternationalZone> {
    const response = await apiClient.put(`/delivery/international-zones/${id}`, data);
    return response.data;
  }

  async deleteInternationalZone(id: string): Promise<void> {
    await apiClient.delete(`/delivery/international-zones/${id}`);
  }

  async toggleInternationalZoneStatus(id: string): Promise<InternationalZone> {
    const response = await apiClient.patch(`/delivery/international-zones/${id}/toggle-status`);
    return response.data;
  }

  // ========== TRANSPORTEURS ==========
  async getTransporteurs(): Promise<Transporteur[]> {
    const response = await apiClient.get('/delivery/transporteurs');
    return response.data;
  }

  async getTransporteurById(id: string): Promise<Transporteur> {
    const response = await apiClient.get(`/delivery/transporteurs/${id}`);
    return response.data;
  }

  async createTransporteur(data: Partial<Transporteur>): Promise<Transporteur> {
    const response = await apiClient.post('/delivery/transporteurs', data);
    return response.data;
  }

  async updateTransporteur(id: string, data: Partial<Transporteur>): Promise<Transporteur> {
    const response = await apiClient.put(`/delivery/transporteurs/${id}`, data);
    return response.data;
  }

  async deleteTransporteur(id: string): Promise<void> {
    await apiClient.delete(`/delivery/transporteurs/${id}`);
  }

  async toggleTransporteurStatus(id: string): Promise<Transporteur> {
    const response = await apiClient.patch(`/delivery/transporteurs/${id}/toggle-status`);
    return response.data;
  }

  // ========== ZONE TARIFS ==========
  async getZoneTarifs(): Promise<ZoneTarif[]> {
    const response = await apiClient.get('/delivery/zone-tarifs');
    return response.data;
  }

  async getZoneTarifById(id: string): Promise<ZoneTarif> {
    const response = await apiClient.get(`/delivery/zone-tarifs/${id}`);
    return response.data;
  }

  async createZoneTarif(data: Partial<ZoneTarif>): Promise<ZoneTarif> {
    const response = await apiClient.post('/delivery/zone-tarifs', data);
    return response.data;
  }

  async updateZoneTarif(id: string, data: Partial<ZoneTarif>): Promise<ZoneTarif> {
    const response = await apiClient.put(`/delivery/zone-tarifs/${id}`, data);
    return response.data;
  }

  async deleteZoneTarif(id: string): Promise<void> {
    await apiClient.delete(`/delivery/zone-tarifs/${id}`);
  }

  async toggleZoneTarifStatus(id: string): Promise<ZoneTarif> {
    const response = await apiClient.patch(`/delivery/zone-tarifs/${id}/toggle-status`);
    return response.data;
  }

  // ========== CALCUL DE FRAIS ==========
  async calculateDeliveryFee(params: {
    cityId?: string;
    regionId?: string;
    internationalZoneId?: string;
  }): Promise<DeliveryFee> {
    const response = await apiClient.get('/delivery/calculate-fee', { params });
    return response.data;
  }
}

export default new DeliveryService();
```

---

### Exemple d'utilisation dans un Composant React

```typescript
// CitySelector.tsx
import React, { useEffect, useState } from 'react';
import deliveryService, { City } from '@/services/deliveryService';

export const CitySelector: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCities();
  }, []);

  const loadCities = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deliveryService.getCities('dakar-ville');
      setCities(data.filter(c => c.status === 'active'));
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des villes');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateFee = async () => {
    if (!selectedCity) return;

    try {
      const result = await deliveryService.calculateDeliveryFee({
        cityId: selectedCity,
      });
      alert(`Frais: ${result.fee} FCFA\nDélai: ${result.deliveryTime}`);
    } catch (err: any) {
      alert('Erreur lors du calcul des frais');
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error}</div>;

  return (
    <div>
      <select
        value={selectedCity}
        onChange={(e) => setSelectedCity(e.target.value)}
      >
        <option value="">Sélectionnez une ville</option>
        {cities.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name} - {city.isFree ? 'Gratuit' : `${city.price} FCFA`}
          </option>
        ))}
      </select>
      <button onClick={handleCalculateFee}>Calculer les frais</button>
    </div>
  );
};
```

---

### Exemple d'utilisation avec React Query (Recommandé)

```typescript
// hooks/useDelivery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import deliveryService, { City } from '@/services/deliveryService';

// Hook pour récupérer les villes
export const useCities = (zoneType?: 'dakar-ville' | 'banlieue') => {
  return useQuery({
    queryKey: ['cities', zoneType],
    queryFn: () => deliveryService.getCities(zoneType),
  });
};

// Hook pour récupérer les régions
export const useRegions = () => {
  return useQuery({
    queryKey: ['regions'],
    queryFn: () => deliveryService.getRegions(),
  });
};

// Hook pour récupérer les zones internationales
export const useInternationalZones = () => {
  return useQuery({
    queryKey: ['international-zones'],
    queryFn: () => deliveryService.getInternationalZones(),
  });
};

// Hook pour créer une ville
export const useCreateCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<City>) => deliveryService.createCity(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
    },
  });
};

// Hook pour mettre à jour une ville
export const useUpdateCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<City> }) =>
      deliveryService.updateCity(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
    },
  });
};

// Hook pour supprimer une ville
export const useDeleteCity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deliveryService.deleteCity(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
    },
  });
};

// Hook pour toggle status
export const useToggleCityStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deliveryService.toggleCityStatus(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cities'] });
    },
  });
};

// Hook pour calculer les frais
export const useCalculateDeliveryFee = () => {
  return useMutation({
    mutationFn: (params: {
      cityId?: string;
      regionId?: string;
      internationalZoneId?: string;
    }) => deliveryService.calculateDeliveryFee(params),
  });
};
```

**Utilisation dans un composant:**

```typescript
import { useCities, useToggleCityStatus } from '@/hooks/useDelivery';

export const CitiesList: React.FC = () => {
  const { data: cities, isLoading, error } = useCities('dakar-ville');
  const toggleStatus = useToggleCityStatus();

  const handleToggle = async (id: string) => {
    try {
      await toggleStatus.mutateAsync(id);
    } catch (err) {
      console.error('Erreur:', err);
    }
  };

  if (isLoading) return <div>Chargement...</div>;
  if (error) return <div>Erreur: {error.message}</div>;

  return (
    <div>
      {cities?.map((city) => (
        <div key={city.id}>
          <span>{city.name}</span>
          <span>{city.price} FCFA</span>
          <button onClick={() => handleToggle(city.id)}>
            {city.status === 'active' ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      ))}
    </div>
  );
};
```

---

## Gestion des Erreurs

### Codes de Statut HTTP

| Code | Signification | Quand cela arrive |
|------|--------------|-------------------|
| 200 | OK | Requête réussie (GET, PUT, PATCH) |
| 201 | Created | Ressource créée (POST) |
| 204 | No Content | Suppression réussie (DELETE) |
| 400 | Bad Request | Données invalides, paramètres manquants |
| 401 | Unauthorized | Non authentifié (token manquant/invalide) |
| 403 | Forbidden | Non autorisé (pas les permissions) |
| 404 | Not Found | Ressource introuvable |
| 409 | Conflict | Conflit (ex: nom déjà existant) |
| 500 | Internal Server Error | Erreur serveur |

### Gestion Globale des Erreurs

```typescript
// src/services/api.ts
import axios, { AxiosError } from 'axios';

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 400:
          console.error('Requête invalide:', data);
          break;
        case 401:
          console.error('Non authentifié');
          // Rediriger vers login
          window.location.href = '/login';
          break;
        case 403:
          console.error('Non autorisé');
          break;
        case 404:
          console.error('Ressource non trouvée');
          break;
        case 409:
          console.error('Conflit:', data);
          break;
        case 500:
          console.error('Erreur serveur');
          break;
      }
    }

    return Promise.reject(error);
  }
);
```

---

## Types TypeScript

### Fichier de Types Complet

```typescript
// src/types/delivery.ts

export type ZoneType = 'dakar-ville' | 'banlieue';
export type Status = 'active' | 'inactive';
export type TimeUnit = 'heures' | 'jours';
export type Category = 'Centre' | 'Résidentiel' | 'Populaire' | 'Banlieue';

export interface City {
  id: string;
  name: string;
  category: Category;
  zoneType: ZoneType;
  status: Status;
  price: string; // Decimal as string
  isFree: boolean;
  deliveryTimeMin?: number | null;
  deliveryTimeMax?: number | null;
  deliveryTimeUnit?: TimeUnit | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCityDto {
  name: string;
  category: Category;
  zoneType: ZoneType;
  status?: Status;
  price: number;
  isFree: boolean;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  deliveryTimeUnit?: TimeUnit;
}

export interface UpdateCityDto {
  name?: string;
  category?: Category;
  zoneType?: ZoneType;
  status?: Status;
  price?: number;
  isFree?: boolean;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  deliveryTimeUnit?: TimeUnit;
}

export interface Region {
  id: string;
  name: string;
  status: Status;
  price: string; // Decimal as string
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryTimeUnit: string;
  mainCities?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRegionDto {
  name: string;
  status?: Status;
  price: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  deliveryTimeUnit?: string;
  mainCities?: string;
}

export interface UpdateRegionDto {
  name?: string;
  status?: Status;
  price?: number;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  deliveryTimeUnit?: string;
  mainCities?: string;
}

export interface InternationalZone {
  id: string;
  name: string;
  status: Status;
  price: string; // Decimal as string
  deliveryTimeMin: number;
  deliveryTimeMax: number;
  countries: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateInternationalZoneDto {
  name: string;
  countries: string[];
  status?: Status;
  price: number;
  deliveryTimeMin: number;
  deliveryTimeMax: number;
}

export interface UpdateInternationalZoneDto {
  name?: string;
  countries?: string[];
  status?: Status;
  price?: number;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
}

export interface Transporteur {
  id: string;
  name: string;
  logoUrl?: string | null;
  status: Status;
  deliveryZones: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransporteurDto {
  name: string;
  logoUrl?: string;
  deliveryZones?: string[];
  status?: Status;
}

export interface UpdateTransporteurDto {
  name?: string;
  logoUrl?: string;
  deliveryZones?: string[];
  status?: Status;
}

export interface ZoneTarif {
  id: string;
  zoneId: string;
  zoneName: string;
  transporteurId: string;
  transporteurName: string;
  prixTransporteur: string; // Decimal as string
  prixStandardInternational: string; // Decimal as string
  delaiLivraisonMin: number;
  delaiLivraisonMax: number;
  status: Status;
  createdAt: string;
  updatedAt: string;
}

export interface CreateZoneTarifDto {
  zoneId: string;
  zoneName: string;
  transporteurId: string;
  transporteurName: string;
  prixTransporteur: number;
  prixStandardInternational: number;
  delaiLivraisonMin: number;
  delaiLivraisonMax: number;
  status?: Status;
}

export interface UpdateZoneTarifDto {
  zoneId?: string;
  zoneName?: string;
  transporteurId?: string;
  transporteurName?: string;
  prixTransporteur?: number;
  prixStandardInternational?: number;
  delaiLivraisonMin?: number;
  delaiLivraisonMax?: number;
  status?: Status;
}

export interface DeliveryFee {
  fee: number;
  deliveryTime: string;
}

export interface DeliveryFeeParams {
  cityId?: string;
  regionId?: string;
  internationalZoneId?: string;
}
```

---

## Notes Importantes

### 🔐 Authentification

Les endpoints de création, modification et suppression nécessitent une authentification admin. Assurez-vous d'inclure le token JWT dans les headers:

```typescript
Authorization: Bearer <votre-token>
```

### 💰 Format des Prix

Les prix sont retournés sous forme de string avec 2 décimales (ex: `"1500.00"`). Pour l'affichage:

```typescript
const priceNumber = parseFloat(city.price); // 1500.00
const formattedPrice = `${priceNumber} FCFA`; // "1500 FCFA"
```

### 📅 Format des Dates

Les dates sont au format ISO 8601:
```
2025-11-21T10:00:00.000Z
```

Pour formater:

```typescript
const date = new Date(city.createdAt);
const formatted = date.toLocaleDateString('fr-FR');
```

### ⚠️ Validation des Données

Toutes les données sont validées côté backend avec `class-validator`. Les erreurs de validation retournent un code 400 avec les détails.

---

## 🚀 Checklist d'Intégration

- [ ] Configurer l'URL de base de l'API
- [ ] Implémenter le service `deliveryService.ts`
- [ ] Créer les types TypeScript
- [ ] Implémenter les hooks React Query (optionnel mais recommandé)
- [ ] Créer les composants UI (formulaires, listes, etc.)
- [ ] Gérer les erreurs globalement
- [ ] Ajouter les intercepteurs Axios pour l'authentification
- [ ] Tester tous les endpoints
- [ ] Gérer les états de chargement
- [ ] Ajouter des notifications de succès/erreur

---

## 📞 Support

Pour toute question ou problème:
1. Consultez la documentation Swagger: `http://localhost:3004/api-docs`
2. Vérifiez les logs du serveur backend
3. Contactez l'équipe backend

---

**Version:** 1.0
**Date:** 2025-11-21
**Auteur:** PrintAlma Team

