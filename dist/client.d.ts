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
    setOptions(options?: ClientOptions): boolean;
    setUrl(url?: string): void;
    constructor(url: string, options?: ClientOptions);
    private process;
    set(option: string, value: any): void;
    request(route: string, body: object | null, headers: object | null): Promise<unknown>;
}
