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
});




