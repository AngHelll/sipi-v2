// Shared entity validators - Common validations used across multiple modules
import prisma from '../../config/database';

/**
 * EntityValidators
 * 
 * Contains shared validators for common entity operations.
 * These validators are used across multiple modules to avoid code duplication.
 * 
 * Benefits:
 * - DRY (Don't Repeat Yourself)
 * - Consistent validation logic
 * - Single source of truth
 * - Easy to maintain and update
 */
export class EntityValidators {
  /**
   * Validate that username doesn't already exist
   * Used by: Students, Teachers
   * 
   * @param username - Username to validate
   * @throws Error if username already exists
   */
  static async validateUsernameUnique(username: string): Promise<void> {
    const existingUser = await prisma.users.findUnique({
      where: { username },
    });

    if (existingUser) {
      throw new Error('Username already exists');
    }
  }

  /**
   * Validate that student exists
   * Used by: Enrollments, Students
   * 
   * @param studentId - ID of the student to validate
   * @returns The student object if found
   * @throws Error if student not found
   */
  static async validateStudentExists(studentId: string) {
    const student = await prisma.students.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  /**
   * Validate that teacher exists
   * Used by: Groups, Teachers, Enrollments (indirectly)
   * 
   * @param teacherId - ID of the teacher to validate
   * @returns The teacher object if found
   * @throws Error if teacher not found
   */
  static async validateTeacherExists(teacherId: string) {
    const teacher = await prisma.teachers.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    return teacher;
  }

  /**
   * Validate that subject exists
   * Used by: Groups, Subjects
   * 
   * @param subjectId - ID of the subject to validate
   * @returns The subject object if found
   * @throws Error if subject not found
   */
  static async validateSubjectExists(subjectId: string) {
    const subject = await prisma.subjects.findUnique({
      where: { id: subjectId },
    });

    if (!subject) {
      throw new Error('Subject not found');
    }

    return subject;
  }

  /**
   * Validate that group exists
   * Used by: Enrollments, Groups
   * 
   * @param groupId - ID of the group to validate
   * @returns The group object if found
   * @throws Error if group not found
   */
  static async validateGroupExists(groupId: string) {
    const group = await prisma.groups.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      throw new Error('Group not found');
    }

    return group;
  }
}




