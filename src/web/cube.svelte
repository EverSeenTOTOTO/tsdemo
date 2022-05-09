<script>
import { createEventDispatcher, onMount } from 'svelte';

import * as THREE from 'three';

export let gui;
export let scene;
export let render;

const cubeProps = {
  color: 0x1447cf,
  rx: 0,
  ry: 0,
  rz: 0,
  FPS: 60
}

const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
  const material = new THREE.MeshPhongMaterial({ color: cubeProps.color }); 
const cube = new THREE.Mesh(geometry, material);

$: {
  cube.material.color.set(cubeProps.color)
  cube.rotation.x = cubeProps.rx;
  cube.rotation.z = cubeProps.rz;
  cube.rotation.y = cubeProps.ry;
  rx.updateDisplay();
  ry.updateDisplay();
  rz.updateDisplay();
  requestAnimationFrame(render)
}


const cubeFolder = gui.addFolder("Cube")
cubeFolder.addColor(cubeProps, 'color')
    .onChange((value) => {
        // explicitly call set
        cubeProps.color = cubeProps.color;
    });

const rx = cubeFolder.add(cubeProps, 'rx', 0, Math.PI * 2, 0.01)
    .onChange(() => {
        cubeProps.rx = cubeProps.rx;
    })
const ry = cubeFolder.add(cubeProps, 'ry', 0, Math.PI * 2, 0.01)
    .onChange(() => {
        cubeProps.ry = cubeProps.ry;
    })
const rz = cubeFolder.add(cubeProps, 'rz', 0, Math.PI * 2, 0.01)
    .onChange(() => {
        cubeProps.rz = cubeProps.rz;
    })

scene.add(cube);

const dispatch = createEventDispatcher();
onMount(() => dispatch('cube', { cube }))

const update = () => {
  cubeProps.rx += 0.04;
  cubeProps.ry += 0.04;
}

function* loopGen() {
  while (true) {
    update();
    yield;
  }
}
const loop = loopGen();

let frameCost = 1000 / cubeProps.FPS;
let lastTimestamp; 
let rAF;

$: frameCost = 1000 / cubeProps.FPS;

cubeFolder.add(cubeProps, 'FPS', 10, 100)
    .onChange(() => {
      cubeProps.FPS = cubeProps.FPS;
    });

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


  lastTimestamp = time;
  loop.next();
  render(time);
  rAF = requestAnimationFrame(run);
}

const catchUp = (time) => {
  let elapsed = time - lastTimestamp;


  if (elapsed >= frameCost) {
    lastTimestamp = time;
    while (elapsed > frameCost) {
      loop.next();
      elapsed -= frameCost;
    }
    render(time);
  }

  rAF = requestAnimationFrame(catchUp);
};

const stop = () => {
  cancelAnimationFrame(rAF);
}
const reset = () => {
  cancelAnimationFrame(rAF);
  requestAnimationFrame(render);
  cubeProps.rx = 0;
  cubeProps.ry = 0;
  cubeProps.rz = 0;
}

reset();
</script>

<div class="control">
  <button on:click={step}>step</button>
  <button on:click={wrap(run)}>run</button>
  <button on:click={wrap(catchUp)}>catchUp</button>
  <button on:click={stop}>stop</button>
  <button on:click={reset}>reset</button>
</div>

<style>
.control {
  margin: 10px 10px 0 10px;
}
</style>

