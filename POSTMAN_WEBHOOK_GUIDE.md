# 📮 Guide Complet - Tester le Webhook PayDunya dans Postman

## 🚀 **Configuration de la requête dans Postman**

### 1. **Nouvelle requête**
- Ouvrir Postman
- Cliquer sur **"New"** → **"HTTP Request"**
- Nommer la requête : **"PayDunya Webhook Test"**

### 2. **Configuration de base**
```
Method: POST
URL: http://localhost:3004/paydunya/webhook
```

### 3. **Headers (En-têtes)**
Cliquer sur **"Headers"** et ajouter :

| Key | Value |
|-----|-------|
| Content-Type | application/json |
| Accept | */* |

### 4. **Body (Corps de la requête)**
- Cliquer sur **"Body"**
- Sélectionner **"raw"**
- Choisir **"JSON"** dans le menu déroulant

---

## ✅ **Exemples de corps de requête**

### **Test 1 : Paiement réussi**
```json
{
  "invoice_token": "test_GjuzFboTqC",
  "status": "completed",
  "response_code": "00",
  "total_amount": 25000,
  "custom_data": {
    "order_number": "ORD-1762384361123",
    "order_id": 111
  },
  "payment_method": "paydunya",
  "customer_name": "Client Postman Test",
  "customer_email": "postman@test.com",
  "customer_phone": "775588834"
}
```

### **Test 2 : Paiement échoué**
```json
{
  "invoice_token": "test_GjuzFboTqC",
  "status": "failed",
  "response_code": "99",
  "total_amount": 25000,
  "custom_data": {
    "order_number": "ORD-1762384361123",
    "order_id": 111
  },
  "payment_method": "paydunya",
  "customer_name": "Client Postman Échec",
  "customer_email": "fail@test.com",
  "error_code": "insufficient_funds",
  "cancel_reason": "Fonds insuffisants"
}
```

### **Test 3 : Erreur (champs manquants)**
```json
{
  "invoice_token": "test_GjuzFboTqC"
}
```

### **Test 4 : Erreur (données vides)**
```json
{}
```

---

## 🎯 **Étapes détaillées dans Postman**

### Étape 1 : Configuration
```
1. Ouvrir Postman
2. New → HTTP Request
3. Nom : "PayDunya Webhook Test"
4. Method : POST
5. URL : http://localhost:3004/paydunya/webhook
```

### Étape 2 : Headers
```
1. Cliquer sur "Headers"
2. Ajouter : Content-Type = application/json
3. Ajouter : Accept = */*
```

### Étape 3 : Body
```
1. Cliquer sur "Body"
2. Sélectionner "raw"
3. Choisir "JSON" dans le menu
4. Coller un des exemples ci-dessus
```

### Étape 4 : Envoi
```
1. Cliquer sur "Send"
2. Observer la réponse dans le panneau du bas
3. Vérifier le status code (200 = succès, 400 = erreur)
```

---

## 📊 **Réponses attendues**

### ✅ **Succès (Status 200)**
```json
{
  "success": true,
  "message": "PayDunya webhook processed successfully",
  "data": {
    "invoice_token": "test_GjuzFboTqC",
    "order_number": "ORD-1762384361123",
    "payment_status": "success",
    "status_updated": true,
    "failure_details": null
  }
}
```

### ❌ **Erreur (Status 400)**
```json
{
  "message": "Missing required fields: invoice_token and status",
  "error": "Bad Request",
  "statusCode": 400
}
```

---

## 🔧 **Tests automatisés dans Postman**

### Ajouter des tests automatiques

Dans Postman, cliquer sur **"Tests"** et coller ce code :

```javascript
// Test pour vérifier le status code
pm.test("Status code is 200 or 400", function () {
    pm.expect(pm.response.code).to.be.oneOf([200, 400]);
});

// Test pour réponse de succès
if (pm.response.code === 200) {
    pm.test("Success response structure", function () {
        const jsonData = pm.response.json();
        pm.expect(jsonData.success).to.be.true;
        pm.expect(jsonData.message).to.eql("PayDunya webhook processed successfully");
        pm.expect(jsonData.data).to.have.property('invoice_token');
        pm.expect(jsonData.data).to.have.property('payment_status');
    });
}

// Test pour réponse d'erreur
if (pm.response.code === 400) {
    pm.test("Error response structure", function () {
        const jsonData = pm.response.json();
        pm.expect(jsonData).to.have.property('message');
        pm.expect(jsonData).to.have.property('error');
        pm.expect(jsonData.statusCode).to.eql(400);
    });
}

// Test pour le temps de réponse
pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

---

## 📁 **Collection Postman à importer**

Créez un fichier `paydunya_webhook_collection.json` :

```json
{
  "info": {
    "name": "PayDunya Webhook Tests",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Webhook - Paiement réussi",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invoice_token\": \"test_GjuzFboTqC\",\n  \"status\": \"completed\",\n  \"response_code\": \"00\",\n  \"total_amount\": 25000,\n  \"custom_data\": {\n    \"order_number\": \"ORD-1762384361123\",\n    \"order_id\": 111\n  },\n  \"payment_method\": \"paydunya\",\n  \"customer_name\": \"Client Postman Test\",\n  \"customer_email\": \"postman@test.com\"\n}"
          },
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "http://localhost:3004/paydunya/webhook",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3004",
          "path": ["paydunya", "webhook"]
        }
      },
      "event": [
        {
          "listen": "test",
          "script": {
            "exec": [
              "pm.test('Status code is 200', function () {",
              "    pm.expect(pm.response.code).to.eql(200);",
              "});",
              "",
              "pm.test('Success response', function () {",
              "    const jsonData = pm.response.json();",
              "    pm.expect(jsonData.success).to.be.true;",
              "    pm.expect(jsonData.data.payment_status).to.eql('success');",
              "});"
            ]
          }
        }
      ]
    },
    {
      "name": "Webhook - Paiement échoué",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invoice_token\": \"test_GjuzFboTqC\",\n  \"status\": \"failed\",\n  \"response_code\": \"99\",\n  \"total_amount\": 25000,\n  \"custom_data\": {\n    \"order_number\": \"ORD-1762384361123\",\n    \"order_id\": 111\n  },\n  \"payment_method\": \"paydunya\",\n  \"error_code\": \"insufficient_funds\"\n}"
          },
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "http://localhost:3004/paydunya/webhook",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3004",
          "path": ["paydunya", "webhook"]
        }
      }
    },
    {
      "name": "Webhook - Erreur champs manquants",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"invoice_token\": \"test_GjuzFboTqC\"\n}"
          },
          "options": {
            "raw": {
              "language": "json"
            }
          }
        },
        "url": {
          "raw": "http://localhost:3004/paydunya/webhook",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3004",
          "path": ["paydunya", "webhook"]
        }
      }
    }
  ]
}
```

---

## 🎯 **Résumé rapide**

### **Configuration requise** :
- Method : `POST`
- URL : `http://localhost:3004/paydunya/webhook`
- Headers : `Content-Type: application/json`
- Body : JSON avec `invoice_token` et `status` (obligatoires)

### **Tests possibles** :
- ✅ Paiement réussi → Status 200
- ❌ Paiement échoué → Status 200 avec `payment_status: failed`
- ⚠️ Erreurs → Status 400 avec message d'erreur

**Le webhook est maintenant testable en un clic dans Postman !** 🚀