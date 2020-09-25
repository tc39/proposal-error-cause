# Error Cause

Status: Stage 1

Author: [@legendecas](https://github.com/legendecas)

Champion: [@legendecas](https://github.com/legendecas), [@hemanth](https://github.com/hemanth)

## Chaining Errors

Errors will be constructed to represent runtime abnormalities. To help
unexpected behavior diagnosis, errors need to be augmented with contextual
information like error messages, error instance properties to explain what
happened at the time.

If the error were thrown from deep internal methods, the thrown error may not
be straightforward to be easily conducted without proper exception design
pattern. Catching an error and re-thrown it with specialized contextual data is
a common approach of error handling pattern. Multiple methods are available to
augment the caught error with additional contextual information:

```js
async function getSolution() {
  const rawResource = await fetch('//domain/resource-a')
    .catch(err => {
      // How to wrap the error properly?
      // 1. throw new Error('Download raw resource failed: ' + err.message);
      // 2. const wrapErr = new Error('Download raw resource failed');
      //    wrapErr.cause = err;
      //    throw wrapErr;
      // 3. class CustomError {
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
has to be done for a simple error handling case to augmenting the re-thrown
error with the cause. Besides, no consensus on which property will representing
the cause makes it not feasible for developer tools to revealing contextual
information of causes.

The proposed solution is adding an additional parameter `cause` to the
`Error()` constructor, and the value of the parameter will be assigned to
the error instances as a property. So errors can be chained without
unnecessary and overelaborate formalities on wrapping the errors in
conditions.

```js
async function doJob() {
  const rawResource = await fetch('//domain/resource-a')
    .catch(err => {
      throw new Error('Download raw resource failed', err);
    });
  const jobResult = doComputationalHeavyJob(rawResource);
  await fetch('//domain/upload', { method: 'POST', body: jobResult })
    .catch(err => {
      throw new Error('Upload job result failed', err);
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

## FAQs

### Differences with `AggregateError`

The key difference between those two is that the errors in the `AggregateError`
doesn't have to be related. `AggregateError` are just a bunch of errors just
happened to be caught and aggregated in one place, they can be totally
unrelated. E.g. `jobA` and `jobB` can do nothing to each other in
`Promise.allSettled(jobA, jobB)`. However, if an error were thrown from
several levels deep of `jobA`, the `cause` property can accumulate context
information of those levels to help understanding what happened exactly.

With `AggregateError`, we get breadth. With the `cause` property, we get depth.

### Why not custom subclasses of `Error`

While there are lots of ways to achieve the behavior of the proposal, if the
`cause` property is explicitly defined by the language, debug tooling can
reliably use this info rather than contracting with developers to construct an
error properly.
