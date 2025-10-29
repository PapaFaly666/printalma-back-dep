# Guide d'Intégration Frontend - Saisie des Commandes Printalma

## 🎯 Objectif
Guide complet pour intégrer le système de commandes dans le frontend Printalma, incluant la saisie des données, la validation et l'utilisation des routes API du backend.

## 📋 Configuration requise

### 1. Variables d'environnement
Assurez-vous que votre fichier `.env` du frontend contient:
```env
VITE_API_URL=http://localhost:3004
```

### 2. Route API endpoint
La route pour les commandes invitées est maintenant disponible:
```
POST /orders/guest
```

## 🛠️ Implémentation dans le Frontend

### 📝 Structure des données à envoyer

#### Interface TypeScript complète

```typescript
interface CreateOrderRequest {
  // Détails de livraison (OBLIGATOIRE - objet imbriqué)
  shippingDetails: {
    // Identité (au moins un des deux requis)
    firstName?: string;          // Prénom (max 100 caractères)
    lastName?: string;           // Nom de famille (max 100 caractères)
    company?: string;            // Nom de société (optionnel, max 150 caractères)

    // Adresse (OBLIGATOIRE)
    street: string;              // Rue/adresse complète (max 200 caractères)
    apartment?: string;          // Appartement/bâtiment (optionnel, max 100 caractères)
    city: string;                // Ville (OBLIGATOIRE, max 100 caractères)
    region?: string;             // Région/État/Province (optionnel, max 100 caractères)
    postalCode?: string;         // Code postal (optionnel, max 20 caractères)
    country: string;             // Pays (OBLIGATOIRE, max 100 caractères)
  };

  // Contact (OBLIGATOIRE)
  phoneNumber: string;           // Numéro de téléphone

  // Produits (OBLIGATOIRE - au moins 1 article)
  orderItems: {
    productId: number;           // ID du produit (OBLIGATOIRE)
    quantity: number;            // Quantité (min: 1, OBLIGATOIRE)
    color?: string;              // Nom de la couleur (optionnel)
    colorId?: number;            // ID de la variation de couleur (optionnel)
    size?: string;               // Taille (optionnel)
  }[];

  // Options de paiement
  paymentMethod?: 'PAYTECH' | 'CASH_ON_DELIVERY' | 'OTHER';  // Défaut: CASH_ON_DELIVERY
  initiatePayment?: boolean;     // Pour déclencher paiement PayTech (défaut: false)

  // Notes additionnelles (optionnel)
  notes?: string;                // Commentaires sur la commande
}
```

### ⚠️ Champs requis et validations

#### Validation des champs obligatoires

| Champ | Requis | Type | Validation |
|-------|--------|------|------------|
| `shippingDetails` | ✅ Oui | Object | Objet non vide |
| `shippingDetails.street` | ✅ Oui | String | Max 200 caractères |
| `shippingDetails.city` | ✅ Oui | String | Max 100 caractères |
| `shippingDetails.country` | ✅ Oui | String | Max 100 caractères |
| `phoneNumber` | ✅ Oui | String | Format téléphone valide |
| `orderItems` | ✅ Oui | Array | Au moins 1 article |
| `orderItems[].productId` | ✅ Oui | Number | Doit exister en BDD |
| `orderItems[].quantity` | ✅ Oui | Number | Minimum 1 |

#### Champs optionnels avec limites

| Champ | Type | Limite |
|-------|------|--------|
| `shippingDetails.firstName` | String | Max 100 caractères |
| `shippingDetails.lastName` | String | Max 100 caractères |
| `shippingDetails.company` | String | Max 150 caractères |
| `shippingDetails.apartment` | String | Max 100 caractères |
| `shippingDetails.region` | String | Max 100 caractères |
| `shippingDetails.postalCode` | String | Max 20 caractères |
| `orderItems[].color` | String | Aucune |
| `orderItems[].colorId` | Number | Doit exister en BDD |
| `orderItems[].size` | String | Aucune |
| `notes` | String | Aucune |

### 📋 Exemples de formulaire de saisie

#### Exemple 1: Formulaire HTML basique

