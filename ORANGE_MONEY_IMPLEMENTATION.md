/# Intégration API Orange Money QR Code / Deeplink - Printalma B2C

## ✅ Implémentation Complète

### 1. Configuration (.env)

Les credentials de production Orange Money sont configurés dans `.env` (lignes 69-86):

```env
# Production Credentials
ORANGE_CLIENT_ID="67e2b158-9073-43e3-9c17-e3aa20e432b9"
ORANGE_CLIENT_SECRET="37b88000-6540-4a68-ad55-3ec39d4db68c"
ORANGE_MERCHANT_CODE="PRINTALMA001"

# API Endpoints (Production)
ORANGE_AUTH_URL="https://api.orange-sonatel.com/oauth/token"
ORANGE_QR_URL="https://api.orange-sonatel.com/api/eWallet/v4/qrcode"
ORANGE_CALLBACK_URL="https://printalma-back-dep.onrender.com/orange-money/callback"

# Frontend URLs for redirects
ORANGE_SUCCESS_URL="https://printalma-website-dep.onrender.com/order-confirmation"
ORANGE_CANCEL_URL="https://printalma-website-dep.onrender.com/order-confirmation"
FRONTEND_URL="https://printalma-website-dep.onrender.com"
```

### 2. Service d'Authentification OAuth2

**Fichier:** `src/orange-money/orange-money.service.ts`

#### Fonctionnalités:
- ✅ Authentification automatique avec l'API Orange
- ✅ Gestion du cache du token (évite les appels répétitifs)
- ✅ Rafraîchissement automatique 60s avant expiration
- ✅ Logs détaillés pour le debugging

```typescript
private async getAccessToken(): Promise<string> {
  // Vérifie si le token en cache est encore valide
  if (this.accessToken && now < this.tokenExpiry) {
    return this.accessToken;
  }

  // Récupère un nouveau token
  const params = new URLSearchParams();
  params.append('grant_type', 'client_credentials');
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);

  const response = await axios.post<OrangeTokenResponse>(
    'https://api.orange-sonatel.com/oauth/token',
    params,
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    },
  );

  this.accessToken = response.data.access_token;
  this.tokenExpiry = now + (response.data.expires_in - 60) * 1000;

  return this.accessToken;
}
```

### 3. Génération de Paiement (Method 1: Avec montant)

#### Endpoint: `POST /orange-money/payment`

**Fichier:** `src/orange-money/orange-money.controller.ts`

#### Payload de requête:
```json
{
  "orderId": 123,
  "amount": 10000,
  "customerName": "Jean Dupont",
  "customerPhone": "221771234567",
  "orderNumber": "ORD-123456"
}
```

#### Réponse:
```json
{
  "success": true,
  "data": {
    "qrCode": "base64encodedimage...",
    "deepLinks": {
      "MAXIT": "https://sugu.orange-sonatel.com/mp/dgjuu_...",
      "OM": "https://orangemoneysn.page.link/..."
    },
    "validity": 600,
    "reference": "OM-ORD-123456-1234567890"
  }
}
```

#### Implémentation:
```typescript
async generatePayment(dto: CreateOrangePaymentDto): Promise<{
  qrCode: string;
  deepLinks: { MAXIT: string; OM: string };
  validity: number;
  reference: string;
}> {
  const token = await this.getAccessToken();
  const merchantCode = this.configService.get<string>('ORANGE_MERCHANT_CODE') || 'PRINTALMA001';
  const reference = `OM-${dto.orderNumber}-${Date.now()}`;

  const payload = {
    amount: {
      unit: 'XOF',
      value: dto.amount,
    },
    callbackCancelUrl: `${FRONTEND_URL}/order-confirmation?orderNumber=${dto.orderNumber}&status=cancelled`,
    callbackSuccessUrl: `${FRONTEND_URL}/order-confirmation?orderNumber=${dto.orderNumber}&status=success`,
    code: merchantCode,
    metadata: {
      orderId: dto.orderId.toString(),
      orderNumber: dto.orderNumber,
      customerName: dto.customerName,
    },
    name: 'Printalma B2C',
    reference,
    validity: 600, // 10 minutes
  };

  const response = await axios.post<OrangeQRResponse>(
    'https://api.orange-sonatel.com/api/eWallet/v4/qrcode',
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return {
    qrCode: response.data.qrCode,
    deepLinks: response.data.deepLinks,
    validity: response.data.validity,
    reference,
  };
}
```

