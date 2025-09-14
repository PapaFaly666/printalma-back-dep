💰 Prix préservé côté frontend: 1000
designService.ts:134 🍪 Utilisation de l'authentification par cookies
designService.ts:1106 🔍 Design en base: {id: 28, price: 0, prixOk: false, prixEnvoye: 1000, prixSauve: 0}
designService.ts:1115  ❌ FAIL: Prix incorrect en base: {envoyé: 1000, sauvé: 0}
createDesignViaVendorDesigns @ designService.ts:1115
await in createDesignViaVendorDesigns
createDesign @ designService.ts:925
await in createDesign
handleConfirmDesignPrice @ SellDesignPage.tsx:3128
executeDispatch @ react-dom-client.development.js:16368
runWithFiberInDEV @ react-dom-client.development.js:1519
processDispatchQueue @ react-dom-client.development.js:16418
(anonymous) @ react-dom-client.development.js:17016
batchedUpdates$1 @ react-dom-client.development.js:3262
dispatchEventForPluginEventSystem @ react-dom-client.development.js:16572
dispatchEvent @ react-dom-client.development.js:20658
dispatchDiscreteEvent @ react-dom-client.development.js:20626
designService.ts:1128 ⚠️ Attention: Le backend peut avoir mis le prix à 0 en base