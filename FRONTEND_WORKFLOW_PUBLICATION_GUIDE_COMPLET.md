# 🎯 Guide Frontend - Workflow Publication Complet

> **Date** : Décembre 2024  
> **Status** : Backend corrigé - Implémentation frontend requise  
> **Priorité** : Critique pour UX vendeur

---

## 📋 Vue d'ensemble

Le backend supporte maintenant **2 workflows de publication distincts** basés sur le choix initial du vendeur lors de la création du produit.

### 🔄 Les 2 Workflows

| Workflow | Choix vendeur | Backend `forcedStatus` | Comportement |
|----------|---------------|------------------------|--------------|
| **AUTO-PUBLISH** | "Publier automatiquement" | `PENDING` | Publication immédiate après validation design |
| **MANUAL-PUBLISH** | "Mettre en brouillon" | `DRAFT` | Validation design → brouillon validé → clic vendeur requis |

---

## 🎨 Interface Utilisateur Requise

### 1️⃣ Écran Création Produit

**Choix obligatoire avec 2 options radio :**

```jsx
<div className="publication-choice">
  <h3>Workflow de publication</h3>
  
  <label>
    <input 
      type="radio" 
      name="publicationWorkflow" 
      value="auto-publish"
      checked={workflowType === 'auto-publish'}
      onChange={() => setWorkflowType('auto-publish')}
    />
    <strong>📤 Publication automatique</strong>
    <p>Le produit sera publié immédiatement après validation du design par l'admin</p>
  </label>
  
  <label>
    <input 
      type="radio" 
      name="publicationWorkflow" 
      value="manual-publish"
      checked={workflowType === 'manual-publish'}
      onChange={() => setWorkflowType('manual-publish')}
    />
    <strong>📝 Mettre en brouillon</strong>
    <p>Le produit restera en brouillon après validation. Vous pourrez le publier quand vous voulez</p>
  </label>
</div>
```

### 2️⃣ Envoi vers Backend

```tsx
// Mapper le choix frontend vers le backend
const mapWorkflowToForcedStatus = (workflow: string): 'PENDING' | 'DRAFT' => {
  return workflow === 'auto-publish' ? 'PENDING' : 'DRAFT';
};

// Dans la requête de création
const createProductPayload = {
  // ... autres données ...
  forcedStatus: mapWorkflowToForcedStatus(workflowType),
  // ... autres données ...
};
```

---

## 📊 Affichage Liste Produits

### 🔍 Logique de détection workflow

```tsx
interface ProductDisplayLogic {
  status: 'PUBLISHED' | 'PENDING' | 'DRAFT';
  forcedStatus: 'PENDING' | 'DRAFT';
  isValidated: boolean;
  designValidationStatus: 'PENDING' | 'VALIDATED' | 'REJECTED';
}

const getProductDisplay = (product: ProductDisplayLogic) => {
  // 1️⃣ Déterminer le workflow original
  const workflowType = product.forcedStatus === 'PENDING' ? 'AUTO_PUBLISH' : 'MANUAL_PUBLISH';
  
  // 2️⃣ Status badge affiché
  const displayStatus = product.status; // PUBLISHED, PENDING, ou DRAFT
  
  // 3️⃣ Bouton "Publier maintenant" visible
  const showPublishButton = (
    product.forcedStatus === 'DRAFT' && 
    product.isValidated === true &&
    product.status === 'DRAFT'
  );
  
  // 4️⃣ Message workflow
  const workflowMessage = workflowType === 'AUTO_PUBLISH' 
    ? "Workflow AUTO-PUBLISH activé" 
    : "Workflow MANUEL - Clic requis pour publier";
    
  return {
    workflowType,
    displayStatus,
    showPublishButton,
    workflowMessage
  };
};
```

### 🎨 Composant Produit

