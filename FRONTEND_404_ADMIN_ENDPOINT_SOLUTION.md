## Guide Frontend — Correction 404 sur Admin Funds Requests

**Problème**: Le frontend appelle `http://localhost:3004/api/admin/...` et reçoit 404. Le backend NestJS actuel n’utilise aucun préfixe global `api`.

**Constats backend**:
- Port serveur: `3004` (voir `src/main.ts`)
- Pas de `app.setGlobalPrefix('api')`
- Contrôleur admin funds: préfixe `@Controller('admin')`

Donc, les routes valides sont:
- `GET /admin/funds-requests`
- `GET /admin/funds-requests/statistics`
- `GET /admin/funds-requests/:requestId`
- `PATCH /admin/funds-requests/:requestId/process`
- `PATCH /admin/funds-requests/batch-process`

### Action immédiate côté frontend

- Remplacer toute URL commençant par `/api/admin/...` par `/admin/...`.
- Vérifier la base URL Axios/fetch: `http://localhost:3004`.
- Conserver l’authentification (Bearer token / cookies) selon votre app.

### Exemple d’implémentation `adminFundsService.ts`

```ts
// Base: http://localhost:3004
class AdminFundsService {
  private apiClient: ReturnType<typeof axios.create>;
  private baseURL = '/admin/funds-requests';

  constructor() {
    this.apiClient = axios.create({
      baseURL: 'http://localhost:3004',
      withCredentials: true,
    });

    this.apiClient.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers = config.headers ?? {};
        config.headers['Authorization'] = `Bearer ${token}`;
      }
      return config;
    });
  }

  async getAllFundsRequests(filters: {
    page?: number; limit?: number; status?: string; vendorId?: number;
    startDate?: string; endDate?: string; minAmount?: number; maxAmount?: number;
    sortBy?: string; sortOrder?: 'asc' | 'desc';
  } = {}) {
    const params = new URLSearchParams();
    if (filters.page) params.append('page', String(filters.page));
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.status) params.append('status', filters.status);
    if (filters.vendorId) params.append('vendorId', String(filters.vendorId));
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.minAmount) params.append('minAmount', String(filters.minAmount));
    if (filters.maxAmount) params.append('maxAmount', String(filters.maxAmount));
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    const url = params.toString()
      ? `${this.baseURL}?${params.toString()}`
      : this.baseURL;
    const { data } = await this.apiClient.get(url);
    return data;
  }

  async getAdminFundsStatistics() {
    const { data } = await this.apiClient.get(`${this.baseURL}/statistics`);
    return data;
  }

  async getFundsRequestDetails(requestId: number) {
    const { data } = await this.apiClient.get(`${this.baseURL}/${requestId}`);
    return data;
  }

  async markRequestAsPaid(requestId: number, adminNote?: string) {
    const payload = { status: 'PAID', adminNote: adminNote || 'Paiement effectué' };
    const { data } = await this.apiClient.patch(`${this.baseURL}/${requestId}/process`, payload);
    return data;
  }

  async batchPayRequests(requestIds: number[], adminNote?: string) {
    const payload = { requestIds, status: 'PAID', adminNote: adminNote || 'Paiement en lot effectué' };
    const { data } = await this.apiClient.patch(`${this.baseURL}/batch-process`, payload);
    return data;
  }
}
```

### Checklist de vérification

- **Base URL**: `http://localhost:3004`
- **Pas de `/api`** dans le chemin
- **CORS**: origin frontend autorisé (`http://localhost:5174`) — OK dans `src/main.ts`
- **Auth**: Header `Authorization: Bearer <token>` si requis

### Option B (si vous voulez conserver `/api` côté frontend)

Ajoutez dans le backend au bootstrap:

```ts
// src/main.ts
app.setGlobalPrefix('api');
```

Puis utilisez `/api/admin/...` côté frontend. Attention: cela change toutes les routes backend et la doc Swagger (à mettre à jour en conséquence).

# 🚨 SOLUTION PROBLÈME 404 - ENDPOINT ADMIN VALIDATION

