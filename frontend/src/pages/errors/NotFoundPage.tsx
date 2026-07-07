// 404 Not Found page — sin Layout (evita dependencia de AuthProvider)
import { useNavigate } from 'react-router-dom';
import { ds } from '../../lib/designSystem';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-margin-mobile">
      <div className="max-w-2xl mx-auto text-center">
        <div className={`${ds.card.base} p-8 sm:p-12`}>
          <p className="font-display-lg text-display-lg text-outline-variant leading-none">404</p>
          <h1 className="font-headline text-headline-lg text-on-surface mt-4">
            Página no encontrada
          </h1>
          <p className={`${ds.page.subtitle} mt-4 text-body-lg max-w-md mx-auto`}>
            Lo sentimos, la página que buscas no existe o ha sido movida.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <button type="button" onClick={() => navigate(-1)} className={ds.btn.secondary}>
              Volver atrás
            </button>
            <button type="button" onClick={() => navigate('/')} className={ds.btn.primary}>
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
