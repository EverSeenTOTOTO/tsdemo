<script>
import * as THREE from  'three';
import GUI from 'lil-gui';
import { onMount } from 'svelte';
import Demo from './cube.svelte';
import { PickHelper } from './pick'
import { getCanvasRelativePosition } from './utils'
import { DragControls } from 'three/examples/jsm/controls/DragControls.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

const gui = new GUI();

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

$: {
  camera.fov = cameraSetting.fov;
  camera.aspect = cameraSetting.aspect;
  camera.near = cameraSetting.near;
  camera.far = cameraSetting.far;
  camera.position.set(
    cameraSetting.position.x, 
    cameraSetting.position.y, 
    cameraSetting.position.z
  );
  camera.updateProjectionMatrix();
  requestAnimationFrame(render);
}

const cameraFolder = gui.addFolder("Camera");
cameraFolder.add(cameraSetting, 'fov', 1, 180)
    .onChange(() => {
      cameraSetting.fov = cameraSetting.fov;
    })
cameraFolder.add(cameraSetting, 'aspect', 0.1, 10)
    .onChange(() => {
      cameraSetting.aspect = cameraSetting.aspect;
    })
cameraFolder.add(cameraSetting, 'near', 0.1, 10)
    .onChange(() => {
      cameraSetting.near = cameraSetting.near;
    })
cameraFolder.add(cameraSetting, 'far', 0.1, 10)
    .onChange(() => {
      cameraSetting.far = cameraSetting.far;
    })
cameraFolder.add(cameraSetting.position, 'x', -10, 10)
    .onChange(() => {
      cameraSetting.position.x = cameraSetting.position.x;
    })
cameraFolder.add(cameraSetting.position, 'y', -10, 10)
    .onChange(() => {
      cameraSetting.position.y = cameraSetting.position.y;
    })
cameraFolder.add(cameraSetting.position, 'z', -10, 10)
    .onChange(() => {
      cameraSetting.position.z = cameraSetting.position.z;
    })

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

$: {
  light.color.set(lightSetting.color);
  light.intensity = lightSetting.intensity;
  light.position.set(
    lightSetting.position.x,
    lightSetting.position.y,
    lightSetting.position.z
  );
  requestAnimationFrame(render);
}

const lightFolder = gui.addFolder("Light");
lightFolder.addColor(lightSetting, 'color')
  .onChange(() => {
    lightSetting.color = lightSetting.color;
  })
lightFolder.add(lightSetting, 'intensity', 0, 2)
  .onChange(() => {
    lightSetting.intensity = lightSetting.intensity;
  })
lightFolder.add(lightSetting.position, 'x', -5, 5)
  .onChange(() => {
    lightSetting.position.x = lightSetting.position.x
  })
lightFolder.add(lightSetting.position, 'y', -5, 5)
  .onChange(() => {
    lightSetting.position.y = lightSetting.position.y
  })
lightFolder.add(lightSetting.position, 'z', -5, 5)
  .onChange(() => {
    lightSetting.position.z = lightSetting.position.z
  })
lightFolder.close();

let renderer;
const scene = new THREE.Scene();

scene.add(light);

// picker 
const pickPosition = {
  x: -9999,
  y: -9999,
}

const pickFolder = gui.addFolder("Picker")
const px = pickFolder.add(pickPosition, 'x')
const py = pickFolder.add(pickPosition, 'y')
pickFolder.close();

const picker = new PickHelper();

function setPickPosition(event) {
  const pos = getCanvasRelativePosition(event, canvas.el);
  pickPosition.x = (pos.x / canvas.width ) *  2 - 1;
  pickPosition.y = (pos.y / canvas.height) * -2 + 1;  // note we flip Y
  px.updateDisplay();
  py.updateDisplay();
  picker.pick(pickPosition, scene, camera)
  requestAnimationFrame(render);
}
function clearPickPosition() { 
  // 对于触屏，不像鼠标总是能有一个位置坐标，
  // 如果用户不在触摸屏幕，我们希望停止拾取操作。
  // 因此，我们选取一个特别的值，表明什么都没选中
  pickPosition.x = -9999;
  pickPosition.y = -9999;
  px.updateDisplay();
  py.updateDisplay();
  picker.pick(pickPosition, scene, camera)
  requestAnimationFrame(render);
}

window.addEventListener('mousemove', setPickPosition);
window.addEventListener('mouseout', clearPickPosition);
window.addEventListener('mouseleave', clearPickPosition);

const render = (time) => {
  if (!renderer) return;
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
    antialias: true
  });
  requestAnimationFrame(render)
});

const setupControls = ({ detail }) => {
  const controlsFolder = gui.addFolder("Controls");
  const controls = {
    drag: false,
    orbit: true
  };
  const cube = detail.cube;
  const dragControls = new DragControls([cube], camera, canvas.el);
  dragControls.addEventListener('drag', () => {
    requestAnimationFrame(render)
    // FIXME: need update gui
  });
  dragControls.enabled = controls.drag;

  const orbitControls = new OrbitControls(camera, canvas.el);
  orbitControls.update();
  orbitControls.addEventListener( 'change', render )
  orbitControls.enabled = controls.orbit;

  controlsFolder.add(controls, 'drag')
    .onChange(() => { dragControls.enabled = controls.drag; });
  controlsFolder.add(controls, 'orbit')
    .onChange(() => { orbitControls.enabled = controls.orbit;});
}
</script>

<Demo {gui} {scene} {render} on:cube={setupControls}/>
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

