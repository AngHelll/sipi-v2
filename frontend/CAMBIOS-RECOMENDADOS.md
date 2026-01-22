# 🎨 Cambios Recomendados en el Frontend

**Fecha:** 2025-01-21  
**Motivo:** Actualización del schema con nuevas funcionalidades

---

## 📋 Resumen Ejecutivo

Después de implementar las 5 fases de mejoras al schema del backend, se recomiendan los siguientes cambios en el frontend para aprovechar las nuevas funcionalidades. **Los cambios son opcionales pero altamente recomendados** para mejorar la experiencia del usuario.

---

## 🚨 Cambios Necesarios (Alta Prioridad)

### 1. **Actualizar Tipos TypeScript**

**Archivo:** `frontend/src/types/index.ts`

**Problema:** Los tipos no incluyen los nuevos campos agregados en las migraciones.

**Cambios Necesarios:**

```typescript
// Student type - Agregar nuevos campos
export type Student = {
  id: string;
  userId: string;
  matricula: string;
  nombre: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  carrera: string;
  carreraId?: string; // NUEVO - Relación normalizada
  semestre: number;
  estatus: 'ACTIVO' | 'INACTIVO' | 'EGRESADO';
  curp?: string;
  
  // NUEVOS CAMPOS (Fase 1, 4)
  email?: string;
  telefono?: string;
  telefonoEmergencia?: string;
  fechaNacimiento?: string;
  genero?: 'MASCULINO' | 'FEMENINO' | 'OTRO' | 'PREFIERO_NO_DECIR';
  direccion?: string;
  ciudad?: string;
  estado?: string;
  codigoPostal?: string;
  tipoIngreso?: 'NUEVO_INGRESO' | 'REINGRESO' | 'TRANSFERENCIA' | 'EQUIVALENCIA';
  promedioGeneral?: number;
  creditosCursados?: number;
  creditosAprobados?: number;
  beca?: boolean;
  tipoBeca?: string;
};

// Group type - Agregar nuevos campos
export type Group = {
  id: string;
  subjectId: string;
  teacherId: string;
  nombre: string;
  periodo: string;
  
  // NUEVOS CAMPOS (Fase 2)
  codigo?: string; // Código único del grupo
  cupoMaximo?: number;
  cupoMinimo?: number;
  cupoActual?: number;
  horario?: string;
  aula?: string;
  edificio?: string;
  modalidad?: 'PRESENCIAL' | 'VIRTUAL' | 'HIBRIDO' | 'SEMIPRESENCIAL';
  estatus?: 'ABIERTO' | 'CERRADO' | 'CANCELADO' | 'EN_CURSO' | 'FINALIZADO';
  periodoId?: string; // Relación con AcademicPeriod
  
  subject?: Subject;
  teacher?: Teacher;
};

// Enrollment type - Agregar nuevos campos
export type Enrollment = {
  id: string;
  studentId: string;
  groupId: string;
  calificacion?: number;
  
  // NUEVOS CAMPOS (Fase 2)
  codigo?: string;
  fechaInscripcion?: string;
  tipoInscripcion?: 'NORMAL' | 'ESPECIAL' | 'REPETICION' | 'EQUIVALENCIA';
  estatus?: 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'CANCELADO';
  calificacionParcial1?: number;
  calificacionParcial2?: number;
  calificacionParcial3?: number;
  calificacionFinal?: number;
  asistencias?: number;
  faltas?: number;
  retardos?: number;
  porcentajeAsistencia?: number;
  aprobado?: boolean;
  
  student?: Student;
  group?: Group;
};

// NUEVOS TIPOS (Fase 3, 5)
export type Career = {
  id: string;
  codigo: string;
  nombre: string;
  nombreCorto?: string;
  area?: string;
  duracionSemestres: number;
  estatus: string;
};

export type AcademicPeriod = {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'SEMESTRAL' | 'TRIMESTRAL' | 'CUATRIMESTRAL' | 'ANUAL';
  fechaInicio: string;
  fechaFin: string;
  estatus: 'PLANEADO' | 'INSCRIPCIONES' | 'EN_CURSO' | 'FINALIZADO' | 'CERRADO';
};

export type StudentDocument = {
  id: string;
  studentId: string;
  tipo: 'ACTA_NACIMIENTO' | 'CURP' | 'CERTIFICADO_PREPARATORIA' | 'FOTOGRAFIA' | 'COMPROBANTE_DOMICILIO' | 'CARTA_NO_ADECUDO' | 'CERTIFICADO_MEDICO' | 'OTRO';
  nombre: string;
  estatus: 'PENDIENTE' | 'EN_REVISION' | 'APROBADO' | 'RECHAZADO' | 'VENCIDO';
  archivoUrl?: string;
  fechaVencimiento?: string;
};
```

