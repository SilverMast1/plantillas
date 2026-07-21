import axios from 'axios';
import { handleMockRequest } from './mockBackend';

const apiClient = axios.create({
  baseURL: '',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para inyectar token JWT e Idempotency Key
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('campestre_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (['post', 'put', 'delete'].includes(config.method || '') && !config.headers['Idempotency-Key']) {
      const randHex = Math.random().toString(16).substring(2, 10);
      config.headers['Idempotency-Key'] = `idem-${Date.now()}-${randHex}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta: Si falla la conexión con el servidor (ej: en GitHub Pages sin backend local), usamos el Mock Backend Client-Side
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const isNetworkError = !error.response || error.response.status === 404 || error.code === 'ERR_NETWORK';

    if (isGitHubPages || isNetworkError) {
      try {
        const mockRes = await handleMockRequest(error.config);
        return mockRes;
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }

    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada o no autorizada. Redirigiendo a Login...');
      localStorage.removeItem('campestre_token');
      localStorage.removeItem('campestre_user_type');
      localStorage.removeItem('campestre_user');
      localStorage.removeItem('campestre_socio');
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
