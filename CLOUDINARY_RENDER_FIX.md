# Fix Cloudinary sur Render

## Problème
Les clés Cloudinary fonctionnent en local mais pas sur Render.
Erreur: `Must supply api_key`

## Cause
Les variables d'environnement ne sont pas configurées sur Render.

## Solution

### 1. Accéder aux variables d'environnement Render

1. Allez sur [https://dashboard.render.com](https://dashboard.render.com)
2. Sélectionnez votre service `printalma-back-dep`
3. Allez dans **Environment** (dans le menu de gauche)

### 2. Ajouter les variables Cloudinary

Ajoutez ces 3 variables exactement comme suit (SANS guillemets) :

```
CLOUDINARY_CLOUD_NAME=dsxab4qnu
CLOUDINARY_API_KEY=267848335846173
CLOUDINARY_API_SECRET=WLhzU3riCxujR1DXRXyMmLPUCoU
```

### 3. Points importants

- ❌ **NE PAS** mettre de guillemets autour des valeurs
- ❌ **NE PAS** mettre d'espaces avant ou après le `=`
- ✅ Copier-coller exactement les valeurs depuis le `.env` local

### 4. Sauvegarder et redéployer

1. Cliquez sur **Save Changes**
2. Render va automatiquement redéployer votre application
3. Attendez que le déploiement soit terminé (environ 2-5 minutes)

### 5. Vérifier que ça fonctionne

Testez l'endpoint de diagnostic :
```bash
curl https://printalma-back-dep.onrender.com/cloudinary/config-check
```

Vous devriez voir :
```json
{
  "cloudName": {
    "exists": true,
    "value": "dsxab4qnu"
  },
  "apiKey": {
    "exists": true,
    "value": "267848..."
  },
  "apiSecret": {
    "exists": true,
    "value": "***"
  }
}
```

### 6. Tester l'upload de produit

Une fois les variables configurées, retestez la création de produit depuis votre frontend.

## Diagnostic local

✅ Les clés fonctionnent parfaitement en local :
```bash
curl http://localhost:3004/cloudinary/config-check
```

Résultat :
```json
{
  "cloudName": { "exists": true, "value": "dsxab4qnu", "length": 9 },
  "apiKey": { "exists": true, "value": "267848...", "length": 15 },
  "apiSecret": { "exists": true, "value": "***", "length": 27 }
}
```
