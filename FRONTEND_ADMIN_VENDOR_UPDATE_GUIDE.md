# 🧭 GUIDE FRONTEND - Gestion des Vendeurs par l'Admin

## 📋 **Vue d'ensemble**

Ce guide décrit les nouveaux endpoints permettant à l'administrateur de consulter, modifier et gérer les informations des vendeurs. L'implémentation utilise NestJS avec Prisma et inclut la gestion des photos de profil via Cloudinary.

---

## 🔗 **Nouveaux Endpoints Disponibles**

```
GET /auth/admin/vendors              - Liste complète des vendeurs
GET /auth/admin/vendors/:id         - Récupérer un vendeur spécifique  
PUT /auth/admin/vendors/:id         - Mettre à jour un vendeur
```

**⚠️ Important** : Tous les endpoints nécessitent un token JWT Admin valide et utilisent le guard `AdminGuard`.

---

## 🔑 **Authentification requise (Admin)**

```javascript
// Token JWT Admin obligatoire dans les headers
headers: {
  'Authorization': `Bearer ${localStorage.getItem('admin_jwt_token')}`
}
```

---

## 📝 **Champs modifiables (multipart/form-data)**

**Content-Type**: `multipart/form-data` (pour supporter l'upload de photos)

### Champs disponibles (tous optionnels)
- `firstName` : string - Prénom du vendeur
- `lastName` : string - Nom de famille
- `email` : string - Email (doit être unique)
- `vendeur_type` : enum - Type de vendeur (`DESIGNER`, `INFLUENCEUR`, `ARTISTE`)
- `phone` : string - Numéro de téléphone (format international)
- `country` : string - Pays de résidence
- `address` : string - Adresse complète
- `shop_name` : string - Nom de la boutique (doit être unique)
- `status` : boolean - Statut actif du vendeur
- `profilePhoto` : File - Photo de profil (PNG, JPG, WEBP, max 5MB)

**⚠️ Note :** Le champ `must_change_password` est automatiquement défini à `false` lors de toute modification par l'admin.

### Validations automatiques
- **Email** : Format valide + unicité
- **Nom de boutique** : Unicité garantie
- **Photo** : Redimensionnement 300x300px + compression
- **Protection SUPERADMIN** : Impossible de modifier un SUPERADMIN

---

## 💻 **Service JavaScript - Gestion Admin des Vendeurs**

```javascript
// adminVendorService.js
class AdminVendorService {
  constructor() {
    this.baseURL = '/auth/admin/vendors';
  }

  getAdminToken() {
    const token = localStorage.getItem('admin_jwt_token');
    if (!token) throw new Error('Administrateur non authentifié');
    return token;
  }

  // Récupérer la liste des vendeurs avec pagination et filtres
  async getVendorsList(params = {}) {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    if (params.status !== undefined) queryParams.append('status', params.status);
    if (params.vendeur_type) queryParams.append('vendeur_type', params.vendeur_type);
    if (params.search) queryParams.append('search', params.search);

    const response = await fetch(`${this.baseURL}?${queryParams}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
      }
    });
    return this.handleResponse(response);
  }

  // Récupérer un vendeur spécifique
  async getVendor(vendorId) {
    const response = await fetch(`${this.baseURL}/${vendorId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
      }
    });
    return this.handleResponse(response);
  }

  // Mettre à jour un vendeur (avec photo optionnelle)
  async updateVendor(vendorId, updates, profilePhoto = null) {
    const formData = new FormData();
    
    // Ajouter les champs texte
    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    // Ajouter la photo si fournie
    if (profilePhoto) {
      formData.append('profilePhoto', profilePhoto);
    }

    const response = await fetch(`${this.baseURL}/${vendorId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.getAdminToken()}`
        // Ne pas définir Content-Type pour multipart/form-data
      },
      body: formData
    });
    return this.handleResponse(response);
  }

  async handleResponse(response) {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      switch (response.status) {
        case 400:
          throw new Error(errorData.message || 'Données invalides');
        case 401:
          throw new Error('Administrateur non authentifié');
        case 403:
          throw new Error('Accès refusé');
        case 404:
          throw new Error('Vendeur introuvable');
        case 409:
          throw new Error(errorData.message || 'Conflit de données (email ou nom de boutique déjà utilisé)');
        default:
          throw new Error(`Erreur HTTP ${response.status}`);
      }
    }
    return await response.json();
  }
}

export const adminVendorService = new AdminVendorService();
```

---

## ⚛️ **Exemple React - Formulaire d'édition Admin**

```jsx
import React, { useEffect, useState } from 'react';
import { adminVendorService } from './adminVendorService';

const AdminVendorEditForm = ({ vendorId, onSaved }) => {
  const [vendor, setVendor] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let mounted = true;
    adminVendorService.getVendor(vendorId)
      .then(data => { if (mounted) setVendor(data); })
      .catch(err => setMessage(`❌ ${err.message}`));
    return () => { mounted = false; };
  }, [vendorId]);

  const handleChange = (field, value) => {
    setVendor(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!vendor) return;
    setIsSaving(true);
    setMessage('💾 Enregistrement en cours...');
    try {
      const updates = {
        firstName: vendor.firstName,
        lastName: vendor.lastName,
        email: vendor.email,
        phone: vendor.phone,
        companyName: vendor.companyName,
        status: vendor.status,
        roles: vendor.roles,
        commissionRate: Number(vendor.commissionRate),
        payoutInfo: vendor.payoutInfo,
        kyc: vendor.kyc
      };
      const saved = await adminVendorService.updateVendor(vendorId, updates);
      setMessage('✅ Modifications enregistrées');
      onSaved && onSaved(saved);
    } catch (error) {
      setMessage(`❌ ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!vendor) return <div>Chargement...</div>;

  return (
    <form onSubmit={handleSubmit} className="admin-vendor-edit-form">
      <h2>✏️ Modifier le vendeur</h2>

      <div className="grid">
        <label>Prénom
          <input value={vendor.firstName || ''} onChange={e => handleChange('firstName', e.target.value)} />
        </label>
        <label>Nom
          <input value={vendor.lastName || ''} onChange={e => handleChange('lastName', e.target.value)} />
        </label>
        <label>Email
          <input type="email" value={vendor.email || ''} onChange={e => handleChange('email', e.target.value)} />
        </label>
        <label>Téléphone
          <input value={vendor.phone || ''} onChange={e => handleChange('phone', e.target.value)} />
        </label>
        <label>Entreprise
          <input value={vendor.companyName || ''} onChange={e => handleChange('companyName', e.target.value)} />
        </label>

        <label>Status
          <select value={vendor.status || 'PENDING'} onChange={e => handleChange('status', e.target.value)}>
            <option value="ACTIVE">Actif</option>
            <option value="SUSPENDED">Suspendu</option>
            <option value="PENDING">En attente</option>
          </select>
        </label>

        <label>Commission (%)
          <input type="number" min="0" max="100" step="0.5"
                 value={vendor.commissionRate ?? ''}
                 onChange={e => handleChange('commissionRate', e.target.value)} />
        </label>

        <label>Rôles (séparés par virgules)
          <input
            value={(vendor.roles || []).join(',')}
            onChange={e => handleChange('roles', e.target.value.split(',').map(r => r.trim()).filter(Boolean))}
          />
        </label>
      </div>

      <fieldset>
        <legend>Payout</legend>
        <label>Méthode
          <select
            value={vendor.payoutInfo?.method || 'MOBILE_MONEY'}
            onChange={e => handleChange('payoutInfo', { ...vendor.payoutInfo, method: e.target.value })}
          >
            <option value="MOBILE_MONEY">Mobile Money</option>
            <option value="BANK">Banque</option>
          </select>
        </label>
        <label>Nom du compte
          <input value={vendor.payoutInfo?.accountName || ''}
                 onChange={e => handleChange('payoutInfo', { ...vendor.payoutInfo, accountName: e.target.value })}/>
        </label>
        <label>Numéro de compte
          <input value={vendor.payoutInfo?.accountNumber || ''}
                 onChange={e => handleChange('payoutInfo', { ...vendor.payoutInfo, accountNumber: e.target.value })}/>
        </label>
        <label>Banque (si Banque)
          <input value={vendor.payoutInfo?.bankName || ''}
                 onChange={e => handleChange('payoutInfo', { ...vendor.payoutInfo, bankName: e.target.value })}/>
        </label>
        <label>Opérateur MoMo (si Mobile Money)
          <input value={vendor.payoutInfo?.momoProvider || ''}
                 onChange={e => handleChange('payoutInfo', { ...vendor.payoutInfo, momoProvider: e.target.value })}/>
        </label>
      </fieldset>

      <fieldset>
        <legend>KYC</legend>
        <label>Status KYC
          <select
            value={vendor.kyc?.status || 'PENDING'}
            onChange={e => handleChange('kyc', { ...vendor.kyc, status: e.target.value })}
          >
            <option value="PENDING">En attente</option>
            <option value="VERIFIED">Vérifié</option>
            <option value="REJECTED">Rejeté</option>
          </select>
        </label>
        <label>Note KYC
          <input value={vendor.kyc?.note || ''}
                 onChange={e => handleChange('kyc', { ...vendor.kyc, note: e.target.value })}/>
        </label>
      </fieldset>

      <button type="submit" disabled={isSaving}>
        {isSaving ? '🔄 Sauvegarde...' : '💾 Enregistrer'}
      </button>

      {message && (
        <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>{message}</div>
      )}
    </form>
  );
};