```html
<form id="orderForm">
  <!-- Informations de livraison -->
  <fieldset>
    <legend>Adresse de livraison</legend>

    <label>
      Prénom:
      <input type="text" name="firstName" maxlength="100" />
    </label>

    <label>
      Nom:
      <input type="text" name="lastName" maxlength="100" />
    </label>

    <label>
      Adresse: <span class="required">*</span>
      <input type="text" name="street" maxlength="200" required />
    </label>

    <label>
      Appartement/Bâtiment:
      <input type="text" name="apartment" maxlength="100" />
    </label>

    <label>
      Ville: <span class="required">*</span>
      <input type="text" name="city" maxlength="100" required />
    </label>

    <label>
      Région:
      <input type="text" name="region" maxlength="100" />
    </label>

    <label>
      Code postal:
      <input type="text" name="postalCode" maxlength="20" />
    </label>

    <label>
      Pays: <span class="required">*</span>
      <input type="text" name="country" value="Sénégal" maxlength="100" required />
    </label>
  </fieldset>

  <!-- Contact -->
  <fieldset>
    <legend>Contact</legend>
    <label>
      Téléphone: <span class="required">*</span>
      <input type="tel" name="phoneNumber" placeholder="77 123 45 67" required />
    </label>
  </fieldset>

  <!-- Produits (dynamique) -->
  <fieldset id="orderItems">
    <legend>Articles</legend>
    <div class="order-item">
      <select name="productId" required>
        <option value="">Choisir un produit</option>
        <!-- Options chargées dynamiquement -->
      </select>
      <input type="number" name="quantity" min="1" value="1" required />
      <input type="text" name="size" placeholder="Taille (optionnel)" />
      <input type="text" name="color" placeholder="Couleur (optionnel)" />
    </div>
  </fieldset>

  <!-- Options de paiement -->
  <fieldset>
    <legend>Paiement</legend>
    <label>
      <input type="radio" name="paymentMethod" value="CASH_ON_DELIVERY" checked />
      Paiement à la livraison
    </label>
    <label>
      <input type="radio" name="paymentMethod" value="PAYTECH" />
      PayTech (carte bancaire)
    </label>
    <label>
      <input type="radio" name="paymentMethod" value="OTHER" />
      Autre
    </label>
  </fieldset>

  <!-- Notes -->
  <label>
    Notes (optionnel):
    <textarea name="notes" rows="3"></textarea>
  </label>

  <button type="submit">Passer la commande</button>
</form>
```

#### Exemple 2: Fonction de soumission avec validation

```typescript
const createGuestOrder = async (orderData: CreateOrderRequest) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/guest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (result.success) {
      console.log('✅ Commande créée:', result.data);
      return result.data;
    } else {
      throw new Error(result.message || 'Erreur lors de la création');
    }
  } catch (error) {
    console.error('❌ Erreur API:', error);
    throw error;
  }
};

// Gestionnaire de soumission du formulaire
document.getElementById('orderForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(e.target as HTMLFormElement);

  // Construction de l'objet de commande
  const orderData: CreateOrderRequest = {
    shippingDetails: {
      firstName: formData.get('firstName') as string || undefined,
      lastName: formData.get('lastName') as string || undefined,
      street: formData.get('street') as string,
      apartment: formData.get('apartment') as string || undefined,
      city: formData.get('city') as string,
      region: formData.get('region') as string || undefined,
      postalCode: formData.get('postalCode') as string || undefined,
      country: formData.get('country') as string,
    },
    phoneNumber: formData.get('phoneNumber') as string,
    orderItems: [
      {
        productId: parseInt(formData.get('productId') as string),
        quantity: parseInt(formData.get('quantity') as string),
        size: formData.get('size') as string || undefined,
        color: formData.get('color') as string || undefined,
      }
    ],
    paymentMethod: formData.get('paymentMethod') as any,
    notes: formData.get('notes') as string || undefined,
  };

  try {
    const order = await createGuestOrder(orderData);
    alert(`Commande #${order.orderNumber} créée avec succès!`);

    // Redirection si paiement PayTech
    if (order.payment?.redirect_url) {
      window.location.href = order.payment.redirect_url;
    }
  } catch (error) {
    alert('Erreur lors de la création de la commande');
  }
});
```

### ✅ Exemple de données valides

```typescript
// Exemple 1: Commande complète avec tous les champs
const commandeComplete = {
  shippingDetails: {
    firstName: "Marie",
    lastName: "Diop",
    street: "45 Rue de la République, Appt 12B",
    apartment: "12B",
    city: "Dakar",
    region: "Dakar",
    postalCode: "12345",
    country: "Sénégal"
  },
  phoneNumber: "771234567",
  orderItems: [
    {
      productId: 1,
      quantity: 2,
      color: "Noir",
      colorId: 5,
      size: "L"
    },
    {
      productId: 3,
      quantity: 1,
      color: "Blanc",
      size: "M"
    }
  ],
  paymentMethod: "CASH_ON_DELIVERY",
  notes: "Livraison après 18h SVP"
};

