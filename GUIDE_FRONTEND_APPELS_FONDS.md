# Guide d'Implémentation Frontend - Appels de Fonds Vendeur

## 🎯 Objectif

Ce guide explique comment implémenter les appels de fonds pour les vendeurs dans le frontend. Le système permet aux vendeurs de demander le retrait de leurs gains générés par les commandes **livrées** uniquement.

---

## 📋 Règles Métier

### 1. **Calcul des Gains Disponibles**
- ✅ **Seulement les commandes livrées** (`DELIVERED`) génèrent des gains
- ❌ Les commandes en d'autres statuts ne comptent pas
- 💰 **Montant disponible** = Total commandes livrées - Retraits payés - Retraits en attente

### 2. **Limites de Retrait**
- **Montant minimum** : 1 000 FCFA
- **Montant maximum** : Montant disponible des gains
- **Exemple** : Si total commandes livrées = 18 000 FCFA, retrait max = 18 000 FCFA

### 3. **Méthodes de Paiement**
- **WAVE** : Téléphone requis
- **ORANGE_MONEY** : Téléphone requis
- **BANK_TRANSFER** : IBAN requis

---

## 🔌 Endpoint API

### POST `/orders/{orderId}/request-funds`

**Headers requis :**
```http
Content-Type: application/json
Authorization: Bearer {token_jwt}
```

**Corps de la requête :**
```json
{
  "amount": 15000,
  "paymentMethod": "WAVE",
  "phoneNumber": "771234567",
  "iban": "SN1234567890123456789012345", // Seulement pour BANK_TRANSFER
  "description": "Demande de retrait - Décembre 2025"
}
```

---

## ✅ Réponses API

### 1. **Succès (200)**
```json
{
  "success": true,
  "message": "Demande de retrait créée avec succès",
  "data": {
    "fundsRequest": {
      "id": 3,
      "amount": 15000,
      "status": "PENDING",
      "createdAt": "2025-12-01T22:56:04.298Z",
      "description": "Demande de retrait - Décembre 2025",
      "paymentMethod": "WAVE",
      "requestedAmount": 15000,
      "availableAmount": 18300
    },
    "order": {
      "id": 1,
      "orderNumber": "ORD-1764606601648",
      "totalAmount": 9000,
      "status": "DELIVERED"
    }
  }
}
```

### 2. **Erreurs (400)**

#### a) Corps vide ou invalide
```json
{
  "message": "Erreur lors de la création de la demande de retrait: Corps de requête vide. Veuillez fournir les données requises: amount, paymentMethod, etc.",
  "error": "Bad Request",
  "statusCode": 400
}
```

#### b) Montant invalide
```json
{
  "message": "Erreur lors de la création de la demande de retrait: Le montant est requis et doit être un nombre positif (minimum 1000 FCFA)",
  "error": "Bad Request",
  "statusCode": 400
}
```

#### c) Solde insuffisant
```json
{
  "message": "Erreur lors de la création de la demande de retrait: Le montant demandé (20000) dépasse le montant disponible (18300)",
  "error": "Bad Request",
  "statusCode": 400
}
```

#### d) Méthode de paiement invalide
```json
{
  "message": "Erreur lors de la création de la demande de retrait: Méthode de paiement invalide. Options: WAVE, ORANGE_MONEY, BANK_TRANSFER",
  "error": "Bad Request",
  "statusCode": 400
}
```

### 3. **Non autorisé (401)**
```json
{
  "message": "Unauthorized",
  "statusCode": 401
}
```

---

## 🎨 Implémentation Frontend

### 1. **Vérifier les Gains Disponibles**

```javascript
// Récupérer les gains du vendeur
async function getVendorEarnings() {
  try {
    const response = await fetch('/vendor-funds/earnings', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      return {
        totalEarnings: data.data.totalEarnings,
        availableAmount: data.data.availableAmount,
        thisMonthEarnings: data.data.thisMonthEarnings
      };
    }
  } catch (error) {
    console.error('Erreur récupération gains:', error);
    return null;
  }
}
```

