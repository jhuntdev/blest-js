const chai = require('chai');
const expect = chai.expect;
const { v4: uuidv4 } = require('uuid');

const { Router } = require('../dist/router');

describe('Router', async () => {

    let router;
    const benchmarks = [];

    let testId1, testId2, testId3, testId4, testId5,
        testValue1, testValue2, testValue3, testValue4, testValue5,
        result1, result2, result3, result4, result5, result6,
        error1, error2, error3, error4, error5, error6

    before(async () => {

        router = new Router({
            timeout: 1000
        });

        router.use((parameters, context) => {
            context.test = {
                value: parameters.testValue
            };
        });

        router.route('basicRoute', (parameters, context) => {
            return { route: 'basicRoute', parameters, context };
        });

        const router2 = new Router({
            timeout: 10
        });

        router2.route('mergedRoute', (parameters, context) => {
            return { route: 'mergedRoute', parameters, context };
        });

        router2.route('timeoutRoute', (parameters) => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({ testValue: parameters.testValue })
                }, 20);
            });
        });

        router.merge(router2);

        const router3 = new Router();

        router3.route('errorRoute', (parameters) => {
            throw new Error(parameters.testValue);
        });

        router.namespace('subRoutes', router3);

        router.use((_, context) => {
            const completeTime = Date.now();
            const difference = completeTime - context.requestTime;
            benchmarks.push(difference);
        })

        // Basic route
        testId1 = uuidv4();
        testValue1 = Math.random();
        [result1, error1] = await router.handle([[testId1, 'basicRoute', { testValue: testValue1 }]], { testValue: testValue1 });

        // Merged route
        testId2 = uuidv4();
        testValue2 = Math.random();
        [result2, error2] = await router.handle([[testId2, 'mergedRoute', { testValue: testValue2 }]], { testValue: testValue2 });
    
        // Error route
        testId3 = uuidv4();
        testValue3 = Math.random();
        [result3, error3] = await router.handle([[testId3, 'subRoutes/errorRoute', { testValue: testValue3 }]], { testValue: testValue3 });

        // Missing route
        testId4 = uuidv4();
        testValue4 = Math.random();
        [result4, error4] = await router.handle([[testId4, 'missingRoute', { testValue: testValue4 }]], { testValue: testValue4 });

        // Timeout route
        testId5 = uuidv4();
        testValue5 = Math.random();
        [result5, error5] = await router.handle([[testId5, 'timeoutRoute', { testValue: testValue5 }]], { testValue: testValue5 });

        // Malformed request
        [result6, error6] = await router.handle([[testId4], {}, [true, 1.25]]);

    });

    it('should have class properties', () => {
        expect(router instanceof Router).to.be.true;
        expect(Object.keys(router.routes).length).to.equal(4);
        expect(typeof router.handle).to.equal('function');
        expect(typeof router.listen).to.equal('function');
    });

    it('should process all valid requests', () => {
        expect(error1).to.be.null;
        expect(error2).to.be.null;
        expect(error3).to.be.null;
        expect(error4).to.be.null;
        expect(error5).to.be.null;
    });

    it('should return matching IDs', () => {
        expect(result1[0][0]).to.equal(testId1);
        expect(result2[0][0]).to.equal(testId2);
        expect(result3[0][0]).to.equal(testId3);
        expect(result4[0][0]).to.equal(testId4);
        expect(result5[0][0]).to.equal(testId5);
    });

    it('should return matching routes', () => {
        expect(result1[0][1]).to.equal('basicRoute');
        expect(result2[0][1]).to.equal('mergedRoute');
        expect(result3[0][1]).to.equal('subRoutes/errorRoute');
        expect(result4[0][1]).to.equal('missingRoute');
        expect(result5[0][1]).to.equal('timeoutRoute');
    });

    it('should accept parameters', () => {
        expect(Number(result1[0][2].parameters.testValue)).to.equal(testValue1);
        expect(Number(result2[0][2].parameters.testValue)).to.equal(testValue2);
    });

    it('should respect context', () => {
        expect(Number(result1[0][2].context.testValue)).to.equal(testValue1);
        expect(Number(result2[0][2].context.testValue)).to.equal(testValue2);
    });

    it('should support middleware', () => {
        expect(Number(result1[0][2].context.test.value)).to.equal(testValue1);
        expect(Number(result2[0][2].context.test.value)).to.equal(testValue2);
    });

    it('should handle errors correctly', () => {
        expect(result1[0][3]).to.be.null;
        expect(result2[0][3]).to.be.null;
        expect(Number(result3[0][3].message)).to.equal(testValue3);
        expect(result4[0][3].message).to.equal('Route not found');
    });

    it('should support timeout setting', () => {
        expect(result5[0][2]).to.be.null;
        expect(result5[0][3].message).to.equal('Request timed out');
    });

    it('should reject malformed requests', () => {
        expect(error6.message).to.not.be.null;
    });

    it('should allow trailing middleware', () => {
        expect(benchmarks.length).to.equal(3);
    });

});