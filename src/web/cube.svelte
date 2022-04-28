<script>
import * as THREE from 'three';

export let scene;
export let render;
export let renderer;

$: renderer && reset();

const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
const material = new THREE.MeshPhongMaterial({color: 0x44aa88}); 
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);

const update = () => {
  cube.rotation.x += 0.02;
  cube.rotation.y += 0.02;
}

function* loopGen() {
  while (true) {
    update();
    yield;
  }
}
const loop = loopGen();

const frameCost = 1000 / 60;
let lastTimestamp; 
let rAF;

const wrap = (run) => () => {
  lastTimestamp = performance.now();

  rAF = requestAnimationFrame(run);
}

const step = () => {
  loop.next();
  rAF = requestAnimationFrame(render);
}
const run = () => {
  loop.next();
  render();
  rAF = requestAnimationFrame(run);
}

const limitFPS = () => {
  const now = performance.now();
  const elapsed = now - lastTimestamp;

  // 已经度过了一帧时间
  if (elapsed >= frameCost) {
    lastTimestamp = now;
    loop.next();
    render();
  }

  rAF = requestAnimationFrame(limitFPS);
};

const catchUp = () => {
  const now = performance.now();
  let elapsed = now - lastTimestamp;

  if (elapsed >= frameCost) {
    lastTimestamp = now;
    while (elapsed > frameCost) {
      loop.next();
      elapsed -= frameCost;
    }
    render();
  }

  rAF = requestAnimationFrame(catchUp);
};

const stop = () => {
  cancelAnimationFrame(rAF);
}
const reset = () => {
  cancelAnimationFrame(rAF);
  cube.rotation.x = Math.PI / 8;
  cube.rotation.y = Math.PI / 3;
  render();
}
</script>

<div class="control">
  <button on:click={step}>step</button>
  <button on:click={run}>run</button>
  <button on:click={wrap(limitFPS)}>limitFPS</button>
  <button on:click={wrap(catchUp)}>catchUp</button>
  <button on:click={stop}>stop</button>
  <button on:click={reset}>reset</button>
</div>

<style>
.control {
  margin: 10px 10px 0 10px;
}
</style>

