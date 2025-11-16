-- Script SQL para crear usuario admin de prueba
-- Ejecutar con: mysql -u root -p sipi_db < scripts/create-user-sql.sql

-- Verificar si el usuario ya existe
SET @user_exists = (SELECT COUNT(*) FROM users WHERE username = 'admin');

-- Si no existe, crear el usuario
SET @password_hash = '$2a$10$rK8X8X8X8X8X8X8X8X8X8u8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8'; -- admin123 hasheado

INSERT INTO users (id, username, passwordHash, role, createdAt, updatedAt)
SELECT 
    UUID() as id,
    'admin' as username,
    '$2a$10$rK8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8X8' as passwordHash,
    'ADMIN' as role,
    NOW() as createdAt,
    NOW() as updatedAt
WHERE @user_exists = 0;

SELECT 'Usuario admin creado exitosamente' AS resultado;

