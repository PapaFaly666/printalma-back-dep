# 📱 Guide Frontend - Gestion des Finances Vendeurs

## 📋 Vue d'ensemble

Ce document explique comment intégrer la nouvelle API de gestion des fonds vendeurs dans le frontend. La règle principale est simple : **un vendeur ne peut retirer des fonds que pour les commandes livrées**.

---

## 🎯 Endpoints API

### 1. **GET `/orders/my-orders`** - Récupérer les finances du vendeur

**Headers requis** :
```typescript
{
  'Authorization': 'Bearer <jwt_token>',
  'Content-Type': 'application/json'
}
```

**Réponse** :
```typescript
interface MyOrdersResponse {
  success: boolean;
  message: string;
  data: {
    orders: Order[];
    statistics: OrderStatistics;
    vendorFinances?: VendorFinances; // Seulement pour les vendeurs
  };
}
```

---

## 📊 Structure des Données

### **VendorFinances** (Nouveau format)

```typescript
interface VendorFinances {
  // 💰 Total des gains (toutes les commandes payées : produits + designs)
  totalEarnings: number;                 // Ex: 44 000 FCFA

  // 💵 Total disponible (commandes livrées uniquement : produits + designs)
  deliveredVendorAmount: number;         // Ex: 38 000 FCFA

  // ⏳ En attente de livraison (payé mais pas encore livré)
  pendingOrdersAmount: number;           // Ex: 6 000 FCFA

  // 🎨 Détails par source de revenus (LIVRÉS uniquement)
  totalProductRevenue: number;           // Ex: 8 000 FCFA (produits livrés)
  totalDesignRevenue: number;            // Ex: 30 000 FCFA (designs livrés)

  // 💸 Montant déjà retiré (status = PAID)
  withdrawnAmount: number;               // Ex: 0 FCFA

  // ⏰ Montant en attente de validation (status = PENDING ou APPROVED)
  pendingWithdrawalAmount: number;       // Ex: 0 FCFA

  // ✅ Montant réellement disponible pour retrait
  availableForWithdrawal: number;        // Ex: 38 000 FCFA

  // 💰 Montant disponible pour appel de fonds (identique à availableForWithdrawal)
  fundsRequestAvailableAmount: number;   // Ex: 38 000 FCFA

  // 📈 Statistiques additionnelles
  deliveredOrdersCount: number;          // Ex: 2 commandes
  totalCommissionDeducted: number;       // Ex: 8 000 FCFA

  // 📋 Résumé des demandes de fonds
  fundsRequestsSummary: {
    total: number;
    paid: number;
    pending: number;
    approved: number;
    rejected: number;
  };

  // 💬 Message informatif pour l'utilisateur
  message: string; // Ex: "Vous avez 38 000 XOF disponibles pour retrait (2 commandes livrées)"
}
```

### **OrderStatistics** (Mis à jour)

```typescript
interface OrderStatistics {
  totalOrders: number;
  totalAmount: number;

  // ✅ Mis à jour pour inclure les designs
  totalVendorAmount: number;    // Gains totaux (produits + designs payés)
  totalRevenue: number;         // Revenue total (commission + gains vendeur)
  totalCommission: number;      // Commission plateforme

  // Autres statistiques
  monthlyRevenue: number;
  annualRevenue: number;
  averageOrderValue: number;

  // Breakdown par statut
  statusBreakdown: {
    DELIVERED: number;
    CONFIRMED: number;
    PROCESSING: number;
    // ...
  };

  paymentStatusBreakdown: {
    PAID: number;
    PENDING: number;
    // ...
  };
}
```

---

## 💡 Formules de Calcul

### Relation entre les montants :

```typescript
// 1️⃣ Total des gains payés
totalEarnings = totalProductRevenue (tous payés) + totalDesignRevenue (tous payés)

// 2️⃣ Total des gains livrés
deliveredVendorAmount = totalProductRevenue (livrés) + totalDesignRevenue (livrés)

// 3️⃣ En attente de livraison
pendingOrdersAmount = totalEarnings - deliveredVendorAmount

// 4️⃣ Disponible pour retrait
availableForWithdrawal = deliveredVendorAmount - withdrawnAmount - pendingWithdrawalAmount

// 5️⃣ Revenue total
totalRevenue = totalCommission + totalEarnings
```

---

## 🎨 Composants UI Recommandés

