// Enrollment validators - Business rules validations
// All validations are extracted from enrollments.service.ts for better organization and testability
import prisma from '../../config/database';
import { UpdateEnrollmentDto } from './enrollments.dtos';
import { EntityValidators } from '../../shared/validators/entity.validators';

/**
 * EnrollmentValidators
 * 
 * Contains all business rule validations (RB-XXX) for enrollments.
 * Each validator is a static method that can be tested independently.
 * 
 * Benefits:
 * - Single Responsibility: Each validator has one clear purpose
 * - Testability: Can test each rule in isolation
 * - Reusability: Can be used in different contexts
 * - Maintainability: Easy to find and modify rules
 */
export class EnrollmentValidators {
  /**
   * RB-001: Validate that student exists and is active
   * 
   * Business Rule: No se puede inscribir un estudiante con estatus INACTIVO o EGRESADO
   * 
   * @param studentId - ID of the student to validate
   * @throws Error if student not found or not active
   */
  static async validateStudentActive(studentId: string): Promise<void> {
    // Use shared validator to check if student exists
    const student = await EntityValidators.validateStudentExists(studentId);

    // Additional business rule: student must be active
    if (student.estatus === 'INACTIVO' || student.estatus === 'EGRESADO') {
      throw new Error(`No se puede inscribir un estudiante con estatus ${student.estatus}`);
    }
  }

  /**
   * RB-002: Validate that group exists and is available
   * 
   * Business Rule: No se puede inscribir en un grupo con estatus CERRADO, CANCELADO o FINALIZADO
   * 
   * @param groupId - ID of the group to validate
   * @returns The group object if valid
   * @throws Error if group not found or not available
   */
  static async validateGroupAvailable(groupId: string) {
    // Use shared validator to check if group exists
    const group = await EntityValidators.validateGroupExists(groupId);

    // Additional business rule: group must be available
    if (group.estatus === 'CERRADO' || group.estatus === 'CANCELADO' || group.estatus === 'FINALIZADO') {
      throw new Error(`No se puede inscribir en un grupo con estatus ${group.estatus}`);
    }

    return group;
  }

  /**
   * RB-006: Validate group capacity
   * 
   * Business Rule: No se puede inscribir en un grupo lleno (cupoActual >= cupoMaximo)
   * 
   * @param groupId - ID of the group to validate
   * @throws Error if group is full
   */
  static async validateGroupCapacity(groupId: string): Promise<void> {
    // Use shared validator to check if group exists
    const group = await EntityValidators.validateGroupExists(groupId);

    // Additional business rule: group must have capacity
    if (group.cupoActual >= group.cupoMaximo) {
      throw new Error('Grupo lleno. No hay cupos disponibles');
    }
  }

  /**
   * RB-003: Validate that enrollment doesn't already exist
   * 
   * Business Rule: Un estudiante no puede estar inscrito dos veces en el mismo grupo
   * 
   * @param studentId - ID of the student
   * @param groupId - ID of the group
   * @throws Error if enrollment already exists
   */
  static async validateNoDuplicate(studentId: string, groupId: string): Promise<void> {
    const existingEnrollment = await prisma.enrollments.findUnique({
      where: {
        studentId_groupId: {
          studentId,
          groupId,
        },
      },
    });

    if (existingEnrollment) {
      throw new Error('Student is already enrolled in this group');
    }
  }

  /**
   * RB-007: Validate capacity of new group when changing enrollment
   * 
   * Business Rule: Al cambiar de grupo, el nuevo grupo debe tener cupos disponibles
   * 
   * @param groupId - ID of the new group
   * @throws Error if new group is full
   */
  static async validateNewGroupCapacity(groupId: string): Promise<void> {
    // Use shared validator to check if group exists
    const newGroup = await EntityValidators.validateGroupExists(groupId);

    // Additional business rule: new group must have capacity
    if (newGroup.cupoActual >= newGroup.cupoMaximo) {
      throw new Error('El nuevo grupo está lleno. No hay cupos disponibles');
    }
  }

