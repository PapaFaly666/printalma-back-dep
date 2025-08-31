# 🎨 Frontend - Mise à jour Gestion des Designs

## 📋 Résumé des changements

Le backend a été étendu pour gérer les **designs appliqués aux produits**, permettant de distinguer les **produits vierges** (sans design) des **produits avec design**. Cette mise à jour ajoute de nouvelles fonctionnalités API et modifie les réponses existantes.

## 🔄 Changements dans les réponses API existantes

### ⚠️ BREAKING CHANGES

Toutes les réponses de produits incluent maintenant **automatiquement** ces nouveaux champs :

```json
{
  "id": 123,
  "name": "T-shirt Premium",
  // ... autres champs existants ...
  "colorVariations": [
    {
      "id": 1,
      "name": "Blanc",
      "colorCode": "#FFFFFF",
      "images": [
        {
          "id": 1,
          "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/tshirt-blanc-front.jpg",
          "view": "Front",
          // 🆕 NOUVEAUX CHAMPS DESIGN
          "designUrl": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/designs/logo.png",
          "designPublicId": "designs/logo_abc123",
          "designFileName": "logo-entreprise.png",
          "designUploadDate": "2024-01-15T10:30:00Z",
          // ... autres champs existants ...
        }
      ]
    }
  ],
  // 🆕 NOUVEAUX CHAMPS CALCULÉS AUTOMATIQUEMENT
  "hasDesign": true,        // true si au moins une image a un design
  "designCount": 2          // nombre total de designs sur le produit
}
```

### Endpoints affectés :
- `GET /api/products` ✅ Mis à jour
- `GET /api/products/:id` ✅ Mis à jour
- `POST /api/products` ✅ Mis à jour (retourne les nouveaux champs)

## 🆕 Nouveaux endpoints API

### 1. Upload de design sur une image

```javascript
// POST /api/products/{productId}/colors/{colorId}/images/{imageId}/design
const uploadDesign = async (productId, colorId, imageId, designFile, options = {}) => {
  const formData = new FormData();
  formData.append('design', designFile);
  
  // Options facultatives
  if (options.name) formData.append('name', options.name);
  if (options.replaceExisting !== undefined) {
    formData.append('replaceExisting', options.replaceExisting.toString());
  }

  try {
    const response = await fetch(
      `/api/products/${productId}/colors/${colorId}/images/${imageId}/design`,
      {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de l\'upload');
    }

    return result;
    // Retourne: { success: true, designUrl: "...", designFileName: "...", message: "..." }
  } catch (error) {
    console.error('Erreur upload design:', error);
    throw error;
  }
};

// Exemple d'utilisation
const handleDesignUpload = async (file) => {
  try {
    const result = await uploadDesign(123, 1, 5, file, {
      name: 'Logo personnalisé',
      replaceExisting: true
    });
    
    console.log('Design uploadé avec succès:', result.designUrl);
    // Recharger les données du produit pour voir le design
    await refreshProductData();
  } catch (error) {
    alert('Erreur: ' + error.message);
  }
};
```

### 2. Suppression de design

```javascript
// DELETE /api/products/{productId}/colors/{colorId}/images/{imageId}/design
const deleteDesign = async (productId, colorId, imageId) => {
  try {
    const response = await fetch(
      `/api/products/${productId}/colors/${colorId}/images/${imageId}/design`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${getAuthToken()}`
        }
      }
    );

    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la suppression');
    }

    return result;
    // Retourne: { success: true, message: "Design supprimé avec succès" }
  } catch (error) {
    console.error('Erreur suppression design:', error);
    throw error;
  }
};
```

### 3. Récupération des produits vierges

```javascript
// GET /api/products/blank
const getBlankProducts = async (filters = {}) => {
  const params = new URLSearchParams({
    status: filters.status || 'published',
    limit: filters.limit?.toString() || '20',
    offset: filters.offset?.toString() || '0',
    ...(filters.search && { search: filters.search })
  });

  try {
    const response = await fetch(`/api/products/blank?${params}`);
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la récupération');
    }

    return result;
    // Retourne: { success: true, data: [...], pagination: {...} }
  } catch (error) {
    console.error('Erreur récupération produits vierges:', error);
    throw error;
  }
};

