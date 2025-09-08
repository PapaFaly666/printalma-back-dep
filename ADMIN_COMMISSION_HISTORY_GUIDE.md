# 📊 Guide Admin - Historique Modifications Commission

> **Guide pour afficher l'historique des modifications de commission pour les admins**
> 
> Permet aux admins de voir toutes les modifications de commission avec détails

---

## 🎯 Objectif

Permettre aux **admins** de voir l'historique complet de toutes les modifications de commission avec :
- Nom et email du vendeur
- Ancien et nouveau taux
- Qui a effectué la modification
- Date et heure précises
- Type de changement (création/mise à jour)

---

## 🔌 Endpoint Backend Disponible

### GET Historique Global des Modifications

```http
GET /api/admin/commission-history/all
Authorization: Bearer {admin_token}
```

**Réponse:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "vendorId": 123,
      "vendorName": "John Doe",
      "vendorEmail": "john@example.com",
      "oldRate": 40.0,
      "newRate": 35.0,
      "changedAt": "2024-01-15T10:30:00Z",
      "changedBy": "Admin Principal",
      "ipAddress": "192.168.1.1",
      "changeType": "UPDATE",
      "rateDifference": -5.0
    },
    {
      "id": 2,
      "vendorId": 124,
      "vendorName": "Jane Smith",
      "vendorEmail": "jane@example.com",
      "oldRate": null,
      "newRate": 42.0,
      "changedAt": "2024-01-14T14:20:00Z",
      "changedBy": "Admin Principal",
      "ipAddress": "192.168.1.1",
      "changeType": "CREATION",
      "rateDifference": 42.0
    }
  ]
}
```

---

## 🛠️ Implémentation Frontend

### 1. Service pour récupérer l'historique

```javascript
// services/adminCommissionHistoryService.js

import axios from 'axios';

class AdminCommissionHistoryService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token admin
    this.api.interceptors.request.use((config) => {
      const token = this.getAdminToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  getAdminToken() {
    return localStorage.getItem('adminToken') || 
           localStorage.getItem('authToken') ||
           sessionStorage.getItem('authToken');
  }

  /**
   * Récupérer l'historique global des modifications
   */
  async getGlobalCommissionHistory() {
    try {
      const response = await this.api.get('/admin/commission-history/all');
      
      if (response.data.success) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Erreur lors de la récupération');
      }
    } catch (error) {
      console.error('Erreur service historique:', error);
      throw error;
    }
  }

  /**
   * Formater la différence de taux pour affichage
   */
  formatRateDifference(difference) {
    const sign = difference > 0 ? '+' : '';
    return `${sign}${difference.toFixed(1)}%`;
  }

  /**
   * Obtenir la couleur selon le type de changement
   */
  getChangeColor(changeType, rateDifference) {
    if (changeType === 'CREATION') return '#1890ff';
    return rateDifference > 0 ? '#f5222d' : '#52c41a';
  }
}

export default new AdminCommissionHistoryService();
```

---

### 2. Composant Historique Principal

```jsx
// components/admin/CommissionHistoryTable.jsx

import React, { useState, useEffect } from 'react';
import AdminCommissionHistoryService from '../../services/adminCommissionHistoryService';

