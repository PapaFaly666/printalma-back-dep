# 🍪 Guide de Debugging - Cookies d'Authentification

## 🚨 Problème Rencontré

```
❌ Erreur envoi backend: Error: Compte vendeur inactif
```

## 🔍 Diagnostic

### 1. Vérifiez les Cookies dans le Frontend

1. **Ouvrez DevTools** (F12)
2. **Application** > **Cookies** > **http://localhost:5174** (ou votre domaine)
3. **Cherchez un cookie JWT** avec l'un de ces noms :
   - `jwt`
   - `auth_token` 
   - `authToken`
   - `access_token`

### 2. Vérifiez que le Cookie est Envoyé

Dans **Network** (DevTools) :
1. Faites une requête vers l'API
2. Cliquez sur la requête 
3. **Headers** > **Request Headers**
4. Vérifiez la présence de `Cookie: jwt=<valeur>` ou similaire

### 3. Testez le Token

Copiez la valeur du cookie et testez :

```bash
# Remplacez <VOTRE_TOKEN> par la valeur copiée
node test-auth-cookies.js test-cookie <VOTRE_TOKEN>
```

## 🔧 Solutions Possibles

### Solution 1: Nom de Cookie Incorrect

Si votre frontend utilise un cookie nommé `jwt` mais le backend cherche `auth_token`, le backend a été modifié pour accepter les deux.

### Solution 2: Cookie Non Envoyé

Si le cookie n'est pas envoyé, vérifiez votre configuration fetch :

```javascript
// ✅ Correct - avec credentials: 'include'
fetch('/vendor/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include', // Important pour envoyer les cookies
  body: JSON.stringify(data)
});

// ❌ Incorrect - sans credentials
fetch('/vendor/publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

### Solution 3: Domain/Path du Cookie

Vérifiez les propriétés du cookie :
- **Domain** : doit être compatible avec l'URL API
- **Path** : doit inclure le chemin de l'API
- **Secure** : si HTTPS, doit être `true`
- **SameSite** : `Lax` ou `None` selon configuration

### Solution 4: Token Expiré

Si le token est expiré, reconnectez-vous sur le frontend.

## 🧪 Test Manuel

### Avec cURL

```bash
# Testez avec votre token
curl -H "Cookie: jwt=<VOTRE_TOKEN>" http://localhost:3004/vendor/health
```

### Avec Postman

1. **Headers** > **Cookie** : `jwt=<VOTRE_TOKEN>`
2. **Request** : `GET http://localhost:3004/vendor/health`

## 📊 Logs de Debugging

Avec les modifications apportées, vous devriez voir ces logs dans la console du serveur :

### Authentification Réussie
```
🍪 Token trouvé dans cookies: { auth_token: false, jwt: true, authToken: false, access_token: false }
🔍 Validation JWT pour utilisateur: { sub: 20, email: 'pf.d@zig.univ.sn', role: 'VENDEUR' }
✅ Authentification réussie pour pf.d@zig.univ.sn (ID: 20)
```

### Authentification Échouée
```
🍪 Token trouvé dans cookies: { auth_token: false, jwt: false, authToken: false, access_token: false }
❌ Aucun token trouvé
```

## 🔧 Configuration Frontend Recommandée

### Axios (si utilisé)

```javascript
// Configuration globale axios
axios.defaults.withCredentials = true;

// Ou pour chaque requête
axios.post('/vendor/publish', data, {
  withCredentials: true
});
```

### Fetch API

```javascript
// Configuration dans chaque fetch
fetch('/vendor/publish', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

## ✅ Checklist de Vérification

- [ ] **Cookie JWT présent** dans DevTools > Application > Cookies
- [ ] **Cookie envoyé** dans Network > Request Headers
- [ ] **credentials: 'include'** dans les requêtes fetch
- [ ] **withCredentials: true** si utilisation d'Axios
- [ ] **Token non expiré** (vérifiable avec `node test-auth-cookies.js decode <TOKEN>`)
- [ ] **Utilisateur VENDEUR actif** en base (vérifié avec `node debug-user-status.js debug`)

## 💡 Prochaines Étapes

1. **Vérifiez les cookies** avec DevTools
2. **Testez le token** avec le script fourni
3. **Consultez les logs** du serveur backend
4. **Corrigez la configuration** frontend si nécessaire

Si le problème persiste, partagez :
- Le nom et la valeur du cookie JWT
- La configuration de vos requêtes fetch/axios
- Les logs du serveur backend 