// app-moderna-functions.js
// FUNZIONI JAVASCRIPT PER APP MODERNA - SISTEMA CONTROLLI INDUSTRIALI OSPEDALIERI
// Questo file governa la logica applicativa, l'interblocco hardware NFC ed il Geofencing GPS.

// Variabili di stato globale dell'applicazione (gestite a livello SPA)
let currentOperator = null;
let currentPosition = null;
let isOnline = true; // Gestito dai moduli di rete/Service Worker

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
    if (!displayElement) return;
    
    const detailsElement = displayElement.parentElement.querySelector('.operator-details');
    
    if (currentOperator) {
        displayElement.textContent = currentOperator.name;
        if (detailsElement) {
            detailsElement.textContent = `${currentOperator.code} - ${currentOperator.operator_id}`;
        }
    } else {
        displayElement.textContent = '👤 Seleziona Operatore';
        if (detailsElement) {
            detailsElement.textContent = 'Clicca per scegliere l\'operatore';
        }
    }
}

async function showOperatorSelection() {
    const modal = document.getElementById('operatorModal');
    const operatorsList = document.getElementById('operatorsList');
    
    if (!modal || !operatorsList) return;
    
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
    
    const modal = document.getElementById('operatorModal');
    if (modal) modal.style.display = 'none';
}

// ===== GESTIONE GPS =====

