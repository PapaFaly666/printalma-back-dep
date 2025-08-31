# Documentation API - Création de produits avec designs et couleurs

## Endpoint principal : Création de produit complète

```
POST /products
Content-Type: multipart/form-data
```

Cet endpoint permet de créer un produit complet en une seule requête, incluant:
- Les informations de base du produit
- Le design (existant ou nouveau)
- Les couleurs (existantes ou nouvelles)
- L'image du design

### Champs requis

| Champ | Type | Description | Obligatoire |
|-------|------|-------------|------------|
| name | string | Nom du produit | Oui |
| description | string | Description du produit | Oui |
| price | number | Prix du produit | Oui |
| stock | number | Quantité en stock | Oui |
| categoryId | number | ID de la catégorie | Oui |
| sizeIds | array | Tableau d'IDs de tailles (ex: ["1", "2", "3"]) | Oui |

### Champs optionnels

| Champ | Type | Description |
|-------|------|-------------|
| status | string | "PUBLISHED" ou "DRAFT" (par défaut: "DRAFT") |
| designId | number | ID d'un design existant (ne pas utiliser avec customDesign) |
| colorIds | array | Tableau d'IDs de couleurs existantes |

### Upload d'image de design

| Champ | Type | Description |
|-------|------|-------------|
| designImage | file | Fichier image pour le design personnalisé |

### Création d'un design personnalisé

Pour créer un nouveau design en même temps que le produit:

```json
{
  "customDesign": {
    "name": "Nom du design",
    "description": "Description du design"
  }
}
```

### Création de couleurs personnalisées

Pour créer de nouvelles couleurs en même temps que le produit:

```json
{
  "customColors": [
    {
      "name": "Rouge vif",
      "hexCode": "#FF0000"
    },
    {
      "name": "Bleu marine",
      "hexCode": "#000080"
    }
  ]
}
```

## Exemples d'utilisation

### 1. Création avec design existant et couleurs existantes

```javascript
const formData = new FormData();
formData.append('name', 'T-shirt Premium');
formData.append('description', 'T-shirt 100% coton biologique');
formData.append('price', '29.99');
formData.append('stock', '50');
formData.append('categoryId', '1');
formData.append('sizeIds', JSON.stringify(['1', '2', '3']));
formData.append('designId', '5');
formData.append('colorIds', JSON.stringify(['1', '4']));

fetch('/api/products', {
  method: 'POST',
  body: formData
})
```

### 2. Création avec nouveau design et image

```javascript
const formData = new FormData();
formData.append('name', 'T-shirt Personnalisé');
formData.append('description', 'T-shirt avec design original');
formData.append('price', '34.99');
formData.append('stock', '25');
formData.append('categoryId', '1');
formData.append('sizeIds', JSON.stringify(['1', '2']));
formData.append('customDesign', JSON.stringify({
  name: 'Logo Entreprise',
  description: 'Logo officiel de notre entreprise'
}));
formData.append('designImage', fileInput.files[0]);
formData.append('colorIds', JSON.stringify(['2', '3']));

fetch('/api/products', {
  method: 'POST',
  body: formData
})
```

### 3. Création avec nouvelles couleurs personnalisées

```javascript
const formData = new FormData();
formData.append('name', 'Hoodie Premium');
formData.append('description', 'Hoodie avec couleurs exclusives');
formData.append('price', '59.99');
formData.append('stock', '30');
formData.append('categoryId', '2');
formData.append('sizeIds', JSON.stringify(['3', '4', '5']));
formData.append('designId', '7');
formData.append('customColors', JSON.stringify([
  { name: 'Violet Intense', hexCode: '#800080' },
  { name: 'Turquoise Clair', hexCode: '#40E0D0' }
]));

fetch('/api/products', {
  method: 'POST',
  body: formData
})
```

### 4. Création complète (design personnalisé et nouvelles couleurs)

```javascript
const formData = new FormData();
formData.append('name', 'T-shirt Collection Limitée');
formData.append('description', 'Édition limitée avec design exclusif');
formData.append('price', '39.99');
formData.append('stock', '15');
formData.append('categoryId', '1');
formData.append('sizeIds', JSON.stringify(['1', '2', '3']));

// Ajout du design personnalisé
formData.append('customDesign', JSON.stringify({
  name: 'Design Exclusif 2023',
  description: 'Design créé par notre artiste partenaire'
}));
formData.append('designImage', designFileInput.files[0]);

// Ajout d'une couleur existante
formData.append('colorIds', JSON.stringify(['1']));

// Ajout de nouvelles couleurs
formData.append('customColors', JSON.stringify([
  { name: 'Édition Or', hexCode: '#FFD700' },
  { name: 'Édition Argent', hexCode: '#C0C0C0' }
]));

fetch('/api/products', {
  method: 'POST',
  body: formData
})
```

## Notes importantes

1. **Gestion des tableaux et objets**:
   - Utilisez toujours `JSON.stringify()` pour les tableaux et objets avant de les ajouter à FormData
   - Exemple: `formData.append('sizeIds', JSON.stringify(['1', '2']))`

2. **Validation côté client**:
   - Vérifiez que tous les champs obligatoires sont remplis
   - Validez que le format des couleurs hexadécimales est correct (ex: #RRGGBB)
   - Assurez-vous que les fichiers image respectent les formats acceptés (jpg, png, etc.)

3. **Compatibilité**:
   - L'API accepte les IDs sous forme de string ou de number
   - FormData n'est pas disponible dans certains anciens navigateurs, vérifiez la compatibilité

4. **Gestion des erreurs**:
   - L'API retournera des codes d'erreur HTTP appropriés en cas de problème
   - Vérifiez toujours la réponse pour gérer les cas d'erreur côté client

5. **Optimisation des images**:
   - Il est recommandé d'optimiser les images avant de les envoyer (compression, dimensionnement)
   - Cela améliorera les performances pour les utilisateurs finaux 