# Estrategia de Implementación de Reglas de Negocio

## 📊 Análisis de la Situación Actual

### ✅ Lo que estamos haciendo bien

1. **Separación de capas básica**
   - Controllers: Manejo HTTP y validación básica
   - Services: Lógica de negocio y validaciones complejas
   - Frontend: Validaciones UX (no críticas)

2. **Documentación de reglas**
   - Reglas documentadas con códigos RB-XXX
   - Documento centralizado (`REGLAS-NEGOCIO-ENROLLMENTS.md`)

3. **Validación en backend**
   - Todas las reglas críticas están en el backend
   - Frontend solo valida para UX, no para seguridad

### ⚠️ Áreas de mejora identificadas

1. **Reglas mezcladas con lógica de servicio**
   ```typescript
   // ❌ Actual: Reglas mezcladas con lógica
   export const createEnrollment = async (data) => {
     // RB-001: Validación aquí
     if (student.estatus === 'INACTIVO') { ... }
     // Lógica de creación
     // RB-002: Otra validación aquí
     // Más lógica...
   }
   ```

2. **Duplicación de validaciones**
   - Frontend valida para UX (bueno)
   - Backend valida para seguridad (bueno)
   - Pero la lógica está duplicada (mejorable)

3. **Difícil de testear**
   - No se pueden testear reglas de forma aislada
   - Tests requieren mockear toda la función de servicio

4. **Difícil de reutilizar**
   - Reglas específicas de enrollment no se pueden usar en otros contextos
   - Validaciones similares se repiten en diferentes servicios

5. **Mantenimiento**
   - Cambiar una regla requiere modificar el servicio completo
   - No hay forma de deshabilitar/habilitar reglas fácilmente

---

## 🎯 Estrategia Recomendada (Evolutiva)

### Fase 1: Refactorización Inmediata (Sin cambios arquitectónicos grandes)

**Objetivo**: Mejorar organización sin romper código existente

#### 1.1 Crear Validadores Dedicados

```typescript
// backend/src/modules/enrollments/enrollments.validators.ts

export class EnrollmentValidators {
  /**
   * RB-001: Validar que el estudiante esté activo
   */
  static async validateStudentActive(studentId: string): Promise<void> {
    const student = await prisma.students.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    if (student.estatus === 'INACTIVO' || student.estatus === 'EGRESADO') {
      throw new Error(`No se puede inscribir un estudiante con estatus ${student.estatus}`);
    }
  }

  /**
   * RB-002: Validar que el grupo esté disponible
   */
  static async validateGroupAvailable(groupId: string): Promise<void> {
    const group = await prisma.groups.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.estatus === 'CERRADO' || group.estatus === 'CANCELADO' || group.estatus === 'FINALIZADO') {
      throw new Error(`No se puede inscribir en un grupo con estatus ${group.estatus}`);
    }
  }

  /**
   * RB-006: Validar capacidad del grupo
   */
  static async validateGroupCapacity(groupId: string): Promise<void> {
    const group = await prisma.groups.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    if (group.cupoActual >= group.cupoMaximo) {
      throw new Error('Grupo lleno. No hay cupos disponibles');
    }
  }

  /**
   * RB-003: Validar que no exista duplicado
   */
  static async validateNoDuplicate(studentId: string, groupId: string): Promise<void> {
    const existing = await prisma.enrollments.findUnique({
      where: {
        studentId_groupId: { studentId, groupId },
      },
    });

    if (existing) {
      throw new Error('Student is already enrolled in this group');
    }
  }

  /**
   * RB-021: Validar transición de estado
   */
  static validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'INSCRITO': ['EN_CURSO', 'BAJA', 'CANCELADO'],
      'EN_CURSO': ['BAJA', 'APROBADO', 'REPROBADO'],
      'BAJA': ['EN_CURSO'],
      'APROBADO': [],
      'REPROBADO': [],
      'CANCELADO': [],
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Transición inválida: no se puede cambiar de ${currentStatus} a ${newStatus}`);
    }
  }

  /**
   * RB-020: Validar campos editables según estado
   */
  static validateEditableFields(
    currentStatus: string,
    data: UpdateEnrollmentDto
  ): void {
    if (currentStatus === 'APROBADO' || currentStatus === 'REPROBADO') {
      const restrictedFields = ['studentId', 'groupId', 'tipoInscripcion', 'estatus'];
      for (const field of restrictedFields) {
        if (data[field as keyof UpdateEnrollmentDto] !== undefined) {
          throw new Error(`No se pueden editar campos críticos cuando el estatus es ${currentStatus}`);
        }
      }
    } else if (currentStatus === 'BAJA') {
      if (data.studentId !== undefined || data.groupId !== undefined || data.tipoInscripcion !== undefined) {
        throw new Error('Solo se pueden editar observaciones y fecha de baja cuando el estatus es BAJA');
      }
    } else if (currentStatus === 'CANCELADO') {
      if (data.studentId !== undefined || data.groupId !== undefined || 
          data.tipoInscripcion !== undefined || data.estatus !== undefined) {
        throw new Error('Solo se pueden editar observaciones cuando el estatus es CANCELADO');
      }
    }
  }
}
```

#### 1.2 Refactorizar Servicio para Usar Validadores

```typescript
// backend/src/modules/enrollments/enrollments.service.ts

