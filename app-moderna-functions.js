// FUNZIONI JAVASCRIPT PER APP MODERNA
// Aggiungi questo script dopo api-client.js in app-moderna.html

// ===== GESTIONE OPERATORI =====

function loadSavedOperator() {
    const savedOperator = localStorage.getItem('currentOperator');
    if (savedOperator) {
        try {
            currentOperator = JSON.parse(savedOperator);
            updateOperatorDisplay();
        } catch (error) {
            console.error('Errore caricamento operatore salvato:', error);
        }
    }
}

function updateOperatorDisplay() {
    const displayElement = document.getElementById('operatorDisplay');
    if (currentOperator) {
        displayElement.textContent = currentOperator.name;
        displayElement.parentElement.querySelector('.operator-details').textContent = 
            `${currentOperator.code} - ${currentOperator.operator_id}`;
    } else {
        displayElement.textContent = '👤 Seleziona Operatore';
        displayElement.parentElement.querySelector('.operator-details').textContent = 
            'Clicca per scegliere l\'operatore';
    }
}

async function showOperatorSelection() {
    const modal = document.getElementById('operatorModal');
    const operatorsList = document.getElementById('operatorsList');
    
    modal.style.display = 'flex';
    operatorsList.innerHTML = '<div class="loading">Caricamento operatori...</div>';
    
    try {
        const operators = await api.getOperators();
        
        operatorsList.innerHTML = operators.map(operator => `
            <div class="operator-option" onclick="selectOperator('${operator.id}')">
                <h4>${operator.name}</h4>
                <p>Codice: ${operator.code} | ID: ${operator.operator_id}</p>
            </div>
        `).join('');
        
    } catch (error) {
        operatorsList.innerHTML = '<div style="color: #ef4444; text-align: center;">Errore caricamento operatori</div>';
    }
}

async function selectOperator(operatorId) {
    try {
        const operators = await api.getOperators();
        const operator = operators.find(op => op.id === operatorId);
        
        if (operator) {
            currentOperator = operator;
            localStorage.setItem('currentOperator', JSON.stringify(operator));
            updateOperatorDisplay();
            
            showSuccess(`Operatore selezionato: ${operator.name}`);
        }
        
    } catch (error) {
        showError('Errore selezione operatore');
    }
    
    document.getElementById('operatorModal').style.display = 'none';
}

// ===== GESTIONE GPS =====

function startGPSTracking() {
    if (!navigator.geolocation) {
        document.getElementById('gpsInfo').textContent = '❌ GPS non supportato';
        return;
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
    };
    
    navigator.geolocation.watchPosition(
        (position) => {
            currentPosition = position;
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            const accuracy = Math.round(position.coords.accuracy);
            
            document.getElementById('gpsInfo').innerHTML = 
                `📍 ${lat}, ${lng}<br><small>Precisione: ±${accuracy}m</small><br><small style="color: #10b981;">GPS attivo e funzionante</small>`;
        },
        (error) => {
            console.error('Errore GPS:', error);
            document.getElementById('gpsInfo').innerHTML = 
                `❌ Errore GPS: ${getGPSErrorMessage(error.code)}<br><small style="color: #ef4444;">Controlla impostazioni GPS</small>`;
        },
        options
    );
}

function getGPSErrorMessage(code) {
    switch(code) {
        case 1: return 'Permesso negato';
        case 2: return 'Posizione non disponibile';
        case 3: return 'Timeout';
        default: return 'Errore sconosciuto';
    }
}

// ===== GESTIONE NFC =====

function checkNFCSupport() {
    const scanButton = document.getElementById('scanButton');
    
    if ('NDEFReader' in window) {
        console.log('✅ NFC supportato');
    } else {
        scanButton.textContent = '❌ NFC non supportato su questo dispositivo';
        scanButton.disabled = true;
        console.log('⚠️ NFC non supportato');
    }
}

