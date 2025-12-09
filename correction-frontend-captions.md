# Correction du format des captions pour l'API galerie

## Le problème
Vous envoyez les captions comme des chaînes JSON séparées :
```
captions[0]: {"caption":"ffff"}
captions[1]: {"caption":"ffdd"}
...
```

## Solution 1: Envoyer comme un tableau JSON unique
```typescript
async createGallery(formData: any) {
  // Extraire les données du formulaire
  const title = formData.get('title');
  const description = formData.get('description');
  const images = formData.getAll('images') as File[];

  // Récupérer les captions si elles existent
  const captions = [];
  for (let i = 0; i < 5; i++) {
    const caption = formData.get(`captions[${i}]`);
    if (caption) {
      try {
        captions.push(JSON.parse(caption));
      } catch (e) {
        captions.push({ caption });
      }
    }
  }

  // Créer un nouveau FormData avec le bon format
  const correctedFormData = new FormData();
  correctedFormData.append('title', title);
  if (description) {
    correctedFormData.append('description', description);
  }

  // Ajouter les images
  images.forEach((image) => {
    correctedFormData.append('images', image);
  });

  // Ajouter les captions comme un tableau JSON (uniquement s'il y en a)
  if (captions.length > 0) {
    correctedFormData.append('captions', JSON.stringify(captions));
  }

  // Envoyer la requête
  const response = await axios.post('/vendor/galleries', correctedFormData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true
  });

  return response.data;
}
```

## Solution 2: Ne pas inclure les captions du tout (recommandé)
Les captions sont optionnelles selon le DTO, vous pouvez simplement ne pas les envoyer :

```typescript
async createGallery(formData: FormData) {
  // Envoyer formData directement sans les captions
  const response = await axios.post('/vendor/galleries', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    withCredentials: true
  });

  return response.data;
}
```

## Solution 3: Si vous voulez absolument envoyer les captions individuellement
```typescript
// Dans le composant qui crée le FormData
const formData = new FormData();
formData.append('title', title);
if (description) {
  formData.append('description', description);
}

// Ajouter les images
images.forEach((image) => {
  formData.append('images', image);
});

// Créer un tableau d'objets captions
const captionsArray = [
  { caption: 'ffff' },
  { caption: 'ffdd' },
  { caption: 'fffffffffff' },
  { caption: 'dddddddd' },
  { caption: 'aaaaaaaa' }
];

// Ajouter comme une chaîne JSON unique
formData.append('captions', JSON.stringify(captionsArray));
```

## Résumé
Le plus simple est de ne pas envoyer les captions si elles ne sont pas nécessaires, ou de les envoyer comme un tableau JSON unique avec le nom de champ `captions` (sans les indices []).