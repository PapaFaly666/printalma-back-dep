# Guide Frontend - Système de Validation des Designs

## 🎯 Vue d'ensemble

Ce guide explique comment intégrer le nouveau système de validation admin pour les designs dans le frontend. Le système permet aux vendeurs de soumettre leurs designs pour validation et aux admins de les approuver/rejeter avec notifications email automatiques.

**🍪 Note importante :** Ce système utilise l'authentification par **HTTP cookies** (pas de tokens Bearer).

## 📋 Workflow de Validation

```
1. Vendeur crée design → Status: DRAFT
2. Vendeur soumet pour validation → Status: PENDING_VALIDATION  
3. Admin reçoit email de notification
4. Admin approuve/rejette → Status: VALIDATED/REJECTED
5. Vendeur reçoit email de notification du résultat
```

## 🔗 Endpoints API Disponibles

### 1. **Soumettre un Design pour Validation** (Vendeur)
```typescript
POST /api/designs/:id/submit-for-validation

Headers:
Content-Type: application/json
// 🍪 Authentification automatique via cookies

Response 200:
{
  "success": true,
  "message": "Design soumis pour validation avec succès",
  "data": {
    "id": 123,
    "name": "Logo moderne",
    "isPending": true,
    "isDraft": false,
    "submittedForValidationAt": "2024-01-15T10:30:00Z",
    ...
  }
}

Errors:
400 - Design pas en brouillon ou déjà soumis
404 - Design non trouvé
401 - Non authentifié (cookie invalide/expiré)
```

### 2. **Voir les Designs en Attente** (Admin)
```typescript
GET /api/designs/admin/pending?page=1&limit=20&category=logo&search=terme

Headers:
Content-Type: application/json
// 🍪 Authentification automatique via cookies admin

Response 200:
{
  "success": true,
  "data": {
    "designs": [
      {
        "id": 123,
        "name": "Logo moderne",
        "category": "logo",
        "submittedForValidationAt": "2024-01-15T10:30:00Z",
        "vendor": {
          "firstName": "Jean",
          "lastName": "Dupont",
          "email": "jean@example.com"
        },
        ...
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 85,
      "itemsPerPage": 20
    }
  }
}

Query Parameters:
- page: number (optionnel, défaut: 1)
- limit: number (optionnel, défaut: 20)  
- category: string (optionnel)
- search: string (optionnel)
- sortBy: string (optionnel)
- sortOrder: 'asc'|'desc' (optionnel)

Errors:
403 - Accès réservé aux admins
401 - Non authentifié (cookie invalide/expiré)
```

### 3. **Valider/Rejeter un Design** (Admin)
```typescript
POST /api/designs/:id/validate

Headers:
Content-Type: application/json
// 🍪 Authentification automatique via cookies admin

Body:
{
  "approved": true,  // true pour approuver, false pour rejeter
  "rejectionReason": "La qualité de l'image n'est pas suffisante" // obligatoire si approved = false
}

Response 200 (Approbation):
{
  "success": true,
  "message": "Design approuvé avec succès",
  "data": {
    "id": 123,
    "isValidated": true,
    "isPublished": true,
    "validatedAt": "2024-01-15T11:00:00Z",
    "validatorName": "Admin User",
    ...
  }
}

Response 200 (Rejet):
{
  "success": true,
  "message": "Design rejeté avec succès", 
  "data": {
    "id": 123,
    "isValidated": false,
    "rejectionReason": "La qualité de l'image n'est pas suffisante",
    "validatedAt": "2024-01-15T11:00:00Z",
    ...
  }
}

Errors:
400 - Données invalides ou design pas en attente
403 - Accès réservé aux admins
404 - Design non trouvé
401 - Non authentifié (cookie invalide/expiré)
```

## 📊 Nouveaux Statuts de Design

```typescript
enum DesignStatus {
  ALL = 'all',
  DRAFT = 'draft',                    // Brouillon
  PENDING = 'pending',               // En cours (ancien)
  PUBLISHED = 'published',           // Publié
  PENDING_VALIDATION = 'pending_validation',  // En attente de validation
  VALIDATED = 'validated',           // Validé par admin
  REJECTED = 'rejected'              // Rejeté par admin
}
```

## 🎨 Interface TypeScript

