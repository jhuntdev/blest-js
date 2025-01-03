import { RequestHandlerOptions } from './handler';
export interface RouterOptions {
    introspection?: boolean;
    timeout?: number;
}
export declare class Router {
    private introspection;
    private middleware;
    private timeout;
    routes: any;
    constructor(options?: RouterOptions);
    use(...handlers: any[]): void;
    route(route: string, ...args: any[]): void;
    describe(route: string, config: any): void;
    merge(router: Router): void;
    namespace(prefix: string, router: Router): void;
    handle(requests: any[], context?: {
        [key: string]: any;
    }, options?: RequestHandlerOptions): Promise<[any, any]>;
}
