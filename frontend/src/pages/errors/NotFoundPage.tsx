// 404 Not Found page
import { useNavigate } from 'react-router-dom';
import { Layout } from '../../components/layout/Layout';

export const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-9xl font-bold text-gray-300">404</h1>
            <h2 className="text-3xl font-bold text-gray-900 mt-4">
              Página no encontrada
            </h2>
            <p className="text-gray-600 mt-4 text-lg">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate(-1)}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Volver atrás
            </button>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Ir al inicio
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