// Exemple 2: Commande minimale (uniquement champs requis)
const commandeMinimale = {
  shippingDetails: {
    street: "123 Avenue Léopold Sédar Senghor",
    city: "Dakar",
    country: "Sénégal"
  },
  phoneNumber: "771234567",
  orderItems: [
    {
      productId: 1,
      quantity: 1
    }
  ]
};

// Exemple 3: Commande avec paiement PayTech
const commandePayTech = {
  shippingDetails: {
    firstName: "Amadou",
    lastName: "Ba",
    street: "Zone B, Villa 45",
    city: "Thiès",
    country: "Sénégal"
  },
  phoneNumber: "775551234",
  orderItems: [
    {
      productId: 7,
      quantity: 3,
      size: "XL"
    }
  ],
  paymentMethod: "PAYTECH",
  initiatePayment: true  // Déclenche redirection vers page de paiement
};
```

## ⚠️ Erreurs de validation courantes

### Messages d'erreur possibles

```typescript
// Erreur si shippingDetails manquant
{
  "statusCode": 400,
  "message": [
    "shippingDetails must be a non-empty object"
  ],
  "error": "Bad Request"
}

// Erreur si champ obligatoire manquant
{
  "statusCode": 400,
  "message": [
    "street should not be empty",
    "city should not be empty",
    "country should not be empty"
  ],
  "error": "Bad Request"
}

// Erreur si dépassement de longueur
{
  "statusCode": 400,
  "message": [
    "street must be shorter than or equal to 200 characters"
  ],
  "error": "Bad Request"
}

// Erreur si quantité invalide
{
  "statusCode": 400,
  "message": [
    "quantity must not be less than 1"
  ],
  "error": "Bad Request"
}

// Erreur si orderItems vide
{
  "statusCode": 400,
  "message": [
    "orderItems must be an array",
    "orderItems should not be empty"
  ],
  "error": "Bad Request"
}
```

### Gestion des erreurs dans le frontend

```typescript
const handleOrderSubmit = async (orderData: CreateOrderRequest) => {
  try {
    const response = await fetch(`${API_URL}/orders/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });

    const result = await response.json();

    if (!response.ok) {
      // Gestion des erreurs de validation
      if (result.message && Array.isArray(result.message)) {
        const errors = result.message.join('\n');
        alert(`Erreurs de validation:\n${errors}`);
      } else {
        alert(result.message || 'Erreur lors de la création');
      }
      return;
    }

    // Succès
    if (result.success) {
      console.log('✅ Commande créée:', result.data);

      // Redirection PayTech si nécessaire
      if (result.data.payment?.redirect_url) {
        window.location.href = result.data.payment.redirect_url;
      } else {
        alert(`Commande #${result.data.orderNumber} créée!`);
      }
    }
  } catch (error) {
    console.error('❌ Erreur réseau:', error);
    alert('Impossible de contacter le serveur');
  }
};
```

## 📨 Format de réponse du backend

### Structure de réponse réussie

```typescript
interface OrderResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    orderNumber: string;                    // Ex: "ORD-20251029-ABC123"
    status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
    paymentStatus?: "PAID" | "FAILED";
    totalAmount: number;
    phoneNumber: string;
    notes?: string;

    // Adresse de livraison (champs individuels)
    shippingFirstName?: string;
    shippingLastName?: string;
    shippingCompany?: string;
    shippingStreet: string;
    shippingApartment?: string;
    shippingCity: string;
    shippingRegion?: string;
    shippingPostalCode?: string;
    shippingCountry: string;

    // Dates
    createdAt: string;                      // Format ISO 8601
    updatedAt: string;

    // Articles commandés
    orderItems: {
      id: number;
      productId: number;
      quantity: number;
      unitPrice: number;
      size?: string;
      color?: string;
      colorId?: number;
      product: {
        id: number;
        name: string;
        orderedColorName?: string;
        orderedColorHexCode?: string;
        orderedColorImageUrl?: string;
      };
    }[];

    // Informations de paiement (si PayTech)
    payment?: {
      token: string;
      redirect_url: string;                 // URL de redirection pour paiement
    };
  };
}
```

### Exemple de réponse concrète

```json
{
  "success": true,
  "message": "Commande invité créée avec succès",
  "data": {
    "id": 42,
    "orderNumber": "ORD-20251029-XY7K9",
    "status": "PENDING",
    "totalAmount": 50000,
    "phoneNumber": "771234567",
    "notes": "Livraison après 18h SVP",
    "shippingFirstName": "Marie",
    "shippingLastName": "Diop",
    "shippingStreet": "45 Rue de la République",
    "shippingApartment": "12B",
    "shippingCity": "Dakar",
    "shippingRegion": "Dakar",
    "shippingPostalCode": "12345",
    "shippingCountry": "Sénégal",
    "createdAt": "2025-10-29T14:30:00.000Z",
    "updatedAt": "2025-10-29T14:30:00.000Z",
    "orderItems": [
      {
        "id": 101,
        "productId": 1,
        "quantity": 2,
        "unitPrice": 25000,
        "size": "L",
        "color": "Noir",
        "colorId": 5,
        "product": {
          "id": 1,
          "name": "T-shirt Premium",
          "orderedColorName": "Noir",
          "orderedColorHexCode": "#000000"
        }
      }
    ]
  }
}
```

## 💡 Intégration PayTech

### Configuration du paiement en ligne

```typescript
const createOrderWithPayTech = {
  shippingDetails: {
    firstName: "Amadou",
    lastName: "Sow",
    street: "Cité Keur Gorgui, Villa 89",
    city: "Dakar",
    country: "Sénégal"
  },
  phoneNumber: "775551234",
  orderItems: [
    {
      productId: 5,
      quantity: 2,
      size: "M"
    }
  ],
  paymentMethod: "PAYTECH",
  initiatePayment: true  // IMPORTANT: Active la redirection
};