**Impacto:** Alto - Permite usar nuevos campos en componentes

---

### 2. **Mostrar Información de Cupos en Grupos**

**Archivo:** `frontend/src/pages/admin/GroupsListPage.tsx`

**Cambio:** Mostrar cupos disponibles y capacidad en la lista de grupos.

**Ejemplo:**
```tsx
// Agregar columna de cupos
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
  {group.cupoActual || 0} / {group.cupoMaximo || 30}
  {group.cupoActual >= group.cupoMaximo && (
    <span className="ml-2 text-red-600 font-semibold">Lleno</span>
  )}
</td>
```

**Impacto:** Alto - Información crítica para gestión

---

### 3. **Validación de Cupos al Inscribir**

**Archivo:** `frontend/src/pages/admin/EnrollmentFormPage.tsx`

**Cambio:** Mostrar cupos disponibles y validar antes de inscribir.

**Ejemplo:**
```tsx
// Al seleccionar grupo, mostrar cupos
{selectedGroup && (
  <div className="mb-4 p-3 bg-blue-50 rounded">
    <p className="text-sm">
      Cupos disponibles: {selectedGroup.cupoMaximo - (selectedGroup.cupoActual || 0)} / {selectedGroup.cupoMaximo}
    </p>
    {selectedGroup.cupoActual >= selectedGroup.cupoMaximo && (
      <p className="text-red-600 font-semibold mt-1">⚠️ Grupo lleno</p>
    )}
  </div>
)}
```

**Impacto:** Alto - Previene errores de inscripción

---

## ⚠️ Cambios Importantes (Media Prioridad)

### 4. **Agregar Campos de Contacto en Formulario de Estudiantes**

**Archivo:** `frontend/src/pages/admin/StudentFormPage.tsx`

**Cambio:** Agregar campos opcionales para email y teléfono.

**Ejemplo:**
```tsx
// Agregar después de los campos básicos
<FormField
  label="Email"
  name="email"
  type="email"
  value={formData.email || ''}
  onChange={handleChange}
  error={formErrors.email}
  touched={touchedFields.email}
/>

<FormField
  label="Teléfono"
  name="telefono"
  type="tel"
  value={formData.telefono || ''}
  onChange={handleChange}
  error={formErrors.telefono}
  touched={touchedFields.telefono}
/>
```

**Impacto:** Medio - Mejora información de contacto

---

### 5. **Mostrar Información de Modalidad y Horario en Grupos**

**Archivo:** `frontend/src/pages/admin/GroupsListPage.tsx`

**Cambio:** Mostrar modalidad (presencial/virtual/híbrido) y horario.

**Ejemplo:**
```tsx
<td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
  {group.modalidad || 'PRESENCIAL'}
  {group.horario && (
    <div className="text-xs text-gray-400 mt-1">{group.horario}</div>
  )}
</td>
```

**Impacto:** Medio - Información útil para usuarios

---

### 6. **Mostrar Calificaciones Parciales en Inscripciones**

**Archivo:** `frontend/src/pages/student/EnrollmentsListPage.tsx`

**Cambio:** Mostrar calificaciones parciales y final.

**Ejemplo:**
```tsx
{enrollment.calificacionParcial1 && (
  <div className="text-sm">
    Parcial 1: {enrollment.calificacionParcial1}
  </div>
)}
{enrollment.calificacionFinal && (
  <div className="text-sm font-semibold">
    Final: {enrollment.calificacionFinal}
  </div>
)}
```

**Impacto:** Medio - Mejor seguimiento académico

---

### 7. **Mostrar Asistencias en Inscripciones**