const CommissionHistoryTable = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await AdminCommissionHistoryService.getGlobalCommissionHistory();
      setHistory(data);
      
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
      console.error('Erreur chargement historique:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(dateString));
  };

  const getChangeIcon = (changeType) => {
    return changeType === 'CREATION' ? '🆕' : '✏️';
  };

  const getChangeStyle = (changeType, rateDifference) => {
    const color = AdminCommissionHistoryService.getChangeColor(changeType, rateDifference);
    return {
      color,
      fontWeight: 'bold'
    };
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <div>⏳ Chargement de l'historique...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#fff2f0', 
        border: '1px solid #ffccc7',
        borderRadius: '6px',
        color: '#ff4d4f'
      }}>
        <strong>❌ {error}</strong>
        <button 
          onClick={loadHistory}
          style={{ 
            marginLeft: '10px',
            padding: '4px 12px',
            backgroundColor: '#ff4d4f',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '20px',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '16px'
      }}>
        <h2 style={{ margin: 0 }}>📊 Historique des Modifications Commission</h2>
        <button 
          onClick={loadHistory}
          style={{ 
            padding: '8px 16px',
            backgroundColor: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer'
          }}
        >
          🔄 Actualiser
        </button>
      </div>

      {history.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
          📝 Aucune modification trouvée
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ 
            width: '100%', 
            borderCollapse: 'collapse',
            fontSize: '14px'
          }}>
            <thead>
              <tr style={{ backgroundColor: '#fafafa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
                  👤 Vendeur
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0' }}>
                  📊 Ancien → Nouveau
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0' }}>
                  📈 Différence
                </th>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #f0f0f0' }}>
                  🔧 Modifié par
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0' }}>
                  📅 Date
                </th>
                <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #f0f0f0' }}>
                  🏷️ Type
                </th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr key={item.id} style={{ borderBottom: '1px solid #f0f0f0' }}>
                  <td style={{ padding: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 'bold' }}>{item.vendorName}</div>
                      <div style={{ fontSize: '12px', color: '#666' }}>{item.vendorEmail}</div>
                    </div>
                  </td>
                  
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span style={{ 
                        padding: '2px 8px', 
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                        fontSize: '13px'
                      }}>
                        {item.oldRate !== null ? `${item.oldRate}%` : '--'}
                      </span>
                      <span>→</span>
                      <span style={{ 
                        padding: '2px 8px', 
                        backgroundColor: '#e6f7ff',
                        borderRadius: '4px',
                        fontSize: '13px',
                        fontWeight: 'bold'
                      }}>
                        {item.newRate}%
                      </span>
                    </div>
                  </td>
                  
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={getChangeStyle(item.changeType, item.rateDifference)}>
                      {AdminCommissionHistoryService.formatRateDifference(item.rateDifference)}
                    </span>
                  </td>
                  
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontSize: '13px' }}>
                      <div style={{ fontWeight: '500' }}>{item.changedBy}</div>
                      {item.ipAddress && (
                        <div style={{ fontSize: '11px', color: '#999' }}>IP: {item.ipAddress}</div>
                      )}
                    </div>
                  </td>
                  
                  <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>
                    {formatDate(item.changedAt)}
                  </td>
                  
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      backgroundColor: item.changeType === 'CREATION' ? '#f6ffed' : '#fff7e6',
                      border: `1px solid ${item.changeType === 'CREATION' ? '#b7eb8f' : '#ffd591'}`
                    }}>
                      {getChangeIcon(item.changeType)}
                      {item.changeType === 'CREATION' ? 'Création' : 'Mise à jour'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
      <div style={{ 
        marginTop: '16px', 
        padding: '12px',
        backgroundColor: '#f9f9f9',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#666',
        textAlign: 'center'
      }}>
        📊 {history.length} modification{history.length > 1 ? 's' : ''} affichée{history.length > 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default CommissionHistoryTable;
```

---

### 3. Version Mobile Responsive

```jsx
// components/admin/MobileCommissionHistory.jsx

import React, { useState, useEffect } from 'react';
import AdminCommissionHistoryService from '../../services/adminCommissionHistoryService';

const MobileCommissionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await AdminCommissionHistoryService.getGlobalCommissionHistory();
      setHistory(data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div style={{ padding: '16px' }}>
      <h3 style={{ marginBottom: '20px' }}>📊 Historique Commission</h3>
      
      {history.map((item) => (
        <div key={item.id} style={{
          backgroundColor: '#fff',
          border: '1px solid #f0f0f0',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '12px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          {/* Header */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'flex-start',
            marginBottom: '12px'
          }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{item.vendorName}</div>
              <div style={{ fontSize: '13px', color: '#666' }}>{item.vendorEmail}</div>
            </div>
            <div style={{ 
              fontSize: '11px', 
              color: '#999',
              textAlign: 'right'
            }}>
              {new Date(item.changedAt).toLocaleDateString('fr-FR')}
            </div>
          </div>

          {/* Commission Change */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            backgroundColor: '#f8f9fa',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '12px'
          }}>
            <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
              {item.oldRate !== null ? `${item.oldRate}%` : '--'}
            </span>
            <span style={{ margin: '0 12px', color: '#1890ff' }}>→</span>
            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#1890ff' }}>
              {item.newRate}%
            </span>
            <span style={{ 
              marginLeft: '12px',
              fontSize: '13px',
              color: item.rateDifference > 0 ? '#f5222d' : '#52c41a',
              fontWeight: 'bold'
            }}>
              ({AdminCommissionHistoryService.formatRateDifference(item.rateDifference)})
            </span>
          </div>

          {/* Footer */}
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#666'
          }}>
            <span>Par: {item.changedBy}</span>
            <span style={{ 
              padding: '2px 8px',
              backgroundColor: item.changeType === 'CREATION' ? '#f6ffed' : '#fff7e6',
              borderRadius: '10px',
              fontSize: '11px'
            }}>
              {item.changeType === 'CREATION' ? '🆕 Création' : '✏️ Modif'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileCommissionHistory;
```

---

### 4. Hook React personnalisé

```jsx
// hooks/useCommissionHistory.js

import { useState, useEffect, useCallback } from 'react';
import AdminCommissionHistoryService from '../services/adminCommissionHistoryService';

export const useCommissionHistory = (autoRefresh = false, refreshInterval = 30000) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await AdminCommissionHistoryService.getGlobalCommissionHistory();
      setHistory(data);
      
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement');
      console.error('Erreur useCommissionHistory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Auto-refresh optionnel
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchHistory, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchHistory]);

  const refresh = useCallback(() => {
    fetchHistory();
  }, [fetchHistory]);

  return {
    history,
    loading,
    error,
    refresh,
    hasData: history.length > 0
  };
};

// Usage:
// const { history, loading, error, refresh } = useCommissionHistory(true, 60000);
```

---

### 5. Intégration dans Dashboard Admin

```jsx
// pages/admin/Dashboard.jsx

import React from 'react';
import CommissionHistoryTable from '../../components/admin/CommissionHistoryTable';
import { useCommissionHistory } from '../../hooks/useCommissionHistory';

const AdminDashboard = () => {
  const { history, loading, hasData } = useCommissionHistory();

  return (
    <div style={{ padding: '24px' }}>
      <h1>🎛️ Dashboard Admin</h1>
      
      {/* Widget Résumé Récent */}
      <div style={{ 
        backgroundColor: '#f0f9ff',
        border: '1px solid #bae7ff',
        borderRadius: '8px',
        padding: '16px',
        marginBottom: '24px'
      }}>
        <h3 style={{ margin: '0 0 12px 0' }}>📈 Activité Récente</h3>
        <div style={{ fontSize: '14px' }}>
          {loading ? (
            '⏳ Chargement...'
          ) : hasData ? (
            `${history.length} modification${history.length > 1 ? 's' : ''} récente${history.length > 1 ? 's' : ''}`
          ) : (
            'Aucune modification récente'
          )}
        </div>
      </div>

      {/* Tableau complet */}
      <CommissionHistoryTable />
    </div>
  );
};

export default AdminDashboard;
```

---

## 🎨 Styles CSS Optionnels

```css
/* styles/admin-commission-history.css */

.commission-history-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
}

.commission-history-table th {
  background-color: #fafafa;
  padding: 16px 12px;
  text-align: left;
  font-weight: 600;
  border-bottom: 2px solid #f0f0f0;
  white-space: nowrap;
}

.commission-history-table td {
  padding: 12px;
  border-bottom: 1px solid #f5f5f5;
  vertical-align: top;
}

.commission-history-table tr:hover {
  background-color: #fafafa;
}

.rate-change-positive {
  color: #f5222d;
  font-weight: bold;
}

.rate-change-negative {
  color: #52c41a;
  font-weight: bold;
}

.change-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.change-type-creation {
  background-color: #f6ffed;
  border: 1px solid #b7eb8f;
  color: #52c41a;
}

.change-type-update {
  background-color: #fff7e6;
  border: 1px solid #ffd591;
  color: #fa8c16;
}

/* Responsive */
@media (max-width: 768px) {
  .commission-history-table {
    font-size: 12px;
  }
  
  .commission-history-table th,
  .commission-history-table td {
    padding: 8px 6px;
  }
}
```

---

## ✅ Checklist Intégration

- [ ] Copier le service AdminCommissionHistoryService
- [ ] Intégrer le composant CommissionHistoryTable dans votre dashboard admin
- [ ] Tester l'endpoint avec un token admin valide
- [ ] Adapter les styles selon votre design system
- [ ] Ajouter les permissions d'accès nécessaires
- [ ] Tester la responsivité mobile

---

## 🔧 Endpoint Disponible

```
GET /api/admin/commission-history/all
Authorization: Bearer {admin_token}

Réponse: Historique complet avec détails vendeur et admin
```

**L'endpoint est prêt côté backend !** Il suffit d'intégrer côté frontend avec les composants fournis.