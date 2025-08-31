# Guide Frontend – Validation des Produits (Admin)

Ce mini-guide se concentre UNIQUEMENT sur la partie *produit* du workflow de validation (les designs et produits vendeur sont décrits dans `FRONTEND_COMPLETE_VALIDATION_GUIDE.md`).

---
## 1. Workflow Résumé
```
Vendeur crée un produit (status : DRAFT)
       │
       └──► POST /api/products/:id/submit-for-validation
                └─ back : submittedForValidationAt ≠ null   status : DRAFT

Admin consulte la liste ► GET /api/products/admin/pending
Admin approuve  ───────► POST /api/products/:id/validate { approved: true }
                 └─ back : isValidated = true   status : PUBLISHED

Admin rejette   ───────► POST /api/products/:id/validate { approved: false, rejectionReason }
                 └─ back : isValidated = false  status : DRAFT  rejectionReason renseigné
```

---
## 2. Endpoints Détail

### 2.1  Vendeur – Soumettre un produit
```ts
POST /api/products/:id/submit-for-validation
fetch(`/api/products/${id}/submit-for-validation`, {
  method: 'POST',
  credentials: 'include'
});
```
Réponse :
```json
{
  "success": true,
  "data": {
    "id": 42,
    "name": "Hoodie Premium",
    "submittedForValidationAt": "2025-06-24T12:30:00Z"
  }
}
```

### 2.2  Admin – Voir les produits en attente
```ts
GET /api/products/admin/pending?page=1&limit=20&search=hoodie
```
Structure :
```json
{
  "success": true,
  "data": {
    "products": [ { /* ProductWithValidation */ } ],
    "pagination": { "currentPage":1, "itemsPerPage":20, ... }
  }
}
```

### 2.3  Admin – Valider / Rejeter
```ts
POST /api/products/:id/validate
body = {
  approved: boolean,
  rejectionReason?: string // obligatoire si approved == false
}
```

---
## 3. Interfaces TypeScript essentielles
```ts
export interface ProductWithValidation {
  id: number;
  name: string;
  description: string;
  price: number;
  status: 'PUBLISHED' | 'DRAFT';
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  categories: { id: number; name: string }[];
}
```

---
## 4. Service Frontend prêt à l'emploi
```ts
class ProductValidationService {
  private readonly base = '/api/products';
  private opts(): RequestInit { return { headers:{'Content-Type':'application/json'}, credentials:'include' }; }

  submitForValidation(id:number) {
    return fetch(`${this.base}/${id}/submit-for-validation`, { method:'POST', credentials:'include' })
      .then(r=>r.ok? r.json():Promise.reject(r));
  }

  getPending(params: {page?:number;limit?:number;search?:string;}={}) {
    const q = new URLSearchParams(Object.entries(params).filter(([,v])=>v!==undefined) as any);
    return fetch(`${this.base}/admin/pending?${q}`, { credentials:'include' })
      .then(r=>r.ok? r.json():Promise.reject(r));
  }

  validate(id:number, approved:boolean, rejectionReason?:string) {
    return fetch(`${this.base}/${id}/validate`, {
      ...this.opts(),
      method:'POST',
      body: JSON.stringify({ approved, ...(approved?{}:{rejectionReason}) })
    }).then(r=>r.ok? r.json():Promise.reject(r));
  }
}
export const productValidationService = new ProductValidationService();
```

---
## 5. Exemples de Composants React

### 5.1  Bouton « Soumettre à l'admin » (Vendeur)
```tsx
<button onClick={() => productValidationService.submitForValidation(product.id)}>
  Soumettre pour validation
</button>
```

### 5.2  Dashboard Admin – Carte produit
```tsx
<Card key={p.id}>
  <h3>{p.name}</h3>
  {/* Statuts visuels comme dans le guide complet */}
  <button onClick={()=>productValidationService.validate(p.id,true)}>✅ Approuver</button>
  <button onClick={()=>openRejectModal(p)}>❌ Rejeter</button>
</Card>
```

---
## 6. Styles statut (rappel)
```css
.status.pending { background:#fff3cd;color:#856404; }
.status.approved{ background:#d4edda;color:#155724; }
.status.rejected{ background:#f8d7da;color:#721c24; }
```

---
### 🚀 En intégrant ce service + composants, vous avez le même flux de validation pour les PRODUITS que celui déjà en place pour les designs. 