### 1. **Page Finances Vendeur** (`/vendeur/finances` ou `/appel-de-fonds`)

#### **Cards de Statistiques**

```tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Wallet, CheckCircle, Clock, DollarSign, TrendingUp } from 'lucide-react';

function VendorFinancesPage() {
  const [vendorFinances, setVendorFinances] = useState<VendorFinances | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendorFinances();
  }, []);

  const fetchVendorFinances = async () => {
    try {
      const response = await fetch('http://localhost:3004/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      setVendorFinances(data.data.vendorFinances);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Chargement...</div>;
  if (!vendorFinances) return <div>Erreur de chargement</div>;

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Mes Finances</h1>

      {/* Grille de cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* 1. Disponible pour appel de fonds */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Appel de Fonds
              </CardTitle>
              <Wallet className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">
              {formatCFA(vendorFinances.fundsRequestAvailableAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {vendorFinances.message}
            </p>
            {vendorFinances.fundsRequestAvailableAmount >= 5000 && (
              <button
                className="mt-4 w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                onClick={() => router.push('/vendeur/appel-de-fonds')}
              >
                Faire un appel de fonds
              </button>
            )}
          </CardContent>
        </Card>

        {/* 2. Gains totaux */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Gains Totaux
              </CardTitle>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-900">
              {formatCFA(vendorFinances.totalEarnings)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Toutes les commandes payées
            </p>
          </CardContent>
        </Card>

        {/* 3. En attente de livraison */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                En attente
              </CardTitle>
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-900">
              {formatCFA(vendorFinances.pendingOrdersAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Commandes payées mais non livrées
            </p>
          </CardContent>
        </Card>

        {/* 4. Déjà retiré */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-gray-600">
                Déjà Retiré
              </CardTitle>
              <CheckCircle className="h-5 w-5 text-gray-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">
              {formatCFA(vendorFinances.withdrawnAmount)}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Montant total retiré
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Détails par source de revenus */}
      <Card>
        <CardHeader>
          <CardTitle>Détails des Revenus Livrés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Produits vendus</span>
              <span className="font-bold text-lg">
                {formatCFA(vendorFinances.totalProductRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Designs vendus</span>
              <span className="font-bold text-lg">
                {formatCFA(vendorFinances.totalDesignRevenue)}
              </span>
            </div>
            <hr />
            <div className="flex justify-between items-center">
              <span className="text-gray-900 font-semibold">Total livré</span>
              <span className="font-bold text-xl text-blue-600">
                {formatCFA(vendorFinances.deliveredVendorAmount)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Message d'information */}
      {vendorFinances.message && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800">{vendorFinances.message}</p>
        </div>
      )}

      {/* Avertissement si solde insuffisant */}
      {vendorFinances.availableForWithdrawal < 5000 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800 font-medium">
            ⚠️ Montant minimum de retrait : 5 000 FCFA
          </p>
          <p className="text-yellow-700 text-sm mt-1">
            {vendorFinances.availableForWithdrawal > 0
              ? `Il vous manque ${formatCFA(5000 - vendorFinances.availableForWithdrawal)} pour pouvoir effectuer un retrait.`
              : 'Vous devez avoir au moins une commande livrée pour demander un retrait.'
            }
          </p>
        </div>
      )}
    </div>
  );
}

// Fonction utilitaire pour formater les montants
function formatCFA(amount: number): string {
  return `${(amount).toLocaleString('fr-FR')} F`;
}
```

---

### 2. **Formulaire de Demande de Retrait** (`/vendeur/demande-retrait`)

