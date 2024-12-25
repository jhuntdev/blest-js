const assert = require('assert');
const { EventEmitter } = require('../dist/index.cjs');

describe('EventEmitter', async () => {

    const onDatas = [];
    const onceDatas = [];

    before(async () => {

        const emitter = new EventEmitter()

        emitter.on('testEvent', (data) => {
            onDatas.push(data)
        })

        emitter.once('testEvent', (data) => {
            onceDatas.push(data)
        })

        emitter.emit('testEvent', 'test1')
        emitter.emit('testEvent', 'test2')

    });

    it('works', () => {
        assert.equal(onDatas.length, 2);
        assert.equal(onDatas[0], 'test1');
        assert.equal(onDatas[1], 'test2');
        assert.equal(onceDatas.length, 1);
        assert.equal(onceDatas[0], 'test1');
    });

});