# Guide Frontend Complet - Système de Validation PrintAlma

## 🎯 Vue d'ensemble

Ce guide couvre l'intégration frontend de **TOUS** les systèmes de validation de PrintAlma :
- ✅ **Validation des Designs** (vendeur → admin)
- ✅ **Validation des Produits Admin** (vendeur → admin) 
- ✅ **Validation des Produits Vendeur** (vendeur → admin)

**🍪 Authentification :** Toutes les requêtes utilisent les **HTTP cookies** (pas de tokens Bearer).

## 📋 Workflow Global de Validation

```
🎨 DESIGNS:
Vendeur crée → DRAFT → Soumet → PENDING_VALIDATION → Admin valide → VALIDATED/REJECTED

📦 PRODUITS ADMIN:
Vendeur crée → DRAFT → Soumet → submittedForValidationAt → Admin valide → PUBLISHED/DRAFT

🛍️ PRODUITS VENDEUR:
Vendeur crée → DRAFT → Soumet → submittedForValidationAt → Admin valide → PUBLISHED/DRAFT
```

## 🔗 Endpoints API Complets

### 🎨 **1. VALIDATION DES DESIGNS**

#### Soumettre un Design pour Validation (Vendeur)
```typescript
POST /api/designs/:id/submit-for-validation

// Headers automatiques via cookies
fetch('/api/designs/123/submit-for-validation', {
  method: 'POST',
  credentials: 'include'
})

// Réponse
{
  "success": true,
  "message": "Design soumis pour validation avec succès",
  "data": {
    "id": 123,
    "name": "Logo Moderne",
    "submittedForValidationAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Voir les Designs en Attente (Admin)
```typescript
GET /api/designs/admin/pending?page=1&limit=20&search=logo

fetch('/api/designs/admin/pending?page=1&limit=20', {
  method: 'GET',
  credentials: 'include'
})

// Réponse
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 123,
        "name": "Logo Moderne",
        "category": "LOGO",
        "submittedForValidationAt": "2024-01-15T10:30:00Z",
        "vendor": {
          "id": 456,
          "firstName": "Jean",
          "lastName": "Dupont"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 45,
      "itemsPerPage": 20
    }
  }
}
```

#### Valider un Design (Admin)
```typescript
POST /api/designs/:id/validate

fetch('/api/designs/123/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    approved: true // ou false pour rejeter
    // rejectionReason: "Qualité insuffisante" // obligatoire si approved = false
  })
})

// Réponse
{
  "success": true,
  "message": "Design approuvé avec succès",
  "data": {
    "id": 123,
    "isValidated": true,
    "validatedAt": "2024-01-15T11:00:00Z",
    "validatorName": "Admin User"
  }
}
```

### 📦 **2. VALIDATION DES PRODUITS ADMIN**

#### Soumettre un Produit Admin pour Validation (Vendeur)
```typescript
POST /api/products/:id/submit-for-validation

fetch('/api/products/789/submit-for-validation', {
  method: 'POST',
  credentials: 'include'
})

