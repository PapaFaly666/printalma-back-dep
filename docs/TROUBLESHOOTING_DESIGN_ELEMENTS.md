# Troubleshooting: designElements est vide

## Problème

Lors de la sauvegarde d'une personnalisation, le champ `designElements` arrive vide au backend.

---

## Causes possibles et solutions

### 1. Double JSON.stringify (cause la plus fréquente)

**Symptôme:** `designElements` arrive comme string `"[]"` ou `"[{...}]"` au lieu d'un array.

**Code incorrect:**
```typescript
// ❌ NE PAS FAIRE
const response = await fetch('/api/customizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 123,
    designElements: JSON.stringify(elements)  // ERREUR: double stringify!
  })
});
```

**Code correct:**
```typescript
// ✅ CORRECT
const response = await fetch('/api/customizations', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    productId: 123,
    designElements: elements  // Directement l'array, pas de stringify
  })
});
```

---

### 2. Array vide ou undefined

**Symptôme:** `designElements: []` ou `designElements: undefined`

**Vérification à faire:**
```typescript
// Avant d'envoyer, vérifier les données
console.log('=== DEBUG AVANT ENVOI ===');
console.log('elements:', elements);
console.log('Type:', typeof elements);
console.log('Is Array:', Array.isArray(elements));
console.log('Length:', elements?.length);

if (!elements || elements.length === 0) {
  console.error('ERREUR: Aucun élément à envoyer!');
  return;
}

// Afficher le premier élément pour vérifier la structure
console.log('Premier élément:', JSON.stringify(elements[0], null, 2));
```

**Causes possibles:**
- Le state `elements` n'est pas mis à jour avant l'envoi
- La référence au state est stale (problème de closure)
- Les éléments sont filtrés par erreur

---

### 3. Mauvais nom de propriété

**Symptôme:** Le backend ne reçoit pas la propriété.

**Vérification:**
```typescript
// Vérifier l'orthographe exacte
const payload = {
  productId: 123,
  colorVariationId: 1,
  viewId: 5,
  designElements: elements,  // Pas "design_elements" ou "elements"
  sizeSelections: sizes,     // Pas "size_selections"
  sessionId: sessionId
};

console.log('Payload complet:', JSON.stringify(payload, null, 2));
```

---

### 4. Problème avec le Content-Type

**Symptôme:** Le body n'est pas parsé correctement.

**Code correct:**
```typescript
const response = await fetch('/api/customizations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'  // OBLIGATOIRE
  },
  body: JSON.stringify(payload)
});
```

**Erreur courante avec axios:**
```typescript
// ❌ Axios stringify automatiquement, ne pas re-stringify
axios.post('/api/customizations', JSON.stringify(payload));

// ✅ Correct avec axios
axios.post('/api/customizations', payload);
```

---

### 5. State React non mis à jour (closure stale)

**Symptôme:** Les données envoyées ne correspondent pas à ce qui est affiché.

**Code problématique:**
```typescript
const [elements, setElements] = useState([]);

const handleSave = async () => {
  // ❌ PROBLÈME: elements peut être stale ici
  await saveCustomization(elements);
};
```

**Solution avec useRef:**
```typescript
const [elements, setElements] = useState([]);
const elementsRef = useRef(elements);

// Garder la ref à jour
useEffect(() => {
  elementsRef.current = elements;
}, [elements]);

const handleSave = async () => {
  // ✅ Toujours la dernière valeur
  await saveCustomization(elementsRef.current);
};
```

**Solution avec callback:**
```typescript
const handleSave = async () => {
  // ✅ Utiliser le callback pour obtenir la dernière valeur
  setElements(currentElements => {
    saveCustomization(currentElements);
    return currentElements;
  });
};
```

---

### 6. Transformation incorrecte des éléments

**Symptôme:** Les éléments existent mais sont mal formatés.

**Vérifier la structure de chaque élément:**

```typescript
// Structure attendue pour un TextElement
const textElement = {
  id: "el_1699123456789",      // string, requis
  type: "text",                 // "text" ou "image", requis
  x: 0.5,                       // number 0-1, requis
  y: 0.3,                       // number 0-1, requis
  width: 200,                   // number > 0, requis
  height: 50,                   // number > 0, requis
  rotation: 0,                  // number, requis
  zIndex: 0,                    // number, requis
  text: "Mon texte",            // string, requis pour text
  fontSize: 24,                 // number, requis pour text
  baseFontSize: 24,             // number, requis pour text
  baseWidth: 200,               // number, requis pour text
  fontFamily: "Arial",          // string, requis pour text
  color: "#000000",             // string hex, requis pour text
  fontWeight: "normal",         // "normal" | "bold"
  fontStyle: "normal",          // "normal" | "italic"
  textDecoration: "none",       // "none" | "underline"
  textAlign: "center",          // "left" | "center" | "right"
  curve: 0                      // number
};

// Structure attendue pour un ImageElement
const imageElement = {
  id: "el_1699123456790",
  type: "image",
  x: 0.5,
  y: 0.6,
  width: 150,
  height: 150,
  rotation: 15,
  zIndex: 1,
  imageUrl: "https://res.cloudinary.com/...",  // requis pour image
  naturalWidth: 500,                            // requis pour image
  naturalHeight: 500                            // requis pour image
};
```