```typescript
// Types pour les designs avec validation
interface Design {
  id: number;
  name: string;
  description?: string;
  price: number;
  category: DesignCategory;
  imageUrl: string;
  thumbnailUrl: string;
  
  // Statuts
  isDraft: boolean;
  isPending: boolean;
  isPublished: boolean;
  
  // Champs de validation
  isValidated: boolean;
  validatedAt?: string;
  validatorName?: string;
  rejectionReason?: string;
  submittedForValidationAt?: string;
  
  // Métriques
  views: number;
  likes: number;
  earnings: number;
  usageCount: number;
  tags: string[];
  
  // Dates
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

// Interface pour la soumission de validation
interface ValidationRequest {
  approved: boolean;
  rejectionReason?: string;
}

// Interface pour les designs en attente (admin)
interface PendingDesignsResponse {
  designs: Design[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}
```

## 🔧 Exemples d'Intégration

### 1. **Service Angular/React pour Vendeur** (avec cookies)

```typescript
class VendorDesignService {
  private apiUrl = 'http://localhost:3004/api/designs';
  
  // Configuration fetch avec cookies
  private getFetchOptions(method: string = 'GET', body?: any): RequestInit {
    const options: RequestInit = {
      method,
      credentials: 'include', // 🍪 IMPORTANT: Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    return options;
  }
  
  // Récupérer ses designs avec filtres de statut
  async getMyDesigns(filters: {
    page?: number;
    limit?: number;
    status?: DesignStatus;
    search?: string;
  }): Promise<DesignsListResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    const response = await fetch(`${this.apiUrl}?${params}`, 
      this.getFetchOptions('GET')
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Soumettre un design pour validation
  async submitForValidation(designId: number): Promise<ApiResponse<Design>> {
    const response = await fetch(`${this.apiUrl}/${designId}/submit-for-validation`, 
      this.getFetchOptions('POST')
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### 2. **Service pour Admin** (avec cookies)

```typescript
class AdminDesignService {
  private apiUrl = 'http://localhost:3004/api/designs';
  
  // Configuration fetch avec cookies
  private getFetchOptions(method: string = 'GET', body?: any): RequestInit {
    const options: RequestInit = {
      method,
      credentials: 'include', // 🍪 IMPORTANT: Include cookies
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    if (body) {
      options.body = JSON.stringify(body);
    }
    
    return options;
  }
  
  // Récupérer les designs en attente de validation
  async getPendingDesigns(filters: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }): Promise<PendingDesignsResponse> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });
    
    const response = await fetch(`${this.apiUrl}/admin/pending?${params}`, 
      this.getFetchOptions('GET')
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
  
  // Valider ou rejeter un design
  async validateDesign(designId: number, validation: ValidationRequest): Promise<ApiResponse<Design>> {
    const response = await fetch(`${this.apiUrl}/${designId}/validate`, 
      this.getFetchOptions('POST', validation)
    );
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response.json();
  }
}
```

### 3. **Composant React - Liste des Designs Vendeur**

```jsx
import React, { useState, useEffect } from 'react';

