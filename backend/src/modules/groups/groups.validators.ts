// Group validators - Business rules validations
import { EntityValidators } from '../../shared/validators/entity.validators';

/**
 * GroupValidators
 * 
 * Contains all business rule validations for groups.
 * Each validator is a static method that can be tested independently.
 * 
 * Uses shared validators from EntityValidators for common validations.
 */
export class GroupValidators {
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
   * Validate that group exists
   * Uses shared EntityValidators.validateGroupExists
   * 
   * @param groupId - ID of the group to validate
   * @throws Error if group not found
   */
  static async validateGroupExists(groupId: string): Promise<void> {
    await EntityValidators.validateGroupExists(groupId);
  }
}