```tsx
const ProductCard = ({ product }) => {
  const display = getProductDisplay(product);
  
  return (
    <div className="product-card">
      {/* Status Badge */}
      <div className={`status-badge status-${display.displayStatus.toLowerCase()}`}>
        {display.displayStatus === 'PUBLISHED' && '🚀 Publié'}
        {display.displayStatus === 'PENDING' && '⏳ En attente'}
        {display.displayStatus === 'DRAFT' && '📝 Brouillon'}
      </div>
      
      {/* Workflow Indicator */}
      <div className="workflow-info">
        <span className={`workflow-type ${display.workflowType.toLowerCase()}`}>
          {display.workflowMessage}
        </span>
        
        {/* Validation Status */}
        {product.designValidationStatus === 'PENDING' && (
          <span className="validation-pending">🔍 Design en cours de validation</span>
        )}
        {product.designValidationStatus === 'VALIDATED' && (
          <span className="validation-success">✅ Design validé</span>
        )}
        {product.designValidationStatus === 'REJECTED' && (
          <span className="validation-rejected">❌ Design rejeté</span>
        )}
      </div>
      
      {/* Actions */}
      <div className="product-actions">
        {display.showPublishButton && (
          <button 
            className="btn-publish-now"
            onClick={() => publishProduct(product.id)}
          >
            📤 Publier maintenant
          </button>
        )}
        
        <button className="btn-edit">✏️ Modifier</button>
        <button className="btn-delete">🗑️ Supprimer</button>
      </div>
    </div>
  );
};
```

---

## 🎯 Scénarios d'Usage Détaillés

### 📤 Scenario AUTO-PUBLISH

**1. Création produit**
- Vendeur choisit "Publication automatique"
- Frontend envoie `forcedStatus: "PENDING"`
- Backend : `status: DRAFT`, `forcedStatus: PENDING`

**2. Soumission validation**
- Backend : `status: PENDING`, `forcedStatus: PENDING`
- Frontend affiche : "Status: PENDING | Workflow AUTO-PUBLISH | Bouton: Caché"

**3. Admin valide design**
- Backend : `status: PUBLISHED`, `forcedStatus: PENDING`, `isValidated: true`
- Frontend affiche : "Status: PUBLISHED | Workflow AUTO-PUBLISH | Bouton: Caché"

### 📝 Scenario MANUAL-PUBLISH

**1. Création produit**
- Vendeur choisit "Mettre en brouillon"
- Frontend envoie `forcedStatus: "DRAFT"`
- Backend : `status: DRAFT`, `forcedStatus: DRAFT`

**2. Soumission validation**
- Backend : `status: DRAFT`, `forcedStatus: DRAFT` (inchangé !)
- Frontend affiche : "Status: DRAFT | Workflow MANUEL | Bouton: Caché"

**3. Admin valide design**
- Backend : `status: DRAFT`, `forcedStatus: DRAFT`, `isValidated: true`
- Frontend affiche : "Status: DRAFT | Workflow MANUEL | Bouton: VISIBLE"

**4. Vendeur clique "Publier"**
- Frontend appelle endpoint de publication manuelle
- Backend : `status: PUBLISHED`
- Frontend affiche : "Status: PUBLISHED | Workflow MANUEL | Bouton: Caché"

---

## 🔧 Endpoints Backend à Utiliser

### 📤 Publication manuelle (nouveau endpoint requis)

```typescript
// Endpoint pour publication manuelle des brouillons validés
POST /api/vendor-products/{id}/publish

// Request body (optionnel)
{}

// Response
{
  "success": true,
  "message": "Produit publié avec succès",
  "product": {
    "id": 123,
    "status": "PUBLISHED",
    "forcedStatus": "DRAFT",
    "isValidated": true,
    "publishedAt": "2024-12-01T10:00:00Z"
  }
}
```

### 📊 Récupération produits

