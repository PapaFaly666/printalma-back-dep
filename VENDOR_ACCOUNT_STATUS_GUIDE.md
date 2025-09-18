# 🔄 Guide - Gestion du Statut des Comptes Vendeurs

## ✅ **FONCTIONNALITÉ IMPLÉMENTÉE**

Les vendeurs peuvent maintenant **désactiver** et **réactiver** leur propre compte à tout moment. Quand un compte est désactivé, tous les produits et designs du vendeur deviennent **invisibles publiquement**.

---

## 🚀 **NOUVEAUX ENDPOINTS**

### **1. Désactiver/Réactiver son compte**
```http
PATCH /vendor/account/status
```

**Headers :**
```http
Authorization: Bearer <vendor_jwt_token>
Content-Type: application/json
```

**Body :**
```json
{
  "status": false,
  "reason": "Pause temporaire pour les vacances"
}
```

**Réponses :**

✅ **Succès (200)**
```json
{
  "success": true,
  "message": "Compte désactivé avec succès",
  "data": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "status": false,
    "shop_name": "Boutique John",
    "statusChangedAt": "2024-01-15T10:30:00.000Z",
    "reason": "Pause temporaire pour les vacances"
  }
}
```

❌ **Erreur (400)**
```json
{
  "message": "Données invalides",
  "error": "Bad Request",
  "statusCode": 400
}
```

### **2. Récupérer les informations du compte**
```http
GET /vendor/account/info
```

**Headers :**
```http
Authorization: Bearer <vendor_jwt_token>
```

**Réponse :**
```json
{
  "success": true,
  "data": {
    "id": 123,
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "status": true,
    "shop_name": "Boutique John",
    "phone": "+33 6 12 34 56 78",
    "country": "France",
    "created_at": "2024-01-01T00:00:00.000Z",
    "last_login_at": "2024-01-15T10:30:00.000Z",
    "updated_at": "2024-01-15T10:30:00.000Z",
    "statistics": {
      "totalProducts": 12,
      "publishedProducts": 8,
      "totalDesigns": 15,
      "publishedDesigns": 10
    }
  }
}
```

---

## 🧪 **TESTS AVEC CURL**

### **Test 1 : Récupérer les informations du compte**
```bash
curl -X GET \
  'http://localhost:3004/vendor/account/info' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json'
```

### **Test 2 : Désactiver son compte**
```bash
curl -X PATCH \
  'http://localhost:3004/vendor/account/status' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": false,
    "reason": "Pause temporaire pour les vacances"
  }'
```

### **Test 3 : Réactiver son compte**
```bash
curl -X PATCH \
  'http://localhost:3004/vendor/account/status' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "status": true,
    "reason": "Retour de vacances, reprise de l'activité"
  }'
```

### **Test 4 : Vérifier la visibilité publique**

**Produits visibles (vendeur actif) :**
```bash
curl -X GET 'http://localhost:3004/public/vendor-products'
```

**Produits invisibles (vendeur désactivé) :**
```bash
# Après désactivation du compte, les produits du vendeur n'apparaissent plus
curl -X GET 'http://localhost:3004/public/vendor-products'
```

---

## ⚡ **IMPACT DE LA DÉSACTIVATION**

### **🔴 Quand un vendeur désactive son compte :**

1. **Produits vendeurs** → Invisibles dans :
   - `/public/vendor-products` (liste publique)
   - `/public/vendor-products/search` (recherche)
   - `/public/vendor-products/:id` (détails publics)

2. **Designs** → Invisibles si des endpoints publics existent

3. **Authentification** → Le vendeur peut toujours se connecter

4. **Interface vendeur** → Toujours accessible pour réactiver le compte

### **🟢 Quand un vendeur réactive son compte :**

- Tous les produits et designs redeviennent immédiatement **visibles publiquement**
- Aucune perte de données
- Retour complet à l'état normal

---

## 🔧 **INTÉGRATION FRONTEND**

### **Service JavaScript pour la gestion du statut**