async function startNFCScan() {
    if (!('NDEFReader' in window)) {
        showError('NFC non supportato.\n\nSOLUZIONI:\n• Usa Chrome o Edge\n• Verifica chip NFC attivo\n• Android 7.0+ richiesto');
        return;
    }
    
    if (!currentOperator) {
        showError('Seleziona prima un operatore');
        showOperatorSelection();
        return;
    }
    
    const scanButton = document.getElementById('scanButton');
    
    try {
        scanButton.textContent = '🔍 Scansione in corso...';
        scanButton.disabled = true;
        
        const ndef = new NDEFReader();
        await ndef.scan();
        
        ndef.addEventListener('reading', ({ message, serialNumber }) => {
            handleNFCRead(serialNumber, message);
        });
        
        ndef.addEventListener('readingerror', (error) => {
            console.error('Errore lettura NFC:', error);
            showError('Errore durante la lettura del tag NFC.\nRiprova avvicinando meglio il telefono al tag.');
            resetScanButton();
        });
        
        // Timeout dopo 15 secondi
        setTimeout(() => {
            resetScanButton();
        }, 15000);
        
    } catch (error) {
        console.error('Errore NFC:', error);
        handleNFCError(error);
        resetScanButton();
    }
}

function resetScanButton() {
    const scanButton = document.getElementById('scanButton');
    scanButton.textContent = '📱 Scansiona Tag NFC';
    scanButton.disabled = false;
}

async function handleNFCRead(serialNumber, message) {
    resetScanButton();
    
    if (!currentOperator) {
        showError('Seleziona prima un operatore');
        return;
    }
    
    // Estrai ID tag
    let tagId = extractNFCMessage(message);
    if (!tagId || tagId === 'Tag NFC rilevato') {
        tagId = serialNumber;
    }
    
    console.log('Tag ID rilevato:', tagId);
    
    try {
        // Cerca impianto nel database
        const room = await api.getTechnicalRoomByTagId(tagId);
        
        if (!room) {
            // Tag sconosciuto - registra per approvazione
            await handleUnknownTag(tagId);
            return;
        }
        
        // Verifica posizione GPS prima di procedere
        const locationValid = validateLocation(room);
        const distance = calculateDistance(room);
        
        // Se la posizione non è valida, chiedi conferma all'operatore
        if (hasExpectedLocation(room) && !locationValid) {
            const allowedRadius = room.gps_radius || 50;
            const confirmMessage = `⚠️ ATTENZIONE - POSIZIONE GPS ANOMALA!\n\n` +
                `📍 Impianto: ${room.name}\n` +
                `📏 Distanza rilevata: ${Math.round(distance)}m\n` +
                `📏 Distanza massima consentita: ${allowedRadius}m\n\n` +
                `🤔 Sei sicuro di essere presso l'impianto corretto?\n\n` +
                `✅ CONFERMA per registrare comunque il controllo\n` +
                `❌ ANNULLA per non registrare`;
                
            if (!confirm(confirmMessage)) {
                showError('Controllo annullato dall\'operatore.\n\nSuggerimenti:\n• Verifica di essere presso l\'impianto corretto\n• Controlla che il GPS sia attivo e preciso\n• Riprova quando sei più vicino all\'impianto');
                return;
            }
        }
        
        // Crea record del controllo
        const locationValid = validateLocation(room);
        const distance = calculateDistance(room);
        
        const controlData = {
            control_id: generateControlId(),
            tag_id: tagId,
            room_id: room.id,
            operator_id: currentOperator.id,
            nfc_serial: serialNumber,
            timestamp: new Date().toISOString(),
            gps_lat: currentPosition?.coords.latitude,
            gps_lng: currentPosition?.coords.longitude,
            gps_accuracy: currentPosition?.coords.accuracy,
            location_valid: locationValid,
            distance_from_expected: distance,
            shift_type: getCurrentShift(),
            notes: generateLocationNote(room, locationValid, distance),
            synced: true
        };
        
        // Salva controllo
        await api.addControl(controlData);
        
        // Aggiorna UI
        await refreshData();
        
        // Feedback successo con informazioni GPS
        const locationMessage = generateLocationFeedback(room, locationValid, distance);
        showSuccess(`✅ Controllo registrato!\n\n📍 Locale: ${room.name}\n👤 Operatore: ${currentOperator.name}\n🕒 Ora: ${new Date().toLocaleTimeString('it-IT')}\n\n${locationMessage}`);
        
    } catch (error) {
        console.error('Errore gestione controllo:', error);
        showError('Errore durante il salvataggio del controllo: ' + error.message);
    }
}

