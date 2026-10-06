-- The local database and its logins, in the Docker Postgres (run by scripts/db-init.sh as the superuser, over the
-- container's own socket). Expects the psql variables db, app_password and migrator_password, which db-init.sh feeds
-- on stdin from Secret Manager: no password is ever on a command line or on disk. Safe to re-run; it re-applies the
-- passwords, which is how a rotation lands.
SET client_min_messages = warning;
SELECT 'CREATE ROLE sc_migrator LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sc_migrator') \gexec
SELECT 'CREATE ROLE sc_api LOGIN' WHERE NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'sc_api') \gexec
ALTER ROLE sc_migrator WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE PASSWORD :'migrator_password';
ALTER ROLE sc_api WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE CONNECTION LIMIT 50 PASSWORD :'app_password';
GRANT sc_owner TO sc_migrator;
GRANT sc_app TO sc_api;

SELECT format('CREATE DATABASE %I OWNER sc_owner', :'db')
  WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = :'db') \gexec
REVOKE ALL ON DATABASE :"db" FROM PUBLIC;
GRANT CONNECT, CREATE, TEMPORARY ON DATABASE :"db" TO sc_owner;
GRANT CONNECT ON DATABASE :"db" TO sc_app;