```javascript
class VendorAccountService {
    constructor(apiUrl = 'http://localhost:3004') {
        this.apiUrl = apiUrl;
    }

    /**
     * 📋 Récupérer les informations du compte vendeur
     */
    async getAccountInfo() {
        try {
            const response = await fetch(`${this.apiUrl}/vendor/account/info`, {
                method: 'GET',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            console.log('✅ Informations compte récupérées:', data);
            return data;

        } catch (error) {
            console.error('❌ Erreur récupération compte:', error);
            throw error;
        }
    }

    /**
     * 🔄 Modifier le statut du compte (activer/désactiver)
     */
    async updateAccountStatus(status, reason = null) {
        try {
            const payload = { status };
            if (reason) {
                payload.reason = reason;
            }

            const response = await fetch(`${this.apiUrl}/vendor/account/status`, {
                method: 'PATCH',
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
            }

            const data = await response.json();
            const action = status ? 'réactivé' : 'désactivé';
            console.log(`✅ Compte ${action}:`, data);
            return data;

        } catch (error) {
            console.error('❌ Erreur modification statut:', error);
            throw error;
        }
    }

    /**
     * 🔴 Désactiver le compte
     */
    async deactivateAccount(reason = null) {
        return this.updateAccountStatus(false, reason);
    }

    /**
     * 🟢 Réactiver le compte
     */
    async activateAccount(reason = null) {
        return this.updateAccountStatus(true, reason);
    }
}

// Usage
const vendorAccount = new VendorAccountService();

// Récupérer les infos
const accountInfo = await vendorAccount.getAccountInfo();

// Désactiver
await vendorAccount.deactivateAccount('Pause pour les vacances');

// Réactiver
await vendorAccount.activateAccount('Retour de vacances');
```

### **Exemple d'interface utilisateur**

```javascript
// Composant React/Vue pour le toggle du compte
const AccountStatusToggle = () => {
    const [accountInfo, setAccountInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const toggleAccountStatus = async () => {
        setIsLoading(true);
        try {
            const newStatus = !accountInfo.status;
            const reason = prompt(
                newStatus
                    ? 'Raison de la réactivation (optionnel):'
                    : 'Raison de la désactivation (optionnel):'
            );

            await vendorAccount.updateAccountStatus(newStatus, reason);

            // Recharger les informations
            const updatedInfo = await vendorAccount.getAccountInfo();
            setAccountInfo(updatedInfo.data);

            alert(newStatus ? 'Compte réactivé avec succès!' : 'Compte désactivé avec succès!');
        } catch (error) {
            alert('Erreur: ' + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="account-status-toggle">
            <h3>Statut du compte</h3>
            <p>
                Votre compte est actuellement :
                <strong>
                    {accountInfo?.status ? ' ACTIF' : ' DÉSACTIVÉ'}
                </strong>
            </p>

            <button
                onClick={toggleAccountStatus}
                disabled={isLoading}
                className={accountInfo?.status ? 'btn-danger' : 'btn-success'}
            >
                {isLoading ? 'Chargement...' :
                 accountInfo?.status ? 'Désactiver mon compte' : 'Réactiver mon compte'}
            </button>

            {!accountInfo?.status && (
                <div className="warning">
                    ⚠️ Vos produits et designs sont actuellement invisibles publiquement
                </div>
            )}
        </div>
    );
};
```

---

## 📊 **SURVEILLANCE ET LOGS**

### **Logs côté serveur**
```
🔄 DÉSACTIVATION compte vendeur 123
✅ Compte vendeur 123 désactivé
📋 Récupération informations compte vendeur 123
🔄 RÉACTIVATION compte vendeur 123
✅ Compte vendeur 123 réactivé
```

### **Métriques à surveiller**
- Nombre de comptes désactivés/réactivés par jour
- Durée moyenne des désactivations
- Raisons les plus fréquentes de désactivation

---

## 🚨 **NOTES IMPORTANTES**

1. **Sécurité** : Seul le propriétaire du compte peut modifier son statut
2. **Données** : Aucune donnée n'est supprimée lors de la désactivation
3. **Réactivation** : Instantanée et sans perte
4. **Admin** : Les admins voient toujours tous les produits/designs
5. **JWT** : Le token reste valide même si le compte est désactivé

---

## ✅ **VALIDATION COMPLÈTE**

La fonctionnalité est **opérationnelle** et **sécurisée** ! Les vendeurs peuvent maintenant gérer leur visibilité publique de manière autonome. 🎯