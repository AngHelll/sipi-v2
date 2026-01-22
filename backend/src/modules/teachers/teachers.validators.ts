// Teacher validators - Business rules validations
import prisma from '../../config/database';
import { EntityValidators } from '../../shared/validators/entity.validators';

/**
 * TeacherValidators
 * 
 * Contains all business rule validations for teachers.
 * Each validator is a static method that can be tested independently.
 * 
 * Uses shared validators from EntityValidators for common validations.
 */
export class TeacherValidators {
  /**
   * Validate that username doesn't already exist
   * Uses shared EntityValidators.validateUsernameUnique
   * 
   * @param username - Username to validate
   * @throws Error if username already exists
   */
  static async validateUsernameUnique(username: string): Promise<void> {
    return EntityValidators.validateUsernameUnique(username);
  }

  /**
   * Validate that teacher exists
   * Uses shared EntityValidators.validateTeacherExists
   * 
   * @param teacherId - ID of the teacher to validate
   * @throws Error if teacher not found
   */
  static async validateTeacherExists(teacherId: string): Promise<void> {
    await EntityValidators.validateTeacherExists(teacherId);
  }

  /**
   * Validate that teacher can be deleted (no groups assigned)
   * 
   * @param teacherId - ID of the teacher to validate
   * @throws Error if teacher has groups assigned
   */
  static async validateTeacherCanBeDeleted(teacherId: string): Promise<void> {
    const teacher = await prisma.teachers.findUnique({
      where: { id: teacherId },
      include: {
        groups: {
          select: { id: true },
        },
      },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    if (teacher.groups.length > 0) {
      throw new Error(
        `Cannot delete teacher: ${teacher.nombre} ${teacher.apellidoPaterno}. Teacher has ${teacher.groups.length} group(s) assigned. Please reassign or delete groups first.`
      );
    }
  }
}

