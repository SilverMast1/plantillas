import apiClient from './apiClient';

interface QueueItem {
  id: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'GET';
  data: any;
  tempCuentaId?: string; // Si está asociado a una cuenta temporal
}

const QUEUE_KEY = 'campestre_offline_queue';

export function getOfflineQueue(): QueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveQueue(queue: QueueItem[]) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function addToOfflineQueue(item: Omit<QueueItem, 'id'>) {
  const queue = getOfflineQueue();
  const newItem: QueueItem = {
    ...item,
    id: `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  };
  queue.push(newItem);
  saveQueue(queue);
  console.log('Petición agregada a la cola offline:', newItem);
}

export async function syncOfflineQueue(onSyncSuccess?: (message: string) => void): Promise<boolean> {
  const queue = getOfflineQueue();
  if (queue.length === 0) return true;

  console.log(`Iniciando sincronización de ${queue.length} peticiones offline...`);
  
  // Mapa de IDs temporales a IDs reales creados por el backend
  const idMap = new Map<string, number>();

  for (const item of queue) {
    try {
      let finalUrl = item.url;
      let finalData = { ...item.data };

      // Reemplazar ID de cuenta temporal si existiera
      if (item.tempCuentaId && idMap.has(item.tempCuentaId)) {
        const realId = idMap.get(item.tempCuentaId);
        finalUrl = finalUrl.replace(item.tempCuentaId, String(realId));
        
        if (finalData.cuentaId) {
          finalData.cuentaId = realId;
        }
      }

      console.log(`Procesando offline sync: ${item.method} ${finalUrl}`);
      const response = await apiClient({
        url: finalUrl,
        method: item.method,
        data: finalData,
      });

      // Si abrimos una cuenta temporal, mapeamos su ID temporal al ID real devuelto por la base de datos
      if (item.url === '/api/pos/cuentas/abrir' && response.data && response.data.id) {
        if (item.tempCuentaId) {
          idMap.set(item.tempCuentaId, response.data.id);
        }
      }

    } catch (error: any) {
      // Si el error es de red (no hay internet o servidor apagado), detener sincronización para reintentar después
      if (!error.response || error.code === 'ERR_NETWORK') {
        console.warn('Fallo de red en la sincronización offline, se reintentará más tarde:', error.message);
        return false;
      }
      // Si el error es 4xx/5xx (error lógico), eliminar el item fallido para que la cola no se trabe, pero registrar el error
      console.error(`Error de lógica al sincronizar petición offline (${item.method} ${item.url}):`, error.response?.data || error.message);
    }

    // Remover el elemento procesado
    const currentQueue = getOfflineQueue();
    const updatedQueue = currentQueue.filter(q => q.id !== item.id);
    saveQueue(updatedQueue);
  }

  if (onSyncSuccess) {
    onSyncSuccess('Sincronización de consumos offline completada.');
  }
  return true;
}
