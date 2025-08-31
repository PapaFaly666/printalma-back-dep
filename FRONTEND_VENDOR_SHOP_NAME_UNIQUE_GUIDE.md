# Guide Frontend : Nom de boutique unique

## 1. Contrainte d'unicité ajoutée

Le champ `shop_name` dans la table `User` a maintenant une contrainte `@unique` dans la base de données. Cela signifie qu'aucun autre vendeur ne peut utiliser le même nom de boutique.

---

## 2. Validation côté backend

Le backend vérifie maintenant l'unicité lors de la mise à jour du profil vendeur :

```typescript
// Dans AuthService.updateVendorProfile()
if (updateDto.shop_name) {
    const existingShop = await this.prisma.user.findFirst({ 
        where: { 
            shop_name: updateDto.shop_name,
            id: { not: userId }
        } 
    });
    if (existingShop) {
        throw new BadRequestException('Ce nom de boutique est déjà utilisé par un autre vendeur.');
    }
}
```

---

## 3. Gestion côté frontend

### 3.1 Validation en temps réel (optionnel)

```jsx
import { useState, useEffect } from 'react';

function VendorProfileEdit() {
  const [shopName, setShopName] = useState('');
  const [shopNameError, setShopNameError] = useState('');
  const [isCheckingShopName, setIsCheckingShopName] = useState(false);

  // Vérification en temps réel (optionnel)
  useEffect(() => {
    if (shopName.length > 2) {
      setIsCheckingShopName(true);
      const timeoutId = setTimeout(async () => {
        try {
          const response = await fetch(`/api/check-shop-name?name=${encodeURIComponent(shopName)}`);
          if (response.ok) {
            const { available } = await response.json();
            if (!available) {
              setShopNameError('Ce nom de boutique est déjà utilisé');
            } else {
              setShopNameError('');
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
      setShopNameError('');
    }
  }, [shopName]);

  return (
    <div>
      <label>Nom de la boutique</label>
      <input
        type="text"
        value={shopName}
        onChange={(e) => setShopName(e.target.value)}
        className={shopNameError ? 'error' : ''}
      />
      {isCheckingShopName && <span>Vérification...</span>}
      {shopNameError && <span className="error">{shopNameError}</span>}
    </div>
  );
}
```

### 3.2 Gestion des erreurs lors de la soumission

```jsx
const handleSubmit = async (formData) => {
  try {
    const response = await fetch('/auth/vendor/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (error.message.includes('nom de boutique')) {
        // Erreur spécifique au nom de boutique
        setShopNameError('Ce nom de boutique est déjà utilisé par un autre vendeur');
        return;
      }
      
      throw new Error(error.message);
    }

    // Succès
    alert('Profil mis à jour avec succès');
  } catch (error) {
    console.error('Erreur mise à jour profil:', error);
    alert('Erreur lors de la mise à jour du profil');
  }
};
```

---

## 4. Endpoint de vérification (optionnel)

Si tu veux une vérification en temps réel, tu peux ajouter cet endpoint :

```typescript
// Dans AuthController
@Get('check-shop-name')
@ApiOperation({ summary: 'Vérifier si un nom de boutique est disponible' })
async checkShopName(@Query('name') name: string) {
  const existing = await this.prisma.user.findFirst({
    where: { shop_name: name }
  });
  
  return { available: !existing };
}
```

---

## 5. Bonnes pratiques

1. **Validation côté frontend** : Vérifier que le nom n'est pas vide et a une longueur minimale
2. **Feedback utilisateur** : Afficher clairement les erreurs d'unicité
3. **Gestion d'erreur** : Capturer spécifiquement les erreurs de nom de boutique déjà utilisé
4. **UX** : Proposer des suggestions si le nom est déjà pris

---

## 6. Exemple complet de gestion

```jsx
const [formData, setFormData] = useState({
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  country: '',
  address: '',
  shop_name: ''
});

const [errors, setErrors] = useState({});

const handleShopNameChange = (value) => {
  setFormData(prev => ({ ...prev, shop_name: value }));
  
  // Validation basique
  if (value.length < 3) {
    setErrors(prev => ({ ...prev, shop_name: 'Le nom doit contenir au moins 3 caractères' }));
  } else {
    setErrors(prev => ({ ...prev, shop_name: '' }));
  }
};

const handleSubmit = async (e) => {
  e.preventDefault();
  
  try {
    const response = await fetch('/auth/vendor/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    });

    if (!response.ok) {
      const error = await response.json();
      
      if (error.message.includes('nom de boutique')) {
        setErrors(prev => ({ 
          ...prev, 
          shop_name: 'Ce nom de boutique est déjà utilisé par un autre vendeur' 
        }));
        return;
      }
      
      throw new Error(error.message);
    }

    alert('Profil mis à jour avec succès');
  } catch (error) {
    console.error('Erreur:', error);
    alert('Erreur lors de la mise à jour');
  }
};
```

---

## 7. Résumé

- ✅ Contrainte `@unique` ajoutée en base de données
- ✅ Validation côté backend dans `AuthService.updateVendorProfile()`
- ✅ Gestion d'erreur spécifique pour les noms de boutique dupliqués
- ✅ Guide frontend pour une UX optimale

**Le nom de boutique est maintenant unique !** 🎉 