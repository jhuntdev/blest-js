export interface ClientOptions {
    httpHeaders?: any;
    maxBatchSize?: number;
    bufferDelay?: number;
}
export declare class HttpClient {
    private url;
    private httpHeaders;
    private maxBatchSize;
    private bufferDelay;
    private queue;
    private timeout;
    private emitter;
    constructor(url: string, options?: ClientOptions);
    private process;
    request(route: string, body: object | null, headers: object | null): Promise<unknown>;
}
export declare const createHttpClient: (url: string, options?: ClientOptions) => (route: string, body: object | null, headers: object | null) => Promise<unknown>;