const VendorDesignsList = () => {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState(DesignStatus.ALL);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadDesigns();
  }, [filter]);
  
  const loadDesigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await vendorDesignService.getMyDesigns({ 
        status: filter,
        page: 1,
        limit: 20 
      });
      setDesigns(response.data.designs);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
      
      // Si erreur 401, rediriger vers login
      if (error.message.includes('401')) {
        window.location.href = '/login';
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleSubmitForValidation = async (designId) => {
    try {
      await vendorDesignService.submitForValidation(designId);
      alert('Design soumis pour validation avec succès!');
      loadDesigns(); // Recharger la liste
    } catch (error) {
      if (error.message.includes('401')) {
        window.location.href = '/login';
      } else {
        alert('Erreur lors de la soumission: ' + error.message);
      }
    }
  };
  
  return (
    <div className="designs-list">
      <div className="filters">
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value={DesignStatus.ALL}>Tous</option>
          <option value={DesignStatus.DRAFT}>Brouillons</option>
          <option value={DesignStatus.PENDING_VALIDATION}>En attente de validation</option>
          <option value={DesignStatus.VALIDATED}>Validés</option>
          <option value={DesignStatus.REJECTED}>Rejetés</option>
          <option value={DesignStatus.PUBLISHED}>Publiés</option>
        </select>
      </div>
      
      {error && (
        <div className="error-message">
          <span>Erreur: {error}</span>
          <button onClick={loadDesigns}>Réessayer</button>
        </div>
      )}
      
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="designs-grid">
          {designs.map(design => (
            <div key={design.id} className="design-card">
              <img src={design.thumbnailUrl} alt={design.name} />
              <h3>{design.name}</h3>
              
              <div className="status-badge">
                {getStatusBadge(design)}
              </div>
              
              <div className="actions">
                {design.isDraft && (
                  <button 
                    onClick={() => handleSubmitForValidation(design.id)}
                    className="btn-submit"
                  >
                    Soumettre pour validation
                  </button>
                )}
                
                {design.rejectionReason && (
                  <div className="rejection-reason">
                    <strong>Raison du rejet:</strong>
                    <p>{design.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Helper pour les badges de statut
const getStatusBadge = (design) => {
  if (design.isDraft) return <span className="badge draft">Brouillon</span>;
  if (design.isPending && !design.isValidated) return <span className="badge pending">En attente validation</span>;
  if (design.isValidated && design.isPublished) return <span className="badge published">Publié</span>;
  if (!design.isValidated && design.rejectionReason) return <span className="badge rejected">Rejeté</span>;
  return <span className="badge unknown">Statut inconnu</span>;
};
```

### 4. **Composant Admin - Validation des Designs**

```jsx
import React, { useState, useEffect } from 'react';

const AdminValidationPanel = () => {
  const [pendingDesigns, setPendingDesigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedDesign, setSelectedDesign] = useState(null);
  const [validationForm, setValidationForm] = useState({
    approved: null,
    rejectionReason: ''
  });
  const [error, setError] = useState(null);
  
  useEffect(() => {
    loadPendingDesigns();
  }, []);
  
  const loadPendingDesigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminDesignService.getPendingDesigns({
        page: 1,
        limit: 50
      });
      setPendingDesigns(response.data.designs);
    } catch (error) {
      console.error('Erreur:', error);
      setError(error.message);
      
      // Si erreur 401/403, rediriger vers login admin
      if (error.message.includes('401') || error.message.includes('403')) {
        window.location.href = '/admin/login';
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleValidation = async () => {
    if (!selectedDesign || validationForm.approved === null) return;
    
    try {
      await adminDesignService.validateDesign(selectedDesign.id, {
        approved: validationForm.approved,
        rejectionReason: validationForm.approved ? undefined : validationForm.rejectionReason
      });
      
      alert(validationForm.approved ? 'Design approuvé!' : 'Design rejeté!');
      setSelectedDesign(null);
      setValidationForm({ approved: null, rejectionReason: '' });
      loadPendingDesigns();
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        window.location.href = '/admin/login';
      } else {
        alert('Erreur lors de la validation: ' + error.message);
      }
    }
  };
  
  return (
    <div className="admin-validation">
      <h2>Designs en attente de validation</h2>
      
      {error && (
        <div className="error-message">
          <span>Erreur: {error}</span>
          <button onClick={loadPendingDesigns}>Réessayer</button>
        </div>
      )}
      
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <div className="pending-designs">
          {pendingDesigns.map(design => (
            <div key={design.id} className="pending-design-card">
              <img src={design.imageUrl} alt={design.name} />
              <div className="design-info">
                <h3>{design.name}</h3>
                <p><strong>Vendeur:</strong> {design.vendor.firstName} {design.vendor.lastName}</p>
                <p><strong>Catégorie:</strong> {design.category}</p>
                <p><strong>Soumis le:</strong> {new Date(design.submittedForValidationAt).toLocaleDateString()}</p>
                <p><strong>Prix:</strong> {design.price} FCFA</p>
              </div>
              
              <button 
                onClick={() => setSelectedDesign(design)}
                className="btn-review"
              >
                Examiner
              </button>
            </div>
          ))}
        </div>
      )}
      
      {/* Modal de validation */}
      {selectedDesign && (
        <div className="validation-modal">
          <div className="modal-content">
            <h3>Valider: {selectedDesign.name}</h3>
            <img src={selectedDesign.imageUrl} alt={selectedDesign.name} style={{maxWidth: '300px'}} />
            
            <div className="validation-form">
              <div className="radio-group">
                <label>
                  <input 
                    type="radio" 
                    name="validation" 
                    onChange={() => setValidationForm({...validationForm, approved: true})}
                  />
                  Approuver
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="validation" 
                    onChange={() => setValidationForm({...validationForm, approved: false})}
                  />
                  Rejeter
                </label>
              </div>
              
              {validationForm.approved === false && (
                <textarea
                  placeholder="Raison du rejet (obligatoire)"
                  value={validationForm.rejectionReason}
                  onChange={(e) => setValidationForm({...validationForm, rejectionReason: e.target.value})}
                  required
                />
              )}
              
              <div className="modal-actions">
                <button onClick={() => setSelectedDesign(null)}>Annuler</button>
                <button 
                  onClick={handleValidation}
                  disabled={validationForm.approved === null || (validationForm.approved === false && !validationForm.rejectionReason)}
                >
                  Valider
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🎨 Styles CSS Suggérés

```css
/* Badges de statut */
.badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
}

.badge.draft { background: #e3f2fd; color: #1976d2; }
.badge.pending { background: #fff3e0; color: #f57c00; }
.badge.published { background: #e8f5e8; color: #388e3c; }
.badge.rejected { background: #ffebee; color: #d32f2f; }

/* Boutons */
.btn-submit {
  background: #2196f3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.btn-submit:hover { background: #1976d2; }

/* Messages d'erreur */
.error-message {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  padding: 12px;
  margin: 10px 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.error-message span { color: #d32f2f; }

/* Raison de rejet */
.rejection-reason {
  background: #ffebee;
  border: 1px solid #ffcdd2;
  border-radius: 4px;
  padding: 12px;
  margin-top: 10px;
}

.rejection-reason strong { color: #d32f2f; }
```

## 🚨 Gestion d'Erreurs avec Cookies

```typescript
// Wrapper pour les appels API avec gestion d'erreurs et cookies
const handleApiCall = async (apiCall: () => Promise<any>) => {
  try {
    return await apiCall();
  } catch (error) {
    const errorMessage = error.message || 'Erreur inconnue';
    
    if (errorMessage.includes('401')) {
      // Cookie expiré ou invalide - rediriger vers login
      alert('Session expirée. Veuillez vous reconnecter.');
      window.location.href = '/login';
    } else if (errorMessage.includes('403')) {
      alert('Accès non autorisé pour cette action.');
    } else if (errorMessage.includes('404')) {
      alert('Design non trouvé.');
    } else if (errorMessage.includes('400')) {
      alert('Données invalides ou action non autorisée.');
    } else {
      alert('Erreur réseau. Veuillez réessayer.');
    }
    throw error;
  }
};

// Usage
const submitDesign = () => handleApiCall(() => 
  vendorDesignService.submitForValidation(designId)
);
```

## 🍪 Configuration Cookies - Points Importants

### **1. Configuration fetch avec cookies**
```typescript
// TOUJOURS inclure credentials: 'include'
const fetchOptions = {
  method: 'POST',
  credentials: 'include', // 🍪 Crucial pour l'auth par cookies
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data)
};
```

### **2. Configuration Axios (alternative)**
```typescript
// Si vous utilisez Axios
axios.defaults.withCredentials = true;

// Ou pour chaque requête
axios.post('/api/designs/1/validate', data, {
  withCredentials: true
});
```

### **3. Vérification d'authentification**
```typescript
// Vérifier si l'utilisateur est connecté
const checkAuthStatus = async () => {
  try {
    const response = await fetch('/auth/check', {
      credentials: 'include'
    });
    return response.ok;
  } catch {
    return false;
  }
};
```

## 📧 Notifications Email Automatiques

Le système envoie automatiquement des emails :

### **Pour les Admins** (quand un design est soumis)
- Notification avec détails du design
- Lien vers le panel d'administration
- Informations sur le vendeur

### **Pour les Vendeurs** 
- **Design approuvé** : Félicitations + lien vers dashboard
- **Design rejeté** : Raison du rejet + conseils pour améliorer

## 🔍 Tests et Validation

### Test du Workflow Complet

1. **Se connecter en tant que vendeur** (cookie set)
2. **Créer un design**
3. **Le soumettre pour validation**
4. **Vérifier le changement de statut**
5. **Se déconnecter et se connecter en admin** (nouveau cookie)
6. **Voir le design dans la liste en attente**
7. **L'approuver ou le rejeter**
8. **Vérifier les emails envoyés**

### URLs de Test

- **Frontend Vendeur** : `http://localhost:5174/vendor/designs`
- **Frontend Admin** : `http://localhost:5174/admin/designs/pending`
- **API Swagger** : `http://localhost:3004/api-docs`

## 🚀 Points d'Attention avec Cookies

1. **CORS Configuration** : Vérifier que le backend accepte les cookies cross-origin
2. **SameSite Policy** : Configuration appropriée des cookies
3. **HTTPS en Production** : Cookies sécurisés
4. **Expiration** : Gestion des cookies expirés
5. **Logout** : Nettoyer les cookies côté client ET serveur

## 💡 Améliorations Futures

- **Notifications push en temps réel** (WebSocket avec cookies)
- **Historique des validations**
- **Commentaires sur les rejets**
- **Validation par lot**
- **Statistiques de validation**
- **Auto-refresh des cookies**

Ce guide vous donne tous les éléments nécessaires pour intégrer le système de validation côté frontend avec authentification par cookies. N'hésitez pas si vous avez des questions ! 🎯 