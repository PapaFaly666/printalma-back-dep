# 📋 Guide Front-End – Détail Produit Vendeur (`GET /vendor/products/:id`)

Exemple complet de réponse pour :

```bash
curl -X GET \
  'http://localhost:3004/vendor/products/36' \
  -H 'accept: application/json' \
  --cookie "auth_token=<JWT>"
```

---

### Réponse 200 (JSON)** – **TOUT le contenu, sans omission**
```json
{
  "success": true,
  "data": {
    "id": 36,
    "vendorName": "Tshirt",
    "vendorDescription": "Tshirt prenium",
    "vendorPrice": 12000,
    "vendorStock": 12,
    "status": "PENDING",
    "adminProduct": {
      "id": 1,
      "name": "Tshirt",
      "description": "Tshirt prenium",
      "price": 12000,
      "colorVariations": [
        {
          "id": 1,
          "name": "Blanc",
          "colorCode": "#e5e6e1",
          "images": [
            {
              "id": 1,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018200/printalma/1752018198359-T-Shirt_Premium_Blanc.jpg",
              "viewType": "Front",
              "delimitations": [
                {
                  "x": 158.7095343254858,
                  "y": 103.5952197959822,
                  "width": 166.6666600439286,
                  "height": 272.2222114050834,
                  "coordinateType": "PERCENTAGE"
                }
              ]
            }
          ]
        },
        {
          "id": 2,
          "name": "Blue",
          "colorCode": "#2a68a7",
          "images": [
            {
              "id": 2,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018202/printalma/1752018201718-T-Shirt_Premium_Bleu.jpg",
              "viewType": "Front",
              "delimitations": [
                {
                  "x": 158.7095343254858,
                  "y": 103.5952197959822,
                  "width": 166.6666600439286,
                  "height": 272.2222114050834,
                  "coordinateType": "PERCENTAGE"
                }
              ]
            }
          ]
        },
        {
          "id": 3,
          "name": "Noir",
          "colorCode": "#000000",
          "images": [
            {
              "id": 3,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018203/printalma/1752018203288-T-Shirt_Premium_Noir.jpg",
              "viewType": "Front",
              "delimitations": [
                {
                  "x": 158.7095343254858,
                  "y": 103.5952197959822,
                  "width": 166.6666600439286,
                  "height": 272.2222114050834,
                  "coordinateType": "PERCENTAGE"
                }
              ]
            }
          ]
        },
        {
          "id": 4,
          "name": "Rouge",
          "colorCode": "#b42827",
          "images": [
            {
              "id": 4,
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752018205/printalma/1752018204914-T-Shirt_Premium_Rouge.jpg",
              "viewType": "Front",
              "delimitations": [
                {
                  "x": 158.7095343254858,
                  "y": 103.5952197959822,
                  "width": 166.6666600439286,
                  "height": 272.2222114050834,
                  "coordinateType": "PERCENTAGE"
                }
              ]
            }
          ]
        }
      ]
    },
    "designApplication": {
      "hasDesign": true,
      "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752064540/vendor-designs/vendor_2_design_1752064537980.png",
      "designCloudinaryPublicId": "vendor-designs/vendor_2_design_1752064537980",
      "positioning": "CENTER",
      "scale": 0.6,
      "mode": "PRESERVED"
    },
    "design": {
      "id": 9,
      "name": "solo-leveling-logo-01",
      "description": "",
      "category": "LOGO",
      "imageUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752064540/vendor-designs/vendor_2_design_1752064537980.png",
      "cloudinaryPublicId": "vendor-designs/vendor_2_design_1752064537980",
      "tags": [],
      "isValidated": false,
      "validatedAt": null,
      "createdAt": "2025-07-09T12:35:44.391Z"
    },
    "designTransforms": [
      {
        "id": 21,
        "designUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1752064540/vendor-designs/vendor_2_design_1752064537980.png",
        "transforms": {
          "0": {
            "x": 70,
            "y": -52,
            "scale": 0.5083333333333333
          }
        },
        "lastModified": "2025-07-10T18:19:09.954Z",
        "createdAt": "2025-07-10T18:19:10.007Z"
      }
    ],
    "designPositions": [
      {
        "designId": 9,
        "position": {
          "x": 70,
          "y": -52,
          "scale": 0.5083333333333333,
          "rotation": 0,
          "constraints": {}
        },
        "createdAt": "2025-07-10T18:19:09.895Z",
        "updatedAt": "2025-07-10T18:19:10.032Z"
      }
    ],
    "vendor": {
      "id": 2,
      "fullName": "Tasha Faly",
      "shop_name": "Papa Faly"
    },
    "selectedSizes": [
      { "id": 1, "sizeName": "XS" },
      { "id": 2, "sizeName": "S" },
      { "id": 3, "sizeName": "M" },
      { "id": 4, "sizeName": "L" },
      { "id": 5, "sizeName": "XL" },
      { "id": 6, "sizeName": "XXL" },
      { "id": 7, "sizeName": "3XL" }
    ],
    "selectedColors": [
      { "id": 1, "name": "Blanc", "colorCode": "#e5e6e1" },
      { "id": 2, "name": "Blue", "colorCode": "#2a68a7" },
      { "id": 3, "name": "Noir", "colorCode": "#000000" },
      { "id": 4, "name": "Rouge", "colorCode": "#b42827" }
    ],
    "designId": 9,
    "createdAt": "2025-07-10T18:19:09.866Z",
    "updatedAt": "2025-07-10T18:19:09.866Z"
  },
  "architecture": "v2_preserved_admin"
}
```

---

## Utilisation rapide

* **Image produit** : `data.adminProduct.colorVariations[x].images[0].url`
* **Design PNG**       : `data.designApplication.designUrl`
* **Position**         : `data.designPositions[0].position`
* **Transforms (historique)** : `data.designTransforms`

Copiez-collez ces valeurs dans votre composant d’affichage pour superposer le design comme indiqué dans le guide « Affichage du Design ».

> Dernière mise à jour : 2025-07-10 