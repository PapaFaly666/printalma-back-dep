# API Réseaux Sociaux Vendeur

Cette documentation décrit les endpoints disponibles pour la gestion des réseaux sociaux des vendeurs.

## Base URL

```
http://localhost:3004/auth/vendor/social-media
```

## Authentification

Tous les endpoints nécessitent une authentification via cookie JWT. Le vendeur doit être connecté pour accéder à ces endpoints.

## Endpoints

### 1. Mettre à jour les réseaux sociaux

**Endpoint:** `PUT /auth/vendor/social-media`

**Description:** Met à jour les URLs des réseaux sociaux du vendeur connecté.

**Headers:**
```
Content-Type: application/json
Cookie: auth_token=<jwt_token>
```

**Body:**
```json
{
  "facebook_url": "https://facebook.com/maboutique",
  "instagram_url": "https://instagram.com/@maboutique",
  "twitter_url": "https://twitter.com/maboutique",
  "tiktok_url": "https://tiktok.com/@maboutique",
  "youtube_url": "https://youtube.com/channel/maboutique",
  "linkedin_url": "https://linkedin.com/in/maboutique"
}
```

**Champs optionnels:** Tous les champs sont optionnels. Seuls les champs fournis seront mis à jour.

**Réponse succès (200):**
```json
{
  "facebook_url": "https://facebook.com/maboutique",
  "instagram_url": "https://instagram.com/@maboutique",
  "twitter_url": "https://twitter.com/maboutique",
  "tiktok_url": null,
  "youtube_url": null,
  "linkedin_url": null
}
```

**Réponse erreur (400):**
```json
{
  "message": "URL Facebook invalide",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

### 2. Récupérer les réseaux sociaux

**Endpoint:** `GET /auth/vendor/social-media`

**Description:** Récupère les URLs des réseaux sociaux actuels du vendeur.

**Headers:**
```
Content-Type: application/json
Cookie: auth_token=<jwt_token>
```

**Réponse succès (200):**
```json
{
  "facebook_url": "https://facebook.com/maboutique",
  "instagram_url": "https://instagram.com/@maboutique",
  "twitter_url": "https://twitter.com/maboutique",
  "tiktok_url": null,
  "youtube_url": null,
  "linkedin_url": null
}
```

---

### 3. Supprimer tous les réseaux sociaux

**Endpoint:** `DELETE /auth/vendor/social-media`

**Description:** Supprime toutes les URLs des réseaux sociaux du vendeur.

**Headers:**
```
Content-Type: application/json
Cookie: auth_token=<jwt_token>
```

**Réponse succès (200):**
```json
{
  "facebook_url": null,
  "instagram_url": null,
  "twitter_url": null,
  "tiktok_url": null,
  "youtube_url": null,
  "linkedin_url": null
}
```

---

### 4. Valider une URL de réseau social

**Endpoint:** `POST /auth/vendor/social-media/validate`

**Description:** Valide si une URL est correcte pour une plateforme spécifique.

**Headers:**
```
Content-Type: application/json
Cookie: auth_token=<jwt_token>
```

**Body:**
```json
{
  "platform": "facebook",
  "url": "https://facebook.com/maboutique"
}
```

**Valeurs possibles pour `platform`: `facebook`, `instagram`, `twitter`, `tiktok`, `youtube`, `linkedin`

**Réponse succès - URL valide (200):**
```json
{
  "isValid": true,
  "message": "URL facebook valide"
}
```

**Réponse succès - URL invalide (200):**
```json
{
  "isValid": false,
  "message": "L'URL Facebook n'est pas valide. Exemple: https://facebook.com/monprofil"
}
```

## Validation des URLs

Chaque plateforme a ses propres règles de validation :

### Facebook
- Format attendu : `https://facebook.com/[identifiant]` ou `https://fb.me/[identifiant]`
- Exemple valide : `https://facebook.com/maboutique`

### Instagram
- Format attendu : `https://instagram.com/@[identifiant]` ou `https://instagr.am/@[identifiant]`
- Exemple valide : `https://instagram.com/@maboutique`

### Twitter/X
- Format attendu : `https://twitter.com/[identifiant]` ou `https://x.com/[identifiant]`
- Exemple valide : `https://twitter.com/maboutique`

