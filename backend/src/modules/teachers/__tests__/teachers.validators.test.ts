// Tests for TeacherValidators
import { TeacherValidators } from '../teachers.validators';
import { EntityValidators } from '../../../shared/validators/entity.validators';
import prisma from '../../../config/database';

// Mock Prisma
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    teachers: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock EntityValidators
jest.mock('../../../shared/validators/entity.validators', () => ({
  EntityValidators: {
    validateUsernameUnique: jest.fn(),
    validateTeacherExists: jest.fn(),
  },
}));

describe('TeacherValidators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUsernameUnique', () => {
    it('should delegate to EntityValidators.validateUsernameUnique', async () => {
      (EntityValidators.validateUsernameUnique as jest.Mock).mockResolvedValue(undefined);

      await TeacherValidators.validateUsernameUnique('testuser');

      expect(EntityValidators.validateUsernameUnique).toHaveBeenCalledWith('testuser');
      expect(EntityValidators.validateUsernameUnique).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateTeacherExists', () => {
    it('should delegate to EntityValidators.validateTeacherExists', async () => {
      (EntityValidators.validateTeacherExists as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
      });

      await TeacherValidators.validateTeacherExists('teacher-1');

      expect(EntityValidators.validateTeacherExists).toHaveBeenCalledWith('teacher-1');
      expect(EntityValidators.validateTeacherExists).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateTeacherCanBeDeleted', () => {
    it('should pass when teacher exists and has no groups', async () => {
      (prisma.teachers.findUnique as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
        nombre: 'Profesor',
        apellidoPaterno: 'Test',
        groups: [],
      });

      await expect(
        TeacherValidators.validateTeacherCanBeDeleted('teacher-1')
      ).resolves.not.toThrow();
    });

    it('should throw when teacher not found', async () => {
      (prisma.teachers.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        TeacherValidators.validateTeacherCanBeDeleted('invalid-id')
      ).rejects.toThrow('Teacher not found');
    });

    it('should throw when teacher has groups', async () => {
      (prisma.teachers.findUnique as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
        nombre: 'Profesor',
        apellidoPaterno: 'Test',
        groups: [{ id: 'group-1' }, { id: 'group-2' }],
      });

      await expect(
        TeacherValidators.validateTeacherCanBeDeleted('teacher-1')
      ).rejects.toThrow('Cannot delete teacher: Profesor Test. Teacher has 2 group(s) assigned');
    });
  });
});

