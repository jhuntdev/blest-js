import * as http from 'http';
export declare const createHttpServer: (requestHandler: (data: any, context: any) => Promise<[any?, Error?]>, options?: any) => http.Server;
export declare const createHttpClient: (url: string, options?: any) => (route: string, params: object | null, selector: any[] | null) => Promise<unknown>;
export declare const createRequestHandler: (routes: {
    [key: string]: any;
}, options?: any) => (requests: any[], context?: {
    [key: string]: any;
}) => Promise<RequestResult>;
type RequestResult = [any, any];
export {};
