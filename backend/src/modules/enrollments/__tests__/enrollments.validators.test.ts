// Tests for EnrollmentValidators
import { EnrollmentValidators, EnrollmentCalculators } from '../enrollments.validators';
import prisma from '../../../config/database';

// Mock Prisma
jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    students: {
      findUnique: jest.fn(),
    },
    groups: {
      findUnique: jest.fn(),
    },
    enrollments: {
      findUnique: jest.fn(),
    },
  },
}));

describe('EnrollmentValidators', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateStudentActive', () => {
    it('should pass when student exists and is ACTIVO', async () => {
      (prisma.students.findUnique as jest.Mock).mockResolvedValue({
        id: 'student-1',
        estatus: 'ACTIVO',
      });

      await expect(
        EnrollmentValidators.validateStudentActive('student-1')
      ).resolves.not.toThrow();
    });

    it('should throw when student not found', async () => {
      (prisma.students.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        EnrollmentValidators.validateStudentActive('invalid-id')
      ).rejects.toThrow('Student not found');
    });

    it('should throw when student is INACTIVO', async () => {
      (prisma.students.findUnique as jest.Mock).mockResolvedValue({
        id: 'student-1',
        estatus: 'INACTIVO',
      });

      await expect(
        EnrollmentValidators.validateStudentActive('student-1')
      ).rejects.toThrow('No se puede inscribir un estudiante con estatus INACTIVO');
    });

    it('should throw when student is EGRESADO', async () => {
      (prisma.students.findUnique as jest.Mock).mockResolvedValue({
        id: 'student-1',
        estatus: 'EGRESADO',
      });

      await expect(
        EnrollmentValidators.validateStudentActive('student-1')
      ).rejects.toThrow('No se puede inscribir un estudiante con estatus EGRESADO');
    });
  });

  describe('validateGroupAvailable', () => {
    it('should pass when group exists and is ABIERTO', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        estatus: 'ABIERTO',
      });

      const result = await EnrollmentValidators.validateGroupAvailable('group-1');
      expect(result).toBeDefined();
      expect(result.estatus).toBe('ABIERTO');
    });

    it('should pass when group exists and is EN_CURSO', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        estatus: 'EN_CURSO',
      });

      await expect(
        EnrollmentValidators.validateGroupAvailable('group-1')
      ).resolves.toBeDefined();
    });

    it('should throw when group not found', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        EnrollmentValidators.validateGroupAvailable('invalid-id')
      ).rejects.toThrow('Group not found');
    });

    it('should throw when group is CERRADO', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        estatus: 'CERRADO',
      });

      await expect(
        EnrollmentValidators.validateGroupAvailable('group-1')
      ).rejects.toThrow('No se puede inscribir en un grupo con estatus CERRADO');
    });

    it('should throw when group is CANCELADO', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        estatus: 'CANCELADO',
      });

      await expect(
        EnrollmentValidators.validateGroupAvailable('group-1')
      ).rejects.toThrow('No se puede inscribir en un grupo con estatus CANCELADO');
    });

    it('should throw when group is FINALIZADO', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        estatus: 'FINALIZADO',
      });

      await expect(
        EnrollmentValidators.validateGroupAvailable('group-1')
      ).rejects.toThrow('No se puede inscribir en un grupo con estatus FINALIZADO');
    });
  });

  describe('validateGroupCapacity', () => {
    it('should pass when group has available capacity', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        cupoActual: 10,
        cupoMaximo: 30,
      });

      await expect(
        EnrollmentValidators.validateGroupCapacity('group-1')
      ).resolves.not.toThrow();
    });

    it('should throw when group is full', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        cupoActual: 30,
        cupoMaximo: 30,
      });

      await expect(
        EnrollmentValidators.validateGroupCapacity('group-1')
      ).rejects.toThrow('Grupo lleno. No hay cupos disponibles');
    });

    it('should throw when group capacity exceeds maximum', async () => {
      (prisma.groups.findUnique as jest.Mock).mockResolvedValue({
        id: 'group-1',
        cupoActual: 35,
        cupoMaximo: 30,
      });

      await expect(
        EnrollmentValidators.validateGroupCapacity('group-1')
      ).rejects.toThrow('Grupo lleno. No hay cupos disponibles');
    });
  });

  describe('validateNoDuplicate', () => {
    it('should pass when enrollment does not exist', async () => {
      (prisma.enrollments.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        EnrollmentValidators.validateNoDuplicate('student-1', 'group-1')
      ).resolves.not.toThrow();
    });

    it('should throw when enrollment already exists', async () => {
      (prisma.enrollments.findUnique as jest.Mock).mockResolvedValue({
        id: 'enrollment-1',
        studentId: 'student-1',
        groupId: 'group-1',
      });

      await expect(
        EnrollmentValidators.validateNoDuplicate('student-1', 'group-1')
      ).rejects.toThrow('Student is already enrolled in this group');
    });
  });

  describe('validateStatusTransition', () => {
    it('should pass for valid transition INSCRITO -> EN_CURSO', () => {
      expect(() => {
        EnrollmentValidators.validateStatusTransition('INSCRITO', 'EN_CURSO');
      }).not.toThrow();
    });

    it('should pass for valid transition EN_CURSO -> APROBADO', () => {
      expect(() => {
        EnrollmentValidators.validateStatusTransition('EN_CURSO', 'APROBADO');
      }).not.toThrow();
    });

    it('should throw for invalid transition APROBADO -> INSCRITO', () => {
      expect(() => {
        EnrollmentValidators.validateStatusTransition('APROBADO', 'INSCRITO');
      }).toThrow('Transición inválida: no se puede cambiar de APROBADO a INSCRITO');
    });

    it('should throw for invalid transition REPROBADO -> EN_CURSO', () => {
      expect(() => {
        EnrollmentValidators.validateStatusTransition('REPROBADO', 'EN_CURSO');
      }).toThrow('Transición inválida: no se puede cambiar de REPROBADO a EN_CURSO');
    });
  });

  describe('validateGradeRange', () => {
    it('should pass for valid grade (0-100)', () => {
      expect(() => {
        EnrollmentValidators.validateGradeRange(0);
        EnrollmentValidators.validateGradeRange(50);
        EnrollmentValidators.validateGradeRange(100);
      }).not.toThrow();
    });

    it('should throw for grade < 0', () => {
      expect(() => {
        EnrollmentValidators.validateGradeRange(-1);
      }).toThrow('Calificacion must be between 0 and 100');
    });

    it('should throw for grade > 100', () => {
      expect(() => {
        EnrollmentValidators.validateGradeRange(101);
      }).toThrow('Calificacion must be between 0 and 100');
    });

    it('should pass for null or undefined', () => {
      expect(() => {
        EnrollmentValidators.validateGradeRange(null);
        EnrollmentValidators.validateGradeRange(undefined);
      }).not.toThrow();
    });
  });

  describe('validateStudentIdCannotChange (RB-036)', () => {
    it('should pass when studentId is not provided (undefined)', () => {
      expect(() => 
        EnrollmentValidators.validateStudentIdCannotChange(undefined, 'existing-student-id')
      ).not.toThrow();
    });

    it('should pass when studentId matches existing studentId', () => {
      expect(() => 
        EnrollmentValidators.validateStudentIdCannotChange('existing-student-id', 'existing-student-id')
      ).not.toThrow();
    });

    it('should throw when studentId is different from existing studentId', () => {
      expect(() => 
        EnrollmentValidators.validateStudentIdCannotChange('new-student-id', 'existing-student-id')
      ).toThrow('No se puede cambiar el estudiante de una inscripción');
    });

    it('should throw with correct error message', () => {
      expect(() => 
        EnrollmentValidators.validateStudentIdCannotChange('new-student-id', 'existing-student-id')
      ).toThrow('Los estudiantes se gestionan de forma independiente');
    });
  });
});

