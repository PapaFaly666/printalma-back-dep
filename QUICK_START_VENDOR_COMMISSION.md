# ⚡ Quick Start - Affichage Commission Vendeur

> **Guide ultra-rapide pour intégrer l'affichage de commission en 5 minutes**

---

## 🚀 Copy-Paste Ready

### 1. Service Simple (5 lignes)

```javascript
// utils/commissionAPI.js
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000/api',
  withCredentials: true
});

// Intercepteur token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('vendorToken') || localStorage.getItem('authToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getMyCommission = () => api.get('/vendors/my-commission');
```

### 2. Composant Simple

```jsx
// components/CommissionBadge.jsx
import React, { useState, useEffect } from 'react';
import { getMyCommission } from '../utils/commissionAPI';

const CommissionBadge = () => {
  const [commission, setCommission] = useState(null);

  useEffect(() => {
    getMyCommission()
      .then(res => setCommission(res.data.data))
      .catch(err => console.warn('Commission non disponible'));
  }, []);

  if (!commission) return <span>Commission: --</span>;

  return (
    <div style={{
      padding: '8px 12px',
      backgroundColor: commission.commissionRate <= 40 ? '#f6ffed' : '#fff7e6',
      border: `1px solid ${commission.commissionRate <= 40 ? '#b7eb8f' : '#ffd591'}`,
      borderRadius: '6px',
      fontSize: '14px'
    }}>
      📊 Commission: <strong>{commission.commissionRate}%</strong> 
      | Vos revenus: <strong>{100 - commission.commissionRate}%</strong>
    </div>
  );
};

export default CommissionBadge;
```

### 3. Usage Immédiat

```jsx
// Dans n'importe quel composant vendeur
import CommissionBadge from './components/CommissionBadge';

function VendorDashboard() {
  return (
    <div>
      <h1>Mon Dashboard</h1>
      <CommissionBadge />
      {/* Reste de votre contenu */}
    </div>
  );
}
```

---

## 📱 Version Mobile-First

```jsx
// components/MobileCommission.jsx
import React, { useState, useEffect } from 'react';
import { getMyCommission } from '../utils/commissionAPI';

const MobileCommission = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    getMyCommission()
      .then(res => setData(res.data.data))
      .catch(() => setData({ commissionRate: 40, isDefault: true }));
  }, []);

  if (!data) return <div>Chargement...</div>;

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      marginBottom: '16px'
    }}>
      <div>
        <div style={{ fontSize: '12px', color: '#666' }}>Commission PrintAlma</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#f5222d' }}>
          {data.commissionRate}%
        </div>
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#666' }}>Vos revenus</div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#52c41a' }}>
          {100 - data.commissionRate}%
        </div>
      </div>
      <div>
        <div style={{ fontSize: '12px', color: '#666' }}>Dernière modif</div>
        <div style={{ fontSize: '11px' }}>
          {data.lastUpdated ? 
            new Date(data.lastUpdated).toLocaleDateString('fr-FR') : 
            'Par défaut'
          }
        </div>
      </div>
    </div>
  );
};

export default MobileCommission;
```

---

## 🎯 Intégration Header/Navbar

```jsx
// Dans votre Header/Navbar existant
import { useState, useEffect } from 'react';
import { getMyCommission } from '../utils/commissionAPI';

// Ajoutez ceci dans votre composant Header
const [commissionRate, setCommissionRate] = useState(null);

useEffect(() => {
  getMyCommission()
    .then(res => setCommissionRate(res.data.data.commissionRate))
    .catch(() => {});
}, []);

// Dans votre JSX header, ajoutez :
{commissionRate && (
  <span style={{ 
    marginLeft: '16px', 
    padding: '4px 8px', 
    backgroundColor: '#fff', 
    border: '1px solid #d9d9d9',
    borderRadius: '4px',
    fontSize: '12px'
  }}>
    Commission: {commissionRate}%
  </span>
)}
```