```typescript
// Endpoint existant
GET /api/vendor-products

// Response inclut maintenant forcedStatus
{
  "products": [
    {
      "id": 123,
      "status": "DRAFT",
      "forcedStatus": "DRAFT",  // 🆕 NOUVEAU CHAMP
      "isValidated": true,
      "designValidationStatus": "VALIDATED"
    }
  ]
}
```

---

## 🎨 CSS Recommandé

```scss
.product-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 16px;
  margin: 8px 0;
  
  .status-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 16px;
    font-size: 12px;
    font-weight: bold;
    margin-bottom: 8px;
    
    &.status-published {
      background: #e7f5e7;
      color: #2d7d2d;
    }
    
    &.status-pending {
      background: #fff3cd;
      color: #856404;
    }
    
    &.status-draft {
      background: #f8f9fa;
      color: #6c757d;
      border: 1px dashed #6c757d;
    }
  }
  
  .workflow-info {
    margin: 8px 0;
    font-size: 14px;
    
    .workflow-type {
      display: block;
      margin-bottom: 4px;
      
      &.auto_publish {
        color: #28a745;
        font-weight: 500;
      }
      
      &.manual_publish {
        color: #6f42c1;
        font-weight: 500;
      }
    }
    
    .validation-pending { color: #ffc107; }
    .validation-success { color: #28a745; }
    .validation-rejected { color: #dc3545; }
  }
  
  .btn-publish-now {
    background: #28a745;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: 500;
    
    &:hover {
      background: #218838;
    }
  }
}

.publication-choice {
  margin: 20px 0;
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 8px;
  
  label {
    display: block;
    margin: 12px 0;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    cursor: pointer;
    
    &:hover {
      background: #f8f9fa;
    }
    
    input[type="radio"] {
      margin-right: 8px;
    }
    
    strong {
      display: block;
      margin-bottom: 4px;
    }
    
    p {
      margin: 0;
      font-size: 14px;
      color: #6c757d;
    }
  }
}
```

---

## 📋 Checklist Implémentation

### ✅ Écran Création Produit
- [ ] Ajout choix workflow (radio buttons)
- [ ] Mapping `workflowType` → `forcedStatus`
- [ ] Envoi `forcedStatus` dans payload création
- [ ] Tests création avec les 2 workflows

### ✅ Liste Produits
- [ ] Affichage `forcedStatus` reçu du backend
- [ ] Logique détection workflow (`getProductDisplay`)
- [ ] Badge status dynamique
- [ ] Message workflow affiché
- [ ] Bouton "Publier" conditionnel

### ✅ Actions
- [ ] Endpoint publication manuelle implémenté côté backend
- [ ] Fonction `publishProduct()` côté frontend
- [ ] Gestion états loading/success/error
- [ ] Refresh liste après publication

### ✅ Tests
- [ ] Workflow AUTO-PUBLISH complet
- [ ] Workflow MANUAL-PUBLISH complet
- [ ] Edge cases (design rejeté, etc.)
- [ ] Responsive design

---

## 🚨 Points Critiques

### ⚠️ Ne pas confondre
- **`status`** = État actuel du produit (PUBLISHED/PENDING/DRAFT)
- **`forcedStatus`** = Intention initiale du vendeur (PENDING=auto / DRAFT=manuel)

### 🔒 Règles de sécurité
- Seuls les produits avec `forcedStatus: DRAFT` + `isValidated: true` peuvent être publiés manuellement
- Vérifier côté frontend ET backend avant affichage bouton

### 📱 UX Considerations
- Toujours indiquer le workflow choisi initialement
- Message clair quand design en cours de validation
- Feedback immédiat lors de la publication manuelle

---

## 🎉 Résultat Attendu

Après implémentation, les vendeurs auront :

1. **🎯 Contrôle total** sur leurs workflows de publication
2. **👀 Visibilité claire** de l'état de chaque produit
3. **⚡ Action rapide** pour publier les brouillons validés
4. **🔄 Workflow cohérent** de bout en bout

**Le backend est prêt - À vous de jouer côté frontend !** 🚀 