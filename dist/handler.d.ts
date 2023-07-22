export declare const createRequestHandler: (routes: {
    [key: string]: any;
}) => (requests: any[], context?: {
    [key: string]: any;
}) => Promise<RequestResult>;
export declare const handleRequest: (routes: {
    [key: string]: any;
}, requests: any[], context?: {
    [key: string]: any;
}) => Promise<RequestResult>;
type RequestResult = [any, any];
export {};