describe('EnrollmentCalculators', () => {
  describe('calculateAprobado', () => {
    it('should return true when calificacionFinal >= 70', () => {
      const result = EnrollmentCalculators.calculateAprobado(70, undefined);
      expect(result).toBe(true);
    });

    it('should return false when calificacionFinal < 70', () => {
      const result = EnrollmentCalculators.calculateAprobado(69, undefined);
      expect(result).toBe(false);
    });

    it('should return provided aprobado when both are provided', () => {
      const result = EnrollmentCalculators.calculateAprobado(80, false);
      expect(result).toBe(false);
    });

    it('should return undefined when calificacionFinal is undefined', () => {
      const result = EnrollmentCalculators.calculateAprobado(undefined, undefined);
      expect(result).toBeUndefined();
    });
  });

  describe('calculatePorcentajeAsistencia', () => {
    it('should calculate correctly when asistencias and faltas are provided', () => {
      const result = EnrollmentCalculators.calculatePorcentajeAsistencia(8, 2, undefined);
      expect(result).toBe(80); // 8 / (8 + 2) * 100 = 80
    });

    it('should return undefined when total is 0', () => {
      const result = EnrollmentCalculators.calculatePorcentajeAsistencia(0, 0, undefined);
      expect(result).toBeUndefined();
    });

    it('should return provided porcentajeAsistencia when explicitly provided', () => {
      const result = EnrollmentCalculators.calculatePorcentajeAsistencia(8, 2, 75);
      expect(result).toBe(75);
    });
  });

  describe('calculateFechaAprobacion', () => {
    it('should set fechaAprobacion when aprobado is true and fechaAprobacion is undefined', () => {
      const result = EnrollmentCalculators.calculateFechaAprobacion(true, undefined);
      expect(result).toBeDefined();
      expect(new Date(result!).getTime()).toBeCloseTo(new Date().getTime(), -3); // Within 1 second
    });

    it('should return undefined when aprobado is false', () => {
      const result = EnrollmentCalculators.calculateFechaAprobacion(false, '2024-01-01');
      expect(result).toBeUndefined();
    });

    it('should return provided fechaAprobacion when aprobado is true and fechaAprobacion is provided', () => {
      const fecha = '2024-01-01T00:00:00.000Z';
      const result = EnrollmentCalculators.calculateFechaAprobacion(true, fecha);
      expect(result).toBe(fecha);
    });
  });
});

