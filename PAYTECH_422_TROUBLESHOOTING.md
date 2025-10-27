# PayTech - Résolution Erreur 422 "Format de requête invalid"

## Erreur Rencontrée

```
Request failed with status code 422
BadRequestException: Format de requete invalid
```

## Causes Possibles

### 1. **Incompatibilité Credentials / Environnement**

Le problème le plus fréquent : vos credentials PayTech sont pour un environnement spécifique (test ou production), mais vous envoyez des requêtes vers l'autre environnement.

**Solution :**
- Si vos credentials sont pour **PRODUCTION** → utilisez `"env": "prod"` dans toutes les requêtes
- Si vos credentials sont pour **TEST** → utilisez `"env": "test"` dans toutes les requêtes
- Vérifiez avec PayTech à quel environnement appartiennent vos credentials

### 2. **Compte PayTech Non Activé**

Votre compte PayTech n'est peut-être pas encore activé ou validé.

**Solution :**
- Connectez-vous à votre tableau de bord PayTech : https://paytech.sn
- Vérifiez le statut de votre compte
- Contactez le support PayTech pour activation si nécessaire

### 3. **Format de `ref_command` Invalide**

PayTech peut avoir des contraintes sur le format de la référence de commande.

**Contraintes possibles :**
- Longueur minimum/maximum
- Caractères autorisés (alphanumériques, tirets, underscores)
- Unicité (ne pas réutiliser une référence existante)

**Solution :**
```javascript
// Utilisez un format simple et unique
const ref_command = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
```

### 4. **Montant Invalide**

Le montant peut avoir des contraintes.

**Vérifications :**
- Montant minimum : généralement 100 XOF
- Montant maximum : vérifier avec PayTech
- Type de données : doit être un `number`, pas une `string`

### 5. **URLs IPN Non HTTPS en Production**

En production, PayTech peut exiger que les URLs (ipn_url, success_url, cancel_url) utilisent HTTPS.

**Solution :**
```javascript
// Développement local : utiliser ngrok
// Production : toujours HTTPS
"ipn_url": "https://your-domain.com/paytech/ipn-callback"
```

### 6. **Headers Manquants ou Incorrects**

Les headers API_KEY et API_SECRET doivent être présents et corrects.

**Vérification :**
```bash
# Vérifier que les credentials sont bien définis
echo $PAYTECH_API_KEY
echo $PAYTECH_API_SECRET

# Ils doivent être des chaînes hexadécimales de 64 caractères
```

### 7. **Custom Field Invalide**

Si vous utilisez `custom_field`, il doit être une chaîne JSON valide.

**Solution :**
```javascript
// ✅ Correct
"custom_field": "{\"orderId\": 123, \"userId\": 45}"

// ❌ Incorrect
"custom_field": "orderId: 123"
"custom_field": { orderId: 123 } // Doit être stringifié
```

## Plan de Test

### Étape 1 : Test Direct avec cURL

Lancez le script de test direct :

```bash
chmod +x test-paytech-direct.sh
./test-paytech-direct.sh
```

Ce script teste plusieurs variantes pour identifier le problème.

### Étape 2 : Analyser les Logs

Activez le mode debug dans NestJS et observez la requête exacte envoyée :

```bash
# Les logs montreront maintenant:
# - Le payload exact envoyé à PayTech
# - La réponse exacte de PayTech
npm run start:dev
```

### Étape 3 : Vérifier avec PayTech

Si aucune des solutions ci-dessus ne fonctionne :

1. **Connectez-vous à votre dashboard PayTech**
   - URL : https://paytech.sn
   - Vérifiez l'état de votre compte
   - Consultez les logs de tentatives de paiement

2. **Contactez le Support PayTech**
   - Email : support@intech.sn
   - Fournissez :
     - Votre API_KEY (pas le secret !)
     - Les timestamps des tentatives échouées
     - Les références de commande testées

## Solutions Rapides à Essayer

### Solution 1 : Changer l'environnement

Dans `.env`, essayez :
```env
PAYTECH_ENVIRONMENT="test"
```

Puis dans vos requêtes :
```json
{
  "env": "test"
}
```

### Solution 2 : Simplifier la requête au maximum

Testez avec la requête la plus simple possible :

```bash
curl -X POST http://localhost:3004/paytech/payment \
  -H "Content-Type: application/json" \
  -d '{
    "item_name": "Test",
    "item_price": 1000,
    "ref_command": "TEST-'$(date +%s)'",
    "command_name": "Test",
    "currency": "XOF"
  }'
```

### Solution 3 : Obtenir de nouveaux credentials

Si vos credentials sont anciens ou incorrects, demandez de nouveaux credentials à PayTech :

1. Connectez-vous à https://paytech.sn
2. Allez dans Paramètres → API
3. Régénérez vos clés API
4. Mettez à jour `.env` avec les nouvelles clés

## Commandes Utiles

```bash
# Tester la configuration
curl http://localhost:3004/paytech/test-config | jq

# Tester la connectivité
curl http://localhost:3004/paytech/diagnose | jq

# Tester un paiement simple
curl -X POST http://localhost:3004/paytech/payment \
  -H "Content-Type: application/json" \
  -d @test-payment.json | jq

# Voir les logs en temps réel
npm run start:dev | grep -i paytech
```

## Checklist de Vérification

- [ ] Les credentials sont corrects et de la bonne longueur (64 caractères hex)
- [ ] L'environnement (test/prod) correspond aux credentials
- [ ] Le compte PayTech est activé
- [ ] Le montant est >= 100 XOF
- [ ] La ref_command est unique et valide
- [ ] Les URLs HTTPS sont utilisées en production
- [ ] Le JSON est bien formaté
- [ ] Les headers API_KEY et API_SECRET sont envoyés

## Contact

Si le problème persiste après avoir vérifié tous ces points :

- **Documentation PayTech :** https://doc.intech.sn/doc_paytech.php
- **Support PayTech :** support@intech.sn
- **Dashboard PayTech :** https://paytech.sn

---

**Date :** 2025-10-27
**Status :** Document de troubleshooting
