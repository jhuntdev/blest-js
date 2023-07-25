export interface ClientOptions {
    headers?: any;
    maxBatchSize?: number;
    bufferDelay?: number;
    disableWarnings?: boolean;
}
export declare const createHttpClient: (url: string, options?: ClientOptions) => (route: string, params: object | null, selector: any[] | null) => Promise<unknown>;
