# Problème : "Ce paiement a déjà été initié"

## 🔍 Diagnostic

Quand vous voyez ce message de PayDunya :
```
Votre paiement a échoué
Ce paiement a déjà été initié.
```

**Cause** : PayDunya ne permet pas de réutiliser un token de paiement qui a déjà été utilisé. Une fois qu'un utilisateur clique sur le lien de paiement et accède à la page PayDunya, le token est "consommé" et ne peut plus être réutilisé.

## 🚫 Pourquoi cela arrive-t-il ?

1. **Abandon de paiement** : L'utilisateur accède à la page PayDunya mais n'effectue pas le paiement
2. **Erreur de paiement** : L'utilisateur essaie de payer mais le paiement échoue (fonds insuffisants, etc.)
3. **Timeout** : La session de paiement expire
4. **Utilisateur quitte la page** : L'utilisateur ferme la fenêtre avant de payer

Dans tous ces cas, le token PayDunya reste lié à la commande dans votre base de données, mais PayDunya ne l'accepte plus.

## ✅ Solutions

### Solution 1 : Permettre un nouveau paiement (RECOMMANDÉ)

Utilisez le endpoint API pour permettre à l'utilisateur de créer un nouveau paiement :

```bash
# Via API
POST /orders/{orderNumber}/retry-payment
```

Cette endpoint devrait :
1. Créer un nouveau token PayDunya
2. Incrémenter le compteur de tentatives
3. Retourner le nouveau lien de paiement

### Solution 2 : Réinitialiser manuellement avec le script

Si vous devez réinitialiser manuellement une commande :

```bash
npx ts-node scripts/reset-order-payment.ts <ORDER_NUMBER>
```

Exemple :
```bash
npx ts-node scripts/reset-order-payment.ts ORD-1771235613689
```

Cela va :
- Supprimer le token actuel de la commande
- Permettre à l'utilisateur de créer un nouveau paiement

### Solution 3 : Implémenter le retry automatique dans le frontend

Le frontend devrait :
1. Détecter quand un paiement échoue
2. Proposer automatiquement de créer un nouveau paiement
3. Ne jamais réutiliser un ancien token

## 🔧 Implémentation recommandée

### Backend : Endpoint de retry

Créez un endpoint dans `order.controller.ts` :

```typescript
@Post(':orderNumber/retry-payment')
async retryPayment(@Param('orderNumber') orderNumber: string) {
  // 1. Vérifier que la commande existe et est PENDING
  const order = await this.orderService.findByOrderNumber(orderNumber);

  if (order.paymentStatus === 'PAID') {
    throw new BadRequestException('Cette commande est déjà payée');
  }

  // 2. Incrémenter le compteur de tentatives
  await this.prisma.order.update({
    where: { orderNumber },
    data: {
      paymentAttempts: { increment: 1 }
    }
  });

  // 3. Créer un nouveau token PayDunya
  const paymentData = {
    invoice: {
      total_amount: order.totalAmount,
      description: `Commande ${orderNumber} - Tentative ${order.paymentAttempts + 1}`
    },
    custom_data: {
      order_number: orderNumber,
      order_id: order.id,
      attempt: order.paymentAttempts + 1
    }
  };

  const paydunyaResponse = await this.paydunyaService.createInvoice(paymentData);

  // 4. Mettre à jour la commande avec le nouveau token
  await this.prisma.order.update({
    where: { orderNumber },
    data: {
      transactionId: paydunyaResponse.token
    }
  });

  return {
    success: true,
    payment_url: paydunyaResponse.redirect_url,
    token: paydunyaResponse.token,
    attempt: order.paymentAttempts + 1
  };
}
```

### Frontend : Bouton de retry

Dans votre page de confirmation de commande :

```typescript
// Détecter l'échec du paiement
if (paymentStatus === 'failed' || paymentStatus === 'pending') {
  // Afficher un bouton pour réessayer
  <Button onClick={() => retryPayment(orderNumber)}>
    Réessayer le paiement
  </Button>
}

async function retryPayment(orderNumber: string) {
  try {
    const response = await api.post(`/orders/${orderNumber}/retry-payment`);

    // Rediriger vers le nouveau lien de paiement
    window.location.href = response.data.payment_url;
  } catch (error) {
    console.error('Erreur lors de la création du nouveau paiement:', error);
  }
}
```

## 📊 Suivi des tentatives

Le système suit automatiquement :
- `paymentAttempts` : Nombre de tentatives de paiement
- `PaymentAttempt` : Historique détaillé de chaque tentative avec raison d'échec

## 🎯 Bonnes pratiques

1. **Limiter les tentatives** : Maximum 3-5 tentatives par commande
2. **Expiration** : Marquer les commandes comme FAILED après 24-48h
3. **Notification** : Envoyer un email à l'utilisateur avec un lien pour réessayer
4. **Logs** : Logger chaque tentative pour analyser les patterns d'échec

## 🛡️ Sécurité

- Ne jamais exposer les tokens PayDunya dans l'URL ou les logs
- Vérifier que l'utilisateur est autorisé à réessayer le paiement pour cette commande
- Implémenter un rate limiting pour éviter les abus

## 📝 Scripts utiles

```bash
# Lister les commandes en attente
npx ts-node scripts/list-pending-orders.ts

# Réinitialiser une commande
npx ts-node scripts/reset-order-payment.ts <ORDER_NUMBER>

# Diagnostiquer la connexion PayDunya
npx ts-node scripts/diagnose-paydunya-connection.ts

# Configurer PayDunya
npx ts-node scripts/setup-paydunya-config.ts
```

## 🔗 Références

- [Documentation PayDunya](https://developers.paydunya.com/doc/FR/introduction)
- [Guide de gestion des webhooks](./PAYDUNYA_SUMMARY.md)
- [Configuration dynamique](./CONFIGURATION_PAIEMENT_DYNAMIQUE.md)