// Soumettre la commande
const response = await createGuestOrder(createOrderWithPayTech);

// Redirection automatique vers PayTech
if (response.payment?.redirect_url) {
  window.location.href = response.payment.redirect_url;
}
```

### Flux de paiement PayTech

1. **Client remplit le formulaire** → Sélectionne "PayTech" comme mode de paiement
2. **Frontend envoie la commande** → Avec `initiatePayment: true`
3. **Backend crée la commande** → Retourne `payment.redirect_url`
4. **Redirection automatique** → Client redirigé vers page de paiement PayTech
5. **Paiement effectué** → Client revient sur votre site
6. **Webhook PayTech** → Backend reçoit confirmation du paiement

## 🎨 Composant React exemple

```tsx
import { useState } from 'react';

interface OrderFormData {
  firstName: string;
  lastName: string;
  street: string;
  city: string;
  country: string;
  phoneNumber: string;
  paymentMethod: 'CASH_ON_DELIVERY' | 'PAYTECH' | 'OTHER';
}

export function OrderForm() {
  const [formData, setFormData] = useState<OrderFormData>({
    firstName: '',
    lastName: '',
    street: '',
    city: '',
    country: 'Sénégal',
    phoneNumber: '',
    paymentMethod: 'CASH_ON_DELIVERY'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const orderData = {
        shippingDetails: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          street: formData.street,
          city: formData.city,
          country: formData.country
        },
        phoneNumber: formData.phoneNumber,
        orderItems: [
          // Récupérer depuis votre panier
          { productId: 1, quantity: 1 }
        ],
        paymentMethod: formData.paymentMethod,
        initiatePayment: formData.paymentMethod === 'PAYTECH'
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/orders/guest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message?.join(', ') || 'Erreur');
      }

      // Redirection PayTech ou affichage confirmation
      if (result.data.payment?.redirect_url) {
        window.location.href = result.data.payment.redirect_url;
      } else {
        alert(`Commande ${result.data.orderNumber} créée!`);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="order-form">
      <h2>Passer une commande</h2>

      {error && <div className="error">{error}</div>}

      <div className="form-group">
        <label>Prénom</label>
        <input
          type="text"
          value={formData.firstName}
          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label>Nom</label>
        <input
          type="text"
          value={formData.lastName}
          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label>Adresse *</label>
        <input
          type="text"
          value={formData.street}
          onChange={(e) => setFormData({...formData, street: e.target.value})}
          required
          maxLength={200}
        />
      </div>

      <div className="form-group">
        <label>Ville *</label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => setFormData({...formData, city: e.target.value})}
          required
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label>Pays *</label>
        <input
          type="text"
          value={formData.country}
          onChange={(e) => setFormData({...formData, country: e.target.value})}
          required
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label>Téléphone *</label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
          required
          placeholder="77 123 45 67"
        />
      </div>

      <div className="form-group">
        <label>Mode de paiement</label>
        <select
          value={formData.paymentMethod}
          onChange={(e) => setFormData({...formData, paymentMethod: e.target.value as any})}
        >
          <option value="CASH_ON_DELIVERY">Paiement à la livraison</option>
          <option value="PAYTECH">PayTech (en ligne)</option>
          <option value="OTHER">Autre</option>
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Traitement...' : 'Valider la commande'}
      </button>
    </form>
  );
}
```

## ✅ Checklist d'intégration

### Configuration initiale
- [ ] Configurer `VITE_API_URL` dans `.env`
- [ ] Installer les dépendances (fetch ou axios)
- [ ] Créer les interfaces TypeScript

### Formulaire de commande
- [ ] Créer le formulaire avec tous les champs obligatoires
- [ ] Ajouter les validations côté client (longueurs max, formats)
- [ ] Implémenter la sélection de produits
- [ ] Gérer les quantités, tailles et couleurs
- [ ] Ajouter le sélecteur de mode de paiement

### Intégration API
- [ ] Créer la fonction d'appel à `/orders/guest`
- [ ] Gérer les réponses succès
- [ ] Gérer les erreurs de validation
- [ ] Implémenter la redirection PayTech
- [ ] Afficher les confirmations à l'utilisateur

### Tests
- [ ] Tester avec commande minimale (champs requis uniquement)
- [ ] Tester avec commande complète (tous les champs)
- [ ] Tester les erreurs de validation
- [ ] Tester le paiement PayTech
- [ ] Tester le paiement à la livraison

## 🚨 Points d'attention

### Validation des données
1. **Champs obligatoires**: `street`, `city`, `country`, `phoneNumber`, `orderItems`
2. **Longueurs maximales**: Respecter les limites (voir tableaux ci-dessus)
3. **Quantités**: Minimum 1 pour chaque article
4. **ProductId**: Doit exister en base de données

### Sécurité
- Ne jamais exposer de données sensibles côté client
- Valider également côté backend (déjà fait)
- Utiliser HTTPS en production

### UX/UI
- Indiquer clairement les champs obligatoires (*)
- Afficher les erreurs de validation de manière claire
- Confirmer la création de commande
- Montrer un loader pendant la soumission

### PayTech
- `initiatePayment` doit être `true` pour déclencher le paiement
- Redirection automatique après création de commande
- Gérer le retour après paiement

## 📞 Support et debugging

### En cas d'erreur

1. **Erreur 400** → Problème de validation
   - Vérifier que tous les champs requis sont remplis
   - Vérifier les longueurs max
   - Vérifier que `orderItems` n'est pas vide

2. **Erreur 404** → Route incorrecte
   - Vérifier `VITE_API_URL` dans `.env`
   - Vérifier que la route est `/orders/guest`

3. **Erreur 500** → Problème serveur
   - Vérifier les logs backend
   - Vérifier que les `productId` existent

### Outils de test

```bash
# Test avec curl
curl -X POST http://localhost:3004/orders/guest \
  -H "Content-Type: application/json" \
  -d '{
    "shippingDetails": {
      "street": "123 Test Street",
      "city": "Dakar",
      "country": "Sénégal"
    },
    "phoneNumber": "771234567",
    "orderItems": [
      {"productId": 1, "quantity": 1}
    ]
  }'
```

### Logs et monitoring
- Consulter les logs backend: `npm run start:dev`
- Vérifier la console navigateur pour les erreurs
- Utiliser les DevTools Network pour inspecter les requêtes

---

## 📚 Ressources supplémentaires

- **Backend API**: Port 3004
- **Route principale**: `POST /orders/guest`
- **Documentation Swagger**: `http://localhost:3004/api` (si activé)

---

**Dernière mise à jour**: 29/10/2025
**Version**: 2.0
**Backend API**: Compatible avec CreateOrderDto v2