---

## 📊 Calculateur Express

```jsx
// components/QuickCalculator.jsx
import React, { useState, useEffect } from 'react';
import { getMyCommission } from '../utils/commissionAPI';

const QuickCalculator = () => {
  const [rate, setRate] = useState(40);
  const [sales, setSales] = useState(100000);

  useEffect(() => {
    getMyCommission()
      .then(res => setRate(res.data.data.commissionRate))
      .catch(() => {});
  }, []);

  const commission = (sales * rate) / 100;
  const earnings = sales - commission;

  return (
    <div style={{ padding: '16px', border: '1px solid #d9d9d9', borderRadius: '8px' }}>
      <h3>💰 Calculateur Rapide</h3>
      
      <div style={{ marginBottom: '12px' }}>
        <label>Ventes (FCFA): </label>
        <input 
          type="number" 
          value={sales} 
          onChange={e => setSales(Number(e.target.value))}
          style={{ padding: '4px', marginLeft: '8px', width: '120px' }}
        />
      </div>

      <div style={{ display: 'flex', gap: '16px', fontSize: '14px' }}>
        <div>
          <div>Commission ({rate}%):</div>
          <div style={{ fontWeight: 'bold', color: '#f5222d' }}>
            {new Intl.NumberFormat('fr-FR').format(commission)} FCFA
          </div>
        </div>
        <div>
          <div>Vos revenus:</div>
          <div style={{ fontWeight: 'bold', color: '#52c41a' }}>
            {new Intl.NumberFormat('fr-FR').format(earnings)} FCFA
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuickCalculator;
```

---

## 🎨 Styles CSS Ready-to-Use

```css
/* Ajoutez à votre CSS global */
.commission-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: linear-gradient(135deg, #f6ffed 0%, #fff7e6 100%);
  border: 1px solid #b7eb8f;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 500;
}

.commission-high { border-color: #ffa39e; background: linear-gradient(135deg, #fff1f0 0%, #ffebee 100%); }
.commission-medium { border-color: #ffd591; background: linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%); }

.commission-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border: 1px solid #f0f0f0;
}

.commission-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 16px;
}

@media (max-width: 768px) {
  .commission-split { grid-template-columns: 1fr; }
}
```

---

## 🔥 Ultra-Minimal (1 ligne)

Pour juste afficher le taux sans fioritures :

```jsx
// hooks/useCommissionRate.js
import { useState, useEffect } from 'react';
import { getMyCommission } from '../utils/commissionAPI';

export const useCommissionRate = () => {
  const [rate, setRate] = useState(40);
  useEffect(() => {
    getMyCommission().then(res => setRate(res.data.data.commissionRate)).catch(() => {});
  }, []);
  return rate;
};

// Usage n'importe où :
import { useCommissionRate } from './hooks/useCommissionRate';

function AnyComponent() {
  const commissionRate = useCommissionRate();
  
  return <span>Commission: {commissionRate}%</span>;
}
```

---

## ✅ Checklist Rapide

- [ ] Copier le service API (2 min)
- [ ] Coller un composant au choix (1 min)  
- [ ] Ajouter dans une page vendeur (30 sec)
- [ ] Tester avec un vendeur connecté (1 min)
- [ ] Ajuster les styles si besoin (30 sec)

**Total : 5 minutes pour avoir l'affichage commission !**

---

## 🛠️ Endpoint Backend Disponible

```
GET /api/vendors/my-commission
Authorization: Bearer {vendor_token}

Réponse:
{
  "success": true,
  "data": {
    "vendorId": 123,
    "commissionRate": 35.5,
    "lastUpdated": "2024-01-15T10:30:00Z",
    "updatedBy": { "firstName": "Admin", "lastName": "Principal" },
    "defaultRate": 40.0,
    "isCustomRate": true
  }
}
```

**L'endpoint est prêt côté backend !** Il suffit d'intégrer côté frontend.