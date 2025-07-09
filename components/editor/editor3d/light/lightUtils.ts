import * as THREE from 'three'
import { Mesh } from 'three'
import { obj3DPos } from '../dataStructure/dataStructure'

// 环境光
function generateAmbientLight(color: number = 0x000000) {
  const ambientLight = new THREE.AmbientLight(color, 1)
  return ambientLight
}

// 平行光
function generateDirectionalLight(
  obj: Mesh,
  directionalLightPos: obj3DPos,
  color: number = 0xfff27e
) {
  // lightyellow 0xffffe0
  // lightgoldenrodyellow 0xfafad2
  // lightblue 0xadd8e6
  // lightcoral 0xf08080
  // lightgreen 0x90ee90

  // let directionalLight = new THREE.DirectionalLight(0xf0f0f0, .3);
  let directionalLight = new THREE.DirectionalLight(0xffffe0, 1)
  directionalLight.position.set(
    directionalLightPos.x,
    directionalLightPos.y,
    directionalLightPos.z
  )
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048

  // 0.00 <---> 0.05 最好的区间
  directionalLight.shadow.bias = -0.00005 // 平面
  directionalLight.shadow.normalBias = 0.0 // 圆形表面，缩小受影响的网格，使其不会在自身上投射阴影
  // directionalLight.shadow.camera.left = -50;
  // directionalLight.shadow.camera.right = 50;
  // directionalLight.shadow.camera.top = 50;
  // directionalLight.shadow.camera.bottom = -50;
  directionalLight.visible = true
  directionalLight.target = obj
  return directionalLight
}

function generateSpotLight(spotLightPos: obj3DPos, color: number = 0xfff27e) {
  let spotLight = new THREE.SpotLight(0xfafad2)
  spotLight.position.set(spotLightPos.x, spotLightPos.y, spotLightPos.z)
  spotLight.castShadow = true
  spotLight.visible = true
  return spotLight
}

export { generateAmbientLight, generateDirectionalLight, generateSpotLight }
