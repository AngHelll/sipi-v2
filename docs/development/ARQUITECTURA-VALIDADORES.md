# Arquitectura de Validadores - Sistema de Reglas de Negocio

## 📋 Índice
1. [Visión General](#visión-general)
2. [Estructura de Archivos](#estructura-de-archivos)
3. [Validadores Compartidos](#validadores-compartidos)
4. [Validadores Específicos](#validadores-específicos)
5. [Uso en Servicios](#uso-en-servicios)
6. [Testing](#testing)
7. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Visión General

El sistema de validadores implementa un patrón de **Separación de Responsabilidades** donde:

- **Validadores**: Contienen todas las reglas de negocio (RB-XXX)
- **Servicios**: Contienen la lógica de negocio y orquestación
- **Controladores**: Manejan HTTP y validación básica

### Beneficios

✅ **Legibilidad**: Código más fácil de leer y entender  
✅ **Testabilidad**: Cada regla testeable de forma aislada  
✅ **Reutilización**: Validadores compartidos entre módulos  
✅ **Mantenibilidad**: Fácil encontrar y modificar reglas  
✅ **DRY**: Sin duplicación de código

---

## 📁 Estructura de Archivos

```
backend/src/
├── modules/
│   ├── enrollments/
│   │   ├── enrollments.validators.ts    # Reglas específicas de enrollments
│   │   ├── enrollments.service.ts       # Usa validadores
│   │   └── __tests__/
│   │       └── enrollments.validators.test.ts
│   ├── students/
│   │   ├── students.validators.ts       # Reglas específicas de students
│   │   ├── students.service.ts          # Usa validadores
│   │   └── __tests__/
│   │       └── students.validators.test.ts
│   ├── groups/
│   │   ├── groups.validators.ts         # Reglas específicas de groups
│   │   └── groups.service.ts            # Usa validadores
│   ├── subjects/
│   │   ├── subjects.validators.ts       # Reglas específicas de subjects
│   │   └── subjects.service.ts          # Usa validadores
│   └── teachers/
│       ├── teachers.validators.ts       # Reglas específicas de teachers
│       └── teachers.service.ts         # Usa validadores
└── shared/
    └── validators/
        ├── entity.validators.ts         # Validaciones comunes
        └── __tests__/
            └── entity.validators.test.ts
```

---

## 🔵 Validadores Compartidos

**Ubicación**: `backend/src/shared/validators/entity.validators.ts`

### Propósito

Contiene validaciones comunes usadas por múltiples módulos para evitar duplicación de código.

### Validadores Disponibles

#### 1. `validateUsernameUnique(username: string)`
- **Usado por**: Students, Teachers
- **Propósito**: Validar que el username no exista
- **Lanza**: `Error('Username already exists')`

#### 2. `validateStudentExists(studentId: string)`
- **Usado por**: Enrollments, Students
- **Propósito**: Validar que el estudiante exista
- **Retorna**: El objeto student si existe
- **Lanza**: `Error('Student not found')`

#### 3. `validateTeacherExists(teacherId: string)`
- **Usado por**: Groups, Teachers
- **Propósito**: Validar que el maestro exista
- **Retorna**: El objeto teacher si existe
- **Lanza**: `Error('Teacher not found')`

#### 4. `validateSubjectExists(subjectId: string)`
- **Usado por**: Groups, Subjects
- **Propósito**: Validar que la materia exista
- **Retorna**: El objeto subject si existe
- **Lanza**: `Error('Subject not found')`

#### 5. `validateGroupExists(groupId: string)`
- **Usado por**: Enrollments, Groups
- **Propósito**: Validar que el grupo exista
- **Retorna**: El objeto group si existe
- **Lanza**: `Error('Group not found')`

### Ejemplo de Uso

```typescript
import { EntityValidators } from '../../shared/validators/entity.validators';

// En un servicio
await EntityValidators.validateStudentExists(studentId);
await EntityValidators.validateUsernameUnique(username);
```

---

## 🟢 Validadores Específicos

Cada módulo tiene sus propios validadores para reglas de negocio específicas.

### EnrollmentValidators

**Ubicación**: `backend/src/modules/enrollments/enrollments.validators.ts`

#### Validadores de Reglas de Negocio (RB-XXX)

- `validateStudentActive()` - RB-001: Estudiante debe estar activo
- `validateGroupAvailable()` - RB-002: Grupo debe estar disponible
- `validateGroupCapacity()` - RB-006: Grupo debe tener cupos
- `validateNoDuplicate()` - RB-003: No duplicar inscripciones
- `validateNewGroupCapacity()` - RB-007: Validar capacidad al cambiar grupo
- `validateGroupChangeAllowed()` - RB-023: Validar cambio de grupo según estado
- `validateStatusTransition()` - RB-021: Validar transiciones de estado
- `validateEditableFields()` - RB-020: Validar campos editables según estado
- `validateGradeRange()` - Validación genérica de calificaciones

#### Calculadores

- `calculateAprobado()` - RB-014: Calcular aprobado automáticamente
- `calculateFechaAprobacion()` - RB-015: Calcular fecha de aprobación
- `calculatePorcentajeAsistencia()` - RB-016: Calcular porcentaje de asistencia

### StudentValidators

**Ubicación**: `backend/src/modules/students/students.validators.ts`

- `validateUsernameUnique()` - Usa EntityValidators
- `validateMatriculaUnique()` - Validar matrícula única
- `validateStudentExists()` - Usa EntityValidators

### GroupValidators

**Ubicación**: `backend/src/modules/groups/groups.validators.ts`

- `validateSubjectExists()` - Usa EntityValidators
- `validateTeacherExists()` - Usa EntityValidators
- `validateGroupExists()` - Usa EntityValidators

### SubjectValidators

**Ubicación**: `backend/src/modules/subjects/subjects.validators.ts`

- `validateClaveUnique()` - Validar clave única
- `validateSubjectExists()` - Usa EntityValidators
- `validateSubjectCanBeDeleted()` - Validar que se puede eliminar (sin grupos)

### TeacherValidators

**Ubicación**: `backend/src/modules/teachers/teachers.validators.ts`

- `validateUsernameUnique()` - Usa EntityValidators
- `validateTeacherExists()` - Usa EntityValidators
- `validateTeacherCanBeDeleted()` - Validar que se puede eliminar (sin grupos)

---

## 💻 Uso en Servicios

### Patrón de Uso

```typescript
// ❌ ANTES: Validaciones mezcladas con lógica
export const createEnrollment = async (data: CreateEnrollmentDto) => {
  const student = await prisma.students.findUnique({ where: { id: data.studentId } });
  if (!student) throw new Error('Student not found');
  if (student.estatus === 'INACTIVO') throw new Error('...');
  // ... más validaciones ...
  // ... lógica de creación ...
};

// ✅ DESPUÉS: Validaciones separadas
export const createEnrollment = async (data: CreateEnrollmentDto) => {
  // Aplicar validaciones usando validadores
  await EnrollmentValidators.validateStudentActive(data.studentId);
  const group = await EnrollmentValidators.validateGroupAvailable(data.groupId);
  await EnrollmentValidators.validateGroupCapacity(data.groupId);
  await EnrollmentValidators.validateNoDuplicate(data.studentId, data.groupId);

  // Lógica de creación (sin validaciones mezcladas)
  // ...
};
```

### Ejemplo Completo

```typescript
import { EnrollmentValidators, EnrollmentCalculators } from './enrollments.validators';

export const createEnrollment = async (
  data: CreateEnrollmentDto
): Promise<EnrollmentResponseDto> => {
  const { studentId, groupId, calificacion } = data;

  // 1. Validar reglas de negocio
  await EnrollmentValidators.validateStudentActive(studentId);
  const group = await EnrollmentValidators.validateGroupAvailable(groupId);
  await EnrollmentValidators.validateGroupCapacity(groupId);
  await EnrollmentValidators.validateNoDuplicate(studentId, groupId);
  EnrollmentValidators.validateGradeRange(calificacion, 'Calificacion');

  // 2. Calcular valores automáticos
  const aprobado = EnrollmentCalculators.calculateAprobado(
    data.calificacionFinal,
    data.aprobado
  );
  const porcentajeAsistencia = EnrollmentCalculators.calculatePorcentajeAsistencia(
    data.asistencias,
    data.faltas,
    data.porcentajeAsistencia
  );

  // 3. Lógica de creación
  // ...
};
```

---

## 🧪 Testing

### Estructura de Tests

Cada validador tiene su archivo de tests correspondiente:

```
module/
├── validators.ts
└── __tests__/
    └── validators.test.ts
```

### Ejemplo de Test

```typescript
import { EnrollmentValidators } from '../enrollments.validators';
import prisma from '../../../config/database';

jest.mock('../../../config/database');

describe('EnrollmentValidators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateStudentActive', () => {
    it('should pass when student is ACTIVO', async () => {
      (prisma.students.findUnique as jest.Mock).mockResolvedValue({
        id: 'student-1',
        estatus: 'ACTIVO',
      });

      await expect(
        EnrollmentValidators.validateStudentActive('student-1')
      ).resolves.not.toThrow();
    });

    it('should throw when student is INACTIVO', async () => {
      (prisma.students.findUnique as jest.Mock).mockResolvedValue({
        id: 'student-1',
        estatus: 'INACTIVO',
      });

      await expect(
        EnrollmentValidators.validateStudentActive('student-1')
      ).rejects.toThrow('No se puede inscribir un estudiante con estatus INACTIVO');
    });
  });
});
```

### Ejecutar Tests

```bash
# Todos los tests
npm test

# Modo watch
npm run test:watch

# Con cobertura
npm run test:coverage
```

---

## 📚 Mejores Prácticas

### 1. Cuándo Crear un Validador Compartido

✅ **Crear compartido cuando**:
- La validación se usa en 2+ módulos
- La lógica es idéntica en todos los casos
- Es una validación de existencia básica

❌ **NO crear compartido cuando**:
- La validación tiene lógica específica del módulo
- Solo se usa en un módulo
- Tiene reglas de negocio complejas (RB-XXX)

### 2. Naming Conventions

- **Validadores**: `validate[Entity][Action]()` o `validate[Rule]()`
  - Ejemplo: `validateStudentActive()`, `validateGroupCapacity()`
- **Calculadores**: `calculate[Value]()`
  - Ejemplo: `calculateAprobado()`, `calculatePorcentajeAsistencia()`

### 3. Documentación

Cada validador debe tener:
- JSDoc con descripción
- Referencia a regla de negocio (RB-XXX) si aplica
- Parámetros documentados
- Errores que puede lanzar

### 4. Testing

- **Cobertura**: Cada validador debe tener tests
- **Casos**: Testear casos exitosos y casos de error
- **Aislamiento**: Cada test debe ser independiente
- **Mocks**: Usar mocks para Prisma

### 5. Orden de Validaciones

1. **Validaciones de existencia** (EntityValidators)
2. **Validaciones de reglas de negocio** (Validadores específicos)
3. **Cálculos automáticos** (Calculadores)
4. **Lógica de negocio** (Servicios)

---

## 🔄 Flujo de Validación

```
Request → Controller → Service
                          ↓
                    Validadores
                          ↓
              ┌───────────┴───────────┐
              ↓                       ↓
    EntityValidators      ModuleValidators
    (compartidos)         (específicos)
              ↓                       ↓
              └───────────┬───────────┘
                          ↓
                    Cálculos
                    (Calculators)
                          ↓
                    Lógica de Negocio
                          ↓
                    Persistencia
```

---

## 📊 Estadísticas Actuales

- **5 módulos** con validadores implementados
- **20+ validadores** específicos creados
- **5 validadores** compartidos
- **50+ tests** unitarios
- **0 duplicación** de código de validación

---

## 🚀 Extensión del Sistema

### Agregar Nuevo Validador Compartido

1. Agregar método a `EntityValidators`
2. Documentar uso en múltiples módulos
3. Crear tests
4. Actualizar módulos que lo necesiten

### Agregar Nuevo Validador Específico

1. Agregar método al validador del módulo
2. Documentar regla de negocio (RB-XXX)
3. Crear tests
4. Usar en el servicio correspondiente

---

## 💡 Ejemplos de Uso Avanzado

### Validación Condicional

```typescript
// Validar solo si se proporciona el campo
if (data.groupId) {
  await EnrollmentValidators.validateGroupAvailable(data.groupId);
}
```

### Validación con Contexto

```typescript
// Validar con información adicional
const currentStatus = data.estatus || existingEnrollment.estatus;
EnrollmentValidators.validateGroupChangeAllowed(currentStatus);
```

### Múltiples Validaciones

```typescript
// Aplicar múltiples validaciones
await Promise.all([
  EnrollmentValidators.validateStudentActive(studentId),
  EnrollmentValidators.validateGroupAvailable(groupId),
  EnrollmentValidators.validateGroupCapacity(groupId),
]);
```

---

## ✅ Checklist de Implementación

Al crear un nuevo módulo con validadores:

- [ ] Crear archivo `[module].validators.ts`
- [ ] Identificar validaciones comunes → usar `EntityValidators`
- [ ] Crear validadores específicos para reglas de negocio
- [ ] Documentar cada validador con JSDoc
- [ ] Crear tests unitarios
- [ ] Refactorizar servicio para usar validadores
- [ ] Verificar que no hay duplicación

---

## 📝 Notas Finales

- Los validadores **NO** deben tener lógica de negocio compleja
- Los validadores **SÍ** deben validar reglas de negocio (RB-XXX)
- Los calculadores transforman datos, no solo validan
- Mantener validadores simples y enfocados
- Preferir composición sobre herencia

---

**Última actualización**: 2025-01-21  
**Versión**: 1.0.0




