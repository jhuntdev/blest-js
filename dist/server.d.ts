/// <reference types="node" />
import * as http from 'http';
export interface ServerOptions {
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
export declare const validateServerOptions: (options: any) => false | "Options should be an object" | "URL should be a string" | "URL should begin with a forward slash" | "CORS should be a string or boolean";