### TikTok
- Format attendu : `https://tiktok.com/@[identifiant]`
- Exemple valide : `https://tiktok.com/@maboutique`

### YouTube
- Format attendu : `https://youtube.com/channel/[id]` ou `https://youtube.com/c/[identifiant]` ou `https://youtube.com/user/[identifiant]`
- Exemple valide : `https://youtube.com/channel/UC1234567890`

### LinkedIn
- Format attendu : `https://linkedin.com/in/[identifiant]` ou `https://linkedin.com/company/[identifiant]`
- Exemple valide : `https://linkedin.com/in/prenom-nom`

## Exemples d'utilisation

### JavaScript/Axios

```javascript
// Mettre à jour les réseaux sociaux
const updateSocialMedia = async (socialData) => {
  try {
    const response = await axios.put(
      'http://localhost:3004/auth/vendor/social-media',
      socialData,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true // Important pour envoyer les cookies
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response.data);
    throw error;
  }
};

// Récupérer les réseaux sociaux
const getSocialMedia = async () => {
  try {
    const response = await axios.get(
      'http://localhost:3004/auth/vendor/social-media',
      {
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response.data);
    throw error;
  }
};

// Valider une URL
const validateSocialUrl = async (platform, url) => {
  try {
    const response = await axios.post(
      'http://localhost:3004/auth/vendor/social-media/validate',
      { platform, url },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        withCredentials: true
      }
    );
    return response.data;
  } catch (error) {
    console.error('Erreur:', error.response.data);
    throw error;
  }
};

// Exemple d'utilisation
const handleSocialMediaUpdate = async () => {
  // Valider d'abord les URLs
  const fbValidation = await validateSocialUrl('facebook', 'https://facebook.com/maboutique');
  if (!fbValidation.isValid) {
    alert('URL Facebook invalide: ' + fbValidation.message);
    return;
  }

  // Mettre à jour si valide
  const socialData = {
    facebook_url: 'https://facebook.com/maboutique',
    instagram_url: 'https://instagram.com/@maboutique',
    twitter_url: 'https://twitter.com/maboutique'
  };

  const result = await updateSocialMedia(socialData);
  console.log('Réseaux sociaux mis à jour:', result);
};
```

### React Hook personnalisé

```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const useSocialMedia = () => {
  const [socialMedia, setSocialMedia] = useState({
    facebook_url: null,
    instagram_url: null,
    twitter_url: null,
    tiktok_url: null,
    youtube_url: null,
    linkedin_url: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Configurer Axios pour inclure les cookies
  const api = axios.create({
    baseURL: 'http://localhost:3004',
    withCredentials: true
  });

  // Récupérer les réseaux sociaux
  const fetchSocialMedia = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/vendor/social-media');
      setSocialMedia(response.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la récupération');
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour les réseaux sociaux
  const updateSocialMedia = async (data) => {
    setLoading(true);
    try {
      const response = await api.put('/auth/vendor/social-media', data);
      setSocialMedia(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la mise à jour';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Valider une URL
  const validateUrl = async (platform, url) => {
    try {
      const response = await api.post('/auth/vendor/social-media/validate', {
        platform,
        url
      });
      return response.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Erreur de validation');
    }
  };

  // Supprimer tous les réseaux sociaux
  const clearSocialMedia = async () => {
    setLoading(true);
    try {
      const response = await api.delete('/auth/vendor/social-media');
      setSocialMedia(response.data);
      setError(null);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Erreur lors de la suppression';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Charger les données au montage du composant
  useEffect(() => {
    fetchSocialMedia();
  }, []);

  return {
    socialMedia,
    loading,
    error,
    updateSocialMedia,
    validateUrl,
    clearSocialMedia,
    refetch: fetchSocialMedia
  };
};

export default useSocialMedia;
```

## Composant React d'exemple

