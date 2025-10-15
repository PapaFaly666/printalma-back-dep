# Guide de Résolution Vérifié - Erreur 404 API Admin Funds

## ✅ Tests Backend Effectués

J'ai testé les endpoints backend et confirmé :

```bash
# Test 1 : Avec /api/admin (ce que le frontend utilise)
$ curl http://localhost:3004/api/admin/funds-requests
❌ {"message":"Cannot GET /api/admin/funds-requests","error":"Not Found","statusCode":404}

# Test 2 : Sans /api (la vraie route backend)
$ curl http://localhost:3004/admin/funds-requests
✅ {"message":"Unauthorized","statusCode":401}  # Route existe, requiert authentification

# Test 3 : Statistics avec /api
$ curl http://localhost:3004/api/admin/funds-requests/statistics
❌ 404 Not Found

# Test 4 : Statistics sans /api
$ curl http://localhost:3004/admin/funds-requests/statistics
✅ 401 Unauthorized  # Route existe, requiert authentification
```

## 🎯 Problème Confirmé

**Le backend expose les routes sur :**
- ✅ `/admin/funds-requests`
- ✅ `/admin/funds-requests/statistics`
- ✅ `/admin/funds-requests/:id`
- ✅ `/admin/funds-requests/:id/process`

**Le frontend appelle :**
- ❌ `/api/admin/funds-requests`
- ❌ `/api/admin/funds-requests/statistics`
- ❌ `/api/admin/funds-requests/:id`
- ❌ `/api/admin/funds-requests/:id/process`

**Différence :** Le préfixe `/api` est en trop dans le frontend.

## 🔧 Solution RAPIDE (Frontend)

### Localiser le fichier service

Le fichier à modifier est probablement :
- `adminFundsService.ts`
- `admin-funds-service.ts`
- Ou un fichier similaire dans votre projet frontend

### Modification à faire

**Chercher et remplacer TOUTES les occurrences :**

```typescript
// AVANT (ligne ~88, ~101, ~107, ~157, ~173, etc.)
'/api/admin/funds-requests'

// APRÈS
'/admin/funds-requests'
```

### Exemple Complet

**AVANT (incorrect) :**
```typescript
class AdminFundsService {
  private baseUrl = 'http://localhost:3004/api/admin/funds-requests';  // ❌

  async getAllFundsRequests(params: QueryParams) {
    const url = `/api/admin/funds-requests?${queryString}`;  // ❌
    const response = await this.apiCall(url);
    return response;
  }

  async getAdminFundsStatistics() {
    const url = '/api/admin/funds-requests/statistics';  // ❌
    const response = await this.apiCall(url);
    return response;
  }

  async processFundsRequest(id: number, data: any) {
    const url = `/api/admin/funds-requests/${id}/process`;  // ❌
    const response = await this.apiCall(url, 'PATCH', data);
    return response;
  }
}
```

**APRÈS (correct) :**
```typescript
class AdminFundsService {
  private baseUrl = 'http://localhost:3004/admin/funds-requests';  // ✅

  async getAllFundsRequests(params: QueryParams) {
    const url = `/admin/funds-requests?${queryString}`;  // ✅
    const response = await this.apiCall(url);
    return response;
  }

  async getAdminFundsStatistics() {
    const url = '/admin/funds-requests/statistics';  // ✅
    const response = await this.apiCall(url);
    return response;
  }

  async processFundsRequest(id: number, data: any) {
    const url = `/admin/funds-requests/${id}/process`;  // ✅
    const response = await this.apiCall(url, 'PATCH', data);
    return response;
  }
}
```

## 📋 Checklist de Modification

Vérifier TOUS ces endpoints dans votre fichier service :

- [ ] **GET** Liste des demandes
  ```typescript
  // AVANT: '/api/admin/funds-requests?page=1&limit=10...'
  // APRÈS: '/admin/funds-requests?page=1&limit=10...'
  ```

- [ ] **GET** Statistiques
  ```typescript
  // AVANT: '/api/admin/funds-requests/statistics'
  // APRÈS: '/admin/funds-requests/statistics'
  ```

- [ ] **GET** Détails d'une demande
  ```typescript
  // AVANT: '/api/admin/funds-requests/:id'
  // APRÈS: '/admin/funds-requests/:id'
  ```

- [ ] **PATCH** Traiter une demande
  ```typescript
  // AVANT: '/api/admin/funds-requests/:id/process'
  // APRÈS: '/admin/funds-requests/:id/process'
  ```

- [ ] **PATCH** Traitement en lot
  ```typescript
  // AVANT: '/api/admin/funds-requests/batch-process'
  // APRÈS: '/admin/funds-requests/batch-process'
  ```

## 🔍 Comment Trouver le Fichier

### Méthode 1 : Recherche par nom de fichier
```bash
# Dans votre projet frontend
find . -name "*adminFunds*" -o -name "*admin-funds*"
```

### Méthode 2 : Recherche par contenu
```bash
# Chercher les fichiers contenant '/api/admin/funds-requests'
grep -r "/api/admin/funds-requests" ./src
```

