# Error Cause

Status: Stage 4

Author: [@legendecas](https://github.com/legendecas)

Champion: [@legendecas](https://github.com/legendecas), [@hemanth](https://github.com/hemanth)

## Chaining Errors

Errors will be constructed to represent runtime abnormalities. To help
unexpected behavior diagnosis, errors need to be augmented with contextual
information like error messages, error instance properties to explain what
happened at the time.

If the error were thrown from deep internal methods, the thrown error may not
be straightforward to be easily conducted without proper exception design
pattern. Catching an error and throwing it with additional contextual data is
a common approach of error handling pattern. Multiple methods are available to
augment the caught error with additional contextual information:

```js
async function doJob() {
  const rawResource = await fetch('//domain/resource-a')
    .catch(err => {
      // How to wrap the error properly?
      // 1. throw new Error('Download raw resource failed: ' + err.message);
      // 2. const wrapErr = new Error('Download raw resource failed');
      //    wrapErr.cause = err;
      //    throw wrapErr;
      // 3. class CustomError extends Error {
      //      constructor(msg, cause) {
      //        super(msg);
      //        this.cause = cause;
      //      }
      //    }
      //    throw new CustomError('Download raw resource failed', err);
    })
  const jobResult = doComputationalHeavyJob(rawResource);
  await fetch('//domain/upload', { method: 'POST', body: jobResult });
}

await doJob(); // => TypeError: Failed to fetch
```

If the errors were chained with causes, it can be greatly helpful to diagnosing
unexpected exceptions. As the example above shows, quite a few laboring works
has to be done for a simple error handling case to augmenting the caught
error with contextual message. Besides, no consensus on which property will
representing the cause makes it not feasible for developer tools to revealing
contextual information of causes.

The proposed solution is adding an additional options parameter to the `Error()`
constructor with a `cause` property, the value of which will be assigned
to the error instances as a property. So errors can be chained without
unnecessary and overelaborate formalities on wrapping the errors in
conditions.

```js
async function doJob() {
  const rawResource = await fetch('//domain/resource-a')
    .catch(err => {
      throw new Error('Download raw resource failed', { cause: err });
    });
  const jobResult = doComputationalHeavyJob(rawResource);
  await fetch('//domain/upload', { method: 'POST', body: jobResult })
    .catch(err => {
      throw new Error('Upload job result failed', { cause: err });
    });
}

try {
  await doJob();
} catch (e) {
  console.log(e);
  console.log('Caused by', e.cause);
}
// Error: Upload job result failed
// Caused by TypeError: Failed to fetch
```

## Compatibilities

In Firefox, `Error()` constructor can receive two optional additional
positional parameters: `fileName`, `lineNumber`. Those parameters will be
assigned to newly constructed error instances with the name `fileName` and
`lineNumber` respectively.

However, no standard on either ECMAScript or Web were defined on such behavior.
Since the second parameter under this proposal must be an object with a `cause`
property, it will be distinguishable from a string.

## Implementations

Polyfills:
- [error-cause](https://www.npmjs.com/package/error-cause): An [es-shim] interface polyfill.
- [Pony Cause](https://github.com/voxpelli/pony-cause): Helpers to work with ECMAScript error cause and [VError] style error cause.

JavaScript Environments:
- Chrome, released on 93,
- Firefox, released on 91,
- Safari, released on 15,
- Node.js, released on [v16.9.0](https://nodejs.org/en/blog/release/v16.9.0/#error-cause).

## FAQs

### Differences with `AggregateError`

The key difference between those two is that the errors in the `AggregateError`
doesn't have to be related. `AggregateError` are just a bunch of errors just
happened to be caught and aggregated in one place, they can be totally
unrelated. E.g. `jobA` and `jobB` can do nothing to each other in
`Promise.allSettled([ jobA, jobB ])`. However, if an error were thrown from
several levels deep of `jobA`, the `cause` property can accumulate context
information of those levels to help understanding what happened exactly.

With `AggregateError`, we get breadth. With the `cause` property, we get depth.

### Why not custom subclasses of `Error`

While there are lots of ways to achieve the behavior of the proposal, if the
`cause` property is explicitly defined by the language, debug tooling can
reliably use this info rather than contracting with developers to construct an
error properly.

[es-shim]: https://github.com/es-shims/api
[VError]: https://github.com/joyent/node-verror
