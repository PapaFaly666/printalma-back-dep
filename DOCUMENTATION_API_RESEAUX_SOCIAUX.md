# Documentation API - Réseaux Sociaux Vendeur

## Overview
Cette documentation décrit comment interagir avec l'API pour gérer les réseaux sociaux des vendeurs. Tous les champs sont optionnels et un vendeur peut fournir n'importe quelle combinaison de réseaux sociaux.

## Endpoints

### Mettre à jour les réseaux sociaux
```
PUT /auth/vendor/social-media
```

**Headers requis :**
- `Authorization: Bearer <token>` ou cookie d'authentification

**Body (JSON) :**
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

**Important :** Tous les champs sont optionnels. Vous pouvez envoyer uniquement les champs que vous souhaitez mettre à jour.

**Réponse succès (200) :**
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

### Récupérer les réseaux sociaux
```
GET /auth/vendor/social-media
```

**Headers requis :**
- `Authorization: Bearer <token>` ou cookie d'authentification

**Réponse (200) :**
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

### Supprimer tous les réseaux sociaux
```
DELETE /auth/vendor/social-media
```

**Headers requis :**
- `Authorization: Bearer <token>` ou cookie d'authentification

**Réponse (200) :**
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

### Valider une URL de réseau social
```
POST /auth/vendor/social-media/validate
```

**Body (JSON) :**
```json
{
  "platform": "instagram",
  "url": "https://instagram.com/@maboutique"
}
```

**Réponse succès (200) :**
```json
{
  "isValid": true,
  "message": "URL instagram valide"
}
```

**Réponse erreur (400) :**
```json
{
  "isValid": false,
  "message": "URL Instagram invalide"
}
```

## Format des URLs acceptées

### Facebook
- `https://facebook.com/maboutique`
- `https://www.facebook.com/maboutique`
- `https://fb.me/maboutique`

### Instagram
- `https://instagram.com/@maboutique`
- `https://www.instagram.com/@maboutique`
- `https://instagr.am/@maboutique`

### Twitter/X
- `https://twitter.com/maboutique`
- `https://www.twitter.com/maboutique`
- `https://x.com/maboutique`
- `https://www.x.com/maboutique`

### TikTok
- `https://tiktok.com/@maboutique`
- `https://www.tiktok.com/@maboutique`
- `https://tiktok.com/maboutique` (sans @)

### YouTube
- `https://youtube.com/channel/maboutique`
- `https://youtube.com/c/maboutique`
- `https://youtube.com/user/maboutique`
- `https://youtube.com/@maboutique`
- `https://youtu.be/xxxxx`

### LinkedIn
- `https://linkedin.com/in/maboutique`
- `https://linkedin.com/company/maboutique`
- `https://www.linkedin.com/in/maboutique`
- `https://www.linkedin.com/company/maboutique`

## Notes importantes pour le frontend

1. **Champs optionnels** : Un vendeur peut avoir n'importe quelle combinaison de réseaux sociaux, y compris aucun.

2. **Validation automatique** : L'API ajoute automatiquement `https://` si manquant.

3. **Format normalisé** : Les URLs sont toujours retournées avec `https://`.

4. **Gestion des erreurs** : En cas d'erreur 400, vérifiez le message pour savoir quel champ est invalide.

5. **Mise à jour partielle** : Vous pouvez envoyer uniquement les champs à mettre à jour, les autres resteront inchangés.

## Exemples d'utilisation

### Mettre à jour uniquement Instagram
```javascript
const response = await fetch('/auth/vendor/social-media', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    instagram_url: 'https://instagram.com/@maboutique'
  })
});
```

### Mettre à jour plusieurs réseaux
```javascript
const response = await fetch('/auth/vendor/social-media', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    facebook_url: 'facebook.com/maboutique', // https:// sera ajouté automatiquement
    tiktok_url: 'tiktok.com/@maboutique',
    youtube_url: 'https://youtube.com/channel/maboutique'
  })
});
```

### Supprimer un réseau social spécifique
Pour supprimer un réseau social, envoyez une chaîne vide :
```javascript
const response = await fetch('/auth/vendor/social-media', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    instagram_url: '' // Supprimera l'URL Instagram
  })
});
```

## Gestion des erreurs côté frontend

```javascript
try {
  const response = await fetch('/auth/vendor/social-media', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(socialMediaData)
  });

  if (!response.ok) {
    const error = await response.json();
    if (response.status === 400) {
      // Erreur de validation
      console.error('Erreurs de validation:', error.message);
      // Afficher les erreurs à l'utilisateur
    }
    throw new Error(error.message || 'Erreur lors de la mise à jour');
  }

  const data = await response.json();
  // Mettre à jour l'interface avec les nouvelles données
} catch (error) {
  console.error('Erreur:', error);
  // Gérer l'erreur
}
```