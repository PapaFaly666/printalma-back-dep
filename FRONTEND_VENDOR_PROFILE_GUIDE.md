# Guide d'Intégration - Profil Vendeur

## Vue d'ensemble

Ce guide explique comment intégrer le nouveau système de profil vendeur qui permet de gérer les informations du vendeur (biographie, réseaux sociaux) et de suivre si le profil est complet.

## Fonctionnalités

- ✅ Biographie optionnelle (vide ou 10+ caractères)
- ✅ Réseaux sociaux optionnels
- ✅ Suivi automatique du complètement du profil
- ✅ Détection de la première connexion
- ✅ Messages guidés pour les nouveaux vendeurs

## Endpoints API

### 1. Vérifier le statut du profil

```http
GET /auth/vendor/profile/status
Authorization: Bearer <token> ou Cookie auth_token
```

**Réponse :**
```json
{
  "isFirstLogin": true,
  "isProfileComplete": false,
  "missingItems": [
    "Titre professionnel",
    "Biographie",
    "Au moins un réseau social"
  ],
  "profile": {
    "professional_title": null,
    "vendor_bio": null,
    "has_social_media": false
  }
}
```

### 2. Mettre à jour la biographie et le titre

```http
PUT /auth/vendor/profile/bio
Authorization: Bearer <token> ou Cookie auth_token
Content-Type: application/json

{
  "vendor_bio": "Designer graphique passionné...",
  "professional_title": "Designer Graphique Senior"
}
```

**Règles de validation :**
- `vendor_bio` : Optionnel, mais si fourni doit faire 10+ caractères
- `professional_title` : Optionnel, max 200 caractères
- Les chaînes vides (`""`) sont acceptées et converties en `null`

**Réponse :**
```json
{
  "professional_title": "Designer Graphique Senior",
  "vendor_bio": "Designer graphique passionné..."
}
```

### 3. Marquer la première connexion comme terminée

```http
POST /auth/vendor/first-login-complete
Authorization: Bearer <token> ou Cookie auth_token
```

**Réponse :**
```json
{
  "message": "Première connexion marquée comme complétée"
}
```

### 4. Récupérer le profil actuel

```http
GET /auth/vendor/profile/bio
Authorization: Bearer <token> ou Cookie auth_token
```

**Réponse :**
```json
{
  "professional_title": "Designer Graphique Senior",
  "vendor_bio": "Designer graphique passionné..."
}
```

## Implémentation Frontend

### 1. Hook React - Profil Status

```typescript
// hooks/useVendorProfile.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

interface ProfileStatus {d
  isFirstLogin: boolean;
  isProfileComplete: boolean;
  missingItems: string[];
  profile: {
    professional_title: string | null;
    vendor_bio: string | null;
    has_social_media: boolean;
  };
}

export const useVendorProfile = () => {
  const [profileStatus, setProfileStatus] = useState<ProfileStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfileStatus = async () => {
    try {
      const response = await axios.get('/auth/vendor/profile/status', {
        withCredentials: true // Pour les cookies
      });
      setProfileStatus(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du profil');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  const completeFirstLogin = async () => {
    try {
      await axios.post('/auth/vendor/first-login-complete', {}, {
        withCredentials: true
      });
      await fetchProfileStatus(); // Rafraîchir le statut
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Erreur');
    }
  };

  const updateProfile = async (data: {
    vendor_bio?: string;
    professional_title?: string;
  }) => {
    try {
      await axios.put('/auth/vendor/profile/bio', data, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });
      await fetchProfileStatus(); // Rafraîchir le statut
    } catch (err: any) {
      throw new Error(err.response?.data?.message || 'Erreur lors de la mise à jour');
    }
  };

  return {
    profileStatus,
    loading,
    error,
    completeFirstLogin,
    updateProfile,
    refetch: fetchProfileStatus
  };
};
```

### 2. Composant - Profil Incomplet Banner

```typescript
// components/ProfileCompletionBanner.tsx
import React from 'react';
import { useVendorProfile } from '../hooks/useVendorProfile';
import { Button, Alert, List, Typography } from 'antd';

const { Title, Text } = Typography;

export const ProfileCompletionBanner: React.FC = () => {
  const { profileStatus, completeFirstLogin, loading } = useVendorProfile();

  if (loading || !profileStatus) return null;

  // Ne montrer la bannière que si c'est la première connexion
  if (!profileStatus.isFirstLogin) return null;

  const handleCompleteLater = async () => {
    try {
      await completeFirstLogin();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <Alert
      message="Bienvenue sur votre espace vendeur !"
      description={
        <div>
          <Text>Complétez votre profil pour augmenter votre visibilité :</Text>
          <List
            size="small"
            style={{ marginTop: 8 }}
            dataSource={profileStatus.missingItems}
            renderItem={item => (
              <List.Item>
                <Text type="danger">• {item}</Text>
              </List.Item>
            )}
          />
        </div>
      }
      type="info"
      showIcon
      action={
        <Button size="small" onClick={handleCompleteLater}>
          Plus tard
        </Button>
      }
      closable
    />
  );
};
```

### 3. Composant - Formulaire de Profil

