import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'
import * as THREE from 'three'

let per = 0

const mockSTLTypeData = {
  stlUrl: 'https://timewant.oss-cn-beijing.aliyuncs.com/3D/ntd.stl'
}

type MTLOBJType = {
  mtlUrl: string
  objUrl: string
}

type ModelTYpe = {
  modelUrl: string
  imgUrl: string
  modelBuffer?: Uint8Array
}

type STLType = {
  stlUrl: string
}

function getLoadPer(): number {
  return per
}

function imgTextureLoader(modelFile: ModelTYpe) {
  return new Promise(resolve => {
    const textureLoader = new THREE.TextureLoader()
    textureLoader.load(modelFile.imgUrl, resolve)
  })
}

function stlLoader(modelFile: STLType) {
  let onProgress = (xhr: any) => {
    if (xhr.lengthComputable) {
      var percentComplete = (xhr.loaded / xhr.total) * 100
      per = Math.round(percentComplete)
    }
  }

  return new Promise((resolve, reject) => {
    const loader = new STLLoader()
    loader.load(modelFile.stlUrl, resolve, onProgress, reject)
  })
}

export type { MTLOBJType, ModelTYpe, STLType }

export { getLoadPer, imgTextureLoader, stlLoader, mockSTLTypeData }
