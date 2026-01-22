# 📱 Guida Completa Tag NFC

## 🛒 **Acquisto Tag NFC**

### **Tag Consigliati:**
- **Tipo**: NTAG213, NTAG215 o NTAG216
- **Formato**: Adesivi circolari 25-30mm (più pratici)
- **Memoria**: NTAG213 (180 byte) è sufficiente
- **Quantità**: 1 tag per locale + 2-3 di scorta
- **Prezzo**: 0.50-2€ per tag

### **Dove Acquistare:**
- **Amazon**: "NTAG213 NFC tag adesivi"
- **AliExpress**: Più economici ma tempi lunghi
- **Negozi elettronica**: Disponibilità immediata

## 📝 **Programmazione Tag NFC**

### **App Necessarie:**

**Android (Consigliata):**
- **NFC Tools** (gratuita) - La migliore
- **TagWriter** di NXP
- **Trigger** (avanzata)

**iPhone:**
- **NFC TagInfo** 
- **GoToTags**
- Nota: iPhone supporta NFC solo da iOS 11+

### **Step-by-Step Programmazione:**

#### **1. Preparazione**
```
Tag da programmare:
- TAG001 → Locale Tecnico Scala Antincendio F2
- TAG002 → Locale Tecnico Primo Piano  
- TAG003 → Locale Tecnico Secondo Piano
- TAG004 → Locale Tecnico Terzo Piano
- TAG005 → Locale Tecnico Seminterrato
```

#### **2. Programmazione con NFC Tools**

**Per ogni tag:**

1. **Apri "NFC Tools"**
2. **Vai su "Scrivi"**
3. **Clicca "Aggiungi record"**
4. **Seleziona "Testo"**
5. **Scrivi l'ID esatto** (es: `TAG001`)
6. **Clicca "Scrivi"**
7. **Avvicina il tag NFC** al telefono
8. **Attendi conferma** "Scrittura completata"

#### **3. Verifica Programmazione**

1. **Vai su "Leggi"** in NFC Tools
2. **Avvicina il tag**
3. **Verifica che mostri** il testo corretto (es: "TAG001")

## 🏷️ **Etichettatura Fisica**

### **Etichette Consigliate:**
```
TAG001
Locale Tecnico 
Scala Antincendio F2
Sala UPS

TAG002  
Locale Tecnico
Primo Piano
UPS e Quadri Elettrici
```

### **Materiali:**
- **Etichette plastificate** (resistenti all'umidità)
- **Pennarello indelebile**
- **Plastificatrice** (opzionale ma consigliata)

## 📍 **Posizionamento Tag**

### **Dove Posizionare:**
- **Altezza**: 120-150cm (comoda per scansione)
- **Superficie**: Liscia, non metallica
- **Visibilità**: Ben visibile e illuminata
- **Protezione**: Al riparo da urti e intemperie

### **Dove NON Posizionare:**
- ❌ Su superfici metalliche (interferenze)
- ❌ Vicino a magneti o trasformatori
- ❌ In zone con forte umidità
- ❌ Dove possono essere facilmente rimossi

## 🔧 **Configurazione App**

### **Aggiornare config.js:**

Per ogni tag programmato, aggiungi/modifica in `config.js`:

```javascript
TECHNICAL_ROOMS: {
    'TAG001': {
        name: 'Locale Tecnico Scala Antincendio F2',
        description: 'Sala UPS - Controllo alimentazione',
        expectedLocation: { 
            lat: 37.5021,    // ← SOSTITUIRE con coordinate reali
            lng: 15.0877,    // ← SOSTITUIRE con coordinate reali  
            radius: 30       // ← Raggio tolleranza in metri
        }
    }
    // ... altri tag
}
```

### **Come Ottenere Coordinate GPS:**

1. **Vai su Google Maps**
2. **Cerca l'indirizzo** del tuo edificio
3. **Clicca destro** sulla posizione esatta del locale
4. **Seleziona "Cosa c'è qui?"**
5. **Copia le coordinate** che appaiono (es: 37.5021, 15.0877)
6. **Sostituisci** i valori in `config.js`

## 🧪 **Test e Verifica**

### **Test Singolo Tag:**

1. **Apri l'app** sul telefono
2. **Seleziona operatore**
3. **Vai nel locale** con il tag
4. **Scansiona il tag**
5. **Verifica che appaia** il nome corretto del locale
6. **Controlla GPS** (deve essere verde se sei nel posto giusto)

### **Test Completo Sistema:**

```
✅ Tag programmato correttamente
✅ Etichetta fisica applicata  
✅ Posizionamento ottimale
✅ Coordinate GPS configurate
✅ Test scansione OK
✅ Dati arrivano su Google Sheet
```

## 🔄 **Manutenzione Tag**

### **Controlli Periodici:**
- **Mensile**: Verifica adesione tag
- **Trimestrale**: Test funzionamento
- **Semestrale**: Pulizia superficie

### **Sostituzione Tag:**
- Se danneggiato fisicamente
- Se non risponde alla scansione
- Se l'adesivo si stacca

### **Backup Configurazione:**
- Tieni una lista scritta degli ID tag
- Foto della posizione di ogni tag
- Coordinate GPS salvate separatamente

## 🚨 **Risoluzione Problemi**

### **Tag non rilevato:**
- Verifica NFC attivo sul telefono
- Prova con app "NFC Tools" per test
- Controlla che il tag non sia danneggiato
- Assicurati di usare Chrome/Edge

### **Tag rilevato ma non riconosciuto:**
- Verifica l'ID scritto sul tag
- Controlla che sia configurato in `config.js`
- Verifica maiuscole/minuscole (deve essere identico)

### **GPS non valido:**
- Controlla coordinate in Google Maps
- Aumenta il raggio di tolleranza
- Verifica di essere all'aperto
- Attendi stabilizzazione GPS (30-60 secondi)

## 💡 **Consigli Pratici**

### **Sicurezza:**
- Non scrivere informazioni sensibili sui tag
- Usa solo ID generici (TAG001, TAG002, etc.)
- Tieni un registro separato delle corrispondenze

### **Efficienza:**
- Programma tutti i tag in una sessione
- Testa immediatamente dopo programmazione
- Applica subito le etichette fisiche
- Documenta la posizione con foto

### **Espansione:**
- Lascia spazio per numerazione futura (TAG006, TAG007...)
- Mantieni uno schema coerente
- Aggiorna sempre `config.js` prima di installare nuovi tag

---

**🎯 Seguendo questa guida avrai un sistema NFC professionale e affidabile per i controlli notturni!**