function startGPSTracking() {
    if (!navigator.geolocation) {
        const gpsInfo = document.getElementById('gpsInfo');
        if (gpsInfo) gpsInfo.textContent = '❌ GPS non supportato';
        return;
    }
    
    const options = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000 // Ridotto per garantire dati freschi in ambienti schermati
    };
    
    navigator.geolocation.watchPosition(
        (position) => {
            currentPosition = position;
            const lat = position.coords.latitude.toFixed(6);
            const lng = position.coords.longitude.toFixed(6);
            const accuracy = Math.round(position.coords.accuracy);
            
            const gpsInfo = document.getElementById('gpsInfo');
            if (gpsInfo) {
                gpsInfo.innerHTML = `📍 ${lat}, ${lng}<br><small>Precisione: ±${accuracy}m</small><br><small style="color: #10b981;">GPS attivo e funzionante</small>`;
            }
        },
        (error) => {
            console.error('Errore GPS:', error);
            const gpsInfo = document.getElementById('gpsInfo');
            if (gpsInfo) {
                gpsInfo.innerHTML = `❌ Errore GPS: ${getGPSErrorMessage(error.code)}<br><small style="color: #ef4444;">Controlla impostazioni GPS</small>`;
            }
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
        if (scanButton) {
            scanButton.textContent = '❌ NFC non supportato su questo dispositivo';
            scanButton.disabled = true;
        }
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
        if (scanButton) {
            scanButton.textContent = '🔍 Scansione in corso...';
            scanButton.disabled = true;
        }
        
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
        
        // Timeout di sicurezza scansione dopo 15 secondi
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
    if (scanButton) {
        scanButton.textContent = '📱 Scansiona Tag NFC';
        scanButton.disabled = false;
    }
}

async function handleNFCRead(serialNumber, message) {
    resetScanButton();
    
    if (!currentOperator) {
        showError('Seleziona prima un operatore');
        return;
    }
    
    // Estrazione dell'ID del Tag
    let tagId = extractNFCMessage(message);
    if (!tagId || tagId === 'Tag NFC rilevato') {
        tagId = serialNumber;
    }
    
    console.log('Tag ID rilevato dall\'hardware reader:', tagId);
    
    try {
        // Interrogazione del database asincrono per l'inquadramento dell'impianto
        const room = await api.getTechnicalRoomByTagId(tagId);
        
        if (!room) {
            // Tag non censito: avvia il flusso di approvazione/registrazione sul campo
            await handleUnknownTag(tagId);
            return;
        }
        
        // --- VINCOLO DI SICUREZZA ASSOLUTO (ANTI-FRODE) ---
        // Recuperiamo la tolleranza geometrica centralizzata (fallback su room.gps_radius o 25m industriali)
        const allowedRadius = typeof AziendaConfig !== 'undefined' ? AziendaConfig.geofencingToleranceMetres : (room.gps_radius || 25);
        const distance = calculateDistance(tagId, room);
        const locationValid = validateLocation(tagId, room);
        
        // LOGICA DI INTERBLOCCO: Se il GPS non è valido o manca la geolocalizzazione, il form VIENE BLOCCATO TASSATIVAMENTE
        if (!locationValid || !currentPosition) {
            const errorMessage = `🚫 CONTROLLO BLOCCATO - VIOLAZIONE COMPLIANCE GPS!\n\n` +
                `📍 Impianto Rilevato: ${room.name}\n` +
                `📏 Distanza calcolata dal Tag: ${currentPosition ? Math.round(distance) + 'm' : 'Satelliti non agganciati'}\n` +
                `📏 Raggio massimo ammesso: ${allowedRadius}m\n\n` +
                `⚠️ ERRORE: L'operatore DEVE trovarsi fisicamente nel locale tecnico per poter registrare le letture dei contatori.\n\n` +
                `🔧 PROCEDURA DI RIPRISTINO:\n` +
                `• Avvicinati all'apparato hardware "${room.name}"\n` +
                `• Verifica che la geolocalizzazione sia attiva in modalità "Alta Precisione"\n` +
                `• Al banco prova: allinea le coordinate in config-azienda.js con la tua posizione GPS attuale.`;
                
            showError(errorMessage);
            return; // INTERRUZIONE ATOMICA ED IMMEDIATA DEL FLUSSO DI ACQUISIZIONE DATI
        }
        
        // Generazione del record strutturato solo a fronte del superamento dei controlli fisici e spaziali
        const controlData = {
            control_id: generateControlId(),
            tag_id: tagId,
            room_id: room.id,
            operator_id: currentOperator.id,
            nfc_serial: serialNumber,
            timestamp: new Date().toISOString(),
            gps_lat: currentPosition.coords.latitude,
            gps_lng: currentPosition.coords.longitude,
            gps_accuracy: currentPosition.coords.accuracy,
            location_valid: true,
            distance_from_expected: distance,
            shift_type: getCurrentShift(),
            notes: `Lettura validata tramite Hardware Interlock - Distanza: ${Math.round(distance)}m`,
            synced: true
        };
        
        // Esecuzione scrittura asincrona su Supabase
        await api.addControl(controlData);
        
        // Aggiornamento tabelle e grafici della SPA
        await refreshData();
        
        const feedbackGeo = `📍 GPS: ✅ Posizione Certificata\nDistanza dall'asset: ${Math.round(distance)}m (Soglia massima tollerata: ${allowedRadius}m)`;
        showSuccess(`✅ Controllo registrato con successo!\n\nLocale: ${room.name}\nOperatore: ${currentOperator.name}\n🕒 ${new Date().toLocaleTimeString('it-IT')}\n\n${feedbackGeo}`);
        
    } catch (error) {
        console.error('Errore durante la transazione hardware-software:', error);
        showError('Errore durante il salvataggio del controllo: ' + error.message);
    }
}

async function handleUnknownTag(tagId) {
    try {
        const response = await fetch(`${api.supabaseUrl}/rest/v1/unknown_tags?tag_id=eq.${tagId}&select=*&order=created_at.desc&limit=1`, {
            headers: api.headers
        });
        
        if (response.ok) {
            const existingTags = await response.json();
            
            if (existingTags && existingTags.length > 0) {
                const existingTag = existingTags[0];
                
                if (existingTag.status === 'REJECTED') {
                    const reactivate = confirm(`🔍 Tag NFC precedentemente rifiutato: ${tagId}\n\nVuoi inviare una nuova richiesta di approvazione all'amministratore?`);
                    
                    if (reactivate) {
                        const reactivateResponse = await fetch(`${api.supabaseUrl}/rest/v1/unknown_tags?id=eq.${existingTag.id}`, {
                            method: 'PATCH',
                            headers: api.headers,
                            body: JSON.stringify({
                                status: 'PENDING',
                                detected_at: new Date().toISOString(),
                                operator_id: currentOperator.id,
                                gps_lat: currentPosition?.coords.latitude || null,
                                gps_lng: currentPosition?.coords.longitude || null,
                                notes: `Tag riattivato dopo rifiuto - Rilevato nuovamente da ${currentOperator.name}`,
                                approved_at: null,
                                updated_at: new Date().toISOString()
                            })
                        });
                        
                        if (!reactivateResponse.ok) throw new Error('Errore riattivazione tag');
                        showSuccess(`🔄 Tag ${tagId} reinserito in coda di approvazione.`);
                        return;
                    }
                    return;
                } else if (existingTag.status === 'PENDING') {
                    showSuccess(`⏳ Tag ${tagId} già in attesa di validazione da parte dell'amministratore.`);
                    return;
                } else if (existingTag.status === 'APPROVED') {
                    showSuccess(`✅ Tag ${tagId} già approvato. Ricarica l'applicazione.`);
                    return;
                }
            }
        }
        
        // Registrazione ex-novo di un tag mai incontrato dal sistema
        await api.reportUnknownTag({
            tagId: tagId,
            operatorId: currentOperator.id,
            gpsLat: currentPosition?.coords.latitude || null,
            gpsLng: currentPosition?.coords.longitude || null,
            suggestedName: `Locale ${tagId}`,
            suggestedCategory: guessCategory(tagId)
        });
        
        showSuccess(`🔍 Nuovo tag NFC censito e inviato in dashboard per la configurazione.`);
        
    } catch (error) {
        console.error('Errore gestione tag sconosciuto:', error);
        showError(`❌ Impossibile catalogare il tag sconosciuto: ${error.message}`);
    }
}

function extractNFCMessage(message) {
    try {
        for (const record of message.records) {
            if (record.recordType === 'text') {
                const textDecoder = new TextDecoder(record.encoding);
                let text = textDecoder.decode(record.data);
                
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

// ===== INGEGNERIZZAZIONE LOGICA DI GEOLOCALIZZAZIONE ED HAVERSINE =====

/**
 * Valida la prossimità spaziale leggendo prioritariamente la configurazione centralizzata.
 */
function validateLocation(tagId, room) {
    if (!currentPosition) return false; // Mancanza di telemetria satellitare: blocco immediato
    
    const distance = calculateDistance(tagId, room);
    
    // Strategia gerarchica sul raggio limite: 1. Dizionario AziendaConfig -> 2. Record Database -> 3. Fallback standard
    let allowedRadius = 25; 
    if (typeof AziendaConfig !== 'undefined' && AziendaConfig.geofencingToleranceMetres) {
        allowedRadius = AziendaConfig.geofencingToleranceMetres;
    } else if (room && room.gps_radius) {
        allowedRadius = room.gps_radius;
    }
    
    return distance <= allowedRadius;
}

/**
 * Calcola la distanza ortodromica interpolando config locale (per prove al banco facilitated) e db cloud
 */
function calculateDistance(tagId, room) {
    if (!currentPosition) return Infinity;
    
    let targetLat = null;
    let targetLng = null;

    // STEP 1: Intercettazione prioritaria da config-azienda.js per facilitare la diagnostica o i cambi rapidi
    if (typeof AziendaConfig !== 'undefined' && AziendaConfig.tags && AziendaConfig.tags[tagId]) {
        targetLat = AziendaConfig.tags[tagId].lat;
        targetLng = AziendaConfig.tags[tagId].lng;
        console.log(`[DIAGNOSTIC] Coordinate lette dal dizionario locale AziendaConfig per il Tag: ${tagId}`);
    } 
    // STEP 2: Fallback su tracciato nominale memorizzato nelle tabelle relazionali
    else if (room && room.expected_lat != null && room.expected_lng != null) {
        targetLat = room.expected_lat;
        targetLng = room.expected_lng;
    }

    // Se l'asset non ha vincoli di coordinate geografiche impostati, consideriamo distanza 0 (bypass)
    if (targetLat === null || targetLng === null) {
        return 0;
    }

    return distanceFromExpected(targetLat, targetLng, currentPosition.coords.latitude, currentPosition.coords.longitude);
}

/**
 * Algoritmo trigonometrico puro sulla corda terrestre
 */
function distanceFromExpected(expectedLat, expectedLng, currentLat, currentLng) {
    const R = 6371000; // Raggio medio della Terra in metri
    const lat1Rad = (expectedLat * Math.PI) / 180;
    const lat2Rad = (currentLat * Math.PI) / 180;
    const deltaLatRad = ((currentLat - expectedLat) * Math.PI) / 180;
    const deltaLngRad = ((currentLng - expectedLng) * Math.PI) / 180;
    
    const a = Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
              Math.cos(lat1Rad) * Math.cos(lat2Rad) *
              Math.sin(deltaLngRad / 2) * Math.sin(deltaLngRad / 2);
              
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Metri lineari tridimensionali
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
        errorMessage += 'Permessi negati.\n\n🔧 COME RISOLVERE:\n1️⃣ Clicca l\'icona del lucchetto 🔒 accanto all\'URL\n2️⃣ Abilita il permesso "NFC"\n3️⃣ Ricarica la pagina.';
    } else if (error.name === 'NotSupportedError') {
        errorMessage += 'NFC non supportato.\n\nVerifica che il browser in uso sia basato su Chromium (Chrome/Edge su Android).';
    } else {
        errorMessage += error.message;
    }
    showError(errorMessage);
}

// ===== SINCRONIZZAZIONE =====

function startAutoSync() {
    setInterval(async () => {
        try {
            if (typeof testConnection === 'function') await testConnection();
            if (isOnline && typeof refreshData === 'function') {
                await refreshData();
            }
        } catch (error) {
            console.log('Sync automatica in background silenziata:', error.message);
        }
    }, 120000);
}

// ===== UI NOTIFICATION ENGINE =====

function showError(message) {
    const messageArea = document.getElementById('messageArea');
    if (!messageArea) {
        alert(message);
        return;
    }
    messageArea.innerHTML = `<div class="error" style="background:#fee2e2; color:#991b1b; padding:12px; border-radius:6px; margin:10px 0; white-space:pre-line; border:1px solid #fca5a5;">${message}</div>`;
    
    // Incrementato il timeout per dare il tempo all'operatore di leggere i dettagli dell'errore GPS sul campo
    setTimeout(() => {
        if(messageArea.querySelector('.error')) messageArea.innerHTML = '';
    }, 12000);
}

function showSuccess(message) {
    const messageArea = document.getElementById('messageArea');
    if (!messageArea) {
        console.log(message);
        return;
    }
    messageArea.innerHTML = `<div class="success" style="background:#d1fae5; color:#065f46; padding:12px; border-radius:6px; margin:10px 0; white-space:pre-line; border:1px solid #6ee7b7;">${message}</div>`;
    
    setTimeout(() => {
        if(messageArea.querySelector('.success')) messageArea.innerHTML = '';
    }, 6000);
}

function showHelp() {
    showSuccess('📱 MANUALE DI ACQUISIZIONE NFC\n\n1️⃣ Avvicina lo smartphone al tag posizionato sul contatore\n2️⃣ Mantieni la prossimità per 2 secondi fino al segnale sonoro\n3️⃣ Il sistema calcolerà istantaneamente il Geofencing autorizzativo.');
}

// Gestione dell'evento di chiusura modali da viewport esterna
document.addEventListener('click', function(event) {
    const modal = document.getElementById('operatorModal');
    if (modal && event.target === modal) {
        modal.style.display = 'none';
    }
});

// Inizializzazione moduli Progressive Web App (PWA) per il funzionamento Offline-First statico
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(registration => console.log('✅ Service Worker registrato correttamente per l\'ecosistema statico'))
        .catch(error => console.log('❌ Fallimento registrazione Service Worker:', error));
}