## 📋 Problème identifié

L'erreur dans `ha.md` montre :
```
GET http://localhost:5174/api/admin/products/validation?page=1&limit=20&search= 404 (Not Found)
```

**Le frontend sur le port 5174 essaie d'accéder à l'API mais reçoit une 404.**

## 🔍 Analyse

1. ✅ **Backend**: Le contrôleur `AdminWizardValidationController` existe et est bien configuré
2. ✅ **Route**: `@Get('products/validation')` sur `@Controller('admin')` = `/api/admin/products/validation`
3. ✅ **Module**: Le contrôleur est enregistré dans `VendorProductModule`
4. ❌ **Problème**: Configuration frontend ou serveur backend non démarré

## 🎯 Solutions possibles

### **Solution 1: Vérifier que le serveur backend fonctionne**

```bash
# Démarrer le serveur backend
npm run start:dev

# Ou si c'est un autre script
npm start

# Vérifier que le serveur écoute sur le bon port (probablement 3000)
```

### **Solution 2: Configuration du proxy frontend**

Le frontend (port 5174) doit être configuré pour rediriger les appels `/api/*` vers le backend.

**Vite.js (vite.config.js/ts):**
```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000', // Port du backend
        changeOrigin: true,
        secure: false
      }
    }
  }
}
```

**Ou dans package.json (Create React App):**
```json
{
  "name": "frontend",
  "proxy": "http://localhost:3000"
}
```

### **Solution 3: URL absolue dans le service frontend**

Dans le fichier `ProductValidationService.ts`, utiliser l'URL complète du backend :

```javascript
// Au lieu de
const response = await fetch('/api/admin/products/validation?...')

// Utiliser
const response = await fetch('http://localhost:3000/api/admin/products/validation?...')
```

### **Solution 4: Variables d'environnement**

Créer un fichier `.env` dans le frontend :
```
VITE_API_BASE_URL=http://localhost:3000
# ou pour Create React App
REACT_APP_API_BASE_URL=http://localhost:3000
```

Puis dans le service :
```javascript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
// ou pour Create React App
// const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

const response = await fetch(`${API_BASE_URL}/api/admin/products/validation?...`)
```

## 🚀 Étapes de résolution recommandées

### 1. **Vérifier le backend** ⭐ PRIORITÉ
```bash
# Dans le dossier backend
npm run start:dev

# Vérifier dans le navigateur ou avec curl
# http://localhost:3000/api/admin/products/validation
# (avec les en-têtes d'authentification appropriés)
```

### 2. **Configurer le proxy frontend**
```javascript
// vite.config.js
export default {
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
}
```

### 3. **Redémarrer le frontend**
```bash
# Après modification de la config
npm run dev
```

### 4. **Tester l'endpoint**
Une fois le backend démarré et le proxy configuré, l'URL suivante devrait fonctionner :
`http://localhost:5174/api/admin/products/validation`

## 🔧 Configuration type pour un projet NestJS + React

**Backend (NestJS) - main.ts:**
```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api'); // Toutes les routes commencent par /api
  app.enableCors(); // Autoriser les requêtes cross-origin
  await app.listen(3000);
}
```

**Frontend (React/Vite) - vite.config.js:**
```javascript
export default {
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
}
```

## ⚠️ Points de vérification

- [ ] Backend NestJS démarré sur le port 3000
- [ ] Prefix global `/api` configuré dans NestJS
- [ ] CORS activé dans le backend
- [ ] Proxy configuré dans le frontend
- [ ] Frontend redémarré après modification de configuration
- [ ] Token d'authentification admin valide (si requis)

## 🎯 Résultat attendu

Après ces corrections, le frontend pourra accéder à :
```
GET http://localhost:5174/api/admin/products/validation
↓ (proxy redirection)
GET http://localhost:3000/api/admin/products/validation
```

Et retournera les produits WIZARD et traditionnels en attente de validation admin.

---

**🚨 En cas de problème persistant, vérifier les logs du backend NestJS pour plus de détails sur l'erreur.**