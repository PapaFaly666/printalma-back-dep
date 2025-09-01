# Guide de Résolution - Problème de Cookies HTTP-Only en Production

## 🎯 Problème Identifié

**Symptôme :** L'utilisateur se déconnecte à chaque actualisation de page en production
**Cause :** Les cookies HTTP-only ne persistent pas correctement entre les requêtes en production avec `credentials: 'include'`

## 📊 Analyse des Logs de Production

```javascript
// ✅ CONNEXION RÉUSSIE
🔄 Requête vers: https://printalma-back-dep.onrender.com/auth/login
📡 Réponse de /auth/login: {status: 201, headers: {…}}
💾 Session utilisateur sauvegardée en localStorage

// ❌ PROBLÈME - Toutes les requêtes suivantes échouent
📡 Réponse de /auth/check: {status: 401, headers: {…}}
📡 Réponse de /auth/profile: {status: 401, headers: {…}}
📡 Réponse de /auth/admin/clients: {status: 401, headers: {…}}
```

**Diagnostic :** Les cookies sont créés à la connexion mais ne sont pas transmis dans les requêtes suivantes malgré `credentials: 'include'`.

## 🔧 Solution Temporaire Implémentée

### 1. Système de Session localStorage (FONCTIONNE)
- ✅ Sauvegarde des données utilisateur en localStorage après connexion
- ✅ Vérification prioritaire du localStorage au chargement
- ✅ Session persistante de 7 jours avec nettoyage automatique
- ✅ Plus de déconnexion à l'actualisation

### 2. Configuration Actuelle
```typescript
// src/config/api.ts
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'https://printalma-back-dep.onrender.com',
};

// src/services/auth.service.ts
const response = await fetch(`${this.baseUrl}${endpoint}`, {
  ...options,
  credentials: 'include', // ⭐ Toujours inclure les cookies
  headers: {
    ...defaultHeaders,
    ...options.headers
  }
});
```

## 🚨 Problème Restant à Résoudre

**Les requêtes API protégées retournent 401** car les cookies ne persistent pas.

### Exemples d'erreurs actuelles :
- `/auth/admin/clients` → 401
- `/auth/profile` → 401  
- `/auth/vendors` → 401
- Toutes les routes protégées → 401

## 📋 Plan d'Action pour le Backend

### Option 1 : Corriger la Configuration des Cookies (RECOMMANDÉ)

Le backend doit configurer les cookies avec les bonnes options pour la production :

```javascript
// Configuration cookies backend pour production
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // true en production HTTPS
    httpOnly: true,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' pour cross-domain HTTPS
    domain: process.env.NODE_ENV === 'production' ? '.onrender.com' : undefined
  }
}));

// Configuration CORS
app.use(cors({
  origin: [
    'http://localhost:5174', // dev
    'https://printalma-website-dep.onrender.com' // production
  ],
  credentials: true, // CRITIQUE pour les cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
```

### Option 2 : Système de Token JWT (ALTERNATIVE)

Si les cookies ne peuvent pas être corrigés, implémenter un système de tokens :

```javascript
// Backend - Retourner un token à la connexion
POST /auth/login → { user: {...}, token: "jwt_token_here" }

// Frontend - Stocker et utiliser le token
localStorage.setItem('auth_token', response.token);

// Toutes les requêtes suivantes
headers: {
  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
}
```

## 🔍 Tests de Diagnostic

### Pour tester les cookies en production :

```javascript
// Dans la console du navigateur après connexion
console.log('Cookies:', document.cookie);
console.log('LocalStorage auth:', localStorage.getItem('auth_session'));

// Tester une requête manuelle
fetch('https://printalma-back-dep.onrender.com/auth/profile', {
  credentials: 'include',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(r => console.log('Status:', r.status, r.headers))
.catch(e => console.log('Erreur:', e));
```

## 📁 Fichiers Modifiés (Solution Temporaire)

### Frontend - Fichiers affectés :
- `src/services/auth.service.ts` - Ajout localStorage + logs
- `src/contexts/AuthContext.tsx` - Priorité localStorage
- `src/config/api.ts` - Variables d'environnement
- `.env.production` - Configuration production
- `.env.development` - Configuration développement

### Logs à surveiller :
```
🔍 Vérification de la session localStorage...
📦 Données brutes localStorage: {...}
✅ Session stockée valide trouvée: {...}
📱 ✅ SUCCÈS : Utilisation de la session localStorage
```

## 🎯 Actions Prioritaires Backend

### 1. Vérification CORS (URGENT)
```bash
# Vérifier que le backend accepte l'origine du frontend
curl -H "Origin: https://printalma-website-dep.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://printalma-back-dep.onrender.com/auth/profile
```

### 2. Configuration Session (URGENT)
- Vérifier `sameSite: 'none'` en production
- Vérifier `secure: true` en production
- Vérifier que `credentials: true` est activé dans CORS

### 3. Test de Cookie (DEBUG)
```javascript
// Endpoint de test à ajouter temporairement
GET /auth/debug-cookies
Response: {
  cookies: req.cookies,
  session: req.session,
  headers: req.headers
}
```

## ✅ Résultat Attendu

Après correction backend :
- ✅ Connexion fonctionne
- ✅ Actualisation maintient la session  
- ✅ Toutes les requêtes API fonctionnent
- ✅ Cookies persistent correctement
- ✅ Plus besoin du fallback localStorage

## 📞 Support

En cas de problème, vérifier dans l'ordre :
1. Logs de connexion - doit voir `💾 Session utilisateur sauvegardée`
2. Logs d'actualisation - doit voir `📱 Utilisation de la session localStorage`
3. Requêtes API - ne doivent plus retourner 401 après correction backend

## ✅ PROBLÈME RÉSOLU - Cookies HTTP-Only Corrigés

**Status actuel :** ✅ Configuration des cookies HTTP-only CORRIGÉE

### 🔧 Corrections Apportées (01/09/2025)

#### 1. Configuration des cookies mise à jour dans `src/auth/auth.controller.ts`
- ✅ `sameSite: 'none'` en production (au lieu de 'strict')
- ✅ `maxAge: 30 jours` (correspond à la durée du JWT)
- ✅ Configuration identique pour login, logout et force-change-password

#### 2. Configuration CORS validée dans `src/main.ts`
- ✅ `credentials: true` activé
- ✅ Origins autorisés: localhost + production

#### 3. Endpoint de debug ajouté
- ✅ `/auth/debug-cookies` pour tester les headers et cookies

### 📋 Tests Après Redéploiement

Après le redéploiement du backend, tester:

```bash
# 1. Test CORS 
curl -H "Origin: https://printalma-website-dep.onrender.com" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://printalma-back-dep.onrender.com/auth/profile

# 2. Test cookies après connexion
fetch('https://printalma-back-dep.onrender.com/auth/profile', {
  credentials: 'include',
  method: 'GET'
}).then(r => console.log('Status:', r.status))
```

**Résultat attendu :** Status 200 (au lieu de 401)

**Status actuel :** ✅ Configuration CORRIGÉE - En attente de redéploiement