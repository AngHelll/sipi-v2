# Plan de Implementación - Base de Datos V2

## 📋 Resumen Ejecutivo

Este documento detalla el plan paso a paso para implementar el nuevo diseño de base de datos que separa claramente los diferentes tipos de actividades académicas.

---

## 🎯 Objetivos

1. Separar conceptos: materias, exámenes, cursos, servicio social, prácticas
2. Mantener compatibilidad durante la migración
3. Reutilizar código existente donde sea posible
4. Implementar de forma gradual y segura
5. No romper funcionalidad existente

---

## 📅 Fases de Implementación

### Fase 1: Preparación y Diseño (1-2 días)

#### 1.1 Revisar y Aprobar Diseño
- [ ] Revisar `DISENO-BASE-DATOS-V2.md`
- [ ] Aprobar arquitectura propuesta
- [ ] Resolver decisiones pendientes
- [ ] Ajustar diseño si es necesario

#### 1.2 Crear Documentación de Migración
- [ ] Documentar mapeo de datos actual → nuevo
- [ ] Crear scripts de validación
- [ ] Definir criterios de éxito

---

### Fase 2: Crear Nuevas Tablas (2-3 días)

#### 2.1 Actualizar Schema Prisma
- [ ] Crear `academic_activities` table
- [ ] Crear `exams` table
- [ ] Crear `special_courses` table
- [ ] Crear `social_service` table
- [ ] Crear `professional_practices` table
- [ ] Crear `activity_history` table
- [ ] Actualizar enums
- [ ] Agregar relaciones

#### 2.2 Crear Migración
```bash
npx prisma migrate dev --name create_academic_activities_structure
```

#### 2.3 Validar Migración
- [ ] Verificar que tablas se crearon correctamente
- [ ] Verificar índices
- [ ] Verificar foreign keys
- [ ] Verificar constraints

---

### Fase 3: Crear Servicios Base (3-4 días)

#### 3.1 AcademicActivitiesService
```typescript
// backend/src/modules/academic-activities/academic-activities.service.ts
- createActivity()
- getActivityById()
- getActivitiesByStudent()
- updateActivityStatus()
- deleteActivity()
```

#### 3.2 ExamsService
```typescript
// backend/src/modules/academic-activities/exams/exams.service.ts
- createExam()
- getExamById()
- processExamResult()
- getExamsByStudent()
```

#### 3.3 SpecialCoursesService
```typescript
// backend/src/modules/academic-activities/special-courses/special-courses.service.ts
- createSpecialCourse()
- submitPayment()
- approvePayment()
- completeCourse()
```

#### 3.4 Validadores
- [ ] `AcademicActivitiesValidators`
- [ ] `ExamsValidators`
- [ ] `SpecialCoursesValidators`

---

### Fase 4: Migrar Datos Existentes (2-3 días)

#### 4.1 Script de Migración
```typescript
// backend/scripts/migrate-to-academic-activities.ts

1. Para cada enrollment existente:
   - Crear academic_activity (type: ENROLLMENT)
   - Mover datos a enrollment (nueva tabla)
   - Mantener enrollment original (marcar como migrado)

2. Para enrollments con esExamenDiagnostico = true:
   - Crear academic_activity (type: EXAM)
   - Crear exam (examType: DIAGNOSTICO)
   - Mover datos específicos

3. Para enrollments con tipoInscripcion = CURSO_INGLES:
   - Crear academic_activity (type: SPECIAL_COURSE)
   - Crear special_course (courseType: INGLES)
   - Mover datos específicos
```

#### 4.2 Validación de Migración
- [ ] Contar registros antes y después
- [ ] Verificar integridad referencial
- [ ] Comparar datos críticos
- [ ] Validar relaciones

---

### Fase 5: Actualizar Endpoints API (3-4 días)

#### 5.1 Nuevos Endpoints
```
POST   /api/academic-activities/exams
POST   /api/academic-activities/special-courses
POST   /api/academic-activities/enrollments
GET    /api/academic-activities/:id
GET    /api/academic-activities/student/:studentId
PUT    /api/academic-activities/:id/status
```

