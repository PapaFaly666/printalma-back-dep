# 📋 Guide Frontend - Publication des Produits Vendeur

## 🎯 **Vue d'ensemble**

Ce guide explique la logique de publication des produits vendeur et comment l'implémenter côté frontend. La publication dépend entièrement du **statut de validation du design** par l'administrateur.

---

## 🔄 **États des Designs**

### **Statuts Design**
```typescript
interface Design {
  id: number;
  isValidated: boolean;    // ✅ Validé par admin = true | ⏳ En attente = false
  isPending: boolean;      // ⏳ En attente de validation = true
  isPublished: boolean;    // 🌐 Publié = true (géré par admin)
  isDraft: boolean;        // 💾 Brouillon = true
}
```

### **Statuts Produit**
```typescript
interface VendorProduct {
  status: 'PENDING' | 'DRAFT' | 'PUBLISHED';
  isValidated: boolean;                        // Hérite du design
  postValidationAction: 'AUTO_PUBLISH' | 'TO_DRAFT';
}
```

---

## 🚦 **Logique de Publication**

### **📊 Matrice de Décision**

| Design Validé | Action Vendeur | Statut Produit | Visible Public | Peut Republier |
|---------------|----------------|----------------|----------------|----------------|
| ❌ Non        | Brouillon      | `PENDING`      | ❌ Non         | ❌ Non         |
| ❌ Non        | Publier        | `PENDING`      | ❌ Non         | ❌ Non         |
| ✅ Oui        | Brouillon      | `DRAFT`        | ❌ Non         | ✅ Oui         |
| ✅ Oui        | Publier        | `PUBLISHED`    | ✅ Oui         | ✅ Oui         |

---

## 💡 **Messages pour l'Interface**

### **🟡 Design Non Validé (`design.isValidated = false`)**

#### **Choix : "Sauver en Brouillon"**
```typescript
{
  status: 'warning',
  icon: '⏳',
  title: 'Produit sauvé en brouillon',
  message: 'Le design doit être validé par l\'administrateur avant que vous puissiez publier ce produit.',
  canPublish: false,
  nextAction: 'Attendre la validation admin'
}
```

#### **Choix : "Publier Directement"**
```typescript
{
  status: 'info',
  icon: '🕐',
  title: 'Produit en attente de publication',
  message: 'Le produit sera automatiquement publié une fois le design validé par l\'administrateur.',
  canPublish: false,
  nextAction: 'Publication automatique après validation'
}
```

### **🟢 Design Validé (`design.isValidated = true`)**

#### **Choix : "Sauver en Brouillon"**
```typescript
{
  status: 'success',
  icon: '💾',
  title: 'Produit sauvé en brouillon',
  message: 'Votre produit est prêt. Vous pouvez le publier à tout moment.',
  canPublish: true,
  nextAction: 'Publier quand vous voulez'
}
```

#### **Choix : "Publier Directement"**
```typescript
{
  status: 'success',
  icon: '🚀',
  title: 'Produit publié avec succès !',
  message: 'Votre produit est maintenant visible par tous les clients.',
  canPublish: true,
  nextAction: 'Gérer vos ventes'
}
```

---

## 🎨 **Interface Utilisateur**

### **📱 Composant Publication**

```jsx
function ProductPublicationForm({ design, onPublish }) {
  const [publicationChoice, setPublicationChoice] = useState('DRAFT');

  const getPublicationInfo = () => {
    if (!design.isValidated) {
      return {
        canPublish: false,
        draftMessage: "Le design doit être validé avant publication",
        publishMessage: "Sera publié automatiquement après validation",
        publishButtonText: "Soumettre (en attente validation)",
        draftButtonText: "Sauver en brouillon"
      };
    } else {
      return {
        canPublish: true,
        draftMessage: "Sauver sans publier immédiatement",
        publishMessage: "Publier immédiatement sur le site",
        publishButtonText: "Publier maintenant",
        draftButtonText: "Sauver en brouillon"
      };
    }
  };

  const info = getPublicationInfo();

  return (
    <div className="publication-form">
      {/* Indicateur statut design */}
      <div className={`design-status ${design.isValidated ? 'validated' : 'pending'}`}>
        {design.isValidated ? (
          <span>✅ Design validé - Publication autorisée</span>
        ) : (
          <span>⏳ Design en attente de validation admin</span>
        )}
      </div>

      {/* Options de publication */}
      <div className="publication-options">
        <label className="option">
          <input
            type="radio"
            value="DRAFT"
            checked={publicationChoice === 'DRAFT'}
            onChange={(e) => setPublicationChoice(e.target.value)}
          />
          <div>
            <strong>💾 Sauver en brouillon</strong>
            <p>{info.draftMessage}</p>
          </div>
        </label>

        <label className="option">
          <input
            type="radio"
            value="PUBLISH"
            checked={publicationChoice === 'PUBLISH'}
            onChange={(e) => setPublicationChoice(e.target.value)}
          />
          <div>
            <strong>🚀 Publier maintenant</strong>
            <p>{info.publishMessage}</p>
          </div>
        </label>
      </div>

      {/* Boutons d'action */}
      <div className="action-buttons">
        <button
          onClick={() => onPublish('TO_DRAFT')}
          className="btn-draft"
        >
          {info.draftButtonText}
        </button>

        <button
          onClick={() => onPublish('AUTO_PUBLISH')}
          className={`btn-publish ${!info.canPublish && publicationChoice === 'PUBLISH' ? 'warning' : ''}`}
        >
          {info.publishButtonText}
        </button>
      </div>
    </div>
  );
}
```

---