```tsx
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface WithdrawalFormData {
  amount: number;
  description: string;
  paymentMethod: 'WAVE' | 'ORANGE_MONEY' | 'BANK_TRANSFER';
  phoneNumber?: string;
  iban?: string;
}

function WithdrawalRequestPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<WithdrawalFormData>({
    amount: 0,
    description: '',
    paymentMethod: 'WAVE',
    phoneNumber: '',
    iban: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableBalance, setAvailableBalance] = useState(0);

  useEffect(() => {
    // Récupérer le solde disponible
    fetchAvailableBalance();
  }, []);

  const fetchAvailableBalance = async () => {
    try {
      const response = await fetch('http://localhost:3004/orders/my-orders', {
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();
      // Utiliser fundsRequestAvailableAmount pour l'appel de fonds
      setAvailableBalance(data.data.vendorFinances.fundsRequestAvailableAmount);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validation côté client
      if (formData.amount < 5000) {
        throw new Error('Le montant minimum de retrait est de 5 000 FCFA');
      }

      if (formData.amount > availableBalance) {
        throw new Error(`Solde insuffisant. Disponible : ${formatCFA(availableBalance)}`);
      }

      if (formData.paymentMethod !== 'BANK_TRANSFER' && !formData.phoneNumber) {
        throw new Error('Le numéro de téléphone est requis');
      }

      if (formData.paymentMethod === 'BANK_TRANSFER' && !formData.iban) {
        throw new Error('L\'IBAN est requis pour les virements bancaires');
      }

      // Envoyer la demande
      const response = await fetch('http://localhost:3004/vendor-funds/request', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erreur lors de la demande');
      }

      // Succès
      alert('✅ Demande de retrait envoyée avec succès !');
      router.push('/vendeur/finances');

    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Demande de Retrait</h1>

      {/* Afficher le solde disponible */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-gray-600">Solde disponible</p>
        <p className="text-3xl font-bold text-blue-900">
          {formatCFA(availableBalance)}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Montant */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Montant à retirer (min. 5 000 FCFA)
          </label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
            className="w-full px-4 py-2 border rounded-lg"
            required
            min={5000}
            max={availableBalance}
          />
          <p className="text-xs text-gray-500 mt-1">
            Maximum : {formatCFA(availableBalance)}
          </p>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg"
            required
            rows={3}
            placeholder="Ex: Retrait mensuel janvier 2026"
          />
        </div>

        {/* Méthode de paiement */}
        <div>
          <label className="block text-sm font-medium mb-2">
            Méthode de paiement
          </label>
          <select
            value={formData.paymentMethod}
            onChange={(e) => setFormData({
              ...formData,
              paymentMethod: e.target.value as any
            })}
            className="w-full px-4 py-2 border rounded-lg"
          >
            <option value="WAVE">Wave</option>
            <option value="ORANGE_MONEY">Orange Money</option>
            <option value="BANK_TRANSFER">Virement Bancaire</option>
          </select>
        </div>

        {/* Numéro de téléphone (si Wave ou Orange Money) */}
        {formData.paymentMethod !== 'BANK_TRANSFER' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
              placeholder="77 123 45 67"
            />
          </div>
        )}

        {/* IBAN (si virement bancaire) */}
        {formData.paymentMethod === 'BANK_TRANSFER' && (
          <div>
            <label className="block text-sm font-medium mb-2">
              IBAN
            </label>
            <input
              type="text"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg"
              required
              placeholder="SN12 1234 5678 9012 3456 7890 123"
            />
          </div>
        )}

        {/* Erreur */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">❌ {error}</p>
          </div>
        )}

        {/* Boutons */}
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            type="submit"
            disabled={loading || formData.amount < 5000 || formData.amount > availableBalance}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Envoi...' : 'Envoyer la demande'}
          </button>
        </div>
      </form>

      {/* Informations */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold mb-2">ℹ️ Informations importantes</h3>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• Montant minimum : 5 000 FCFA</li>
          <li>• Montant maximum : 10 000 000 FCFA</li>
          <li>• Maximum 3 demandes par jour</li>
          <li>• Seules les commandes livrées peuvent être retirées</li>
          <li>• Délai de traitement : 24-48 heures</li>
        </ul>
      </div>
    </div>
  );
}
```

---

### 3. **Page Ventes Vendeur** (`/vendeur/sales`)

Mettre à jour l'affichage des statistiques pour inclure les designs :

```tsx
function VendorSalesPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    const response = await fetch('http://localhost:3004/orders/my-orders', {
      headers: {
        'Authorization': `Bearer ${getToken()}`,
        'Content-Type': 'application/json'
      }
    });

    const result = await response.json();
    setData(result.data);
  };

  if (!data) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Mes Ventes</h1>

      {/* Cards de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Gains Totaux</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCFA(data.statistics.totalVendorAmount)}
            </div>
            <p className="text-xs text-gray-500">
              Produits + Designs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Livrés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCFA(data.vendorFinances?.deliveredVendorAmount || 0)}
            </div>
            <p className="text-xs text-gray-500">
              {data.vendorFinances?.deliveredOrdersCount || 0} commandes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatCFA(data.vendorFinances?.pendingOrdersAmount || 0)}
            </div>
            <p className="text-xs text-gray-500">
              Non encore livrés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des commandes */}
      <OrdersTable orders={data.orders} />
    </div>
  );
}
```

