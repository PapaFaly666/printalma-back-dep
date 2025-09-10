# Guide Frontend - Affichage Commission Vendeur

## Vue d'ensemble
Ce guide explique comment afficher la commission définie par l'admin dans l'interface vendeur.

## Endpoint API Disponible

### Récupérer la commission du vendeur connecté
```
GET /vendors/c
Authorization: Bearer {token}
```

**Réponse réussie (200):**
```json
{
  "success": true,
  "data": {
    "vendorId": 123,
    "commissionRate": 35.5,
    "lastUpdated": "2024-01-15T10:30:00Z",
    "updatedBy": {
      "firstName": "Admin",
      "lastName": "Principal"
    },
    "defaultRate": 40.0,
    "isCustomRate": true,
    "appliedSince": "2024-01-15T10:30:00Z"
  }
}
```

## Implémentation Frontend

### 1. Service JavaScript/TypeScript

```javascript
// commissionService.js
class CommissionService {
  constructor(apiBaseUrl, tokenProvider) {
    this.baseUrl = apiBaseUrl;
    this.getToken = tokenProvider;
  }

  async getMyCommission() {
    try {
      const response = await fetch(`${this.baseUrl}/vendors/my-commission`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Erreur lors de la récupération');
      }

      return result.data;
    } catch (error) {
      console.error('Erreur récupération commission:', error);
      throw error;
    }
  }
}

// Utilisation
const commissionService = new CommissionService(
  'https://api.printalma.com', 
  () => localStorage.getItem('authToken')
);
```

### 2. Composant d'affichage de commission

#### React Component
```jsx
import React, { useState, useEffect } from 'react';
import { commissionService } from '../services/commissionService';

const VendorCommissionDisplay = () => {
  const [commission, setCommission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCommission();
  }, []);

  const loadCommission = async () => {
    try {
      setLoading(true);
      const data = await commissionService.getMyCommission();
      setCommission(data);
    } catch (err) {
      setError('Impossible de charger votre commission');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="commission-loading">Chargement...</div>;
  }

  if (error) {
    return <div className="commission-error">{error}</div>;
  }

  return (
    <div className="vendor-commission-card">
      <h3>Ma Commission</h3>
      
      <div className="commission-display">
        <div className="commission-rate">
          <span className="rate-value">{commission.commissionRate}%</span>
          {commission.isCustomRate && (
            <span className="custom-badge">Personnalisé</span>
          )}
        </div>
        
        <div className="commission-details">
          <p>Taux par défaut: {commission.defaultRate}%</p>
          
          {commission.lastUpdated && (
            <div className="last-update">
              <p>Dernière modification: {new Date(commission.lastUpdated).toLocaleDateString('fr-FR')}</p>
              {commission.updatedBy && (
                <p>Par: {commission.updatedBy.firstName} {commission.updatedBy.lastName}</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorCommissionDisplay;
```

#### Vue.js Component
```vue
<template>
  <div class="vendor-commission-card">
    <h3>Ma Commission</h3>
    
    <div v-if="loading" class="commission-loading">
      Chargement...
    </div>
    
    <div v-else-if="error" class="commission-error">
      {{ error }}
    </div>
    
    <div v-else class="commission-display">
      <div class="commission-rate">
        <span class="rate-value">{{ commission.commissionRate }}%</span>
        <span v-if="commission.isCustomRate" class="custom-badge">
          Personnalisé
        </span>
      </div>
      
      <div class="commission-details">
        <p>Taux par défaut: {{ commission.defaultRate }}%</p>
        
        <div v-if="commission.lastUpdated" class="last-update">
          <p>Dernière modification: {{ formatDate(commission.lastUpdated) }}</p>
          <p v-if="commission.updatedBy">
            Par: {{ commission.updatedBy.firstName }} {{ commission.updatedBy.lastName }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { commissionService } from '@/services/commissionService';

export default {
  name: 'VendorCommissionDisplay',
  data() {
    return {
      commission: null,
      loading: true,
      error: null
    };
  },
  async mounted() {
    await this.loadCommission();
  },
  methods: {
    async loadCommission() {
      try {
        this.loading = true;
        this.commission = await commissionService.getMyCommission();
      } catch (err) {
        this.error = 'Impossible de charger votre commission';
        console.error(err);
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString('fr-FR');
    }
  }
};
</script>
```

### 3. CSS pour le styling

