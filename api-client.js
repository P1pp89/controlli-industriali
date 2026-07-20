// API CLIENT PER SUPABASE - SISTEMA CONTROLLI INDUSTRIALI
// Questo file gestisce tutte le comunicazioni con il database cloud

class ControlsAPI {
    constructor(supabaseUrl, supabaseKey) {
        this.supabaseUrl = supabaseUrl;
        this.supabaseKey = supabaseKey;
        this.headers = {
            'Content-Type': 'application/json',
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
        };
    }

    // ===== OPERATORI =====
    async getOperators() {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/operators?active=eq.true&order=name`, {
            headers: this.headers
        });
        return await response.json();
    }

    async addOperator(operator) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/operators`, {
            method: 'POST',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(operator)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        if (response.status === 201) {
            return { success: true, message: 'Operatore creato con successo' };
        }
        
        return await response.json();
    }

    async updateOperator(id, updates) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/operators?id=eq.${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify(updates)
        });
        return await response.json();
    }

    // ===== IMPIANTI TECNICI =====
    async getTechnicalRooms() {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/technical_rooms?active=eq.true&select=*,categories(*)&order=tag_id`, {
            headers: this.headers
        });
        return await response.json();
    }

    async addTechnicalRoom(room) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/technical_rooms`, {
            method: 'POST',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(room)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        // Supabase può restituire 201 senza body se non specificato 'Prefer: return=representation'
        if (response.status === 201) {
            return { success: true, message: 'Impianto creato con successo' };
        }
        
        return await response.json();
    }

    async updateTechnicalRoom(id, updates) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/technical_rooms?id=eq.${id}`, {
            method: 'PATCH',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        return { success: true };
    }

    // Disattiva un impianto (soft delete, coerente con deleteEnergyStation)
    async deleteTechnicalRoom(id) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/technical_rooms?id=eq.${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ active: false })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { success: true };
    }

    async getTechnicalRoomByTagId(tagId) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/technical_rooms?tag_id=eq.${tagId}&active=eq.true&select=*,categories(*)`, {
            headers: this.headers
        });
        
        const rooms = await response.json();
        return rooms.length > 0 ? rooms[0] : null;
    }

    // ===== TAG SCONOSCIUTI =====
    async getUnknownTags(status = 'PENDING') {
        const baseUrl = `${this.supabaseUrl}/rest/v1/unknown_tags?status=eq.${status}&order=created_at.desc`;

        // unknown_tags ha due relazioni verso operators (operator_id e approved_by),
        // quindi va specificata esplicitamente quale imbarcare per il nome di chi
        // ha rilevato il tag, altrimenti PostgREST rifiuta la richiesta come ambigua.
        let response = await fetch(`${baseUrl}&select=*,operators!unknown_tags_operator_id_fkey(name)`, { headers: this.headers });

        if (!response.ok) {
            const errText = await response.text();
            console.warn('getUnknownTags: embed operators(name) fallito, ritento senza embed. Errore reale da Supabase:', errText);
            response = await fetch(`${baseUrl}&select=*`, { headers: this.headers });
        }

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        const data = await response.json();
        if (!Array.isArray(data)) {
            throw new Error(typeof data === 'object' ? (data.message || JSON.stringify(data)) : 'Risposta inattesa dal server per unknown_tags');
        }
        return data;
    }

    async reportUnknownTag({ tagId, operatorId, gpsLat, gpsLng, suggestedName, suggestedCategory, tagType = 'control' }) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/unknown_tags`, {
            method: 'POST',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({
                tag_id: tagId,
                operator_id: operatorId,
                detected_at: new Date().toISOString(),
                gps_lat: gpsLat,
                gps_lng: gpsLng,
                suggested_name: suggestedName,
                suggested_category: suggestedCategory,
                tag_type: tagType,
                status: 'PENDING',
                notes: 'Rilevato automaticamente dall\'app web'
            })
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        return { success: true, message: 'Tag sconosciuto registrato per approvazione' };
    }

    // ===== CONTROLLI =====
    async addControl(control) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/controls`, {
            method: 'POST',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(control)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        
        if (response.status === 201) {
            return { success: true, message: 'Controllo registrato con successo' };
        }
        
        return await response.json();
    }

    async getControls(filters = {}) {
        let url = `${this.supabaseUrl}/rest/v1/controls?select=*,technical_rooms(*,categories(*)),operators(*)&order=timestamp.desc`;
        
        if (filters.startDate) url += `&timestamp=gte.${filters.startDate}`;
        if (filters.endDate) url += `&timestamp=lte.${filters.endDate}`;
        if (filters.operatorId) url += `&operator_id=eq.${filters.operatorId}`;
        
        const response = await fetch(url, { headers: this.headers });
        return await response.json();
    }

    // Approva tag come IMPIANTO TECNICO normale
    async approveUnknownTag(tagId, tagData) {
        const roomResponse = await fetch(`${this.supabaseUrl}/rest/v1/technical_rooms`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({
                tag_id: tagId,
                name: tagData.name,
                description: tagData.description,
                category_id: tagData.category_id,
                expected_lat: tagData.gps_lat || null,
                expected_lng: tagData.gps_lng || null,
                gps_radius: tagData.gps_radius || 50,
                active: true
            })
        });
        if (!roomResponse.ok) throw new Error('Errore aggiunta impianto');

        await fetch(`${this.supabaseUrl}/rest/v1/unknown_tags?tag_id=eq.${tagId}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ status: 'APPROVED', approved_at: new Date().toISOString() })
        });
        return { success: true };
    }

    // Approva tag come POSTAZIONE CONTATORI ENERGIA
    async approveUnknownTagAsEnergy(tagId, stationData) {
        // stationData: { name, station_id, nfc_tag, icon, gps_radius, meters[], gps_lat, gps_lng }
        const stationResponse = await fetch(`${this.supabaseUrl}/rest/v1/energy_stations`, {
            method: 'POST',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({
                station_id: stationData.station_id,
                name: stationData.name,
                icon: stationData.icon || '⚡',
                nfc_tag: stationData.nfc_tag || tagId,
                meters: stationData.meters || [],
                gps_lat: stationData.gps_lat || null,
                gps_lng: stationData.gps_lng || null,
                gps_radius: stationData.gps_radius || 50,
                active: true
            })
        });
        if (!stationResponse.ok) {
            const err = await stationResponse.text();
            throw new Error(`Errore aggiunta postazione: ${err}`);
        }

        await fetch(`${this.supabaseUrl}/rest/v1/unknown_tags?tag_id=eq.${tagId}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ status: 'APPROVED', approved_at: new Date().toISOString() })
        });
        return { success: true };
    }

    // Riattiva un tag precedentemente rifiutato (torna in PENDING)
    async reactivateUnknownTag(tagId) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/unknown_tags?tag_id=eq.${tagId}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ status: 'PENDING', approved_at: null, notes: 'Riattivato dall\'amministratore' })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { success: true };
    }

    // Rifiuta un tag sconosciuto
    async rejectUnknownTag(tagId, reason = '') {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/unknown_tags?tag_id=eq.${tagId}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ status: 'REJECTED', notes: reason || 'Rifiutato dall\'amministratore' })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { success: true };
    }

    // ===== CATEGORIE =====
    async getCategories() {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/categories?order=name`, {
            headers: this.headers
        });
        return await response.json();
    }

    async addCategory(name, color) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/categories`, {
            method: 'POST',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({ name, color: color || '#64748b' })
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        return { success: true };
    }

    async updateCategory(id, updates) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/categories?id=eq.${id}`, {
            method: 'PATCH',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(updates)
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        return { success: true };
    }

    // Attenzione: fallisce se ci sono impianti ancora assegnati a questa categoria
    // (vincolo di integrità referenziale) - è un comportamento voluto, protegge i dati.
    async deleteCategory(id) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/categories?id=eq.${id}`, {
            method: 'DELETE',
            headers: this.headers
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
        return { success: true };
    }

    // ===== STATISTICHE =====
    async getStats() {
        const today = new Date().toISOString().split('T')[0];
        
        const [operators, rooms, todayControls, unknownTags] = await Promise.all([
            this.getOperators(),
            this.getTechnicalRooms(),
            fetch(`${this.supabaseUrl}/rest/v1/controls?timestamp=gte.${today}T00:00:00&select=count`, {
                headers: { ...this.headers, 'Prefer': 'count=exact' }
            }).then(r => r.headers.get('content-range')?.split('/')[1] || '0'),
            fetch(`${this.supabaseUrl}/rest/v1/unknown_tags?status=eq.PENDING&select=count`, {
                headers: { ...this.headers, 'Prefer': 'count=exact' }
            }).then(r => r.headers.get('content-range')?.split('/')[1] || '0')
        ]);

        return {
            totalOperators: operators.length,
            totalRooms: rooms.length,
            todayControls: parseInt(todayControls),
            pendingTags: parseInt(unknownTags)
        };
    }

    // ===== CONFIGURAZIONE AZIENDA =====
    async getCompanyConfig() {
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/company_config?select=*&limit=1`, {
                headers: this.headers
            });
            
            if (response.ok) {
                const configs = await response.json();
                return configs.length > 0 ? configs[0] : null;
            }
        } catch (error) {
            console.error('Errore caricamento configurazione azienda:', error);
        }
        return null;
    }

    async saveCompanyConfig(config) {
        try {
            // Prima controlla se esiste già una configurazione
            const existing = await this.getCompanyConfig();
            
            if (existing) {
                // Aggiorna configurazione esistente
                const response = await fetch(`${this.supabaseUrl}/rest/v1/company_config?id=eq.${existing.id}`, {
                    method: 'PATCH',
                    headers: this.headers,
                    body: JSON.stringify({
                        ...config,
                        updated_at: new Date().toISOString()
                    })
                });
                return response.ok;
            } else {
                // Crea nuova configurazione
                const response = await fetch(`${this.supabaseUrl}/rest/v1/company_config`, {
                    method: 'POST',
                    headers: { ...this.headers, 'Prefer': 'return=representation' },
                    body: JSON.stringify({
                        ...config,
                        created_at: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    })
                });
                return response.ok;
            }
        } catch (error) {
            console.error('Errore salvataggio configurazione azienda:', error);
            return false;
        }
    }

    // ===== CONTROLLI RECENTI =====
    async getRecentControls(limit = 10) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/controls?select=*,operators(name),technical_rooms(name,tag_id)&order=timestamp.desc&limit=${limit}`, {
            headers: this.headers
        });
        return await response.json();
    }

    // ===== POSTAZIONI CONTATORI ENERGIA =====

    async getEnergyStations() {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/energy_stations?active=eq.true&order=name`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    }

    async getEnergyStationByNfcTag(nfcTag) {
        const encoded = encodeURIComponent(nfcTag);
        const response = await fetch(`${this.supabaseUrl}/rest/v1/energy_stations?nfc_tag=eq.${encoded}&active=eq.true`, {
            headers: this.headers
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const rows = await response.json();
        return rows.length > 0 ? rows[0] : null;
    }

    async addEnergyStation(station) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/energy_stations`, {
            method: 'POST',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(station)
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HTTP ${response.status}: ${err}`);
        }
        return { success: true };
    }

    async updateEnergyStation(id, updates) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/energy_stations?id=eq.${id}`, {
            method: 'PATCH',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify({ ...updates, updated_at: new Date().toISOString() })
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HTTP ${response.status}: ${err}`);
        }
        return { success: true };
    }

    async deleteEnergyStation(id) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/energy_stations?id=eq.${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ active: false, updated_at: new Date().toISOString() })
        });
        if (!response.ok) {
            const err = await response.text();
            throw new Error(`HTTP ${response.status}: ${err}`);
        }
        return { success: true };
    }

    // Aggiorna coordinate GPS dopo prima scansione sul posto
    async setEnergyStationGPS(id, lat, lng) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/energy_stations?id=eq.${id}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ gps_lat: lat, gps_lng: lng, updated_at: new Date().toISOString() })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { success: true };
    }

    // ===== LETTURE CONTATORI ENERGIA =====

    /**
     * Salva una lettura contatori energia.
     * @param {Object} reading - Dati della lettura
     * @param {string} reading.reading_id     - ID univoco della lettura
     * @param {string} reading.station_id     - ID della postazione (es. "CONSEGNA_ENEL", "CABINA_S", ...)
     * @param {string} reading.station_name   - Nome leggibile della postazione
     * @param {string} reading.operator_id    - FK → operators.id
     * @param {string} reading.operator_name  - Nome operatore (denormalizzato per report)
     * @param {string} reading.timestamp      - ISO8601
     * @param {Object} reading.meters         - Oggetto chiave/valore: { "Contatore Generale": 12345.6, ... }
     * @param {string} [reading.notes]        - Note libere
     */
    async addEnergyReading(reading) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/energy_readings`, {
            method: 'POST',
            headers: { ...this.headers, 'Prefer': 'return=representation' },
            body: JSON.stringify(reading)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP ${response.status}: ${errorText}`);
        }

        return { success: true, message: 'Lettura contatori registrata con successo' };
    }

    /**
     * Recupera le letture contatori, con filtri opzionali per periodo e postazione.
     */
    async getEnergyReadings(filters = {}) {
        let url = `${this.supabaseUrl}/rest/v1/energy_readings?order=timestamp.desc`;

        if (filters.startDate) url += `&timestamp=gte.${filters.startDate}`;
        if (filters.endDate)   url += `&timestamp=lte.${filters.endDate}`;
        if (filters.stationId) url += `&station_id=eq.${filters.stationId}`;

        const response = await fetch(url, { headers: this.headers });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    }
}