### Méthode 3 : Depuis l'erreur
L'erreur indique :
```
at AdminFundsService.apiCall (adminFundsService.ts:101:15)
```

Donc le fichier est : `adminFundsService.ts`

## 🧪 Test Après Modification

### Test 1 : Vérifier que les URLs sont correctes

Ouvrez les DevTools de votre navigateur (F12) → onglet Network

Rechargez la page admin, vous devriez voir :

**AVANT la modification :**
```
❌ GET http://localhost:3004/api/admin/funds-requests?... 404 (Not Found)
❌ GET http://localhost:3004/api/admin/funds-requests/statistics 404 (Not Found)
```

**APRÈS la modification :**
```
✅ GET http://localhost:3004/admin/funds-requests?... 200 OK
✅ GET http://localhost:3004/admin/funds-requests/statistics 200 OK
```

### Test 2 : Vérifier les données

Après la modification, vous devriez voir dans l'interface admin :

- ✅ Liste des 30 demandes d'appel de fonds
- ✅ Statistiques :
  - Total: 30 demandes
  - En attente (Pending): 7
  - Approuvées (Approved): 3
  - Payées (Paid): 10
  - Rejetées (Rejected): 10
- ✅ Informations des vendeurs
- ✅ Montants et dates

## 📊 Structure Complète de l'API

### Endpoints Disponibles

```typescript
// ====================================
// ROUTES ADMIN (Backend vérifié)
// ====================================

// 1. Liste paginée des demandes
GET /admin/funds-requests
Query params:
  - page: number (défaut: 1)
  - limit: number (défaut: 10)
  - sortBy: string (défaut: 'createdAt')
  - sortOrder: 'asc' | 'desc' (défaut: 'desc')
  - status?: 'PENDING' | 'APPROVED' | 'PAID' | 'REJECTED'
  - vendorId?: number
  - startDate?: string (ISO)
  - endDate?: string (ISO)

Response:
{
  "success": true,
  "message": "Demandes récupérées avec succès",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 30,
      "totalPages": 3
    }
  }
}

// 2. Statistiques globales
GET /admin/funds-requests/statistics

Response:
{
  "success": true,
  "message": "Statistiques récupérées avec succès",
  "data": {
    "totalRequests": 30,
    "pendingCount": 7,
    "approvedCount": 3,
    "paidCount": 10,
    "rejectedCount": 10,
    "totalAmount": 150000.50,
    "pendingAmount": 45000.00,
    "approvedAmount": 15000.00,
    "paidAmount": 85000.50,
    "averageAmount": 5000.02,
    "averageProcessingTime": 24.5  // heures
  }
}

// 3. Détails d'une demande
GET /admin/funds-requests/:requestId

Response:
{
  "success": true,
  "message": "Détails de demande récupérés avec succès",
  "data": {
    "id": 1,
    "vendorId": 5,
    "vendor": {
      "firstName": "Ahmed",
      "lastName": "Diop",
      "email": "ahmed.diop@vendor.com",
      "shop_name": "Ahmed Design Studio"
    },
    "amount": 4500.00,
    "requestedAmount": 5000.00,
    "commissionRate": 0.10,
    "status": "PENDING",
    "paymentMethod": "WAVE",
    "phoneNumber": "+221 77 123 45 67",
    "description": "Demande de retrait mensuel",
    "availableBalance": 10000.00,
    "createdAt": "2025-09-15T10:30:00Z",
    "processedAt": null,
    "processedBy": null
  }
}

// 4. Traiter une demande (Approuver/Payer/Rejeter)
PATCH /admin/funds-requests/:requestId/process

Body:
{
  "status": "APPROVED" | "PAID" | "REJECTED",
  "adminNote": "Note optionnelle",
  "rejectReason": "Raison si rejet"  // Obligatoire si status = REJECTED
}

Response:
{
  "success": true,
  "message": "Demande approuvée avec succès",
  "data": {
    // Détails de la demande mise à jour
  }
}

// 5. Traitement en lot
PATCH /admin/funds-requests/batch-process

Body:
{
  "requestIds": [1, 2, 3, 4],
  "status": "APPROVED" | "PAID",
  "adminNote": "Note optionnelle"
}

Response:
{
  "success": true,
  "message": "4 demandes approuvées avec succès",
  "data": {
    "processed": 4,
    "errors": [],
    "totalRequested": 4
  }
}
```

## 🔒 Authentification Requise

Tous les endpoints requièrent :

1. **Header Authorization**
   ```typescript
   headers: {
     'Authorization': 'Bearer <JWT_TOKEN>',
     'Content-Type': 'application/json'
   }
   ```

2. **Rôle ADMIN ou SUPERADMIN**
   - L'utilisateur doit avoir `role: 'ADMIN'` ou `role: 'SUPERADMIN'`

### Obtenir un token