// Exemple d'utilisation avec pagination
const [blankProducts, setBlankProducts] = useState([]);
const [pagination, setPagination] = useState({ offset: 0, limit: 20 });

const loadBlankProducts = async () => {
  try {
    const result = await getBlankProducts({
      status: 'published',
      limit: pagination.limit,
      offset: pagination.offset,
      search: searchTerm
    });
    
    setBlankProducts(result.data);
    setPagination(prev => ({ ...prev, total: result.pagination.total }));
  } catch (error) {
    console.error('Erreur chargement:', error);
  }
};
```

### 4. Statistiques des designs

```javascript
// GET /api/products/design-stats
const getDesignStats = async () => {
  try {
    const response = await fetch('/api/products/design-stats');
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.message || 'Erreur lors de la récupération des stats');
    }

    return result.stats;
    // Retourne: { totalProducts: 150, productsWithDesign: 89, blankProducts: 61, ... }
  } catch (error) {
    console.error('Erreur récupération stats:', error);
    throw error;
  }
};
```

## 🎨 Composants React recommandés

### 1. Composant d'upload de design

```jsx
import React, { useState } from 'react';

const DesignUploader = ({ productId, colorId, imageId, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileUpload = async (file) => {
    // Validation côté client
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!allowedTypes.includes(file.type)) {
      alert('Format non supporté. Utilisez PNG, JPG ou SVG.');
      return;
    }

    if (file.size > maxSize) {
      alert('Fichier trop volumineux (max 10MB).');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadDesign(productId, colorId, imageId, file, {
        name: file.name,
        replaceExisting: true
      });
      
      onUploadSuccess && onUploadSuccess(result);
      alert('Design uploadé avec succès !');
    } catch (error) {
      alert('Erreur: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) handleFileUpload(file);
  };

  return (
    <div 
      className={`design-uploader ${dragOver ? 'drag-over' : ''} ${uploading ? 'uploading' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {uploading ? (
        <div className="upload-progress">
          <div className="spinner"></div>
          <p>Upload en cours...</p>
        </div>
      ) : (
        <>
          <div className="upload-icon">📎</div>
          <p>Glissez votre design ici ou</p>
          <label className="file-input-label">
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/jpg,image/svg+xml"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button type="button" className="btn btn-primary">
              Choisir un fichier
            </button>
          </label>
          <small>PNG, JPG, SVG - Max 10MB</small>
        </>
      )}
    </div>
  );
};
```

### 2. Composant ProductCard avec gestion des designs

```jsx
const ProductCard = ({ product, showDesignInfo = true }) => {
  const [showDesignManager, setShowDesignManager] = useState(false);

  const handleDesignUpload = (imageId, result) => {
    // Recharger les données du produit ou mettre à jour l'état local
    console.log('Design uploadé pour image', imageId, result);
    // TODO: Mettre à jour l'état du produit
  };

  const handleDesignDelete = async (colorId, imageId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce design ?')) return;
    
    try {
      await deleteDesign(product.id, colorId, imageId);
      alert('Design supprimé avec succès');
      // TODO: Mettre à jour l'état du produit
    } catch (error) {
      alert('Erreur: ' + error.message);
    }
  };

  return (
    <div className="product-card">
      {/* Header avec badges */}
      <div className="product-header">
        <h3>{product.name}</h3>
        {showDesignInfo && (
          <div className="design-badges">
            {product.hasDesign ? (
              <span className="badge badge-design">
                ✨ {product.designCount} design{product.designCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="badge badge-blank">
                🎨 Produit vierge
              </span>
            )}
          </div>
        )}
      </div>

      {/* Prix et stock */}
      <div className="product-info">
        <p className="price">{product.price.toLocaleString()} FCFA</p>
        <p className="stock">Stock: {product.stock}</p>
      </div>

      {/* Images avec designs */}
      <div className="color-variations">
        {product.colorVariations.map(color => (
          <div key={color.id} className="color-variation">
            <h4>{color.name}</h4>
            <div className="images-grid">
              {color.images.map(image => (
                <div key={image.id} className="image-container">
                  {/* Image de base */}
                  <img 
                    src={image.url} 
                    alt={`${product.name} - ${color.name} - ${image.view}`}
                    className="base-image"
                  />
                  
                  {/* Overlay design si présent */}
                  {image.designUrl && (
                    <div className="design-overlay">
                      <img 
                        src={image.designUrl} 
                        alt="Design"
                        className="design-image"
                      />
                      <div className="design-info">
                        <small>{image.designFileName}</small>
                        <button 
                          className="btn-delete-design"
                          onClick={() => handleDesignDelete(color.id, image.id)}
                          title="Supprimer le design"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Zone d'upload si pas de design */}
                  {!image.designUrl && showDesignManager && (
                    <div className="design-upload-zone">
                      <DesignUploader
                        productId={product.id}
                        colorId={color.id}
                        imageId={image.id}
                        onUploadSuccess={(result) => handleDesignUpload(image.id, result)}
                      />
                    </div>
                  )}
                  
                  <div className="image-meta">
                    <span className="view-name">{image.view}</span>
                    {image.designUrl && (
                      <span className="design-date">
                        {new Date(image.designUploadDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="product-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => setShowDesignManager(!showDesignManager)}
        >
          {showDesignManager ? 'Masquer' : 'Gérer'} les designs
        </button>
      </div>
    </div>
  );
};
```

### 3. Page des produits vierges

```jsx
const BlankProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'published',
    search: '',
    limit: 20,
    offset: 0
  });
  const [pagination, setPagination] = useState({});

  const loadProducts = async () => {
    setLoading(true);
    try {
      const result = await getBlankProducts(filters);
      setProducts(result.data);
      setPagination(result.pagination);
    } catch (error) {
      console.error('Erreur chargement produits vierges:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [filters]);

  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm, offset: 0 }));
  };

  const handlePageChange = (newOffset) => {
    setFilters(prev => ({ ...prev, offset: newOffset }));
  };

  return (
    <div className="blank-products-page">
      <div className="page-header">
        <h1>🎨 Produits Vierges</h1>
        <p>Produits prêts à être personnalisés avec vos designs</p>
      </div>

      {/* Filtres */}
      <div className="filters">
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={filters.search}
          onChange={(e) => handleSearch(e.target.value)}
          className="search-input"
        />
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, offset: 0 }))}
          className="status-filter"
        >
          <option value="all">Tous les statuts</option>
          <option value="published">Publiés</option>
          <option value="draft">Brouillons</option>
        </select>
      </div>

      {/* Résultats */}
      {loading ? (
        <div className="loading">Chargement...</div>
      ) : (
        <>
          <div className="results-info">
            <p>{pagination.total} produit{pagination.total > 1 ? 's' : ''} vierge{pagination.total > 1 ? 's' : ''} trouvé{pagination.total > 1 ? 's' : ''}</p>
          </div>
          
          <div className="products-grid">
            {products.map(product => (
              <ProductCard 
                key={product.id} 
                product={product} 
                showDesignInfo={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination.total > filters.limit && (
            <div className="pagination">
              <button 
                disabled={filters.offset === 0}
                onClick={() => handlePageChange(Math.max(0, filters.offset - filters.limit))}
              >
                Précédent
              </button>
              <span>
                Page {Math.floor(filters.offset / filters.limit) + 1} sur {Math.ceil(pagination.total / filters.limit)}
              </span>
              <button 
                disabled={!pagination.hasNext}
                onClick={() => handlePageChange(filters.offset + filters.limit)}
              >
                Suivant
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
```

### 4. Dashboard des statistiques

```jsx
const DesignStatsDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const data = await getDesignStats();
        setStats(data);
      } catch (error) {
        console.error('Erreur chargement stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div className="loading">Chargement des statistiques...</div>;
  if (!stats) return <div className="error">Erreur de chargement</div>;

  return (
    <div className="design-stats-dashboard">
      <h2>📊 Statistiques des Designs</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{stats.totalProducts}</div>
          <div className="stat-label">Produits total</div>
        </div>
        
        <div className="stat-card highlight">
          <div className="stat-number">{stats.productsWithDesign}</div>
          <div className="stat-label">Avec design</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.blankProducts}</div>
          <div className="stat-label">Produits vierges</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.designPercentage}%</div>
          <div className="stat-label">Taux de design</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.totalDesigns}</div>
          <div className="stat-label">Designs total</div>
        </div>
        
        <div className="stat-card">
          <div className="stat-number">{stats.averageDesignsPerProduct}</div>
          <div className="stat-label">Moyenne/produit</div>
        </div>
      </div>

      {/* Graphique simple */}
      <div className="progress-chart">
        <h3>Répartition des produits</h3>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${stats.designPercentage}%` }}
          ></div>
        </div>
        <div className="progress-labels">
          <span>Avec design ({stats.designPercentage}%)</span>
          <span>Vierges ({(100 - stats.designPercentage).toFixed(1)}%)</span>
        </div>
      </div>
    </div>
  );
};
```

## 🎨 CSS recommandé

```css
/* Styles pour les composants de design */
.design-uploader {
  border: 2px dashed #ddd;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.design-uploader.drag-over {
  border-color: #007bff;
  background-color: #f8f9fa;
}

.design-uploader.uploading {
  border-color: #28a745;
  background-color: #d4edda;
}

.badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
}

