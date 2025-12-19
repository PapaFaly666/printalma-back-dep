# 📋 Système de Profil Vendeur

## Documentation rapide pour les développeurs

## 🚀 Quick Start

### Backend déjà configuré ?
- ✅ Base de données : Champs `profile_completed` et `first_login_completed` ajoutés
- ✅ API : Endpoints créés pour la gestion du profil
- ✅ Validation : Bio acceptée si vide ou 10+ caractères

### Frontend - Intégration en 3 étapes

#### 1. Installer le hook de profil

```typescript
// src/hooks/useVendorProfile.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

export const useVendorProfile = () => {
  const [profileStatus, setProfileStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileStatus = async () => {
    try {
      const response = await axios.get('/auth/vendor/profile/status', {
        withCredentials: true
      });
      setProfileStatus(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  return { profileStatus, loading, refetch: fetchProfileStatus };
};
```

#### 2. Ajouter la bannière pour les nouveaux vendeurs

```tsx
// src/components/ProfileCompletionBanner.tsx
import { useVendorProfile } from '../hooks/useVendorProfile';

export const ProfileCompletionBanner = () => {
  const { profileStatus } = useVendorProfile();

  if (!profileStatus?.isFirstLogin) return null;

  return (
    <Alert
      message="Bienvenue ! Complétez votre profil"
      description="Ajoutez votre biographie et vos réseaux sociaux pour plus de visibilité"
      type="info"
      showIcon
      closable
    />
  );
};
```

#### 3. Intégrer dans le dashboard

```tsx
// src/pages/VendorDashboard.tsx
import { ProfileCompletionBanner } from '../components/ProfileCompletionBanner';

export const VendorDashboard = () => {
  return (
    <div>
      <ProfileCompletionBanner />
      {/* Votre contenu existant */}
    </div>
  );
};
```

## 📡 Endpoints clés

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/auth/vendor/profile/status` | Statut du profil |
| PUT | `/auth/vendor/profile/bio` | Mettre à jour bio/titre |
| POST | `/auth/vendor/first-login-complete` | Marquer première connexion OK |

## ✅ Validation Bio

- Vide (`""`) → ✅ Accepté
- 1-9 caractères → ❌ Erreur 400
- 10+ caractères → ✅ Accepté

## 🎯 États du profil

```json
{
  "isFirstLogin": true,
  "isProfileComplete": false,
  "missingItems": ["Titre professionnel", "Biographie"],
  "profile": {
    "professional_title": null,
    "vendor_bio": null,
    "has_social_media": false
  }
}
```

## 🔧 Compléter le profil

Le profil est considéré comme complet quand :
- ✅ Titre professionnel
- ✅ Biographie (10+ chars)
- ✅ Au moins un réseau social

## 📝 Exemple de formulaire

```tsx
const ProfileForm = () => {
  const { profileStatus, refetch } = useVendorProfile();

  const handleSubmit = async (values) => {
    if (values.vendor_bio && values.vendor_bio.length < 10) {
      alert('Bio doit avoir 10+ caractères');
      return;
    }

    await axios.put('/auth/vendor/profile/bio', values, {
      withCredentials: true
    });

    refetch(); // Rafraîchir le statut
  };

  return (
    <Form onFinish={handleSubmit}>
      <Form.Item name="professional_title">
        <Input placeholder="Designer Graphique" />
      </Form.Item>

      <Form.Item name="vendor_bio">
        <TextArea
          placeholder="Votre biographie..."
          rows={4}
          showCount
          maxLength={2000}
        />
      </Form.Item>

      <Button type="primary" htmlType="submit">
        Enregistrer
      </Button>
    </Form>
  );
};
```

## 🧪 Tests

```bash
# Tester le backend
node test-vendor-profile-flow.js

# Ce que le script teste :
# 1. Login vendeur
# 2. Statut profil
# 3. Bio vide (✅)
# 4. Bio courte (❌)
# 5. Bio valide (✅)
```

## 💡 Tips

1. **Toujours valider côté client** avant l'envoi
2. **Utiliser `withCredentials: true`** pour les cookies
3. **Gérer les erreurs 400** pour les bio trop courtes
4. **Afficher une bannière** seulement si `isFirstLogin: true`

## 📚 Documentation complète

Voir `FRONTEND_VENDOR_PROFILE_GUIDE.md` pour une documentation détaillée avec tous les exemples.

---

**⚡ Le système est prêt à être utilisé ! Il suffit de suivre ces 3 étapes pour l'intégrer.**