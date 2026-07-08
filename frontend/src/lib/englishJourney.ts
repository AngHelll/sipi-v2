/**
 * Reglas de presentación del journey de inglés del alumno — paridad móvil (D5k).
 * El examen activo (`pendingExam`) no se repite en listados de historial/solicitudes.
 */

/** Exámenes para listados (solicitudes/historial), sin el activo en `pendingExam`. */
export function historicalDiagnosticExams<T extends { id: string }>(
  exams: T[],
  pendingExam?: { id: string } | null,
): T[] {
  const pendingId = pendingExam?.id;
  if (!pendingId) return exams;
  return exams.filter((exam) => exam.id !== pendingId);
}
