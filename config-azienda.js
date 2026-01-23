// CONFIGURAZIONE AZIENDA E PERSONALIZZAZIONE
// Modifica questi valori per personalizzare i registri

const COMPANY_CONFIG = {
    // Informazioni Azienda
    name: "LA TUA AZIENDA S.R.L.",
    address: "Via Esempio 123, 00100 Roma (RM)",
    phone: "+39 06 1234567",
    email: "info@tuaazienda.it",
    
    // Responsabili
    technicalManager: "Ing. Mario Rossi",
    maintenanceManager: "Geom. Luigi Bianchi",
    
    // Logo
    logoPath: "logo.png", // Percorso del file logo
    logoAlt: "Logo Aziendale",
    
    // Personalizzazione Registri
    documentPrefix: "REG", // Prefisso documenti (es: REG-ELETTRICO-2024)
    
    // Colori Aziendali (opzionale)
    primaryColor: "#2c3e50",
    secondaryColor: "#3498db",
    
    // Footer personalizzato
    footerText: "Sistema di Controllo Impianti Tecnici",
    footerSubtext: "Documento generato automaticamente dal sistema di controlli NFC/GPS"
};

// Funzione per ottenere la configurazione
function getCompanyConfig() {
    return COMPANY_CONFIG;
}

// Funzione per aggiornare la configurazione
function updateCompanyConfig(newConfig) {
    Object.assign(COMPANY_CONFIG, newConfig);
    localStorage.setItem('companyConfig', JSON.stringify(COMPANY_CONFIG));
}

// Carica configurazione salvata
function loadCompanyConfig() {
    const saved = localStorage.getItem('companyConfig');
    if (saved) {
        try {
            const savedConfig = JSON.parse(saved);
            Object.assign(COMPANY_CONFIG, savedConfig);
        } catch (error) {
            console.error('Errore caricamento configurazione azienda:', error);
        }
    }
}

// Inizializza configurazione
document.addEventListener('DOMContentLoaded', function() {
    loadCompanyConfig();
});