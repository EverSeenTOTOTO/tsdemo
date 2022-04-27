<script>
import { onMount } from 'svelte';
import * as THREE from  'three';

let canvas = {
  el: null,
  clazz: "canvas",
  width: window.innerWidth,
  height: window.innerHeight
};

// repaint if resized
window.addEventListener("optimizedResize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
});

const fov = 75;
const aspect = 2;  // 相机默认值
const near = 0.1;
const far = 5;
const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
camera.position.z = 2;

const scene = new THREE.Scene();

const boxWidth = 1;
const boxHeight = 1;
const boxDepth = 1;
const geometry = new THREE.BoxGeometry(boxWidth, boxHeight, boxDepth);
const material = new THREE.MeshPhongMaterial({color: 0x44aa88}); 
const cube = new THREE.Mesh(geometry, material);

scene.add(cube);

const color = 0xFFFFFF;
const intensity = 1;
const light = new THREE.DirectionalLight(color, intensity);
light.position.set(-1, 2, 4);
scene.add(light);

const render = (time) => {
  time *= 0.001;  // 将时间单位变为秒
 
  cube.rotation.x = time;
  cube.rotation.y = time;
 
  renderer.render(scene, camera);
 
  requestAnimationFrame(render);
}

let renderer;

$: if (renderer) {
  console.log("resize renderer");
  renderer.setSize(canvas.width, canvas.height);
  requestAnimationFrame(render);
}

onMount(() => {
  renderer = new THREE.WebGLRenderer({
    canvas: canvas.el,
  });
});
</script>

{@debug canvas}

<canvas 
  class={canvas.clazz}
  width={canvas.width}
  height={canvas.height}
  bind:this={canvas.el}
>
</canvas>

<style>
.canvas {
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
}
</style>
