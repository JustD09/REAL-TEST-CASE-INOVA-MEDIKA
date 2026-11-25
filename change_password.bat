@echo off
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -d simrs_db -c "ALTER USER postgres PASSWORD 'Admin123';"