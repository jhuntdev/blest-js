export interface RequestHandlerOptions {
    debug?: boolean;
    idGenerator?: () => string;
}
export declare const handleRequest: (routes: {
    [key: string]: any;
}, requests: any[], context?: {
    [key: string]: any;
}, options?: RequestHandlerOptions) => Promise<RequestResult>;
type RequestResult = [any, any];
export {};
