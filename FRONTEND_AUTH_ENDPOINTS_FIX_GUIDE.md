# 🔧 Guide Frontend : Correction des endpoints d'authentification

## 🎯 Problèmes identifiés

1. **`GET /auth/check-shop-name`** - Endpoint manquant (404)
2. **`POST /auth/admin/create-vendor-extended`** - Endpoint manquant (409)

---

## ✅ Endpoints maintenant disponibles

### 1. **Vérification nom de boutique**
```typescript
// ✅ Endpoint disponible
GET /auth/check-shop-name?name=carré
```

**Réponse :**
```json
{
  "available": true  // ou false si le nom existe déjà
}
```

### 2. **Création vendeur avec photo**
```typescript
// ✅ Endpoint disponible (utilise CreateClientDto)
POST /auth/admin/create-vendor-extended
Content-Type: multipart/form-data
```

**Payload :**
```typescript
{
  firstName: string,
  lastName: string,
  email: string,
  vendeur_type: 'DESIGNER' | 'ARTISTE' | 'INFLUENCEUR',
  phone?: string,
  country?: string,
  address?: string,
  shop_name?: string,
  profilePhoto?: File  // Photo optionnelle
}
```

---

## 🔧 Corrections Frontend

### 1. **Vérification nom de boutique**

```jsx
// ✅ Correction pour CreateClientForm.tsx
const checkShopName = async (name: string) => {
  try {
    const response = await fetch(`/auth/check-shop-name?name=${encodeURIComponent(name)}`);
    if (response.ok) {
      const { available } = await response.json();
      return available;
    }
    return true; // En cas d'erreur, considérer comme disponible
  } catch (error) {
    console.error('Erreur vérification nom boutique:', error);
    return true;
  }
};

// Utilisation
useEffect(() => {
  if (formData.shop_name && formData.shop_name.length > 2) {
    const timeoutId = setTimeout(async () => {
      const isAvailable = await checkShopName(formData.shop_name);
      if (!isAvailable) {
        setErrors(prev => ({ ...prev, shop_name: 'Ce nom de boutique est déjà utilisé' }));
      } else {
        setErrors(prev => ({ ...prev, shop_name: '' }));
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }
}, [formData.shop_name]);
```

### 2. **Création vendeur avec photo**

```jsx
// ✅ Correction pour auth.service.ts
const createClient = async (formData: any, profilePhoto?: File) => {
  try {
    const data = new FormData();
    
    // Ajouter les données du formulaire
    Object.keys(formData).forEach(key => {
      if (formData[key] !== undefined && formData[key] !== null) {
        data.append(key, formData[key]);
      }
    });
    
    // Ajouter la photo si fournie
    if (profilePhoto) {
      data.append('profilePhoto', profilePhoto);
    }

    const response = await fetch('/auth/admin/create-vendor-extended', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminToken}`
        // Ne pas mettre Content-Type, il est géré automatiquement par FormData
      },
      body: data
    });

    if (!response.ok) {
      const error = await response.json();
      
      // ✅ Gestion spécifique des erreurs
      if (error.message.includes('nom de boutique')) {
        throw new Error('Ce nom de boutique est déjà utilisé par un autre vendeur');
      }
      
      if (error.message.includes('Email déjà utilisé')) {
        throw new Error('Cet email est déjà utilisé par un autre vendeur');
      }
      
      throw new Error(error.message || 'Erreur lors de la création du vendeur');
    }

    return await response.json();
  } catch (error) {
    console.error('Erreur création vendeur:', error);
    throw error;
  }
};
```

---

## 📋 Structure des données

### CreateClientDto (pour l'endpoint)
```typescript
interface CreateClientDto {
  firstName: string;
  lastName: string;
  email: string;
  vendeur_type: 'DESIGNER' | 'ARTISTE' | 'INFLUENCEUR';
  phone?: string;
  country?: string;
  address?: string;
  shop_name?: string;
}
```

### Réponse de création
```typescript
interface CreateVendorResponse {
  success: boolean;
  message: string;
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    vendeur_type: string;
    status: boolean;
    phone?: string;
    country?: string;
    address?: string;
    shop_name?: string;
    profile_photo_url?: string;
  };
}
```

---

## 🎨 Exemple complet CreateClientForm

```jsx
import React, { useState, useEffect } from 'react';

function CreateClientForm() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    vendeur_type: 'DESIGNER',
    phone: '',
    country: '',
    address: '',
    shop_name: ''
  });

  const [errors, setErrors] = useState({});
  const [isCheckingShopName, setIsCheckingShopName] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);

  // Vérification en temps réel du nom de boutique
  useEffect(() => {
    if (formData.shop_name && formData.shop_name.length > 2) {
      setIsCheckingShopName(true);
      
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`/auth/check-shop-name?name=${encodeURIComponent(formData.shop_name)}`);
          if (response.ok) {
            const { available } = await response.json();
            if (!available) {
              setErrors(prev => ({ ...prev, shop_name: 'Ce nom de boutique est déjà utilisé' }));
            } else {
              setErrors(prev => ({ ...prev, shop_name: '' }));
            }
          }
        } catch (error) {
          console.error('Erreur vérification nom boutique:', error);
        } finally {
          setIsCheckingShopName(false);
        }
      }, 500);

      return () => clearTimeout(timeoutId);
    } else {
      setErrors(prev => ({ ...prev, shop_name: '' }));
    }
  }, [formData.shop_name]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const data = new FormData();
      
      // Ajouter les données du formulaire
      Object.keys(formData).forEach(key => {
        if (formData[key]) {
          data.append(key, formData[key]);
        }
      });
      
      // Ajouter la photo si fournie
      if (profilePhoto) {
        data.append('profilePhoto', profilePhoto);
      }

      const response = await fetch('/auth/admin/create-vendor-extended', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        },
        body: data
      });

      if (!response.ok) {
        const error = await response.json();
        
        if (error.message.includes('nom de boutique')) {
          setErrors(prev => ({ ...prev, shop_name: 'Ce nom de boutique est déjà utilisé par un autre vendeur' }));
          return;
        }
        
        throw new Error(error.message);
      }

      alert('Vendeur créé avec succès !');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du vendeur');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Champs du formulaire */}
      <div>
        <label>Nom de la boutique</label>
        <input
          type="text"
          value={formData.shop_name}
          onChange={(e) => setFormData(prev => ({ ...prev, shop_name: e.target.value }))}
          className={errors.shop_name ? 'error' : ''}
        />
        {isCheckingShopName && <span>Vérification...</span>}
        {errors.shop_name && <span className="error">{errors.shop_name}</span>}
      </div>

      {/* Autres champs... */}
      
      <button type="submit">Créer le vendeur</button>
    </form>
  );
}
```

---

## ✅ Résumé des corrections

1. **✅ Endpoint vérification** : `GET /auth/check-shop-name` disponible
2. **✅ Endpoint création** : `POST /auth/admin/create-vendor-extended` disponible
3. **✅ Gestion d'erreur** : Messages spécifiques pour nom de boutique
4. **✅ Validation temps réel** : Vérification automatique du nom de boutique
5. **✅ Support photo** : Upload de photo de profil optionnel

**Les endpoints sont maintenant fonctionnels !** 🎉 