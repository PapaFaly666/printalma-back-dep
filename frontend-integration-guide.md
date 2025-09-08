# 🎨 Guide Frontend - Intégration Système Commission PrintAlma

> **Guide d'intégration frontend pour le système de commission vendeur**
> 
> Version: 1.0 | Date: 2024 | PrintAlma Commission Frontend Integration

---

## 🎯 Vue d'ensemble

Ce guide détaille l'intégration frontend du système de commission PrintAlma avec les APIs backend. Il fournit tous les éléments nécessaires pour connecter l'interface d'administration des commissions vendeur.

### 🔗 Endpoints API Disponibles

```
PUT /api/admin/vendors/:vendorId/commission    # Mettre à jour commission
GET /api/admin/vendors/:vendorId/commission    # Obtenir commission vendeur
GET /api/admin/vendors/commissions             # Obtenir toutes les commissions
```

---

## 📡 Service API Frontend

### 1. Service de Commission

```javascript
// services/commissionService.js
import axios from 'axios';

class CommissionService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token admin
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('adminToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Mettre à jour la commission d'un vendeur
   */
  async updateVendorCommission(vendorId, commissionRate) {
    try {
      const response = await this.api.put(`/admin/vendors/${vendorId}/commission`, {
        commissionRate: parseFloat(commissionRate)
      });
      
      return {
        success: true,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'NETWORK_ERROR',
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  }

  /**
   * Obtenir la commission d'un vendeur
   */
  async getVendorCommission(vendorId) {
    try {
      const response = await this.api.get(`/admin/vendors/${vendorId}/commission`);
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'NETWORK_ERROR',
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  }

  /**
   * Obtenir toutes les commissions pour le tableau
   */
  async getAllVendorCommissions() {
    try {
      const response = await this.api.get('/admin/vendors/commissions');
      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'NETWORK_ERROR',
        message: error.response?.data?.message || 'Erreur de connexion'
      };
    }
  }

  /**
   * Valider un taux de commission côté frontend
   */
  validateCommissionRate(rate) {
    const numRate = parseFloat(rate);
    return !isNaN(numRate) && numRate >= 0 && numRate <= 100;
  }

  /**
   * Formater un montant en FCFA
   */
  formatCFA(amount) {
    return new Intl.NumberFormat('fr-FR').format(amount) + ' FCFA';
  }

  /**
   * Calculer le split de revenus
   */
  calculateRevenueSplit(totalAmount, commissionRate) {
    const commission = (totalAmount * commissionRate) / 100;
    const vendorRevenue = totalAmount - commission;
    
    return {
      totalAmount,
      commissionRate,
      commissionAmount: Math.round(commission),
      vendorRevenue: Math.round(vendorRevenue)
    };
  }
}

export default new CommissionService();
```

---

## 🎛️ Composant Jauge Commission

### 2. Composant CommissionSlider

