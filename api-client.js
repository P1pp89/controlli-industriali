// api-client.js
/**
 * CORE API CLIENT PER SUPABASE - SISTEMA CONTROLLI INDUSTRIALI OSPEDALIERI
 * Gestisce l'interfaccia REST serverless cruda con sanitizzazione preventiva dei tipi
 * per azzerare i crash di rendering sui cicli iterativi (.forEach / .map) client-side.
 */

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

    /**
     * Helper interno per forzare la conversione strutturale in array pulito.
     * Risolve a monte l'errore: (pending || []).forEach is not a function.
     * @param {any} data - Risposta grezza della fetch
     * @returns {Array} Array normalizzato
     */
    _safelyCastToArray(data) {
        if (!data) return [];
        if (Array.isArray(data)) return data;
        if (typeof data === 'object') {
            // Se l'API restituisce un singolo oggetto di errore o un record singolo
            if (data.code || data.message) return [];
            return Object.values(data);
        }
        return [];
    }

    /**
     * Helper per la gestione centralizzata delle risposte Fetch
     */
    async _handleResponse(response, fallbackValue = []) {
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[API ERROR] HTTP ${response.status}: ${errorText}`);
            return fallbackValue;
        }
        try {
            const json = await response.json();
            return json;
        } catch (e) {
            console.error('[API PARSE ERROR] Impossibile decodificare il JSON:', e);
            return fallbackValue;
        }
    }

    // ===== OPERATORI =====
    async getOperators() {
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/operators?active=eq.true&order=name`, {
                headers: this.headers
            });
            const data = await this._handleResponse(response, []);
            return this._safelyCastToArray(data);
        } catch (error) {
            console.error('Errore getOperators:', error);
            return [];
        }
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
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/technical_rooms?active=eq.true&select=*,categories(*)&order=tag_id`, {
                headers: this.headers
            });
            const data = await this._handleResponse(response, []);
            return this._safelyCastToArray(data);
        } catch (error) {
            console.error('Errore getTechnicalRooms:', error);
            return [];
        }
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
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/technical_rooms?tag_id=eq.${tagId}&active=eq.true&select=*,categories(*)`, {
                headers: this.headers
            });
            const rawData = await this._handleResponse(response, []);
            const rooms = this._safelyCastToArray(rawData);
            return rooms.length > 0 ? rooms[0] : null;
        } catch (error) {
            console.error('Errore getTechnicalRoomByTagId:', error);
            return null;
        }
    }

    // ===== TAG SCONOSCIUTI / GESTIONE TAB NFC =====
    async getUnknownTags(status = 'PENDING') {
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/unknown_tags?status=eq.${status}&select=*,operators(name)&order=created_at.desc`, {
                headers: this.headers
            });
            
            const data = await this._handleResponse(response, []);
            
            // PROTEZIONE AD ALTO SPETTRO: Converte l'output garantendo l'interfaccia Array alla UI
            return this._safelyCastToArray(data);
        } catch (error) {
            console.error('Errore getUnknownTags:', error);
            return [];
        }
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
        try {
            let url = `${this.supabaseUrl}/rest/v1/controls?select=*,technical_rooms(*,categories(*)),operators(*)&order=timestamp.desc`;
            
            if (filters.startDate) url += `&timestamp=gte.${filters.startDate}`;
            if (filters.endDate) url += `&timestamp=lte.${filters.endDate}`;
            if (filters.operatorId) url += `&operator_id=eq.${filters.operatorId}`;
            
            const response = await fetch(url, { headers: this.headers });
            const data = await this._handleResponse(response, []);
            return this._safelyCastToArray(data);
        } catch (error) {
            console.error('Errore getControls:', error);
            return [];
        }
    }

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

    async approveUnknownTagAsEnergy(tagId, stationData) {
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

    async reactivateUnknownTag(tagId) {
        const response = await fetch(`${this.supabaseUrl}/rest/v1/unknown_tags?tag_id=eq.${tagId}`, {
            method: 'PATCH',
            headers: this.headers,
            body: JSON.stringify({ status: 'PENDING', approved_at: null, notes: 'Riattivato dall\'amministratore' })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return { success: true };
    }

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
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/categories?order=name`, {
                headers: this.headers
            });
            const data = await this._handleResponse(response, []);
            return this._safelyCastToArray(data);
        } catch (error) {
            console.error('Errore getCategories:', error);
            return [];
        }
    }

    // ===== STATISTICHE =====
    async getStats() {
        try {
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
                todayControls: parseInt(todayControls) || 0,
                pendingTags: parseInt(unknownTags) || 0
            };
        } catch (error) {
            console.error('Errore getStats:', error);
            return { totalOperators: 0, totalRooms: 0, todayControls: 0, pendingTags: 0 };
        }
    }

    // ===== CONFIGURAZIONE AZIENDA =====
    async getCompanyConfig() {
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/company_config?select=*&limit=1`, {
                headers: this.headers
            });
            
            if (response.ok) {
                const rawData = await response.json();
                const configs = this._safelyCastToArray(rawData);
                return configs.length > 0 ? configs[0] : null;
            }
        } catch (error) {
            console.error('Errore caricamento configurazione azienda:', error);
        }
        return null;
    }

    async saveCompanyConfig(config) {
        try {
            const existing = await this.getCompanyConfig();
            
            if (existing) {
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
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/controls?select=*,operators(name),technical_rooms(name,tag_id)&order=timestamp.desc&limit=${limit}`, {
                headers: this.headers
            });
            const data = await this._handleResponse(response, []);
            return this._safelyCastToArray(data);
        } catch (error) {
            console.error('Errore getRecentControls:', error);
            return [];
        }
    }

    // ===== POSTAZIONI CONTATORI ENERGIA =====
    async getEnergyStations() {
        try {
            const response = await fetch(`${this.supabaseUrl}/rest/v1/energy_stations?active=eq.true&order=name`, {
                headers: this.headers
            });
            const data = await this._handleResponse(response, []);
            return this._safelyCastToArray(data);
        } catch (error) {
            console.error('Errore getEnergyStations:', error);
            return [];
        }
    }

    async getEnergyStationByNfcTag(nfcTag) {
        try {
            const encoded = encodeURIComponent(nfcTag);
            const response = await fetch(`${this.supabaseUrl}/rest/v1/energy_stations?nfc_tag=eq.${encoded}&active=eq.true`, {
                headers: this.headers
            });
            const rawData = await this._handleResponse(response, []);
            const rows = this._safelyCastToArray(rawData);
            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Errore getEnergyStationByNfcTag:', error);
            return null;
        }
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

    async getEnergyReadings(filters = {}) {
        try {
            let url = `${this.supabaseUrl}/rest/v1/energy_readings?order=timestamp.desc`;

            if (filters.startDate) url += `&timestamp=gte.${filters.startDate}`;
            if (filters.endDate)   url += `&timestamp=lte.${filters.endDate}`;
            if (filters.stationId) url += `&station_id=eq.${filters.stationId}`;

            const response = await fetch(url, { headers: this.headers });
            const data = await this._handleResponse(response, []);
            return this._safelyCastToArray(data);
        } catch (error) {
            console.error('Errore getEnergyReadings:', error);
            return [];
        }
    }
}
