-- The group roles every environment has; run by db-init.sh locally and by `sc-admin migrate` on Cloud SQL.
--   sc_owner  owns the schema and every object in it; migrations run as it (SET ROLE sc_owner)
--   sc_app    what the API may do: read and write the data, read the reference data, append to the audit log
-- Logins are members of one of them: locally sc_migrator and sc_api (passwords from Secret Manager), on Cloud SQL the
-- IAM users of the sc-migrator and sc-api service accounts (no passwords at all).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sc_owner') THEN
    CREATE ROLE sc_owner NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sc_app') THEN
    CREATE ROLE sc_app NOLOGIN;
  END IF;
END
$$;
