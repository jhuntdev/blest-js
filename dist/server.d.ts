import * as http from 'http';
interface ServerOptions {
    url?: string;
    cors?: string | boolean;
    accessControlAllowOrigin?: string;
    contentSecurityPolicy?: string;
    crossOriginOpenerPolicy?: string;
    crossOriginResourcePolicy?: string;
    originAgentCluster?: string;
    referrerPolicy?: string;
    strictTransportSecurity?: string;
    xContentTypeOptions?: string;
    xDnsPrefetchOptions?: string;
    xDownloadOptions?: string;
    xFrameOptions?: string;
    xPermittedCrossDomainPolicies?: string;
    xXssProtection?: string;
}
export declare const createHttpServer: (requestHandler: (requests: any, context: any) => Promise<[any, any]>, options?: ServerOptions) => http.Server;
export {};
