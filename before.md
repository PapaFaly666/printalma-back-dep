Curl

curl -X 'GET' \
  'http://localhost:3004/products' \
  -H 'accept: */*'
Request URL
http://localhost:3004/products
Server response
Code	Details
200	
Response body
Download
{
  "success": true,
  "data": [
    {
      "id": 14,
      "name": "Colton Gonzales",
      "description": "Autem nulla consequa",
      "price": 100,
      "stock": 5,
      "status": "PUBLISHED",
      "createdAt": "2025-10-15T02:39:08.404Z",
      "updatedAt": "2025-10-15T02:39:08.404Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": false,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 367,
      "categoryId": null,
      "subCategoryId": null,
      "variationId": null,
      "categories": [
        {
          "id": 8,
          "name": "test categorie",
          "slug": "test-categorie",
          "description": "",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-15T02:37:36.617Z",
          "updatedAt": "2025-10-15T02:37:36.617Z"
        }
      ],
      "sizes": [
        {
          "id": 40,
          "productId": 14,
          "sizeName": "var1"
        },
        {
          "id": 41,
          "productId": 14,
          "sizeName": "var2"
        }
      ],
      "stocks": [
        {
          "id": 88,
          "productId": 14,
          "colorId": 24,
          "sizeName": "var1",
          "stock": 1,
          "createdAt": "2025-10-15T02:39:11.019Z",
          "updatedAt": "2025-10-15T02:39:11.019Z"
        },
        {
          "id": 89,
          "productId": 14,
          "colorId": 24,
          "sizeName": "var2",
          "stock": 2,
          "createdAt": "2025-10-15T02:39:11.019Z",
          "updatedAt": "2025-10-15T02:39:11.019Z"
        }
      ],
      "subCategory": null,
      "variation": null,
      "colorVariations": [
        {
          "id": 24,
          "name": "jl",
          "colorCode": "#ffffff",
          "productId": 14,
          "images": [
            {
              "id": 24,
              "view": "Front",
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1760495945/printalma/1760495944597-IMG_7410.png",
              "publicId": "printalma/1760495944597-IMG_7410",
              "naturalWidth": 1200,
              "naturalHeight": 900,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 24,
              "delimitations": [
                {
                  "id": 7,
                  "x": 446.2003960132513,
                  "y": 289.2613718886512,
                  "width": 584.9999873204669,
                  "height": 379.9999917637221,
                  "rotation": 0,
                  "name": null,
                  "coordinateType": "PERCENTAGE",
                  "absoluteX": null,
                  "absoluteY": null,
                  "absoluteWidth": null,
                  "absoluteHeight": null,
                  "originalImageWidth": 1200,
                  "originalImageHeight": 900,
                  "productImageId": 24,
                  "createdAt": "2025-10-15T02:39:09.404Z",
                  "updatedAt": "2025-10-15T02:39:09.404Z",
                  "referenceWidth": 1200,
                  "referenceHeight": 900
                }
              ],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "var1",
              "stock": 1
            },
            {
              "sizeName": "var2",
              "stock": 2
            }
          ]
        }
      ],
      "hasDelimitations": true
    },
    {
      "id": 13,
      "name": "Colton Gonzales",
      "description": "Autem nulla consequa",
      "price": 100,
      "stock": 5,
      "status": "PUBLISHED",
      "createdAt": "2025-10-15T02:39:07.000Z",
      "updatedAt": "2025-10-15T02:39:07.000Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": false,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 367,
      "categoryId": null,
      "subCategoryId": null,
      "variationId": null,
      "categories": [
        {
          "id": 8,
          "name": "test categorie",
          "slug": "test-categorie",
          "description": "",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-15T02:37:36.617Z",
          "updatedAt": "2025-10-15T02:37:36.617Z"
        }
      ],
      "sizes": [
        {
          "id": 38,
          "productId": 13,
          "sizeName": "var1"
        },
        {
          "id": 39,
          "productId": 13,
          "sizeName": "var2"
        }
      ],
      "stocks": [
        {
          "id": 86,
          "productId": 13,
          "colorId": 23,
          "sizeName": "var1",
          "stock": 1,
          "createdAt": "2025-10-15T02:39:09.050Z",
          "updatedAt": "2025-10-15T02:39:09.050Z"
        },
        {
          "id": 87,
          "productId": 13,
          "colorId": 23,
          "sizeName": "var2",
          "stock": 2,
          "createdAt": "2025-10-15T02:39:09.050Z",
          "updatedAt": "2025-10-15T02:39:09.050Z"
        }
      ],
      "subCategory": null,
      "variation": null,
      "colorVariations": [
        {
          "id": 23,
          "name": "jl",
          "colorCode": "#ffffff",
          "productId": 13,
          "images": [
            {
              "id": 23,
              "view": "Front",
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1760495944/printalma/1760495944162-IMG_7410.png",
              "publicId": "printalma/1760495944162-IMG_7410",
              "naturalWidth": 1200,
              "naturalHeight": 900,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 23,
              "delimitations": [
                {
                  "id": 6,
                  "x": 446.2003960132513,
                  "y": 289.2613718886512,
                  "width": 584.9999873204669,
                  "height": 379.9999917637221,
                  "rotation": 0,
                  "name": null,
                  "coordinateType": "PERCENTAGE",
                  "absoluteX": null,
                  "absoluteY": null,
                  "absoluteWidth": null,
                  "absoluteHeight": null,
                  "originalImageWidth": 1200,
                  "originalImageHeight": 900,
                  "productImageId": 23,
                  "createdAt": "2025-10-15T02:39:07.510Z",
                  "updatedAt": "2025-10-15T02:39:07.510Z",
                  "referenceWidth": 1200,
                  "referenceHeight": 900
                }
              ],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "var1",
              "stock": 1
            },
            {
              "sizeName": "var2",
              "stock": 2
            }
          ]
        }
      ],
      "hasDelimitations": true
    },
    {
      "id": 12,
      "name": "Isaac Joseph",
      "description": "Unde in at doloribus",
      "price": 410,
      "stock": 79,
      "status": "PUBLISHED",
      "createdAt": "2025-10-15T02:34:43.691Z",
      "updatedAt": "2025-10-15T02:34:43.691Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": false,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 755,
      "categoryId": null,
      "subCategoryId": null,
      "variationId": null,
      "categories": [
        {
          "id": 5,
          "name": "Vêtementss",
          "slug": "vetementss",
          "description": "efzsss",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T16:18:44.392Z",
          "updatedAt": "2025-10-14T17:44:26.182Z"
        }
      ],
      "sizes": [
        {
          "id": 36,
          "productId": 12,
          "sizeName": "dsd"
        },
        {
          "id": 37,
          "productId": 12,
          "sizeName": "gfgdfCarre"
        }
      ],
      "stocks": [
        {
          "id": 84,
          "productId": 12,
          "colorId": 22,
          "sizeName": "dsd",
          "stock": 3,
          "createdAt": "2025-10-15T02:34:48.986Z",
          "updatedAt": "2025-10-15T02:34:48.986Z"
        },
        {
          "id": 85,
          "productId": 12,
          "colorId": 22,
          "sizeName": "gfgdfCarre",
          "stock": 4,
          "createdAt": "2025-10-15T02:34:48.986Z",
          "updatedAt": "2025-10-15T02:34:48.986Z"
        }
      ],
      "subCategory": null,
      "variation": null,
      "colorVariations": [
        {
          "id": 22,
          "name": "fff",
          "colorCode": "#ffffff",
          "productId": 12,
          "images": [
            {
              "id": 22,
              "view": "Front",
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1760495682/printalma/1760495681817-resp.png",
              "publicId": "printalma/1760495681817-resp",
              "naturalWidth": 1200,
              "naturalHeight": 207,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 22,
              "delimitations": [
                {
                  "id": 5,
                  "x": 298.8448000204608,
                  "y": 40.62121772262552,
                  "width": 619.9999865618622,
                  "height": 211.1111065354011,
                  "rotation": 0,
                  "name": null,
                  "coordinateType": "PERCENTAGE",
                  "absoluteX": null,
                  "absoluteY": null,
                  "absoluteWidth": null,
                  "absoluteHeight": null,
                  "originalImageWidth": 1200,
                  "originalImageHeight": 207,
                  "productImageId": 22,
                  "createdAt": "2025-10-15T02:34:44.741Z",
                  "updatedAt": "2025-10-15T02:34:44.741Z",
                  "referenceWidth": 1200,
                  "referenceHeight": 207
                }
              ],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "dsd",
              "stock": 3
            },
            {
              "sizeName": "gfgdfCarre",
              "stock": 4
            }
          ]
        }
      ],
      "hasDelimitations": true
    },
    {
      "id": 11,
      "name": "Leilani Klein",
      "description": "Elit ex cupiditate ",
      "price": 206,
      "stock": 93,
      "status": "PUBLISHED",
      "createdAt": "2025-10-15T02:11:59.164Z",
      "updatedAt": "2025-10-15T02:11:59.164Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": false,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 438,
      "categoryId": null,
      "subCategoryId": null,
      "variationId": null,
      "categories": [
        {
          "id": 4,
          "name": "Vêtements",
          "slug": "vetements",
          "description": "dzedzed",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T12:27:39.817Z",
          "updatedAt": "2025-10-13T12:27:39.817Z"
        }
      ],
      "sizes": [
        {
          "id": 34,
          "productId": 11,
          "sizeName": "Col Rond"
        },
        {
          "id": 35,
          "productId": 11,
          "sizeName": "Col V"
        }
      ],
      "stocks": [
        {
          "id": 82,
          "productId": 11,
          "colorId": 21,
          "sizeName": "Col Rond",
          "stock": 3,
          "createdAt": "2025-10-15T02:12:03.814Z",
          "updatedAt": "2025-10-15T02:12:03.814Z"
        },
        {
          "id": 83,
          "productId": 11,
          "colorId": 21,
          "sizeName": "Col V",
          "stock": 10,
          "createdAt": "2025-10-15T02:12:03.814Z",
          "updatedAt": "2025-10-15T02:12:03.814Z"
        }
      ],
      "subCategory": null,
      "variation": null,
      "colorVariations": [
        {
          "id": 21,
          "name": "ggg",
          "colorCode": "#ffffff",
          "productId": 11,
          "images": [
            {
              "id": 21,
              "view": "Front",
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1760494317/printalma/1760494316650-dash.png",
              "publicId": "printalma/1760494316650-dash",
              "naturalWidth": 1200,
              "naturalHeight": 582,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 21,
              "delimitations": [
                {
                  "id": 4,
                  "x": 338.844799153484,
                  "y": 79.2323320608164,
                  "width": 588.8888761250663,
                  "height": 413.3333243745749,
                  "rotation": 0,
                  "name": null,
                  "coordinateType": "PERCENTAGE",
                  "absoluteX": null,
                  "absoluteY": null,
                  "absoluteWidth": null,
                  "absoluteHeight": null,
                  "originalImageWidth": 1200,
                  "originalImageHeight": 582,
                  "productImageId": 21,
                  "createdAt": "2025-10-15T02:12:00.232Z",
                  "updatedAt": "2025-10-15T02:12:00.232Z",
                  "referenceWidth": 1200,
                  "referenceHeight": 582
                }
              ],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "Col Rond",
              "stock": 3
            },
            {
              "sizeName": "Col V",
              "stock": 10
            }
          ]
        }
      ],
      "hasDelimitations": true
    },
    {
      "id": 10,
      "name": "Cameron Mcbride",
      "description": "Qui velit officiis n",
      "price": 858,
      "stock": 26,
      "status": "PUBLISHED",
      "createdAt": "2025-10-14T18:27:27.136Z",
      "updatedAt": "2025-10-14T18:27:27.136Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": false,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 818,
      "categoryId": null,
      "subCategoryId": null,
      "variationId": null,
      "categories": [
        {
          "id": 5,
          "name": "Vêtementss",
          "slug": "vetementss",
          "description": "efzsss",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T16:18:44.392Z",
          "updatedAt": "2025-10-14T17:44:26.182Z"
        }
      ],
      "sizes": [
        {
          "id": 33,
          "productId": 10,
          "sizeName": "gfgdf"
        }
      ],
      "stocks": [
        {
          "id": 81,
          "productId": 10,
          "colorId": 20,
          "sizeName": "gfgdf",
          "stock": 6,
          "createdAt": "2025-10-14T18:27:31.782Z",
          "updatedAt": "2025-10-14T18:27:31.782Z"
        }
      ],
      "subCategory": null,
      "variation": null,
      "colorVariations": [
        {
          "id": 20,
          "name": "rfre",
          "colorCode": "#ffffff",
          "productId": 10,
          "images": [
            {
              "id": 19,
              "view": "Front",
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1760466445/printalma/1760466445279-sweat-baayFall-Blanc.jpg",
              "publicId": "printalma/1760466445279-sweat-baayFall-Blanc",
              "naturalWidth": 1200,
              "naturalHeight": 960,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 20,
              "delimitations": [
                {
                  "id": 2,
                  "x": 419.9470894275921,
                  "y": 249.8787979527937,
                  "width": 343.9999925440009,
                  "height": 338.6666593262646,
                  "rotation": 0,
                  "name": null,
                  "coordinateType": "PERCENTAGE",
                  "absoluteX": null,
                  "absoluteY": null,
                  "absoluteWidth": null,
                  "absoluteHeight": null,
                  "originalImageWidth": 1200,
                  "originalImageHeight": 960,
                  "productImageId": 19,
                  "createdAt": "2025-10-14T18:27:28.157Z",
                  "updatedAt": "2025-10-14T18:27:28.157Z",
                  "referenceWidth": 1200,
                  "referenceHeight": 960
                }
              ],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "gfgdf",
              "stock": 6
            }
          ]
        }
      ],
      "hasDelimitations": true
    },
    {
      "id": 9,
      "name": "Cameron Mcbride",
      "description": "Qui velit officiis n",
      "price": 858,
      "stock": 26,
      "status": "PUBLISHED",
      "createdAt": "2025-10-14T18:27:27.111Z",
      "updatedAt": "2025-10-14T18:27:27.111Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": false,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 818,
      "categoryId": null,
      "subCategoryId": null,
      "variationId": null,
      "categories": [
        {
          "id": 5,
          "name": "Vêtementss",
          "slug": "vetementss",
          "description": "efzsss",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T16:18:44.392Z",
          "updatedAt": "2025-10-14T17:44:26.182Z"
        }
      ],
      "sizes": [
        {
          "id": 32,
          "productId": 9,
          "sizeName": "gfgdf"
        }
      ],
      "stocks": [
        {
          "id": 80,
          "productId": 9,
          "colorId": 19,
          "sizeName": "gfgdf",
          "stock": 6,
          "createdAt": "2025-10-14T18:27:31.067Z",
          "updatedAt": "2025-10-14T18:27:31.067Z"
        }
      ],
      "subCategory": null,
      "variation": null,
      "colorVariations": [
        {
          "id": 19,
          "name": "rfre",
          "colorCode": "#ffffff",
          "productId": 9,
          "images": [
            {
              "id": 20,
              "view": "Front",
              "url": "https://res.cloudinary.com/dsxab4qnu/image/upload/v1760466446/printalma/1760466445632-sweat-baayFall-Blanc.jpg",
              "publicId": "printalma/1760466445632-sweat-baayFall-Blanc",
              "naturalWidth": 1200,
              "naturalHeight": 960,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 19,
              "delimitations": [
                {
                  "id": 3,
                  "x": 419.9470894275921,
                  "y": 249.8787979527937,
                  "width": 343.9999925440009,
                  "height": 338.6666593262646,
                  "rotation": 0,
                  "name": null,
                  "coordinateType": "PERCENTAGE",
                  "absoluteX": null,
                  "absoluteY": null,
                  "absoluteWidth": null,
                  "absoluteHeight": null,
                  "originalImageWidth": 1200,
                  "originalImageHeight": 960,
                  "productImageId": 20,
                  "createdAt": "2025-10-14T18:27:28.158Z",
                  "updatedAt": "2025-10-14T18:27:28.158Z",
                  "referenceWidth": 1200,
                  "referenceHeight": 960
                }
              ],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "gfgdf",
              "stock": 6
            }
          ]
        }
      ],
      "hasDelimitations": true
    },
    {
      "id": 8,
      "name": "Tote Bag Canvas",
      "description": "Sac en toile de coton naturel, grande capacité",
      "price": 12.99,
      "stock": 200,
      "status": "PUBLISHED",
      "createdAt": "2025-10-14T01:15:46.627Z",
      "updatedAt": "2025-10-14T01:15:46.627Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": true,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 19.99,
      "categoryId": 6,
      "subCategoryId": 9,
      "variationId": null,
      "categories": [
        {
          "id": 6,
          "name": "Accessoires",
          "slug": "accessoires",
          "description": "Accessoires personnalisables",
          "displayOrder": 2,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-14T01:13:51.362Z",
          "updatedAt": "2025-10-14T01:13:51.362Z"
        }
      ],
      "sizes": [
        {
          "id": 31,
          "productId": 8,
          "sizeName": "Unique"
        }
      ],
      "stocks": [
        {
          "id": 79,
          "productId": 8,
          "colorId": 18,
          "sizeName": "Unique",
          "stock": 100,
          "createdAt": "2025-10-14T01:15:48.262Z",
          "updatedAt": "2025-10-14T01:15:48.262Z"
        }
      ],
      "subCategory": {
        "id": 9,
        "name": "Sacs Premium Test",
        "slug": "sacs-premium-test",
        "description": "Collection de sacs premium test",
        "categoryId": 6,
        "displayOrder": 1,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:55.907Z",
        "updatedAt": "2025-10-15T01:57:57.974Z"
      },
      "variation": null,
      "colorVariations": [
        {
          "id": 18,
          "name": "Naturel",
          "colorCode": "#F5F5DC",
          "productId": 8,
          "images": [
            {
              "id": 18,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/F5F5DC/F5F5DC?text=Tote%20Bag%20Canvas",
              "publicId": "product_8_naturel_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 18,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "Unique",
              "stock": 100
            }
          ]
        }
      ],
      "hasDelimitations": false
    },
    {
      "id": 7,
      "name": "Jogging Confort",
      "description": "Pantalon de jogging en coton, taille élastique",
      "price": 28.99,
      "stock": 70,
      "status": "PUBLISHED",
      "createdAt": "2025-10-14T01:15:41.404Z",
      "updatedAt": "2025-10-14T01:15:41.404Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": true,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 39.99,
      "categoryId": 4,
      "subCategoryId": 8,
      "variationId": null,
      "categories": [
        {
          "id": 4,
          "name": "Vêtements",
          "slug": "vetements",
          "description": "dzedzed",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T12:27:39.817Z",
          "updatedAt": "2025-10-13T12:27:39.817Z"
        }
      ],
      "sizes": [
        {
          "id": 27,
          "productId": 7,
          "sizeName": "S"
        },
        {
          "id": 28,
          "productId": 7,
          "sizeName": "M"
        },
        {
          "id": 29,
          "productId": 7,
          "sizeName": "L"
        },
        {
          "id": 30,
          "productId": 7,
          "sizeName": "XL"
        }
      ],
      "stocks": [
        {
          "id": 67,
          "productId": 7,
          "colorId": 15,
          "sizeName": "S",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:43.451Z",
          "updatedAt": "2025-10-14T01:15:43.451Z"
        },
        {
          "id": 68,
          "productId": 7,
          "colorId": 15,
          "sizeName": "M",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:43.657Z",
          "updatedAt": "2025-10-14T01:15:43.657Z"
        },
        {
          "id": 69,
          "productId": 7,
          "colorId": 15,
          "sizeName": "L",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:43.859Z",
          "updatedAt": "2025-10-14T01:15:43.859Z"
        },
        {
          "id": 70,
          "productId": 7,
          "colorId": 15,
          "sizeName": "XL",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:44.066Z",
          "updatedAt": "2025-10-14T01:15:44.066Z"
        },
        {
          "id": 71,
          "productId": 7,
          "colorId": 16,
          "sizeName": "S",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:44.577Z",
          "updatedAt": "2025-10-14T01:15:44.577Z"
        },
        {
          "id": 72,
          "productId": 7,
          "colorId": 16,
          "sizeName": "M",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:44.782Z",
          "updatedAt": "2025-10-14T01:15:44.782Z"
        },
        {
          "id": 73,
          "productId": 7,
          "colorId": 16,
          "sizeName": "L",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:44.987Z",
          "updatedAt": "2025-10-14T01:15:44.987Z"
        },
        {
          "id": 74,
          "productId": 7,
          "colorId": 16,
          "sizeName": "XL",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:45.184Z",
          "updatedAt": "2025-10-14T01:15:45.184Z"
        },
        {
          "id": 75,
          "productId": 7,
          "colorId": 17,
          "sizeName": "S",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:45.908Z",
          "updatedAt": "2025-10-14T01:15:45.908Z"
        },
        {
          "id": 76,
          "productId": 7,
          "colorId": 17,
          "sizeName": "M",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:46.113Z",
          "updatedAt": "2025-10-14T01:15:46.113Z"
        },
        {
          "id": 77,
          "productId": 7,
          "colorId": 17,
          "sizeName": "L",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:46.256Z",
          "updatedAt": "2025-10-14T01:15:46.256Z"
        },
        {
          "id": 78,
          "productId": 7,
          "colorId": 17,
          "sizeName": "XL",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:46.400Z",
          "updatedAt": "2025-10-14T01:15:46.400Z"
        }
      ],
      "subCategory": {
        "id": 8,
        "name": "Pantalons",
        "slug": "pantalons",
        "description": "Pantalons et jeans personnalisables",
        "categoryId": 4,
        "displayOrder": 3,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:55.010Z",
        "updatedAt": "2025-10-14T01:13:55.010Z"
      },
      "variation": null,
      "colorVariations": [
        {
          "id": 15,
          "name": "Noir",
          "colorCode": "#000000",
          "productId": 7,
          "images": [
            {
              "id": 15,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/000000/000000?text=Jogging%20Confort",
              "publicId": "product_7_noir_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 15,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 5
            },
            {
              "sizeName": "M",
              "stock": 5
            },
            {
              "sizeName": "L",
              "stock": 5
            },
            {
              "sizeName": "XL",
              "stock": 5
            }
          ]
        },
        {
          "id": 16,
          "name": "Gris",
          "colorCode": "#808080",
          "productId": 7,
          "images": [
            {
              "id": 16,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/808080/808080?text=Jogging%20Confort",
              "publicId": "product_7_gris_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 16,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 5
            },
            {
              "sizeName": "M",
              "stock": 5
            },
            {
              "sizeName": "L",
              "stock": 5
            },
            {
              "sizeName": "XL",
              "stock": 5
            }
          ]
        },
        {
          "id": 17,
          "name": "Marine",
          "colorCode": "#000080",
          "productId": 7,
          "images": [
            {
              "id": 17,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/000080/000080?text=Jogging%20Confort",
              "publicId": "product_7_marine_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 17,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 5
            },
            {
              "sizeName": "M",
              "stock": 5
            },
            {
              "sizeName": "L",
              "stock": 5
            },
            {
              "sizeName": "XL",
              "stock": 5
            }
          ]
        }
      ],
      "hasDelimitations": false
    },
    {
      "id": 6,
      "name": "Zip Hoodie Premium",
      "description": "Sweat zippé haut de gamme, doublure polaire",
      "price": 42.99,
      "stock": 60,
      "status": "PUBLISHED",
      "createdAt": "2025-10-14T01:15:37.479Z",
      "updatedAt": "2025-10-14T01:15:37.479Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": true,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 59.99,
      "categoryId": 4,
      "subCategoryId": 7,
      "variationId": 16,
      "categories": [
        {
          "id": 4,
          "name": "Vêtements",
          "slug": "vetements",
          "description": "dzedzed",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T12:27:39.817Z",
          "updatedAt": "2025-10-13T12:27:39.817Z"
        }
      ],
      "sizes": [
        {
          "id": 23,
          "productId": 6,
          "sizeName": "S"
        },
        {
          "id": 24,
          "productId": 6,
          "sizeName": "M"
        },
        {
          "id": 25,
          "productId": 6,
          "sizeName": "L"
        },
        {
          "id": 26,
          "productId": 6,
          "sizeName": "XL"
        }
      ],
      "stocks": [
        {
          "id": 59,
          "productId": 6,
          "colorId": 13,
          "sizeName": "S",
          "stock": 7,
          "createdAt": "2025-10-14T01:15:39.559Z",
          "updatedAt": "2025-10-14T01:15:39.559Z"
        },
        {
          "id": 60,
          "productId": 6,
          "colorId": 13,
          "sizeName": "M",
          "stock": 7,
          "createdAt": "2025-10-14T01:15:39.764Z",
          "updatedAt": "2025-10-14T01:15:39.764Z"
        },
        {
          "id": 61,
          "productId": 6,
          "colorId": 13,
          "sizeName": "L",
          "stock": 7,
          "createdAt": "2025-10-14T01:15:39.968Z",
          "updatedAt": "2025-10-14T01:15:39.968Z"
        },
        {
          "id": 62,
          "productId": 6,
          "colorId": 13,
          "sizeName": "XL",
          "stock": 7,
          "createdAt": "2025-10-14T01:15:40.112Z",
          "updatedAt": "2025-10-14T01:15:40.112Z"
        },
        {
          "id": 63,
          "productId": 6,
          "colorId": 14,
          "sizeName": "S",
          "stock": 7,
          "createdAt": "2025-10-14T01:15:40.686Z",
          "updatedAt": "2025-10-14T01:15:40.686Z"
        },
        {
          "id": 64,
          "productId": 6,
          "colorId": 14,
          "sizeName": "M",
          "stock": 7,
          "createdAt": "2025-10-14T01:15:40.892Z",
          "updatedAt": "2025-10-14T01:15:40.892Z"
        },
        {
          "id": 65,
          "productId": 6,
          "colorId": 14,
          "sizeName": "L",
          "stock": 7,
          "createdAt": "2025-10-14T01:15:41.097Z",
          "updatedAt": "2025-10-14T01:15:41.097Z"
        },
        {
          "id": 66,
          "productId": 6,
          "colorId": 14,
          "sizeName": "XL",
          "stock": 7,
          "createdAt": "2025-10-14T01:15:41.240Z",
          "updatedAt": "2025-10-14T01:15:41.240Z"
        }
      ],
      "subCategory": {
        "id": 7,
        "name": "Sweats",
        "slug": "sweats",
        "description": "Sweats et hoodies personnalisables",
        "categoryId": 4,
        "displayOrder": 2,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:54.172Z",
        "updatedAt": "2025-10-14T01:13:54.172Z"
      },
      "variation": {
        "id": 16,
        "name": "Zip Hoodie",
        "slug": "zip-hoodie",
        "description": "Sweat à capuche zippé",
        "subCategoryId": 7,
        "displayOrder": 2,
        "isActive": true,
        "createdAt": "2025-10-14T01:14:01.192Z",
        "updatedAt": "2025-10-14T01:14:01.192Z"
      },
      "colorVariations": [
        {
          "id": 13,
          "name": "Noir",
          "colorCode": "#000000",
          "productId": 6,
          "images": [
            {
              "id": 13,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/000000/000000?text=Zip%20Hoodie%20Premium",
              "publicId": "product_6_noir_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 13,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 7
            },
            {
              "sizeName": "M",
              "stock": 7
            },
            {
              "sizeName": "L",
              "stock": 7
            },
            {
              "sizeName": "XL",
              "stock": 7
            }
          ]
        },
        {
          "id": 14,
          "name": "Gris",
          "colorCode": "#808080",
          "productId": 6,
          "images": [
            {
              "id": 14,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/808080/808080?text=Zip%20Hoodie%20Premium",
              "publicId": "product_6_gris_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 14,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 7
            },
            {
              "sizeName": "M",
              "stock": 7
            },
            {
              "sizeName": "L",
              "stock": 7
            },
            {
              "sizeName": "XL",
              "stock": 7
            }
          ]
        }
      ],
      "hasDelimitations": false
    },
    {
      "id": 5,
      "name": "Hoodie Classique",
      "description": "Sweat à capuche confortable avec poche kangourou",
      "price": 35.99,
      "stock": 80,
      "status": "PUBLISHED",
      "createdAt": "2025-10-14T01:15:32.061Z",
      "updatedAt": "2025-10-14T01:15:32.061Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": true,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 49.99,
      "categoryId": 4,
      "subCategoryId": 7,
      "variationId": 15,
      "categories": [
        {
          "id": 4,
          "name": "Vêtements",
          "slug": "vetements",
          "description": "dzedzed",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T12:27:39.817Z",
          "updatedAt": "2025-10-13T12:27:39.817Z"
        }
      ],
      "sizes": [
        {
          "id": 18,
          "productId": 5,
          "sizeName": "S"
        },
        {
          "id": 19,
          "productId": 5,
          "sizeName": "M"
        },
        {
          "id": 20,
          "productId": 5,
          "sizeName": "L"
        },
        {
          "id": 21,
          "productId": 5,
          "sizeName": "XL"
        },
        {
          "id": 22,
          "productId": 5,
          "sizeName": "XXL"
        }
      ],
      "stocks": [
        {
          "id": 44,
          "productId": 5,
          "colorId": 10,
          "sizeName": "S",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:34.258Z",
          "updatedAt": "2025-10-14T01:15:34.258Z"
        },
        {
          "id": 45,
          "productId": 5,
          "colorId": 10,
          "sizeName": "M",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:34.401Z",
          "updatedAt": "2025-10-14T01:15:34.401Z"
        },
        {
          "id": 46,
          "productId": 5,
          "colorId": 10,
          "sizeName": "L",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:34.551Z",
          "updatedAt": "2025-10-14T01:15:34.551Z"
        },
        {
          "id": 47,
          "productId": 5,
          "colorId": 10,
          "sizeName": "XL",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:34.747Z",
          "updatedAt": "2025-10-14T01:15:34.747Z"
        },
        {
          "id": 48,
          "productId": 5,
          "colorId": 10,
          "sizeName": "XXL",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:34.951Z",
          "updatedAt": "2025-10-14T01:15:34.951Z"
        },
        {
          "id": 49,
          "productId": 5,
          "colorId": 11,
          "sizeName": "S",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:35.464Z",
          "updatedAt": "2025-10-14T01:15:35.464Z"
        },
        {
          "id": 50,
          "productId": 5,
          "colorId": 11,
          "sizeName": "M",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:35.668Z",
          "updatedAt": "2025-10-14T01:15:35.668Z"
        },
        {
          "id": 51,
          "productId": 5,
          "colorId": 11,
          "sizeName": "L",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:35.873Z",
          "updatedAt": "2025-10-14T01:15:35.873Z"
        },
        {
          "id": 52,
          "productId": 5,
          "colorId": 11,
          "sizeName": "XL",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:36.016Z",
          "updatedAt": "2025-10-14T01:15:36.016Z"
        },
        {
          "id": 53,
          "productId": 5,
          "colorId": 11,
          "sizeName": "XXL",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:36.162Z",
          "updatedAt": "2025-10-14T01:15:36.162Z"
        },
        {
          "id": 54,
          "productId": 5,
          "colorId": 12,
          "sizeName": "S",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:36.693Z",
          "updatedAt": "2025-10-14T01:15:36.693Z"
        },
        {
          "id": 55,
          "productId": 5,
          "colorId": 12,
          "sizeName": "M",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:36.898Z",
          "updatedAt": "2025-10-14T01:15:36.898Z"
        },
        {
          "id": 56,
          "productId": 5,
          "colorId": 12,
          "sizeName": "L",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:37.043Z",
          "updatedAt": "2025-10-14T01:15:37.043Z"
        },
        {
          "id": 57,
          "productId": 5,
          "colorId": 12,
          "sizeName": "XL",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:37.188Z",
          "updatedAt": "2025-10-14T01:15:37.188Z"
        },
        {
          "id": 58,
          "productId": 5,
          "colorId": 12,
          "sizeName": "XXL",
          "stock": 5,
          "createdAt": "2025-10-14T01:15:37.335Z",
          "updatedAt": "2025-10-14T01:15:37.335Z"
        }
      ],
      "subCategory": {
        "id": 7,
        "name": "Sweats",
        "slug": "sweats",
        "description": "Sweats et hoodies personnalisables",
        "categoryId": 4,
        "displayOrder": 2,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:54.172Z",
        "updatedAt": "2025-10-14T01:13:54.172Z"
      },
      "variation": {
        "id": 15,
        "name": "Hoodie",
        "slug": "hoodie",
        "description": "Sweat à capuche",
        "subCategoryId": 7,
        "displayOrder": 1,
        "isActive": true,
        "createdAt": "2025-10-14T01:14:00.336Z",
        "updatedAt": "2025-10-14T01:14:00.336Z"
      },
      "colorVariations": [
        {
          "id": 10,
          "name": "Noir",
          "colorCode": "#000000",
          "productId": 5,
          "images": [
            {
              "id": 10,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/000000/000000?text=Hoodie%20Classique",
              "publicId": "product_5_noir_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 10,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 5
            },
            {
              "sizeName": "M",
              "stock": 5
            },
            {
              "sizeName": "L",
              "stock": 5
            },
            {
              "sizeName": "XL",
              "stock": 5
            },
            {
              "sizeName": "XXL",
              "stock": 5
            }
          ]
        },
        {
          "id": 11,
          "name": "Gris Chiné",
          "colorCode": "#B0B0B0",
          "productId": 5,
          "images": [
            {
              "id": 11,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/B0B0B0/B0B0B0?text=Hoodie%20Classique",
              "publicId": "product_5_gris chiné_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 11,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 5
            },
            {
              "sizeName": "M",
              "stock": 5
            },
            {
              "sizeName": "L",
              "stock": 5
            },
            {
              "sizeName": "XL",
              "stock": 5
            },
            {
              "sizeName": "XXL",
              "stock": 5
            }
          ]
        },
        {
          "id": 12,
          "name": "Marine",
          "colorCode": "#000080",
          "productId": 5,
          "images": [
            {
              "id": 12,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/000080/000080?text=Hoodie%20Classique",
              "publicId": "product_5_marine_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 12,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 5
            },
            {
              "sizeName": "M",
              "stock": 5
            },
            {
              "sizeName": "L",
              "stock": 5
            },
            {
              "sizeName": "XL",
              "stock": 5
            },
            {
              "sizeName": "XXL",
              "stock": 5
            }
          ]
        }
      ],
      "hasDelimitations": false
    },
    {
      "id": 4,
      "name": "T-Shirt Manches Longues",
      "description": "T-shirt à manches longues, idéal pour toutes saisons",
      "price": 19.99,
      "stock": 100,
      "status": "PUBLISHED",
      "createdAt": "2025-10-14T01:15:27.851Z",
      "updatedAt": "2025-10-14T01:15:27.851Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": true,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 29.99,
      "categoryId": 4,
      "subCategoryId": 6,
      "variationId": 14,
      "categories": [
        {
          "id": 4,
          "name": "Vêtements",
          "slug": "vetements",
          "description": "dzedzed",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T12:27:39.817Z",
          "updatedAt": "2025-10-13T12:27:39.817Z"
        }
      ],
      "sizes": [
        {
          "id": 14,
          "productId": 4,
          "sizeName": "S"
        },
        {
          "id": 15,
          "productId": 4,
          "sizeName": "M"
        },
        {
          "id": 16,
          "productId": 4,
          "sizeName": "L"
        },
        {
          "id": 17,
          "productId": 4,
          "sizeName": "XL"
        }
      ],
      "stocks": [
        {
          "id": 36,
          "productId": 4,
          "colorId": 8,
          "sizeName": "S",
          "stock": 12,
          "createdAt": "2025-10-14T01:15:30.022Z",
          "updatedAt": "2025-10-14T01:15:30.022Z"
        },
        {
          "id": 37,
          "productId": 4,
          "colorId": 8,
          "sizeName": "M",
          "stock": 12,
          "createdAt": "2025-10-14T01:15:30.244Z",
          "updatedAt": "2025-10-14T01:15:30.244Z"
        },
        {
          "id": 38,
          "productId": 4,
          "colorId": 8,
          "sizeName": "L",
          "stock": 12,
          "createdAt": "2025-10-14T01:15:30.651Z",
          "updatedAt": "2025-10-14T01:15:30.651Z"
        },
        {
          "id": 39,
          "productId": 4,
          "colorId": 8,
          "sizeName": "XL",
          "stock": 12,
          "createdAt": "2025-10-14T01:15:30.846Z",
          "updatedAt": "2025-10-14T01:15:30.846Z"
        },
        {
          "id": 40,
          "productId": 4,
          "colorId": 9,
          "sizeName": "S",
          "stock": 12,
          "createdAt": "2025-10-14T01:15:31.368Z",
          "updatedAt": "2025-10-14T01:15:31.368Z"
        },
        {
          "id": 41,
          "productId": 4,
          "colorId": 9,
          "sizeName": "M",
          "stock": 12,
          "createdAt": "2025-10-14T01:15:31.573Z",
          "updatedAt": "2025-10-14T01:15:31.573Z"
        },
        {
          "id": 42,
          "productId": 4,
          "colorId": 9,
          "sizeName": "L",
          "stock": 12,
          "createdAt": "2025-10-14T01:15:31.776Z",
          "updatedAt": "2025-10-14T01:15:31.776Z"
        },
        {
          "id": 43,
          "productId": 4,
          "colorId": 9,
          "sizeName": "XL",
          "stock": 12,
          "createdAt": "2025-10-14T01:15:31.919Z",
          "updatedAt": "2025-10-14T01:15:31.919Z"
        }
      ],
      "subCategory": {
        "id": 6,
        "name": "T-Shirts",
        "slug": "tshirts",
        "description": "T-shirts personnalisables",
        "categoryId": 4,
        "displayOrder": 1,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:53.032Z",
        "updatedAt": "2025-10-14T01:13:53.032Z"
      },
      "variation": {
        "id": 14,
        "name": "Manches Longues",
        "slug": "manches-longues",
        "description": "T-shirt à manches longues",
        "subCategoryId": 6,
        "displayOrder": 3,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:59.339Z",
        "updatedAt": "2025-10-14T01:13:59.339Z"
      },
      "colorVariations": [
        {
          "id": 8,
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "productId": 4,
          "images": [
            {
              "id": 8,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/FFFFFF/FFFFFF?text=T-Shirt%20Manches%20Longues",
              "publicId": "product_4_blanc_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 8,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 12
            },
            {
              "sizeName": "M",
              "stock": 12
            },
            {
              "sizeName": "L",
              "stock": 12
            },
            {
              "sizeName": "XL",
              "stock": 12
            }
          ]
        },
        {
          "id": 9,
          "name": "Noir",
          "colorCode": "#000000",
          "productId": 4,
          "images": [
            {
              "id": 9,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/000000/000000?text=T-Shirt%20Manches%20Longues",
              "publicId": "product_4_noir_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 9,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 12
            },
            {
              "sizeName": "M",
              "stock": 12
            },
            {
              "sizeName": "L",
              "stock": 12
            },
            {
              "sizeName": "XL",
              "stock": 12
            }
          ]
        }
      ],
      "hasDelimitations": false
    },
    {
      "id": 3,
      "name": "T-Shirt Col V Noir",
      "description": "T-shirt élégant à col V, coupe ajustée",
      "price": 17.99,
      "stock": 120,
      "status": "PUBLISHED",
      "createdAt": "2025-10-14T01:15:22.542Z",
      "updatedAt": "2025-10-14T01:15:22.542Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "HOMME",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": true,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 27.99,
      "categoryId": 4,
      "subCategoryId": 6,
      "variationId": 13,
      "categories": [
        {
          "id": 4,
          "name": "Vêtements",
          "slug": "vetements",
          "description": "dzedzed",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T12:27:39.817Z",
          "updatedAt": "2025-10-13T12:27:39.817Z"
        }
      ],
      "sizes": [
        {
          "id": 9,
          "productId": 3,
          "sizeName": "S"
        },
        {
          "id": 10,
          "productId": 3,
          "sizeName": "M"
        },
        {
          "id": 11,
          "productId": 3,
          "sizeName": "L"
        },
        {
          "id": 12,
          "productId": 3,
          "sizeName": "XL"
        },
        {
          "id": 13,
          "productId": 3,
          "sizeName": "XXL"
        }
      ],
      "stocks": [
        {
          "id": 21,
          "productId": 3,
          "colorId": 5,
          "sizeName": "S",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:24.669Z",
          "updatedAt": "2025-10-14T01:15:24.669Z"
        },
        {
          "id": 22,
          "productId": 3,
          "colorId": 5,
          "sizeName": "M",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:24.814Z",
          "updatedAt": "2025-10-14T01:15:24.814Z"
        },
        {
          "id": 23,
          "productId": 3,
          "colorId": 5,
          "sizeName": "L",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:25.019Z",
          "updatedAt": "2025-10-14T01:15:25.019Z"
        },
        {
          "id": 24,
          "productId": 3,
          "colorId": 5,
          "sizeName": "XL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:25.223Z",
          "updatedAt": "2025-10-14T01:15:25.223Z"
        },
        {
          "id": 25,
          "productId": 3,
          "colorId": 5,
          "sizeName": "XXL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:25.428Z",
          "updatedAt": "2025-10-14T01:15:25.428Z"
        },
        {
          "id": 26,
          "productId": 3,
          "colorId": 6,
          "sizeName": "S",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:25.940Z",
          "updatedAt": "2025-10-14T01:15:25.940Z"
        },
        {
          "id": 27,
          "productId": 3,
          "colorId": 6,
          "sizeName": "M",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:26.145Z",
          "updatedAt": "2025-10-14T01:15:26.145Z"
        },
        {
          "id": 28,
          "productId": 3,
          "colorId": 6,
          "sizeName": "L",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:26.350Z",
          "updatedAt": "2025-10-14T01:15:26.350Z"
        },
        {
          "id": 29,
          "productId": 3,
          "colorId": 6,
          "sizeName": "XL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:26.494Z",
          "updatedAt": "2025-10-14T01:15:26.494Z"
        },
        {
          "id": 30,
          "productId": 3,
          "colorId": 6,
          "sizeName": "XXL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:26.637Z",
          "updatedAt": "2025-10-14T01:15:26.637Z"
        },
        {
          "id": 31,
          "productId": 3,
          "colorId": 7,
          "sizeName": "S",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:27.070Z",
          "updatedAt": "2025-10-14T01:15:27.070Z"
        },
        {
          "id": 32,
          "productId": 3,
          "colorId": 7,
          "sizeName": "M",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:27.271Z",
          "updatedAt": "2025-10-14T01:15:27.271Z"
        },
        {
          "id": 33,
          "productId": 3,
          "colorId": 7,
          "sizeName": "L",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:27.414Z",
          "updatedAt": "2025-10-14T01:15:27.414Z"
        },
        {
          "id": 34,
          "productId": 3,
          "colorId": 7,
          "sizeName": "XL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:27.557Z",
          "updatedAt": "2025-10-14T01:15:27.557Z"
        },
        {
          "id": 35,
          "productId": 3,
          "colorId": 7,
          "sizeName": "XXL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:27.703Z",
          "updatedAt": "2025-10-14T01:15:27.703Z"
        }
      ],
      "subCategory": {
        "id": 6,
        "name": "T-Shirts",
        "slug": "tshirts",
        "description": "T-shirts personnalisables",
        "categoryId": 4,
        "displayOrder": 1,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:53.032Z",
        "updatedAt": "2025-10-14T01:13:53.032Z"
      },
      "variation": {
        "id": 13,
        "name": "Col V",
        "slug": "col-v",
        "description": "T-shirt à col V",
        "subCategoryId": 6,
        "displayOrder": 2,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:58.635Z",
        "updatedAt": "2025-10-14T01:13:58.635Z"
      },
      "colorVariations": [
        {
          "id": 5,
          "name": "Noir",
          "colorCode": "#000000",
          "productId": 3,
          "images": [
            {
              "id": 5,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/000000/000000?text=T-Shirt%20Col%20V%20Noir",
              "publicId": "product_3_noir_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 5,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 8
            },
            {
              "sizeName": "M",
              "stock": 8
            },
            {
              "sizeName": "L",
              "stock": 8
            },
            {
              "sizeName": "XL",
              "stock": 8
            },
            {
              "sizeName": "XXL",
              "stock": 8
            }
          ]
        },
        {
          "id": 6,
          "name": "Marine",
          "colorCode": "#000080",
          "productId": 3,
          "images": [
            {
              "id": 6,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/000080/000080?text=T-Shirt%20Col%20V%20Noir",
              "publicId": "product_3_marine_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 6,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 8
            },
            {
              "sizeName": "M",
              "stock": 8
            },
            {
              "sizeName": "L",
              "stock": 8
            },
            {
              "sizeName": "XL",
              "stock": 8
            },
            {
              "sizeName": "XXL",
              "stock": 8
            }
          ]
        },
        {
          "id": 7,
          "name": "Bordeaux",
          "colorCode": "#800020",
          "productId": 3,
          "images": [
            {
              "id": 7,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/800020/800020?text=T-Shirt%20Col%20V%20Noir",
              "publicId": "product_3_bordeaux_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 7,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "S",
              "stock": 8
            },
            {
              "sizeName": "M",
              "stock": 8
            },
            {
              "sizeName": "L",
              "stock": 8
            },
            {
              "sizeName": "XL",
              "stock": 8
            },
            {
              "sizeName": "XXL",
              "stock": 8
            }
          ]
        }
      ],
      "hasDelimitations": false
    },
    {
      "id": 2,
      "name": "T-Shirt Col Rond Blanc",
      "description": "T-shirt 100% coton bio avec col rond, parfait pour la personnalisation",
      "price": 15.99,
      "stock": 150,
      "status": "PUBLISHED",
      "createdAt": "2025-10-14T01:15:15.161Z",
      "updatedAt": "2025-10-14T01:15:15.161Z",
      "designsMetadata": {
        "totalDesigns": 0,
        "lastUpdated": null
      },
      "genre": "UNISEXE",
      "hasCustomDesigns": false,
      "isDelete": false,
      "isReadyProduct": true,
      "isValidated": true,
      "rejectionReason": null,
      "submittedForValidationAt": null,
      "validatedAt": null,
      "validatedBy": null,
      "suggestedPrice": 25.99,
      "categoryId": 4,
      "subCategoryId": 6,
      "variationId": 12,
      "categories": [
        {
          "id": 4,
          "name": "Vêtements",
          "slug": "vetements",
          "description": "dzedzed",
          "displayOrder": 0,
          "coverImageUrl": null,
          "coverImagePublicId": null,
          "isActive": true,
          "createdAt": "2025-10-13T12:27:39.817Z",
          "updatedAt": "2025-10-13T12:27:39.817Z"
        }
      ],
      "sizes": [
        {
          "id": 3,
          "productId": 2,
          "sizeName": "XS"
        },
        {
          "id": 4,
          "productId": 2,
          "sizeName": "S"
        },
        {
          "id": 5,
          "productId": 2,
          "sizeName": "M"
        },
        {
          "id": 6,
          "productId": 2,
          "sizeName": "L"
        },
        {
          "id": 7,
          "productId": 2,
          "sizeName": "XL"
        },
        {
          "id": 8,
          "productId": 2,
          "sizeName": "XXL"
        }
      ],
      "stocks": [
        {
          "id": 3,
          "productId": 2,
          "colorId": 2,
          "sizeName": "XS",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:18.552Z",
          "updatedAt": "2025-10-14T01:15:18.552Z"
        },
        {
          "id": 4,
          "productId": 2,
          "colorId": 2,
          "sizeName": "S",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:18.875Z",
          "updatedAt": "2025-10-14T01:15:18.875Z"
        },
        {
          "id": 5,
          "productId": 2,
          "colorId": 2,
          "sizeName": "M",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:19.080Z",
          "updatedAt": "2025-10-14T01:15:19.080Z"
        },
        {
          "id": 6,
          "productId": 2,
          "colorId": 2,
          "sizeName": "L",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:19.284Z",
          "updatedAt": "2025-10-14T01:15:19.284Z"
        },
        {
          "id": 7,
          "productId": 2,
          "colorId": 2,
          "sizeName": "XL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:19.489Z",
          "updatedAt": "2025-10-14T01:15:19.489Z"
        },
        {
          "id": 8,
          "productId": 2,
          "colorId": 2,
          "sizeName": "XXL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:19.633Z",
          "updatedAt": "2025-10-14T01:15:19.633Z"
        },
        {
          "id": 9,
          "productId": 2,
          "colorId": 3,
          "sizeName": "XS",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:20.206Z",
          "updatedAt": "2025-10-14T01:15:20.206Z"
        },
        {
          "id": 10,
          "productId": 2,
          "colorId": 3,
          "sizeName": "S",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:20.352Z",
          "updatedAt": "2025-10-14T01:15:20.352Z"
        },
        {
          "id": 11,
          "productId": 2,
          "colorId": 3,
          "sizeName": "M",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:20.495Z",
          "updatedAt": "2025-10-14T01:15:20.495Z"
        },
        {
          "id": 12,
          "productId": 2,
          "colorId": 3,
          "sizeName": "L",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:20.638Z",
          "updatedAt": "2025-10-14T01:15:20.638Z"
        },
        {
          "id": 13,
          "productId": 2,
          "colorId": 3,
          "sizeName": "XL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:20.784Z",
          "updatedAt": "2025-10-14T01:15:20.784Z"
        },
        {
          "id": 14,
          "productId": 2,
          "colorId": 3,
          "sizeName": "XXL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:20.928Z",
          "updatedAt": "2025-10-14T01:15:20.928Z"
        },
        {
          "id": 15,
          "productId": 2,
          "colorId": 4,
          "sizeName": "XS",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:21.593Z",
          "updatedAt": "2025-10-14T01:15:21.593Z"
        },
        {
          "id": 16,
          "productId": 2,
          "colorId": 4,
          "sizeName": "S",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:21.736Z",
          "updatedAt": "2025-10-14T01:15:21.736Z"
        },
        {
          "id": 17,
          "productId": 2,
          "colorId": 4,
          "sizeName": "M",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:21.881Z",
          "updatedAt": "2025-10-14T01:15:21.881Z"
        },
        {
          "id": 18,
          "productId": 2,
          "colorId": 4,
          "sizeName": "L",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:22.049Z",
          "updatedAt": "2025-10-14T01:15:22.049Z"
        },
        {
          "id": 19,
          "productId": 2,
          "colorId": 4,
          "sizeName": "XL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:22.254Z",
          "updatedAt": "2025-10-14T01:15:22.254Z"
        },
        {
          "id": 20,
          "productId": 2,
          "colorId": 4,
          "sizeName": "XXL",
          "stock": 8,
          "createdAt": "2025-10-14T01:15:22.397Z",
          "updatedAt": "2025-10-14T01:15:22.397Z"
        }
      ],
      "subCategory": {
        "id": 6,
        "name": "T-Shirts",
        "slug": "tshirts",
        "description": "T-shirts personnalisables",
        "categoryId": 4,
        "displayOrder": 1,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:53.032Z",
        "updatedAt": "2025-10-14T01:13:53.032Z"
      },
      "variation": {
        "id": 12,
        "name": "Col Rond modif",
        "slug": "col-rond-modif",
        "description": "T-shirt à col rond classique",
        "subCategoryId": 6,
        "displayOrder": 1,
        "isActive": true,
        "createdAt": "2025-10-14T01:13:57.493Z",
        "updatedAt": "2025-10-15T02:12:35.488Z"
      },
      "colorVariations": [
        {
          "id": 2,
          "name": "Blanc",
          "colorCode": "#FFFFFF",
          "productId": 2,
          "images": [
            {
              "id": 2,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/FFFFFF/FFFFFF?text=T-Shirt%20Col%20Rond%20Blanc",
              "publicId": "product_2_blanc_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 2,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "XS",
              "stock": 8
            },
            {
              "sizeName": "S",
              "stock": 8
            },
            {
              "sizeName": "M",
              "stock": 8
            },
            {
              "sizeName": "L",
              "stock": 8
            },
            {
              "sizeName": "XL",
              "stock": 8
            },
            {
              "sizeName": "XXL",
              "stock": 8
            }
          ]
        },
        {
          "id": 3,
          "name": "Noir",
          "colorCode": "#000000",
          "productId": 2,
          "images": [
            {
              "id": 3,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/000000/000000?text=T-Shirt%20Col%20Rond%20Blanc",
              "publicId": "product_2_noir_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 3,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "XS",
              "stock": 8
            },
            {
              "sizeName": "S",
              "stock": 8
            },
            {
              "sizeName": "M",
              "stock": 8
            },
            {
              "sizeName": "L",
              "stock": 8
            },
            {
              "sizeName": "XL",
              "stock": 8
            },
            {
              "sizeName": "XXL",
              "stock": 8
            }
          ]
        },
        {
          "id": 4,
          "name": "Gris",
          "colorCode": "#808080",
          "productId": 2,
          "images": [
            {
              "id": 4,
              "view": "Front",
              "url": "https://via.placeholder.com/800x800/808080/808080?text=T-Shirt%20Col%20Rond%20Blanc",
              "publicId": "product_2_gris_front",
              "naturalWidth": 800,
              "naturalHeight": 800,
              "designUrl": null,
              "designPublicId": null,
              "designFileName": null,
              "designUploadDate": null,
              "designSize": null,
              "designOriginalName": null,
              "designDescription": null,
              "isDesignActive": true,
              "colorVariationId": 4,
              "delimitations": [],
              "customDesign": null
            }
          ],
          "stocks": [
            {
              "sizeName": "XS",
              "stock": 8
            },
            {
              "sizeName": "S",
              "stock": 8
            },
            {
              "sizeName": "M",
              "stock": 8
            },
            {
              "sizeName": "L",
              "stock": 8
            },
            {
              "sizeName": "XL",
              "stock": 8
            },
            {
              "sizeName": "XXL",
              "stock": 8
            }
          ]
        }
      ],
      "hasDelimitations": false
    }
  ],
  "pagination": {
    "total": 13,
    "limit": 13,
    "offset": 0,
    "hasMore": false
  },
  "filters": {
    "applied": {},
    "resultsCount": 13
  }
}