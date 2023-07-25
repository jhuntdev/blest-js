import * as http from 'http';

export interface ServerOptions {
  url?: string
  cors?: string | boolean
  accessControlAllowOrigin?: string
  contentSecurityPolicy?: string
  crossOriginOpenerPolicy?: string
  crossOriginResourcePolicy?: string
  originAgentCluster?: string
  referrerPolicy?: string
  strictTransportSecurity?: string
  xContentTypeOptions?: string
  xDnsPrefetchOptions?: string
  xDownloadOptions?: string
  xFrameOptions?: string
  xPermittedCrossDomainPolicies?: string
  xXssProtection?: string
  disableWarnings?: boolean
}

export const createHttpServer = (requestHandler: (requests: any, context: any) => Promise<[any, any]>, options?: ServerOptions): http.Server => {
  
  if (options) {
    const optionsError = validateServerOptions(options);
    if (optionsError) {
      throw new Error(optionsError);
    }
  }

  const url = options?.url || '/';

  const httpHeaders:any = {
    'access-control-allow-origin': options?.accessControlAllowOrigin || (options?.cors ? typeof options.cors === 'string' ? options.cors : '*' : ''),
    'content-security-policy': options?.contentSecurityPolicy || "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
    'cross-origin-opener-policy': options?.crossOriginOpenerPolicy || 'same-origin',
    'cross-origin-resource-policy': options?.crossOriginResourcePolicy || 'same-origin',
    'origin-agent-cluster': options?.originAgentCluster || '?1',
    'referrer-policy': options?.referrerPolicy || 'no-referrer',
    'strict-transport-security': options?.strictTransportSecurity || 'max-age=15552000; includeSubDomains',
    'x-content-type-options': options?.xContentTypeOptions || 'nosniff',
    'x-dns-prefetch-control': options?.xDnsPrefetchOptions || 'off',
    'x-download-options': options?.xDownloadOptions || 'noopen',
    'x-frame-options': options?.xFrameOptions || 'SAMEORIGIN',
    'x-permitted-cross-domain-policies': options?.xPermittedCrossDomainPolicies || 'none',
    'x-xss-protection': options?.xXssProtection || '0'
  };

  const httpRequestHandler = (req: http.IncomingMessage, res: http.ServerResponse) => {
    if (req.url === url) {
      if (req.method === 'POST') {
        let body = '';
        req.on('data', (chunk: any) => {
          body += chunk;
        });
        req.on('end', async () => {
          let jsonData;
          try {
            jsonData = JSON.parse(body);
          } catch (error: any) {
            res.writeHead(400, httpHeaders);
            res.end(error.message);
            return;
          }
          try {
            const context = {
              headers: req.headers,
            };
            const [result, error] = await requestHandler(jsonData, context);
            if (error) {
              res.writeHead(error.status || 500, httpHeaders);
              res.end(error.message);
            } else if (result) {
              res.writeHead(200, { 'Content-Type': 'application/json', ...httpHeaders });
              res.end(JSON.stringify(result));
            } else {
              res.writeHead(204, httpHeaders);
              res.end();
            }
          } catch (error: any) {
            res.writeHead(500, httpHeaders);
            res.end(error.message);
          }
        });
      } else {
        res.writeHead(405, httpHeaders);
        res.end();
      }
    } else {
      res.writeHead(404, httpHeaders);
      res.end();
    }
  };

  const server = http.createServer(httpRequestHandler);

  return server;

}

export const validateServerOptions = (options: any) => {
  if (!options) {
    return false;
  } else if (typeof options !== 'object') {
    return 'Options should be an object';
  } else {
    if (options.url) {
      if (typeof options.url !== 'string') {
        return 'URL should be a string';
      } else if (options.url.indexOf('/') !== 0) {
        return 'URL should begin with a forward slash';
      }
    }
    if (options.cors) {
      if (['string', 'boolean'].indexOf(typeof options.cors) === -1) {
        return 'CORS should be a string or boolean';
      }
    }
  }
  return false;
}