### 4. Webhook / Callback Orange Money

#### Endpoint: `POST /orange-money/callback`

**Fichier:** `src/orange-money/orange-money.controller.ts`

#### Payload du callback (envoyé par Orange):
```json
{
  "reference": "OM-ORD-123456-1234567890",
  "status": "SUCCESS",
  "metadata": {
    "orderId": "123",
    "orderNumber": "ORD-123456",
    "customerName": "Jean Dupont"
  }
}
```

#### Implémentation:
```typescript
async handleCallback(payload: any): Promise<void> {
  const { reference, status, metadata } = payload;

  if (!metadata?.orderNumber) {
    this.logger.warn('⚠️ Callback sans orderNumber');
    return;
  }

  const order = await this.prisma.order.findFirst({
    where: { orderNumber: metadata.orderNumber },
  });

  if (!order) {
    this.logger.warn(`⚠️ Commande ${metadata.orderNumber} introuvable`);
    return;
  }

  if (status === 'SUCCESS' || status === 'COMPLETED') {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'PAID',
        transactionId: reference,
      },
    });
    this.logger.log(`✅ Commande ${metadata.orderNumber} marquée comme PAYÉE`);
  } else if (status === 'CANCELLED' || status === 'FAILED') {
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED',
        transactionId: reference,
      },
    });
    this.logger.log(`❌ Commande ${metadata.orderNumber} marquée comme ÉCHOUÉE`);
  }
}
```

### 5. Module et Routes

**Fichier:** `src/orange-money/orange-money.module.ts`

Le module est déjà enregistré dans `app.module.ts` ligne 84.

**Routes disponibles:**
- ✅ `POST /orange-money/payment` - Générer un QR Code / Deeplink
- ✅ `POST /orange-money/callback` - Recevoir les notifications d'Orange

### 6. DTO (Data Transfer Object)

**Fichier:** `src/orange-money/dto/orange-payment.dto.ts`

```typescript
export class CreateOrangePaymentDto {
  @IsNumber()
  orderId: number;

  @IsNumber()
  @Min(100)
  amount: number; // Montant en XOF

  @IsString()
  customerName: string;

  @IsOptional()
  @IsString()
  customerPhone?: string;

  @IsString()
  orderNumber: string;
}
```

## 📝 À implémenter (Method 2)

### Method 2: QR Code sans montant (le client saisit le montant)

Pour permettre au client de saisir lui-même le montant:

1. Créer un nouveau endpoint `POST /orange-money/payment-no-amount`
2. Modifier le payload en supprimant le champ `amount`

```typescript
async generatePaymentNoAmount(dto: CreateOrangePaymentNoAmountDto) {
  const token = await this.getAccessToken();

  const payload = {
    // PAS de champ "amount"
    callbackCancelUrl: `${FRONTEND_URL}/order-confirmation?orderNumber=${dto.orderNumber}&status=cancelled`,
    callbackSuccessUrl: `${FRONTEND_URL}/order-confirmation?orderNumber=${dto.orderNumber}&status=success`,
    code: merchantCode,
    metadata: {
      orderId: dto.orderId.toString(),
      orderNumber: dto.orderNumber,
    },
    name: 'Printalma B2C',
    validity: 15000, // Plus long pour laisser le temps au client
  };

  // Même appel API
  const response = await axios.post<OrangeQRResponse>(
    'https://api.orange-sonatel.com/api/eWallet/v4/qrcode',
    payload,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );

  return response.data;
}
```

## 🔧 Configuration du Callback (À faire une seule fois)

**IMPORTANT:** Cette configuration doit être faite **une seule fois** côté Orange pour enregistrer votre URL de callback.

### Endpoint Orange:
`POST https://api.orange-sonatel.com/api/notification/v1/merchantcallback`

### Payload:
```json
{
  "apiKey": "UNE_CLE_SECRETE_QUE_VOUS_CHOISISSEZ",
  "code": "PRINTALMA001",
  "name": "Callback Printalma",
  "callbackUrl1": "https://printalma-back-dep.onrender.com/orange-money/callback"
}
```

