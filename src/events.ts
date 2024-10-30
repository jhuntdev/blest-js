const makeEventId = (length: number = 8): string => {
    const max = Math.pow(16, length) - 1;
    const randomNumber = Math.floor(Math.random() * (max + 1));
    const id = randomNumber.toString(16).padStart(length, '0');
    return id;
}

class EventEmitter {
    private runByEvent: any = {}

    add(event: string, cb: any, once: boolean = false) {
        if (!this.runByEvent[event]) this.runByEvent[event] = [];
        const node = {
            id: makeEventId,
            event,
            cb,
            once
        }
        this.runByEvent[event].push(node)
    }

    remove(node: any) {
        this.runByEvent[node.event] = this.runByEvent[node.event].filter((n: any) => n.id !== node.id)
    }

    on(event: string, cb: any, once: boolean = false) {
        if(typeof cb != 'function') throw TypeError("Callback parameter has to be a function.");
        let node = this.add(event, cb, once);
        return () => this.remove(node);
    }

    once(event: string, cb: any) {
        return this.on(event, cb, true);
    }

    emit(event: string, ...data: any[]) {
        let nodes = this.runByEvent[event];
        for (let i = 0; i < nodes.length; i++) {
            const node = nodes[i];
            node.cb(...data);
            if(node.once) {
                this.remove(node)
            }
        }
    }
}

export default EventEmitter;