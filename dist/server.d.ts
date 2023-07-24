import * as http from 'http';
export declare const createHttpServer: (requestHandler: (requests: any, context: any) => Promise<[any?, Error?]>, options?: any) => http.Server;