import { EnrollmentValidators } from './enrollments.validators';

export const createEnrollment = async (
  data: CreateEnrollmentDto
): Promise<EnrollmentResponseDto> => {
  const { studentId, groupId, calificacion } = data;

  // Aplicar validaciones usando validadores
  await EnrollmentValidators.validateStudentActive(studentId);
  await EnrollmentValidators.validateGroupAvailable(groupId);
  await EnrollmentValidators.validateGroupCapacity(groupId);
  await EnrollmentValidators.validateNoDuplicate(studentId, groupId);

  // Validar calificacion si se proporciona
  if (calificacion !== undefined && calificacion !== null) {
    if (calificacion < 0 || calificacion > 100) {
      throw new Error('Calificacion must be between 0 and 100');
    }
  }

  // Lógica de creación (sin validaciones mezcladas)
  // ...
};
```

**Ventajas**:
- ✅ Código más limpio y legible
- ✅ Validaciones reutilizables
- ✅ Fácil de testear cada validador por separado
- ✅ Fácil de mantener y documentar

---

### Fase 2: Crear Capa de Reglas de Negocio (Opcional, Futuro)

**Objetivo**: Separar completamente reglas de negocio de la lógica de servicio

#### 2.1 Estructura Propuesta

```
backend/src/
  modules/
    enrollments/
      enrollments.rules.ts          # Reglas de negocio puras
      enrollments.validators.ts     # Validadores (Fase 1)
      enrollments.service.ts         # Lógica de servicio
      enrollments.controller.ts      # Manejo HTTP
```

#### 2.2 Ejemplo de Regla de Negocio

```typescript
// backend/src/modules/enrollments/enrollments.rules.ts

export interface EnrollmentRule {
  name: string;
  description: string;
  validate(context: EnrollmentContext): Promise<void>;
}

export interface EnrollmentContext {
  studentId?: string;
  groupId?: string;
  currentStatus?: string;
  newStatus?: string;
  data?: CreateEnrollmentDto | UpdateEnrollmentDto;
  existingEnrollment?: Enrollment;
}

export class StudentActiveRule implements EnrollmentRule {
  name = 'RB-001';
  description = 'El estudiante debe estar activo';