---

## 🚨 Gestion des Erreurs

### Erreurs Courantes lors de la Demande de Retrait

```typescript
// 1. Montant insuffisant
{
  "statusCode": 400,
  "message": "Solde insuffisant. Disponible: 8 000 FCFA, Demandé: 10 000 FCFA. Vous devez attendre que vos commandes soient livrées ou que vos demandes en attente soient traitées."
}

// 2. Montant minimum non atteint
{
  "statusCode": 400,
  "message": "Le montant minimum de retrait est de 5 000 FCFA"
}

// 3. Pas de commandes livrées
{
  "statusCode": 400,
  "message": "Vous devez avoir au moins une commande livrée pour demander un retrait. Seules les commandes livrées peuvent être retirées."
}

// 4. Limite quotidienne atteinte
{
  "statusCode": 400,
  "message": "Vous avez atteint la limite de 3 demandes de retrait par jour. Veuillez réessayer demain."
}

// 5. Montant maximum dépassé
{
  "statusCode": 400,
  "message": "Le montant maximum de retrait est de 10 000 000 FCFA"
}
```

### Exemple de gestion d'erreurs :

```typescript
try {
  const response = await fetch('http://localhost:3004/vendor-funds/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
  });

  const data = await response.json();

  if (!response.ok) {
    // Afficher l'erreur à l'utilisateur
    switch (response.status) {
      case 400:
        // Erreur de validation
        showError(data.message);
        break;
      case 401:
        // Non authentifié
        router.push('/login');
        break;
      case 403:
        // Accès interdit
        showError('Vous n\'avez pas les permissions nécessaires');
        break;
      default:
        showError('Une erreur est survenue. Veuillez réessayer.');
    }
    return;
  }

  // Succès
  showSuccess('Demande de retrait envoyée avec succès !');
  router.push('/vendeur/finances');

} catch (error) {
  console.error('Erreur:', error);
  showError('Erreur de connexion. Vérifiez votre connexion internet.');
}
```

---

## 🎨 Composants Réutilisables

### **AmountDisplay** - Afficher un montant avec badge de statut

```tsx
interface AmountDisplayProps {
  amount: number;
  label: string;
  status?: 'available' | 'pending' | 'withdrawn' | 'total';
  icon?: React.ReactNode;
}

function AmountDisplay({ amount, label, status = 'total', icon }: AmountDisplayProps) {
  const statusColors = {
    available: 'bg-blue-50 border-blue-200 text-blue-900',
    pending: 'bg-orange-50 border-orange-200 text-orange-900',
    withdrawn: 'bg-gray-50 border-gray-200 text-gray-900',
    total: 'bg-green-50 border-green-200 text-green-900',
  };

  return (
    <div className={`border rounded-lg p-4 ${statusColors[status]}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium opacity-75">{label}</span>
        {icon}
      </div>
      <div className="text-3xl font-bold">
        {formatCFA(amount)}
      </div>
    </div>
  );
}

// Utilisation
<AmountDisplay
  amount={vendorFinances.availableForWithdrawal}
  label="Disponible"
  status="available"
  icon={<Wallet className="h-5 w-5" />}
/>
```

---

### **WithdrawalButton** - Bouton de retrait conditionnel

```tsx
interface WithdrawalButtonProps {
  availableAmount: number;
  minAmount?: number;
  onClick: () => void;
}

function WithdrawalButton({
  availableAmount,
  minAmount = 5000,
  onClick
}: WithdrawalButtonProps) {
  const canWithdraw = availableAmount >= minAmount;

  return (
    <div className="space-y-2">
      <button
        onClick={onClick}
        disabled={!canWithdraw}
        className={`
          w-full py-3 rounded-lg font-semibold transition-colors
          ${canWithdraw
            ? 'bg-blue-600 text-white hover:bg-blue-700'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }
        `}
      >
        {canWithdraw ? 'Demander un retrait' : 'Montant insuffisant'}
      </button>

      {!canWithdraw && availableAmount > 0 && (
        <p className="text-xs text-center text-orange-600">
          Il vous manque {formatCFA(minAmount - availableAmount)}
        </p>
      )}
    </div>
  );
}
```

---

## 📊 Graphiques Recommandés

### **Évolution des Gains** (Chart.js ou Recharts)

```tsx
import { Line } from 'recharts';

