import * as THREE from 'three'

import { FontLoader } from 'three/examples/jsm/loaders/FontLoader'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry'

function fontLoader() {
  return new Promise(resolve => {
    const loader = new FontLoader()
  })
}

function setTextGeo(num: string, textFont: any) {
  let testGeometry = new TextGeometry(num, {
    font: textFont,
    size: 5,
    height: 0.5,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    curveSegments: 12,
    bevelEnabled: true
  })
  return testGeometry
}

function setTextMesh(num: Number, textFont: any) {
  let testGeometry = new TextGeometry(num.toString(), {
    font: textFont,
    size: 5,
    height: 0.5,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    curveSegments: 12,
    bevelEnabled: true
  })
  testGeometry.center()
  testGeometry.computeBoundingBox()
  const textMaterial = new THREE.MeshPhongMaterial()
  let numberMesh = new THREE.Mesh(testGeometry, textMaterial)
  return numberMesh
}

export { setTextMesh, setTextGeo }
