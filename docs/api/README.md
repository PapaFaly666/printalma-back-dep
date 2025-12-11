# Documentation API - Réseaux Sociaux Vendeur

## 📚 Documentation disponible

1. **[Guide complet](./social-media-vendor.md)** - Documentation détaillée avec exemples
2. **[Collection Postman](./social-media-postman.json)** - Importez dans Postman pour tester
3. **[Spécification OpenAPI](./social-media-openapi.yaml)** - Pour Swagger ou autres outils

## 🚀 Quick Start

### Installation

```bash
# Importer la collection Postman
# Ouvrir Postman > Import > Upload files > social-media-postman.json
```

### Endpoints principaux

```javascript
const BASE_URL = 'http://localhost:3004';

// 1. Récupérer les réseaux sociaux
GET /auth/vendor/social-media

// 2. Mettre à jour les réseaux sociaux
PUT /auth/vendor/social-media
Body: { "facebook_url": "https://facebook.com/shop" }

// 3. Valider une URL
POST /auth/vendor/social-media/validate
Body: { "platform": "facebook", "url": "https://facebook.com/shop" }

// 4. Supprimer tous les réseaux sociaux
DELETE /auth/vendor/social-media
```

### Authentification

Toutes les requêtes nécessitent un cookie d'authentification :
```javascript
// Avec Axios
axios.get(url, { withCredentials: true });

// Avec fetch
fetch(url, { credentials: 'include' });
```

## 💡 Exemple React

```jsx
import { useState, useEffect } from 'react';
import axios from 'axios';

const SocialMediaManager = () => {
  const [social, setSocial] = useState({});

  useEffect(() => {
    // Récupérer les réseaux sociaux
    axios.get('/auth/vendor/social-media', { withCredentials: true })
      .then(res => setSocial(res.data));
  }, []);

  const updateSocial = async (data) => {
    // Valider puis mettre à jour
    const validation = await axios.post(
      '/auth/vendor/social-media/validate',
      { platform: 'facebook', url: data.facebook_url },
      { withCredentials: true }
    );

    if (validation.data.isValid) {
      await axios.put('/auth/vendor/social-media', data, { withCredentials: true });
      alert('Mis à jour !');
    } else {
      alert('URL invalide !');
    }
  };

  return (
    <form onSubmit={(e) => updateSocial(social)}>
      <input
        placeholder="Facebook URL"
        value={social.facebook_url || ''}
        onChange={(e) => setSocial({...social, facebook_url: e.target.value})}
      />
      <button type="submit">Sauvegarder</button>
    </form>
  );
};
```

## ✨ Validation des URLs

| Plateforme | Format requis | Exemple valide |
|-----------|---------------|----------------|
| Facebook | `https://facebook.com/*` | `https://facebook.com/shop` |
| Instagram | `https://instagram.com/@*` | `https://instagram.com/@shop` |
| Twitter | `https://twitter.com/*` | `https://twitter.com/shop` |
| TikTok | `https://tiktok.com/@*` | `https://tiktok.com/@shop` |
| YouTube | `https://youtube.com/channel/*` | `https://youtube.com/channel/UC...` |
| LinkedIn | `https://linkedin.com/in/*` | `https://linkedin.com/in/profile` |

## 📝 Notes importantes

- Tous les champs sont optionnels
- Les URLs null suppriment le réseau social
- La validation vérifie le format ET la plateforme
- L'utilisateur doit être connecté en tant que vendeur

## 🆘 Support

Pour toute question :
- Vérifier la [documentation complète](./social-media-vendor.md)
- Tester avec la [collection Postman](./social-media-postman.json)
- Contacter l'équipe backend