import { Request, Response, NextFunction } from 'express';
import prisma from '../db';

export async function idempotency(req: Request, res: Response, next: NextFunction) {
  const key = req.headers['idempotency-key'] || req.headers['x-idempotency-key'];

  // Solo aplicar a peticiones POST, PUT y DELETE que envíen la cabecera
  if (!key || typeof key !== 'string' || !['POST', 'PUT', 'DELETE'].includes(req.method)) {
    return next();
  }

  try {
    // 1. Verificar si la clave ya existe
    const existingKey = await prisma.idempotencyKey.findUnique({
      where: { key },
    });

    if (existingKey) {
      if (existingKey.status === 'PROCESSING') {
        return res.status(409).json({
          error: 'Su solicitud está siendo procesada, por favor espere.',
        });
      }

      if (existingKey.status === 'COMPLETED') {
        const body = existingKey.response_body ? JSON.parse(existingKey.response_body) : null;
        return res.status(existingKey.response_status || 200).json(body);
      }
    }

    // 2. Registrar la clave como en proceso (PROCESSING)
    await prisma.idempotencyKey.create({
      data: {
        key,
        status: 'PROCESSING',
      },
    });

    // 3. Interceptar respuestas
    const originalSend = res.send;
    const originalJson = res.json;

    let responseBody: any = null;

    res.json = function (body: any) {
      responseBody = body;
      return originalJson.apply(this, arguments as any);
    };

    res.send = function (body: any) {
      if (!responseBody) {
        responseBody = body;
      }
      return originalSend.apply(this, arguments as any);
    };

    // Registrar resultado al finalizar la petición
    res.on('finish', async () => {
      const statusCode = res.statusCode;

      // Si es un error del servidor (5xx), permitimos reintentos eliminando la clave
      if (statusCode >= 500) {
        await prisma.idempotencyKey.delete({
          where: { key },
        }).catch((err: any) => console.error('Error al eliminar llave de idempotencia en error 500:', err));
        return;
      }

      let serializedBody = '';
      if (responseBody) {
        try {
          serializedBody = typeof responseBody === 'string' ? responseBody : JSON.stringify(responseBody);
        } catch (e) {
          serializedBody = String(responseBody);
        }
      }

      await prisma.idempotencyKey.update({
        where: { key },
        data: {
          status: 'COMPLETED',
          response_status: statusCode,
          response_body: serializedBody,
        },
      }).catch((err: any) => console.error('Error al actualizar llave de idempotencia a COMPLETED:', err));
    });

    next();
  } catch (error) {
    console.error('Error en middleware de idempotencia:', error);
    next();
  }
}
