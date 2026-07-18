-- ============================================================
-- MIGRAZIONE: Aggiunge tag_type a unknown_tags
-- Distingue tag per impianti normali da tag per contatori energia
-- ============================================================
ALTER TABLE unknown_tags ADD COLUMN IF NOT EXISTS tag_type text NOT NULL DEFAULT 'control';
-- 'control'  = impianto tecnico normale (va in technical_rooms)
-- 'energy'   = postazione contatori (va in energy_stations)

COMMENT ON COLUMN unknown_tags.tag_type IS 'control = impianto tecnico, energy = postazione contatori';