  async validate(context: EnrollmentContext): Promise<void> {
    if (!context.studentId) return;

    const student = await prisma.students.findUnique({
      where: { id: context.studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    if (student.estatus === 'INACTIVO' || student.estatus === 'EGRESADO') {
      throw new Error(`No se puede inscribir un estudiante con estatus ${student.estatus}`);
    }
  }
}

// Registro de reglas
export const enrollmentRules: EnrollmentRule[] = [
  new StudentActiveRule(),
  new GroupAvailableRule(),
  new GroupCapacityRule(),
  // ...
];

// Ejecutor de reglas
export class EnrollmentRuleEngine {
  static async execute(
    rules: EnrollmentRule[],
    context: EnrollmentContext
  ): Promise<void> {
    for (const rule of rules) {
      await rule.validate(context);
    }
  }
}
```

**Ventajas**:
- ✅ Reglas completamente desacopladas
- ✅ Fácil agregar/quitar reglas
- ✅ Testeable de forma independiente
- ✅ Puede tener configuración (habilitar/deshabilitar reglas)

**Desventajas**:
- ⚠️ Más complejidad arquitectónica
- ⚠️ Puede ser over-engineering para proyectos pequeños

---

### Fase 3: Validaciones Compartidas (Reutilización)

**Objetivo**: Crear validadores compartidos para reglas comunes

```typescript
// backend/src/shared/validators/entity.validators.ts

export class EntityValidators {
  /**
   * Validar que una entidad esté activa
   */
  static async validateEntityActive<T extends { estatus: string }>(
    entityType: 'student' | 'teacher' | 'group',
    entityId: string,
    allowedStatuses: string[] = ['ACTIVO', 'ABIERTO', 'EN_CURSO']
  ): Promise<T> {
    const entity = await this.findEntity<T>(entityType, entityId);
    
    if (!entity) {
      throw new Error(`${entityType} not found`);
    }

    if (!allowedStatuses.includes(entity.estatus)) {
      throw new Error(`${entityType} is not active (status: ${entity.estatus})`);
    }

    return entity;
  }

  private static async findEntity<T>(
    entityType: string,
    entityId: string
  ): Promise<T | null> {
    // Implementación usando Prisma
  }
}
```

---

## 📋 Recomendación Final

### Para el proyecto actual:

**✅ Implementar Fase 1 (Validadores Dedicados)**
- Mejora inmediata sin grandes cambios
- Código más limpio y mantenible
- Fácil de testear
- Bajo riesgo

**⏸️ Considerar Fase 2 solo si:**
- El proyecto crece significativamente
- Necesitas deshabilitar reglas dinámicamente
- Tienes reglas muy complejas que requieren configuración

**✅ Implementar Fase 3 gradualmente:**
- Identificar validaciones comunes entre módulos
- Extraer a validadores compartidos
- Reutilizar en todos los módulos

---

## 🧪 Testing de Reglas

Con la Fase 1, puedes testear reglas fácilmente:

```typescript
// tests/enrollments.validators.test.ts

describe('EnrollmentValidators', () => {
  describe('validateStudentActive', () => {
    it('should throw if student is INACTIVO', async () => {
      // Mock Prisma
      // Test regla aislada
      await expect(
        EnrollmentValidators.validateStudentActive('inactive-student-id')
      ).rejects.toThrow('No se puede inscribir un estudiante con estatus INACTIVO');
    });
  });
});
```

---

## 📝 Checklist de Implementación

### Fase 1 (Recomendada ahora)
- [ ] Crear `enrollments.validators.ts`
- [ ] Extraer todas las validaciones RB-XXX a validadores
- [ ] Refactorizar `enrollments.service.ts` para usar validadores
- [ ] Crear tests unitarios para cada validador
- [ ] Documentar cada validador con su regla RB-XXX

### Fase 2 (Opcional, futuro)
- [ ] Crear estructura de reglas de negocio
- [ ] Implementar `EnrollmentRule` interface
- [ ] Crear `EnrollmentRuleEngine`
- [ ] Migrar validadores a reglas
- [ ] Agregar sistema de configuración de reglas

### Fase 3 (Gradual)
- [ ] Identificar validaciones comunes
- [ ] Crear `shared/validators/`
- [ ] Extraer validadores compartidos
- [ ] Usar en todos los módulos

---

## 🎓 Mejores Prácticas Aplicadas

1. **Single Responsibility**: Cada validador tiene una responsabilidad
2. **DRY (Don't Repeat Yourself)**: Validaciones reutilizables
3. **Testabilidad**: Reglas testeables de forma aislada
4. **Mantenibilidad**: Fácil de encontrar y modificar reglas
5. **Documentación**: Cada regla está documentada con RB-XXX

---

## 💡 Conclusión

**La estrategia actual es funcional pero mejorable.**

**Recomendación**: Implementar **Fase 1** para mejorar organización y mantenibilidad sin agregar complejidad innecesaria. Esto nos da:
- ✅ Código más limpio
- ✅ Mejor testabilidad
- ✅ Fácil mantenimiento
- ✅ Sin over-engineering

¿Procedemos con la Fase 1?




