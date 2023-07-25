"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateServerOptions = exports.createHttpServer = void 0;
const http = __importStar(require("http"));
const createHttpServer = (requestHandler, options) => {
    if (options) {
        const optionsError = (0, exports.validateServerOptions)(options);
        if (optionsError) {
            throw new Error(optionsError);
        }
    }
    const url = (options === null || options === void 0 ? void 0 : options.url) || '/';
    const httpHeaders = {
        'access-control-allow-origin': (options === null || options === void 0 ? void 0 : options.accessControlAllowOrigin) || ((options === null || options === void 0 ? void 0 : options.cors) ? typeof options.cors === 'string' ? options.cors : '*' : ''),
        'content-security-policy': (options === null || options === void 0 ? void 0 : options.contentSecurityPolicy) || "default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests",
        'cross-origin-opener-policy': (options === null || options === void 0 ? void 0 : options.crossOriginOpenerPolicy) || 'same-origin',
        'cross-origin-resource-policy': (options === null || options === void 0 ? void 0 : options.crossOriginResourcePolicy) || 'same-origin',
        'origin-agent-cluster': (options === null || options === void 0 ? void 0 : options.originAgentCluster) || '?1',
        'referrer-policy': (options === null || options === void 0 ? void 0 : options.referrerPolicy) || 'no-referrer',
        'strict-transport-security': (options === null || options === void 0 ? void 0 : options.strictTransportSecurity) || 'max-age=15552000; includeSubDomains',
        'x-content-type-options': (options === null || options === void 0 ? void 0 : options.xContentTypeOptions) || 'nosniff',
        'x-dns-prefetch-control': (options === null || options === void 0 ? void 0 : options.xDnsPrefetchOptions) || 'off',
        'x-download-options': (options === null || options === void 0 ? void 0 : options.xDownloadOptions) || 'noopen',
        'x-frame-options': (options === null || options === void 0 ? void 0 : options.xFrameOptions) || 'SAMEORIGIN',
        'x-permitted-cross-domain-policies': (options === null || options === void 0 ? void 0 : options.xPermittedCrossDomainPolicies) || 'none',
        'x-xss-protection': (options === null || options === void 0 ? void 0 : options.xXssProtection) || '0'
    };
    const httpRequestHandler = (req, res) => {
        if (req.url === url) {
            if (req.method === 'POST') {
                let body = '';
                req.on('data', (chunk) => {
                    body += chunk;
                });
                req.on('end', async () => {
                    let jsonData;
                    try {
                        jsonData = JSON.parse(body);
                    }
                    catch (error) {
                        res.writeHead(400, httpHeaders);
                        res.end(error.message);
                        return;
                    }
                    try {
                        const context = {
                            headers: req.headers,
                        };
                        const [result, error] = await requestHandler(jsonData, context);
                        if (error) {
                            res.writeHead(error.status || 500, httpHeaders);
                            res.end(error.message);
                        }
                        else if (result) {
                            res.writeHead(200, { 'Content-Type': 'application/json', ...httpHeaders });
                            res.end(JSON.stringify(result));
                        }
                        else {
                            res.writeHead(204, httpHeaders);
                            res.end();
                        }
                    }
                    catch (error) {
                        res.writeHead(500, httpHeaders);
                        res.end(error.message);
                    }
                });
            }
            else {
                res.writeHead(405, httpHeaders);
                res.end();
            }
        }
        else {
            res.writeHead(404, httpHeaders);
            res.end();
        }
    };
    const server = http.createServer(httpRequestHandler);
    return server;
};
exports.createHttpServer = createHttpServer;
const validateServerOptions = (options) => {
    if (!options) {
        return false;
    }
    else if (typeof options !== 'object') {
        return 'Options should be an object';
    }
    else {
        if (options.url) {
            if (typeof options.url !== 'string') {
                return 'URL should be a string';
            }
            else if (options.url.indexOf('/') !== 0) {
                return 'URL should begin with a forward slash';
            }
        }
        if (options.cors) {
            if (['string', 'boolean'].indexOf(typeof options.cors) === -1) {
                return 'CORS should be a string or boolean';
            }
        }
    }
    return false;
};
exports.validateServerOptions = validateServerOptions;
