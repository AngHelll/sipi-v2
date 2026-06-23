// Tests for GroupValidators
import { GroupValidators } from '../groups.validators';
import { EntityValidators } from '../../../shared/validators/entity.validators';

// Mock EntityValidators
jest.mock('../../../shared/validators/entity.validators');

describe('GroupValidators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateSubjectExists', () => {
    it('should delegate to EntityValidators.validateSubjectExists', async () => {
      (EntityValidators.validateSubjectExists as jest.Mock).mockResolvedValue({
        id: 'subject-1',
      });

      await GroupValidators.validateSubjectExists('subject-1');

      expect(EntityValidators.validateSubjectExists).toHaveBeenCalledWith('subject-1');
      expect(EntityValidators.validateSubjectExists).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateTeacherExists', () => {
    it('should delegate to EntityValidators.validateTeacherExists', async () => {
      (EntityValidators.validateTeacherExists as jest.Mock).mockResolvedValue({
        id: 'teacher-1',
      });

      await GroupValidators.validateTeacherExists('teacher-1');

      expect(EntityValidators.validateTeacherExists).toHaveBeenCalledWith('teacher-1');
      expect(EntityValidators.validateTeacherExists).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateGroupExists', () => {
    it('should delegate to EntityValidators.validateGroupExists', async () => {
      (EntityValidators.validateGroupExists as jest.Mock).mockResolvedValue({
        id: 'group-1',
      });

      await GroupValidators.validateGroupExists('group-1');

      expect(EntityValidators.validateGroupExists).toHaveBeenCalledWith('group-1');
      expect(EntityValidators.validateGroupExists).toHaveBeenCalledTimes(1);
    });
  });

  describe('validateEnglishLevel', () => {
    it('does nothing when the group is not an English course', () => {
      expect(() => GroupValidators.validateEnglishLevel(false, null)).not.toThrow();
      expect(() => GroupValidators.validateEnglishLevel(undefined, undefined)).not.toThrow();
    });

    it('throws when an English group has no level', () => {
      expect(() => GroupValidators.validateEnglishLevel(true, null)).toThrow(/nivel asignado/i);
      expect(() => GroupValidators.validateEnglishLevel(true, undefined)).toThrow(/nivel asignado/i);
    });

    it('throws when the level is out of range', () => {
      expect(() => GroupValidators.validateEnglishLevel(true, 0)).toThrow(/entre 1 y 6/i);
      expect(() => GroupValidators.validateEnglishLevel(true, 7)).toThrow(/entre 1 y 6/i);
      expect(() => GroupValidators.validateEnglishLevel(true, 2.5)).toThrow(/entre 1 y 6/i);
    });

    it('accepts a valid English level', () => {
      for (let nivel = 1; nivel <= 6; nivel++) {
        expect(() => GroupValidators.validateEnglishLevel(true, nivel)).not.toThrow();
      }
    });

    it('tags the validation error with statusCode 400', () => {
      try {
        GroupValidators.validateEnglishLevel(true, null);
        throw new Error('should have thrown');
      } catch (err) {
        expect((err as { statusCode?: number }).statusCode).toBe(400);
      }
    });
  });

  describe('validateEnglishCost', () => {
    it('does nothing when the group is not an English course', () => {
      expect(() => GroupValidators.validateEnglishCost(false, null)).not.toThrow();
      expect(() => GroupValidators.validateEnglishCost(undefined, undefined)).not.toThrow();
    });

    it('throws when an English group has no cost', () => {
      expect(() => GroupValidators.validateEnglishCost(true, null)).toThrow(/costo asignado/i);
      expect(() => GroupValidators.validateEnglishCost(true, undefined)).toThrow(/costo asignado/i);
    });

    it('throws when the cost is zero or negative', () => {
      expect(() => GroupValidators.validateEnglishCost(true, 0)).toThrow(/mayor a 0/i);
      expect(() => GroupValidators.validateEnglishCost(true, -50)).toThrow(/mayor a 0/i);
    });

    it('accepts a positive cost', () => {
      expect(() => GroupValidators.validateEnglishCost(true, 1200)).not.toThrow();
      expect(() => GroupValidators.validateEnglishCost(true, 0.01)).not.toThrow();
    });

    it('tags the validation error with statusCode 400', () => {
      try {
        GroupValidators.validateEnglishCost(true, 0);
        throw new Error('should have thrown');
      } catch (err) {
        expect((err as { statusCode?: number }).statusCode).toBe(400);
      }
    });
  });

  describe('englishGroupAvailability', () => {
    const now = new Date('2026-06-20T12:00:00Z');
    const base = {
      estatus: 'ABIERTO',
      deletedAt: null as Date | null,
      cupoActual: 0,
      cupoMaximo: 30,
      fechaInscripcionInicio: null as Date | null,
      fechaInscripcionFin: null as Date | null,
    };

    it('is available with open status, capacity and no date window', () => {
      expect(GroupValidators.englishGroupAvailability(base, now)).toEqual({
        available: true,
        reason: null,
      });
    });

    it('is unavailable when soft-deleted', () => {
      const result = GroupValidators.englishGroupAvailability({ ...base, deletedAt: now }, now);
      expect(result.available).toBe(false);
    });

    it('is unavailable when status is not ABIERTO (e.g. EN_CURSO)', () => {
      const result = GroupValidators.englishGroupAvailability({ ...base, estatus: 'EN_CURSO' }, now);
      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/no está disponible/i);
    });

    it('is unavailable before the inscription window opens', () => {
      const result = GroupValidators.englishGroupAvailability(
        { ...base, fechaInscripcionInicio: new Date('2026-06-21T00:00:00Z') },
        now
      );
      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/aún no abren/i);
    });

    it('is unavailable after the inscription window closes', () => {
      const result = GroupValidators.englishGroupAvailability(
        { ...base, fechaInscripcionFin: new Date('2026-06-19T00:00:00Z') },
        now
      );
      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/ya cerró/i);
    });

    it('is unavailable when full', () => {
      const result = GroupValidators.englishGroupAvailability(
        { ...base, cupoActual: 30, cupoMaximo: 30 },
        now
      );
      expect(result.available).toBe(false);
      expect(result.reason).toMatch(/cupos/i);
    });
  });
});




