# 🆕 Nouveau Système de Brouillon et Publication - Produits Vendeur

## 📋 Vue d'ensemble

Le nouveau système permet au vendeur de choisir dès la création d'un produit s'il souhaite le mettre en **brouillon** ou le **publier directement**. Le système vérifie automatiquement si le design est validé par l'admin pour déterminer le statut final.

## 🎯 Logique Implémentée

### Si le vendeur choisit **BROUILLON** (`isDraft: true`):
- ✅ **Design validé** par l'admin → Statut: **`DRAFT`** (prêt à publier)
- ❌ **Design non validé** → Statut: **`PENDING`** (en attente de validation admin)

### Si le vendeur choisit **PUBLIER DIRECTEMENT** (`isDraft: false`):
- ✅ **Design validé** par l'admin → Statut: **`PUBLISHED`** (publié)
- ❌ **Design non validé** → Statut: **`PENDING`** (en attente de validation admin)

## 🔗 Nouveaux Endpoints

### 1. **Mettre en brouillon ou publier**
```http
PUT /vendor-product-validation/set-draft/{productId}
```

**Body:**
```json
{
  "isDraft": true  // true = brouillon, false = publication directe
}
```

**Réponse:**
```json
{
  "success": true,
  "message": "Produit mis en brouillon (design validé - prêt à publier)",
  "status": "DRAFT",
  "isValidated": true,
  "canPublish": true,
  "designValidationStatus": "validated"
}
```

### 2. **Publication directe** (raccourci)
```http
POST /vendor-product-validation/publish-direct/{productId}
```

**Réponse:** (identique à l'endpoint précédent avec `isDraft: false`)

## 📊 Statuts Possibles

| Statut | Description | Actions Vendeur |
|--------|-------------|-----------------|
| **`DRAFT`** | Design validé, produit en brouillon | Peut publier |
| **`PUBLISHED`** | Design validé, produit publié | Produit visible |
| **`PENDING`** | Design en attente de validation admin | Attendre validation |

## 🎨 Interface Utilisateur Recommandée

### Lors de la création/modification d'un produit :

```jsx
// Boutons de choix pour le vendeur
<div className="publication-choice">
  <button onClick={() => setProductStatus(productId, true)}>
    📝 Mettre en brouillon
    <small>Je publierai plus tard quand je veux</small>
  </button>

  <button onClick={() => setProductStatus(productId, false)}>
    🚀 Publier directement
    <small>Je veux publier tout de suite si possible</small>
  </button>
</div>

// Affichage du résultat
<div className="status-result">
  {response.status === 'DRAFT' && response.canPublish && (
    <div className="success">
      ✅ Produit en brouillon et prêt à publier !
      <button onClick={() => publishNow(productId)}>Publier maintenant</button>
    </div>
  )}

  {response.status === 'PUBLISHED' && (
    <div className="success">
      🎉 Produit publié avec succès !
    </div>
  )}

  {response.status === 'PENDING' && (
    <div className="warning">
      ⏳ Produit en attente de validation du design par l'admin
      <p>Vous serez notifié une fois validé</p>
    </div>
  )}
</div>
```

## 🔄 API Calls Frontend

### Fonction pour définir le statut :

```javascript
async function setProductStatus(productId, isDraft) {
  try {
    const response = await fetch(`/api/vendor-product-validation/set-draft/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userToken}`
      },
      body: JSON.stringify({ isDraft })
    });

    const result = await response.json();

    if (result.success) {
      // Afficher le message et l'état
      showStatusMessage(result);

      // Mettre à jour l'interface selon le statut
      updateProductInterface(result);
    } else {
      console.error('Erreur:', result.message);
    }
  } catch (error) {
    console.error('Erreur réseau:', error);
  }
}
```

### Fonction pour publier un brouillon :

```javascript
async function publishDraftProduct(productId) {
  try {
    const response = await fetch(`/api/vendor-product-validation/publish/${productId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    const result = await response.json();

    if (result.success) {
      // Produit publié !
      showSuccessMessage('Produit publié avec succès !');
      updateProductStatus('PUBLISHED');
    }
  } catch (error) {
    console.error('Erreur publication:', error);
  }
}
```

## ⚡ Avantages du Nouveau Système

1. **Transparence totale** : Le vendeur sait immédiatement si son design est validé
2. **Choix clair** : Brouillon vs Publication directe
3. **Gestion automatique** : Le système gère la validation en arrière-plan
4. **Meilleure UX** : Messages clairs pour chaque situation
5. **Flexibilité** : Le vendeur peut changer d'avis à tout moment

## 🔧 Messages Personnalisés

Le système retourne des messages adaptés à chaque situation :

- **Design validé + Brouillon** : "Produit mis en brouillon (design validé - prêt à publier)"
- **Design validé + Publication** : "Produit publié (design validé)"
- **Design non validé + Brouillon** : "Produit en attente (design non validé par l'admin)"
- **Design non validé + Publication** : "Produit en attente de validation du design par l'admin"

## 🎯 Intégration Recommandée

1. **Remplacer** les anciens boutons "Publier" par le nouveau système de choix
2. **Ajouter** des indicateurs visuels pour le statut de validation du design
3. **Implémenter** des notifications temps réel quand l'admin valide
4. **Maintenir** la compatibilité avec l'ancien endpoint `publish/:productId` pour les brouillons validés