function EarningsChart({ vendorFinances }: { vendorFinances: VendorFinances }) {
  const data = [
    { name: 'Total', value: vendorFinances.totalEarnings },
    { name: 'Livré', value: vendorFinances.deliveredVendorAmount },
    { name: 'Retiré', value: vendorFinances.withdrawnAmount },
    { name: 'Disponible', value: vendorFinances.availableForWithdrawal },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition des Gains</CardTitle>
      </CardHeader>
      <CardContent>
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => formatCFA(value as number)} />
          <Bar dataKey="value" fill="#3B82F6" />
        </BarChart>
      </CardContent>
    </Card>
  );
}
```

---

## ✅ Checklist d'Intégration

### Frontend

- [ ] Installer les dépendances UI (shadcn/ui, lucide-react, etc.)
- [ ] Créer le service API pour `/orders/my-orders`
- [ ] Créer le service API pour `/vendor-funds/request`
- [ ] Implémenter la page Finances Vendeur
- [ ] Implémenter le formulaire de demande de retrait
- [ ] Ajouter la gestion des erreurs
- [ ] Mettre à jour la page Ventes pour inclure les designs
- [ ] Ajouter les notifications de succès/erreur
- [ ] Tester avec différents scénarios (solde insuffisant, limite quotidienne, etc.)

### Tests

- [ ] Tester avec un vendeur ayant 0 commandes livrées
- [ ] Tester avec un vendeur ayant des commandes livrées
- [ ] Tester la demande de retrait avec montant < 5 000 FCFA
- [ ] Tester la demande de retrait avec montant > disponible
- [ ] Tester la limite de 3 demandes par jour
- [ ] Tester l'affichage des designs dans les statistiques
- [ ] Vérifier que `pendingOrdersAmount` n'est jamais négatif

---

## 🔗 Endpoints Complets

### GET `/orders/my-orders`
```bash
curl -X GET 'http://localhost:3004/orders/my-orders' \
  -H 'Authorization: Bearer <token>'
```

### POST `/vendor-funds/request`
```bash
curl -X POST 'http://localhost:3004/vendor-funds/request' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 10000,
    "description": "Retrait mensuel",
    "paymentMethod": "WAVE",
    "phoneNumber": "771234567"
  }'
```

---

## 💡 Conseils & Bonnes Pratiques

1. **Toujours afficher le solde disponible** avant de permettre une demande de retrait
2. **Désactiver le bouton de retrait** si le montant est insuffisant
3. **Afficher des messages clairs** sur pourquoi le retrait n'est pas possible
4. **Mettre en évidence les commandes en attente de livraison** pour expliquer pourquoi l'argent n'est pas disponible
5. **Rafraîchir les données** après chaque action (demande de retrait, nouvelle commande, etc.)
6. **Gérer les cas où les designs sont à 0** (ne pas afficher la ligne si aucun design vendu)

---

## 🎯 Exemple de Workflow Utilisateur

1. **Vendeur se connecte** → Voit le dashboard avec ses finances
2. **Clique sur "Mes Finances"** → Voit les 4 cards (Disponible, Total, En attente, Retiré)
3. **Voit qu'il a 38 000 F disponibles** (2 commandes livrées)
4. **Clique sur "Demander un retrait"** → Accède au formulaire
5. **Remplit le formulaire** (montant, méthode, téléphone)
6. **Valide** → La demande est envoyée
7. **Reçoit une notification** → "Demande envoyée avec succès"
8. **Le montant passe en "En attente de retrait"** → Disponible diminue de 38 000 F à 0 F
9. **Admin valide** → Le montant passe en "Retiré"

---

## 📞 Support

Pour toute question ou problème :
- **Backend** : Vérifier les logs dans `src/order/order.controller.ts` et `src/vendor-funds/vendor-funds.service.ts`
- **Frontend** : Vérifier la console du navigateur pour les erreurs API
- **Documentation API** : Voir `/docs/API_REFERENCE_VENDOR_FINANCES.md`

---

**Date** : 09 février 2026
**Version** : 1.0.0
**Auteur** : Claude Sonnet 4.5

---

**✨ Bon développement !**