**Archivo:** `frontend/src/pages/student/EnrollmentsListPage.tsx`

**Cambio:** Mostrar asistencias, faltas y porcentaje.

**Ejemplo:**
```tsx
{enrollment.asistencias !== undefined && (
  <div className="text-sm">
    Asistencias: {enrollment.asistencias} | 
    Faltas: {enrollment.faltas} | 
    Porcentaje: {enrollment.porcentajeAsistencia || 0}%
  </div>
)}
```

**Impacto:** Medio - Información académica útil

---

## 💡 Cambios Opcionales (Baja Prioridad)

### 8. **Selector de Carreras Normalizado**

**Archivo:** `frontend/src/pages/admin/StudentFormPage.tsx`

**Cambio:** Usar selector de carreras desde API en lugar de texto libre.

**Beneficio:** Consistencia de datos, validación automática

---

### 9. **Selector de Períodos Académicos**

**Archivo:** `frontend/src/pages/admin/GroupFormPage.tsx`

**Cambio:** Usar selector de períodos académicos en lugar de texto libre.

**Beneficio:** Validación y consistencia

---

### 10. **Gestión de Documentos del Estudiante**

**Nuevo Componente:** `frontend/src/pages/student/DocumentsPage.tsx`

**Funcionalidad:**
- Listar documentos del estudiante
- Subir nuevos documentos
- Ver estatus de documentos
- Descargar documentos aprobados

**Impacto:** Bajo - Funcionalidad nueva

---

### 11. **Historial Académico del Estudiante**

**Nuevo Componente:** `frontend/src/pages/student/AcademicHistoryPage.tsx`

**Funcionalidad:**
- Mostrar historial por período
- Mostrar promedio por período
- Mostrar créditos acumulados
- Generar kardex

**Impacto:** Bajo - Funcionalidad nueva

---

### 12. **Filtros Mejorados en Listas**

**Archivos:** Varios componentes de listas

**Cambio:** Agregar filtros por:
- Modalidad de grupo
- Estatus de grupo
- Tipo de inscripción
- Estatus de inscripción
- Carrera normalizada

**Impacto:** Bajo - Mejora búsquedas

---

## 📊 Priorización

### Fase 1 (Inmediata):
1. ✅ Actualizar tipos TypeScript
2. ✅ Mostrar cupos en grupos
3. ✅ Validación de cupos al inscribir

### Fase 2 (Corto Plazo):
4. ✅ Campos de contacto en estudiantes
5. ✅ Información de modalidad/horario
6. ✅ Calificaciones parciales

### Fase 3 (Mediano Plazo):
7. ✅ Asistencias en inscripciones
8. ✅ Selector de carreras
9. ✅ Selector de períodos

### Fase 4 (Largo Plazo):
10. ✅ Gestión de documentos
11. ✅ Historial académico
12. ✅ Filtros mejorados

---

## 🔄 Compatibilidad

### Retrocompatibilidad:
- ✅ Todos los campos nuevos son opcionales
- ✅ El frontend actual seguirá funcionando
- ✅ Los cambios pueden implementarse gradualmente
- ✅ No se rompe funcionalidad existente

### Migración Gradual:
- Los campos nuevos pueden agregarse sin afectar funcionalidad existente
- Se recomienda implementar por fases
- Probar cada cambio antes de continuar

---

## 📝 Notas Técnicas

1. **Tipos TypeScript:** Actualizar primero para evitar errores de compilación

2. **Validación:** Los nuevos campos deben validarse en el frontend antes de enviar

3. **Mensajes de Error:** Actualizar mensajes para incluir validaciones de cupos

4. **UX:** Considerar mostrar información de cupos de forma prominente

5. **Performance:** Los nuevos campos no afectan performance significativamente

---

## 🎯 Recomendaciones

1. **Empezar con tipos TypeScript** - Base para todos los demás cambios
2. **Implementar validación de cupos** - Crítico para evitar errores
3. **Agregar campos gradualmente** - No intentar hacer todo a la vez
4. **Probar exhaustivamente** - Especialmente validaciones de cupos
5. **Documentar cambios** - Para el equipo de desarrollo

---

**Estado:** ✅ Análisis completado - Listo para implementación gradual

