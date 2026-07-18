-- ============================================================
-- MIGRAZIONE: Tabella energy_stations per postazioni contatori
-- Da eseguire nella SQL Editor di Supabase
-- https://supabase.com/dashboard/project/pynodlnwozlyxcfwfqvp/sql/new
-- ============================================================

CREATE TABLE IF NOT EXISTS energy_stations (
    id          uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
    station_id  text    NOT NULL UNIQUE,   -- es. CABINA_S, CONSEGNA_ENEL
    name        text    NOT NULL,          -- es. Cabina Ed. S
    icon        text    NOT NULL DEFAULT '⚡',
    nfc_tag     text    NOT NULL UNIQUE,   -- testo da programmare sul tag NFC
    meters      jsonb   NOT NULL DEFAULT '[]',
    -- GPS opzionale (compilato automaticamente alla prima scansione sul posto)
    gps_lat     float,
    gps_lng     float,
    gps_radius  integer DEFAULT 50,
    active      boolean NOT NULL DEFAULT true,
    created_at  timestamptz DEFAULT now(),
    updated_at  timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_energy_stations_nfc_tag   ON energy_stations (nfc_tag);
CREATE INDEX IF NOT EXISTS idx_energy_stations_active    ON energy_stations (active);

ALTER TABLE energy_stations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lettura libera energy_stations"    ON energy_stations FOR SELECT USING (true);
CREATE POLICY "Inserimento libero energy_stations" ON energy_stations FOR INSERT WITH CHECK (true);
CREATE POLICY "Modifica libera energy_stations"   ON energy_stations FOR UPDATE USING (true);
CREATE POLICY "Elimina energy_stations"           ON energy_stations FOR DELETE USING (true);

-- ============================================================
-- INSERIMENTO POSTAZIONI PREDEFINITE
-- (meters = array JSON di oggetti {key, label})
-- ============================================================
INSERT INTO energy_stations (station_id, name, icon, nfc_tag, meters) VALUES
('CONSEGNA_ENEL',    'Consegna Enel',        '🏛️', 'CONT-ENEL',    '[{"key":"contatore_generale","label":"Contatore Generale"}]'),
('CABINA_S',         'Cabina Ed. S',         '🏢', 'CONT-CAB-S',   '[{"key":"contatore_1","label":"Contatore 1"},{"key":"contatore_2","label":"Contatore 2"},{"key":"contatore_3","label":"Contatore 3"}]'),
('CABINA_F3',        'Cabina Ed. F3',        '🏢', 'CONT-CAB-F3',  '[{"key":"cont_sez_normale","label":"Contatore Sez. Normale"},{"key":"cont_sez_preferenziale","label":"Contatore Sez. Preferenziale"}]'),
('CABINA_F1',        'Cabina Ed. F1',        '🏢', 'CONT-CAB-F1',  '[{"key":"contatore_generale","label":"Contatore Generale"}]'),
('CABINA_F2',        'Cabina Ed. F2',        '🏢', 'CONT-CAB-F2',  '[{"key":"cont_sez_normale_1","label":"Contatore Sez. Normale 1"},{"key":"cont_sez_normale_2","label":"Contatore Sez. Normale 2"},{"key":"cont_sez_preferenziale","label":"Contatore Sez. Preferenziale"}]'),
('CABINA_E',         'Cabina Ed. E',         '🏢', 'CONT-CAB-E',   '[{"key":"cont_sez_normale","label":"Contatore Sez. Normale"},{"key":"cont_sez_preferenziale","label":"Contatore Sez. Preferenziale"}]'),
('CABINA_G',         'Cabina Ed. G',         '🏢', 'CONT-CAB-G',   '[{"key":"cont_sez_normale","label":"Contatore Sez. Normale"},{"key":"cont_sez_preferenziale","label":"Contatore Sez. Preferenziale"}]'),
('CABINA_L',         'Cabina Ed. L',         '🏢', 'CONT-CAB-L',   '[{"key":"cont_sez_normale","label":"Contatore Sez. Normale"},{"key":"cont_sez_preferenziale","label":"Contatore Sez. Preferenziale"}]'),
('CABINA_D',         'Cabina Ed. D',         '🏢', 'CONT-CAB-D',   '[{"key":"cont_sez_normale","label":"Contatore Sez. Normale"},{"key":"cont_sez_preferenziale","label":"Contatore Sez. Preferenziale"}]'),
('CABINA_I',         'Cabina Ed. I',         '🏢', 'CONT-CAB-I',   '[{"key":"cont_sez_normale","label":"Contatore Sez. Normale"},{"key":"cont_sez_preferenziale","label":"Contatore Sez. Preferenziale"}]'),
('ILL_STRADALE_M1',  'Ill. Stradale M (1)',  '💡', 'CONT-ILL-M1',  '[{"key":"cont_1_2_3","label":"Contatore 1-2-3"},{"key":"cont_4","label":"Contatore 4"},{"key":"cont_5","label":"Contatore 5"},{"key":"cont_7","label":"Contatore 7"}]'),
('ILL_STRADALE_M2',  'Ill. Stradale M (2)',  '💡', 'CONT-ILL-M2',  '[{"key":"cont_9","label":"Contatore 9"},{"key":"cont_10","label":"Contatore 10"},{"key":"cont_12","label":"Contatore 12"},{"key":"cont_14","label":"Contatore 14"}]'),
('ILL_STRADALE_G',   'Ill. Stradale G',      '💡', 'CONT-ILL-G',   '[{"key":"contatore","label":"Contatore"}]'),
('ILL_STRADALE_F2',  'Ill. Stradale F2',     '💡', 'CONT-ILL-F2',  '[{"key":"contatore","label":"Contatore"}]')
ON CONFLICT (station_id) DO NOTHING;

COMMENT ON TABLE energy_stations IS 'Postazioni contatori energia gestibili da dashboard';
COMMENT ON COLUMN energy_stations.nfc_tag IS 'Testo da programmare sul tag NFC fisico';
COMMENT ON COLUMN energy_stations.meters IS 'Array JSON: [{key,label}] — contatori da leggere';
