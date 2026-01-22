// Tests for StudentValidators
import { StudentValidators } from '../students.validators';
import { EntityValidators } from '../../../shared/validators/entity.validators';
import prisma from '../../../config/database';

// Mock Prisma
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    students: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock EntityValidators
jest.mock('../../../shared/validators/entity.validators', () => ({
  EntityValidators: {
    validateUsernameUnique: jest.fn(),
    validateStudentExists: jest.fn(),
  },
}));

describe('StudentValidators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUsernameUnique', () => {
    it('should delegate to EntityValidators.validateUsernameUnique', async () => {
      (EntityValidators.validateUsernameUnique as jest.Mock).mockResolvedValue(undefined);

      await StudentValidators.validateUsernameUnique('testuser');

      expect(EntityValidators.validateUsernameUnique).toHaveBeenCalledWith('testuser');
      expect(EntityValidators.validateUsernameUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateMatriculaUnique', () => {
    it('should pass when matricula does not exist', async () => {
      (prisma.students.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        StudentValidators.validateMatriculaUnique('STU001')
      ).resolves.not.toThrow();
    });

    it('should throw when matricula already exists', async () => {
      (prisma.students.findUnique as jest.Mock).mockResolvedValue({
        id: 'student-1',
        matricula: 'STU001',
      });

      await expect(
        StudentValidators.validateMatriculaUnique('STU001')
      ).rejects.toThrow('Matrícula already exists');
    });
  });

  describe('validateStudentExists', () => {
    it('should delegate to EntityValidators.validateStudentExists', async () => {
      (EntityValidators.validateStudentExists as jest.Mock).mockResolvedValue({
        id: 'student-1',
      });

      await StudentValidators.validateStudentExists('student-1');

      expect(EntityValidators.validateStudentExists).toHaveBeenCalledWith('student-1');
      expect(EntityValidators.validateStudentExists).toHaveBeenCalledTimes(1);
    });
  });
});

