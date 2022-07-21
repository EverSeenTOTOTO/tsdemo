<script>
  const workerScript = (id, offset) => `
 onmessage = function(e) {
  const buffer = e.data;
  const id = ${id};
  const lock = new Int8Array(buffer);         // buffer[0] is lock
  const resource = new Int32Array(buffer, 4); // buffer[1~4] save owner count
  const TOTAL_RESOURCE_COUNT = 2;

  function getOwnerCount() {
    return Atomics.load(resource, 0);
  }

  postMessage('${id} started, current owns: ' + getOwnerCount());

  function P() {
    while(true) {
       // acquire lock
       while (Atomics.compareExchange(lock, 0, 0, id) !== 0);

       // update owner count
       if (Atomics.load(resource, 0) < TOTAL_RESOURCE_COUNT) {
          Atomics.add(resource, 0, 1);
          // dont forget to release lock
          Atomics.store(lock, 0, 0);
          break;
       }
 
       // quickly release lock
       Atomics.store(lock, 0, 0);
    }
  }

  function V() {
    // acquire lock
    while (Atomics.compareExchange(lock, 0, 0, id) !== 0);
    
    // update owner count
    Atomics.sub(resource, 0, 1);
    // release lock
    Atomics.store(lock, 0, 0);
  }

  setTimeout(() => {
    P(lock);
    postMessage('${id}: P, current owns: ' + getOwnerCount());

    setTimeout(() => {
      V(lock);
      postMessage('${id}: V, current owns: ' + getOwnerCount());
    }, 2000)
  }, 1000 + id * 500)
 }
 `;

  const memory = new SharedArrayBuffer(8); // 1st byte for lock, 4~8 for owner count
  const now = performance.now();

  const onmessage = (e) => console.log(`${performance.now() - now}: ${e.data}`);

  const createWorker = (id) => {
    const worker = new Worker(
      URL.createObjectURL(new Blob([workerScript(id)]))
    );

    worker.onmessage = onmessage;
    worker.postMessage(memory);
  };

  for (let i = 1; i < 5; ++i) createWorker(i);
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
