<script>
import * as THREE from  'three';
import { onMount } from 'svelte';
import Cube from './cube.svelte';

// canvas
let canvas = {
  el: null,
  width: window.innerWidth * 0.9,
  height: window.innerHeight * 0.9,
};

window.addEventListener("optimizedResize", () => {
  canvas.width = window.innerWidth * 0.9,
  canvas.height = window.innerHeight * 0.9;
});

// camera
let cameraSetting = {
  fov: 75,
  aspect: window.innerWidth / window.innerHeight,
  near: 0.1,
  far: 10,
  position: {
    x: 0,
    y: 0,
    z: 2
  },
}
let camera = new THREE.PerspectiveCamera(
  cameraSetting.fov,
  cameraSetting.aspect,
  cameraSetting.near,
  cameraSetting.far
);
camera.position.set(
  cameraSetting.position.x, 
  cameraSetting.position.y, 
  cameraSetting.position.z
);

function resizeRendererToDisplaySize(renderer) {
  const c = renderer.domElement;
  const width = c.clientWidth;
  const height = c.clientHeight;
  const needResize = c.width !== width || c.height !== height;
  if (needResize) {
    renderer.setSize(width, height, false);
  }
  return needResize;
}

// light
let lightSetting = {
  color: 0x00ffff,
  intensity: 1.2,
  position: {
    x: 0,
    y: 0,
    z: 2
  },
};
let light = new THREE.DirectionalLight(
  lightSetting.color,
  lightSetting.intensity,
);
light.position.set(
  lightSetting.position.x,
  lightSetting.position.y,
  lightSetting.position.z
);

let renderer;
const scene = new THREE.Scene();

scene.add(light);

const render = () => {
  if(resizeRendererToDisplaySize(renderer)) {
    const c = renderer.domElement;
    camera.aspect = c.clientWidth / c.clientHeight;
    camera.updateProjectionMatrix();
  }

  renderer.render(scene, camera);
}

onMount(() => {
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.el,
  });
});
</script>

<Cube {scene} {render} {renderer} />
<canvas 
  class="canvas"
  width={canvas.width}
  height={canvas.height}
  bind:this={canvas.el}
>
</canvas>

<style>
.canvas {
  margin: 10px;
}
</style>