```javascript
import React, { useState } from 'react';
import useSocialMedia from './hooks/useSocialMedia';

const SocialMediaForm = () => {
  const { socialMedia, loading, error, updateSocialMedia, validateUrl } = useSocialMedia();
  const [formData, setFormData] = useState(socialMedia);
  const [validationErrors, setValidationErrors] = useState({});

  const socialPlatforms = [
    { key: 'facebook_url', label: 'Facebook', placeholder: 'https://facebook.com/maboutique' },
    { key: 'instagram_url', label: 'Instagram', placeholder: 'https://instagram.com/@maboutique' },
    { key: 'twitter_url', label: 'Twitter/X', placeholder: 'https://twitter.com/maboutique' },
    { key: 'tiktok_url', label: 'TikTok', placeholder: 'https://tiktok.com/@maboutique' },
    { key: 'youtube_url', label: 'YouTube', placeholder: 'https://youtube.com/channel/ID' },
    { key: 'linkedin_url', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/profile' }
  ];

  const handleInputChange = (key, value) => {
    setFormData(prev => ({
      ...prev,
      [key]: value || null
    }));

    // Effacer l'erreur de validation pour ce champ
    if (validationErrors[key]) {
      setValidationErrors(prev => ({
        ...prev,
        [key]: null
      }));
    }
  };

  const validateField = async (key, value) => {
    if (!value) return true;

    const platform = key.replace('_url', '');
    try {
      const result = await validateUrl(platform, value);
      if (!result.isValid) {
        setValidationErrors(prev => ({
          ...prev,
          [key]: result.message
        }));
        return false;
      }
      return true;
    } catch (err) {
      setValidationErrors(prev => ({
        ...prev,
        [key]: 'Erreur de validation'
      }));
      return false;
    }
  };

  const handleBlur = async (key, value) => {
    if (value) {
      await validateField(key, value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Valider tous les champs non vides
    const validations = await Promise.all(
      Object.entries(formData)
        .filter(([_, value]) => value)
        .map(([key, value]) => validateField(key, value))
    );

    if (!validations.every(Boolean)) {
      alert('Veuillez corriger les erreurs de validation');
      return;
    }

    try {
      await updateSocialMedia(formData);
      alert('Réseaux sociaux mis à jour avec succès!');
    } catch (err) {
      alert('Erreur: ' + err.message);
    }
  };

  if (loading && !socialMedia.facebook_url) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="social-media-form">
      <h2>Réseaux Sociaux</h2>

      {error && <div className="error">{error}</div>}

      <form onSubmit={handleSubmit}>
        {socialPlatforms.map(platform => (
          <div key={platform.key} className="form-group">
            <label>{platform.label}:</label>
            <input
              type="url"
              placeholder={platform.placeholder}
              value={formData[platform.key] || ''}
              onChange={(e) => handleInputChange(platform.key, e.target.value)}
              onBlur={(e) => handleBlur(platform.key, e.target.value)}
              className={validationErrors[platform.key] ? 'error' : ''}
            />
            {validationErrors[platform.key] && (
              <div className="field-error">
                {validationErrors[platform.key]}
              </div>
            )}
          </div>
        ))}

        <button type="submit" disabled={loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </form>
    </div>
  );
};

export default SocialMediaForm;
```

## Gestion des erreurs

### Codes d'erreur courants

- **400 Bad Request**: URL invalide ou format incorrect
- **401 Unauthorized**: Utilisateur non authentifié
- **403 Forbidden**: Utilisateur n'a pas les droits de vendeur
- **404 Not Found**: Vendeur non trouvé
- **500 Internal Server Error**: Erreur serveur

### Messages d'erreur typiques

```javascript
const errorMessages = {
  'Invalid URL format': 'Format d\'URL invalide',
  'User not found': 'Utilisateur non trouvé',
  'Unauthorized': 'Vous devez être connecté',
  'Forbidden': 'Accès non autorisé',
  'Invalid platform': 'Plateforme non valide'
};
```

## Bonnes pratiques

1. **Valider avant d'envoyer**: Utiliser l'endpoint de validation avant la mise à jour
2. **Gérer les erreurs**: Afficher des messages clairs à l'utilisateur
3. **Feedback visuel**: Indiquer les champs en erreur
4. **Sauvegarde automatique**: Envisager une sauvegarde automatique après validation
5. **URLs optionnelles**: Permettre aux vendeurs de ne remplir que les réseaux qu'ils utilisent

## Support

Pour toute question ou problème, contacter l'équipe backend.