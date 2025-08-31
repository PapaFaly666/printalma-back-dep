# Guide pour l'upload de designs dans Printalma

Ce document explique la nouvelle approche pour l'upload de designs dans le système printalma.

## Modification majeure du système

**IMPORTANT: L'architecture du système a été modifiée. Le design est maintenant directement intégré au produit.**

Changements principaux:
1. Le design n'est plus une entité séparée, mais est directement intégré au produit
2. Il n'est plus nécessaire de spécifier un `designId`
3. Les attributs du design (`designName`, `designDescription`, `designImageUrl`) font maintenant partie du produit

## Fonctionnement actuel des designs

Chaque produit intègre directement les informations de son design:
- `designName`: Nom du design (par défaut: "Design par défaut")
- `designDescription`: Description du design (optionnelle)
- `designImageUrl`: URL de l'image du design (par défaut: placeholder)

## Structure pour l'upload de designs

Pour un upload optimal, votre requête doit toujours inclure:

```javascript
// Dans le JSON du produit
"customDesign": {
  "name": "Nom du design",
  "description": "Description du design",
  "image": "design123.jpg"  // DOIT correspondre exactement au nom du fichier
}

// Dans le FormData
formData.append("design123.jpg", designImageFile);
```

Ces informations seront utilisées pour initialiser les champs `designName`, `designDescription` et `designImageUrl` du produit.

### Vérification du FormData avant envoi

Pour vérifier que votre FormData contient bien tous les fichiers nécessaires:

```javascript
// Afficher le contenu du FormData (pour debug)
for (let pair of formData.entries()) {
  console.log(pair[0] + ': ' + pair[1]);
}
```

### Exemple complet pour l'upload du design

```javascript
// 1. Définir le nom du fichier design
const designFileName = "mon_design_" + Date.now() + ".jpg";

// 2. Préparer l'objet produit
const productData = {
  name: "T-shirt cool",
  price: 19.99,
  stock: 100,
  // ... autres champs
  customDesign: {
    name: "Design personnalisé",
    description: "Description du design",
    image: designFileName  // Référence exacte au nom du fichier
  },
  colors: [
    // ... vos couleurs
  ]
};

// 3. Créer le FormData
const formData = new FormData();
formData.append("product", JSON.stringify(productData));

// 4. Ajouter l'image du design avec le MÊME nom
formData.append(designFileName, designImageFile);

// 5. Ajouter les images des couleurs
// ...
```

## Avantages de la nouvelle architecture

1. **Simplicité**: Le design est maintenant une partie intégrante du produit
2. **Performance**: Plus besoin de jointures pour récupérer les infos du design
3. **Cohérence**: Chaque produit a automatiquement son propre design

## Recommandations pour éviter les problèmes

1. **Noms de fichiers uniques**: Utilisez des noms uniques pour éviter les conflits:
```javascript
const designFileName = `design_${Date.now()}_${Math.random().toString(36).substring(2, 9)}.jpg`;
```

2. **Correspondance exacte**: Le nom de fichier dans le JSON doit correspondre **exactement** à celui utilisé dans le FormData

3. **Taille des images**: Limitez la taille des images à moins de 10MB pour éviter les problèmes d'upload

## En cas de problème

Si vous rencontrez des problèmes avec l'upload des designs:

1. Vérifiez que votre FormData contient bien l'image avec le même nom que celui spécifié dans `customDesign.image`
2. Assurez-vous que le format de l'image est supporté (JPG, PNG, WebP)
3. Consultez les logs serveur qui contiennent des informations détaillées sur le processus d'upload

Pour toute assistance supplémentaire, contactez l'équipe backend avec un exemple de votre requête pour une analyse approfondie. 