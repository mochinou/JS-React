# Homework — JavaScript Runtime and Async

### 1. How your closure keeps the task counter private
The `count` variable is declared inside the `createTask` function scope. Because of lexical scoping, the inner methods (`getCount`, `reset`, `run`) retain access to this variable via closure. Code outside the function cannot directly read or write `count`, making it private.

### 2. How the call stack works in one example from your application
When `runSequential()` is called:
1. `runSequential` is pushed to the Call Stack.
2. It calls `runTask(taskUsers, 'users')` which is pushed onto the stack.
3. Inside it, `task.run()` is invoked and pushed to the stack.
4. Inside `task.run()`, `setTimeout` is sent to the browser Web APIs, and the returned Promise is awaited.
5. When functions finish, they are popped off the Call Stack (LIFO: Last In, First Out).

### 3. How JavaScript can continue while setTimeout is waiting
JavaScript is single-threaded (it only has one Call Stack). When `setTimeout` is called, the timer is handled in the background by browser **Web APIs**. The main thread does not freeze; it continues executing subsequent synchronous code. Once the timer finishes, the callback is sent to the Task Queue.

### 4. Event Loop Demo: Predicted vs Actual Output

**Predicted Output:**
```text
1: Synchronous log
4: Inside async function
8: Synchronous end
5: After await (Microtask)
6: Promise 1 callback
7: Promise 2 callback
2: setTimeout 1 (0ms)
3: setTimeout 2 (10ms)