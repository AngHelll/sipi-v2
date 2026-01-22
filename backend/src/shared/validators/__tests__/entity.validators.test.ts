// Tests for EntityValidators (shared validators)
import { EntityValidators } from '../entity.validators';
import prisma from '../../../config/database';

// Mock Prisma
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    users: {
      findUnique: jest.fn(),
    },
    students: {
      findUnique: jest.fn(),
    },
    teachers: {
      findUnique: jest.fn(),
    },
    subjects: {
      findUnique: jest.fn(),
    },
    groups: {
      findUnique: jest.fn(),
    },
  },
}));

describe('EntityValidators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUsernameUnique', () => {
    it('should pass when username does not exist', async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        EntityValidators.validateUsernameUnique('newuser')
      ).resolves.not.toThrow();
    });

    it('should throw when username already exists', async () => {
      (prisma.users.findUnique as jest.Mock).mockResolvedValue({
        id: 'user-1',
        username: 'existinguser',
      });

      await expect(
        EntityValidators.validateUsernameUnique('existinguser')
      ).rejects.toThrow('Username already exists');
    });
  });

  describe('validateStudentExists', () => {
    it('should return student when student exists', async () => {
      const mockStudent = {
        id: 'student-1',
        matricula: 'STU001',
        nombre: 'Juan',
      };

      (prisma.students.findUnique as jest.Mock).mockResolvedValue(mockStudent);

      const result = await EntityValidators.validateStudentExists('student-1');
      expect(result).toEqual(mockStudent);
    });

    it('should throw when student not found', async () => {
      (prisma.students.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        EntityValidators.validateStudentExists('invalid-id')
      ).rejects.toThrow('Student not found');
    });
  });

  describe('validateTeacherExists', () => {
    it('should return teacher when teacher exists', async () => {
      const mockTeacher = {
        id: 'teacher-1',
        nombre: 'Profesor',
        departamento: 'IT',
      };

      (prisma.teachers.findUnique as jest.Mock).mockResolvedValue(mockTeacher);

      const result = await EntityValidators.validateTeacherExists('teacher-1');
      expect(result).toEqual(mockTeacher);
    });

    it('should throw when teacher not found', async () => {
      (prisma.teachers.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        EntityValidators.validateTeacherExists('invalid-id')
      ).rejects.toThrow('Teacher not found');
    });
  });

  describe('validateSubjectExists', () => {
    it('should return subject when subject exists', async () => {
      const mockSubject = {
        id: 'subject-1',
        clave: 'MAT101',
        nombre: 'Matemáticas',
      };

      (prisma.subjects.findUnique as jest.Mock).mockResolvedValue(mockSubject);

      const result = await EntityValidators.validateSubjectExists('subject-1');
      expect(result).toEqual(mockSubject);
    });

    it('should throw when subject not found', async () => {
      (prisma.subjects.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        EntityValidators.validateSubjectExists('invalid-id')
      ).rejects.toThrow('Subject not found');
    });
  });

  describe('validateGroupExists', () => {
    it('should return group when group exists', async () => {
      const mockGroup = {
        id: 'group-1',
        nombre: 'Grupo A',
        periodo: '2024-1',
      };

      (prisma.groups.findUnique as jest.Mock).mockResolvedValue(mockGroup);

      const result = await EntityValidators.validateGroupExists('group-1');
      expect(result).toEqual(mockGroup);
    });

    it('should throw when group not found', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        EntityValidators.validateGroupExists('invalid-id')
      ).rejects.toThrow('Group not found');
    });
  });
});




