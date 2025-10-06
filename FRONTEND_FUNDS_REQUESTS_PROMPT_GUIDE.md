# Prompt Frontend — Demandes de fonds (IBAN vs téléphone)

Objectif: Mettre à jour le formulaire de demande d’appel de fonds pour:
- Demander un IBAN quand la méthode = virement bancaire (BANK_TRANSFER)
- Demander un téléphone pour WAVE/ORANGE_MONEY (cacher IBAN)

## Règles
- paymentMethod === 'BANK_TRANSFER' → champ `iban` requis; `phoneNumber` non requis
- paymentMethod in ['WAVE', 'ORANGE_MONEY'] → champ `phoneNumber` requis; pas d’IBAN
- Validation IBAN: suppression des espaces, uppercase, regex standard IBAN

## UI (pseudo-React)
```tsx
const [paymentMethod, setPaymentMethod] = useState<'WAVE'|'ORANGE_MONEY'|'BANK_TRANSFER'>('WAVE');
const [phoneNumber, setPhoneNumber] = useState('');
const [iban, setIban] = useState('');

const isBank = paymentMethod === 'BANK_TRANSFER';

return (
  <form onSubmit={onSubmit}>
    <Select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
      <option value="WAVE">Wave</option>
      <option value="ORANGE_MONEY">Orange Money</option>
      <option value="BANK_TRANSFER">Virement bancaire</option>
    </Select>

    {!isBank && (
      <Input
        label="Téléphone"
        value={phoneNumber}
        onChange={e => setPhoneNumber(e.target.value)}
        required
      />
    )}

    {isBank && (
      <Input
        label="IBAN"
        value={iban}
        onChange={e => setIban(e.target.value)}
        placeholder="SN08 0000 0000 0000 0000 0000 0000"
        required
      />
    )}

    <Button type="submit">Demander</Button>
  </form>
);
```

## Payload
```ts
function buildPayload({ amount, description, paymentMethod, phoneNumber, iban }) {
  if (paymentMethod === 'BANK_TRANSFER') {
    return { amount, description, paymentMethod, iban };
  }
  return { amount, description, paymentMethod, phoneNumber };
}
```

## Appel API
```ts
await fetch(`${API_URL}/vendor/funds-requests`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(buildPayload(form))
});
```

## Gestion erreurs
- Si BANK_TRANSFER et IBAN invalide: afficher message backend "IBAN invalide".
- Si WAVE/ORANGE_MONEY et téléphone manquant/incorrect: message class-validator.
- Si solde insuffisant: afficher le message d’erreur retourné.

## Notes backend (référence)
- DTO: `iban` validé quand `paymentMethod === 'BANK_TRANSFER'`; `phoneNumber` requis sinon.
- Modèle: `VendorFundsRequest` inclut `phoneNumber?` et `bankIban?`.
- Service: stocke `bankIban` pour BANK_TRANSFER, sinon `phoneNumber`. Auto-approve si solde suffisant.
















