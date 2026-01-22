// Enrollment form page for creating/editing enrollments with improved validation
import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { enrollmentsApi, studentsApi, groupsApi, specialCoursesApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { FormField, StatusSelector, PageLoader, ButtonLoader } from '../../components/ui';
import type { Student, Group } from '../../types';

export const EnrollmentFormPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const isEdit = !!id;
  const { showToast } = useToast();
  
  // Get groupId from query params if provided (when navigating from group detail)
  const groupIdFromQuery = searchParams.get('groupId');

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(isEdit);
  const [formErrors, setFormErrors] = useState<Record<string, string | null>>({});
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});

  // Options for dropdowns
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  // Form state
  const [formData, setFormData] = useState({
    studentId: '',
    groupId: '',
    calificacion: '',
    // New fields (Phase 2)
    tipoInscripcion: 'NORMAL' as 'NORMAL' | 'ESPECIAL' | 'REPETICION' | 'EQUIVALENCIA',
    estatus: 'INSCRITO' as 'INSCRITO' | 'EN_CURSO' | 'BAJA' | 'APROBADO' | 'REPROBADO' | 'CANCELADO',
    // Partial grades
    calificacionParcial1: '',
    calificacionParcial2: '',
    calificacionParcial3: '',
    calificacionFinal: '',
    calificacionExtra: '',
    // Attendance
    asistencias: 0,
    faltas: 0,
    retardos: 0,
    porcentajeAsistencia: '',
    // Evaluation
    aprobado: false,
    fechaAprobacion: '',
    observaciones: '',
  });

  // Selected group for capacity validation
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [originalEnrollment, setOriginalEnrollment] = useState<{
    studentId: string;
    groupId: string;
    estatus: string;
    tipoInscripcion?: string;
  } | null>(null);
  const [isSpecialCourse, setIsSpecialCourse] = useState(false);

  useEffect(() => {
    fetchOptions();
    if (isEdit && id) {
      fetchEnrollment();
    }
  }, [isEdit, id]);

  // Set groupId from query params if provided
  useEffect(() => {
    if (groupIdFromQuery && !isEdit && groups.length > 0) {
      const groupExists = groups.find(g => g.id === groupIdFromQuery);
      if (groupExists) {
        setFormData(prev => ({ ...prev, groupId: groupIdFromQuery }));
      }
    }
  }, [groupIdFromQuery, groups, isEdit]);

  const fetchOptions = async () => {
    try {
      setLoadingOptions(true);
      const [studentsRes, groupsRes] = await Promise.all([
        studentsApi.getAll({ limit: 100 }),
        groupsApi.getAll({ limit: 100 }),
      ]);
      setStudents(studentsRes.students);
      setGroups(groupsRes.groups);
    } catch (err: any) {
      showToast('Error al cargar las opciones', 'error');
      console.error('Error fetching options:', err);
    } finally {
      setLoadingOptions(false);
    }
  };

  const fetchEnrollment = async () => {
    if (!id) return;

    try {
      setFetching(true);
      const enrollment = await enrollmentsApi.getById(id);

      // Populate form with enrollment data
      setFormData({
        studentId: enrollment.studentId,
        groupId: enrollment.groupId,
        calificacion: enrollment.calificacion?.toString() || '',
        tipoInscripcion: enrollment.tipoInscripcion || 'NORMAL',
        estatus: enrollment.estatus || 'INSCRITO',
        calificacionParcial1: enrollment.calificacionParcial1?.toString() || '',
        calificacionParcial2: enrollment.calificacionParcial2?.toString() || '',
        calificacionParcial3: enrollment.calificacionParcial3?.toString() || '',
        calificacionFinal: enrollment.calificacionFinal?.toString() || '',
        calificacionExtra: enrollment.calificacionExtra?.toString() || '',
        asistencias: enrollment.asistencias || 0,
        faltas: enrollment.faltas || 0,
        retardos: enrollment.retardos || 0,
        porcentajeAsistencia: enrollment.porcentajeAsistencia?.toString() || '',
        aprobado: enrollment.aprobado || false,
        fechaAprobacion: enrollment.fechaAprobacion ? enrollment.fechaAprobacion.split('T')[0] : '',
        observaciones: enrollment.observaciones || '',
      });

      // Set selected group and student for validation
      const selectedGroupData = groups.find(g => g.id === enrollment.groupId);
      if (selectedGroupData) {
        setSelectedGroup(selectedGroupData);
      }
      const selectedStudentData = students.find(s => s.id === enrollment.studentId);
      if (selectedStudentData) {
        setSelectedStudent(selectedStudentData);
      }

      // Store original enrollment data for comparison
      setOriginalEnrollment({
        studentId: enrollment.studentId,
        groupId: enrollment.groupId,
        estatus: enrollment.estatus || 'INSCRITO',
        tipoInscripcion: enrollment.tipoInscripcion,
      });

      // Check if this is a special course (English course)
      const isSpecial = enrollment.tipoInscripcion === 'CURSO_INGLES';
      setIsSpecialCourse(isSpecial);
    } catch (err: any) {
      showToast('Error al cargar la inscripción', 'error');
      console.error('Error fetching enrollment:', err);
      navigate('/admin/enrollments');
    } finally {
      setFetching(false);
    }
  };

  // Validation functions
  const validators = {
    studentId: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El estudiante es requerido';
      return null;
    },
    groupId: (value: string | number): string | null => {
      const str = String(value).trim();
      if (!str) return 'El grupo es requerido';
      return null;
    },
    calificacion: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const num = parseFloat(str);
        if (isNaN(num)) return 'La calificación debe ser un número válido';
        if (num < 0 || num > 100) return 'La calificación debe estar entre 0 y 100';
        // Check decimal places (max 2)
        const decimalPlaces = (str.split('.')[1] || '').length;
        if (decimalPlaces > 2) return 'La calificación no puede tener más de 2 decimales';
      }
      return null;
    },
    calificacionParcial1: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const num = parseFloat(str);
        if (isNaN(num)) return 'La calificación parcial debe ser un número válido';
        if (num < 0 || num > 100) return 'La calificación debe estar entre 0 y 100';
        const decimalPlaces = (str.split('.')[1] || '').length;
        if (decimalPlaces > 2) return 'La calificación no puede tener más de 2 decimales';
      }
      return null;
    },
    calificacionParcial2: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const num = parseFloat(str);
        if (isNaN(num)) return 'La calificación parcial debe ser un número válido';
        if (num < 0 || num > 100) return 'La calificación debe estar entre 0 y 100';
        const decimalPlaces = (str.split('.')[1] || '').length;
        if (decimalPlaces > 2) return 'La calificación no puede tener más de 2 decimales';
      }
      return null;
    },
    calificacionParcial3: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const num = parseFloat(str);
        if (isNaN(num)) return 'La calificación parcial debe ser un número válido';
        if (num < 0 || num > 100) return 'La calificación debe estar entre 0 y 100';
        const decimalPlaces = (str.split('.')[1] || '').length;
        if (decimalPlaces > 2) return 'La calificación no puede tener más de 2 decimales';
      }
      return null;
    },
    calificacionFinal: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const num = parseFloat(str);
        if (isNaN(num)) return 'La calificación final debe ser un número válido';
        if (num < 0 || num > 100) return 'La calificación debe estar entre 0 y 100';
        const decimalPlaces = (str.split('.')[1] || '').length;
        if (decimalPlaces > 2) return 'La calificación no puede tener más de 2 decimales';
      }
      return null;
    },
    calificacionExtra: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const num = parseFloat(str);
        if (isNaN(num)) return 'La calificación extra debe ser un número válido';
        if (num < 0 || num > 100) return 'La calificación debe estar entre 0 y 100';
        const decimalPlaces = (str.split('.')[1] || '').length;
        if (decimalPlaces > 2) return 'La calificación no puede tener más de 2 decimales';
      }
      return null;
    },
    asistencias: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Las asistencias deben ser un número válido';
      if (num < 0) return 'Las asistencias no pueden ser negativas';
      return null;
    },
    faltas: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Las faltas deben ser un número válido';
      if (num < 0) return 'Las faltas no pueden ser negativas';
      return null;
    },
    retardos: (value: string | number): string | null => {
      const num = typeof value === 'number' ? value : parseInt(String(value), 10);
      if (isNaN(num)) return 'Los retardos deben ser un número válido';
      if (num < 0) return 'Los retardos no pueden ser negativos';
      return null;
    },
    porcentajeAsistencia: (value: string | number): string | null => {
      const str = String(value).trim();
      if (str && str.length > 0) {
        const num = parseFloat(str);
        if (isNaN(num)) return 'El porcentaje de asistencia debe ser un número válido';
        if (num < 0 || num > 100) return 'El porcentaje de asistencia debe estar entre 0 y 100';
        const decimalPlaces = (str.split('.')[1] || '').length;
        if (decimalPlaces > 2) return 'El porcentaje no puede tener más de 2 decimales';
      }
      return null;
    },
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    let newValue: string | number | boolean = value;
    
    // Handle number fields
    if (name === 'asistencias' || name === 'faltas' || name === 'retardos') {
      newValue = parseInt(value, 10) || 0;
    } else if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    }
    
    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: newValue,
      };

      // Calculate attendance percentage automatically
      if (name === 'asistencias' || name === 'faltas') {
        const asistencias = name === 'asistencias' ? (newValue as number) : prev.asistencias;
        const faltas = name === 'faltas' ? (newValue as number) : prev.faltas;
        const total = asistencias + faltas;
        if (total > 0) {
          const porcentaje = (asistencias / total) * 100;
          updated.porcentajeAsistencia = porcentaje.toFixed(2);
        } else {
          updated.porcentajeAsistencia = '';
        }
      }

      // RB-011: Calculate final grade from partial grades automatically
      if (name === 'calificacionParcial1' || name === 'calificacionParcial2' || name === 'calificacionParcial3') {
        const p1 = name === 'calificacionParcial1' ? parseFloat(String(newValue)) || 0 : parseFloat(String(prev.calificacionParcial1)) || 0;
        const p2 = name === 'calificacionParcial2' ? parseFloat(String(newValue)) || 0 : parseFloat(String(prev.calificacionParcial2)) || 0;
        const p3 = name === 'calificacionParcial3' ? parseFloat(String(newValue)) || 0 : parseFloat(String(prev.calificacionParcial3)) || 0;
        
        const grades = [p1, p2, p3].filter(g => g > 0);
        if (grades.length > 0) {
          const promedio = grades.reduce((sum, g) => sum + g, 0) / grades.length;
          updated.calificacionFinal = promedio.toFixed(2);
          
          // RB-014: Auto-suggest aprobado based on final grade
          if (promedio >= 70) {
            updated.aprobado = true;
            if (!updated.fechaAprobacion) {
              updated.fechaAprobacion = new Date().toISOString().split('T')[0];
            }
          } else {
            updated.aprobado = false;
            updated.fechaAprobacion = '';
          }
        } else {
          updated.calificacionFinal = '';
        }
      }

      // RB-014: Auto-suggest aprobado when calificacionFinal is manually changed
      if (name === 'calificacionFinal' && value) {
        const finalGrade = parseFloat(String(value));
        if (!isNaN(finalGrade)) {
          if (finalGrade >= 70) {
            updated.aprobado = true;
            if (!updated.fechaAprobacion) {
              updated.fechaAprobacion = new Date().toISOString().split('T')[0];
            }
          } else {
            updated.aprobado = false;
            updated.fechaAprobacion = '';
          }
        }
      }

      // RB-015: Clear fechaAprobacion if aprobado is false
      if (name === 'aprobado' && !newValue) {
        updated.fechaAprobacion = '';
      }

      return updated;
    });

    // Update selected group when groupId changes
    if (name === 'groupId' && value) {
      const group = groups.find(g => g.id === value);
      setSelectedGroup(group || null);
      
      // RB-007: Validate capacity when changing group (only in edit mode)
      if (isEdit && originalEnrollment && value !== originalEnrollment.groupId) {
        if (group) {
          const cupoActual = group.cupoActual || 0;
          const cupoMaximo = group.cupoMaximo || 30;
          
          if (cupoActual >= cupoMaximo) {
            showToast('El nuevo grupo está lleno. No hay cupos disponibles.', 'error');
            // Revert to original group
            setTimeout(() => {
              setFormData((prev) => ({ ...prev, groupId: originalEnrollment.groupId }));
              const originalGroup = groups.find(g => g.id === originalEnrollment.groupId);
              setSelectedGroup(originalGroup || null);
            }, 100);
            return;
          }
        }
      }
    } else if (name === 'groupId' && !value) {
      setSelectedGroup(null);
    }

    // Update selected student when studentId changes
    if (name === 'studentId' && value) {
      const student = students.find(s => s.id === value);
      setSelectedStudent(student || null);
      
      // RB-001: Validate student is active
      if (student && (student.estatus === 'INACTIVO' || student.estatus === 'EGRESADO')) {
        showToast(`No se puede inscribir un estudiante con estatus ${student.estatus}`, 'error');
        // Revert to original student if editing
        if (isEdit && originalEnrollment) {
          setTimeout(() => {
            setFormData((prev) => ({ ...prev, studentId: originalEnrollment.studentId }));
            const originalStudent = students.find(s => s.id === originalEnrollment.studentId);
            setSelectedStudent(originalStudent || null);
          }, 100);
          return;
        }
      }
    } else if (name === 'studentId' && !value) {
      setSelectedStudent(null);
    }

    setTouchedFields((prev) => ({
      ...prev,
      [name]: true,
    }));

    const validator = validators[name as keyof typeof validators];
    if (validator) {
      const error = validator(value);
      setFormErrors((prev) => ({
        ...prev,
        [name]: error,
      }));
    }
  };

  const validateAllFields = (): boolean => {
    const errors: Record<string, string | null> = {};
    let isValid = true;

    Object.keys(validators).forEach((key) => {
      const validator = validators[key as keyof typeof validators];
      const value = formData[key as keyof typeof formData];
      // Skip validation for boolean values
      if (typeof value === 'boolean') {
        return;
      }
      const error = validator(value as string | number);
      if (error) {
        errors[key] = error;
        isValid = false;
      }
    });

    setFormErrors(errors);
    setTouchedFields(
      Object.keys(validators).reduce((acc, key) => {
        acc[key] = true;
        return acc;
      }, {} as Record<string, boolean>)
    );

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateAllFields()) {
      showToast('Por favor corrige los errores en el formulario', 'error');
      return;
    }

    // RB-001: Validate student is active
    if (selectedStudent && (selectedStudent.estatus === 'INACTIVO' || selectedStudent.estatus === 'EGRESADO')) {
      showToast(`No se puede inscribir un estudiante con estatus ${selectedStudent.estatus}`, 'error');
      return;
    }

    // RB-002: Validate group is available
    if (selectedGroup) {
      if (selectedGroup.estatus === 'CERRADO' || selectedGroup.estatus === 'CANCELADO' || selectedGroup.estatus === 'FINALIZADO') {
        showToast(`No se puede inscribir en un grupo con estatus ${selectedGroup.estatus}`, 'error');
        return;
      }

      // RB-006, RB-007: Validate capacity
      const cupoActual = selectedGroup.cupoActual || 0;
      const cupoMaximo = selectedGroup.cupoMaximo || 30;
      
      // Only validate capacity if creating new enrollment or changing group
      const isChangingGroup = isEdit && originalEnrollment && formData.groupId !== originalEnrollment.groupId;
      if (!isEdit || isChangingGroup) {
        if (cupoActual >= cupoMaximo) {
          showToast('El grupo está lleno. No hay cupos disponibles.', 'error');
          return;
        }
      }
    }

    // RB-021: Validate state transitions
    if (isEdit && originalEnrollment && formData.estatus !== originalEnrollment.estatus) {
      const validTransitions: Record<string, string[]> = {
        'INSCRITO': ['EN_CURSO', 'BAJA', 'CANCELADO'],
        'EN_CURSO': ['BAJA', 'APROBADO', 'REPROBADO'],
        'BAJA': ['EN_CURSO'],
        'APROBADO': [],
        'REPROBADO': [],
        'CANCELADO': [],
      };

      const allowedTransitions = validTransitions[originalEnrollment.estatus] || [];
      if (!allowedTransitions.includes(formData.estatus)) {
        showToast(`Transición inválida: no se puede cambiar de ${originalEnrollment.estatus} a ${formData.estatus}`, 'error');
        return;
      }

      // RB-032: Require confirmation for critical transitions
      if (formData.estatus === 'BAJA' || formData.estatus === 'CANCELADO') {
        const confirmed = window.confirm(
          `¿Estás seguro de cambiar el estatus a ${formData.estatus}? Esta acción puede afectar el historial académico.`
        );
        if (!confirmed) {
          return;
        }
      }
    }

    // RB-023: Validate group change restrictions
    if (isEdit && originalEnrollment && formData.groupId !== originalEnrollment.groupId) {
      if (formData.estatus !== 'INSCRITO' && formData.estatus !== 'EN_CURSO') {
        showToast('Solo se puede cambiar de grupo si el estatus es INSCRITO o EN_CURSO', 'error');
        return;
      }

      const confirmed = window.confirm(
        '¿Estás seguro de cambiar el grupo? Esto moverá la inscripción y actualizará los cupos de ambos grupos.'
      );
      if (!confirmed) {
        return;
      }
    }

    try {
      setLoading(true);

      if (isEdit && id) {
        // Special courses use a different endpoint and have limited fields
        if (isSpecialCourse) {
          // For special courses, only calificacion can be updated via completeSpecialCourse
          if (!formData.calificacion) {
            showToast('La calificación es requerida para cursos de inglés', 'error');
            return;
          }
          await specialCoursesApi.completeCourse(id, {
            calificacion: parseFloat(formData.calificacion),
          });
          showToast('Calificación del curso de inglés actualizada correctamente', 'success');
        } else {
          // Regular enrollment update
          await enrollmentsApi.update(id, {
            studentId: formData.studentId,
            groupId: formData.groupId,
            calificacion: formData.calificacion ? parseFloat(formData.calificacion) : undefined,
            tipoInscripcion: formData.tipoInscripcion,
            estatus: formData.estatus,
            calificacionParcial1: formData.calificacionParcial1 ? parseFloat(formData.calificacionParcial1) : undefined,
            calificacionParcial2: formData.calificacionParcial2 ? parseFloat(formData.calificacionParcial2) : undefined,
            calificacionParcial3: formData.calificacionParcial3 ? parseFloat(formData.calificacionParcial3) : undefined,
            calificacionFinal: formData.calificacionFinal ? parseFloat(formData.calificacionFinal) : undefined,
            calificacionExtra: formData.calificacionExtra ? parseFloat(formData.calificacionExtra) : undefined,
            asistencias: formData.asistencias,
            faltas: formData.faltas,
            retardos: formData.retardos,
            porcentajeAsistencia: formData.porcentajeAsistencia ? parseFloat(formData.porcentajeAsistencia) : undefined,
            aprobado: formData.aprobado,
            fechaAprobacion: formData.fechaAprobacion ? new Date(formData.fechaAprobacion) : undefined,
            observaciones: formData.observaciones || undefined,
          });
          showToast('Inscripción actualizada correctamente', 'success');
        }
      } else {
        await enrollmentsApi.create({
        studentId: formData.studentId,
        groupId: formData.groupId,
        calificacion: formData.calificacion ? parseFloat(formData.calificacion) : undefined,
        // New fields (Phase 2)
        tipoInscripcion: formData.tipoInscripcion,
        estatus: formData.estatus,
        calificacionParcial1: formData.calificacionParcial1 ? parseFloat(formData.calificacionParcial1) : undefined,
        calificacionParcial2: formData.calificacionParcial2 ? parseFloat(formData.calificacionParcial2) : undefined,
        calificacionParcial3: formData.calificacionParcial3 ? parseFloat(formData.calificacionParcial3) : undefined,
        calificacionFinal: formData.calificacionFinal ? parseFloat(formData.calificacionFinal) : undefined,
        calificacionExtra: formData.calificacionExtra ? parseFloat(formData.calificacionExtra) : undefined,
        asistencias: formData.asistencias,
        faltas: formData.faltas,
        retardos: formData.retardos,
        porcentajeAsistencia: formData.porcentajeAsistencia ? parseFloat(formData.porcentajeAsistencia) : undefined,
        aprobado: formData.aprobado || undefined,
        fechaAprobacion: formData.fechaAprobacion ? new Date(formData.fechaAprobacion) : undefined,
        observaciones: formData.observaciones || undefined,
      });

      showToast('Inscripción creada correctamente', 'success');
      }

      setTimeout(() => {
        navigate('/admin/enrollments');
      }, 1000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error ||
        'Error al crear la inscripción';
      showToast(errorMessage, 'error');
      console.error('Error saving enrollment:', err);
    } finally {
      setLoading(false);
    }
  };

  if (fetching || loadingOptions) {
    return (
      <Layout>
        <PageLoader text={isEdit ? "Cargando inscripción..." : "Cargando opciones..."} />
      </Layout>
    );
  }

  const hasErrors = Object.values(formErrors).some((error) => error !== null);

  // RB-020: Determine which fields are disabled based on status
  // RB-036: studentId cannot be changed when editing (students are managed independently)
  const getFieldDisabled = (fieldName: string): boolean => {
    // RB-036: studentId cannot be edited - students are managed independently
    if (fieldName === 'studentId' && isEdit) {
      return true;
    }
    
    const status = formData.estatus;
    
    if (status === 'APROBADO' || status === 'REPROBADO') {
      // Only observaciones can be edited
      return fieldName !== 'observaciones';
    } else if (status === 'BAJA') {
      // Only observaciones and fechaBaja can be edited
      return !['observaciones', 'fechaBaja'].includes(fieldName);
    } else if (status === 'CANCELADO') {
      // Only observaciones can be edited
      return fieldName !== 'observaciones';
    }
    
    // RB-023: Restrict group change if status is not INSCRITO or EN_CURSO
    if (fieldName === 'groupId' && isEdit && originalEnrollment) {
      if (status !== 'INSCRITO' && status !== 'EN_CURSO') {
        return true;
      }
    }
    
    return false;
  };

  // Filter groups based on status (RB-002)
  const availableGroups = groups.filter(group => {
    // Only show groups that are available (not CERRADO, CANCELADO, FINALIZADO)
    return group.estatus !== 'CERRADO' && group.estatus !== 'CANCELADO' && group.estatus !== 'FINALIZADO';
  });

  // Filter students based on status (RB-001)
  const availableStudents = students.filter(student => {
    // Only show active students (not INACTIVO, EGRESADO)
    return student.estatus !== 'INACTIVO' && student.estatus !== 'EGRESADO';
  });

  return (
    <Layout>
      <div className="p-6">
        <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {isEdit ? 'Editar Inscripción' : 'Nueva Inscripción'}
            </h1>
          <p className="text-gray-600 mt-2">
            Inscribe un estudiante en un grupo
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 max-w-2xl border border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              label="Estudiante"
              name="studentId"
              value={formData.studentId}
              onChange={handleChange}
              required
              error={formErrors.studentId}
              touched={touchedFields.studentId}
              validate={validators.studentId}
              disabled={getFieldDisabled('studentId') || isSpecialCourse}
              helpText={isEdit || isSpecialCourse ? "El estudiante no puede ser modificado. Los estudiantes se gestionan de forma independiente." : undefined}
              as="select"
              options={[
                { value: '', label: 'Selecciona un estudiante' },
                ...availableStudents.map((student) => ({
                  value: student.id,
                  label: `${student.matricula} - ${student.nombre} ${student.apellidoPaterno} ${student.apellidoMaterno}${student.estatus !== 'ACTIVO' ? ` (${student.estatus})` : ''}`,
                })),
              ]}
            />
            {selectedStudent && (selectedStudent.estatus === 'INACTIVO' || selectedStudent.estatus === 'EGRESADO') && (
              <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Advertencia: El estudiante seleccionado tiene estatus {selectedStudent.estatus}. 
                  No se recomienda inscribirlo en nuevos grupos.
                </p>
              </div>
            )}

            <FormField
              label="Grupo"
              name="groupId"
              value={formData.groupId}
              onChange={handleChange}
              required
              error={formErrors.groupId}
              touched={touchedFields.groupId}
              validate={validators.groupId}
              disabled={getFieldDisabled('groupId') || isSpecialCourse}
              helpText={isSpecialCourse ? "El grupo no puede ser modificado para cursos de inglés." : undefined}
              as="select"
              options={[
                { value: '', label: 'Selecciona un grupo' },
                ...availableGroups.map((group) => {
                  const isFull = group.cupoActual !== undefined && group.cupoMaximo !== undefined && group.cupoActual >= group.cupoMaximo;
                  const isDisabled = isFull && (!isEdit || (isEdit && originalEnrollment && formData.groupId !== group.id));
                  return {
                    value: group.id,
                    label: `${group.nombre} - ${group.subject?.nombre || 'N/A'} (${group.periodo})${group.cupoActual !== undefined && group.cupoMaximo ? ` [${group.cupoActual}/${group.cupoMaximo}]` : ''}${isFull ? ' [LLENO]' : ''}${group.estatus !== 'ABIERTO' && group.estatus !== 'EN_CURSO' ? ` - ${group.estatus}` : ''}`,
                    disabled: isDisabled,
                  };
                }),
              ]}
            />
            {selectedGroup && (selectedGroup.estatus === 'CERRADO' || selectedGroup.estatus === 'CANCELADO' || selectedGroup.estatus === 'FINALIZADO') && (
              <div className="md:col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-800">
                  ⚠️ Error: El grupo seleccionado tiene estatus {selectedGroup.estatus} y no está disponible para inscripciones.
                </p>
              </div>
            )}
            {isEdit && originalEnrollment && formData.estatus !== 'INSCRITO' && formData.estatus !== 'EN_CURSO' && (
              <div className="md:col-span-2 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  ℹ️ No se puede cambiar de grupo cuando el estatus es {formData.estatus}. 
                  Solo se permite cambiar de grupo si el estatus es INSCRITO o EN_CURSO.
                </p>
              </div>
            )}

            {/* Capacity information */}
            {selectedGroup && (
              <div className={`p-4 rounded-lg border-2 ${
                selectedGroup.cupoActual !== undefined && selectedGroup.cupoMaximo !== undefined && selectedGroup.cupoActual >= selectedGroup.cupoMaximo
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Cupos disponibles
                    </p>
                    <p className={`text-lg font-bold mt-1 ${
                      selectedGroup.cupoActual !== undefined && selectedGroup.cupoMaximo !== undefined && selectedGroup.cupoActual >= selectedGroup.cupoMaximo
                        ? 'text-red-600'
                        : 'text-blue-600'
                    }`}>
                      {(selectedGroup.cupoMaximo || 30) - (selectedGroup.cupoActual || 0)} / {selectedGroup.cupoMaximo || 30}
                    </p>
                  </div>
                  {selectedGroup.cupoActual !== undefined && selectedGroup.cupoMaximo !== undefined && selectedGroup.cupoActual >= selectedGroup.cupoMaximo && (
                    <div className="flex items-center gap-2">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-red-600 font-semibold">Grupo lleno</span>
                    </div>
                  )}
                </div>
                {selectedGroup.modalidad && (
                  <p className="text-xs text-gray-500 mt-2">
                    Modalidad: {selectedGroup.modalidad}
                    {selectedGroup.horario && ` | Horario: ${selectedGroup.horario}`}
                  </p>
                )}
              </div>
            )}

            <FormField
              label="Calificación"
              name="calificacion"
              type="number"
              value={formData.calificacion}
              onChange={handleChange}
              placeholder="0-100"
              min={0}
              max={100}
              step={0.01}
              required={isSpecialCourse}
              error={formErrors.calificacion}
              touched={touchedFields.calificacion}
              validate={validators.calificacion}
              helpText={isSpecialCourse 
                ? "Requerida para cursos de inglés. Máximo 2 decimales." 
                : "Opcional. Puede dejarse vacío y asignarse después. Máximo 2 decimales."}
            />

            {/* Special Course Notice */}
            {isSpecialCourse && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <h3 className="font-semibold text-blue-900 mb-1">Curso de Inglés</h3>
                    <p className="text-sm text-blue-800">
                      Este es un curso especial de inglés. Solo puedes modificar la calificación final.
                      El estatus se actualiza automáticamente según la calificación (≥70 = APROBADO, &lt;70 = REPROBADO).
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Enrollment Information Section - Hidden for special courses */}
            {!isSpecialCourse && (
              <>
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                    Información de Inscripción
                  </h2>
                </div>

                <FormField
                  label="Tipo de Inscripción"
                  name="tipoInscripcion"
                  value={formData.tipoInscripcion}
                  onChange={handleChange}
                  required
                  error={formErrors.tipoInscripcion}
                  touched={touchedFields.tipoInscripcion}
                  disabled={getFieldDisabled('tipoInscripcion')}
                  as="select"
                  options={[
                    { value: 'NORMAL', label: 'NORMAL' },
                    { value: 'ESPECIAL', label: 'ESPECIAL' },
                    { value: 'REPETICION', label: 'REPETICIÓN' },
                    { value: 'EQUIVALENCIA', label: 'EQUIVALENCIA' },
                  ]}
                />

                <StatusSelector
                  type="enrollment"
                  value={formData.estatus}
                  onChange={(value) => {
                    handleChange({
                      target: { name: 'estatus', value },
                    } as React.ChangeEvent<HTMLInputElement>);
                  }}
                  required
                  error={formErrors.estatus}
                  touched={touchedFields.estatus}
                  disabled={getFieldDisabled('estatus') || isSpecialCourse}
                />
              </>
            )}

            {/* Status display for special courses (read-only) */}
            {isSpecialCourse && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estatus
                </label>
                <div className="px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-700">
                  {formData.estatus || 'N/A'}
                  <span className="ml-2 text-xs text-gray-500">
                    (Se actualiza automáticamente al calificar)
                  </span>
                </div>
              </div>
            )}
            {(formData.estatus === 'APROBADO' || formData.estatus === 'REPROBADO' || formData.estatus === 'BAJA' || formData.estatus === 'CANCELADO') && (
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  ℹ️ Estado {formData.estatus}: Solo se pueden editar observaciones{formData.estatus === 'BAJA' ? ' y fecha de baja' : ''}.
                </p>
              </div>
            )}

            {/* Partial Grades Section - Hidden for special courses */}
            {!isSpecialCourse && (
              <>
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                    Calificaciones Parciales
                  </h2>
                </div>
              </>
            )}

            {!isSpecialCourse && (
              <>
                <FormField
                  label="Calificación Parcial 1"
                  name="calificacionParcial1"
                  type="number"
                  value={formData.calificacionParcial1}
                  onChange={handleChange}
                  placeholder="0-100"
                  min={0}
                  max={100}
                  step={0.01}
                  error={formErrors.calificacionParcial1}
                  touched={touchedFields.calificacionParcial1}
                  disabled={getFieldDisabled('calificacionParcial1')}
                />

                <FormField
                  label="Calificación Parcial 2"
                  name="calificacionParcial2"
                  type="number"
                  value={formData.calificacionParcial2}
                  onChange={handleChange}
                  placeholder="0-100"
                  min={0}
                  max={100}
                  step={0.01}
                  error={formErrors.calificacionParcial2}
                  touched={touchedFields.calificacionParcial2}
                  disabled={getFieldDisabled('calificacionParcial2')}
                />

                <FormField
                  label="Calificación Parcial 3"
                  name="calificacionParcial3"
                  type="number"
                  value={formData.calificacionParcial3}
                  onChange={handleChange}
                  placeholder="0-100"
                  min={0}
                  max={100}
                  step={0.01}
                  error={formErrors.calificacionParcial3}
                  touched={touchedFields.calificacionParcial3}
                  disabled={getFieldDisabled('calificacionParcial3')}
                />

                <FormField
                  label="Calificación Final"
                  name="calificacionFinal"
                  type="number"
                  value={formData.calificacionFinal}
                  onChange={handleChange}
                  placeholder="0-100"
                  min={0}
                  max={100}
                  step={0.01}
                  error={formErrors.calificacionFinal}
                  touched={touchedFields.calificacionFinal}
                  disabled={getFieldDisabled('calificacionFinal')}
                  helpText="Se calcula automáticamente como promedio de las calificaciones parciales. Puede editarse manualmente si es necesario."
                />

                <FormField
                  label="Calificación Extra"
                  name="calificacionExtra"
                  type="number"
                  value={formData.calificacionExtra}
                  onChange={handleChange}
                  placeholder="0-100"
                  min={0}
                  max={100}
                  step={0.01}
                  error={formErrors.calificacionExtra}
                  touched={touchedFields.calificacionExtra}
                  disabled={getFieldDisabled('calificacionExtra')}
                />

                {/* Attendance Section */}
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                    Asistencia
                  </h2>
                </div>

                <FormField
                  label="Asistencias"
                  name="asistencias"
                  type="number"
                  value={formData.asistencias}
                  onChange={handleChange}
                  min={0}
                  error={formErrors.asistencias}
                  touched={touchedFields.asistencias}
                  disabled={getFieldDisabled('asistencias')}
                />

                <FormField
                  label="Faltas"
                  name="faltas"
                  type="number"
                  value={formData.faltas}
                  onChange={handleChange}
                  min={0}
                  error={formErrors.faltas}
                  touched={touchedFields.faltas}
                  disabled={getFieldDisabled('faltas')}
                />

                <FormField
                  label="Retardos"
                  name="retardos"
                  type="number"
                  value={formData.retardos}
                  onChange={handleChange}
                  min={0}
                  error={formErrors.retardos}
                  touched={touchedFields.retardos}
                  disabled={getFieldDisabled('retardos')}
                />

                <FormField
                  label="Porcentaje de Asistencia"
                  name="porcentajeAsistencia"
                  type="number"
                  value={formData.porcentajeAsistencia}
                  onChange={handleChange}
                  placeholder="0-100"
                  min={0}
                  max={100}
                  step={0.01}
                  error={formErrors.porcentajeAsistencia}
                  touched={touchedFields.porcentajeAsistencia}
                  disabled={getFieldDisabled('porcentajeAsistencia')}
                  helpText="Se calcula automáticamente a partir de asistencias y faltas. Puede editarse manualmente si es necesario."
                />

                {/* Evaluation Section */}
                <div className="md:col-span-2">
                  <h2 className="text-xl font-semibold text-gray-800 mb-4 border-b pb-2 mt-6">
                    Evaluación
                  </h2>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="aprobado"
                      checked={formData.aprobado}
                      onChange={handleChange}
                      disabled={getFieldDisabled('aprobado')}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span className="text-sm font-medium text-gray-700">¿Aprobado?</span>
                  </label>
                </div>

                {formData.aprobado && (
                  <FormField
                    label="Fecha de Aprobación"
                    name="fechaAprobacion"
                    type="date"
                    value={formData.fechaAprobacion}
                    onChange={handleChange}
                    error={formErrors.fechaAprobacion}
                    touched={touchedFields.fechaAprobacion}
                    disabled={getFieldDisabled('fechaAprobacion')}
                  />
                )}
              </>
            )}

            {/* Evaluation info for special courses (read-only) */}
            {isSpecialCourse && (
              <div className="md:col-span-2">
                <div className="bg-gray-50 border border-gray-300 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Evaluación</h3>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Aprobado:</span> {formData.aprobado ? 'Sí' : 'No'}
                      <span className="ml-2 text-xs text-gray-500">
                        (Se actualiza automáticamente: ≥70 = Aprobado)
                      </span>
                    </div>
                    {formData.fechaAprobacion && (
                      <div>
                        <span className="font-medium">Fecha de Aprobación:</span> {formData.fechaAprobacion}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="md:col-span-2">
              <FormField
                label="Observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={handleChange}
                as="textarea"
                rows={4}
                placeholder="Observaciones adicionales..."
                error={formErrors.observaciones}
                touched={touchedFields.observaciones}
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/admin/groups')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || hasErrors}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <ButtonLoader className="mr-2" />
                  Guardando...
                </>
              ) : (
                'Crear Inscripción'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