```css
.vendor-commission-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.vendor-commission-card h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.commission-display {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.commission-rate {
  display: flex;
  align-items: center;
  gap: 10px;
}

.rate-value {
  font-size: 2em;
  font-weight: bold;
  color: #007bff;
}

.custom-badge {
  background: #28a745;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.8em;
  font-weight: bold;
}

.commission-details {
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.commission-details p {
  margin: 5px 0;
  color: #666;
}

.last-update {
  margin-top: 10px;
  font-size: 0.9em;
}

.commission-loading {
  text-align: center;
  padding: 20px;
  color: #666;
}

.commission-error {
  background: #f8d7da;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  border: 1px solid #f5c6cb;
}

/* Responsive */
@media (max-width: 768px) {
  .vendor-commission-card {
    padding: 15px;
  }
  
  .rate-value {
    font-size: 1.5em;
  }
}
```

## Gestion des erreurs

### Codes d'erreur possibles
- **403**: Accès refusé (utilisateur pas vendeur)
- **401**: Token invalide/expiré
- **500**: Erreur serveur

### Exemple de gestion d'erreurs
```javascript
const handleCommissionError = (error, response) => {
  if (response?.status === 403) {
    return 'Accès réservé aux vendeurs';
  }
  if (response?.status === 401) {
    return 'Session expirée, veuillez vous reconnecter';
  }
  return 'Erreur de chargement de la commission';
};
```

## Intégration dans le dashboard vendeur

### Placement recommandé
```jsx
const VendorDashboard = () => {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Tableau de bord</h1>
      </div>
      
      <div className="dashboard-content">
        {/* Commission en haut à droite ou dans une sidebar */}
        <aside className="dashboard-sidebar">
          <VendorCommissionDisplay />
          {/* Autres widgets */}
        </aside>
        
        <main className="dashboard-main">
          {/* Contenu principal */}
        </main>
      </div>
    </div>
  );
};
```

## Fonctionnalités avancées

### 1. Auto-refresh de la commission
```javascript
useEffect(() => {
  const interval = setInterval(() => {
    loadCommission();
  }, 300000); // Refresh toutes les 5 minutes

  return () => clearInterval(interval);
}, []);
```

### 2. Notification de changement
```javascript
const checkForCommissionUpdate = async () => {
  const newCommission = await commissionService.getMyCommission();
  
  if (newCommission.lastUpdated !== commission.lastUpdated) {
    // Afficher une notification
    showNotification('Votre commission a été mise à jour', 'info');
    setCommission(newCommission);
  }
};
```

## Sécurité

### Points importants
1. **Token JWT requis**: Toutes les requêtes nécessitent un token valide
2. **Vérification côté serveur**: L'API vérifie que l'utilisateur est bien un vendeur
3. **Pas d'informations sensibles**: Seules les infos nécessaires sont retournées

## Historique des commissions

### Endpoint pour l'historique
```
GET /vendors/my-commission/history
Authorization: Bearer {token}
```

### Composant d'historique
```jsx
const CommissionHistory = () => {
  const [history, setHistory] = useState([]);
  
  useEffect(() => {
    loadHistory();
  }, []);
  
  const loadHistory = async () => {
    try {
      const response = await fetch('/vendors/my-commission/history', {
        headers: {
          'Authorization': `Bearer ${getToken()}`
        }
      });
      const result = await response.json();
      setHistory(result.data);
    } catch (error) {
      console.error('Erreur chargement historique:', error);
    }
  };
  
  return (
    <div className="commission-history">
      <h4>Historique des modifications</h4>
      {history.map((entry, index) => (
        <div key={index} className="history-entry">
          <span>{entry.oldRate}% → {entry.newRate}%</span>
          <span>{new Date(entry.changedAt).toLocaleDateString()}</span>
          <span>Par: {entry.changedBy}</span>
        </div>
      ))}
    </div>
  );
};
```

## Notes de mise en œuvre

1. **Cache local**: Considérer mettre en cache la commission pour réduire les appels API
2. **Fallback**: Afficher 40% (taux par défaut) si l'API échoue
3. **Loading states**: Toujours gérer les états de chargement
4. **Internationalisation**: Préparer les textes pour la traduction

## Support et maintenance

Pour toute question sur l'implémentation, vérifier:
1. Les logs côté serveur dans `vendor-commission.controller.ts:76`
2. La structure de la réponse API
3. Les permissions JWT du token utilisé