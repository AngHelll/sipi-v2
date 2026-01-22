// Subject validators - Business rules validations
import prisma from '../../config/database';
import { EntityValidators } from '../../shared/validators/entity.validators';

/**
 * SubjectValidators
 * 
 * Contains all business rule validations for subjects.
 * Each validator is a static method that can be tested independently.
 * 
 * Uses shared validators from EntityValidators for common validations.
 */
export class SubjectValidators {
  /**
   * Validate that clave doesn't already exist
   * 
   * @param clave - Clave to validate
   * @throws Error if clave already exists
   */
  static async validateClaveUnique(clave: string): Promise<void> {
    const existingSubject = await prisma.subjects.findUnique({
      where: { clave },
    });

    if (existingSubject) {
      throw new Error('Clave already exists');
    }
  }

  /**
   * Validate that subject exists
   * Uses shared EntityValidators.validateSubjectExists
   * 
   * @param subjectId - ID of the subject to validate
   * @throws Error if subject not found
   */
  static async validateSubjectExists(subjectId: string): Promise<void> {
    await EntityValidators.validateSubjectExists(subjectId);
  }

  /**
   * Validate that subject can be deleted (no groups assigned)
   * 
   * @param subjectId - ID of the subject to validate
   * @throws Error if subject has groups assigned
   */
  static async validateSubjectCanBeDeleted(subjectId: string): Promise<void> {
    const subject = await prisma.subjects.findUnique({
      where: { id: subjectId },
      include: {
        groups: {
          select: { id: true },
        },
      },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    if (subject.groups.length > 0) {
      throw new Error(
        `Cannot delete subject: ${subject.nombre} (${subject.clave}). Subject has ${subject.groups.length} group(s). Please delete or reassign groups first.`
      );
    }
  }
}

