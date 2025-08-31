# Documentation : Ajout du champ description dans les catégories

## Objectif
Permettre l'ajout d'une description détaillée pour chaque catégorie de produits.

---

## 1. Structure du modèle

Le modèle de catégorie a été modifié pour inclure un champ `description` optionnel.

```prisma
model Category {
  id          Int       @id @default(autoincrement())
  name        String    @unique
  description String?   @db.Text
  products    Product[]
}
```

---

## 2. API pour créer une catégorie avec description

### Endpoint: POST /categories

**Payload**:
```json
{
  "name": "T-shirts",
  "description": "T-shirts personnalisables pour homme et femme"
}
```

**Réponse**:
```json
{
  "id": 1,
  "name": "T-shirts",
  "description": "T-shirts personnalisables pour homme et femme"
}
```

---

## 3. API pour mettre à jour la description d'une catégorie

### Endpoint: PATCH /categories/{id}

**Payload**:
```json
{
  "description": "Nouvelle description mise à jour"
}
```

**Réponse**:
```json
{
  "id": 1,
  "name": "T-shirts",
  "description": "Nouvelle description mise à jour"
}
```

---

## 4. Récupérer une catégorie avec sa description

### Endpoint: GET /categories/{id}

**Réponse**:
```json
{
  "id": 1,
  "name": "T-shirts",
  "description": "T-shirts personnalisables pour homme et femme"
}
```

---

## 5. Récupérer toutes les catégories avec leurs descriptions

### Endpoint: GET /categories

**Réponse**:
```json
[
  {
    "id": 1,
    "name": "T-shirts",
    "description": "T-shirts personnalisables pour homme et femme"
  },
  {
    "id": 2,
    "name": "Pulls",
    "description": "Pulls chauds et confortables"
  }
]
```

---

## 6. Notes d'implémentation

1. Le champ description est **optionnel**.
2. Il est stocké comme type `Text` dans la base de données pour permettre des descriptions longues.
3. Lors de la mise à jour d'une catégorie, vous pouvez mettre à jour uniquement la description sans modifier le nom.

---

## 7. Migration de la base de données

Pour appliquer cette modification à la base de données, exécutez :

```bash
npx prisma migrate dev --name add_category_description
```

Si vous n'avez pas les permissions pour la shadow database, exécutez uniquement la commande SQL suivante sur votre base de données :

```sql
ALTER TABLE "Category" ADD COLUMN "description" TEXT NULL;
```

---

**Note**: Pour toute question ou clarification, contactez l'équipe backend. 