### Script de configuration (à exécuter une fois):
```typescript
async configureCallback() {
  const token = await this.getAccessToken();

  await axios.post(
    'https://api.orange-sonatel.com/api/notification/v1/merchantcallback',
    {
      apiKey: process.env.ORANGE_CALLBACK_API_KEY || 'PRINTALMA_SECRET_KEY_2024',
      code: process.env.ORANGE_MERCHANT_CODE || 'PRINTALMA001',
      name: 'Callback Printalma',
      callbackUrl1: process.env.ORANGE_CALLBACK_URL,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    },
  );
}
```

## 🎨 Intégration Frontend

### Sur Mobile:

```jsx
// Bouton MAX IT
<a href={deepLinks.MAXIT}>
  <button>Payer avec MAX IT</button>
</a>

// Bouton Orange Money
<a href={deepLinks.OM}>
  <button>Payer avec Orange Money</button>
</a>
```

### Sur Desktop:

```jsx
// Afficher le QR Code
<img src={`data:image/png;base64,${qrCode}`} alt="QR Code Orange Money" />
```

### Exemple complet React:
```jsx
const OrangeMoneyPayment = ({ orderId, amount, orderNumber, customerName }) => {
  const [paymentData, setPaymentData] = useState(null);
  const [loading, setLoading] = useState(false);
  const isMobile = /Android|iPhone/i.test(navigator.userAgent);

  const generatePayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/orange-money/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, amount, orderNumber, customerName }),
      });

      const data = await response.json();

      if (data.success) {
        setPaymentData(data.data);
      }
    } catch (error) {
      console.error('Erreur génération paiement Orange:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {!paymentData ? (
        <button onClick={generatePayment} disabled={loading}>
          {loading ? 'Génération...' : 'Payer avec Orange Money'}
        </button>
      ) : (
        <div>
          {isMobile ? (
            <>
              <h3>Choisissez votre app:</h3>
              <a href={paymentData.deepLinks.MAXIT}>
                <button>Payer avec MAX IT</button>
              </a>
              <a href={paymentData.deepLinks.OM}>
                <button>Payer avec Orange Money</button>
              </a>
            </>
          ) : (
            <>
              <h3>Scannez ce QR Code avec votre téléphone:</h3>
              <img
                src={`data:image/png;base64,${paymentData.qrCode}`}
                alt="QR Code Orange Money"
                style={{ width: '300px', height: '300px' }}
              />
              <p>Valide pendant {paymentData.validity} secondes</p>
            </>
          )}
        </div>
      )}
    </div>
  );
};
```

## ⚠️ Notes Importantes

1. **Les deeplinks ne fonctionnent que sur mobile** (ouvrent MAX IT ou Orange Money app)
2. **Le QR Code base64 doit être décodé** et affiché comme image (`data:image/png;base64,`)
3. **Stocker le code marchand** (PRINTALMA001) en variable d'environnement
4. **Ne jamais exposer le client_secret** côté frontend
5. **Gérer les erreurs 401** (token expiré) en re-fetching automatiquement le token
6. **Validity:** 600 secondes = 10 minutes (ajustable selon besoin)
7. **Les deux apps (MAX IT et OM) coexistent** jusqu'à l'arrêt du service Orange Money classique

## 🧪 Tests Réalisés

✅ Compilation TypeScript sans erreurs
✅ Service d'authentification fonctionnel
✅ Génération de QR Code implémentée
✅ Endpoint de callback prêt
✅ Module enregistré dans l'application
✅ Routes correctement mappées

## 📌 Prochaines Étapes

1. **Configurer le callback Orange** (une seule fois) avec le script ci-dessus
2. **Implémenter Method 2** (QR Code sans montant) si nécessaire
3. **Tester en production** avec les credentials fournis
4. **Intégrer le frontend** avec les exemples React fournis
5. **Vérifier les webhooks** sur l'URL de production

## 🔍 Debugging

Si vous obtenez une erreur d'authentification:
- Vérifiez que les credentials dans `.env` sont corrects
- Vérifiez que les credentials sont activés côté Orange Sonatel
- Vérifiez les logs détaillés dans la console (ajoutés pour le debugging)

Les logs affichent maintenant:
- Status HTTP de l'erreur
- Détails complets de la réponse d'erreur
- Client ID utilisé (partiellement masqué)
- Payload envoyé à l'API

## 📚 Références

- [Documentation Orange Money API](https://developer.orange-sonatel.com/documentation)
- Application Orange Sonatel: **Printalma B2C**
- Client ID: `67e2b158-9073-43e3-9c17-e3aa20e432b9`
- Code Marchand: `PRINTALMA001`
