<script>
const workerScript = (name) => `
onmessage = function(e) {
  const buffer = e.data;
  const view = new BigUint64Array(buffer);

 postMessage('${name}: thread start');
  for(let i=0; i<10000; ++i) {
    // view[0] ++;
    Atomics.add(view, 0, 1n);
  }
 postMessage('${name}: thread done');
}
`;

const blob2DataUrl = (blob) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = (e) => resolve(e.target?.result);
  reader.onerror = (e) => reject(e);
  reader.readAsDataURL(blob);
});

const buffer = new SharedArrayBuffer(8);
const view = new BigUint64Array(buffer);

view[0] = 0n;

const worker1 = new Worker(URL.createObjectURL(new Blob([workerScript(1)])));
const worker2 = new Worker(`data:application/javascript,${encodeURIComponent(workerScript(2))}`);
const worker3p = blob2DataUrl(new Blob([workerScript(3)])).then(dataUrl => new Worker(dataUrl));
 
let done = 0;
const onmessage = (e) => {
  console.log(e.data);
  if(/done/.test(e.data)) {
    done++;
  }
}
worker1.onmessage = onmessage;
worker2.onmessage = onmessage;

worker1.postMessage(buffer);
worker2.postMessage(buffer);
worker3p.then(worker3 => {
  worker3.onmessage = onmessage;
  worker3.postMessage(buffer);
});

new Promise(res => {
    const interval = setInterval(() => {
        if(done >= 3) {
            clearInterval(interval);
            res();
        }
    }, 1000)
  }).then(() => console.log(view[0]))
</script>

<h1 class="title">Keep Learning</h1>
