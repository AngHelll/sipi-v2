/**
 * Alertas derivadas de `english-status` — misma lógica que móvil (contrato §4.2.1).
 */

export type EnglishAlertTone = 'pago' | 'rechazo' | 'revision' | 'espera' | 'info';

export interface EnglishAlert {
  tone: EnglishAlertTone;
  text: string;
  actionable: boolean;
}

/** Subconjunto mínimo del payload `english-status` para derivar alertas. */
export interface EnglishStatusSnapshot {
  nivelInglesActual?: number | null;
  pendingExam?: unknown;
  cumpleRequisitoIngles?: boolean;
  diagnosticExams: Array<{ estatus: string; pagoAprobado?: boolean | null }>;
  englishCourses: Array<{ estatus: string; pagoAprobado?: boolean | null }>;
}

export function buildEnglishAlerts(e: EnglishStatusSnapshot): EnglishAlert[] {
  const items = [
    ...e.diagnosticExams.map((x) => ({ estatus: x.estatus, pagoAprobado: x.pagoAprobado })),
    ...e.englishCourses.map((x) => ({ estatus: x.estatus, pagoAprobado: x.pagoAprobado })),
  ];

  const pagosPendientes = items.filter(
    (i) => i.estatus === 'PENDIENTE_PAGO' && i.pagoAprobado !== false,
  ).length;
  const pagosRechazados = items.filter(
    (i) => i.estatus === 'PENDIENTE_PAGO' && i.pagoAprobado === false,
  ).length;
  const enRevision = items.filter((i) => i.estatus === 'PAGO_PENDIENTE_APROBACION').length;
  const enEspera = items.filter((i) => i.estatus === 'LISTA_ESPERA').length;
  const sinDiagnostico =
    !e.nivelInglesActual && !e.pendingExam && e.diagnosticExams.length === 0;

  const alerts: EnglishAlert[] = [];

  if (pagosPendientes > 0) {
    alerts.push({
      tone: 'pago',
      actionable: true,
      text: `${pagosPendientes} pago${pagosPendientes > 1 ? 's' : ''} pendiente${pagosPendientes > 1 ? 's' : ''}: lleva tu comprobante a Servicio Estudiantil.`,
    });
  }
  if (pagosRechazados > 0) {
    alerts.push({
      tone: 'rechazo',
      actionable: true,
      text: `${pagosRechazados} pago${pagosRechazados > 1 ? 's' : ''} rechazado${pagosRechazados > 1 ? 's' : ''}: cancela y vuelve a solicitar con el comprobante correcto.`,
    });
  }
  if (sinDiagnostico) {
    alerts.push({
      tone: 'info',
      actionable: true,
      text: 'Aún no presentas tu examen de diagnóstico de inglés.',
    });
  }
  if (enRevision > 0) {
    alerts.push({
      tone: 'revision',
      actionable: false,
      text: `${enRevision} pago${enRevision > 1 ? 's' : ''} en revisión por el administrador.`,
    });
  }
  if (enEspera > 0) {
    alerts.push({
      tone: 'espera',
      actionable: false,
      text: `${enEspera} solicitud${enEspera > 1 ? 'es' : ''} en lista de espera.`,
    });
  }

  return alerts;
}

export function pendingEnglishActionCount(alerts: EnglishAlert[]): number {
  return alerts.filter((a) => a.actionable).length;
}

export function englishStatusChipLabel(actionCount: number): string {
  if (actionCount <= 0) return 'Al día';
  return `${actionCount} acción${actionCount > 1 ? 'es' : ''} pendiente${actionCount > 1 ? 's' : ''}`;
}
