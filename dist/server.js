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
exports.createHttpServer = void 0;
const http = __importStar(require("http"));
const createHttpServer = (requestHandler, options) => {
    if (options) {
        const optionsError = validateServerOptions(options);
        if (optionsError) {
            throw new Error(optionsError);
        }
    }
    const url = (options === null || options === void 0 ? void 0 : options.url) || '/';
    const server = http.createServer((req, res) => {
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
                        // console.error(error);
                        res.statusCode = 400;
                        res.end(error.message);
                        return;
                    }
                    try {
                        const context = {
                            headers: req.headers,
                        };
                        const [result, error] = await requestHandler(jsonData, context);
                        if (error) {
                            res.statusCode = 500;
                            res.end(error.message);
                        }
                        else if (result) {
                            res.writeHead(200, { 'Content-Type': 'application/json' });
                            res.end(JSON.stringify(result));
                        }
                        else {
                            res.statusCode = 204;
                            res.end();
                        }
                    }
                    catch (error) {
                        // console.error(error);
                        res.statusCode = 500;
                        res.end(error.message);
                    }
                });
            }
            else {
                res.statusCode = 405;
                res.end();
            }
        }
        else {
            res.statusCode = 404;
            res.end();
        }
    });
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
        if (options.port) {
            if (typeof options.port !== 'number') {
                return 'Port should be a number';
            }
            else if (options.port < 1024) {
                return 'Port should be greater than 1024';
            }
        }
        if (options.hostname) {
            if (typeof options.hostname !== 'string') {
                return 'Hostname should be a string';
            }
        }
    }
    return false;
};
