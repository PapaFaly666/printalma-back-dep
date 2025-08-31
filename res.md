J’ai deux endpoints qui retournent des objets produits mais avec des structures différentes :
- /vendor/products (back-office)
- /public/new-arrivals (front-office)

Objectif :
1. Une liste des champs communs (présents dans les deux).
2. Une liste des champs spécifiques à /vendor/products.
3. Une liste des champs spécifiques à /public/new-arrivals.
4. Une comparaison champ par champ des objets imbriqués importants (par ex. designPositions, baseProduct, vendor).

Spécifiquement pour `designPositions`, je veux :
- Vérifier que `x`, `y`, `width`, `height` sont identiques.
- Lister les champs supplémentaires (`validation` côté vendor, `minScale/maxScale` côté public).

Format attendu de sortie :
- JSON clair contenant : 
  {
    "commonFields": [...],
    "vendorOnlyFields": [...],
    "publicOnlyFields": [...],
    "fieldComparisons": {
        "designPositions": {
            "common": [...],
            "vendorOnly": [...],
            "publicOnly": [...]
        },
        "baseProduct": { ... },
        "vendor": { ... }
    }
  }

Bonus :
- Pouvoir brancher le script sur les deux endpoints directement (fetch).
- Sinon, travailler à partir de deux fichiers JSON d’exemple.