```typescript
// components/VendorProfileForm.tsx
import React, { useState } from 'react';
import { Form, Input, Button, message, Typography } from 'antd';
import { useVendorProfile } from '../hooks/useVendorProfile';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface VendorProfileFormProps {
  onSave?: () => void;
}

export const VendorProfileForm: React.FC<VendorProfileFormProps> = ({ onSave }) => {
  const { profileStatus, updateProfile, loading } = useVendorProfile();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Initialiser le formulaire avec les données existantes
  React.useEffect(() => {
    if (profileStatus) {
      form.setFieldsValue({
        professional_title: profileStatus.profile.professional_title || '',
        vendor_bio: profileStatus.profile.vendor_bio || ''
      });
    }
  }, [profileStatus, form]);

  const handleSubmit = async (values: any) => {
    setSubmitting(true);

    try {
      // Validation côté client
      if (values.vendor_bio && values.vendor_bio.length > 0 && values.vendor_bio.length < 10) {
        message.error('La biographie doit contenir au moins 10 caractères');
        return;
      }

      await updateProfile({
        professional_title: values.professional_title || undefined,
        vendor_bio: values.vendor_bio || undefined
      });

      message.success('Profil mis à jour avec succès');
      onSave?.();
    } catch (error: any) {
      message.error(error.message || 'Erreur lors de la mise à jour');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Chargement...</div>;

  return (
    <div>
      <Title level={3}>Mon profil vendeur</Title>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Form.Item
          label="Titre professionnel"
          name="professional_title"
          rules={[
            { max: 200, message: 'Le titre ne peut pas dépasser 200 caractères' }
          ]}
        >
          <Input
            placeholder="Ex: Designer Graphique Senior"
            maxLength={200}
          />
        </Form.Item>

        <Form.Item
          label="Biographie"
          name="vendor_bio"
          extra="Optionnel - Si vous renseignez une biographie, elle doit contenir au moins 10 caractères"
        >
          <TextArea
            placeholder="Parlez-nous de vous, de votre style, de votre passion..."
            rows={4}
            maxLength={2000}
            showCount
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={submitting}
            size="large"
          >
            Enregistrer
          </Button>
        </Form.Item>
      </Form>

      {profileStatus?.isProfileComplete && (
        <div style={{ marginTop: 16 }}>
          <Text type="success">
            ✅ Votre profil est complet ! Vous avez plus de chances d'être remarqué par les clients.
          </Text>
        </div>
      )}
    </div>
  );
};
```

### 4. Intégration dans le Dashboard

```typescript
// pages/VendorDashboard.tsx
import React from 'react';
import { ProfileCompletionBanner } from '../components/ProfileCompletionBanner';
import { VendorProfileForm } from '../components/VendorProfileForm';

export const VendorDashboard: React.FC = () => {
  return (
    <div>
      {/* Bannière de première connexion */}
      <ProfileCompletionBanner />

      {/* Contenu du dashboard */}
      <div style={{ marginTop: 24 }}>
        <VendorProfileForm />

        {/* Autre contenu du dashboard... */}
      </div>
    </div>
  );
};
```

## Gestion des erreurs

### Codes d'erreur courants

```typescript
const handleProfileError = (error: any) => {
  switch (error.response?.status) {
    case 400:
      if (error.response?.data?.message?.includes('10 caractères')) {
        message.error('La biographie doit contenir au moins 10 caractères');
      } else {
        message.error('Données invalides');
      }
      break;
    case 401:
      message.error('Veuillez vous reconnecter');
      // Rediriger vers la page de login
      break;
    case 403:
      message.error('Accès réservé aux vendeurs');
      break;
    default:
      message.error('Erreur serveur, veuillez réessayer');
  }
};
```

## Bonnes pratiques

### 1. Validation côté client

Toujours valider côté client avant d'envoyer les données :

```typescript
const validateProfileData = (data: any) => {
  const errors: string[] = [];

  if (data.vendor_bio && data.vendor_bio.length > 0 && data.vendor_bio.length < 10) {
    errors.push('La biographie doit contenir au moins 10 caractères');
  }

  if (data.professional_title && data.professional_title.length > 200) {
    errors.push('Le titre ne peut pas dépasser 200 caractères');
  }

  return errors;
};
```

### 2. État de chargement

Toujours gérer les états de chargement pour meilleure UX :

```typescript
const [loading, setLoading] = useState(false);
const [profileComplete, setProfileComplete] = useState(false);

// Afficher un spinner pendant le chargement
// Afficher un message de succès quand le profil est complet
```

### 3. Mise en cache

Pour éviter les requêtes répétées :

```typescript
// Utiliser React Query ou SWR pour mettre en cache les données du profil
const { data, isLoading, refetch } = useQuery(
  'vendorProfile',
  () => axios.get('/auth/vendor/profile/status')
);
```

## Test de l'intégration

Utilisez le script de test fourni :

```bash
# Assurez-vous que le serveur backend tourne
npm run start:dev

# Lancez les tests
node test-vendor-profile-flow.js
```

## Résumé du flux utilisateur

1. **Nouveau vendeur** → `isFirstLogin: true`, `isProfileComplete: false`
2. **Affichage bannière** → "Bienvenue ! Complétez votre profil"
3. **Mise à jour profil** → Bio + titre + réseaux sociaux
4. **Profil complet** → `isProfileComplete: true`, `profile_completed: true` en BDD
5. **Première connexion terminée** → `first_login_completed: true` en BDD

Cette approche garantit une expérience utilisateur fluide tout en assurant que les vendeurs ont toutes les informations nécessaires pour être visibles par les clients.