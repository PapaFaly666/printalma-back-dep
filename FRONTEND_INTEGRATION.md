# 🎨 Guide d'intégration Frontend - Personnalisation de Produits

Ce guide explique comment intégrer l'API de personnalisation dans le frontend React.

---

## 📦 Étape 1: Créer le service customization

**Fichier à créer:** `frontend/src/services/customizationService.ts`

```typescript
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3004';

export interface DesignElement {
  id: string;
  type: 'text' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  zIndex: number;
  [key: string]: any;
}

export interface SizeSelection {
  size: string;
  quantity: number;
}

export interface CustomizationData {
  productId: number;
  colorVariationId: number;
  viewId: number;
  designElements: DesignElement[];
  sizeSelections?: SizeSelection[];
  sessionId?: string;
  previewImageUrl?: string;
}

class CustomizationService {
  /**
   * Sauvegarder une personnalisation
   */
  async saveCustomization(data: CustomizationData) {
    try {
      console.log('💾 Sauvegarde personnalisation:', data);

      const response = await axios.post(`${API_BASE}/customizations`, data, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });

      console.log('✅ Personnalisation sauvegardée:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Erreur sauvegarde:', error);
      throw error;
    }
  }

  /**
   * Récupérer une personnalisation par ID
   */
  async getCustomization(id: number) {
    try {
      const response = await axios.get(`${API_BASE}/customizations/${id}`);
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération:', error);
      throw error;
    }
  }

  /**
   * Récupérer les personnalisations de l'utilisateur connecté
   */
  async getMyCustomizations(status?: string) {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(`${API_BASE}/customizations/user/me`, {
        params,
        headers: {
          Authorization: `Bearer ${this.getAuthToken()}`
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération:', error);
      throw error;
    }
  }

  /**
   * Récupérer les personnalisations d'une session (guest)
   */
  async getSessionCustomizations(sessionId: string, status?: string) {
    try {
      const params = status ? { status } : {};
      const response = await axios.get(`${API_BASE}/customizations/session/${sessionId}`, {
        params
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur récupération session:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour une personnalisation
   */
  async updateCustomization(id: number, data: Partial<CustomizationData>) {
    try {
      const response = await axios.put(`${API_BASE}/customizations/${id}`, data, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });
      return response.data;
    } catch (error) {
      console.error('❌ Erreur mise à jour:', error);
      throw error;
    }
  }

  /**
   * Supprimer une personnalisation
   */
  async deleteCustomization(id: number) {
    try {
      await axios.delete(`${API_BASE}/customizations/${id}`, {
        headers: {
          ...(this.getAuthToken() && { Authorization: `Bearer ${this.getAuthToken()}` })
        }
      });
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      throw error;
    }
  }

  /**
   * Générer un sessionId pour les guests
   */
  getOrCreateSessionId(): string {
    const storageKey = 'guest-session-id';
    let sessionId = localStorage.getItem(storageKey);

    if (!sessionId) {
      sessionId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  /**
   * Récupérer le token d'authentification
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('authToken') || localStorage.getItem('token');
  }
}

export default new CustomizationService();
```

---

## 🎨 Étape 2: Modifier CustomerProductCustomizationPageV3.tsx

### 2.1 Ajouter l'import

```typescript
import customizationService from '../services/customizationService';
```

### 2.2 Modifier la fonction handleSave

```typescript
const handleSave = async () => {
  if (!id || !product) return;

  try {
    // Données à sauvegarder
    const customizationData = {
      productId: product.id,
      colorVariationId: selectedColorVariation?.id || 0,
      viewId: selectedView?.id || 0,
      designElements: designElements,
      sessionId: customizationService.getOrCreateSessionId(),
    };

    // Sauvegarder dans le backend
    const result = await customizationService.saveCustomization(customizationData);

    console.log('✅ Personnalisation sauvegardée:', result);

    toast({
      title: '✅ Sauvegardé',
      description: `Personnalisation enregistrée avec succès (ID: ${result.id})`,
      duration: 3000
    });
  } catch (error) {
    console.error('Erreur sauvegarde:', error);
    toast({
      title: 'Erreur',
      description: 'Impossible de sauvegarder la personnalisation',
      variant: 'destructive'
    });
  }
};
```

### 2.3 Modifier handleAddToCart

```typescript
const handleAddToCart = async (selections: Array<{ size: string; quantity: number }>) => {
  if (!id || !product) return;

  try {
    // Sauvegarder la personnalisation avec les sélections de taille
    const customizationData = {
      productId: product.id,
      colorVariationId: selectedColorVariation?.id || 0,
      viewId: selectedView?.id || 0,
      designElements: designElements,
      sizeSelections: selections,
      sessionId: customizationService.getOrCreateSessionId(),
    };

    const result = await customizationService.saveCustomization(customizationData);

    console.log('✅ Personnalisation sauvegardée avant ajout panier:', result);

    toast({
      title: 'Ajouté au panier',
      description: `${selections.reduce((sum, s) => sum + s.quantity, 0)} article(s) ajouté(s)`,
    });

    // TODO: Implémenter l'ajout réel au panier avec result.id
    // navigate('/cart');
  } catch (error) {
    console.error('Erreur ajout au panier:', error);
    toast({
      title: 'Erreur',
      description: 'Impossible d\'ajouter au panier',
      variant: 'destructive'
    });
  }
};
```

### 2.4 Ajouter la récupération automatique au chargement

