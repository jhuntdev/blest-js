/// <reference types="node" />
import { Router, RouterOptions } from './router';
import { ServerOptions } from './server';
export { Router, RouterOptions } from './router';
export { createHttpServer, ServerOptions } from './server';
export { createHttpClient } from './client';
export { createRequestHandler } from './handler';
declare class BlestApp extends Router {
    options: any;
    constructor(routerOptions?: RouterOptions, serverOptions?: ServerOptions);
    listen(...args: any[]): void;
}
declare const defaultExport: {
    (routerOptions?: RouterOptions, serverOptions?: ServerOptions): BlestApp;
    Router: typeof Router;
    createHttpServer: (requestHandler: (requests: any, context: any) => Promise<[any, any]>, options?: ServerOptions | undefined) => import("http").Server<typeof import("http").IncomingMessage, typeof import("http").ServerResponse>;
    createHttpClient: (url: string, options?: import("./client").ClientOptions | undefined) => (route: string, params: object | null, selector: any[] | null) => Promise<unknown>;
    createRequestHandler: (routes: {
        [key: string]: any;
    }) => (requests: any[], context?: {
        [key: string]: any;
    }) => Promise<[any, any]>;
};
export default defaultExport;