#### 5.2 Endpoints Específicos
```
POST   /api/academic-activities/exams/:id/result
POST   /api/academic-activities/special-courses/:id/payment
PUT    /api/academic-activities/special-courses/:id/approve-payment
```

#### 5.3 Mantener Endpoints Antiguos (Deprecated)
- [ ] Marcar como deprecated
- [ ] Agregar warnings en logs
- [ ] Redirigir a nuevos endpoints cuando sea posible

---

### Fase 6: Actualizar Frontend (4-5 días)

#### 6.1 Tipos TypeScript
- [ ] Crear `AcademicActivity` type
- [ ] Crear `Exam` type
- [ ] Crear `SpecialCourse` type
- [ ] Actualizar tipos existentes

#### 6.2 Servicios API
- [ ] `academicActivitiesApi`
- [ ] `examsApi`
- [ ] `specialCoursesApi`

#### 6.3 Componentes
- [ ] Actualizar formularios
- [ ] Actualizar listas
- [ ] Actualizar dashboards
- [ ] Crear nuevos componentes si es necesario

---

### Fase 7: Testing (3-4 días)

#### 7.1 Tests Unitarios
- [ ] Tests para AcademicActivitiesService
- [ ] Tests para ExamsService
- [ ] Tests para SpecialCoursesService
- [ ] Tests para validadores

#### 7.2 Tests de Integración
- [ ] Flujo completo de examen
- [ ] Flujo completo de curso especial
- [ ] Flujo completo de materia regular
- [ ] Migración de datos

#### 7.3 Tests E2E
- [ ] Solicitar examen (estudiante)
- [ ] Aprobar pago (admin)
- [ ] Procesar resultado (maestro)
- [ ] Ver estado (estudiante)

---

### Fase 8: Despliegue y Monitoreo (2-3 días)

#### 8.1 Pre-despliegue
- [ ] Backup de base de datos
- [ ] Revisar logs
- [ ] Verificar migraciones
- [ ] Documentar rollback

#### 8.2 Despliegue
- [ ] Ejecutar migraciones
- [ ] Ejecutar script de migración de datos
- [ ] Verificar integridad
- [ ] Activar nuevos endpoints

#### 8.3 Post-despliegue
- [ ] Monitorear errores
- [ ] Verificar performance
- [ ] Revisar logs
- [ ] Ajustar si es necesario

---

### Fase 9: Deprecación y Limpieza (1-2 semanas después)

#### 9.1 Deprecar Código Viejo
- [ ] Marcar endpoints antiguos como deprecated
- [ ] Agregar fecha de eliminación
- [ ] Notificar a usuarios

#### 9.2 Eliminar Código
- [ ] Eliminar endpoints deprecated
- [ ] Eliminar servicios no usados
- [ ] Limpiar código muerto

#### 9.3 Limpiar Base de Datos
- [ ] Eliminar campos obsoletos de `enrollments`
- [ ] Eliminar índices no usados
- [ ] Optimizar tablas

---

## 🔄 Estrategia de Migración de Datos

### Opción A: Migración Completa (Recomendada)

