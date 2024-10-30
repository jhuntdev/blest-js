declare class EventEmitter {
    private runByEvent;
    add(event: string, cb: any, once?: boolean): void;
    remove(node: any): void;
    on(event: string, cb: any, once?: boolean): () => void;
    once(event: string, cb: any): () => void;
    emit(event: string, ...data: any[]): void;
}
export default EventEmitter;
