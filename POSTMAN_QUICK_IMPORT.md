# 🚀 Importation Rapide - Collection PayDunya Postman

## 📥 **Importer la collection en 30 secondes**

### 1. **Ouvrir Postman**
- Lancer l'application Postman
- Se connecter si nécessaire

### 2. **Importer**
- Cliquer sur **"Import"** en haut à gauche
- Choisir **"File"**
- Sélectionner le fichier : `paydunya_webhook_collection.json`
- Cliquer sur **"Import"**

### 3. **Utiliser**
- La collection **"PayDunya Webhook Tests"** apparaît dans la barre latérale
- Déplier la collection pour voir les 5 tests
- Cliquer sur chaque test pour l'exécuter

---

## 📋 **Tests disponibles dans la collection**

| Test | Description | Résultat attendu |
|------|-------------|------------------|
| ✅ **Paiement réussi** | Webhook avec paiement réussi | Status 200 + `payment_status: success` |
| ❌ **Paiement échoué** | Webhook avec paiement échoué | Status 200 + `payment_status: failed` |
| ⚠️ **Champs manquants** | Webhook incomplet | Status 400 + message d'erreur |
| 🚫 **Données vides** | Webhook avec JSON vide | Status 400 + "Empty webhook data" |
| 🔍 **Vérifier statut** | GET pour vérifier le token | Status 200 + infos PayDunya |

---

## 🎯 **Comment utiliser chaque test**

### 1. **Paiement réussi**
- Cliquer sur ✅ "Webhook - Paiement réussi"
- Vérifier que le body contient bien les données
- Cliquer sur **"Send"**
- Observer : Status 200 + Tests passés ✓

### 2. **Paiement échoué**
- Cliquer sur ❌ "Webhook - Paiement échoué"
- Cliquer sur **"Send"**
- Observer : Status 200 + `payment_status: failed`

### 3. **Tests d'erreur**
- Cliquer sur ⚠️ ou 🚫
- Cliquer sur **"Send"**
- Observer : Status 400 + message d'erreur

### 4. **Vérification**
- Cliquer sur 🔍 "Vérifier statut PayDunya"
- Cliquer sur **"Send"**
- Observer les infos du token `test_GjuzFboTqC`

---

## ✅ **Tests automatiques inclus**

Chaque requête inclut des tests automatiques :

- **Validation du status code** (200 ou 400 attendu)
- **Vérification de la structure** de la réponse
- **Temps de réponse** < 5 secondes
- **Contenu spécifique** selon le type de test

Les tests apparaissent avec des ✓ verts quand ils passent !

---

## 🔧 **Personnalisation**

### **Changer le token**
Dans chaque requête, modifiez :
```json
"invoice_token": "test_GjuzFboTqC"
```

### **Changer la commande**
Modifiez les données :
```json
"custom_data": {
  "order_number": "VOTRE-NUMERO-COMMANDE",
  "order_id": VOTRE_ID
}
```

### **Modifier le montant**
Changez :
```json
"total_amount": 25000
```

---

## 🎉 **Résultats attendus**

### ✅ **Si tout fonctionne**
- Status : 200 OK
- Tests : tous passés ✓
- Body : JSON structuré avec `success: true`

### ❌ **En cas d'erreur**
- Status : 400 Bad Request
- Tests : certains échouent ✗
- Body : JSON avec `message` d'erreur

---

## 🚨 **Dépannage**

### **"Could not send request"**
- Vérifiez que votre backend tourne : `http://localhost:3004`
- Testez avec `curl` d'abord

### **"Connection refused"**
- Démarrez votre application NestJS
- Vérifiez le port 3004

### **Tests qui échouent**
- Comparez votre body avec les exemples
- Vérifiez les headers (Content-Type: application/json)

**La collection est prête à l'emploi ! Importez et testez en un clic !** 🚀