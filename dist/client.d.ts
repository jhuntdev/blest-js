export declare class HTTPClient {
}
export declare const createHttpClient: (url: string, options?: any) => (route: string, params: object | null, selector: any[] | null) => Promise<unknown>;