  /**
   * RB-023: Validate that group can be changed based on enrollment status
   * 
   * Business Rule: Solo se puede cambiar de grupo si el estatus es INSCRITO o EN_CURSO
   * 
   * @param currentStatus - Current enrollment status
   * @throws Error if status doesn't allow group change
   */
  static validateGroupChangeAllowed(currentStatus: string): void {
    if (currentStatus !== 'INSCRITO' && currentStatus !== 'EN_CURSO') {
      throw new Error('Solo se puede cambiar de grupo si el estatus es INSCRITO o EN_CURSO');
    }
  }

  /**
   * RB-021: Validate state transition
   * 
   * Business Rule: Solo se permiten transiciones de estado válidas
   * 
   * @param currentStatus - Current enrollment status
   * @param newStatus - New enrollment status
   * @throws Error if transition is not allowed
   */
  static validateStatusTransition(currentStatus: string, newStatus: string): void {
    const validTransitions: Record<string, string[]> = {
      'INSCRITO': ['EN_CURSO', 'BAJA', 'CANCELADO'],
      'EN_CURSO': ['BAJA', 'APROBADO', 'REPROBADO'],
      'BAJA': ['EN_CURSO'], // Only with special authorization
      'APROBADO': [], // Final state
      'REPROBADO': [], // Final state
      'CANCELADO': [], // Final state
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw new Error(`Transición inválida: no se puede cambiar de ${currentStatus} a ${newStatus}`);
    }
  }

  /**
   * RB-020: Validate editable fields based on enrollment status
   * 
   * Business Rule: 
   * - APROBADO/REPROBADO: Solo observaciones editables
   * - BAJA: Solo observaciones y fechaBaja editables
   * - CANCELADO: Solo observaciones editables
   * 
   * @param currentStatus - Current enrollment status
   * @param data - Update data to validate
   * @throws Error if trying to edit restricted fields
   */
  static validateEditableFields(
    currentStatus: string,
    data: UpdateEnrollmentDto
  ): void {
    if (currentStatus === 'APROBADO' || currentStatus === 'REPROBADO') {
      // Only observaciones can be edited for finalized enrollments
      const restrictedFields = ['studentId', 'groupId', 'tipoInscripcion', 'estatus'];
      for (const field of restrictedFields) {
        if (data[field as keyof UpdateEnrollmentDto] !== undefined) {
          throw new Error(`No se pueden editar campos críticos cuando el estatus es ${currentStatus}`);
        }
      }
    } else if (currentStatus === 'BAJA') {
      // Only observaciones and fechaBaja can be edited
      if (data.studentId !== undefined || data.groupId !== undefined || data.tipoInscripcion !== undefined) {
        throw new Error('Solo se pueden editar observaciones y fecha de baja cuando el estatus es BAJA');
      }
    } else if (currentStatus === 'CANCELADO') {
      // Only observaciones can be edited
      if (data.studentId !== undefined || data.groupId !== undefined || 
          data.tipoInscripcion !== undefined || data.estatus !== undefined) {
        throw new Error('Solo se pueden editar observaciones cuando el estatus es CANCELADO');
      }
    }
  }

  /**
   * Validate grade range (0-100)
   * 
   * @param grade - Grade value to validate
   * @param fieldName - Name of the field for error message
   * @throws Error if grade is out of range
   */
  static validateGradeRange(grade: number | null | undefined, fieldName: string = 'Calificacion'): void {
    if (grade !== undefined && grade !== null) {
      if (grade < 0 || grade > 100) {
        throw new Error(`${fieldName} must be between 0 and 100`);
      }
    }
  }

