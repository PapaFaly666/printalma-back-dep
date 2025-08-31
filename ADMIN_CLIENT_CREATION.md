# Fonctionnalité de Création de Clients par l'Admin avec Types de Vendeurs

## Vue d'ensemble

Cette fonctionnalité permet aux administrateurs de créer de nouveaux comptes clients avec des spécialisations. Les vendeurs peuvent être classés comme **Designer**, **Influenceur** ou **Artiste**. Une fois le compte créé, un email automatique est envoyé au nouveau client avec un mot de passe temporaire et son type de vendeur. Le client doit obligatoirement changer ce mot de passe lors de sa première connexion.

## Types de vendeurs

### 🎨 **DESIGNER**
- **Spécialisation** : Création de designs graphiques et visuels
- **Fonctionnalités** : Accès aux outils de design, templates, galerie de créations
- **Profil** : Créatifs spécialisés dans le design graphique

### 📱 **INFLUENCEUR** 
- **Spécialisation** : Promotion via réseaux sociaux et influence
- **Fonctionnalités** : Outils de marketing, analytics, codes promo
- **Profil** : Personnalités influentes sur les réseaux sociaux

### 🎭 **ARTISTE**
- **Spécialisation** : Création artistique et œuvres originales
- **Fonctionnalités** : Portfolio artistique, galerie d'œuvres, ventes d'art
- **Profil** : Artistes créant des œuvres originales

## Fonctionnalités implémentées

### 1. Création de clients par l'admin avec type
- **Endpoint**: `POST /auth/admin/create-client`
- **Accès**: Réservé aux utilisateurs avec le rôle `ADMIN` ou `SUPERADMIN`
- **Nouveauté**: Champ obligatoire `vendeur_type`
- **Fonctionnalité**: 
  - Crée un nouveau compte utilisateur avec son type
  - Génère un mot de passe temporaire aléatoire
  - Envoie un email personnalisé selon le type de vendeur
  - Marque le compte comme nécessitant un changement de mot de passe

### 2. Email personnalisé par type
- **Templates différenciés** selon le type de vendeur
- **Informations spécialisées** dans l'email d'activation
- **Design adapté** avec sections dédiées au type

### 3. Gestion des profils vendeurs
- **Affichage du type** dans le profil utilisateur
- **Token JWT enrichi** avec le type de vendeur
- **Permissions futures** basées sur le type

## Structure des données mise à jour

### Modèle User avec types de vendeurs
```prisma
enum VendeurType {
  DESIGNER
  INFLUENCEUR
  ARTISTE
}

model User {
  id                  Int          @id @default(autoincrement())
  firstName           String
  lastName            String
  email               String       @unique
  password            String
  role                Role         @default(VENDEUR)
  vendeur_type        VendeurType? // Type de vendeur (si role = VENDEUR)
  status              Boolean      @default(true)
  must_change_password Boolean      @default(false)
  photo_profil        String?
  login_attempts      Int          @default(0) 
  locked_until        DateTime?
  last_login_at       DateTime?
  created_at          DateTime     @default(now())
  updated_at          DateTime     @updatedAt
}
```

## API Endpoints mis à jour

### 1. Créer un client avec type (Admin uniquement)
```http
POST /auth/admin/create-client
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean.dupont@example.com",
  "vendeur_type": "DESIGNER"
}
```

**Réponse de succès:**
```json
{
  "message": "Client créé avec succès. Un email avec le mot de passe temporaire a été envoyé.",
  "user": {
    "id": 1,
    "firstName": "Jean",
    "lastName": "Dupont", 
    "email": "jean.dupont@example.com",
    "role": "VENDEUR",
    "vendeur_type": "DESIGNER",
    "status": true,
    "created_at": "2024-01-15T10:30:00Z"
  }
}
```

### 2. Connexion avec informations de type
```http
POST /auth/login
Content-Type: application/json

{
  "email": "jean.dupont@example.com",
  "password": "motDePasseTemporaire123"
}
```