// Réponse
{
  "success": true,
  "message": "Produit soumis pour validation avec succès",
  "data": {
    "id": 789,
    "name": "T-shirt Premium",
    "submittedForValidationAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Voir les Produits Admin en Attente (Admin)
```typescript
GET /api/products/admin/pending?page=1&limit=20

fetch('/api/products/admin/pending?page=1&limit=20', {
  method: 'GET',
  credentials: 'include'
})

// Réponse
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 789,
        "name": "T-shirt Premium",
        "price": 25000,
        "submittedForValidationAt": "2024-01-15T10:30:00Z",
        "categories": [
          { "id": 1, "name": "Vêtements" }
        ]
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalItems": 25,
      "itemsPerPage": 20
    }
  }
}
```

#### Valider un Produit Admin (Admin)
```typescript
POST /api/products/:id/validate

fetch('/api/products/789/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    approved: true,
    // rejectionReason: "Images de mauvaise qualité" // si approved = false
  })
})
```

### 🛍️ **3. VALIDATION DES PRODUITS VENDEUR**

#### Soumettre un Produit Vendeur pour Validation (Vendeur)
```typescript
POST /api/vendor/products/:id/submit-for-validation

fetch('/api/vendor/products/456/submit-for-validation', {
  method: 'POST',
  credentials: 'include'
})

// Réponse
{
  "success": true,
  "message": "Produit soumis pour validation avec succès",
  "data": {
    "id": 456,
    "vendorName": "T-shirt Personnalisé Rouge",
    "submittedForValidationAt": "2024-01-15T10:30:00Z"
  }
}
```

#### Voir les Produits Vendeur en Attente (Admin)
```typescript
GET /api/vendor/admin/pending-products?page=1&limit=20

fetch('/api/vendor/admin/pending-products?page=1&limit=20', {
  method: 'GET',
  credentials: 'include'
})

// Réponse
{
  "success": true,
  "data": {
    "products": [
      {
        "id": 456,
        "vendorName": "T-shirt Personnalisé Rouge",
        "price": 28000,
        "submittedForValidationAt": "2024-01-15T10:30:00Z",
        "vendor": {
          "id": 123,
          "firstName": "Marie",
          "lastName": "Martin",
          "email": "marie@example.com"
        },
        "baseProduct": {
          "id": 789,
          "name": "T-shirt Base",
          "categories": [
            { "id": 1, "name": "Vêtements" }
          ]
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 4,
      "totalItems": 67,
      "itemsPerPage": 20
    }
  }
}
```

#### Valider un Produit Vendeur (Admin)
```typescript
POST /api/vendor/products/:id/validate

fetch('/api/vendor/products/456/validate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  credentials: 'include',
  body: JSON.stringify({
    approved: false,
    rejectionReason: "Le design n'est pas centré correctement"
  })
})
```

## 💻 Interfaces TypeScript

```typescript
// Enums mis à jour
enum DesignStatus {
  ALL = 'ALL',
  DRAFT = 'DRAFT',
  PENDING = 'PENDING', 
  PUBLISHED = 'PUBLISHED',
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  VALIDATED = 'VALIDATED',
  REJECTED = 'REJECTED'
}

enum ProductStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT'
}

// Interfaces pour les Designs avec validation
interface DesignWithValidation {
  id: number;
  name: string;
  description?: string;
  category: string;
  imageUrl: string;
  price: number;
  
  // Champs de validation
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  
  // Métadonnées
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
  };
  validator?: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

// Interfaces pour les Produits avec validation
interface ProductWithValidation {
  id: number;
  name: string;
  description: string;
  price: number;
  status: ProductStatus;
  
  // Champs de validation
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  
  categories: Array<{
    id: number;
    name: string;
  }>;
}

// Interface pour les Produits Vendeur avec validation
interface VendorProductWithValidation {
  id: number;
  vendorName: string;
  vendorDescription?: string;
  price: number;
  status: ProductStatus;
  
  // Champs de validation
  isValidated: boolean;
  validatedAt?: string;
  validatedBy?: number;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  
  vendor: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
  };
  baseProduct: {
    id: number;
    name: string;
    categories: Array<{
      id: number;
      name: string;
    }>;
  };
}

// Réponses paginées
interface PaginatedResponse<T> {
  success: boolean;
  data: {
    items: T[]; // designs, products, ou autre selon le contexte
    pagination: {
      currentPage: number;
      totalPages: number;
      totalItems: number;
      itemsPerPage: number;
    };
  };
}

// Réponse de validation
interface ValidationResponse {
  success: boolean;
  message: string;
  data: {
    id: number;
    isValidated: boolean;
    validatedAt: string;
    validatorName: string;
  };
}
```

## 🎯 Services Frontend

### Service pour les Designs
```typescript
class DesignValidationService {
  private baseUrl = '/api/designs';

  private getFetchOptions(): RequestInit {
    return {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  // Vendeur : Soumettre un design pour validation
  async submitForValidation(designId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${designId}/submit-for-validation`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Vous devez être connecté');
      }
      throw new Error('Erreur lors de la soumission');
    }

    return response.json();
  }

  // Admin : Récupérer les designs en attente
  async getPendingDesigns(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<DesignWithValidation>> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', params.page.toString());
    if (params.limit) searchParams.set('limit', params.limit.toString());
    if (params.search) searchParams.set('search', params.search);

    const response = await fetch(`${this.baseUrl}/admin/pending?${searchParams}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Accès réservé aux administrateurs');
      }
      throw new Error('Erreur lors du chargement');
    }

    return response.json();
  }

  // Admin : Valider ou rejeter un design
  async validateDesign(
    designId: number, 
    approved: boolean, 
    rejectionReason?: string
  ): Promise<ValidationResponse> {
    const response = await fetch(`${this.baseUrl}/${designId}/validate`, {
      ...this.getFetchOptions(),
      method: 'POST',
      body: JSON.stringify({
        approved,
        ...(rejectionReason && { rejectionReason })
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la validation');
    }

    return response.json();
  }
}
```

### Service pour les Produits Admin
```typescript
class ProductValidationService {
  private baseUrl = '/api/products';

  private getFetchOptions(): RequestInit {
    return {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  // Vendeur : Soumettre un produit pour validation
  async submitForValidation(productId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/${productId}/submit-for-validation`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la soumission');
    }

    return response.json();
  }

  // Admin : Récupérer les produits en attente
  async getPendingProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<ProductWithValidation>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/admin/pending?${searchParams}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement');
    }

    return response.json();
  }

  // Admin : Valider ou rejeter un produit
  async validateProduct(
    productId: number, 
    approved: boolean, 
    rejectionReason?: string
  ): Promise<ValidationResponse> {
    const response = await fetch(`${this.baseUrl}/${productId}/validate`, {
      ...this.getFetchOptions(),
      method: 'POST',
      body: JSON.stringify({
        approved,
        ...(rejectionReason && { rejectionReason })
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la validation');
    }

    return response.json();
  }
}
```

### Service pour les Produits Vendeur
```typescript
class VendorProductValidationService {
  private baseUrl = '/api/vendor';

  private getFetchOptions(): RequestInit {
    return {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      }
    };
  }

  // Vendeur : Soumettre un produit vendeur pour validation
  async submitForValidation(productId: number): Promise<any> {
    const response = await fetch(`${this.baseUrl}/products/${productId}/submit-for-validation`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la soumission');
    }

    return response.json();
  }

  // Admin : Récupérer les produits vendeur en attente
  async getPendingVendorProducts(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<PaginatedResponse<VendorProductWithValidation>> {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        searchParams.set(key, value.toString());
      }
    });

    const response = await fetch(`${this.baseUrl}/admin/pending-products?${searchParams}`, {
      method: 'GET',
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Erreur lors du chargement');
    }

    return response.json();
  }

  // Admin : Valider ou rejeter un produit vendeur
  async validateVendorProduct(
    productId: number, 
    approved: boolean, 
    rejectionReason?: string
  ): Promise<ValidationResponse> {
    const response = await fetch(`${this.baseUrl}/products/${productId}/validate`, {
      ...this.getFetchOptions(),
      method: 'POST',
      body: JSON.stringify({
        approved,
        ...(rejectionReason && { rejectionReason })
      })
    });

    if (!response.ok) {
      throw new Error('Erreur lors de la validation');
    }

    return response.json();
  }
}
```

## 🎨 Composants React

### Composant Vendeur - Mes Designs
```tsx
const VendorDesignsPage: React.FC = () => {
  const [designs, setDesigns] = useState<DesignWithValidation[]>([]);
  const [filter, setFilter] = useState<DesignStatus>(DesignStatus.ALL);
  const [loading, setLoading] = useState(false);
  
  const designService = new DesignValidationService();

  const handleSubmitForValidation = async (designId: number) => {
    try {
      setLoading(true);
      await designService.submitForValidation(designId);
      
      // Rafraîchir la liste
      await fetchDesigns();
      
      alert('Design soumis pour validation avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la soumission');
    } finally {
      setLoading(false);
    }
  };

  const getStatusDisplay = (design: DesignWithValidation) => {
    if (design.submittedForValidationAt && !design.isValidated) {
      return <span className="status pending">En attente de validation</span>;
    }
    if (design.isValidated) {
      return <span className="status approved">Validé ✅</span>;
    }
    if (design.rejectionReason) {
      return <span className="status rejected">Rejeté ❌</span>;
    }
    return <span className="status draft">Brouillon</span>;
  };

  const canSubmit = (design: DesignWithValidation) => {
    return !design.submittedForValidationAt && !design.isValidated;
  };

  return (
    <div className="vendor-designs">
      <h1>Mes Designs</h1>
      
      <div className="filters">
        <select 
          value={filter} 
          onChange={(e) => setFilter(e.target.value as DesignStatus)}
        >
          <option value={DesignStatus.ALL}>Tous</option>
          <option value={DesignStatus.DRAFT}>Brouillons</option>
          <option value={DesignStatus.PENDING_VALIDATION}>En attente</option>
          <option value={DesignStatus.VALIDATED}>Validés</option>
          <option value={DesignStatus.REJECTED}>Rejetés</option>
        </select>
      </div>

      <div className="designs-grid">
        {designs.map(design => (
          <div key={design.id} className="design-card">
            <img src={design.imageUrl} alt={design.name} />
            <h3>{design.name}</h3>
            <p>{design.description}</p>
            <div className="status-section">
              {getStatusDisplay(design)}
            </div>
            
            {design.rejectionReason && (
              <div className="rejection-reason">
                <strong>Raison du rejet :</strong>
                <p>{design.rejectionReason}</p>
              </div>
            )}
            
            <div className="actions">
              {canSubmit(design) && (
                <button 
                  onClick={() => handleSubmitForValidation(design.id)}
                  disabled={loading}
                  className="btn-submit"
                >
                  Soumettre pour validation
                </button>
              )}
              
              <button className="btn-edit">Modifier</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
```

### Composant Admin - Dashboard de Validation
```tsx
const AdminValidationDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'designs' | 'products' | 'vendorProducts'>('designs');
  const [pendingDesigns, setPendingDesigns] = useState<DesignWithValidation[]>([]);
  const [pendingProducts, setPendingProducts] = useState<ProductWithValidation[]>([]);
  const [pendingVendorProducts, setPendingVendorProducts] = useState<VendorProductWithValidation[]>([]);
  
  const designService = new DesignValidationService();
  const productService = new ProductValidationService();
  const vendorProductService = new VendorProductValidationService();

  const handleValidateDesign = async (designId: number, approved: boolean, reason?: string) => {
    try {
      await designService.validateDesign(designId, approved, reason);
      
      // Rafraîchir la liste
      await fetchPendingDesigns();
      
      alert(`Design ${approved ? 'approuvé' : 'rejeté'} avec succès !`);
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la validation');
    }
  };

  const ValidationModal: React.FC<{
    item: any;
    type: 'design' | 'product' | 'vendorProduct';
    onClose: () => void;
  }> = ({ item, type, onClose }) => {
    const [approved, setApproved] = useState<boolean | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');

    const handleSubmit = async () => {
      if (approved === null) return;

      try {
        switch (type) {
          case 'design':
            await designService.validateDesign(item.id, approved, rejectionReason);
            break;
          case 'product':
            await productService.validateProduct(item.id, approved, rejectionReason);
            break;
          case 'vendorProduct':
            await vendorProductService.validateVendorProduct(item.id, approved, rejectionReason);
            break;
        }
        
        onClose();
        // Rafraîchir les données
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    return (
      <div className="modal-overlay">
        <div className="modal">
          <h2>Validation - {item.name || item.vendorName}</h2>
          
          <div className="validation-options">
            <label>
              <input 
                type="radio" 
                name="validation" 
                onChange={() => setApproved(true)}
              />
              Approuver
            </label>
            
            <label>
              <input 
                type="radio" 
                name="validation" 
                onChange={() => setApproved(false)}
              />
              Rejeter
            </label>
          </div>

          {approved === false && (
            <div className="rejection-reason">
              <label>Raison du rejet :</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Expliquez pourquoi vous rejetez cet élément..."
                required
              />
            </div>
          )}

          <div className="modal-actions">
            <button onClick={onClose}>Annuler</button>
            <button 
              onClick={handleSubmit}
              disabled={approved === null || (approved === false && !rejectionReason)}
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="admin-validation-dashboard">
      <h1>Dashboard de Validation</h1>
      
      <div className="tabs">
        <button 
          className={activeTab === 'designs' ? 'active' : ''}
          onClick={() => setActiveTab('designs')}
        >
          Designs ({pendingDesigns.length})
        </button>
        <button 
          className={activeTab === 'products' ? 'active' : ''}
          onClick={() => setActiveTab('products')}
        >
          Produits Admin ({pendingProducts.length})
        </button>
        <button 
          className={activeTab === 'vendorProducts' ? 'active' : ''}
          onClick={() => setActiveTab('vendorProducts')}
        >
          Produits Vendeur ({pendingVendorProducts.length})
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'designs' && (
          <div className="pending-designs">
            {pendingDesigns.map(design => (
              <div key={design.id} className="validation-item">
                <img src={design.imageUrl} alt={design.name} />
                <div className="item-info">
                  <h3>{design.name}</h3>
                  <p>Catégorie: {design.category}</p>
                  <p>Vendeur: {design.vendor.firstName} {design.vendor.lastName}</p>
                  <p>Soumis le: {new Date(design.submittedForValidationAt!).toLocaleDateString()}</p>
                </div>
                <div className="validation-actions">
                  <button 
                    className="btn-approve"
                    onClick={() => handleValidateDesign(design.id, true)}
                  >
                    ✅ Approuver
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => {/* Ouvrir modal de rejet */}}
                  >
                    ❌ Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Contenu similaire pour products et vendorProducts */}
      </div>
    </div>
  );
};
```

## 🎯 Gestion d'État (Redux/Zustand)

### Store Zustand pour la Validation
```typescript
interface ValidationStore {
  // État
  pendingDesigns: DesignWithValidation[];
  pendingProducts: ProductWithValidation[];
  pendingVendorProducts: VendorProductWithValidation[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchPendingDesigns: () => Promise<void>;
  fetchPendingProducts: () => Promise<void>;
  fetchPendingVendorProducts: () => Promise<void>;
  validateDesign: (id: number, approved: boolean, reason?: string) => Promise<void>;
  validateProduct: (id: number, approved: boolean, reason?: string) => Promise<void>;
  validateVendorProduct: (id: number, approved: boolean, reason?: string) => Promise<void>;
  clearError: () => void;
}

const useValidationStore = create<ValidationStore>((set, get) => ({
  // État initial
  pendingDesigns: [],
  pendingProducts: [],
  pendingVendorProducts: [],
  loading: false,
  error: null,

  // Actions
  fetchPendingDesigns: async () => {
    set({ loading: true, error: null });
    try {
      const designService = new DesignValidationService();
      const response = await designService.getPendingDesigns();
      set({ pendingDesigns: response.data.items, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  validateDesign: async (id: number, approved: boolean, reason?: string) => {
    set({ loading: true, error: null });
    try {
      const designService = new DesignValidationService();
      await designService.validateDesign(id, approved, reason);
      
      // Refetch après validation
      await get().fetchPendingDesigns();
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Actions similaires pour products et vendorProducts...
  
  clearError: () => set({ error: null })
}));
```

## 🚀 Navigation et Routes

### Routes pour les Pages de Validation
```typescript
// Routes Vendeur
/vendor/designs              // Liste des designs avec statuts
/vendor/products             // Liste des produits avec statuts
/vendor/products/create      // Création nouveau produit

// Routes Admin
/admin/validation           // Dashboard général
/admin/validation/designs   // Designs en attente
/admin/validation/products  // Produits admin en attente  
/admin/validation/vendor-products // Produits vendeur en attente

// Configuration React Router
const AppRoutes = () => (
  <Routes>
    {/* Routes Vendeur */}
    <Route path="/vendor/designs" element={<VendorDesignsPage />} />
    <Route path="/vendor/products" element={<VendorProductsPage />} />
    
    {/* Routes Admin */}
    <Route path="/admin/validation" element={<AdminValidationDashboard />} />
    
    {/* Routes de redirection pour erreurs d'auth */}
    <Route path="/login" element={<LoginPage />} />
    <Route path="/unauthorized" element={<UnauthorizedPage />} />
  </Routes>
);
```

## 🎨 Styles CSS Suggérés

```css
/* Statuts de validation */
.status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
}

.status.draft { 
  background: #e9ecef; 
  color: #6c757d; 
}

.status.pending { 
  background: #fff3cd; 
  color: #856404; 
}

.status.approved { 
  background: #d4edda; 
  color: #155724; 
}

.status.rejected { 
  background: #f8d7da; 
  color: #721c24; 
}

/* Boutons de validation */
.btn-submit {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-approve {
  background: #28a745;
  color: white;
}

.btn-reject {
  background: #dc3545;
  color: white;
}

/* Layout dashboard admin */
.admin-validation-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.tabs {
  display: flex;
  border-bottom: 2px solid #e9ecef;
  margin-bottom: 20px;
}

.tabs button {
  padding: 12px 24px;
  border: none;
  background: none;
  cursor: pointer;
  border-bottom: 2px solid transparent;
}

.tabs button.active {
  border-bottom-color: #007bff;
  color: #007bff;
  font-weight: 500;
}

/* Items de validation */
.validation-item {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  margin-bottom: 12px;
}

.validation-item img {
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 4px;
  margin-right: 16px;
}

.item-info {
  flex: 1;
  margin-right: 16px;
}

.validation-actions {
  display: flex;
  gap: 8px;
}

/* Modal de validation */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: white;
  padding: 24px;
  border-radius: 8px;
  max-width: 500px;
  width: 90%;
}

.rejection-reason textarea {
  width: 100%;
  min-height: 100px;
  margin-top: 8px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
```

## 📱 Notifications et Feedback

### Toast/Notification System
```typescript
const useNotifications = () => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'info';
    message: string;
  }>>([]);

  const addNotification = (type: 'success' | 'error' | 'info', message: string) => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, type, message }]);
    
    // Auto-remove après 5 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(notif => notif.id !== id));
    }, 5000);
  };

  return { notifications, addNotification };
};

// Usage dans les composants
const { addNotification } = useNotifications();

// Après une validation réussie
addNotification('success', 'Design approuvé avec succès !');

// En cas d'erreur
addNotification('error', 'Erreur lors de la validation');
```

## 🔄 États de Chargement et Erreurs

### Hook personnalisé pour la gestion des états
```typescript
const useAsyncOperation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await operation();
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, execute, clearError: () => setError(null) };
};

// Usage
const MyComponent = () => {
  const { loading, error, execute } = useAsyncOperation();
  
  const handleSubmit = async () => {
    await execute(async () => {
      await designService.submitForValidation(designId);
      // Succès automatiquement géré
    });
  };

  return (
    <div>
      {loading && <LoadingSpinner />}
      {error && <ErrorMessage message={error} />}
      <button onClick={handleSubmit} disabled={loading}>
        Soumettre
      </button>
    </div>
  );
};
```

## 🔧 Utilitaires et Helpers

### Fonctions utilitaires
```typescript
// Formatage des dates
export const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

// Vérification des permissions
export const canValidate = (userRole: string) => {
  return ['ADMIN', 'SUPERADMIN'].includes(userRole);
};

// Statut displayName
export const getStatusDisplayName = (status: string) => {
  const statusMap = {
    'DRAFT': 'Brouillon',
    'PENDING_VALIDATION': 'En attente',
    'VALIDATED': 'Validé',
    'REJECTED': 'Rejeté',
    'PUBLISHED': 'Publié'
  };
  return statusMap[status] || status;
};

// Badge de couleur pour statut
export const getStatusBadgeColor = (status: string) => {
  const colorMap = {
    'DRAFT': 'gray',
    'PENDING_VALIDATION': 'yellow',
    'VALIDATED': 'green',
    'REJECTED': 'red',
    'PUBLISHED': 'blue'
  };
  return colorMap[status] || 'gray';
};
```

## 🎯 Points Clés à Retenir

### ✅ **Authentification**
- Toutes les requêtes utilisent `credentials: 'include'`
- Redirection automatique vers `/login` si 401
- Redirection vers `/unauthorized` si 403

### ✅ **Gestion d'Erreurs**
- Vérifier les codes de statut HTTP
- Messages d'erreur explicites pour l'utilisateur
- Fallback gracieux en cas d'échec

### ✅ **UX/UI**
- Indicateurs de chargement pendant les opérations
- Confirmations avant les actions destructives
- Feedback visuel immédiat après les actions

### ✅ **Performance**
- Pagination sur toutes les listes
- Debounce sur les champs de recherche
- Cache des données quand possible

### ✅ **Sécurité**
- Validation côté client ET serveur
- Vérification des rôles avant affichage
- Sanitisation des données utilisateur

## 🚀 Démarrage Rapide

1. **Copier les services** dans votre projet
2. **Adapter les interfaces** selon vos besoins
3. **Intégrer les composants** dans votre routing
4. **Tester les endpoints** avec vos cookies d'authentification
5. **Personnaliser les styles** selon votre design system

Ce système vous donne un contrôle total sur tous les contenus créés par les vendeurs avant publication ! 🎉 