```typescript
useEffect(() => {
  const loadSavedDesign = async () => {
    if (!product || !id) return;

    try {
      const sessionId = customizationService.getOrCreateSessionId();
      const customizations = await customizationService.getSessionCustomizations(sessionId, 'draft');

      // Chercher une personnalisation pour ce produit
      const savedDesign = customizations.find((c: any) =>
        c.productId === product.id && c.status === 'draft'
      );

      if (savedDesign) {
        // Restaurer les éléments de design
        setDesignElements(savedDesign.designElements);

        // Restaurer la couleur sélectionnée
        const colorVariation = product.colorVariations.find(
          (cv: any) => cv.id === savedDesign.colorVariationId
        );
        if (colorVariation) {
          setSelectedColorVariation(colorVariation);

          // Restaurer la vue sélectionnée
          const view = colorVariation.images.find(
            (img: any) => img.id === savedDesign.viewId
          );
          if (view) {
            setSelectedView(view);
          }
        }

        toast({
          title: '🎨 Design restauré',
          description: 'Votre dernière personnalisation a été chargée',
          duration: 3000
        });
      }
    } catch (error) {
      console.error('Erreur chargement design:', error);
      // Ne pas afficher d'erreur si pas de design sauvegardé
    }
  };

  loadSavedDesign();
}, [product, id]);
```

---

## 🔄 Étape 3: Auto-save (optionnel)

Pour sauvegarder automatiquement pendant l'édition:

```typescript
// Ajouter un debounce pour ne pas surcharger le backend
useEffect(() => {
  if (designElements.length === 0) return;

  const timer = setTimeout(() => {
    handleSave();
  }, 2000); // Sauvegarder après 2 secondes d'inactivité

  return () => clearTimeout(timer);
}, [designElements]);
```

---

## 👤 Étape 4: Support utilisateur connecté

Si l'utilisateur est connecté, le token JWT sera automatiquement ajouté aux requêtes.

**Dans le service:**
```typescript
private getAuthToken(): string | null {
  // Adaptez selon votre système d'auth
  return localStorage.getItem('authToken') || localStorage.getItem('token');
}
```

---

## 📋 Étape 5: Créer une page "Mes personnalisations"

**Fichier:** `frontend/src/pages/MyCustomizations.tsx`

```typescript
import { useEffect, useState } from 'react';
import customizationService from '../services/customizationService';

export default function MyCustomizations() {
  const [customizations, setCustomizations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomizations = async () => {
      try {
        const data = await customizationService.getMyCustomizations();
        setCustomizations(data);
      } catch (error) {
        console.error('Erreur chargement:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomizations();
  }, []);

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <h1>Mes personnalisations</h1>
      {customizations.map((custom: any) => (
        <div key={custom.id}>
          <h3>{custom.product.name}</h3>
          <p>Créée le: {new Date(custom.createdAt).toLocaleDateString()}</p>
          <p>Statut: {custom.status}</p>
          <p>Prix: {custom.totalPrice}€</p>
        </div>
      ))}
    </div>
  );
}
```

---

## ✅ Checklist d'intégration

- [ ] Créer `customizationService.ts`
- [ ] Importer le service dans `CustomerProductCustomizationPageV3.tsx`
- [ ] Modifier `handleSave()`
- [ ] Modifier `handleAddToCart()`
- [ ] Ajouter `useEffect()` pour chargement auto
- [ ] Tester avec un guest (sans connexion)
- [ ] Tester avec un utilisateur connecté
- [ ] (Optionnel) Implémenter auto-save
- [ ] (Optionnel) Créer page "Mes personnalisations"

---

## 🧪 Comment tester

### Test 1: Personnalisation guest
1. Ouvrir `/product/:id/customize` (sans être connecté)
2. Ajouter du texte/images
3. Cliquer "Enregistrer"
4. ✅ Vérifier le toast de confirmation
5. Rafraîchir la page
6. ✅ Vérifier que le design est restauré

### Test 2: Ajout au panier
1. Personnaliser un produit
2. Cliquer "Choisir quantité & taille"
3. Sélectionner M x2, L x1
4. Cliquer "Ajouter au panier"
5. ✅ Vérifier la sauvegarde en BDD (backend)

### Test 3: Utilisateur connecté
1. Se connecter
2. Personnaliser un produit
3. Se déconnecter
4. Personnaliser un autre produit (guest)
5. Se reconnecter
6. ✅ Vérifier GET /customizations/user/me retourne uniquement les personnalisations de l'utilisateur

---

## 🐛 Résolution de problèmes

### Erreur CORS
Si vous avez des erreurs CORS, vérifiez que le backend autorise les requêtes depuis le frontend:

**Backend (`main.ts`):**
```typescript
app.enableCors({
  origin: 'http://localhost:5173', // URL du frontend
  credentials: true
});
```

### SessionId non trouvé
Vérifiez que `customizationService.getOrCreateSessionId()` est appelé avant chaque requête guest.

### Données non restaurées
Vérifiez que:
1. La sauvegarde a bien fonctionné (console backend)
2. Le `productId` correspond
3. Le `status` est `draft`

---

## 📚 Ressources

- **API Backend:** Voir `CUSTOMIZATION_API.md`
- **Résumé implémentation:** Voir `IMPLEMENTATION_SUMMARY.md`
- **Script de test:** `./test-customization.sh`

---

## 🎉 Conclusion

Avec ces modifications, votre application supportera:
- ✅ Sauvegarde backend des personnalisations
- ✅ Restauration automatique au chargement
- ✅ Support guest et utilisateurs connectés
- ✅ Ajout au panier avec personnalisation liée
- ✅ Historique des personnalisations

**Prochaine étape:** Implémenter l'intégration avec le panier pour lier les personnalisations aux commandes.
