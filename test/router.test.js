const assert = require('assert');
const { v4: uuidv1 } = require('uuid');
const { Router } = require('../dist/cjs/router');

const invalidRoutes = [
    'a',
    '0abc',
    '_abc',
    '-abc',
    'abc_',
    'abc-',
    'abc/0abc',
    'abc/_abc',
    'abc/-abc',
    'abc/',
    '/abc',
    'abc//abc',
    'abc/a/abc',
    'abc/0abc/abc',
    'abc/_abc/abc',
    'abc/-abc/abc',
    'abc/abc_/abc',
    'abc/abc-/abc'
]

describe('Router', async () => {

    let router;
    const benchmarks = [];

    let testId1, testId2, testId3, testId4, testId5,
        testValue1, testValue2, testValue3, testValue4, testValue5,
        result1, result2, result3, result4, result5, result6,
        error1, error2, error3, error4, error5, error6,
        routeErrorCount = 0

    before(async () => {

        router = new Router({
            timeout: 1000
        });

        router.route('basicRoute', (body, context) => {
            return { route: 'basicRoute', body, context };
        });

        router.use((body, context) => {
            context.test = {
                value: body.testValue
            };
        });

        router.use((_, context, error) => {
            const completeTime = Date.now();
            const difference = completeTime - context.requestTime;
            benchmarks.push(difference);
        })

        const router2 = new Router({
            timeout: 10
        });

        router2.route('mergedRoute', (body, context) => {
            return { route: 'mergedRoute', body, context };
        });

        router2.route('timeoutRoute', (body) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ testValue: body.testValue })
                }, 20);
            });
        });

        router.merge(router2);

        const router3 = new Router();

        router3.route('errorRoute', (body) => {
            const error = new Error(body.testValue);
            error.code = 'ERROR_' + Math.round(body.testValue * 10);
            throw error;
        });

        router.namespace('subRoutes', router3);

        // Basic route
        testId1 = uuidv1();
        testValue1 = Math.random();
        [result1, error1] = await router.handle([[testId1, 'basicRoute', { testValue: testValue1 }]], { testValue: testValue1 });

        // Merged route
        testId2 = uuidv1();
        testValue2 = Math.random();
        [result2, error2] = await router.handle([[testId2, 'mergedRoute', { testValue: testValue2 }]], { testValue: testValue2 });
    
        // Error route
        testId3 = uuidv1();
        testValue3 = Math.random();
        [result3, error3] = await router.handle([[testId3, 'subRoutes/errorRoute', { testValue: testValue3 }]], { testValue: testValue3 });

        // Missing route
        testId4 = uuidv1();
        testValue4 = Math.random();
        [result4, error4] = await router.handle([[testId4, 'missingRoute', { testValue: testValue4 }]], { testValue: testValue4 });

        // Timeout route
        testId5 = uuidv1();
        testValue5 = Math.random();
        [result5, error5] = await router.handle([[testId5, 'timeoutRoute', { testValue: testValue5 }]], { testValue: testValue5 });

        // Malformed request
        [result6, error6] = await router.handle([[testId4], {}, [true, 1.25]]);

        // Invalid routes
        const handler = () => {}
        for (let i = 0; i < invalidRoutes.length; i++) {
            try {
                router.route(invalidRoutes[i], handler)
            } catch (error) {
                routeErrorCount++
            }
        }

    });

    it('should have class properties', () => {
        assert.equal(router instanceof Router, true);
        assert.equal(Object.keys(router.routes).length, 4);
        assert.equal(typeof router.handle, 'function');
    });

    it('should process all valid requests', () => {
        assert.equal(error1, null);
        assert.equal(error2, null);
        assert.equal(error3, null);
        assert.equal(error4, null);
        assert.equal(error5, null);
    });

    it('should return matching IDs', () => {
        assert.equal(result1[0][0], testId1);
        assert.equal(result2[0][0], testId2);
        assert.equal(result3[0][0], testId3);
        assert.equal(result4[0][0], testId4);
        assert.equal(result5[0][0], testId5);
    });

    it('should return matching routes', () => {
        assert.equal(result1[0][1], 'basicRoute');
        assert.equal(result2[0][1], 'mergedRoute');
        assert.equal(result3[0][1], 'subRoutes/errorRoute');
        assert.equal(result4[0][1], 'missingRoute');
        assert.equal(result5[0][1], 'timeoutRoute');
    });

    it('should accept body', () => {
        assert.equal(Number(result1[0][2].body.testValue), testValue1);
        assert.equal(Number(result2[0][2].body.testValue), testValue2);
    });

    it('should respect context', () => {
        assert.equal(Number(result1[0][2].context.testValue), testValue1);
        assert.equal(Number(result2[0][2].context.testValue), testValue2);
    });

    it('should support middleware', () => {
        assert.equal(result1[0][2].context.test, undefined);
        assert.equal(Number(result2[0][2].context.test.value), testValue2);
    });

    it('should handle errors correctly', () => {
        assert.equal(result1[0][3], null);
        assert.equal(result2[0][3], null);
        assert.equal(Number(result3[0][3].message), testValue3);
        assert.equal(Number(result3[0][3].status), 500);
        assert.equal(result3[0][3].code, 'ERROR_' + Math.round(testValue3 * 10));
        assert.equal(result4[0][3].message, 'Not Found');
        assert.equal(result4[0][3].status, 404);
    });

    it('should support timeout setting', () => {
        assert.equal(result5[0][2], null);
        assert.equal(result5[0][3].message, 'Internal Server Error');
        assert.equal(result5[0][3].status, 500);
    });

    it('should reject malformed requests', () => {
        assert.notEqual(error6.message, null);
    });

    it('should allow trailing middleware', () => {
        assert.equal(benchmarks.length, 1);
    });

    it('should throw an error for invalid routes', () => {
        assert.equal(invalidRoutes.length, routeErrorCount);
    })

});