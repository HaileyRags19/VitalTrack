CREATE TABLE patients (
	id SERIAL PRIMARY KEY,
	name VARCHAR(100),
	condition TEXT,
	last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE audit_logs (
	id SERIAL PRIMARY KEY,
	patient_id INT,
	action VATCHAR(50),
	changed_by VARCHAR(100),
	change_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE OR REPLACE FUNCTION log_patient_changes()
RETURNS TRIGGER AS $$
BEGIN
	INSERT INTO audit_logs(patient_id, action, changed_by)
	VALUES (OLD.id, 'UPDATE', 'Authorized_User_ID');
	RETURN NEW;
END;
$$ LANGUAGE plpsql;

CREATE TRIGGER patient_update_audit
AFTER UPDATE ON patients
FOR EACH ROW EXECUTE FUNCTION log_patient_changes();