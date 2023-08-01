export interface ClientOptions {
    headers?: any;
    maxBatchSize?: number;
    bufferDelay?: number;
}
export declare class HttpClient {
    private url;
    private headers;
    private maxBatchSize;
    private bufferDelay;
    private queue;
    private timeout;
    private emitter;
    constructor(url: string, options?: ClientOptions);
    private process;
    request(route: string, params: object | null, selector: any[] | null): Promise<unknown>;
}
export declare const createHttpClient: (url: string, options?: ClientOptions) => (route: string, params: object | null, selector: any[] | null) => Promise<unknown>;
