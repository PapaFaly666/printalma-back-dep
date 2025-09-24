# 🚨 SOLUTION - ENDPOINT VALIDATION 401 UNAUTHORIZED

## 📋 Problème identifié

L'endpoint `POST /admin/products/{id}/validate` retourne **401 Unauthorized** car il nécessite :

1. **Token JWT Admin valide**
2. **Rôle ADMIN ou SUPERADMIN**

## 🔒 Guards appliqués

```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPERADMIN')
export class AdminWizardValidationController
```

## 🔧 Solutions

### **Solution 1: Obtenir un token admin valide**

#### **A. Via login admin**

```bash
# 1. Se connecter comme admin
curl -X POST "http://localhost:3004/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@printalma.com",
    "password": "votre_mot_de_passe_admin"
  }'

# Récupérer le token dans la réponse
```

#### **B. Utiliser le token**

```bash
# 2. Utiliser le token pour validation
curl -X POST "http://localhost:3004/admin/products/151/validate" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN_HERE" \
  -d '{
    "approved": true
  }'
```

### **Solution 2: Test via Swagger UI**

1. **Ouvrir Swagger :** http://localhost:3004/api-docs
2. **S'authentifier :** Cliquer sur "Authorize" et entrer le token admin
3. **Tester l'endpoint :** Section "Admin - Validation Produits WIZARD"

### **Solution 3: Script de test complet**

```bash
#!/bin/bash

# Configuration
BASE_URL="http://localhost:3004"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="your_password"
PRODUCT_ID=151

echo "🔐 Connexion admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "'$ADMIN_EMAIL'",
    "password": "'$ADMIN_PASSWORD'"
  }')

# Extraire le token (ajuster selon la structure de réponse)
TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token // .token // .data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Échec de connexion admin"
  echo "Réponse: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Token admin obtenu"

echo "🔄 Validation du produit $PRODUCT_ID..."
VALIDATION_RESPONSE=$(curl -s -X POST "$BASE_URL/admin/products/$PRODUCT_ID/validate" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "approved": true
  }')

echo "📋 Résultat validation:"
echo $VALIDATION_RESPONSE | jq .
```

## 🎯 Frontend - Intégration authentification

### **Service d'authentification**

```typescript
class AuthService {
  private token: string | null = null;

  async loginAdmin(email: string, password: string) {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json();

    if (response.ok && data.access_token) {
      this.token = data.access_token;
      localStorage.setItem('admin_token', this.token);
      return { success: true };
    }

    return { success: false, message: data.message };
  }

  getToken(): string | null {
    return this.token || localStorage.getItem('admin_token');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  logout() {
    this.token = null;
    localStorage.removeItem('admin_token');
  }
}

const authService = new AuthService();
```

### **Service de validation avec authentification**

```typescript
class ProductValidationService {
  async validateProduct(productId: number, approved: boolean, rejectionReason?: string) {
    const token = authService.getToken();

    if (!token) {
      throw new Error('Non authentifié - Token admin requis');
    }

    const response = await fetch(`/admin/products/${productId}/validate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'accept': 'application/json'
      },
      body: JSON.stringify({
        approved,
        rejectionReason: approved ? undefined : rejectionReason
      })
    });

    if (response.status === 401) {
      authService.logout();
      throw new Error('Token expiré - Reconnexion requise');
    }

    if (response.status === 403) {
      throw new Error('Droits insuffisants - Admin requis');
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Erreur de validation');
    }

    return response.json();
  }
}
```

### **Composant validation avec gestion d'erreurs**

```jsx
function ProductValidation({ product }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleValidation = async (approved) => {
    setLoading(true);
    setError('');

    try {
      const result = await productValidationService.validateProduct(
        product.id,
        approved,
        approved ? null : 'Raison de rejet'
      );

      if (result.success) {
        showSuccess(`Produit ${approved ? 'validé' : 'rejeté'} avec succès`);
        onRefresh(); // Recharger la liste
      }
    } catch (err) {
      setError(err.message);

      if (err.message.includes('Token expiré')) {
        // Rediriger vers login
        router.push('/admin/login');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="validation-controls">
      {error && (
        <Alert variant="error">{error}</Alert>
      )}

      <Button
        onClick={() => handleValidation(true)}
        disabled={loading}
        variant="success"
      >
        {loading ? 'Validation...' : 'Valider'}
      </Button>

      <Button
        onClick={() => handleValidation(false)}
        disabled={loading}
        variant="danger"
      >
        {loading ? 'Rejet...' : 'Rejeter'}
      </Button>
    </div>
  );
}
```

## ⚡ Test rapide avec curl authentifié

```bash
# Remplacer YOUR_ADMIN_TOKEN par un vrai token
curl -X POST "http://localhost:3004/admin/products/151/validate" \
  -H "accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -d '{
    "approved": true
  }'
```

## 🚨 Points importants

1. **Token obligatoire** : Tous les endpoints admin nécessitent un JWT valide
2. **Rôle admin** : L'utilisateur doit avoir le rôle ADMIN ou SUPERADMIN
3. **Expiration** : Les tokens JWT expirent, prévoir la gestion de renouvellement
4. **Sécurité** : Ne jamais exposer les tokens dans le code frontend

---

**🔑 La solution principale est d'obtenir un token admin valide via l'endpoint de connexion !**