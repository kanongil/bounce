import * as Bounce from '..';
import * as Boom from '@hapi/boom';
import * as Hoek from '@hapi/hoek';
import * as Lab from '@hapi/lab';

const { expect } = Lab.types;

// rethrow()

expect.type<void>(Bounce.rethrow(new Error(), 'system'));
expect.type<void>(Bounce.rethrow(123, Boom.Boom));
expect.type<void>(Bounce.rethrow(new TypeError(), [Boom.Boom, RangeError, { prop: true }]));
expect.type<TypeError | undefined>(Bounce.rethrow(new TypeError(), Boom.Boom, { return: true }));
expect.type<RangeError | undefined>(Bounce.rethrow(null, Boom.Boom, { return: true, override: new RangeError() }));
expect.type<(TypeError & { prop: string }) | undefined>(Bounce.rethrow(new TypeError(), Boom.Boom, { return: true, decorate: { prop: 'ok' } }));

expect.error(Bounce.rethrow(new Error()));
expect.error(Bounce.rethrow(new Error(), 'unknown'));
expect.error(Bounce.rethrow(new Error(), Boom.Boom, true));
expect.error(Bounce.rethrow(new Error(), Boom.Boom, { unknown: true }));
expect.error(Bounce.rethrow(new Error(), Boom.Boom, { decorate: 123 }));
expect.error(Bounce.rethrow(new Error(), Boom.Boom, { override: {} }));

// ignore()

expect.type<void>(Bounce.ignore(new TypeError(), 'system'));
expect.type<void>(Bounce.ignore(new Boom.Boom(), Boom.Boom));
expect.type<void>(Bounce.ignore(new RangeError(), [Boom.Boom, RangeError, { prop: true }]));
expect.type<TypeError | undefined>(Bounce.ignore(new TypeError(), Boom.Boom, { return: true }));
expect.type<RangeError | undefined>(Bounce.ignore(null, Boom.Boom, { return: true, override: new RangeError() }));
expect.type<(TypeError & { prop: string }) | undefined>(Bounce.ignore(new TypeError(), Boom.Boom, { return: true, decorate: { prop: 'ok' } }));

// Narrows the error type

{
    const error = new TypeError() as unknown;
    Bounce.ignore(error, TypeError);
    expect.type<Error>(error);
}

{
    const error = new Boom.Boom() as unknown;
    Bounce.ignore(error, Boom.Boom);
    expect.type<Boom.Boom>(error);
}

{
    class TestError extends Error {
        test = true;
    }

    const error = new TestError() as unknown;
    Bounce.ignore(error, TestError);
    expect.type<TestError>(error);
}

expect.error(Bounce.ignore(new Error()));
expect.error(Bounce.ignore(new Error(), 'unknown'));
expect.error(Bounce.ignore(new Error(), Boom.Boom, true));
expect.error(Bounce.ignore(new Error(), Boom.Boom, { unknown: true }));
expect.error(Bounce.ignore(new Error(), Boom.Boom, { decorate: 123 }));
expect.error(Bounce.ignore(new Error(), Boom.Boom, { override: {} }));

// background()

expect.type<Promise<void>>(Bounce.background(async () => undefined, 'ignore', 'system', { decorate: { a: true } }));
expect.type<Promise<any>>(Bounce.background(async () => undefined, 'rethrow', [RangeError], { return: true }));
expect.type<Promise<TypeError | undefined>>(Bounce.background(async () => undefined, undefined, undefined, { return: true, override: new TypeError() }));

expect.error(Bounce.background());
expect.error(Bounce.background(true, 'unknown'));

// isSystem()

expect.type<boolean>(Bounce.isSystem(new Error()));
{
    const err = new TypeError();
    if (Bounce.isSystem(err)) {
        expect.type<TypeError>(err);       // Does not narrow type
    }
}
{
    const obj = {};
    if (Bounce.isSystem(obj)) {
        expect.type<Error>(obj);           // Narrows type
    }
}

expect.error(Bounce.isSystem());

// isAbort()

expect.type<boolean>(Bounce.isAbort(0));
{
    const err = AbortSignal.abort().reason as any;
    if (Bounce.isAbort(err)) {
        expect.type<Error>(err);                       // Narrows type
        expect.type<'AbortError'>(err.name);           // Narrows name
    }

    Bounce.ignore(err, 'abort');
    expect.type<'AbortError'>(err.name);               // Narrows name
}

expect.error(Bounce.isAbort());

// isTimeout()

expect.type<boolean>(Bounce.isTimeout(0));
{
    const timeout = AbortSignal.timeout(1);
    const err = await new Promise<any>((resolve) => {
        
        timeout.onabort = () => resolve(timeout.reason);
    });

    if (Bounce.isTimeout(err)) {
        expect.type<Error>(err);                       // Narrows type
        expect.type<'TimeoutError'>(err.name);         // Narrows name
    }

    Bounce.ignore(err, 'timeout');
    expect.type<'TimeoutError'>(err.name);             // Narrows name
}

expect.error(Bounce.isTimeout());
