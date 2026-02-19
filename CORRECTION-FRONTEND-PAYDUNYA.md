# ✅ CORRECTION APPLIQUÉE AU FRONTEND

## 🎯 Problème identifié

Dans le fichier `src/config/paydunyaConfig.ts` du frontend, le `CALLBACK_URL` était mal configuré.

### ❌ Configuration incorrecte (AVANT) :

```typescript
get CALLBACK_URL(): string {
  if (isLocalDevelopment()) {
    return `${this.API_BASE_URL}/paydunya/callback`;  // ❌ /callback
  } else {
    return `${window.location.origin}/api/paydunya/callback`;  // ❌ Mauvaise URL
  }
}
```

**Problèmes :**
1. Le backend utilise `/paydunya/webhook`, PAS `/paydunya/callback`
2. En production, il utilisait `${window.location.origin}/api/paydunya/callback` qui pointe vers le **frontend** au lieu du **backend**

---

## ✅ Configuration corrigée (MAINTENANT) :

```typescript
get CALLBACK_URL(): string {
  // ⚠️ IMPORTANT : Le backend utilise /paydunya/webhook, pas /paydunya/callback
  // Le webhook doit pointer vers le backend, pas le frontend
  return `${this.API_BASE_URL}/paydunya/webhook`;  // ✅ Correcte
}
```

**Résultat :**
- En développement : `http://localhost:3004/paydunya/webhook` ✅
- En production : `https://printalma-back-dep.onrender.com/paydunya/webhook` ✅

---

## 📊 Routes backend PayDunya

Le backend a ces routes (dans `paydunya.controller.ts`) :

| Route | Méthode | Description |
|-------|---------|-------------|
| `/paydunya/payment` | POST | Créer une facture PayDunya |
| `/paydunya/webhook` | POST | Recevoir les webhooks PayDunya |
| `/paydunya/status/:token` | GET | Vérifier le statut d'un paiement |
| `/paydunya/test-config` | GET | Tester la configuration |

**Le webhook DOIT pointer vers `/paydunya/webhook` !**

---

## 🚀 Prochaines étapes

### 1. Commiter le changement dans Git

```bash
cd /home/pfdev/Bureau/PrintalmaProject/printalma_website_dep
git add src/config/paydunyaConfig.ts
git commit -m "fix: Corriger l'URL du webhook PayDunya"
git push
```

### 2. Redéployer le frontend sur Render

Le push déclenchera automatiquement un rebuild sur Render si vous avez configuré le déploiement automatique.

**OU manuellement :**
1. Render Dashboard → printalma-website-dep
2. Manual Deploy → Deploy latest commit
3. Attendre 10-15 minutes

### 3. Tester un nouveau paiement

Après le redéploiement :
1. Créer une nouvelle commande
2. Procéder au paiement
3. PayDunya appellera maintenant le bon webhook ✅

---

## 🔍 Comment vérifier que c'est corrigé ?

### Dans le backend :

Créez un nouveau paiement depuis votre site et vérifiez dans les logs du backend Render que vous voyez :

```
POST /paydunya/webhook
✅ IPN callback received for invoice: XXX
```

### Dans PayDunya Dashboard :

Allez sur PayDunya Dashboard → Webhooks et vérifiez que les webhooks sont bien reçus avec un statut 200.

---

## 📝 Fichiers modifiés

- `printalma_website_dep/src/config/paydunyaConfig.ts` ✅

---

## ✅ Résumé

| Avant | Après |
|-------|-------|
| ❌ `/api/paydunya/callback` (frontend) | ✅ `/paydunya/webhook` (backend) |
| ❌ Webhook n'atteint pas le backend | ✅ Webhook atteint le bon endpoint |
| ❌ Paiements ne se mettent pas à jour | ✅ Paiements se mettent à jour |

**Le problème est maintenant corrigé dans le code frontend !**

Il faut juste commiter, push et redéployer pour que ça prenne effet sur Render.
