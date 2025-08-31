# 👥 API Vendeurs - Documentation Frontend

## 📋 Vue d'ensemble

Ces endpoints permettent aux **utilisateurs authentifiés** de voir la liste des autres vendeurs de la plateforme et d'obtenir des statistiques sur la communauté.

**Base URL**: `http://localhost:3004`  
**Important**: Toujours ajouter `credentials: 'include'` !

---

## 🚀 Endpoints Disponibles

### 1. Liste des Vendeurs Actifs
```http
GET /auth/vendors
```
**Permission**: Utilisateur authentifié  
**Description**: Récupère la liste de tous les vendeurs actifs (sauf l'utilisateur connecté)

### 2. Statistiques des Vendeurs
```http
GET /auth/vendors/stats
```
**Permission**: Utilisateur authentifié  
**Description**: Statistiques par type de vendeur avec compteurs

---

## 💻 Implémentation Frontend

### 1. Service JavaScript/TypeScript

```typescript
// services/vendorService.js
class VendorService {
  constructor() {
    this.baseUrl = 'http://localhost:3004/auth';
  }

  async listVendors() {
    const response = await fetch(`${this.baseUrl}/vendors`, {
      method: 'GET',
      credentials: 'include' // ⭐ OBLIGATOIRE
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du chargement des vendeurs');
    }

    return response.json();
  }

  async getStats() {
    const response = await fetch(`${this.baseUrl}/vendors/stats`, {
      method: 'GET',
      credentials: 'include' // ⭐ OBLIGATOIRE
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur lors du chargement des statistiques');
    }

    return response.json();
  }
}

// Export pour utilisation
const vendorService = new VendorService();
export default vendorService;
```

### 2. Utilisation avec Async/Await

```javascript
// Exemple d'utilisation
async function loadVendorsData() {
  try {
    // Charger la liste des vendeurs
    const vendorsData = await vendorService.listVendors();
    console.log('Vendeurs:', vendorsData.vendors);
    console.log('Total:', vendorsData.total);

    // Charger les statistiques
    const statsData = await vendorService.getStats();
    console.log('Statistiques:', statsData.stats);

  } catch (error) {
    console.error('Erreur:', error.message);
    alert('Impossible de charger les données des vendeurs');
  }
}
```

### 3. Avec Promises

```javascript
// Alternative avec .then()
vendorService.listVendors()
  .then(data => {
    console.log('Vendeurs chargés:', data.vendors);
    displayVendors(data.vendors);
  })
  .catch(error => {
    console.error('Erreur:', error);
    showErrorMessage(error.message);
  });
```

---

## 📊 Réponses API

### Réponse `/auth/vendors`

```json
{
  "vendors": [
    {
      "id": 15,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean.dupont@gmail.com",
      "vendeur_type": "DESIGNER",
      "created_at": "2024-01-15T10:30:00.000Z",
      "last_login_at": "2024-01-16T09:15:00.000Z"
    },
    {
      "id": 16,
      "firstName": "Marie",
      "lastName": "Martin",
      "email": "marie.martin@gmail.com",
      "vendeur_type": "INFLUENCEUR",
      "created_at": "2024-01-10T08:00:00.000Z",
      "last_login_at": "2024-01-14T15:45:00.000Z"
    },
    {
      "id": 17,
      "firstName": "Paul",
      "lastName": "Artiste",
      "email": "paul.artiste@gmail.com",
      "vendeur_type": "ARTISTE",
      "created_at": "2024-01-12T14:20:00.000Z",
      "last_login_at": null
    }
  ],
  "total": 3,
  "message": "3 vendeurs trouvés"
}
```

### Réponse `/auth/vendors/stats`

```json
{
  "stats": [
    {
      "type": "DESIGNER",
      "count": 5,
      "label": "Designer",
      "icon": "🎨"
    },
    {
      "type": "INFLUENCEUR",
      "count": 3,
      "label": "Influenceur", 
      "icon": "📱"
    },
    {
      "type": "ARTISTE",
      "count": 2,
      "label": "Artiste",
      "icon": "🎭"
    }
  ],
  "total": 10,
  "message": "Statistiques de 10 vendeurs actifs"
}
```

---

## 🎨 Exemples d'Interface UI

### 1. Composant React - Liste des Vendeurs

```jsx
// VendorsList.jsx
import React, { useState, useEffect } from 'react';
import vendorService from '../services/vendorService';

function VendorsList() {
  const [vendors, setVendors] = useState([]);
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [vendorsResponse, statsResponse] = await Promise.all([
        vendorService.listVendors(),
        vendorService.getStats()
      ]);
      
      setVendors(vendorsResponse.vendors);
      setStats(statsResponse.stats);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais connecté';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  if (loading) return <div>Chargement des vendeurs...</div>;
  if (error) return <div className="error">Erreur: {error}</div>;

  return (
    <div className="vendors-container">
      {/* Statistiques */}
      <div className="stats-section">
        <h3>Statistiques de la Communauté</h3>
        <div className="stats-grid">
          {stats.map(stat => (
            <div key={stat.type} className="stat-card">
              <span className="stat-icon">{stat.icon}</span>
              <div>
                <div className="stat-count">{stat.count}</div>
                <div className="stat-label">{stat.label}s</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Liste des vendeurs */}
      <div className="vendors-section">
        <h3>Vendeurs de la Plateforme ({vendors.length})</h3>
        <div className="vendors-grid">
          {vendors.map(vendor => (
            <div key={vendor.id} className="vendor-card">
              <div className="vendor-header">
                <h4>{vendor.firstName} {vendor.lastName}</h4>
                <span className="vendor-type">
                  {getVendorIcon(vendor.vendeur_type)} {getVendorLabel(vendor.vendeur_type)}
                </span>
              </div>
              
              <div className="vendor-info">
                <p><strong>Email:</strong> {vendor.email}</p>
                <p><strong>Inscrit le:</strong> {formatDate(vendor.created_at)}</p>
                <p><strong>Dernière connexion:</strong> {formatDate(vendor.last_login_at)}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Fonctions utilitaires
function getVendorIcon(type) {
  const icons = {
    'DESIGNER': '🎨',
    'INFLUENCEUR': '📱',
    'ARTISTE': '🎭'
  };
  return icons[type] || '👤';
}

function getVendorLabel(type) {
  const labels = {
    'DESIGNER': 'Designer',
    'INFLUENCEUR': 'Influenceur',
    'ARTISTE': 'Artiste'
  };
  return labels[type] || type;
}

export default VendorsList;
```

### 2. Version Vanilla JavaScript

```html
<!-- vendors.html -->
<!DOCTYPE html>
<html>
<head>
    <title>Vendeurs PrintAlma</title>
    <style>
        .vendors-container { padding: 20px; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin: 20px 0; }
        .stat-card { background: #f8f9fa; padding: 15px; border-radius: 8px; display: flex; align-items: center; }
        .stat-icon { font-size: 2rem; margin-right: 10px; }
        .stat-count { font-size: 1.5rem; font-weight: bold; color: #007bff; }
        .vendors-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .vendor-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; background: white; }
        .vendor-header { display: flex; justify-content: space-between; margin-bottom: 10px; }
        .vendor-type { background: #e9ecef; padding: 5px 10px; border-radius: 15px; font-size: 0.9rem; }
        .error { background: #f8d7da; color: #721c24; padding: 10px; border-radius: 4px; }
        .loading { text-align: center; padding: 20px; }
    </style>
</head>
<body>
    <div id="app">
        <div class="loading">Chargement...</div>
    </div>

    <script>
        // Service API
        class VendorService {
            constructor() {
                this.baseUrl = 'http://localhost:3004/auth';
            }

            async listVendors() {
                const response = await fetch(`${this.baseUrl}/vendors`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Erreur chargement vendeurs');
                return response.json();
            }

            async getStats() {
                const response = await fetch(`${this.baseUrl}/vendors/stats`, {
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Erreur chargement statistiques');
                return response.json();
            }
        }

        // Application principale
        class VendorsApp {
            constructor() {
                this.vendorService = new VendorService();
                this.appElement = document.getElementById('app');
                this.init();
            }

            async init() {
                try {
                    const [vendorsData, statsData] = await Promise.all([
                        this.vendorService.listVendors(),
                        this.vendorService.getStats()
                    ]);

                    this.render(vendorsData, statsData);
                } catch (error) {
                    this.renderError(error.message);
                }
            }

            render(vendorsData, statsData) {
                this.appElement.innerHTML = `
                    <div class="vendors-container">
                        <h2>Communauté PrintAlma</h2>
                        
                        <!-- Statistiques -->
                        <h3>Statistiques</h3>
                        <div class="stats-grid">
                            ${statsData.stats.map(stat => `
                                <div class="stat-card">
                                    <span class="stat-icon">${stat.icon}</span>
                                    <div>
                                        <div class="stat-count">${stat.count}</div>
                                        <div class="stat-label">${stat.label}s</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>

                        <!-- Vendeurs -->
                        <h3>Vendeurs (${vendorsData.total})</h3>
                        <div class="vendors-grid">
                            ${vendorsData.vendors.map(vendor => `
                                <div class="vendor-card">
                                    <div class="vendor-header">
                                        <h4>${vendor.firstName} ${vendor.lastName}</h4>
                                        <span class="vendor-type">
                                            ${this.getVendorIcon(vendor.vendeur_type)} ${this.getVendorLabel(vendor.vendeur_type)}
                                        </span>
                                    </div>
                                    <div class="vendor-info">
                                        <p><strong>Email:</strong> ${vendor.email}</p>
                                        <p><strong>Inscrit:</strong> ${this.formatDate(vendor.created_at)}</p>
                                        <p><strong>Dernière connexion:</strong> ${this.formatDate(vendor.last_login_at)}</p>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            }

            renderError(message) {
                this.appElement.innerHTML = `
                    <div class="error">
                        <strong>Erreur:</strong> ${message}
                    </div>
                `;
            }

            getVendorIcon(type) {
                const icons = { 'DESIGNER': '🎨', 'INFLUENCEUR': '📱', 'ARTISTE': '🎭' };
                return icons[type] || '👤';
            }

            getVendorLabel(type) {
                const labels = { 'DESIGNER': 'Designer', 'INFLUENCEUR': 'Influenceur', 'ARTISTE': 'Artiste' };
                return labels[type] || type;
            }

            formatDate(dateString) {
                if (!dateString) return 'Jamais connecté';
                return new Date(dateString).toLocaleDateString('fr-FR');
            }
        }

        // Initialiser l'application
        new VendorsApp();
    </script>
</body>
</html>
```

---

## 🔧 Gestion des Erreurs

### Codes d'erreur possibles

| Code | Description | Action Frontend |
|------|-------------|-----------------|
| `401` | Non authentifié | Rediriger vers login |
| `403` | Permissions insuffisantes | Afficher message d'erreur |
| `500` | Erreur serveur | Réessayer plus tard |

### Exemple de gestion d'erreurs

```javascript
async function handleVendorRequest() {
  try {
    const data = await vendorService.listVendors();
    return data;
  } catch (error) {
    // Gestion spécifique selon le type d'erreur
    if (error.message.includes('401')) {
      // Redirection vers login
      window.location.href = '/login';
    } else if (error.message.includes('403')) {
      // Permissions insuffisantes
      alert('Vous n\'avez pas accès à cette fonctionnalité');
    } else {
      // Erreur générale
      console.error('Erreur vendeurs:', error);
      alert('Erreur lors du chargement des vendeurs');
    }
  }
}
```

---

## 🎯 Types de Vendeurs

| Type | Icône | Label | Description |
|------|-------|--------|-------------|
| `DESIGNER` | 🎨 | Designer | Création de designs graphiques |
| `INFLUENCEUR` | 📱 | Influenceur | Marketing via réseaux sociaux |
| `ARTISTE` | 🎭 | Artiste | Créations artistiques originales |

---

## ⚠️ Points Importants

1. **Authentification Obligatoire**: Ces endpoints nécessitent une connexion
2. **Cookies Automatiques**: Toujours `credentials: 'include'`
3. **Exclusion Automatique**: L'utilisateur connecté n'apparaît pas dans sa propre liste
4. **Vendeurs Actifs Uniquement**: Seuls les comptes actifs sont visibles
5. **Données en Temps Réel**: Les statistiques se mettent à jour automatiquement

---

## 📞 Support

- **Endpoints**: `/auth/vendors` et `/auth/vendors/stats`
- **Documentation complète**: Voir `API_ENDPOINTS_REFERENCE.md`
- **Base URL**: `http://localhost:3004`

**Votre interface vendeurs est prête ! 🚀👥** 