import * as http from 'http';

export const createHttpServer = (requestHandler: (requests: any, context: any) => Promise<[any?, Error?]>, options?: any): http.Server => {
  
  if (options) {
    const optionsError = validateServerOptions(options);
    if (optionsError) {
      throw new Error(optionsError);
    }
  }

  const url = options?.url || '/';

  const server = http.createServer((req: http.IncomingMessage, res: http.ServerResponse) => {
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
            // console.error(error);
            res.statusCode = 400;
            res.end(error.message);
            return;
          }
          try {
            const context = {
              headers: req.headers,
            };
            const [result, error] = await requestHandler(jsonData, context);
            if (error) {
              res.statusCode = 500;
              res.end(error.message);
            } else if (result) {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify(result));
            } else {
              res.statusCode = 204;
              res.end();
            }
          } catch (error: any) {
            // console.error(error);
            res.statusCode = 500;
            res.end(error.message);
          }
        });
      } else {
        res.statusCode = 405;
        res.end();
      }
    } else {
      res.statusCode = 404;
      res.end();
    }
  });

  return server;

}

const validateServerOptions = (options: any) => {
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
    if (options.port) {
      if (typeof options.port !== 'number') {
        return 'Port should be a number';
      } else if (options.port < 1024) {
        return 'Port should be greater than 1024';
      }
    }
    if (options.hostname) {
      if (typeof options.hostname !== 'string') {
        return 'Hostname should be a string';
      }
    }
  }
  return false;
}