```jsx
// components/CommissionSlider.jsx
import React, { useState, useEffect } from 'react';
import { Slider, InputNumber, Button, message, Tooltip } from 'antd';
import { DollarOutlined, InfoCircleOutlined } from '@ant-design/icons';
import commissionService from '../services/commissionService';

const CommissionSlider = ({ 
  vendorId, 
  initialRate = 40, 
  vendorName, 
  estimatedRevenue = 0,
  onUpdate 
}) => {
  const [commissionRate, setCommissionRate] = useState(initialRate);
  const [loading, setLoading] = useState(false);
  const [hasChanged, setHasChanged] = useState(false);

  useEffect(() => {
    setCommissionRate(initialRate);
    setHasChanged(false);
  }, [initialRate]);

  const handleSliderChange = (value) => {
    setCommissionRate(value);
    setHasChanged(value !== initialRate);
  };

  const handleInputChange = (value) => {
    if (value !== null && commissionService.validateCommissionRate(value)) {
      setCommissionRate(value);
      setHasChanged(value !== initialRate);
    }
  };

  const handleSave = async () => {
    if (!commissionService.validateCommissionRate(commissionRate)) {
      message.error('La commission doit être entre 0 et 100%');
      return;
    }

    setLoading(true);
    try {
      const result = await commissionService.updateVendorCommission(vendorId, commissionRate);
      
      if (result.success) {
        message.success(result.message);
        setHasChanged(false);
        
        // Callback vers le composant parent
        if (onUpdate) {
          onUpdate(vendorId, commissionRate);
        }
      } else {
        message.error(result.message);
        // Revenir à la valeur initiale en cas d'erreur
        setCommissionRate(initialRate);
        setHasChanged(false);
      }
    } catch (error) {
      console.error('Erreur mise à jour commission:', error);
      message.error('Erreur lors de la mise à jour');
      setCommissionRate(initialRate);
      setHasChanged(false);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCommissionRate(initialRate);
    setHasChanged(false);
  };

  // Presets rapides
  const quickPresets = [0, 25, 40, 50, 75, 100];

  // Calcul du split de revenus
  const revenueSplit = commissionService.calculateRevenueSplit(estimatedRevenue, commissionRate);

  // Couleur de la jauge selon le taux
  const getSliderColor = (rate) => {
    if (rate <= 25) return '#52c41a'; // Vert
    if (rate <= 50) return '#faad14'; // Orange
    if (rate <= 75) return '#fa8c16'; // Orange foncé
    return '#f5222d'; // Rouge
  };

  return (
    <div className="commission-slider-container" style={{ padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: 0, color: '#1890ff' }}>
            <DollarOutlined /> Commission - {vendorName}
          </h4>
          <small style={{ color: '#666' }}>
            Revenu estimé: {commissionService.formatCFA(estimatedRevenue)}
          </small>
        </div>
        
        <Tooltip title="Commission prélevée sur les revenus du vendeur">
          <InfoCircleOutlined style={{ color: '#1890ff' }} />
        </Tooltip>
      </div>

      {/* Presets rapides */}
      <div style={{ marginBottom: '12px' }}>
        <small style={{ color: '#666', marginRight: '8px' }}>Presets:</small>
        {quickPresets.map(preset => (
          <Button
            key={preset}
            size="small"
            type={commissionRate === preset ? 'primary' : 'default'}
            onClick={() => handleSliderChange(preset)}
            style={{ margin: '0 2px', minWidth: '40px' }}
          >
            {preset}%
          </Button>
        ))}
      </div>

      {/* Slider principal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
        <Slider
          min={0}
          max={100}
          step={0.1}
          value={commissionRate}
          onChange={handleSliderChange}
          style={{ 
            flex: 1,
            '.ant-slider-track': {
              backgroundColor: getSliderColor(commissionRate)
            }
          }}
          tooltip={{
            formatter: (value) => `${value}%`
          }}
        />
        
        <InputNumber
          min={0}
          max={100}
          step={0.1}
          value={commissionRate}
          onChange={handleInputChange}
          formatter={value => `${value}%`}
          parser={value => value.replace('%', '')}
          style={{ width: '80px' }}
        />
      </div>

      {/* Aperçu du split */}
      {estimatedRevenue > 0 && (
        <div style={{ 
          backgroundColor: '#f0f0f0', 
          padding: '12px', 
          borderRadius: '6px', 
          marginBottom: '12px',
          fontSize: '12px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Commission PrintAlma ({commissionRate}%):</span>
            <strong style={{ color: getSliderColor(commissionRate) }}>
              {commissionService.formatCFA(revenueSplit.commissionAmount)}
            </strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Revenu vendeur ({100 - commissionRate}%):</span>
            <strong style={{ color: '#52c41a' }}>
              {commissionService.formatCFA(revenueSplit.vendorRevenue)}
            </strong>
          </div>
        </div>
      )}

      {/* Actions */}
      {hasChanged && (
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
          <Button size="small" onClick={handleReset}>
            Annuler
          </Button>
          <Button 
            type="primary" 
            size="small" 
            loading={loading}
            onClick={handleSave}
          >
            Sauvegarder
          </Button>
        </div>
      )}
    </div>
  );
};

export default CommissionSlider;
```

---

## 📊 Tableau de Gestion des Vendeurs

### 3. Composant VendorManagementTable

