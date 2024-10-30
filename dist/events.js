"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const makeEventId = (length = 8) => {
    const max = Math.pow(16, length) - 1;
    const randomNumber = Math.floor(Math.random() * (max + 1));
    const id = randomNumber.toString(16).padStart(length, '0');
    return id;
};
class EventEmitter {
    constructor() {
        this.runByEvent = {};
    }
    add(event, cb, once = false) {
        if (!this.runByEvent[event])
            this.runByEvent[event] = [];
        const node = {
            id: makeEventId,
            event,
            cb,
            once
        };
        this.runByEvent[event].push(node);
    }
    remove(node) {
        this.runByEvent[node.event] = this.runByEvent[node.event].filter((n) => n.id !== node.id);
    }
    on(event, cb, once = false) {
        if (typeof cb != 'function')
            throw TypeError("Callback parameter has to be a function.");
        let node = this.add(event, cb, once);
        return () => this.remove(node);
    }
    once(event, cb) {
        return this.on(event, cb, true);
    }
    emit(event, ...data) {
        let nodes = this.runByEvent[event];
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            node.cb(...data);
            if (node.once) {
                this.remove(node);
            }
        }
    }
}
exports.default = EventEmitter;
