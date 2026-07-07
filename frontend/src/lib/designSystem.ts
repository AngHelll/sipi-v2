/**
 * Capa de presentación web — tokens MD3 como clases Tailwind reutilizables.
 * Fuente única para el rediseño: páginas importan `ds.*` en lugar de `gray-*` / `blue-*`.
 *
 * Semántica alineada con móvil (DESIGN-SYSTEM.md § DS-Semántico).
 */
import type { BadgeVariant } from '../components/ui/Badge';

/** Radio de card canónico (12px — paridad móvil `Shape.cardCornerRadius`). */
export const CARD_RADIUS = 'rounded-[12px]';

export const ds = {
  page: {
    shell: 'p-6 space-y-6',
    title: 'text-3xl font-bold font-headline text-on-surface',
    subtitle: 'text-on-surface-variant mt-2',
    sectionTitle: 'text-xl font-semibold font-headline text-on-surface',
    sectionSubtitle: 'text-sm text-on-surface-variant',
    label: 'text-sm font-medium text-on-surface-variant',
    body: 'text-sm text-on-surface-variant',
    meta: 'text-xs text-outline',
  },

  card: {
    base: `bg-surface-container-lowest ${CARD_RADIUS} shadow-soft border border-outline-variant/20`,
    interactive: 'cursor-pointer hover:shadow-medium transition-shadow',
    hero: `bg-gradient-to-br from-primary to-primary-container ${CARD_RADIUS} shadow-soft p-6 text-on-primary`,
    accentBorderL: `${CARD_RADIUS} shadow-soft p-6 border-l-4 border-secondary bg-surface-container-lowest border border-outline-variant/20`,
  },

  btn: {
    primary:
      'px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
    primaryFull:
      'px-4 py-2 bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full flex items-center justify-center gap-2',
    secondary:
      'px-4 py-2 border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container transition-colors disabled:opacity-50',
    link: 'text-sm font-medium text-primary hover:text-primary-container transition-colors',
    dangerLink: 'text-error hover:text-on-error-container disabled:opacity-50 text-sm font-medium',
    dangerOutline:
      'px-4 py-2 text-sm font-medium text-error border border-error/40 rounded-lg hover:bg-error-container disabled:opacity-50',
  },

  semantic: {
    successText: 'text-primary font-medium',
    successTextStrong: 'text-primary font-semibold',
    pendingText: 'text-on-secondary-fixed-variant font-medium',
    errorText: 'text-error font-medium',
    mutedText: 'text-on-surface-variant',
    successIcon: 'text-primary',
    pendingIcon: 'text-secondary',
    errorIcon: 'text-error',
    successBg: 'bg-primary-fixed',
    pendingBg: 'bg-secondary-fixed',
    errorBg: 'bg-error-container',
  },

  banner: {
    error: 'bg-error-container border border-error/30 text-error px-4 py-3 rounded-lg',
    pending: 'bg-secondary-fixed/40 border border-secondary-fixed-dim',
    info: 'bg-primary-fixed/50 border border-primary-fixed-dim',
    neutral: 'bg-surface-container border border-outline-variant',
  },

  alertTone: {
    pago: { dot: 'bg-secondary', text: 'text-on-secondary-container' },
    rechazo: { dot: 'bg-error', text: 'text-error' },
    revision: { dot: 'bg-tertiary-container', text: 'text-on-tertiary-container' },
    espera: { dot: 'bg-outline', text: 'text-on-surface-variant' },
    info: { dot: 'bg-primary-container', text: 'text-on-surface' },
  } as const,

  row: {
    item: 'flex items-start justify-between gap-4 py-4 border-b border-outline-variant last:border-b-0',
    kvLabel: 'text-sm text-on-surface-variant',
    kvValue: 'text-sm font-medium text-on-surface',
  },

  admin: {
    pageShell: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
    pageShellCompact: 'p-6 space-y-6',
    pageTitle: 'text-3xl font-bold font-headline text-on-surface mb-2',
    pageSubtitle: 'text-on-surface-variant',
    panel: `bg-surface-container-lowest ${CARD_RADIUS} shadow-soft border border-outline-variant`,
    filterPanel: `bg-surface-container-lowest ${CARD_RADIUS} shadow-soft border border-outline-variant p-4 mb-6`,
    waitlistBanner: 'bg-tertiary-fixed/40 border border-tertiary-fixed-dim rounded-lg p-4',
    waitlistTitle: 'font-semibold text-on-tertiary-fixed-variant',
    waitlistHint: 'text-sm text-on-surface-variant mt-2',
    errorBox: 'bg-error-container border border-error/30 text-error px-4 py-3 rounded-lg',
    tableWrap: `bg-surface-container-lowest ${CARD_RADIUS} shadow-soft border border-outline-variant overflow-hidden`,
    table: 'min-w-full divide-y divide-outline-variant',
    thead: 'bg-surface-container-low',
    th: 'px-6 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider',
    thSortable:
      'px-6 py-3 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider cursor-pointer hover:bg-surface-container',
    tbody: 'bg-surface-container-lowest divide-y divide-outline-variant',
    trHover: 'hover:bg-surface-container-low transition-colors',
    td: 'px-6 py-4 whitespace-nowrap text-sm text-on-surface',
    tdStrong: 'text-sm font-medium text-on-surface',
    tdMuted: 'text-sm text-on-surface-variant',
    tdMeta: 'text-on-surface-variant text-xs',
    actionLink: 'text-primary hover:text-primary-container font-medium',
    actionLinkSuccess: 'text-primary font-medium hover:text-primary-container transition-colors',
    actionLinkDanger: 'text-error font-medium hover:text-on-error-container transition-colors',
    btnSmPrimary: 'px-3 py-1.5 text-sm bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors',
    btnSmSecondary:
      'px-3 py-1.5 text-sm border border-outline-variant text-on-surface rounded-lg hover:bg-surface-container transition-colors',
    btnSmSuccess: 'px-3 py-1 text-sm bg-primary text-on-primary rounded-lg hover:bg-primary-container transition-colors',
    btnSmDanger: 'px-3 py-1 text-sm bg-error text-on-error rounded-lg hover:opacity-90 transition-colors',
    btnSmAssign: 'px-3 py-1 text-sm bg-secondary text-on-secondary rounded-lg hover:bg-secondary-container transition-colors',
    clearFiltersLink: 'text-sm text-primary hover:text-primary-container font-medium',
    paginationText: 'text-sm text-on-surface-variant',
    paginationBtn:
      'px-4 py-2 border border-outline-variant rounded-lg text-on-surface hover:bg-surface-container disabled:opacity-50 disabled:cursor-not-allowed',
    paginationFooter:
      'bg-surface-container-lowest px-4 py-3 flex items-center justify-between border-t border-outline-variant sm:px-6',
    paginationPageActive: 'z-10 bg-primary-fixed border-primary text-primary',
    paginationPageIdle:
      'bg-surface-container-lowest border-outline-variant text-on-surface-variant hover:bg-surface-container',
    modalOverlay: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50',
    modal: `bg-surface-container-lowest ${CARD_RADIUS} shadow-xl p-6 max-w-md w-full mx-4`,
    modalTitle: 'text-xl font-semibold text-on-surface mb-4',
    modalBody: 'text-sm text-on-surface-variant mb-4',
    modalWarning: 'mb-4 rounded-lg border border-secondary-fixed-dim bg-secondary-fixed/40 p-3 text-sm text-on-secondary-fixed-variant',
    modalActions: 'flex justify-end gap-3 mt-6',
    btnCancel:
      'px-4 py-2 text-sm font-medium text-on-surface-variant bg-surface-container rounded-lg hover:bg-surface-container-high transition-colors',
    sortIconIdle: 'text-outline',
    sortIconActive: 'text-primary',
    input:
      'w-full px-3 py-2 border border-outline-variant rounded-lg bg-surface-container-lowest text-on-surface focus:ring-2 focus:ring-primary-container focus:border-primary-container',
    filterLabel: 'block text-sm font-medium text-on-surface-variant mb-1',
    detailShell: 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8',
    detailSection: `bg-surface-container-lowest ${CARD_RADIUS} shadow-soft border border-outline-variant/20 p-6 mb-6`,
    detailSectionHeader: 'flex items-center justify-between mb-6',
    kvGrid: 'grid grid-cols-1 md:grid-cols-2 gap-6',
    kvGridCompact: 'grid grid-cols-1 md:grid-cols-2 gap-4',
    kvLabel: 'text-sm font-medium text-on-surface-variant',
    kvValue: 'text-sm text-on-surface mt-1',
    kvValueLg: 'text-2xl font-bold text-on-surface mt-1',
    noteBanner: 'bg-secondary-fixed/40 border border-secondary-fixed-dim rounded-lg p-4',
    noteBannerText: 'text-sm text-on-secondary-fixed-variant',
    sectionDivider: 'mt-4 pt-4 border-t border-outline-variant',
    checkbox: 'w-4 h-4 text-primary border-outline-variant rounded focus:ring-primary-container',
    checkboxLabel: 'text-sm text-on-surface',
    formSectionTitle: 'text-xl font-semibold font-headline text-on-surface mb-4 border-b border-outline-variant pb-2',
    formSectionTitleSpaced: 'text-xl font-semibold font-headline text-on-surface mb-4 border-b border-outline-variant pb-2 mt-6',
    formPanelInfo: 'rounded-lg border p-3 bg-primary-fixed/50 border-primary-fixed-dim',
    formPanelInfoLg: 'md:col-span-2 rounded-lg border p-4 bg-primary-fixed/50 border-primary-fixed-dim',
    formPanelWarning: 'rounded-lg p-4 bg-secondary-fixed/40 border border-secondary-fixed-dim',
    formPanelWarningLg: 'md:col-span-2 rounded-lg p-4 bg-secondary-fixed/40 border border-secondary-fixed-dim',
    formPanelError: 'rounded-lg p-3 bg-error-container border border-error/30',
    formPanelErrorLg: 'md:col-span-2 rounded-lg p-3 bg-error-container border border-error/30',
    formActions: 'flex flex-col sm:flex-row gap-3 sm:gap-4 justify-end mt-6',
  },
} as const;

