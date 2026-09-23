// 1. CLOSURE (Lecture 1: Slides 21-24)
// 'count' айнымалысы lexical environment-те сақталады және сырттан қол жетімсіз (private).
function createTask(taskName) {
  let count = 0; // private variable

  return {
    name: taskName,
    getCount: () => count,
    reset: () => {
      count = 0;
    },
    run: function () {
      count++;
      const time = Math.floor(Math.random() * 1500) + 500; // 500-2000 ms

      return new Promise((resolve, reject) => {
        setTimeout(() => {
          const success = Math.random() > 0.3; // 70% chance of success
          if (success) {
            resolve({ name: taskName, status: "Completed", time });
          } else {
            reject({ name: taskName, status: "Failed", time });
          }
        }, time);
      });
    }
  };
}

// Тасктарды құру
const taskUsers = createTask("Load Users");
const taskPosts = createTask("Load Posts");
const taskComments = createTask("Load Comments");

// UI-ды жаңартуға арналған қарапайым функция
async function runTask(task, elementKey) {
  const statusEl = document.getElementById(`status-${elementKey}`);
  const countEl = document.getElementById(`count-${elementKey}`);
  const timeEl = document.getElementById(`time-${elementKey}`);

  statusEl.innerText = "Loading...";
  statusEl.style.color = "orange";

  try {
    const result = await task.run();
    statusEl.innerText = result.status;
    statusEl.style.color = "green";
    countEl.innerText = task.getCount();
    timeEl.innerText = `${result.time} ms`;
    return result;
  } catch (error) {
    statusEl.innerText = error.status;
    statusEl.style.color = "red";
    countEl.innerText = task.getCount();
    timeEl.innerText = `${error.time} ms`;
    return error;
  }
}

function resetTask(task, elementKey) {
  task.reset();
  document.getElementById(`status-${elementKey}`).innerText = "Idle";
  document.getElementById(`status-${elementKey}`).style.color = "black";
  document.getElementById(`count-${elementKey}`).innerText = task.getCount();
  document.getElementById(`time-${elementKey}`).innerText = "-";
}

// 2. CONCURRENT EXECUTION: "Run All Tasks" (Lecture 2: Slide 17)
// Promise.allSettled барлық промистердің орындалуын күтеді (тіпті қате болса да)
async function runAllTasks() {
  const output = document.getElementById("outputMessage");
  output.innerText = "Running all tasks concurrently...";

  const startTime = Date.now();

  await Promise.allSettled([
    runTask(taskUsers, "users"),
    runTask(taskPosts, "posts"),
    runTask(taskComments, "comments")
  ]);

  const totalTime = Date.now() - startTime;
  output.innerText = `All tasks finished! Concurrent Total Time: ${totalTime} ms`;
}

// 3. SEQUENTIAL EXECUTION (Lecture 2: Slides 15-16)
// await бірінен соң бірін кезекпен күтеді
async function runSequential() {
  const output = document.getElementById("outputMessage");
  output.innerText = "Running tasks sequentially...";

  const startTime = Date.now();

  await runTask(taskUsers, "users");
  await runTask(taskPosts, "posts");
  await runTask(taskComments, "comments");

  const totalTime = Date.now() - startTime;
  output.innerText = `All tasks finished! Sequential Total Time: ${totalTime} ms`;
}

// 4. EVENT LOOP DEMO (Lecture 2: Slides 19-21)
// 2 timers, 2 Promise callbacks, 1 async function
function runEventLoopDemo() {
  console.clear();
  console.log("--- Event Loop Demo Start ---");

  console.log("1: Synchronous log");

  // Timer 1 (Task Queue / Macrotask)
  setTimeout(() => {
    console.log("2: setTimeout 1 (0ms)");
  }, 0);

  // Timer 2 (Task Queue / Macrotask)
  setTimeout(() => {
    console.log("3: setTimeout 2 (10ms)");
  }, 10);

  // Async function
  async function testAsync() {
    console.log("4: Inside async function");
    await Promise.resolve();
    console.log("5: After await (Microtask)");
  }
  testAsync();

  // Promise 1 (Microtask Queue)
  Promise.resolve().then(() => {
    console.log("6: Promise 1 callback");
  });

  // Promise 2 (Microtask Queue)
  Promise.resolve().then(() => {
    console.log("7: Promise 2 callback");
  });

  console.log("8: Synchronous end");
}