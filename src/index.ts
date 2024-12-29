import { Router } from './router';
import { HttpClient } from './client';
import { EventEmitter } from './events';

export { EventEmitter } from './events';
export { Router, RouterOptions } from './router';
export { HttpClient, ClientOptions } from './client';

const defaultExport = {
  Router,
  HttpClient,
  EventEmitter
};

module.exports = defaultExport;

// export default defaultExport;
