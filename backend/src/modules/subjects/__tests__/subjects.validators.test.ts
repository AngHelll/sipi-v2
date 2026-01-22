// Tests for SubjectValidators
import { SubjectValidators } from '../subjects.validators';
import { EntityValidators } from '../../../shared/validators/entity.validators';
import prisma from '../../../config/database';

// Mock Prisma
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    subjects: {
      findUnique: jest.fn(),
    },
  },
}));

// Mock EntityValidators
jest.mock('../../../shared/validators/entity.validators', () => ({
  EntityValidators: {
    validateSubjectExists: jest.fn(),
  },
}));

describe('SubjectValidators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateClaveUnique', () => {
    it('should pass when clave does not exist', async () => {
      (prisma.subjects.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        SubjectValidators.validateClaveUnique('MAT101')
      ).resolves.not.toThrow();
    });

    it('should throw when clave already exists', async () => {
      (prisma.subjects.findUnique as jest.Mock).mockResolvedValue({
        id: 'subject-1',
        clave: 'MAT101',
      });

      await expect(
        SubjectValidators.validateClaveUnique('MAT101')
      ).rejects.toThrow('Clave already exists');
    });
  });

  describe('validateSubjectExists', () => {
    it('should delegate to EntityValidators.validateSubjectExists', async () => {
      (EntityValidators.validateSubjectExists as jest.Mock).mockResolvedValue({
        id: 'subject-1',
      });

      await SubjectValidators.validateSubjectExists('subject-1');

      expect(EntityValidators.validateSubjectExists).toHaveBeenCalledWith('subject-1');
      expect(EntityValidators.validateSubjectExists).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateSubjectCanBeDeleted', () => {
    it('should pass when subject exists and has no groups', async () => {
      (prisma.subjects.findUnique as jest.Mock).mockResolvedValue({
        id: 'subject-1',
        nombre: 'Matemáticas',
        clave: 'MAT101',
        groups: [],
      });

      await expect(
        SubjectValidators.validateSubjectCanBeDeleted('subject-1')
      ).resolves.not.toThrow();
    });

    it('should throw when subject not found', async () => {
      (prisma.subjects.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        SubjectValidators.validateSubjectCanBeDeleted('invalid-id')
      ).rejects.toThrow('Subject not found');
    });

    it('should throw when subject has groups', async () => {
      (prisma.subjects.findUnique as jest.Mock).mockResolvedValue({
        id: 'subject-1',
        nombre: 'Matemáticas',
        clave: 'MAT101',
        groups: [{ id: 'group-1' }, { id: 'group-2' }],
      });

      await expect(
        SubjectValidators.validateSubjectCanBeDeleted('subject-1')
      ).rejects.toThrow('Cannot delete subject: Matemáticas (MAT101). Subject has 2 group(s)');
    });
  });
});

