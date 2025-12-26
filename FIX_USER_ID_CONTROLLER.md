# 🔧 Fix - User ID dans Controller

## 🐛 Problème identifié

Le controller utilisait `req.user.userId` qui n'existe pas dans le payload JWT.

### Erreur Prisma
```
Invalid `this.prisma.user.findUnique()` invocation
where: {
  id: undefined,  // ❌ undefined car req.user.userId n'existe pas
}
```

---

## ✅ Solution appliquée

### Selon le JWT Strategy (src/auth/jwt.strategy.ts)

Le payload retourné par la stratégie JWT contient :

```typescript
return {
  id: user.id,        // ✅ Utiliser req.user.id
  sub: payload.sub,   // ✅ Ou req.user.sub (même valeur)
  email: payload.email,
  role: payload.role,
  vendeur_type: payload.vendeur_type || user.vendeur_type,
  firstName: payload.firstName,
  lastName: payload.lastName,
  status: user.status
};
```

### Correction dans le Controller

**Fichier modifié** : `src/vendor-onboarding/vendor-onboarding.controller.ts`

```typescript
// ❌ AVANT (incorrect)
req.user.userId

// ✅ APRÈS (correct)
req.user.id
```

**Tous les endpoints corrigés** :

1. `completeOnboarding()` - ligne 59
2. `getProfileStatus()` - ligne 80
3. `getOnboardingInfo()` - ligne 90
4. `updatePhones()` - ligne 101

---

## 🧪 Test

Après redémarrage du serveur, l'erreur `id: undefined` ne devrait plus apparaître.

### Vérification

```bash
# Redémarrer le serveur
npm run start:dev

# Tester l'endpoint
curl -X POST http://localhost:3004/api/vendor/complete-onboarding \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F 'phones=[{"number":"+221771234567","isPrimary":true}]' \
  -F 'profileImage=@image.jpg'
```

**Résultat attendu** : Le vendorId devrait maintenant être correctement passé au service.

---

## 📝 Note importante

Pour tous les futurs controllers NestJS utilisant JWT :

✅ **Utiliser** : `req.user.id` ou `req.user.sub`
❌ **Ne pas utiliser** : `req.user.userId` (n'existe pas)

---

**Fix appliqué et compilé avec succès** ✅