**Réponse de succès:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "jean.dupont@example.com",
    "role": "VENDEUR",
    "vendeur_type": "DESIGNER",
    "firstName": "Jean",
    "lastName": "Dupont"
  }
}
```

### 3. Profil utilisateur avec type
```http
GET /auth/profile
Authorization: Bearer <user_token>
```

**Réponse:**
```json
{
  "user": {
    "id": 1,
    "email": "jean.dupont@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "VENDEUR",
    "vendeur_type": "DESIGNER",
    "status": true,
    "must_change_password": false,
    "last_login_at": "2024-01-15T10:30:00Z",
    "created_at": "2024-01-15T10:00:00Z",
    "updated_at": "2024-01-15T10:30:00Z"
  }
}
```

## Tests disponibles

### 1. Endpoints de test des types
```http
GET /mail/seller-types
```
**Retourne** : Liste des types de vendeurs disponibles avec descriptions

```http
POST /mail/test-send-email-with-type
Content-Type: application/json

{
  "email": "test@example.com",
  "firstName": "Test",
  "lastName": "User", 
  "vendeurType": "DESIGNER"
}
```

### 2. Script de test automatisé
```bash
node test-email.js
```

**Fonctionnalités du script :**
- Test génération de mots de passe
- Test récupération des types de vendeurs
- Test envoi d'email simple
- Test envoi d'email pour chaque type (DESIGNER, INFLUENCEUR, ARTISTE)

## Template d'email enrichi

### Exemple pour un Designer
```html
<div class="seller-type">
  <h3>🎨 Votre profil vendeur :</h3>
  <p><strong>Type :</strong> Designer</p>
  <p>En tant que designer, vous aurez accès à des fonctionnalités 
     spécialisées adaptées à votre domaine d'expertise.</p>
</div>
```

### Exemple pour un Influenceur
```html
<div class="seller-type">
  <h3>📱 Votre profil vendeur :</h3>
  <p><strong>Type :</strong> Influenceur</p>
  <p>En tant qu'influenceur, vous aurez accès à des fonctionnalités 
     spécialisées adaptées à votre domaine d'expertise.</p>
</div>
```

## Flux utilisateur mis à jour

### Pour l'administrateur:
1. Se connecte avec ses identifiants admin
2. Choisit le type de vendeur approprié (Designer/Influenceur/Artiste)
3. Utilise l'endpoint `/auth/admin/create-client` avec le champ `vendeur_type`
4. Le système génère automatiquement un mot de passe et envoie l'email personnalisé

### Pour le nouveau client:
1. Reçoit un email personnalisé selon son type de vendeur
2. Découvre son profil et ses spécialisations
3. Se connecte avec l'email et le mot de passe temporaire
4. Change son mot de passe comme avant
5. Accède à l'application avec des fonctionnalités adaptées à son type

## Migration de base de données

```bash
# Ajouter l'enum et le champ vendeur_type
npx prisma migrate dev --name add_vendeur_type_enum
npx prisma generate
```

## Validation et contraintes

- **vendeur_type** est obligatoire lors de la création d'un client
- **Valeurs autorisées** : `DESIGNER`, `INFLUENCEUR`, `ARTISTE`
- **Validation API** avec enum TypeScript
- **Messages d'erreur** explicites si type invalide

## Exemples d'utilisation

### Créer un designer
```bash
curl -X POST http://localhost:3000/auth/admin/create-client \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Sophie",
    "lastName": "Martin", 
    "email": "sophie.martin@example.com",
    "vendeur_type": "DESIGNER"
  }'
```

### Créer un influenceur
```bash
curl -X POST http://localhost:3000/auth/admin/create-client \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Alex",
    "lastName": "Dubois",
    "email": "alex.dubois@example.com", 
    "vendeur_type": "INFLUENCEUR"
  }'
```

### Créer un artiste
```bash
curl -X POST http://localhost:3000/auth/admin/create-client \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Marie",
    "lastName": "Rousseau",
    "email": "marie.rousseau@example.com",
    "vendeur_type": "ARTISTE"
  }'
```

## Fonctionnalités futures

### Permissions basées sur le type
- **Designers** : Accès aux outils de création graphique
- **Influenceurs** : Analytics et outils de promotion  
- **Artistes** : Portfolio et galerie d'œuvres

### Tableaux de bord spécialisés
- Interface adaptée selon le type de vendeur
- Métriques et statistiques pertinentes
- Outils et fonctionnalités dédiés

**La fonctionnalité types de vendeurs est maintenant opérationnelle ! 🎨📱🎭** 