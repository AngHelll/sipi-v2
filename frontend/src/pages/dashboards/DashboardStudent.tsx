// Student dashboard — identidad + resumen de inglés (contrato §4.2 web, layout W4b Stitch)
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';
import { examsApi, studentsApi } from '../../lib/api';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';
import { Badge, PageLoader, Icon } from '../../components/ui';
import type { IconName } from '../../components/ui/Icon';
import type { Student } from '../../types';
import { ds } from '../../lib/designSystem';
import {
  buildEnglishAlerts,
  englishStatusChipLabel,
  pendingEnglishActionCount,
  type EnglishAlert,
  type EnglishAlertTone,
} from '../../lib/englishAlerts';

interface StudentDashboardStats {
  student: Student | null;
}

type EnglishStatusData = Awaited<ReturnType<typeof examsApi.getStudentEnglishStatusV2>>;

const GAUGE_R = 88;
const GAUGE_C = 2 * Math.PI * GAUGE_R;

export const DashboardStudent = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StudentDashboardStats | null>(null);
  const [english, setEnglish] = useState<EnglishStatusData | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
      fetchEnglishStatus();
    }
  }, [user]);

  const fetchEnglishStatus = async () => {
    try {
      const data = await examsApi.getStudentEnglishStatusV2();
      setEnglish(data);
    } catch (err) {
      console.error('Error fetching English status for dashboard:', err);
      setEnglish(null);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const student = (await studentsApi.getMe()) as Student;
      setStats({ student });
    } catch (err) {
      showToast('Error al cargar los datos del dashboard', 'error');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <PageLoader text="Cargando dashboard..." />
      </Layout>
    );
  }

  if (!stats?.student) {
    return (
      <Layout>
        <div className={`${ds.banner.error} px-4 py-3 rounded-lg`}>
          Error al cargar los datos del dashboard
        </div>
      </Layout>
    );
  }

  const student = stats.student;
  const fullName = [student.nombre, student.apellidoPaterno, student.apellidoMaterno]
    .filter(Boolean)
    .join(' ');

  const englishAlerts = english ? buildEnglishAlerts(english) : [];
  const englishActionCount = pendingEnglishActionCount(englishAlerts);
  const englishRequirementMet = english?.cumpleRequisitoIngles ?? false;
  const progressPct = english?.progress.percentage ?? 0;
  const gaugeOffset = GAUGE_C * (1 - progressPct / 100);

  return (
    <Layout>
      <div className="space-y-stack-lg">
        {/* Hero — perfil del alumno (mismos campos, presentación Stitch) */}
        <section className="rounded-3xl overflow-hidden bg-primary-container text-on-primary shadow-metric">
          <div className="p-8 sm:p-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
            <div className="space-y-4 min-w-0">
              <div className="inline-block px-4 py-1 bg-tertiary-fixed text-tertiary rounded-full text-label-sm uppercase tracking-wider">
                Estatus: {student.estatus}
              </div>
              <h1 className="font-display-lg text-headline-lg-mobile sm:text-display-lg text-on-primary leading-tight">
                {fullName}
              </h1>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-on-primary/80 text-body-md">
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">badge</span>
                  {student.matricula}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">school</span>
                  {student.carrera}
                </span>
                <span className="inline-flex items-center gap-2">
                  <span className="material-symbols-outlined text-base">calendar_month</span>
                  Semestre {student.semestre}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          {/* Columna principal */}
          <div className="lg:col-span-8 space-y-gutter">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter">
              {student.promedioGeneral !== undefined && (
                <MetricCard
                  label="Promedio general"
                  value={student.promedioGeneral.toFixed(2)}
                  hint={
                    student.promedioIngles !== undefined
                      ? `Inglés: ${student.promedioIngles.toFixed(2)}`
                      : undefined
                  }
                  icon="star"
                  accent="gold"
                  progress={Math.min(100, (student.promedioGeneral / 10) * 100)}
                />
              )}
              {english && (
                <MetricCard
                  label="Progreso de inglés"
                  value={`${english.progress.completed}/${english.progress.totalLevels}`}
                  hint={`${Math.round(progressPct)}% del requisito`}
                  icon="award"
                  accent="primary"
                  progress={progressPct}
                  onClick={() => navigate('/student/english/status')}
                />
              )}
            </div>

            {english ? (
              <div className={`${ds.card.base} p-6 sm:p-8`}>
                <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="font-headline text-headline-md text-on-surface">Mi inglés</h2>
                      <Badge variant={englishActionCount > 0 ? 'warning' : 'success'}>
                        {englishStatusChipLabel(englishActionCount)}
                      </Badge>
                    </div>
                    <p className={`${ds.page.meta} mt-1`}>
                      Requisito de graduación:{' '}
                      <span
                        className={
                          englishRequirementMet ? ds.semantic.successText : ds.semantic.errorText
                        }
                      >
                        {englishRequirementMet ? 'Cumplido' : 'Pendiente'}
                      </span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/student/english/status')}
                    className={`${ds.btn.link} inline-flex items-center gap-1`}
                  >
                    Ver detalle
                    <span className="material-symbols-outlined text-base">arrow_forward</span>
                  </button>
                </div>

                <div className="flex flex-col md:flex-row items-center gap-10">
                  <EnglishLevelGauge
                    level={english.nivelInglesActual}
                    progressPct={progressPct}
                    offset={gaugeOffset}
                  />

                  <div className="flex-1 w-full space-y-3">
                    <p className="font-label-md text-primary">Avance del requisito</p>
                    <RequirementRow
                      done={englishRequirementMet}
                      label="Requisito de graduación (70%)"
                      meta={englishRequirementMet ? 'Cumplido' : 'Pendiente'}
                    />
                    <RequirementRow
                      done={english.progress.completed >= english.progress.totalLevels}
                      label="Niveles completados"
                      meta={`${english.progress.completed}/${english.progress.totalLevels}`}
                    />
                    {english.nivelInglesActual != null && (
                      <RequirementRow
                        done
                        label="Nivel actual certificado"
                        meta={`Nivel ${english.nivelInglesActual}`}
                      />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={`${ds.card.base} p-6 sm:p-8`}>
                <p className={ds.page.body}>
                  No se pudo cargar el resumen de inglés. Intenta recargar la página o visita{' '}
                  <button
                    type="button"
                    className={ds.btn.link}
                    onClick={() => navigate('/student/english/status')}
                  >
                    Mi inglés
                  </button>
                  .
                </p>
              </div>
            )}
          </div>

          {/* Columna lateral — alertas reales + accesos rápidos existentes */}
          <div className="lg:col-span-4 space-y-gutter">
            {english && (
              <div className={`${ds.card.base} p-6 sm:p-8`}>
                <div className="flex items-center gap-2 mb-6">
                  <span className="material-symbols-outlined text-primary">priority_high</span>
                  <h2 className="font-headline text-headline-md text-on-surface">Pendientes</h2>
                </div>
                {englishAlerts.length > 0 ? (
                  <div className="space-y-4">
                    {englishAlerts.map((alert, i) => (
                      <UpcomingAlertCard
                        key={i}
                        alert={alert}
                        onAction={() => navigate('/student/english/status')}
                      />
                    ))}
                  </div>
                ) : (
                  <p className={ds.page.body}>No tienes acciones de inglés pendientes por ahora.</p>
                )}
              </div>
            )}

            <div className="bg-primary rounded-2xl p-6 sm:p-8 text-on-primary shadow-metric">
              <h2 className="font-headline text-headline-md mb-6">Accesos rápidos</h2>
              <div className="grid grid-cols-2 gap-4">
                <QuickActionTile
                  label="Mi inglés"
                  icon="book"
                  onClick={() => navigate('/student/english/status')}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

function MetricCard({
  label,
  value,
  hint,
  icon,
  accent,
  progress,
  onClick,
}: {
  label: string;
  value: string;
  hint?: string;
  icon: IconName;
  accent: 'gold' | 'primary';
  progress: number;
  onClick?: () => void;
}) {
  const borderClass = accent === 'gold' ? 'border-tertiary-fixed-dim' : 'border-primary';
  const barClass = accent === 'gold' ? 'bg-tertiary-fixed-dim' : 'bg-primary-container';

  return (
    <div
      className={`${ds.card.base} p-6 sm:p-8 border-l-4 ${borderClass} ${onClick ? ds.card.interactive : ''}`}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <p className="text-outline font-label-md">{label}</p>
          <p className="font-headline text-headline-lg text-primary mt-1">{value}</p>
        </div>
        <div className="w-12 h-12 bg-primary-fixed/30 rounded-full flex items-center justify-center shrink-0">
          <Icon name={icon} size={24} className="text-primary" />
        </div>
      </div>
      <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barClass}`}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
      {hint && <p className="mt-4 text-xs text-outline italic">{hint}</p>}
    </div>
  );
}

function EnglishLevelGauge({
  level,
  progressPct,
  offset,
}: {
  level: number | null;
  progressPct: number;
  offset: number;
}) {
  return (
    <div className="relative w-44 h-44 flex items-center justify-center shrink-0">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 192 192" aria-hidden>
        <circle
          className="text-surface-container"
          cx="96"
          cy="96"
          fill="transparent"
          r={GAUGE_R}
          stroke="currentColor"
          strokeWidth="12"
        />
        <circle
          className="text-tertiary-fixed-dim transition-all duration-700"
          cx="96"
          cy="96"
          fill="transparent"
          r={GAUGE_R}
          stroke="currentColor"
          strokeDasharray={GAUGE_C}
          strokeDashoffset={offset}
          strokeLinecap="round"
          strokeWidth="12"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-2">
        <span className="font-display-lg text-headline-lg text-primary leading-none">
          {level != null ? `Nivel ${level}` : '—'}
        </span>
        <span className="text-label-sm uppercase font-bold tracking-widest text-outline mt-1">
          {progressPct >= 100 ? 'Completo' : 'En curso'}
        </span>
      </div>
    </div>
  );
}

function RequirementRow({
  done,
  label,
  meta,
}: {
  done: boolean;
  label: string;
  meta: string;
}) {
  return (
    <div
      className={`flex items-center justify-between p-3 rounded-lg ${
        done ? 'bg-surface-container-low' : 'border border-outline-variant'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`material-symbols-outlined shrink-0 ${done ? 'text-primary' : 'text-outline'}`}
          style={{ fontVariationSettings: done ? "'FILL' 1" : "'FILL' 0" }}
        >
          {done ? 'check_circle' : 'radio_button_unchecked'}
        </span>
        <span className={`text-sm font-medium ${done ? 'text-on-surface' : 'text-outline'}`}>
          {label}
        </span>
      </div>
      <span className="text-xs font-bold text-on-surface-variant shrink-0 ml-2">{meta}</span>
    </div>
  );
}

function alertToneStyles(tone: EnglishAlertTone): {
  panel: string;
  tag: string;
  tagText: string;
} {
  switch (tone) {
    case 'rechazo':
      return {
        panel: 'bg-error-container/30 border border-error/10',
        tag: 'text-on-error-container',
        tagText: 'Urgente',
      };
    case 'pago':
      return {
        panel: 'bg-tertiary-fixed/10 border border-tertiary/10',
        tag: 'text-on-tertiary-container',
        tagText: 'Pago',
      };
    case 'revision':
      return {
        panel: 'bg-secondary-fixed/30 border border-secondary-fixed-dim',
        tag: 'text-on-secondary-fixed-variant',
        tagText: 'Revisión',
      };
    case 'espera':
      return {
        panel: 'bg-surface-container-low border border-outline-variant',
        tag: 'text-on-surface-variant',
        tagText: 'Lista de espera',
      };
    default:
      return {
        panel: 'bg-primary-fixed/40 border border-primary-fixed-dim',
        tag: 'text-on-primary-fixed-variant',
        tagText: 'Información',
      };
  }
}

function UpcomingAlertCard({ alert, onAction }: { alert: EnglishAlert; onAction: () => void }) {
  const styles = alertToneStyles(alert.tone);
  return (
    <div className={`p-4 rounded-xl hover:shadow-medium transition-all ${styles.panel}`}>
      <div className="flex justify-between items-start mb-2 gap-2">
        <span className={`text-xs font-bold uppercase ${styles.tag}`}>{styles.tagText}</span>
      </div>
      <p className="text-sm text-on-surface-variant mb-4">{alert.text}</p>
      {alert.actionable && (
        <button
          type="button"
          onClick={onAction}
          className={`w-full py-2 rounded-lg text-xs font-bold transition-all ${
            alert.tone === 'rechazo'
              ? 'bg-primary-container text-on-primary hover:brightness-110'
              : 'border border-primary text-primary hover:bg-primary hover:text-on-primary'
          }`}
        >
          Ir a Mi inglés
        </button>
      )}
    </div>
  );
}

function QuickActionTile({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="col-span-2 flex flex-col items-center justify-center p-4 rounded-xl bg-on-primary/10 hover:bg-on-primary/20 transition-all gap-2"
    >
      <Icon name={icon} size={28} className="text-on-primary" />
      <span className="text-xs font-medium text-on-primary">{label}</span>
    </button>
  );
}
