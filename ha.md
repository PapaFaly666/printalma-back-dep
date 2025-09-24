Curl

curl -X 'GET' \
  'http://localhost:3004/admin/products/validation' \
  -H 'accept: application/json'
Request URL
http://localhost:3004/admin/products/validation
Server response
Code	Details
200	
Response body
Download
{
  "success": true,
  "message": "Produits en attente récupérés avec succès",
  "data": {
    "products": [
      {
        "id": 173,
        "vendorName": "carre",
        "vendorDescription": "dddddd",
        "vendorPrice": 12000,
        "vendorStock": 10,
        "status": "DRAFT",
        "isValidated": false,
        "validatedAt": null,
        "validatedBy": null,
        "postValidationAction": "AUTO_PUBLISH",
        "designCloudinaryUrl": null,
        "rejectionReason": null,
        "isWizardProduct": true,
        "productType": "WIZARD",
        "hasDesign": false,
        "adminProductName": "Mugs",
        "baseProduct": {
          "id": 33,
          "name": "Mugs"
        },
        "createdAt": "2025-09-24T15:08:12.257Z",
        "updatedAt": "2025-09-24T15:08:12.257Z",
        "vendor": {
          "id": 7,
          "firstName": "Papa ",
          "lastName": "Diagne",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré"
        },
        "vendorImages": [
          {
            "id": 483,
            "imageType": "base",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758726488/wizard-products/wizard-base-1758726487537.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          },
          {
            "id": 484,
            "imageType": "detail",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758726489/wizard-products/wizard-detail-1758726489203-1.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          },
          {
            "id": 485,
            "imageType": "detail",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758726491/wizard-products/wizard-detail-1758726490911-2.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          }
        ],
        "adminProductDetails": null,
        "selectedColors": [],
        "selectedSizes": []
      },
      {
        "id": 172,
        "vendorName": "carre",
        "vendorDescription": "gergreg gegre",
        "vendorPrice": 10000,
        "vendorStock": 10,
        "status": "PUBLISHED",
        "isValidated": false,
        "validatedAt": null,
        "validatedBy": null,
        "postValidationAction": "AUTO_PUBLISH",
        "designCloudinaryUrl": null,
        "rejectionReason": null,
        "isWizardProduct": true,
        "productType": "WIZARD",
        "hasDesign": false,
        "adminProductName": "Polo",
        "baseProduct": {
          "id": 34,
          "name": "Polo"
        },
        "createdAt": "2025-09-24T14:53:18.220Z",
        "updatedAt": "2025-09-24T14:53:18.220Z",
        "vendor": {
          "id": 7,
          "firstName": "Papa ",
          "lastName": "Diagne",
          "email": "pf.d@zig.univ.sn",
          "shop_name": "C'est carré"
        },
        "vendorImages": [
          {
            "id": 480,
            "imageType": "base",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758725595/wizard-products/wizard-base-1758725594043.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          },
          {
            "id": 481,
            "imageType": "detail",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758725596/wizard-products/wizard-detail-1758725595845-1.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          },
          {
            "id": 482,
            "imageType": "detail",
            "cloudinaryUrl": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1758725597/wizard-products/wizard-detail-1758725596903-2.jpg",
            "colorName": null,
            "colorCode": null,
            "width": 800,
            "height": 800
          }
        ],
        "adminProductDetails": null,
        "selectedColors": [],
        "selectedSizes": []
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 2,
      "itemsPerPage": 20,
      "hasNext": false,
      "hasPrevious": false
    },
    "stats": {
      "pending": 0,
      "validated": 0,
      "rejected": 0,
      "total": 0,
      "wizardProducts": 2,
      "traditionalProducts": 0
    }
  }
}