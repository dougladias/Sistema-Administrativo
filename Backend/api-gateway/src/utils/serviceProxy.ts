import { Request, Response } from 'express';
import axios, { Method } from 'axios';

interface ProxyRequestOptions {
  req: Request;
  res: Response;
  serviceUrl: string;
  path: string;
  method: Method | string;
  serviceName?: string;
  body?: any;
  headers?: Record<string, string>;
}

export async function proxyRequest(options: ProxyRequestOptions): Promise<void> {
  const { req, res, serviceUrl, path, method, body, headers } = options;
  try {
    const url = `${serviceUrl}${path}`;
    const response = await axios.request({
      url,
      method: method as Method,
      data: body ?? req.body,
      headers: {
        ...req.headers,
        ...headers,
        host: undefined // Remove host header to avoid conflicts
      },
      params: req.query,
      responseType: 'stream'
    });

    res.status(response.status);
    response.data.pipe(res);
  } catch (error: any) {
    if (error.response) {
      res.status(error.response.status).send(error.response.data);
    } else {
      res.status(500).send({ error: 'Erro ao encaminhar requisição para o serviço.' });
    }
  }
}