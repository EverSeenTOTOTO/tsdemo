<script>
import * as THREE from 'three';

export let scene;
export let render;

const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
const material = new THREE.MeshPhongMaterial({color: 0x44aa88}); 
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);

const update = () => {
  cube.rotation.x += 0.04;
  cube.rotation.y += 0.04;
}

function* loopGen() {
  while (true) {
    update();
    yield;
  }
}
const loop = loopGen();

const frameCost = 1000 / 75;
let lastTimestamp; 
let rAF;

const wrap = (run) => () => {
  lastTimestamp = 0;

  rAF = requestAnimationFrame(run);
}

const step = () => {
  loop.next();
  rAF = requestAnimationFrame(render);
}
const run = (time) => {
  const elapsed = time - lastTimestamp;

  console.log(elapsed);

  lastTimestamp = time;
  loop.next();
  render();
  rAF = requestAnimationFrame(run);
}

const limitFPS = (time) => {
  const elapsed = time - lastTimestamp;

  console.log(elapsed);

  // 已经度过了一帧时间
  if (elapsed >= frameCost) {
    lastTimestamp = time;
    loop.next();
    render();
  }

  rAF = requestAnimationFrame(limitFPS);
};

const catchUp = (time) => {
  let elapsed = time - lastTimestamp;

  console.log(elapsed);

  if (elapsed >= frameCost) {
    lastTimestamp = time;
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
  console.clear();
}
</script>

<div class="control">
  <button on:click={step}>step</button>
  <button on:click={wrap(run)}>run</button>
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