/** Alias histórico — páginas alumno / inglés. */
export const studentPage = {
  title: `${ds.page.title} mb-2`,
  subtitle: ds.page.subtitle,
  backLink: 'flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-4 transition-colors',
  label: ds.page.label,
  body: ds.page.body,
  sectionTitle: ds.page.sectionTitle,
  itemRow: ds.row.item,
  meta: ds.page.meta,
};

export const btnPrimary = ds.btn.primary;
export const btnPrimaryFull = ds.btn.primaryFull;
export const btnSecondary = ds.btn.secondary;
export const btnDangerLink = ds.btn.dangerLink;
export const btnDangerOutline = ds.btn.dangerOutline;

export const alertBanner = {
  error: 'bg-error-container border border-error/30',
  pending: ds.banner.pending,
  info: ds.banner.info,
  neutral: ds.banner.neutral,
};

export function englishActivityStatusBadge(estatus: string): { variant: BadgeVariant; label: string } {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    INSCRITO: { variant: 'info', label: 'Inscrito' },
    EN_CURSO: { variant: 'warning', label: 'En curso' },
    APROBADO: { variant: 'success', label: 'Aprobado' },
    REPROBADO: { variant: 'error', label: 'Reprobado' },
    EVALUADO: { variant: 'info', label: 'Evaluado' },
    PENDIENTE_PAGO: { variant: 'warning', label: 'Pendiente de pago' },
    PAGO_PENDIENTE_APROBACION: { variant: 'info', label: 'Pago en revisión' },
    PAGO_APROBADO: { variant: 'success', label: 'Pago aprobado' },
    CANCELADO: { variant: 'default', label: 'Cancelado' },
    LISTA_ESPERA: { variant: 'warning', label: 'En lista de espera' },
  };
  if (map[estatus]) return map[estatus];
  const label = estatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { variant: 'default', label };
}

export function examPeriodStatusBadge(estatus: string): { variant: BadgeVariant; label: string } {
  const map: Record<string, { variant: BadgeVariant; label: string }> = {
    PLANEADO: { variant: 'default', label: 'Planeado' },
    ABIERTO: { variant: 'success', label: 'Abierto' },
    CERRADO: { variant: 'error', label: 'Cerrado' },
    EN_PROCESO: { variant: 'info', label: 'En proceso' },
    FINALIZADO: { variant: 'info', label: 'Finalizado' },
  };
  if (map[estatus]) return map[estatus];
  const label = estatus.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return { variant: 'default', label };
}

export function gradeTextColor(grade: number | null): string {
  if (grade === null) return ds.semantic.mutedText;
  if (grade >= 70) return ds.semantic.successTextStrong;
  if (grade >= 60) return ds.semantic.pendingText;
  return ds.semantic.errorText;
}

/** Color de calificación para tablas admin/maestro (≥70 / 60–69 / <60). */
export function gradeToneClass(grade: number | null | undefined): string {
  if (grade == null) return ds.semantic.mutedText;
  if (grade >= 70) return ds.semantic.successTextStrong;
  if (grade >= 60) return ds.semantic.pendingText;
  return ds.semantic.errorText;
}
