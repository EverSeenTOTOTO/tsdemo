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

cube.rotation.x = Math.PI / 8;
cube.rotation.y = Math.PI / 3;


scene.add(cube);
</script>
