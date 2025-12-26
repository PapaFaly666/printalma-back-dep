# ✅ Endpoints Corrigés - Onboarding Vendeur

## 🔄 Changements effectués

Les routes ont été modifiées pour correspondre aux attentes du frontend.

---

## 📍 Nouveaux endpoints (version finale)

### 1. Compléter l'onboarding
```
POST /api/vendor/complete-onboarding
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: multipart/form-data
```

**Body (form-data):**
```javascript
{
  "phones": JSON.stringify([
    { "number": "+221771234567", "isPrimary": true },
    { "number": "772345678", "isPrimary": false }
  ]),
  "socialMedia": JSON.stringify([
    { "platform": "facebook", "url": "https://facebook.com/myshop" }
  ]),
  "profileImage": <fichier image>
}
```

---

### 2. Vérifier le statut du profil
```
GET /api/vendor/profile-status
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

### 3. Récupérer les informations d'onboarding
```
GET /api/vendor/onboarding-info
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
```

---

### 4. Mettre à jour les numéros
```
PUT /api/vendor/update-phones
```

**Headers:**
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

**Body:**
```json
{
  "phones": [
    { "number": "+221771234567", "isPrimary": true },
    { "number": "+221772345678", "isPrimary": false }
  ]
}
```

---

## 🔧 Code frontend compatible

Voici le code à utiliser dans votre service frontend :

```typescript
// vendorOnboardingService.ts

import axios from 'axios';

const API_BASE_URL = 'http://localhost:3004';

export const vendorOnboardingService = {
  // Compléter l'onboarding
  async completeOnboarding(formData: FormData) {
    const response = await axios.post(
      `${API_BASE_URL}/api/vendor/complete-onboarding`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Vérifier le statut
  async getProfileStatus() {
    const response = await axios.get(
      `${API_BASE_URL}/api/vendor/profile-status`
    );
    return response.data;
  },

  // Récupérer les infos
  async getOnboardingInfo() {
    const response = await axios.get(
      `${API_BASE_URL}/api/vendor/onboarding-info`
    );
    return response.data;
  },

  // Mettre à jour les numéros
  async updatePhones(phones: any[]) {
    const response = await axios.put(
      `${API_BASE_URL}/api/vendor/update-phones`,
      { phones }
    );
    return response.data;
  },
};
```

---

## 📊 Récapitulatif des changements

| Ancienne route (documentation) | Nouvelle route (code réel) |
|-------------------------------|---------------------------|
| `/vendor-onboarding/complete` | `/api/vendor/complete-onboarding` |
| `/vendor-onboarding/profile-status` | `/api/vendor/profile-status` |
| `/vendor-onboarding/info` | `/api/vendor/onboarding-info` |
| `/vendor-onboarding/phones` | `/api/vendor/update-phones` |

---

## ✅ Prochaines étapes

1. **Redémarrer le backend** : `npm run start:dev`
2. **Tester le frontend** : Le frontend devrait maintenant fonctionner avec ces endpoints
3. **Vérifier les logs** : En cas d'erreur, vérifier les logs du backend

---

## 🐛 En cas de problème

### Erreur 404
→ Vérifier que le backend est bien redémarré après la compilation

### Erreur 401 Unauthorized
→ Vérifier que le token JWT est valide et que l'utilisateur est un VENDEUR

### Erreur CORS
→ Vérifier que le frontend tourne sur `http://localhost:5174` (déjà configuré dans CORS)

---

**Les endpoints sont maintenant compatibles avec le frontend !** ✅
