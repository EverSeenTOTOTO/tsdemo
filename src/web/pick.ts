import * as THREE from 'three';

export type BoxObject = THREE.Mesh<THREE.BoxGeometry, THREE.MeshPhongMaterial>;

export class PickHelper {
  raycaster: THREE.Raycaster;

  pickedObject?: BoxObject;

  pickedObjectSavedColor: number;

  constructor() {
    this.raycaster = new THREE.Raycaster();
    this.pickedObject = undefined;
    this.pickedObjectSavedColor = 0;
  }

  reset() {
    // 恢复上一个被拾取对象的颜色
    if (this.pickedObject) {
      this.pickedObject.material.emissive.setHex(this.pickedObjectSavedColor);
      this.pickedObject = undefined;
    }
  }

  pick(normalizedPosition: { x: number, y: number }, scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    // 发出射线
    this.raycaster.setFromCamera(normalizedPosition, camera);
    // 获取与射线相交的对象
    const intersectedObjects = this.raycaster.intersectObjects(scene.children) as THREE.Intersection<BoxObject>[];
    if (intersectedObjects.length > 0) {
      if (this.pickedObject !== intersectedObjects[0].object) {
        // selection changed
        this.reset();
        // 找到第一个对象，它是离鼠标最近的对象
        this.pickedObject = intersectedObjects[0].object;
        // 保存它的颜色
        this.pickedObjectSavedColor = this.pickedObject.material.emissive.getHex();
        // 设置它的发光为 黄色/红色闪烁
        this.pickedObject.material.emissive.setHex(0xaaaaaa);
      }
    } else {
      this.reset();
    }
  }
}
