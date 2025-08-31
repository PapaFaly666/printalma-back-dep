# Diagnostic - Produits Prêts

## Problème : "Unexpected end of JSON input"

Cette erreur indique que le serveur ne retourne pas un JSON valide. Voici les étapes de diagnostic et de résolution.

## 🔍 **Diagnostic Étape par Étape**

### 1. Vérifier que le serveur démarre

```bash
# Démarrer le serveur en mode développement
npm run start:dev
```

**Signes de problème :**
- Erreurs TypeScript dans la console
- Serveur qui ne démarre pas
- Port 3000 déjà utilisé

### 2. Tester l'endpoint de base

```bash
# Test simple avec curl
curl -X GET http://localhost:3000/products/ready/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 3. Vérifier les logs du serveur

Regardez la console du serveur pour :
- Erreurs de compilation TypeScript
- Erreurs de base de données
- Erreurs d'authentification

## 🛠️ **Solutions Courantes**

### Problème 1 : Erreurs TypeScript

**Symptômes :**
```
error TS2353: Object literal may only specify known properties
error TS2339: Property 'colorVariations' does not exist
```

**Solutions :**
1. Régénérer le client Prisma :
```bash
npx prisma generate
```

2. Redémarrer le serveur :
```bash
npm run start:dev
```

### Problème 2 : Erreurs de base de données

**Symptômes :**
```
PrismaClientKnownRequestError
```

**Solutions :**
1. Vérifier la connexion à la base de données
2. Appliquer les migrations :
```bash
npx prisma db push
```

### Problème 3 : Erreurs d'authentification

**Symptômes :**
```
401 Unauthorized
403 Forbidden
```

**Solutions :**
1. Vérifier que le token est valide
2. Vérifier que l'utilisateur a le rôle ADMIN ou SUPERADMIN
3. Vérifier que le token n'a pas expiré

## 🧪 **Tests de Diagnostic**

### Test 1 : Endpoint de santé

```javascript
// Test de base du serveur
fetch('http://localhost:3000/health')
  .then(response => response.json())
  .then(data => console.log('Serveur OK:', data))
  .catch(error => console.error('Erreur serveur:', error));
```

### Test 2 : Endpoint de test produits prêts

```javascript
// Test avec authentification
fetch('http://localhost:3000/products/ready/test', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Test OK:', data))
.catch(error => console.error('Erreur test:', error));
```

### Test 3 : Endpoint de liste

```javascript
// Test de l'endpoint principal
fetch('http://localhost:3000/products/ready', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  }
})
.then(response => response.json())
.then(data => console.log('Liste OK:', data))
.catch(error => console.error('Erreur liste:', error));
```

## 🔧 **Corrections Spécifiques**

### Correction 1 : Erreurs de rôle

Si vous êtes SUPERADMIN mais que vous recevez une erreur de permission :

```typescript
// Dans le contrôleur, vérifier que la condition inclut SUPERADMIN
if (!['ADMIN', 'SUPERADMIN'].includes(req.user.role)) {
  throw new BadRequestException('Seuls les administrateurs peuvent...');
}
```

### Correction 2 : Erreurs de schéma Prisma

Si vous avez des erreurs de propriétés manquantes :

```typescript
// Vérifier que le schéma Prisma est à jour
npx prisma db push
npx prisma generate
```

### Correction 3 : Erreurs de compilation

Si le serveur ne compile pas :

```bash
# Nettoyer et recompiler
rm -rf dist/
npm run build
npm run start:dev
```

## 📋 **Checklist de Diagnostic**

- [ ] Le serveur démarre sans erreurs
- [ ] La base de données est accessible
- [ ] Le token d'authentification est valide
- [ ] L'utilisateur a le rôle ADMIN ou SUPERADMIN
- [ ] Les endpoints répondent correctement
- [ ] Les logs ne montrent pas d'erreurs

## 🚨 **Erreurs Courantes et Solutions**

### "Unexpected end of JSON input"
**Cause :** Le serveur retourne une erreur HTML au lieu de JSON
**Solution :** Vérifier que le serveur démarre correctement

### "Seuls les administrateurs peuvent..."
**Cause :** Vérification de rôle incorrecte
**Solution :** Vérifier que la condition inclut SUPERADMIN

### "Cannot read property 'role' of undefined"
**Cause :** L'utilisateur n'est pas authentifié
**Solution :** Vérifier le token d'authentification

### "PrismaClientKnownRequestError"
**Cause :** Problème de base de données
**Solution :** Vérifier la connexion et les migrations

## 📞 **Support**

Si les problèmes persistent :

1. **Vérifiez les logs du serveur** pour des erreurs spécifiques
2. **Testez avec curl** pour isoler le problème
3. **Vérifiez la base de données** avec Prisma Studio
4. **Contactez l'équipe** avec les logs d'erreur

## 🎯 **Résolution Rapide**

1. **Redémarrez le serveur** : `npm run start:dev`
2. **Régénérez Prisma** : `npx prisma generate`
3. **Vérifiez le token** : Assurez-vous qu'il est valide
4. **Testez avec curl** : Vérifiez la réponse du serveur
5. **Vérifiez les logs** : Cherchez des erreurs spécifiques 