# 🎨 Guide Frontend - Affichage Commission Vendeur

> **Guide pour afficher la commission définie par l'admin avec la dernière modification**
> 
> Intégration simple pour montrer le taux de commission actuel au vendeur

---

## 🎯 Objectif

Permettre aux **vendeurs** de voir leur taux de commission actuel défini par l'admin, avec la date de dernière modification, sans pouvoir le modifier.

---

## 🔌 Endpoint Backend Disponible

### GET Commission Vendeur Connecté

```http
GET /api/vendors/my-commission
Authorization: Bearer {vendor_token}
```

**Réponse:**
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
    "defaultRate": 40.0
  }
}
```

---

## 🛠️ Implémentation Frontend

### 1. Service pour récupérer la commission

```javascript
// services/vendorCommissionService.js

import axios from 'axios';

class VendorCommissionService {
  constructor() {
    this.baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
    this.api = axios.create({
      baseURL: this.baseURL,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token vendeur
    this.api.interceptors.request.use((config) => {
      const token = this.getVendorToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  getVendorToken() {
    return localStorage.getItem('vendorToken') || 
           localStorage.getItem('authToken') ||
           sessionStorage.getItem('vendorToken');
  }

  /**
   * Récupérer la commission du vendeur connecté
   */
  async getMyCommission() {
    try {
      const response = await this.api.get('/vendors/my-commission');
      
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
   * Formater un taux de commission
   */
  formatRate(rate) {
    return `${parseFloat(rate).toFixed(1)}%`;
  }

  /**
   * Formater une date
   */
  formatDate(dateString) {
    if (!dateString) return 'Jamais modifié';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Calculer les revenus estimés
   */
  calculateEarnings(totalSales, commissionRate) {
    const commission = (totalSales * commissionRate) / 100;
    const vendorEarnings = totalSales - commission;
    
    return {
      totalSales,
      commission,
      vendorEarnings,
      commissionRate
    };
  }
}

export default new VendorCommissionService();
```

### 2. Composant d'Affichage Commission

```jsx
// components/VendorCommissionDisplay.jsx

import React, { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col, Alert, Spin, Tag, Tooltip } from 'antd';
import { 
  DollarCircleOutlined, 
  InfoCircleOutlined, 
  CalendarOutlined,
  UserOutlined 
} from '@ant-design/icons';
import vendorCommissionService from '../services/vendorCommissionService';

const VendorCommissionDisplay = ({ showCalculator = true }) => {
  const [commission, setCommission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCommission();
  }, []);

  const loadCommission = async () => {
    setLoading(true);
    try {
      const result = await vendorCommissionService.getMyCommission();
      
      if (result.success) {
        setCommission(result.data);
        setError(null);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erreur lors du chargement de la commission');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <Spin size="large" />
          <p style={{ marginTop: '16px' }}>Chargement de votre commission...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert
        message="Erreur"
        description={error}
        type="error"
        showIcon
        style={{ marginBottom: '16px' }}
      />
    );
  }

  if (!commission) {
    return (
      <Alert
        message="Commission par défaut"
        description="Votre commission n'a pas encore été personnalisée par l'administration. Le taux par défaut de 40% s'applique."
        type="info"
        showIcon
        style={{ marginBottom: '16px' }}
      />
    );
  }

  const isDefaultRate = commission.commissionRate === commission.defaultRate;

  return (
    <div>
      {/* Card principale */}
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <DollarCircleOutlined style={{ color: '#52c41a' }} />
            <span>Votre Commission Actuelle</span>
            <Tooltip title="Taux de commission prélevé par PrintAlma sur vos ventes">
              <InfoCircleOutlined style={{ color: '#1890ff' }} />
            </Tooltip>
          </div>
        }
        style={{ marginBottom: '16px' }}
      >
        <Row gutter={16}>
          {/* Taux de commission */}
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Taux de Commission"
              value={commission.commissionRate}
              suffix="%"
              valueStyle={{ 
                color: commission.commissionRate <= 30 ? '#52c41a' : 
                       commission.commissionRate <= 50 ? '#faad14' : '#f5222d'
              }}
              prefix={<DollarCircleOutlined />}
            />
          </Col>

          {/* Votre part */}
          <Col xs={24} sm={12} md={6}>
            <Statistic
              title="Votre Part"
              value={100 - commission.commissionRate}
              suffix="%"
              valueStyle={{ color: '#52c41a' }}
              prefix={<UserOutlined />}
            />
          </Col>

          {/* Dernière modification */}
          <Col xs={24} sm={12} md={6}>
            <div>
              <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Dernière Modification</div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '8px' }}>
                <CalendarOutlined style={{ marginRight: '4px', color: '#1890ff' }} />
                {vendorCommissionService.formatDate(commission.lastUpdated)}
              </div>
            </div>
          </Col>

          {/* Modifié par */}
          <Col xs={24} sm={12} md={6}>
            <div>
              <div style={{ fontSize: '14px', color: '#8c8c8c' }}>Modifié par</div>
              <div style={{ fontSize: '16px', fontWeight: '500', marginTop: '8px' }}>
                {commission.updatedBy ? 
                  `${commission.updatedBy.firstName} ${commission.updatedBy.lastName}` : 
                  'Système'}
              </div>
            </div>
          </Col>
        </Row>

        {/* Statut */}
        <div style={{ marginTop: '16px' }}>
          {isDefaultRate ? (
            <Tag color="blue">Taux par défaut</Tag>
          ) : (
            <Tag color="green">Taux personnalisé</Tag>
          )}
        </div>
      </Card>

      {/* Calculateur de revenus */}
      {showCalculator && (
        <CommissionCalculator commissionRate={commission.commissionRate} />
      )}
    </div>
  );
};

// Composant calculateur de revenus
const CommissionCalculator = ({ commissionRate }) => {
  const [salesAmount, setSalesAmount] = useState(100000);

  const earnings = vendorCommissionService.calculateEarnings(salesAmount, commissionRate);

  return (
    <Card title="Simulateur de Revenus" style={{ marginTop: '16px' }}>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '8px' }}>
          Montant des ventes (FCFA):
        </label>
        <input
          type="number"
          value={salesAmount}
          onChange={(e) => setSalesAmount(parseFloat(e.target.value) || 0)}
          style={{
            width: '200px',
            padding: '8px',
            border: '1px solid #d9d9d9',
            borderRadius: '4px'
          }}
          min="0"
          step="1000"
        />
      </div>

      <Row gutter={16}>
        <Col xs={24} md={8}>
          <Statistic
            title="Vos Revenus"
            value={earnings.vendorEarnings}
            suffix="FCFA"
            valueStyle={{ color: '#52c41a' }}
            formatter={(value) => new Intl.NumberFormat('fr-FR').format(value)}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title="Commission PrintAlma"
            value={earnings.commission}
            suffix="FCFA"
            valueStyle={{ color: '#f5222d' }}
            formatter={(value) => new Intl.NumberFormat('fr-FR').format(value)}
          />
        </Col>
        <Col xs={24} md={8}>
          <Statistic
            title="Total Ventes"
            value={earnings.totalSales}
            suffix="FCFA"
            valueStyle={{ color: '#1890ff' }}
            formatter={(value) => new Intl.NumberFormat('fr-FR').format(value)}
          />
        </Col>
      </Row>
    </Card>
  );
};

export default VendorCommissionDisplay;
```

### 3. Hook React pour la commission

```javascript
// hooks/useVendorCommission.js

import { useState, useEffect } from 'react';
import vendorCommissionService from '../services/vendorCommissionService';

export const useVendorCommission = (autoLoad = true) => {
  const [commission, setCommission] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadCommission = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await vendorCommissionService.getMyCommission();
      
      if (result.success) {
        setCommission(result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadCommission();
    }
  }, [autoLoad]);

  return {
    commission,
    loading,
    error,
    reload: loadCommission,
    // Utilitaires
    formatRate: vendorCommissionService.formatRate,
    formatDate: vendorCommissionService.formatDate,
    calculateEarnings: vendorCommissionService.calculateEarnings
  };
};
```

### 4. Composant compact pour sidebar/header

```jsx
// components/VendorCommissionBadge.jsx

import React from 'react';
import { Badge, Tooltip } from 'antd';
import { DollarCircleOutlined } from '@ant-design/icons';
import { useVendorCommission } from '../hooks/useVendorCommission';

const VendorCommissionBadge = () => {
  const { commission, loading } = useVendorCommission();

  if (loading || !commission) {
    return (
      <Tooltip title="Commission en cours de chargement">
        <Badge count="?" style={{ backgroundColor: '#d9d9d9' }}>
          <DollarCircleOutlined style={{ fontSize: '18px' }} />
        </Badge>
      </Tooltip>
    );
  }

  const getColor = (rate) => {
    if (rate <= 30) return '#52c41a';
    if (rate <= 50) return '#faad14';
    return '#f5222d';
  };

  return (
    <Tooltip 
      title={`Votre commission: ${commission.commissionRate}% • Vos revenus: ${100 - commission.commissionRate}%`}
    >
      <Badge 
        count={`${commission.commissionRate}%`} 
        style={{ 
          backgroundColor: getColor(commission.commissionRate),
          fontSize: '12px'
        }}
      >
        <DollarCircleOutlined style={{ fontSize: '18px' }} />
      </Badge>
    </Tooltip>
  );
};

export default VendorCommissionBadge;
```

---

## 🎯 Utilisation dans vos Pages

### Page Dashboard Vendeur

```jsx
// pages/VendorDashboard.jsx

import React from 'react';
import { Layout, Row, Col } from 'antd';
import VendorCommissionDisplay from '../components/VendorCommissionDisplay';
import VendorCommissionBadge from '../components/VendorCommissionBadge';

const VendorDashboard = () => {
  return (
    <Layout>
      {/* Header avec badge commission */}
      <div style={{ padding: '16px', textAlign: 'right' }}>
        <VendorCommissionBadge />
      </div>

      {/* Contenu principal */}
      <div style={{ padding: '24px' }}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <VendorCommissionDisplay showCalculator={true} />
          </Col>
          
          {/* Autres composants du dashboard */}
        </Row>
      </div>
    </Layout>
  );
};

export default VendorDashboard;
```

### Page Revenus/Statistiques

```jsx
// pages/VendorEarnings.jsx

import React from 'react';
import { Typography } from 'antd';
import VendorCommissionDisplay from '../components/VendorCommissionDisplay';

const { Title } = Typography;

const VendorEarnings = () => {
  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>Mes Revenus et Commission</Title>
      <VendorCommissionDisplay showCalculator={true} />
    </div>
  );
};

export default VendorEarnings;
```

---

## 🔧 Endpoint Backend à Ajouter

Ajoutez ce endpoint dans votre contrôleur backend :

```typescript
// Dans votre contrôleur vendeur existant
@Get('my-commission')
@UseGuards(JwtAuthGuard)
async getMyCommission(@Req() req: AuthenticatedRequest) {
  try {
    const vendorId = req.user.id;
    
    // Vérifier que l'utilisateur est bien un vendeur
    if (req.user.role !== 'VENDEUR') {
      return {
        success: false,
        error: 'ACCESS_DENIED',
        message: 'Accès réservé aux vendeurs'
      };
    }

    const commission = await this.commissionService.getCommissionByVendorId(vendorId);
    
    return {
      success: true,
      data: {
        vendorId: vendorId,
        commissionRate: commission?.commissionRate || 40.0,
        lastUpdated: commission?.updatedAt || null,
        updatedBy: commission?.createdByUser ? {
          firstName: commission.createdByUser.firstName,
          lastName: commission.createdByUser.lastName
        } : null,
        defaultRate: 40.0
      }
    };

  } catch (error) {
    return {
      success: false,
      error: 'INTERNAL_ERROR',
      message: 'Erreur lors de la récupération de la commission'
    };
  }
}
```

---

## 📱 Design Responsive

Le composant est entièrement responsive et s'adapte à tous les écrans :

- **Mobile** : Affichage en colonne, statistiques empilées
- **Tablet** : Affichage en grille 2x2
- **Desktop** : Affichage en ligne, toutes les infos visibles

---

## 🎨 Personnalisation

### Couleurs selon le taux

```javascript
const getCommissionColor = (rate) => {
  if (rate <= 25) return { color: '#52c41a', label: 'Excellent' };
  if (rate <= 40) return { color: '#faad14', label: 'Bon' };
  if (rate <= 60) return { color: '#fa8c16', label: 'Moyen' };
  return { color: '#f5222d', label: 'Élevé' };
};
```

### Thèmes personnalisés

```css
.commission-display {
  --commission-excellent: #52c41a;
  --commission-good: #faad14;
  --commission-medium: #fa8c16;
  --commission-high: #f5222d;
}
```

---

## ✅ Checklist d'Intégration

- [ ] Créer le service `vendorCommissionService.js`
- [ ] Créer le composant `VendorCommissionDisplay.jsx`
- [ ] Créer le hook `useVendorCommission.js`
- [ ] Ajouter l'endpoint backend `GET /vendors/my-commission`
- [ ] Intégrer dans les pages vendeur
- [ ] Tester l'affichage avec différents taux
- [ ] Vérifier la responsivité mobile

**Ce guide permet aux vendeurs de voir leur commission actuelle avec toutes les informations de dernière modification !**