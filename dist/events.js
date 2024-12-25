import { idGenerator } from "./utilities";
export class EventEmitter {
    runByEvent = {};
    add(event, cb, once = false) {
        if (!this.runByEvent[event])
            this.runByEvent[event] = [];
        const node = {
            id: idGenerator(),
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
