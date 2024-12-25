export interface ClientOptions {
    httpHeaders?: any;
    maxBatchSize?: number;
    bufferDelay?: number;
    idGenerator?: () => string;
}
export declare class HttpClient {
    private url;
    private httpHeaders;
    private maxBatchSize;
    private bufferDelay;
    private queue;
    private timeout;
    private emitter;
    private idGenerator;
    constructor(url: string, options?: ClientOptions);
    private process;
    request(route: string, body: object | null, headers: object | null): Promise<unknown>;
}
