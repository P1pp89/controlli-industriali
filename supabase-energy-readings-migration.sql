-- ============================================================
-- MIGRAZIONE: Tabella energy_readings per letture contatori
-- Da eseguire una volta sola nella SQL Editor di Supabase
-- https://supabase.com/dashboard/project/pynodlnwozlyxcfwfqvp/sql/new
-- ============================================================

CREATE TABLE IF NOT EXISTS energy_readings (
    id              uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
    reading_id      text        NOT NULL UNIQUE,
    station_id      text        NOT NULL,
    station_name    text        NOT NULL,
    operator_id     uuid        REFERENCES operators(id),
    operator_name   text,
    timestamp       timestamptz NOT NULL DEFAULT now(),
    meters          jsonb       NOT NULL DEFAULT '{}',
    notes           text,

    -- Colonne di sicurezza: presenza fisica verificata
    nfc_triggered   boolean     NOT NULL DEFAULT false,   -- true = aperto da NFC reale
    gps_lat         float,                                -- latitudine al momento della lettura
    gps_lng         float,                                -- longitudine al momento della lettura
    gps_accuracy    integer,                              -- precisione GPS in metri
    gps_valid       boolean,                              -- true = entro raggio consentito
    gps_distance_m  integer,                              -- distanza dalla postazione in metri

    created_at      timestamptz DEFAULT now()
);

-- Indici
CREATE INDEX IF NOT EXISTS idx_energy_readings_timestamp   ON energy_readings (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_energy_readings_station_id  ON energy_readings (station_id);
CREATE INDEX IF NOT EXISTS idx_energy_readings_operator_id ON energy_readings (operator_id);
CREATE INDEX IF NOT EXISTS idx_energy_readings_nfc         ON energy_readings (nfc_triggered);

-- Row Level Security
ALTER TABLE energy_readings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lettura libera energy_readings"
    ON energy_readings FOR SELECT USING (true);

-- Inserimento consentito solo se nfc_triggered = true
-- (secondo livello di difesa oltre al controllo nell'app)
CREATE POLICY "Inserimento solo con NFC verificato"
    ON energy_readings FOR INSERT
    WITH CHECK (nfc_triggered = true);

COMMENT ON TABLE energy_readings IS
    'Letture periodiche contatori energia — inserimento consentito solo se nfc_triggered=true';
COMMENT ON COLUMN energy_readings.nfc_triggered IS
    'true se il form è stato aperto da una scansione NFC fisica reale';
COMMENT ON COLUMN energy_readings.gps_valid IS
    'true se l''operatore era entro il raggio GPS consentito per la postazione';
