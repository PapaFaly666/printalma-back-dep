# 🚀 Solution Rapide : "Ce paiement a déjà été initié"

## ✅ Problème résolu !

Le système a été mis à jour pour gérer automatiquement les retry de paiement PayDunya.

## 🎯 Comment permettre à un client de réessayer son paiement

### Solution 1 : Via l'API (RECOMMANDÉ)

Le endpoint suivant est maintenant disponible et supporte PayDunya :

```bash
POST /orders/:orderNumber/retry-payment
```

**Exemple d'utilisation :**

```typescript
// Frontend
async function retryPayment(orderNumber: string) {
  try {
    const response = await fetch(`/orders/${orderNumber}/retry-payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    // Rediriger vers le nouveau lien de paiement
    window.location.href = data.data.payment.redirect_url;

  } catch (error) {
    console.error('Erreur:', error);
  }
}
```

**Réponse de l'API :**

```json
{
  "success": true,
  "message": "Payment retry initialized successfully",
  "data": {
    "order_id": 123,
    "order_number": "ORD-1771235613689",
    "amount": 15000,
    "currency": "XOF",
    "payment_method": "PAYDUNYA",
    "payment": {
      "token": "test_ABC123XYZ",
      "redirect_url": "https://app.paydunya.com/sandbox-checkout/invoice/test_ABC123XYZ",
      "is_retry": true,
      "attempt_number": 2
    }
  }
}
```

### Solution 2 : Script manuel (pour l'admin)

Si vous devez réinitialiser manuellement une commande :

```bash
npx ts-node scripts/reset-order-payment.ts ORD-1771235613689
```

## 📊 Ce qui se passe automatiquement

1. ✅ Le système crée un **nouveau token PayDunya**
2. ✅ **Incrémente le compteur** de tentatives
3. ✅ **Met à jour** la commande avec le nouveau token
4. ✅ **Retourne** le nouveau lien de paiement
5. ✅ **Log** toutes les tentatives pour suivi

## 🎨 Intégration Frontend

### Bouton de retry sur la page de commande

```typescript
// Dans votre composant de détail de commande
function OrderDetail({ order }) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryPayment = async () => {
    setIsRetrying(true);

    try {
      const response = await fetch(`/orders/${order.orderNumber}/retry-payment`, {
        method: 'POST'
      });

      const data = await response.json();

      if (data.success) {
        // Rediriger vers PayDunya
        window.location.href = data.data.payment.redirect_url;
      }
    } catch (error) {
      alert('Erreur lors de la création du paiement');
    } finally {
      setIsRetrying(false);
    }
  };

  // Afficher le bouton seulement si paiement en attente ou échoué
  if (order.paymentStatus === 'PENDING' || order.paymentStatus === 'FAILED') {
    return (
      <div>
        <h2>Commande {order.orderNumber}</h2>
        <p>Statut: {order.paymentStatus}</p>

        <button
          onClick={handleRetryPayment}
          disabled={isRetrying}
          className="btn btn-primary"
        >
          {isRetrying ? 'Création du paiement...' : 'Réessayer le paiement'}
        </button>

        {order.paymentAttempts > 0 && (
          <p className="text-muted">
            Tentative n°{order.paymentAttempts}
          </p>
        )}
      </div>
    );
  }

  return <div>Commande payée ✅</div>;
}
```

## 🔐 Sécurité

L'endpoint `/orders/:orderNumber/retry-payment` est **public** car il utilise le numéro de commande comme identifiant (difficile à deviner).

Limitations :
- ✅ Ne peut pas retry une commande déjà payée
- ✅ Ne peut pas retry une commande annulée
- ✅ Limite de 5 tentatives recommandée

## 📈 Suivi des tentatives

Chaque tentative est automatiquement enregistrée dans :
- `Order.paymentAttempts` : Compteur de tentatives
- `Order.transactionId` : Nouveau token à chaque retry
- `Order.notes` : Historique avec timestamps

## 🧪 Test

### 1. Créer une commande de test
```bash
# Via votre frontend ou Postman
POST /orders
{
  "items": [...],
  "paymentMethod": "PAYDUNYA"
}
```

### 2. Simuler un abandon de paiement
- Accéder au lien PayDunya
- Fermer la page sans payer

### 3. Réessayer le paiement
```bash
POST /orders/ORD-XXX/retry-payment
```

### 4. Vérifier
- Nouveau token généré ✅
- Compteur incrémenté ✅
- Ancien token invalide ✅

## 📝 Scripts utiles

```bash
# Lister les commandes en attente
npx ts-node scripts/list-pending-orders.ts

# Réinitialiser une commande spécifique
npx ts-node scripts/reset-order-payment.ts ORD-XXX

# Diagnostiquer PayDunya
npx ts-node scripts/diagnose-paydunya-connection.ts
```

## ❓ FAQ

**Q: Combien de fois un client peut-il réessayer ?**
A: Techniquement illimité, mais vous pouvez implémenter une limite (ex: 5 tentatives).

**Q: L'ancien token continue-t-il de fonctionner ?**
A: Non, PayDunya refuse les tokens déjà utilisés.

**Q: Que se passe-t-il si le paiement échoue encore ?**
A: Le client peut créer un nouveau paiement via le même endpoint.

**Q: Les tentatives sont-elles tracées ?**
A: Oui, dans `Order.paymentAttempts` et `Order.notes`.

## 🎉 Résumé

✅ Endpoint `/orders/:orderNumber/retry-payment` activé
✅ Support PayDunya ajouté
✅ Nouveau token créé automatiquement à chaque retry
✅ Compteur de tentatives mis à jour
✅ Historique complet dans les logs

**Votre système est maintenant prêt à gérer les retry de paiement PayDunya ! 🚀**
