import * as http from 'http';
export declare class HTTPServer {
    private server;
    listen: any;
    constructor(requestHandler: (requests: any, context: any) => Promise<[any?, Error?]>);
}
export declare const createHttpServer: (requestHandler: (requests: any, context: any) => Promise<[any?, Error?]>, options?: any) => http.Server;