```jsx
// components/VendorManagementTable.jsx
import React, { useState, useEffect } from 'react';
import { Table, Card, message, Spin, Tag, Space } from 'antd';
import { UserOutlined, DollarCircleOutlined } from '@ant-design/icons';
import CommissionSlider from './CommissionSlider';
import commissionService from '../services/commissionService';

const VendorManagementTable = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVendorCommissions();
  }, []);

  const loadVendorCommissions = async () => {
    setLoading(true);
    try {
      const result = await commissionService.getAllVendorCommissions();
      
      if (result.success) {
        setVendors(result.data);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Erreur chargement vendeurs:', error);
      message.error('Erreur lors du chargement des vendeurs');
    } finally {
      setLoading(false);
    }
  };

  const handleCommissionUpdate = (vendorId, newRate) => {
    // Mettre à jour le state local
    setVendors(prevVendors => 
      prevVendors.map(vendor => 
        vendor.vendorId === vendorId 
          ? { ...vendor, commissionRate: newRate, lastUpdated: new Date().toISOString() }
          : vendor
      )
    );
  };

  const getVendorTypeColor = (type) => {
    const colors = {
      'DESIGNER': 'blue',
      'PHOTOGRAPHER': 'green',
      'PRINTER': 'orange',
      'OTHER': 'default'
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: 'Vendeur',
      key: 'vendor',
      render: (record) => (
        <Space>
          <UserOutlined />
          <div>
            <div style={{ fontWeight: 'bold' }}>
              {record.firstName} {record.lastName}
            </div>
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.email}
            </div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'vendeur_type',
      key: 'type',
      render: (type) => (
        <Tag color={getVendorTypeColor(type)}>
          {type}
        </Tag>
      ),
    },
    {
      title: 'Revenus Estimés',
      dataIndex: 'estimatedMonthlyRevenue',
      key: 'revenue',
      render: (revenue) => (
        <div style={{ textAlign: 'right' }}>
          <DollarCircleOutlined style={{ marginRight: '4px', color: '#52c41a' }} />
          {commissionService.formatCFA(revenue)}
        </div>
      ),
      sorter: (a, b) => a.estimatedMonthlyRevenue - b.estimatedMonthlyRevenue,
    },
    {
      title: 'Commission',
      key: 'commission',
      render: (record) => (
        <CommissionSlider
          vendorId={record.vendorId}
          initialRate={record.commissionRate}
          vendorName={`${record.firstName} ${record.lastName}`}
          estimatedRevenue={record.estimatedMonthlyRevenue}
          onUpdate={handleCommissionUpdate}
        />
      ),
    },
    {
      title: 'Dernière MAJ',
      dataIndex: 'lastUpdated',
      key: 'updated',
      render: (date) => (
        <div style={{ fontSize: '12px', color: '#666' }}>
          {date ? new Date(date).toLocaleDateString('fr-FR') : 'Jamais'}
        </div>
      ),
      sorter: (a, b) => new Date(a.lastUpdated || 0) - new Date(b.lastUpdated || 0),
    },
  ];

  return (
    <Card 
      title="Gestion des Commissions Vendeurs" 
      extra={
        <Tag color="blue">
          {vendors.length} vendeur{vendors.length > 1 ? 's' : ''}
        </Tag>
      }
    >
      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={vendors}
          rowKey="vendorId"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} sur ${total} vendeurs`,
          }}
          scroll={{ x: 1200 }}
        />
      </Spin>
    </Card>
  );
};

export default VendorManagementTable;
```

---

## 🔧 Hook React pour Commission

### 4. Hook useCommission

```javascript
// hooks/useCommission.js
import { useState, useEffect } from 'react';
import { message } from 'antd';
import commissionService from '../services/commissionService';

