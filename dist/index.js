(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define(["require", "exports", "./router", "./client", "./router", "./client"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.HttpClient = exports.Router = void 0;
    const router_1 = require("./router");
    const client_1 = require("./client");
    var router_2 = require("./router");
    Object.defineProperty(exports, "Router", { enumerable: true, get: function () { return router_2.Router; } });
    var client_2 = require("./client");
    Object.defineProperty(exports, "HttpClient", { enumerable: true, get: function () { return client_2.HttpClient; } });
    const defaultExport = {
        Router: router_1.Router,
        HttpClient: client_1.HttpClient
    };
    module.exports = defaultExport;
    exports.default = defaultExport;
});
