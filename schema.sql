-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    patient_id SERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    dob DATE NOT NULL,
    medical_history TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Immutable Shadow Table for Audit Logging
CREATE TABLE IF NOT EXISTS audit_logs (
    audit_id SERIAL PRIMARY KEY,
    action_type VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    patient_id INT NOT NULL,
    performed_by VARCHAR(100) DEFAULT 'system_user',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    old_data JSONB,
    new_data JSONB
);

-- 3. PL/pgSQL Trigger Function for Forensic Audit Logging
CREATE OR REPLACE FUNCTION log_patient_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (action_type, patient_id, old_data)
        VALUES ('DELETE', OLD.patient_id, row_to_json(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (action_type, patient_id, old_data, new_data)
        VALUES ('UPDATE', NEW.patient_id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (action_type, patient_id, new_data)
        VALUES ('INSERT', NEW.patient_id, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 4. Attach Trigger to Patients Table
DROP TRIGGER IF EXISTS patient_audit_trigger ON patients;
CREATE TRIGGER patient_audit_trigger
AFTER INSERT OR UPDATE OR DELETE ON patients
FOR EACH ROW EXECUTE FUNCTION log_patient_changes();