/// <reference types="node" />
import { Router, RouterOptions } from './router';
import { ServerOptions } from './server';
import { HttpClient } from './client';
export { Router, RouterOptions } from './router';
export { createHttpServer, ServerOptions } from './server';
export { HttpClient, createHttpClient, ClientOptions } from './client';
export { createRequestHandler } from './handler';
interface BlestAppOptions extends RouterOptions, ServerOptions {
}
declare class BlestApp extends Router {
    options: BlestAppOptions;
    constructor(options?: BlestAppOptions);
    listen(...args: any[]): void;
}
declare const defaultExport: {
    (options?: BlestAppOptions): BlestApp;
    Router: typeof Router;
    createHttpServer: (requestHandler: (requests: any, context: any) => Promise<[any, any]>, options?: ServerOptions | undefined) => import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    HttpClient: typeof HttpClient;
    createHttpClient: (url: string, options?: import("./client").ClientOptions | undefined) => (route: string, params: object | null, selector: any[] | null) => Promise<unknown>;
    createRequestHandler: (routes: {
        [key: string]: any;
    }) => (requests: any[], context?: {
        [key: string]: any;
    }) => Promise<[any, any]>;
};
export default defaultExport;
