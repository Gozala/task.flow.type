# @task.flow/type

[![travis][travis.icon]][travis.url]
[![package][version.icon] ![downloads][downloads.icon]][package.url]
[![styled with prettier][prettier.icon]][prettier.url]

Interface definitions for [task.flow][] library.

### `Task<x, a>`

Task is a fundamental abstraction that represents asynchronous effects that may fail. Type parameter `x` represents an error in case of failure and type parameter `a` represents a value task will produce in case of success.

Task is required to implement a single method `spawn` that will be given a refence to the execution "thread" (not a thread in OS terms but rather a concurrent exectuion stack that can be parked / unparked) and is required to return `Future<x, a>` bound to the given execution `thread`.

```js
export interface Task<+x, +a> {
  spawn(Thread): Future<x, a>;
}
```

**Note:** Task's in [task.flow][] library reseamble [`Promise`][] but there are some fundamental differences:

- [`Promise`][] represents result of async operation that is already in flight. Task on the other hand represents async operation itself which explicitly must be performed.
- [`Promise`][] has typechecker unfriendly API (as it implicitly unwraps promises) and captures runtime errors, so [flow][] / [TypeScript][] are very vague when worknig with them. `Task` API on the other hand has being designed with typecheker in mind so that both error and success results can be inferred and proper handling ensured.
- Unlike [`Promise`][] incomplete `Task` can be aborted. If you think about, since [`Promise`][] is result of the operation aborting result does not make sense but aborting not yet complete task does.

### `Future<x, a>`

`Future` in [task.flow][] represents state-machine of runnig task and there for it is more similar to a [`Promise`][]. But unlike [`Promise`][] they are not meant for user code, instead they are fully handled by an task scheduler.

```js
export interface Future<+x, +a> {
  poll(): Poll<x, a>;
  abort(): void;
}
```

Scheduler will call `poll` method to check the status of the corresponding task to which future can repond with `Success<a>` if task is completed successfully, with `Fail<x>` if task failed or with `Wait` to indicate that task is not complete yet. `Poll<x, a>` is just a handly alias for all of this options.

```js
export type Poll<x, a> = Wait | Fail<x> | Succeed<a>

export type Fail<x> = {
  isOk: false,
  error: x
}

export type Succeed<a> = {
  isOk: true,
  value: a
}

export type Wait = void | null
```

`Future` also must implement `abort` method which scheduler will call if correpsonding task is terminated. Not all operations could be cancelled and that is ok, it is not expected to undo the task. But if underlying operation can be cancelled this is a place to do that, it is also an opportunity to free up any resources. **Note:** If task was aborted it is guaranteed that scheduler will no longer `poll` the futue.

Since `Future`'s are only handled by a scheduler and never exposed to the user space code they can be recycled into a pool to reduce memory overhead, in fact all built-in tasks will recycle futures on completion. It is safe to do so in the `abort`, and also in `poll` as long as it returns `Success` or `Fail`.

### `Thread`

To get the full picture it is important to also understand `Thread` abstraction used by a scheduler. Once task is run it is given an instance which it can use to park (suspend) it and then `unpark` once async operation is complete. Note that parking will give you opaque handle that you will need later on to `unpark`. API choice might seem odd, but it enables schedule do a necessary bookkeeping and to prevent badly written task from missbehaving. **Note:** Thread will `poll` a future only when thread is unparked. It is ok to park / unpark thread multiple times from the same task it's just will `poll` corresponding future to check the status.

```js
export interface Thread {
  park(): Park;
  unpark(Park): void;
}
```

### `TaskAPI<+x, +a>`

Until JS and Flow gains support for [pipeline operator][] we need to pollute libraries with all the extra methods for readability. That is exactly what `TaskAPI` interface is about. It is still worth distinguishing `Task<x, a>` and `TaskAPI<x, a>` as it's better to accept arguments that are just `Task<x, a>` while for tasks as return values `TaskAPI<x, a>` is what users would expect. **Note**: For most common cases [`Task.io`][] will be enough and in all other cases you probably should just subclass `Task` class from [`Task.flow`] which comes with all of these methods.

```js
export interface TaskAPI<+x, +a> extends Task<x, a> {
  map<b>((a) => b): TaskAPI<x, b>;
  chain<b>((a) => Task<x, b>): TaskAPI<x, b>;
  capture<y>((x) => Task<y, a>): TaskAPI<y, a>;
  recover((x) => a): TaskAPI<empty, a>;
  format<y>((x) => y): TaskAPI<y, a>;
  select(Task<x, a>): TaskAPI<x, a>;
  couple<b>(Task<x, b>): TaskAPI<x, [a, b]>;
}
```

[task.io]: https://github.com/gozala/task.flow/#io
[pipeline operator]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Pipeline_operator
[flow]: http://flowtype.org/
[typescript]: http://typescriptlang.org/
[`promise`]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
[task.flow]: https://github.com/gozala/task.flow/
[travis.icon]: https://travis-ci.org/Gozala/task.flow.type.svg?branch=master
[travis.url]: https://travis-ci.org/Gozala/task.flow.type
[version.icon]: https://img.shields.io/npm/v/@task.flow/type.svg
[downloads.icon]: https://img.shields.io/npm/dm/@task.flow/type.svg
[package.url]: https://npmjs.org/package/@task.flow/type
[downloads.image]: https://img.shields.io/npm/dm/@task.flow/type.svg
[downloads.url]: https://npmjs.org/package/@task.flow/type
[prettier.icon]: https://img.shields.io/badge/styled_with-prettier-ff69b4.svg
[prettier.url]: https://github.com/prettier/prettier