**Fonction de validation:**
```typescript
const validateElement = (element: any, index: number): string[] => {
  const errors: string[] = [];

  if (!element.id) errors.push(`Element ${index}: missing id`);
  if (!element.type) errors.push(`Element ${index}: missing type`);
  if (typeof element.x !== 'number') errors.push(`Element ${index}: x must be number`);
  if (typeof element.y !== 'number') errors.push(`Element ${index}: y must be number`);
  if (element.x < 0 || element.x > 1) errors.push(`Element ${index}: x must be 0-1`);
  if (element.y < 0 || element.y > 1) errors.push(`Element ${index}: y must be 0-1`);

  if (element.type === 'text') {
    if (!element.text) errors.push(`Element ${index}: missing text`);
    if (!element.fontSize) errors.push(`Element ${index}: missing fontSize`);
    if (!element.fontFamily) errors.push(`Element ${index}: missing fontFamily`);
    if (!element.color) errors.push(`Element ${index}: missing color`);
  }

  if (element.type === 'image') {
    if (!element.imageUrl) errors.push(`Element ${index}: missing imageUrl`);
  }

  return errors;
};

// Utilisation avant envoi
const allErrors = elements.flatMap((el, i) => validateElement(el, i));
if (allErrors.length > 0) {
  console.error('Validation errors:', allErrors);
  return;
}
```

---

## Debugging complet

Ajoutez ce code avant d'envoyer la requête:

```typescript
const debugAndSave = async () => {
  console.log('========== DEBUG CUSTOMIZATION ==========');

  // 1. Vérifier les éléments
  console.log('1. Elements state:');
  console.log('   - Value:', elements);
  console.log('   - Type:', typeof elements);
  console.log('   - Is Array:', Array.isArray(elements));
  console.log('   - Length:', elements?.length || 0);

  if (elements && elements.length > 0) {
    console.log('   - First element type:', elements[0]?.type);
    console.log('   - First element:', elements[0]);
  }

  // 2. Construire le payload
  const payload = {
    productId,
    colorVariationId,
    viewId,
    designElements: elements,
    sizeSelections: selectedSizes,
    sessionId: localStorage.getItem('guest-session-id')
  };

  console.log('2. Payload to send:');
  console.log('   - Full payload:', payload);
  console.log('   - designElements in payload:', payload.designElements);
  console.log('   - designElements length:', payload.designElements?.length);

  // 3. Vérifier le JSON
  const jsonString = JSON.stringify(payload);
  console.log('3. JSON string length:', jsonString.length);
  console.log('4. JSON preview:', jsonString.substring(0, 500) + '...');

  // 4. Envoyer
  try {
    const response = await fetch('/api/customizations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: jsonString
    });

    console.log('5. Response status:', response.status);

    const result = await response.json();
    console.log('6. Response body:', result);

    if (result.designElements) {
      console.log('7. Saved designElements length:', result.designElements.length);
    }

    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
};
```

---

## Test avec cURL

Pour tester si le problème vient du frontend ou du backend:

```bash
curl -X POST http://localhost:3000/api/customizations \
  -H "Content-Type: application/json" \
  -d '{
    "productId": 1,
    "colorVariationId": 1,
    "viewId": 1,
    "designElements": [
      {
        "id": "test_1",
        "type": "text",
        "x": 0.5,
        "y": 0.5,
        "width": 200,
        "height": 50,
        "rotation": 0,
        "zIndex": 0,
        "text": "Test depuis cURL",
        "fontSize": 24,
        "baseFontSize": 24,
        "baseWidth": 200,
        "fontFamily": "Arial",
        "color": "#FF0000",
        "fontWeight": "normal",
        "fontStyle": "normal",
        "textDecoration": "none",
        "textAlign": "center",
        "curve": 0
      }
    ],
    "sessionId": "test_curl_session"
  }'
```

**Si cURL fonctionne:** Le problème est côté frontend.
**Si cURL échoue aussi:** Le problème est côté backend.

---

## Logs backend

Le backend affiche maintenant des logs de debug. Après avoir fait une requête, vérifiez les logs du serveur:

```
📥 Received customization request:
  - productId: 123
  - colorVariationId: 1
  - viewId: 5
  - designElements: 3 elements      ← Devrait afficher le nombre
  - designElements type: object     ← Devrait être "object"
  - First element: {"id":"el_123","type":"text"...
```

Si vous voyez:
```
⚠️ designElements is empty or undefined!
  - Raw value: []
```

Cela confirme que le frontend n'envoie pas les données correctement.

---

## Checklist rapide

- [ ] `designElements` est un Array (pas un string)
- [ ] Le Content-Type est `application/json`
- [ ] Pas de double `JSON.stringify`
- [ ] Le state n'est pas stale (useRef ou callback)
- [ ] Les éléments ont la bonne structure (id, type, x, y, width, height...)
- [ ] Les propriétés sont bien nommées (camelCase)
- [ ] Les valeurs numériques sont des numbers (pas des strings)

---

## Contact

Si le problème persiste après ces vérifications, partagez:
1. Le code de la fonction d'envoi
2. Les logs de la console navigateur
3. Les logs du serveur backend
4. La réponse du Network tab (Developer Tools)