function generateLocationNote(room, locationValid, distance) {
    if (!hasExpectedLocation(room)) {
        return 'Controllo effettuato tramite app web - GPS non configurato per questo impianto';
    }
    
    if (locationValid) {
        return `Controllo effettuato tramite app web - GPS valido (distanza: ${Math.round(distance)}m)`;
    } else {
        const allowedRadius = room.gps_radius || 50;
        return `Controllo effettuato tramite app web - GPS fuori zona (distanza: ${Math.round(distance)}m, consentita: ${allowedRadius}m)`;
    }
}

function generateLocationFeedback(room, locationValid, distance) {
    if (!currentPosition) {
        return '📍 GPS: Non disponibile';
    }
    
    if (!hasExpectedLocation(room)) {
        return '📍 GPS: Posizione registrata (validazione non configurata)';
    }
    
    const allowedRadius = room.gps_radius || 50;
    
    if (locationValid) {
        return `📍 GPS: ✅ Posizione valida\n   Distanza dall'impianto: ${Math.round(distance)}m (max ${allowedRadius}m)`;
    } else {
        return `📍 GPS: ⚠️ ATTENZIONE - Fuori zona consentita!\n   Distanza dall'impianto: ${Math.round(distance)}m (max ${allowedRadius}m)\n   \n   ⚠️ Il controllo è stato registrato ma segnalato come anomalo.\n   Verifica di essere effettivamente presso l'impianto "${room.name}".`;
    }
}
}

async function handleUnknownTag(tagId) {
    try {
        // Registra tag sconosciuto per approvazione amministratore
        await api.reportUnknownTag({
            tagId: tagId,
            operatorId: currentOperator.id,
            gpsLat: currentPosition?.coords.latitude,
            gpsLng: currentPosition?.coords.longitude,
            suggestedName: `Locale ${tagId}`,
            suggestedCategory: guessCategory(tagId)
        });
        
        showSuccess(`🔍 Tag NFC non configurato: ${tagId}\n\n✅ Tag registrato automaticamente per approvazione amministratore\n\n📋 Nome suggerito: Locale ${tagId}\n📂 Categoria suggerita: ${guessCategory(tagId)}\n\nL'amministratore riceverà una notifica per configurare questo tag.\nUna volta approvato, sarà disponibile per tutti gli operatori.`);
        
    } catch (error) {
        console.error('Errore registrazione tag sconosciuto:', error);
        showError(`❌ Tag NFC non riconosciuto: ${tagId}\n\nImpossibile registrare il tag per approvazione.\nContatta l'amministratore per configurare questo tag.`);
    }
}

function extractNFCMessage(message) {
    try {
        for (const record of message.records) {
            if (record.recordType === 'text') {
                const textDecoder = new TextDecoder(record.encoding);
                let text = textDecoder.decode(record.data);
                
                // Rimuovi codice lingua se presente (es: "enTAG001" -> "TAG001")
                if (text.length > 2 && text.match(/^[a-z]{2}[A-Z]/)) {
                    text = text.substring(2);
                }
                
                return text;
            }
        }
    } catch (error) {
        console.error('Errore lettura messaggio NFC:', error);
    }
    return 'Tag NFC rilevato';
}

function validateLocation(room) {
    if (!currentPosition || !hasExpectedLocation(room)) {
        return true; // Se non ha GPS o posizione attesa, considera valido
    }
    
    return isLocationValid(room, currentPosition.coords.latitude, currentPosition.coords.longitude);
}

function calculateDistance(room) {
    if (!currentPosition || !hasExpectedLocation(room)) {
        return 0;
    }
    
    return distanceFromExpected(room, currentPosition.coords.latitude, currentPosition.coords.longitude);
}

// Funzioni helper per validazione GPS
function hasExpectedLocation(room) {
    return room.expected_lat != null && room.expected_lng != null;
}

function isLocationValid(room, currentLat, currentLng) {
    if (!hasExpectedLocation(room)) {
        return true; // Se non ha coordinate attese, considera sempre valido
    }
    
    const distance = distanceFromExpected(room, currentLat, currentLng);
    const allowedRadius = room.gps_radius || 50; // Default 50 metri
    
    return distance <= allowedRadius;
}