export const useCommission = (vendorId = null) => {
  const [commission, setCommission] = useState(null);
  const [allCommissions, setAllCommissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Charger la commission d'un vendeur spécifique
  const loadVendorCommission = async (id = vendorId) => {
    if (!id) return;

    setLoading(true);
    try {
      const result = await commissionService.getVendorCommission(id);
      
      if (result.success) {
        setCommission(result.data);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Erreur chargement commission:', error);
      message.error('Erreur lors du chargement de la commission');
    } finally {
      setLoading(false);
    }
  };

  // Charger toutes les commissions
  const loadAllCommissions = async () => {
    setLoading(true);
    try {
      const result = await commissionService.getAllVendorCommissions();
      
      if (result.success) {
        setAllCommissions(result.data);
      } else {
        message.error(result.message);
      }
    } catch (error) {
      console.error('Erreur chargement commissions:', error);
      message.error('Erreur lors du chargement des commissions');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour une commission
  const updateCommission = async (id, rate) => {
    setLoading(true);
    try {
      const result = await commissionService.updateVendorCommission(id, rate);
      
      if (result.success) {
        message.success(result.message);
        
        // Mettre à jour le state local
        if (commission && id === vendorId) {
          setCommission(prev => ({ ...prev, commissionRate: rate }));
        }
        
        // Mettre à jour dans la liste complète
        setAllCommissions(prev => 
          prev.map(item => 
            item.vendorId === id 
              ? { ...item, commissionRate: rate, lastUpdated: new Date().toISOString() }
              : item
          )
        );
        
        return true;
      } else {
        message.error(result.message);
        return false;
      }
    } catch (error) {
      console.error('Erreur mise à jour commission:', error);
      message.error('Erreur lors de la mise à jour');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (vendorId) {
      loadVendorCommission(vendorId);
    }
  }, [vendorId]);

  return {
    commission,
    allCommissions,
    loading,
    loadVendorCommission,
    loadAllCommissions,
    updateCommission,
    // Utilitaires
    validateRate: commissionService.validateCommissionRate,
    formatCFA: commissionService.formatCFA,
    calculateSplit: commissionService.calculateRevenueSplit,
  };
};
```

---

## 🎯 Intégration dans l'App Principale

### 5. Exemple d'utilisation

```jsx
// pages/AdminCommissions.jsx
import React from 'react';
import { Layout, Typography, Divider } from 'antd';
import VendorManagementTable from '../components/VendorManagementTable';

const { Content } = Layout;
const { Title, Paragraph } = Typography;

const AdminCommissions = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Title level={2}>
            Administration des Commissions Vendeurs
          </Title>
          <Paragraph>
            Gérez les taux de commission de vos vendeurs en temps réel. 
            Les modifications sont appliquées immédiatement.
          </Paragraph>
          
          <Divider />
          
          <VendorManagementTable />
        </div>
      </Content>
    </Layout>
  );
};

export default AdminCommissions;
```

### 6. Configuration des routes

```jsx
// App.js ou Router configuration
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AdminCommissions from './pages/AdminCommissions';
import { ConfigProvider } from 'antd';
import frFR from 'antd/locale/fr_FR';

function App() {
  return (
    <ConfigProvider locale={frFR}>
      <Router>
        <Routes>
          <Route path="/admin/commissions" element={<AdminCommissions />} />
          {/* Autres routes */}
        </Routes>
      </Router>
    </ConfigProvider>
  );
}

export default App;
```

---

## 🔐 Gestion de l'Authentification

### 7. Guard pour les routes admin

```jsx
// components/AdminRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { message } from 'antd';

const AdminRoute = ({ children }) => {
  const token = localStorage.getItem('adminToken');
  const userRole = localStorage.getItem('userRole');

  if (!token) {
    message.warning('Vous devez être connecté pour accéder à cette page');
    return <Navigate to="/login" replace />;
  }

  if (!['ADMIN', 'SUPERADMIN'].includes(userRole)) {
    message.error('Permissions insuffisantes');
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default AdminRoute;
```

---

## ⚠️ Gestion des Erreurs

### 8. Composant ErrorBoundary

```jsx
// components/ErrorBoundary.jsx
import React from 'react';
import { Alert, Button } from 'antd';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Commission Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <Alert
          message="Erreur Commission System"
          description="Une erreur est survenue lors du chargement des commissions. Veuillez rafraîchir la page."
          type="error"
          showIcon
          action={
            <Button 
              size="small" 
              danger 
              onClick={() => window.location.reload()}
            >
              Rafraîchir
            </Button>
          }
        />
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

---

## 📱 Responsive Design

### 9. Styles CSS additionnels

```css
/* styles/commission.css */
.commission-slider-container {
  transition: all 0.3s ease;
}

.commission-slider-container:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .commission-slider-container {
    padding: 12px;
  }
  
  .ant-table-wrapper {
    overflow-x: auto;
  }
  
  .commission-slider-container .ant-slider {
    margin: 8px 0;
  }
}

/* Couleurs personnalisées pour la jauge */
.commission-low .ant-slider-track {
  background-color: #52c41a !important;
}

.commission-medium .ant-slider-track {
  background-color: #faad14 !important;
}

.commission-high .ant-slider-track {
  background-color: #f5222d !important;
}
```

---

## ✅ Checklist d'Intégration Frontend

### Phase 1: Configuration de base
- [ ] Installer les dépendances (antd, axios)
- [ ] Configurer la base URL de l'API
- [ ] Implémenter le service d'authentification
- [ ] Tester la connexion API

### Phase 2: Composants
- [ ] Créer le service CommissionService
- [ ] Développer le composant CommissionSlider
- [ ] Implémenter le tableau VendorManagementTable
- [ ] Créer le hook useCommission

### Phase 3: Intégration
- [ ] Configurer les routes admin
- [ ] Implémenter les guards d'authentification
- [ ] Ajouter la gestion d'erreurs
- [ ] Tester tous les scénarios

### Phase 4: UX/UI
- [ ] Optimiser le design responsive
- [ ] Ajouter les animations et transitions
- [ ] Implémenter les tooltips et aide contextuelle
- [ ] Tests d'accessibilité

### Phase 5: Tests et déploiement
- [ ] Tests unitaires des composants
- [ ] Tests d'intégration API
- [ ] Tests sur différents navigateurs
- [ ] Validation finale avec l'équipe

---

## 🆘 Résolution de Problèmes

### Problèmes courants

1. **Token d'authentification expiré**
   - Implémenter un refresh automatique
   - Rediriger vers la page de login

2. **Erreurs de validation**
   - Validation côté client ET serveur
   - Messages d'erreur clairs

3. **Performance lente**
   - Pagination des données
   - Debounce sur les mises à jour

4. **Erreurs réseau**
   - Retry automatique
   - Mode offline/fallback

---

**Guide créé pour l'équipe frontend PrintAlma - Système Commission v1.0**