### 2. **Formulaire de Demande de Retrait**

```javascript
const FundsRequestForm = () => {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('WAVE');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [iban, setIban] = useState('');
  const [description, setDescription] = useState('');
  const [earnings, setEarnings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Charger les gains disponibles au montage du composant
    loadEarnings();
  }, []);

  const loadEarnings = async () => {
    const earningsData = await getVendorEarnings();
    if (earningsData) {
      setEarnings(earningsData);
    }
  };

  const validateForm = () => {
    if (!amount || amount <= 0) {
      setError('Le montant est requis et doit être positif');
      return false;
    }

    if (amount < 1000) {
      setError('Le montant minimum de retrait est de 1 000 FCFA');
      return false;
    }

    if (earnings && parseFloat(amount) > earnings.availableAmount) {
      setError(`Montant maximum disponible: ${earnings.availableAmount} FCFA`);
      return false;
    }

    if (!['WAVE', 'ORANGE_MONEY', 'BANK_TRANSFER'].includes(paymentMethod)) {
      setError('Méthode de paiement invalide');
      return false;
    }

    if (paymentMethod !== 'BANK_TRANSFER' && !phoneNumber) {
      setError('Le numéro de téléphone est requis');
      return false;
    }

    if (paymentMethod === 'BANK_TRANSFER' && !iban) {
      setError('L\'IBAN est requis pour les virements bancaires');
      return false;
    }

    setError('');
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const requestData = {
        amount: parseFloat(amount),
        paymentMethod,
        phoneNumber: paymentMethod !== 'BANK_TRANSFER' ? phoneNumber : undefined,
        iban: paymentMethod === 'BANK_TRANSFER' ? iban : undefined,
        description: description || `Demande de retrait - ${new Date().toLocaleDateString('fr-FR')}`
      };

      const response = await fetch(`/orders/${orderId}/request-funds`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      });

      const data = await response.json();

      if (data.success) {
        // Succès - réinitialiser le formulaire
        setAmount('');
        setDescription('');
        setPaymentMethod('WAVE');
        setPhoneNumber('');
        setIban('');
        alert('Demande de retrait créée avec succès!');

        // Recharger les gains disponibles
        loadEarnings();
      } else {
        setError(data.message);
      }
    } catch (error) {
      setError('Erreur lors de la demande. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="funds-request-form">
      <h2>💰 Demande de Retrait</h2>

      {earnings && (
        <div className="earnings-info">
          <p>📊 Total de vos gains: {earnings.totalEarnings} FCFA</p>
          <p>💵 Montant disponible: {earnings.availableAmount} FCFA</p>
          <p>📈 Gains ce mois: {earnings.thisMonthEarnings} FCFA</p>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Montant du retrait (FCFA)*</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            min="1000"
            max={earnings?.availableAmount || ''}
            placeholder="Entrez le montant..."
            required
          />
          {earnings && (
            <small>Maximum: {earnings.availableAmount} FCFA</small>
          )}
        </div>

        <div className="form-group">
          <label>Méthode de paiement*</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            required
          >
            <option value="WAVE">🌊 WAVE</option>
            <option value="ORANGE_MONEY">🧡 ORANGE MONEY</option>
            <option value="BANK_TRANSFER">🏦 VIREMENT BANCAIRE</option>
          </select>
        </div>

        {paymentMethod !== 'BANK_TRANSFER' && (
          <div className="form-group">
            <label>Numéro de téléphone*</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="77 XXXXX XX"
              required
            />
          </div>
        )}

        {paymentMethod === 'BANK_TRANSFER' && (
          <div className="form-group">
            <label>IBAN*</label>
            <input
              type="text"
              value={iban}
              onChange={(e) => setIban(e.target.value.toUpperCase())}
              placeholder="SNXX XXXX..."
              required
            />
          </div>
        )}

        <div className="form-group">
          <label>Description (optionnelle)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description de la demande..."
            rows="3"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
        >
          {loading ? 'Traitement...' : '🚀 Confirmer la demande'}
        </button>
      </form>
    </div>
  );
};
```

