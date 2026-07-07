// Student dashboard — identidad + resumen de inglés (contrato §4.2 web)
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
} from '../../lib/englishAlerts';

interface StudentDashboardStats {
  student: Student | null;
}

type EnglishStatusData = Awaited<ReturnType<typeof examsApi.getStudentEnglishStatusV2>>;

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

  if (!stats) {
    return (
      <Layout>
        <div className={ds.page.shell}>
          <div className={`${ds.banner.error} px-4 py-3 rounded-lg`}>
            Error al cargar los datos del dashboard
          </div>
        </div>
      </Layout>
    );
  }

  const englishAlerts = english ? buildEnglishAlerts(english) : [];
  const englishActionCount = pendingEnglishActionCount(englishAlerts);
  const englishRequirementMet = english?.cumpleRequisitoIngles ?? false;

  return (
    <Layout>
      <div className={ds.page.shell}>
        <div>
          <h1 className={ds.page.title}>Panel del Estudiante</h1>
          <p className={ds.page.subtitle}>
            {stats.student && (
              <>
                Bienvenido,{' '}
                <span className="font-semibold text-on-surface">
                  {stats.student.nombre} {stats.student.apellidoPaterno}
                </span>
              </>
            )}
          </p>
        </div>

        {stats.student && (
          <div className={ds.card.hero}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <HeroField label="Matrícula" value={stats.student.matricula} />
              <HeroField label="Carrera" value={stats.student.carrera} />
              <HeroField label="Semestre" value={String(stats.student.semestre)} />
              <HeroField label="Estatus" value={stats.student.estatus} />
            </div>
            {(stats.student.promedioGeneral !== undefined ||
              stats.student.promedioIngles !== undefined) && (
              <div className="mt-6 pt-6 border-t border-on-primary/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.student.promedioGeneral !== undefined && (
                    <HeroField
                      label="Promedio General"
                      value={stats.student.promedioGeneral.toFixed(2)}
                      large
                    />
                  )}
                  {stats.student.promedioIngles !== undefined && (
                    <HeroField
                      label="Promedio Inglés"
                      value={stats.student.promedioIngles.toFixed(2)}
                      large
                    />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {english && (
          <div className={ds.card.accentBorderL}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`${ds.semantic.pendingBg} p-2 rounded-lg`}>
                  <Icon name="book" size={22} className={ds.semantic.pendingIcon} />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-semibold text-on-surface">Mi Inglés</h2>
                    <Badge variant={englishActionCount > 0 ? 'warning' : 'success'}>
                      {englishStatusChipLabel(englishActionCount)}
                    </Badge>
                  </div>
                  <p className={`${ds.page.meta} mt-0.5`}>
                    Requisito de graduación:{' '}
                    <span className={englishRequirementMet ? ds.semantic.successText : ds.semantic.errorText}>
                      {englishRequirementMet ? 'Cumplido' : 'Pendiente'}
                    </span>
                    {english.nivelInglesActual
                      ? ` · Nivel actual ${english.nivelInglesActual}`
                      : ' · Sin nivel definido'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate('/student/english/status')}
                className={`shrink-0 ${ds.btn.link}`}
              >
                Ver mi inglés →
              </button>
            </div>

            {englishAlerts.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {englishAlerts.map((alert, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <span
                      className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${ds.alertTone[alert.tone].dot}`}
                    />
                    <span className={ds.alertTone[alert.tone].text}>{alert.text}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={`mt-4 ${ds.page.body}`}>
                No tienes acciones de inglés pendientes por ahora.
              </p>
            )}
          </div>
        )}

        {english && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Nivel de inglés actual"
              value={english.nivelInglesActual ? `Nivel ${english.nivelInglesActual}` : 'No definido'}
              icon="book"
              valueClass={ds.semantic.successIcon}
              onClick={() => navigate('/student/english/status')}
            />
            <StatCard
              title="Niveles completados"
              value={`${english.progress.completed}/${english.progress.totalLevels}`}
              icon="award"
              valueClass="text-tertiary"
              onClick={() => navigate('/student/english/status')}
            />
            <StatCard
              title="Requisito de inglés"
              value={english.cumpleRequisitoIngles ? 'Cumplido' : 'Pendiente'}
              icon={english.cumpleRequisitoIngles ? 'check-circle' : 'x-circle'}
              valueClass={
                english.cumpleRequisitoIngles ? ds.semantic.successTextStrong : ds.semantic.errorText
              }
              onClick={() => navigate('/student/english/status')}
            />
          </div>
        )}

        <div className={`${ds.card.base} p-6`}>
          <h2 className={`${ds.page.sectionTitle} mb-4`}>Accesos Rápidos</h2>
          <QuickAction
            title="Mi Inglés"
            description="Consulta tu progreso y solicita exámenes o cursos"
            icon="book"
            onClick={() => navigate('/student/english/status')}
          />
        </div>
      </div>
    </Layout>
  );
};

const HeroField = ({
  label,
  value,
  large,
}: {
  label: string;
  value: string;
  large?: boolean;
}) => (
  <div>
    <p className="text-sm opacity-90">{label}</p>
    <p className={large ? 'text-2xl font-bold' : 'text-xl font-bold'}>{value}</p>
  </div>
);

const StatCard = ({
  title,
  value,
  icon,
  valueClass,
  onClick,
}: {
  title: string;
  value: number | string;
  icon: IconName;
  valueClass: string;
  onClick?: () => void;
}) => (
  <div
    onClick={onClick}
    className={`${ds.card.base} p-6 ${onClick ? ds.card.interactive : ''}`}
    role={onClick ? 'button' : undefined}
    tabIndex={onClick ? 0 : undefined}
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
    <div className="flex items-center justify-between">
      <div>
        <p className={ds.page.label}>{title}</p>
        <p className={`text-3xl font-bold mt-2 ${valueClass}`}>{value}</p>
      </div>
      <div className={`${valueClass} bg-current/10 p-3 rounded-full`}>
        <Icon name={icon} size={28} className={valueClass} />
      </div>
    </div>
  </div>
);

const QuickAction = ({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: IconName;
  onClick: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className="flex items-center gap-4 p-4 bg-surface hover:bg-surface-container rounded-[12px] transition-colors text-left border border-outline-variant/20 w-full"
  >
    <div className="bg-primary p-3 rounded-lg text-on-primary">
      <Icon name={icon} size={24} />
    </div>
    <div>
      <p className="font-semibold text-on-surface">{title}</p>
      <p className={ds.page.body}>{description}</p>
    </div>
  </button>
);
