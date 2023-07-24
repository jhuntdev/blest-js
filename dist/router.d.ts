export declare class Router {
    private introspection;
    private beforeMiddleware;
    private afterMiddleware;
    private timeout;
    routes: any;
    constructor(options: any);
    before(...handlers: any[]): void;
    use: (...handlers: any[]) => void;
    after(...handlers: any[]): void;
    route(route: string, ...args: any[]): void;
    describe(route: string, config: any): void;
    merge(router: Router): void;
    namespace(prefix: string, router: Router): void;
    handle(requests: any[], context?: {
        [key: string]: any;
    }): Promise<[any, any]>;
    listen(...args: any[]): void;
}
