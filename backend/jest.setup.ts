/**
 * Jest setup — variables mínimas para cargar módulos que instancian Prisma al import.
 */
process.env.DATABASE_URL ??= 'mysql://test:test@127.0.0.1:3306/sipi_test';
process.env.JWT_SECRET ??= 'test_jwt_secret_minimum_32_characters_long';