.badge-design {
  background-color: #28a745;
  color: white;
}

.badge-blank {
  background-color: #6c757d;
  color: white;
}

.image-container {
  position: relative;
  display: inline-block;
}

.design-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.design-image {
  max-width: 80%;
  max-height: 80%;
  object-fit: contain;
}

.design-info {
  position: absolute;
  bottom: 5px;
  right: 5px;
  background: rgba(0,0,0,0.7);
  color: white;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.7em;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  text-align: center;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #333;
}

.stat-label {
  color: #666;
  margin-top: 5px;
}

.stat-card.highlight {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  margin: 10px 0;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #28a745, #20c997);
  transition: width 0.3s ease;
}
```

## ⚡ Optimisations recommandées

### 1. Cache des images
```javascript
// Précharger les images de design pour une meilleure UX
const preloadDesignImages = (products) => {
  products.forEach(product => {
    product.colorVariations.forEach(color => {
      color.images.forEach(image => {
        if (image.designUrl) {
          const img = new Image();
          img.src = image.designUrl;
        }
      });
    });
  });
};
```

### 2. Lazy loading des designs
```jsx
const LazyDesignImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !loaded) {
          setLoaded(true);
        }
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [loaded]);

  return (
    <div ref={imgRef} className={className}>
      {loaded ? (
        <img src={src} alt={alt} />
      ) : (
        <div className="image-placeholder">Chargement...</div>
      )}
    </div>
  );
};
```

## 🚨 Gestion d'erreurs

### Codes d'erreur à gérer :
- **400** : Fichier invalide, format non supporté
- **404** : Image/produit non trouvé
- **413** : Fichier trop volumineux
- **500** : Erreur serveur

```javascript
const handleApiError = (error, response) => {
  switch (response?.status) {
    case 400:
      return 'Fichier invalide ou format non supporté';
    case 404:
      return 'Produit ou image non trouvé';
    case 413:
      return 'Fichier trop volumineux (max 10MB)';
    default:
      return error.message || 'Une erreur inattendue s\'est produite';
  }
};
```

## 📱 Responsive Design

```css
/* Mobile first pour les composants de design */
@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .images-grid {
    grid-template-columns: 1fr;
  }
  
  .design-uploader {
    padding: 15px;
    font-size: 0.9em;
  }
}

@media (max-width: 480px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-number {
    font-size: 1.5em;
  }
}
```

Cette documentation fournit tout ce dont votre équipe frontend a besoin pour implémenter la gestion des designs. Les exemples sont prêts à l'emploi et couvrent tous les cas d'usage principaux. 