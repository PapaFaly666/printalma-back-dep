# 🚀 Frontend PayDunya - Quick Start

## ⚡ Ce qu'il faut savoir en 30 secondes

**LE BACKEND GÈRE TOUT AUTOMATIQUEMENT !**
Le frontend n'a qu'à suivre et afficher les statuts.

## 🔄 Workflow simple

1. **Initialiser le paiement** → `POST /paydunya/payment`
2. **Rediriger vers PayDunya** → `window.location.href = response.redirect_url`
3. **Suivre le statut** → `GET /orders/{id}` toutes les 3 secondes
4. **Afficher le résultat** → Succès/Échec selon le statut

## 📝 Exemple React minimal

```jsx
import React, { useState, useEffect } from 'react';

const PaymentStatus = ({ orderId }) => {
  const [status, setStatus] = useState('PENDING');

  // Suivi automatique du statut
  useEffect(() => {
    const checkStatus = async () => {
      const res = await fetch(`/orders/${orderId}`);
      const data = await res.json();
      setStatus(data.paymentStatus);
    };

    checkStatus(); // Vérification initiale
    const interval = setInterval(checkStatus, 3000); // Toutes les 3s

    return () => clearInterval(interval);
  }, [orderId]);

  return (
    <div>
      {status === 'PENDING' && <p>⏳ Paiement en cours...</p>}
      {status === 'PAID' && <p>✅ Paiement réussi !</p>}
      {status === 'FAILED' && <p>❌ Paiement échoué</p>}
    </div>
  );
};
```

## 🎯 Endpoints à utiliser

| Action | Endpoint | Méthode | Description |
|--------|----------|---------|-------------|
| Initialiser paiement | `/paydunya/payment` | POST | Crée le paiement PayDunya |
| Vérifier statut | `/orders/{id}` | GET | Statut actuel de la commande |
| Statut PayDunya | `/paydunya/status/{token}` | GET | Statut direct PayDunya |

## 📍 URLs de redirection (déjà configurées)

- **Succès** : `/paydunya/payment/success`
- **Échec** : `/paydunya/payment/cancel`
- **Webhook** : `/paydunya/webhook` (backend only)

## ⚠️ Points importants

- ✅ **Ne JAMAIS mettre à jour le statut manuellement**
- ✅ **Faire du polling toutes les 3 secondes max**
- ✅ **Gérer les 4 statuts : PENDING, PAID, FAILED, CANCELLED**
- ❌ **Pas stocker de clés PayDunya dans le frontend**
- ❌ **Pas appeler les webhooks directement**

## 🔧 Pour aller plus loin

Voir la documentation complète : `FRONTEND_PAYMENT_STATUS_GUIDE.md`

**C'est tout ! Le backend fait le gros du travail automatiquement.** 🎉