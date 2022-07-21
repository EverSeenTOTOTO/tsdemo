<script>
  const workerScript = (id, offset) => `
 onmessage = function(e) {
  const buffer = e.data;
  const id = ${id};
  const lock = new Int8Array(buffer);

  function getOwner() {
    return Atomics.load(lock, 0);
  }

  postMessage('${id} started, current owner: ' + getOwner());

  // simple exclusive lock
  function acquireLock() {
    while (Atomics.compareExchange(lock, 0, 0, id) !== 0); // 0 for free, id for owner
  }

  function releaseLock() {
    if (Atomics.load(lock, 0) !== id) {
      throw new Error("Can not release as thread ${id} don't own the lock")
    }
 
    Atomics.store(lock, 0, 0);
  }

  setTimeout(() => {
    acquireLock(lock);
    postMessage('${id}: acq lock, current owner: ' + getOwner());

    setTimeout(() => {
      releaseLock(lock);
      postMessage('${id}: rel lock');
    }, 2000)
  }, 1000 + id * 500)
 }
 `;

  const memory = new SharedArrayBuffer(1);
  const now = performance.now();

  const worker1 = new Worker(URL.createObjectURL(new Blob([workerScript(1)])));
  const worker2 = new Worker(URL.createObjectURL(new Blob([workerScript(2)])));
  const onmessage = (e) => console.log(`${performance.now() - now}: ${e.data}`);

  worker1.onmessage = onmessage;
  worker2.onmessage = onmessage;

  worker1.postMessage(memory);
  worker2.postMessage(memory);
</script>

<h1 class="title">Locks</h1>

<style>
  .title {
    position: absolute;
    top: 0;
    left: 50%;
    transform: translateX(-50%);
  }
</style>
