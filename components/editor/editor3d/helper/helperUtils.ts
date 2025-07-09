import * as THREE from 'three'
import {
  AxesHelper,
  BoxHelper,
  Camera,
  CameraHelper,
  GridHelper,
  Mesh,
  Object3D
} from 'three'
import { obj3DPos } from '../dataStructure/dataStructure'

type Helpers = {
  gridLine: GridHelper
  axes: AxesHelper
  cube: Mesh
  camera: CameraHelper
  box: BoxHelper
  directionalLight: THREE.DirectionalLight
  soptLight: THREE.SpotLight
}

function gridLineHelper() {
  const gridHelper = new GridHelper(500, 500, 0xffffff, 0x555555)
  return gridHelper
}

function axesHelper() {
  const axesHelper = new AxesHelper(500)
  return axesHelper
}

function cubeHelper(pos: obj3DPos, color: number) {
  var cubeGeo = new THREE.BoxGeometry(0.1, 0.1, 0.1)
  var cubeMat = new THREE.MeshLambertMaterial({
    color: color,
    wireframe: false
  })
  var cubeMesh = new THREE.Mesh(cubeGeo, cubeMat)
  cubeMesh.position.set(pos.x, pos.y, pos.z)
  return cubeMesh
}

function cameraHelper(camera: Camera) {
  const helper = new THREE.CameraHelper(camera)
  return helper
}

function generateBoundingBoxHelper(obj: Object3D, color: number = 0xff0000) {
  /*
    5____4
    1/___0/|
  | 6__|_7
    2/___3/
  const array = boxHelper.geometry.attributes.position.array;
  0: max.x, max.y, max.z 0  1  2
  1: min.x, max.y, max.z
  2: min.x, min.y, max.z
  3: max.x, min.y, max.z
  4: max.x, max.y, min.z
  5: min.x, max.y, min.z
  6: min.x, min.y, min.z 18 19 20
  7: max.x, min.y, min.z
*/
  const bdHelper = new THREE.BoxHelper(obj, color)
  return bdHelper
}

function generateDirectionalLightHelper(
  directionalLight: THREE.DirectionalLight
) {
  const lightHelper = new THREE.DirectionalLightHelper(directionalLight, 25)
  return lightHelper
}

function generateSpotLightHelper(spotLight: THREE.SpotLight) {
  const lightHelper = new THREE.SpotLightHelper(spotLight, 5)
  lightHelper.color = 0xfff27e
  return lightHelper
}

function generatePlaneHelper() {
  const planeGeometry = new THREE.PlaneGeometry(500, 500, 32, 32)
  const planeMaterial = new THREE.MeshStandardMaterial({
    color: '#ccae7f'
  })
  const plane = new THREE.Mesh(planeGeometry, planeMaterial)
  plane.rotation.x = -Math.PI / 2
  plane.receiveShadow = true // 开启平面接受投射阴影的效果
  return plane
}

export type { Helpers }

export {
  gridLineHelper,
  axesHelper,
  cubeHelper,
  generateBoundingBoxHelper,
  generateDirectionalLightHelper,
  generateSpotLightHelper,
  cameraHelper,
  generatePlaneHelper
}