function distanceFromExpected(room, currentLat, currentLng) {
    if (!hasExpectedLocation(room)) {
        return 0;
    }
    
    // Formula di Haversine per calcolare distanza tra due punti GPS
    const R = 6371000; // Raggio della Terra in metri
    const lat1Rad = room.expected_lat * Math.PI / 180;
    const lat2Rad = currentLat * Math.PI / 180;
    const deltaLatRad = (currentLat - room.expected_lat) * Math.PI / 180;
    const deltaLngRad = (currentLng - room.expected_lng) * Math.PI / 180;
    
    const a = Math.sin(deltaLatRad/2) * Math.sin(deltaLatRad/2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad/2) * Math.sin(deltaLngRad/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c; // Distanza in metri
}

function getCurrentShift() {
    const hour = new Date().getHours();
    
    if (hour >= 6 && hour < 14) return 'morning';
    if (hour >= 14 && hour < 22) return 'afternoon';
    return 'night';
}

function guessCategory(tagId) {
    const prefix = tagId.substring(0, 2).toUpperCase();
    
    switch (prefix) {
        case 'GE': return 'Gruppi Elettrogeni';
        case 'MT': return 'Cabine Media Tensione';
        case 'UP': return 'Locali UPS';
        case 'QE': return 'Quadri Elettrici';
        case 'AI': return 'Impianti Antincendio';
        case 'HV': return 'Sistemi HVAC';
        default: return 'Da Definire';
    }
}

function generateControlId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function handleNFCError(error) {
    let errorMessage = 'Errore NFC: ';
    
    if (error.name === 'NotAllowedError') {
        errorMessage += 'Permessi negati.\n\n🔧 COME RISOLVERE:\n\n1️⃣ Clicca l\'icona 🔒 nella barra indirizzi\n2️⃣ Trova "NFC" e seleziona "Consenti"\n3️⃣ Ricarica questa pagina\n\n📱 Verifica anche che NFC sia attivo nelle impostazioni!';
    } else if (error.name === 'NotSupportedError') {
        errorMessage += 'NFC non supportato.\n\n🔧 SOLUZIONI:\n\n• Usa Chrome o Edge (non Firefox/Safari)\n• Verifica che il dispositivo abbia chip NFC\n• Android 7.0+ richiesto';
    } else {
        errorMessage += error.message + '\n\n🔧 PROVA QUESTE SOLUZIONI:\n\n• Riavvia Chrome\n• Riavvia il telefono\n• Prova con un altro dispositivo';
    }
    
    showError(errorMessage);
}

// ===== SINCRONIZZAZIONE =====

function startAutoSync() {
    // Sincronizzazione ogni 2 minuti
    setInterval(async () => {
        try {
            await testConnection();
            if (isOnline) {
                await refreshData();
            }
        } catch (error) {
            console.log('Sync automatica fallita:', error.message);
        }
    }, 120000);
}

// ===== UTILITY =====

function showError(message) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = `<div class="error">${message}</div>`;
    
    setTimeout(() => {
        messageArea.innerHTML = '';
    }, 8000);
}

function showSuccess(message) {
    const messageArea = document.getElementById('messageArea');
    messageArea.innerHTML = `<div class="success">${message}</div>`;
    
    setTimeout(() => {
        messageArea.innerHTML = '';
    }, 6000);
}

function showHelp() {
    showSuccess('📱 AIUTO NFC\n\n1️⃣ Avvicina il telefono al tag NFC\n2️⃣ Mantieni il telefono fermo per 2-3 secondi\n3️⃣ Attendi il segnale di conferma\n\n🔧 PROBLEMI?\n• Verifica che NFC sia attivo\n• Usa Chrome o Edge\n• Rimuovi cover spesse\n• Prova posizioni diverse sul telefono');
}

// Chiudi modal cliccando fuori
document.addEventListener('click', function(event) {
    const modal = document.getElementById('operatorModal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
});

// Service Worker per PWA
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => console.log('✅ Service Worker registrato'))
        .catch(error => console.log('❌ Errore Service Worker:', error));
}