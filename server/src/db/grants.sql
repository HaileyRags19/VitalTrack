-- Run once as the database owner (see README). Least-privilege app role.
GRANT USAGE ON SCHEMA public TO vitaltrack_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON patients TO vitaltrack_app;
GRANT USAGE, SELECT ON SEQUENCE patients_patient_id_seq TO vitaltrack_app;
-- Audit: the app may read and append only. The trigger blocks UPDATE and DELETE too.
GRANT SELECT, INSERT ON audit_logs TO vitaltrack_app;
GRANT USAGE, SELECT ON SEQUENCE audit_logs_audit_id_seq TO vitaltrack_app;
REVOKE UPDATE, DELETE, TRUNCATE ON audit_logs FROM vitaltrack_app;