### 3. **Tableau des Demandes de Retrait**

```javascript
const FundsRequestsTable = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFundsRequests();
  }, []);

  const loadFundsRequests = async () => {
    try {
      const response = await fetch('/vendor-funds/requests?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (data.success) {
        setRequests(data.data.requests);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      'PENDING': { color: '#ff9800', text: '⏳ En attente' },
      'APPROVED': { color: '#28a745', text: '✅ Approuvé' },
      'REJECTED': { color: '#dc3545', text: '❌ Rejeté' },
      'PAID': { color: '#17a2b8', text: '💰 Payé' }
    };
    return badges[status] || { color: '#6c757d', text: status };
  };

  return (
    <div className="funds-requests-table">
      <h2>📋 Historique des demandes</h2>

      {loading ? (
        <div>Chargement...</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Montant</th>
              <th>Méthode</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((request) => (
              <tr key={request.id}>
                <td>{new Date(request.createdAt).toLocaleDateString('fr-FR')}</td>
                <td>{request.amount} FCFA</td>
                <td>{request.paymentMethod}</td>
                <td>
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusBadge(request.status).color }}
                  >
                    {getStatusBadge(request.status).text}
                  </span>
                </td>
                <td>
                  {request.status === 'PENDING' && (
                    <button className="cancel-btn">
                      Annuler
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
```

---

## 🎯 Best Practices Frontend

### 1. **Validation Côté Client**
- ✅ Valider le montant minimum (1 000 FCFA)
- ✅ Valider le montant maximum (gains disponibles)
- ✅ Valider la méthode de paiement
- ✅ Valider les champs conditionnels (téléphone/IBAN)

### 2. **Expérience Utilisateur**
- ✅ Afficher le montant disponible en temps réel
- ✅ Désactiver le bouton si solde insuffisant
- ✅ Feedback immédiat lors de la saisie
- ✅ Loading states pendant l'appel API

### 3. **Gestion des Erreurs**
- ✅ Messages d'erreur clairs et actionnables
- ✅ Logging des erreurs pour débogage
- ✅ Retry mechanisms si nécessaire

### 4. **Sécurité**
- ✅ Token JWT valide requis
- ✅ Validation des entrées utilisateur
- ✅ Protection contre les montants excessifs

---

## 🧪 Tests d'Intégration

### Test 1: Formulaire vide
```bash
curl -X POST 'http://localhost:3004/orders/1/request-funds' \
  -H 'Content-Type: application/json' \
  -d ''
```
**Attendu:** 400 - "Corps de requête vide"

### Test 2: Montant invalide
```bash
curl -X POST 'http://localhost:3004/orders/1/request-funds' \
  -H 'Content-Type: application/json' \
  -d '{"amount": 500, "paymentMethod": "WAVE"}'
```
**Attendu:** 400 - "Le montant minimum de retrait est de 1000 FCFA"

### Test 3: Montant supérieur disponible
```bash
curl -X POST 'http://localhost:3004/orders/1/request-funds' \
  -H 'Content-Type: application/json' \
  -d '{"amount": 50000, "paymentMethod": "WAVE", "phoneNumber": "771234567"}'
```
**Attendu:** 400 - "dépasse le montant disponible"

### Test 4: Demande valide
```bash
curl -X POST 'http://localhost:3004/orders/1/request-funds' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 5000,
    "paymentMethod": "WAVE",
    "phoneNumber": "771234567",
    "description": "Test demande"
  }'
```
**Attendu:** 200 - "Demande de retrait créée avec succès"

---

## 📞 Support

En cas de problème d'implémentation, vérifiez:
1. Token JWT valide et non expiré
2. Headers `Content-Type: application/json` présents
3. Corps de la requête bien formatté JSON
4. Montant dans les limites autorisées
5. Champs conditionnels validés selon la méthode

Pour toute question technique : **backend-team@printalma.com**