## 🔧 **Logique Métier Frontend**

### **🎯 Fonction de Validation**

```typescript
function getPublicationRules(design: Design, userChoice: 'DRAFT' | 'PUBLISH') {
  const isDesignValidated = design.isValidated;

  if (!isDesignValidated) {
    // Design non validé
    return {
      allowedStatus: 'PENDING',
      postValidationAction: userChoice === 'DRAFT' ? 'TO_DRAFT' : 'AUTO_PUBLISH',
      isPubliclyVisible: false,
      canEditLater: false,
      message: userChoice === 'DRAFT'
        ? 'Produit en brouillon. Attente validation design.'
        : 'Produit sera publié automatiquement après validation design.',
      warningLevel: 'info'
    };
  } else {
    // Design validé
    return {
      allowedStatus: userChoice === 'DRAFT' ? 'DRAFT' : 'PUBLISHED',
      postValidationAction: userChoice === 'DRAFT' ? 'TO_DRAFT' : 'AUTO_PUBLISH',
      isPubliclyVisible: userChoice === 'PUBLISH',
      canEditLater: true,
      message: userChoice === 'DRAFT'
        ? 'Produit sauvé en brouillon. Publiable à tout moment.'
        : 'Produit publié et visible par les clients.',
      warningLevel: 'success'
    };
  }
}
```

### **📡 Appel API**

```typescript
async function publishProduct(productData: any, designId: number, postValidationAction: string) {
  const payload = {
    ...productData,
    designId,
    postValidationAction, // 'AUTO_PUBLISH' ou 'TO_DRAFT'
  };

  try {
    const response = await fetch('/api/vendor/products/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    // Vérifier le statut retourné pour afficher le bon message
    const finalStatus = result.vendorProduct.status; // 'PENDING', 'DRAFT', ou 'PUBLISHED'

    return {
      success: true,
      status: finalStatus,
      isPubliclyVisible: finalStatus === 'PUBLISHED',
      productId: result.vendorProduct.id
    };
  } catch (error) {
    throw new Error(`Erreur publication: ${error.message}`);
  }
}
```

---

## 🎨 **Styles CSS Recommandés**

```css
.design-status {
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
}

.design-status.validated {
  background: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.design-status.pending {
  background: #fff3cd;
  color: #856404;
  border: 1px solid #ffeaa7;
}

.publication-options {
  margin: 20px 0;
}

.option {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  border: 2px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: all 0.2s;
}

.option:hover {
  border-color: #007bff;
  background: #f8f9fa;
}

.option input[type="radio"]:checked + div {
  color: #007bff;
}

.btn-publish.warning {
  background: #ffc107;
  color: #212529;
}

.btn-publish.warning:hover {
  background: #e0a800;
}
```

---

## 🔄 **Gestion des États**

### **📊 Store/Context**

```typescript
interface ProductPublicationState {
  selectedDesign: Design | null;
  publicationMode: 'DRAFT' | 'PUBLISH';
  isSubmitting: boolean;
  validationMessage: string;
  canProceed: boolean;
}

const useProductPublication = () => {
  const [state, setState] = useState<ProductPublicationState>({
    selectedDesign: null,
    publicationMode: 'DRAFT',
    isSubmitting: false,
    validationMessage: '',
    canProceed: false
  });

  const selectDesign = (design: Design) => {
    setState(prev => ({
      ...prev,
      selectedDesign: design,
      canProceed: true,
      validationMessage: design.isValidated
        ? 'Design validé - Toutes les options disponibles'
        : 'Design en attente - Publication après validation admin'
    }));
  };

  const setPublicationMode = (mode: 'DRAFT' | 'PUBLISH') => {
    setState(prev => ({ ...prev, publicationMode: mode }));
  };

  return {
    state,
    selectDesign,
    setPublicationMode,
    publish: async (productData: any) => {
      setState(prev => ({ ...prev, isSubmitting: true }));
      try {
        const result = await publishProduct(
          productData,
          state.selectedDesign!.id,
          state.publicationMode === 'DRAFT' ? 'TO_DRAFT' : 'AUTO_PUBLISH'
        );
        return result;
      } finally {
        setState(prev => ({ ...prev, isSubmitting: false }));
      }
    }
  };
};
```

---

## ⚠️ **Points d'Attention**

### **🚨 Validation Frontend**
- Toujours vérifier `design.isValidated` avant d'afficher les options
- Désactiver visuellement le bouton "Publier" si design non validé
- Afficher des messages explicites sur les conséquences de chaque choix

### **🔄 Synchronisation**
- Rafraîchir le statut du design régulièrement
- Notifier l'utilisateur quand un design passe de "en attente" à "validé"
- Permettre la republication d'un produit en brouillon

### **📱 UX/UI**
- Utiliser des couleurs distinctes pour chaque statut
- Ajouter des icônes pour une meilleure compréhension
- Prévoir des tooltips explicatifs sur les statuts complexes

---

## 🎯 **Checklist d'Implémentation**

- [ ] Récupérer le statut `design.isValidated` depuis l'API
- [ ] Implémenter la logique de choix publication/brouillon
- [ ] Ajouter les messages contextuels selon le statut
- [ ] Styliser les différents états visuellement
- [ ] Tester tous les scénarios de publication
- [ ] Ajouter la gestion d'erreurs appropriée
- [ ] Implémenter les notifications en temps réel
- [ ] Valider l'accessibilité des composants

---

**📝 Note:** Ce guide couvre la logique métier côté frontend. Pour les détails d'implémentation backend, voir le code dans `src/vendor-product/vendor-publish.service.ts` lignes 171-178.