```typescript
async function migrateAllEnrollments() {
  const enrollments = await prisma.enrollments.findMany({
    where: { deletedAt: null },
    include: { students: true, groups: true },
  });

  for (const enrollment of enrollments) {
    await prisma.$transaction(async (tx) => {
      // 1. Determinar tipo de actividad
      let activityType: ActivityType;
      let specificData: any = {};

      if (enrollment.esExamenDiagnostico) {
        activityType = 'EXAM';
        specificData = {
          examType: 'DIAGNOSTICO',
          nivelIngles: enrollment.nivelIngles,
          resultado: enrollment.calificacionFinal || enrollment.calificacion,
        };
      } else if (enrollment.tipoInscripcion === 'CURSO_INGLES') {
        activityType = 'SPECIAL_COURSE';
        specificData = {
          courseType: 'INGLES',
          nivelIngles: enrollment.nivelIngles,
          requierePago: enrollment.requierePago,
          pagoAprobado: enrollment.pagoAprobado,
          montoPago: enrollment.montoPago,
        };
      } else {
        activityType = 'ENROLLMENT';
        specificData = {
          groupId: enrollment.groupId,
          calificacion: enrollment.calificacion,
          // ... otros campos
        };
      }

      // 2. Crear academic_activity
      const activity = await tx.academic_activities.create({
        data: {
          studentId: enrollment.studentId,
          activityType,
          codigo: enrollment.codigo,
          estatus: enrollment.estatus,
          fechaInscripcion: enrollment.fechaInscripcion,
          fechaBaja: enrollment.fechaBaja,
          observaciones: enrollment.observaciones,
        },
      });

      // 3. Crear tabla específica
      if (activityType === 'EXAM') {
        await tx.exams.create({
          data: {
            activityId: activity.id,
            ...specificData,
          },
        });
      } else if (activityType === 'SPECIAL_COURSE') {
        await tx.special_courses.create({
          data: {
            activityId: activity.id,
            ...specificData,
          },
        });
      } else {
        await tx.enrollments.create({
          data: {
            activityId: activity.id,
            ...specificData,
          },
        });
      }

      // 4. Marcar enrollment original como migrado
      await tx.enrollments.update({
        where: { id: enrollment.id },
        data: {
          observaciones: `Migrado a academic_activities: ${activity.id}`,
        },
      });
    });
  }
}
```

### Opción B: Migración Gradual

1. Nuevos registros → nueva estructura
2. Actualizar registros existentes cuando se modifiquen
3. Script de migración en background para el resto

---

## ✅ Checklist de Validación

### Pre-Migración
- [ ] Backup completo de base de datos
- [ ] Documentación actualizada
- [ ] Tests pasando
- [ ] Código revisado

### Durante Migración
- [ ] Verificar cada paso
- [ ] Logs detallados
- [ ] Poder hacer rollback en cualquier momento

### Post-Migración
- [ ] Conteo de registros correcto
- [ ] Integridad referencial OK
- [ ] Endpoints funcionando
- [ ] Frontend funcionando
- [ ] Performance aceptable

---

## 🚨 Plan de Rollback

Si algo sale mal:

1. **Detener migración inmediatamente**
2. **Restaurar backup de base de datos**
3. **Revertir código a versión anterior**
4. **Analizar qué salió mal**
5. **Corregir y reintentar**

---

## 📊 Métricas de Éxito

1. **Integridad**: 100% de datos migrados correctamente
2. **Performance**: Queries no más lentas que antes
3. **Funcionalidad**: Todos los flujos funcionando
4. **Código**: Menos complejidad, más mantenible
5. **Escalabilidad**: Fácil agregar nuevos tipos

---

## 💡 Mejores Prácticas a Seguir

1. **Versionar migraciones**: Usar nombres descriptivos
2. **Transacciones**: Usar transacciones para operaciones atómicas
3. **Logging**: Registrar cada paso importante
4. **Validación**: Validar antes y después de cada paso
5. **Testing**: Probar en ambiente de desarrollo primero
6. **Documentación**: Documentar cada cambio
7. **Comunicación**: Notificar a equipo sobre cambios

---

## 🎯 Timeline Estimado

| Fase | Duración | Dependencias |
|------|----------|--------------|
| Fase 1: Preparación | 1-2 días | - |
| Fase 2: Crear Tablas | 2-3 días | Fase 1 |
| Fase 3: Servicios | 3-4 días | Fase 2 |
| Fase 4: Migrar Datos | 2-3 días | Fase 3 |
| Fase 5: API | 3-4 días | Fase 3 |
| Fase 6: Frontend | 4-5 días | Fase 5 |
| Fase 7: Testing | 3-4 días | Fase 6 |
| Fase 8: Despliegue | 2-3 días | Fase 7 |
| Fase 9: Limpieza | 1-2 semanas | Fase 8 |

**Total estimado: 3-4 semanas**

---

## 📝 Notas Importantes

1. **No romper producción**: Mantener compatibilidad durante migración
2. **Testing exhaustivo**: Probar cada fase antes de continuar
3. **Comunicación**: Mantener al equipo informado
4. **Documentación**: Documentar cada decisión
5. **Flexibilidad**: Ajustar plan según necesidades



