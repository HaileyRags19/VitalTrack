-- VitalTrack schema. Safe to re-run.

CREATE TABLE IF NOT EXISTS patients (
  patient_id      SERIAL PRIMARY KEY,
  first_name      VARCHAR(50)  NOT NULL,
  last_name       VARCHAR(50)  NOT NULL,
  dob             DATE         NOT NULL,
  medical_history TEXT,
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS patients_last_name_idx ON patients (last_name);
CREATE INDEX IF NOT EXISTS patients_dob_idx ON patients (dob);

CREATE TABLE IF NOT EXISTS audit_logs (
  audit_id     SERIAL PRIMARY KEY,
  action_type  VARCHAR(10) NOT NULL CHECK (action_type IN ('VIEW','INSERT','UPDATE','DELETE')),
  patient_id   INT         NOT NULL,
  performed_by VARCHAR(255) NOT NULL DEFAULT 'unknown',
  changed_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  old_data     JSONB,
  new_data     JSONB
);

CREATE INDEX IF NOT EXISTS audit_logs_patient_idx ON audit_logs (patient_id);

-- Write triggers: record INSERT / UPDATE / DELETE with the acting user.
CREATE OR REPLACE FUNCTION log_patient_changes() RETURNS TRIGGER AS $$
DECLARE
  actor TEXT := COALESCE(NULLIF(current_setting('app.user_id', true), ''), 'unknown');
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (action_type, patient_id, performed_by, old_data)
    VALUES ('DELETE', OLD.patient_id, actor, to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (action_type, patient_id, performed_by, old_data, new_data)
    VALUES ('UPDATE', NEW.patient_id, actor, to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSE
    INSERT INTO audit_logs (action_type, patient_id, performed_by, new_data)
    VALUES ('INSERT', NEW.patient_id, actor, to_jsonb(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS patient_audit_trigger ON patients;
CREATE TRIGGER patient_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW EXECUTE FUNCTION log_patient_changes();

-- Immutability: audit rows can be added but never changed or removed.
CREATE OR REPLACE FUNCTION forbid_audit_modification() RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_immutable ON audit_logs;
CREATE TRIGGER audit_logs_immutable
BEFORE UPDATE OR DELETE ON audit_logs
FOR EACH ROW EXECUTE FUNCTION forbid_audit_modification();