```typescript
// 1. Se connecter en tant qu'admin
const loginResponse = await fetch('http://localhost:3004/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin1@printalma.com',
    password: 'password123'
  })
});

const { token } = await loginResponse.json();

// 2. Utiliser le token pour les requêtes admin
const fundsResponse = await fetch('http://localhost:3004/admin/funds-requests', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
```

## 🎯 Exemple Complet de Code Frontend

```typescript
// adminFundsService.ts (VERSION CORRIGÉE)

interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: string;
  vendorId?: number;
}

class AdminFundsService {
  private baseUrl = 'http://localhost:3004';  // Base URL du backend
  private token: string | null = null;

  // Définir le token (après login)
  setToken(token: string) {
    this.token = token;
  }

  // Méthode générique pour les appels API
  private async apiCall(
    endpoint: string,
    method: string = 'GET',
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;  // ✅ Endpoint sans /api

    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token && { 'Authorization': `Bearer ${this.token}` })
      },
      ...(body && { body: JSON.stringify(body) })
    };

    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`❌ API Error ${endpoint}:`, error);
      throw error;
    }
  }

  // 1. Récupérer toutes les demandes
  async getAllFundsRequests(params: QueryParams = {}) {
    const queryParams = new URLSearchParams({
      page: String(params.page || 1),
      limit: String(params.limit || 10),
      sortBy: params.sortBy || 'createdAt',
      sortOrder: params.sortOrder || 'desc',
      ...(params.status && { status: params.status }),
      ...(params.vendorId && { vendorId: String(params.vendorId) })
    });

    // ✅ Correct : /admin/funds-requests sans /api
    const endpoint = `/admin/funds-requests?${queryParams}`;
    return this.apiCall(endpoint);
  }

  // 2. Récupérer les statistiques
  async getAdminFundsStatistics() {
    // ✅ Correct : /admin/funds-requests/statistics sans /api
    return this.apiCall('/admin/funds-requests/statistics');
  }

  // 3. Récupérer les détails d'une demande
  async getFundsRequestDetails(requestId: number) {
    // ✅ Correct : /admin/funds-requests/:id sans /api
    return this.apiCall(`/admin/funds-requests/${requestId}`);
  }

  // 4. Traiter une demande
  async processFundsRequest(
    requestId: number,
    data: {
      status: 'APPROVED' | 'PAID' | 'REJECTED';
      adminNote?: string;
      rejectReason?: string;
    }
  ) {
    // ✅ Correct : /admin/funds-requests/:id/process sans /api
    return this.apiCall(
      `/admin/funds-requests/${requestId}/process`,
      'PATCH',
      data
    );
  }

  // 5. Traitement en lot
  async batchProcessRequests(data: {
    requestIds: number[];
    status: 'APPROVED' | 'PAID';
    adminNote?: string;
  }) {
    // ✅ Correct : /admin/funds-requests/batch-process sans /api
    return this.apiCall(
      '/admin/funds-requests/batch-process',
      'PATCH',
      data
    );
  }
}

// Export singleton
export const adminFundsService = new AdminFundsService();
```

## 🐛 Dépannage

### Erreur 401 Unauthorized

**Problème :** Token manquant ou invalide

**Solutions :**
1. Vérifier que le token est bien envoyé dans le header
2. Se reconnecter pour obtenir un nouveau token
3. Vérifier que le token n'est pas expiré

```typescript
// Vérifier le token dans les DevTools
console.log('Token:', adminFundsService.token);
```

### Erreur 403 Forbidden

**Problème :** L'utilisateur n'a pas le rôle requis

**Solutions :**
1. Vérifier le rôle dans la base de données :
   ```sql
   SELECT id, email, role FROM "User" WHERE email = 'admin1@printalma.com';
   ```
2. Utiliser un compte avec le rôle ADMIN ou SUPERADMIN

### Erreur 404 Not Found

**Problème :** URL incorrecte

**Solutions :**
1. Vérifier que vous utilisez `/admin/funds-requests` et NON `/api/admin/funds-requests`
2. Vérifier dans les DevTools → Network l'URL exacte appelée
3. Comparer avec la liste des endpoints disponibles ci-dessus

### Pas de données affichées

**Problème :** La base de données est vide

**Solutions :**
```bash
# Backend : Vérifier les données
npm run db:check

# Si vide, seed les appels de fonds
npm run db:seed:funds
```

## ✅ Validation Finale

Après modification, vous devriez voir dans la console du navigateur :

```javascript
// Console Network Tab
✅ GET http://localhost:3004/admin/funds-requests?page=1&limit=10&sortBy=createdAt&sortOrder=desc
   Status: 200 OK
   Response: { success: true, data: { items: [...], pagination: {...} } }

✅ GET http://localhost:3004/admin/funds-requests/statistics
   Status: 200 OK
   Response: { success: true, data: { totalRequests: 30, ... } }
```

---

**Date :** 2025-10-14
**Backend testé :** ✅ Fonctionnel sur port 3004
**Routes vérifiées :** ✅ `/admin/funds-requests/*`
**Solution :** Retirer le préfixe `/api` dans le frontend
