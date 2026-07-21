import axios from 'axios';

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

    // Agregar Idempotency-Key para métodos de modificación (POST, PUT, DELETE) si no se especifica una
    if (['post', 'put', 'delete'].includes(config.method || '') && !config.headers['Idempotency-Key']) {
      // Generar una llave idempotente única basada en timestamp o UUID
      const randHex = Math.random().toString(16).substring(2, 10);
      config.headers['Idempotency-Key'] = `idem-${Date.now()}-${randHex}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores comunes (ej: desloguear si el token expira)
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Sesión expirada o no autorizada. Redirigiendo a Login...');
      // Limpiar sesión local del store de manera simple
      localStorage.removeItem('campestre_token');
      localStorage.removeItem('campestre_user_type');
      localStorage.removeItem('campestre_user');
      localStorage.removeItem('campestre_socio');
      // Recargar la página limpia el estado de Zustand
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
