import { Router } from './router';
import { HttpClient } from './client';
import { EventEmitter } from './events';
export { EventEmitter } from './events';
export { Router } from './router';
export { HttpClient } from './client';
const defaultExport = {
    Router,
    HttpClient,
    EventEmitter
};
module.exports = defaultExport;
