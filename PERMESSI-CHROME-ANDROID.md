# 📱 Guida Permessi Chrome Android - Passo Passo

## 🔧 **Metodo 1: Permessi dal Sito (Più Semplice)**

### **Step 1: Apri l'App**
1. **Apri Chrome** su Android
2. **Vai all'URL** della tua app (es: https://tuaapp.netlify.app)
3. **Clicca "Scansiona Tag NFC"**

### **Step 2: Gestisci Popup Permessi**
Quando clicchi per scansionare, apparirà un popup:

```
┌─────────────────────────────────────┐
│ 🔒 tuaapp.netlify.app vuole         │
│                                     │
│ 📱 Accedere ai tuoi tag NFC         │
│                                     │
│ [BLOCCA]           [CONSENTI]       │
└─────────────────────────────────────┘
```

**👆 CLICCA "CONSENTI"**

### **Step 3: Se Non Appare il Popup**
Se il popup non appare o hai cliccato "Blocca":

1. **Guarda la barra indirizzi** di Chrome
2. **Cerca l'icona 🔒** o **⚠️** accanto all'URL
3. **Clicca sull'icona**

## 🔧 **Metodo 2: Impostazioni Sito**

### **Step 1: Accedi alle Impostazioni Sito**
1. **Apri l'app** in Chrome
2. **Clicca l'icona 🔒** nella barra indirizzi
3. **Seleziona "Impostazioni sito"**

### **Step 2: Trova NFC**
Nella schermata "Impostazioni sito":

```
┌─────────────────────────────────────┐
│ Impostazioni sito                   │
│                                     │
│ 📍 Posizione          ✅ Consentita │
│ 📱 NFC               ❌ Bloccata    │ ← QUESTO
│ 🔔 Notifiche         ❌ Bloccata    │
│ 📷 Fotocamera        ❌ Bloccata    │
│                                     │
└─────────────────────────────────────┘
```

### **Step 3: Abilita NFC**
1. **Clicca su "NFC"**
2. **Seleziona "Consenti"**
3. **Torna indietro** e ricarica la pagina

## 🔧 **Metodo 3: Impostazioni Chrome Globali**

### **Step 1: Menu Chrome**
1. **Apri Chrome**
2. **Clicca i tre puntini** (⋮) in alto a destra
3. **Seleziona "Impostazioni"**

### **Step 2: Impostazioni Sito**
```
┌─────────────────────────────────────┐
│ Impostazioni Chrome                 │
│                                     │
│ 🔍 Ricerca                          │
│ 🔒 Privacy e sicurezza              │
│ 🌐 Impostazioni sito               │ ← CLICCA QUI
│ 📱 Accessibilità                    │
│                                     │
└─────────────────────────────────────┘
```

### **Step 3: Trova NFC**
Scorri fino a trovare:

```
┌─────────────────────────────────────┐
│ Impostazioni sito                   │
│                                     │
│ 📍 Posizione                        │
│ 🎤 Microfono                        │
│ 📱 NFC                             │ ← CLICCA QUI
│ 🔔 Notifiche                        │
│                                     │
└─────────────────────────────────────┘
```

### **Step 4: Configura NFC**
1. **Clicca "NFC"**
2. **Attiva "Chiedi prima di accedere"**
3. **Trova il tuo sito** nella lista
4. **Cambia da "Blocca" a "Consenti"**

## 🔧 **Metodo 4: Reset Completo**

Se niente funziona:

### **Step 1: Cancella Dati Sito**
1. **Chrome** → **⋮** → **Impostazioni**
2. **Privacy e sicurezza** → **Cancella dati di navigazione**
3. **Avanzate** → **Seleziona "Tutti i dati"**
4. **Cancella dati**

### **Step 2: Ricarica e Riprova**
1. **Vai di nuovo** all'app
2. **Clicca "Scansiona NFC"**
3. **Questa volta clicca "CONSENTI"** nel popup

## ⚙️ **Verifica Impostazioni Android**

### **Prima di tutto, verifica che NFC sia attivo:**

1. **Impostazioni Android** → **Connessioni**
2. **Verifica che "NFC" sia ATTIVO**

```
┌─────────────────────────────────────┐
│ Connessioni                         │
│                                     │
│ 📶 Wi-Fi                            │
│ 📱 Bluetooth                        │
│ 📡 NFC                    [ON] ✅   │ ← DEVE ESSERE ON
│ 🔗 Android Beam          [ON] ✅   │
│                                     │
└─────────────────────────────────────┘
```

## 🧪 **Test Rapido**

### **Verifica che tutto funzioni:**

1. **Scarica "NFC Tools"** dal Play Store
2. **Testa con un tag NFC** qualsiasi
3. **Se funziona** → problema permessi Chrome
4. **Se non funziona** → problema hardware/Android

## 🚨 **Risoluzione Problemi**

### **"Non vedo l'icona 🔒 nella barra indirizzi"**
- L'app deve essere su **HTTPS** (non HTTP)
- Verifica che l'URL inizi con `https://`

### **"Non trovo NFC nelle impostazioni"**
- Il dispositivo potrebbe non avere chip NFC
- Verifica in **Impostazioni Android** → **Connessioni**

### **"Il popup non appare mai"**
- NFC potrebbe essere già bloccato
- Usa **Metodo 2** o **Metodo 3** sopra

### **"Dice sempre 'Permessi negati'"**
- Prova **Metodo 4** (reset completo)
- Riavvia Chrome
- Riavvia il telefono

## 📱 **Dispositivi Specifici**

### **Samsung:**
- **Impostazioni** → **Connessioni** → **NFC e pagamenti**
- Attiva **"NFC"** e **"Tocca e paga"**

### **Xiaomi:**
- **Impostazioni** → **Connessione e condivisione** → **NFC**
- Attiva **"NFC"**

### **OnePlus:**
- **Impostazioni** → **Wi-Fi e Internet** → **NFC**
- Attiva **"NFC"**

## ✅ **Checklist Finale**

Prima di usare l'app, verifica:

- ✅ **NFC attivo** nelle impostazioni Android
- ✅ **Chrome aggiornato** (versione 89+)
- ✅ **Permessi NFC** consentiti per il sito
- ✅ **GPS attivo** e preciso
- ✅ **Connessione internet** per sincronizzazione

---

**🎯 Seguendo questa guida, Chrome avrà tutti i permessi necessari per usare l'NFC!**