  /**
   * RB-036: Validate that studentId cannot be changed when editing
   *
   * Business Rule: No se puede cambiar el estudiante de una inscripción existente.
   * Los estudiantes se gestionan de forma independiente y cambiar el estudiante
   * de una inscripción podría causar inconsistencias en el historial académico.
   *
   * @param newStudentId - The new studentId being set (undefined means not provided)
   * @param existingStudentId - The current studentId of the enrollment
   * @throws Error if attempting to change studentId
   */
  static validateStudentIdCannotChange(newStudentId: string | undefined, existingStudentId: string): void {
    if (newStudentId !== undefined && newStudentId !== existingStudentId) {
      throw new Error('No se puede cambiar el estudiante de una inscripción. Los estudiantes se gestionan de forma independiente.');
    }
  }
}

/**
 * EnrollmentCalculators
 * 
 * Contains business logic for automatic calculations (RB-014, RB-015, RB-016)
 * These are separated from validators because they transform data, not just validate it.
 */
export class EnrollmentCalculators {
  /**
   * RB-014: Auto-calculate aprobado based on calificacionFinal
   * 
   * Business Rule: Si calificacionFinal >= 70, aprobado = true automáticamente
   * 
   * @param calificacionFinal - Final grade
   * @param aprobado - Current aprobado value (optional)
   * @returns Calculated aprobado value
   */
  static calculateAprobado(
    calificacionFinal: number | undefined,
    aprobado: boolean | undefined
  ): boolean | undefined {
    if (calificacionFinal !== undefined && aprobado === undefined) {
      // Auto-suggest aprobado based on final grade
      return calificacionFinal >= 70;
    }
    return aprobado;
  }

  /**
   * RB-014: Check consistency between calificacionFinal and aprobado
   * 
   * Logs warnings if there's inconsistency but doesn't throw error
   * (allows manual override)
   * 
   * @param enrollmentId - Enrollment ID for logging
   * @param calificacionFinal - Final grade
   * @param aprobado - Aprobado value
   */
  static checkAprobadoConsistency(
    enrollmentId: string,
    calificacionFinal: number | undefined,
    aprobado: boolean | undefined
  ): void {
    if (calificacionFinal !== undefined && aprobado !== undefined) {
      if (calificacionFinal >= 70 && !aprobado) {
        console.warn(`Warning: Enrollment ${enrollmentId} has calificacionFinal >= 70 but aprobado = false`);
      } else if (calificacionFinal < 70 && aprobado) {
        console.warn(`Warning: Enrollment ${enrollmentId} has calificacionFinal < 70 but aprobado = true`);
      }
    }
  }

  /**
   * RB-015: Auto-set fechaAprobacion if aprobado is true
   * 
   * Business Rule: Si aprobado = true, establecer fechaAprobacion automáticamente
   * 
   * @param aprobado - Aprobado value
   * @param fechaAprobacion - Current fechaAprobacion (optional)
   * @returns Calculated fechaAprobacion value
   */
  static calculateFechaAprobacion(
    aprobado: boolean | undefined,
    fechaAprobacion: string | undefined
  ): string | undefined {
    if (aprobado === true && !fechaAprobacion) {
      return new Date().toISOString();
    } else if (aprobado === false) {
      return undefined;
    }
    return fechaAprobacion;
  }

  /**
   * RB-016: Auto-calculate porcentajeAsistencia
   * 
   * Business Rule: porcentajeAsistencia = (asistencias / (asistencias + faltas)) * 100
   * 
   * @param asistencias - Number of attendances
   * @param faltas - Number of absences
   * @param porcentajeAsistencia - Current porcentajeAsistencia (optional, for override)
   * @returns Calculated porcentajeAsistencia or undefined if no classes
   */
  static calculatePorcentajeAsistencia(
    asistencias: number | undefined,
    faltas: number | undefined,
    porcentajeAsistencia: number | undefined
  ): number | undefined {
    // Only calculate if porcentajeAsistencia is not explicitly provided
    if (porcentajeAsistencia === undefined && 
        asistencias !== undefined && 
        faltas !== undefined) {
      const total = asistencias + faltas;
      if (total > 0) {
        return (asistencias / total) * 100;
      }
    }
    return porcentajeAsistencia;
  }
}

