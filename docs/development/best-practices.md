# Mejores Prácticas de Desarrollo

## Arquitectura

### Backend

#### Separación de Responsabilidades

- **Routes**: Solo definición de endpoints y middlewares
- **Controllers**: Manejo de HTTP (req/res), validación básica
- **Services**: Lógica de negocio, validaciones complejas
- **Database**: Acceso a datos mediante Prisma

#### Ejemplo de Flujo Correcto

```typescript
// routes.ts - Solo rutas y middlewares
router.post('/',
  authenticate,
  authorize(UserRole.ADMIN),
  validateUUID('id'),
  validateRequest,
  studentsController.createStudent
);

// controller.ts - Manejo HTTP
export const createStudent = asyncHandler(async (req, res) => {
  const dto = req.body as CreateStudentDto;
  const student = await studentsService.createStudent(dto);
  res.status(201).json(student);
});

// service.ts - Lógica de negocio
export const createStudent = async (dto: CreateStudentDto) => {
  // Validaciones de negocio
  // Transformaciones
  // Llamadas a DB
  return result;
};
```

### Frontend

#### Componentes

- **Pages**: Vistas principales, manejo de estado local
- **Components**: Componentes reutilizables, sin lógica de negocio
- **Context**: Estado global compartido
- **API Client**: Comunicación con backend

#### Manejo de Estado

- Estado local: `useState` para datos de componente
- Estado global: Context API (Auth, Theme, Toast)
- Estado del servidor: Fetching con `useEffect` y `useState`

## Seguridad

### Validación

- Validar entrada en el backend siempre
- Usar `express-validator` para validación estructurada
- Validar UUIDs en parámetros de ruta
- Validar tipos y rangos de datos

### Autenticación

- Usar cookies HTTP-only para tokens
- No exponer tokens en localStorage
- Validar tokens en cada request protegido
- Implementar refresh tokens para producción

### Sanitización

- Sanitizar entrada del usuario
- Escapar HTML para prevenir XSS
- Preservar contraseñas (no sanitizar)

## Código

### TypeScript

- Usar tipos explícitos, evitar `any`
- Definir interfaces/tipos para DTOs
- Usar `import type` para imports de solo tipos

### Naming Conventions

- **Variables/Funciones**: camelCase (`getStudentById`)
- **Componentes**: PascalCase (`StudentForm`)
- **Constantes**: UPPER_SNAKE_CASE (`MAX_RETRIES`)
- **Archivos**: kebab-case (`student-form.tsx`)

### Comentarios

- Comentar código complejo
- Documentar funciones públicas
- Usar JSDoc para funciones importantes
- No comentar código obvio

## Manejo de Errores

### Backend

- Usar `asyncHandler` para funciones async
- Error handler global para errores no manejados
- Mensajes de error consistentes
- No exponer detalles internos en producción

### Frontend

- Error boundaries para errores de React
- Manejo de errores en API calls
- Mostrar mensajes amigables al usuario
- Logging de errores para debugging

## Testing

### Buenas Prácticas

- Tests unitarios para lógica de negocio
- Tests de integración para endpoints
- Tests E2E para flujos críticos
- Mocking de dependencias externas

## Performance

### Backend

- Índices en campos frecuentemente consultados
- Paginación en listas grandes
- Queries optimizadas con Prisma
- Rate limiting para prevenir abuso

### Frontend

- Lazy loading de componentes
- Memoización de cálculos costosos
- Debounce en búsquedas
- Optimización de re-renders

## Git

### Commits

- Mensajes claros y descriptivos
- Un cambio lógico por commit
- Usar formato convencional si es posible

### Branches

- `main`: Código estable
- `develop`: Desarrollo activo
- `feature/*`: Nuevas funcionalidades
- `fix/*`: Correcciones de bugs