export default AdminVendorEditForm;
```

---

## 📊 **Format de la réponse**

### Succès (200 OK)
```json
{
  "success": true,
  "message": "Vendeur mis à jour",
  "data": {
    "id": 789,
    "firstName": "Aïcha",
    "lastName": "Koné",
    "email": "aicha@example.com",
    "phone": "+2250700000000",
    "companyName": "AK Design",
    "status": "ACTIVE",
    "roles": ["VENDOR"],
    "commissionRate": 12.5,
    "payoutInfo": { "method": "MOBILE_MONEY", "accountName": "A. Koné", "accountNumber": "0700000000", "momoProvider": "MTN" },
    "kyc": { "status": "VERIFIED", "note": "OK" },
    "updatedAt": "2024-06-10T12:00:00Z"
  }
}
```

### Erreurs fréquentes
```json
// 400 Bad Request
{ "success": false, "message": "Commission invalide (0-100)", "statusCode": 400 }

// 401 Unauthorized
{ "success": false, "message": "Token admin requis", "statusCode": 401 }

// 403 Forbidden
{ "success": false, "message": "Droits insuffisants", "statusCode": 403 }

// 404 Not Found
{ "success": false, "message": "Vendeur introuvable", "statusCode": 404 }
```

---

## ✅ **Checklist Frontend (Admin)**

- [ ] Utiliser `PATCH /api/admin/vendors/:vendorId`
- [ ] Inclure le token JWT Admin dans `Authorization`
- [ ] Envoyer uniquement les champs modifiés
- [ ] Valider `commissionRate` (0 à 100)
- [ ] Normaliser `roles` en tableau de strings
- [ ] Gérer KYC et Payout selon la méthode choisie
- [ ] Afficher messages de succès/erreur

---

## 🔧 **Dépannage**

### Problème : les rôles ne se sauvegardent pas
```javascript
// ✅ Convertir l'input en tableau correctement
const roles = inputValue.split(',').map(r => r.trim()).filter(Boolean);
```

### Problème : 401 côté admin
```javascript
const token = localStorage.getItem('admin_jwt_token');
if (!token) {
  window.location.href = '/admin/login';
}
```

### Problème : commission en string
```javascript
// ✅ Toujours caster en nombre
commissionRate: Number(formState.commissionRate)
```

---

## 📞 **Support**

Pour toute question technique liée à la modification des vendeurs côté admin, référez-vous à ce guide et aux logs réseau du navigateur pour diagnostiquer les erreurs.































