# Guide de Test Email - PrintAlma

## Configuration actuelle

✅ **Email configuré**: `pfdiagne35@gmail.com`
✅ **Service mail**: Configuré avec Gmail SMTP
✅ **Templates HTML**: Prêts pour l'envoi

## Tests rapides

### 1. Test de génération de mot de passe

```bash
# Méthode 1: Avec curl
curl http://localhost:3000/mail/test-password-generation

# Méthode 2: Dans votre navigateur
http://localhost:3000/mail/test-password-generation
```

**Résultat attendu:**
```json
{
  "message": "Mot de passe généré avec succès",
  "password": "aB3$fG7kL9mN",
  "length": 12
}
```

### 2. Test d'envoi d'email

```bash
# Avec curl
curl -X POST http://localhost:3000/mail/test-send-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "pfdiagne35@gmail.com",
    "firstName": "Test",
    "lastName": "PrintAlma"
  }'
```

**Résultat attendu:**
```json
{
  "message": "Email de test envoyé avec succès",
  "sentTo": "pfdiagne35@gmail.com",
  "temporaryPassword": "aB3$fG7kL9mN"
}
```

### 3. Test complet avec script Node.js

```bash
# Exécuter le script de test
node test-email.js
```

## Test du workflow complet admin → client

### Étape 1: Créer un compte admin (si pas déjà fait)

1. **Insérez un admin dans la base de données** ou **modifiez un utilisateur existant**:

```sql
-- Exemple SQL pour créer un admin (exécutez dans votre base PostgreSQL)
INSERT INTO "User" (
  "firstName", 
  "lastName", 
  "email", 
  "password", 
  "role", 
  "status"
) VALUES (
  'Admin',
  'PrintAlma', 
  'admin@printalma.com',
  '$2b$10$hashedPasswordHere', -- Utilisez le hash généré par l'app
  'ADMIN',
  true
);
```

### Étape 2: Tester la création de client par l'admin

```bash
# 1. Se connecter en tant qu'admin
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@printalma.com",
    "password": "votre-mot-de-passe-admin"
  }'

# 2. Utiliser le token pour créer un client
curl -X POST http://localhost:3000/auth/admin/create-client \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer VOTRE_TOKEN_ICI" \
  -d '{
    "firstName": "Jean",
    "lastName": "Dupont", 
    "email": "jean.dupont@example.com"
  }'
```

### Étape 3: Tester la première connexion du client

```bash
# Le client se connecte avec le mot de passe temporaire reçu par email
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "jean.dupont@example.com",
    "password": "mot-de-passe-temporaire-reçu"
  }'
```

**Résultat attendu** (première connexion):
```json
{
  "mustChangePassword": true,
  "userId": 123,
  "message": "Vous devez changer votre mot de passe avant de continuer"
}
```

### Étape 4: Changer le mot de passe

```bash
# Le client change son mot de passe
curl -X PUT http://localhost:3000/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN_DU_CLIENT" \
  -d '{
    "currentPassword": "mot-de-passe-temporaire-reçu",
    "newPassword": "monNouveauMotDePasse123",
    "confirmPassword": "monNouveauMotDePasse123"
  }'
```

## Vérification des emails

1. **Connectez-vous à votre Gmail** (`pfdiagne35@gmail.com`)
2. **Cherchez les emails de test** avec le sujet "Votre compte PrintAlma a été créé"
3. **Vérifiez le contenu** et le mot de passe temporaire

## Dépannage

### Si l'email ne s'envoie pas:

1. **Vérifiez les logs de l'application**
2. **Testez la configuration SMTP**:
   ```bash
   # Vérifiez que l'app est bien démarrée
   curl http://localhost:3000/mail/test-password-generation
   ```

3. **Vérifiez le mot de passe d'application Gmail**:
   - Le mot de passe `azdebdsvilmpowld` doit être valide
   - Vérifiez que l'authentification 2FA est activée sur Gmail

### Erreurs communes:

- **535 Authentication failed**: Mot de passe d'application invalide
- **535 Username and Password not accepted**: Mauvais identifiants
- **Connection timeout**: Problème de réseau ou port bloqué

## URL Swagger (Documentation API)

Une fois l'application démarrée, accédez à:
```
http://localhost:3000/api
```

Vous y trouverez tous les endpoints documentés avec des exemples de requêtes.

## Prochaines étapes

1. ✅ Tester la génération de mot de passe
2. ✅ Tester l'envoi d'email  
3. ✅ Créer un compte admin
4. ✅ Tester la création de client
5. ✅ Tester le changement de mot de passe obligatoire

**La fonctionnalité est maintenant opérationnelle ! 🎉** 