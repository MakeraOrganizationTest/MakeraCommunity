import * as THREE from 'three'
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader'

/**
 * Generate STL file thumbnail
 * @param {File|string} source - File object or URL
 * @param {number} size - Thumbnail size, default 256
 * @param {number} aspectRatio - Image aspect ratio (width/height), default 4/3
 * @param {(progress: number) => void} onProgress - Progress callback function, receives progress percentage (0-100)
 * @returns {Promise<string|null>} Returns thumbnail Base64, returns null if not STL
 */
export function generateSTLThumbnail(
  source: File | string,
  size = 256,
  aspectRatio = 4 / 3,
  onProgress?: (progress: number) => void
): Promise<string | null> {
  return new Promise((resolve, reject) => {
    const reportProgress = (progress: number) => {
      if (onProgress) {
        onProgress(Math.min(100, Math.max(0, progress)))
      }
    }

    const loader = new STLLoader()
    const scene = new THREE.Scene()

    // 根据宽高比计算宽度和高度
    const width = size
    const height = Math.round(size / aspectRatio)

    const camera = new THREE.PerspectiveCamera(45, aspectRatio, 0.1, 1000)
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setSize(width, height)
    renderer.setClearColor(0x8a9795, 1) // 自定义背景颜色 #8a9795
    renderer.shadowMap.enabled = true // 启用阴影
    renderer.shadowMap.type = THREE.PCFSoftShadowMap // 使用柔和阴影
    renderer.domElement.style.display = 'none'
    document.body.appendChild(renderer.domElement)

    // 清理资源的函数
    const cleanup = () => {
      try {
        if (
          renderer.domElement &&
          document.body.contains(renderer.domElement)
        ) {
          document.body.removeChild(renderer.domElement)
        }
        renderer.dispose()
      } catch (error) {
        console.warn(
          'Error occurred while cleaning up renderer resources:',
          error
        )
      }
    }

    // 检查文件类型
    const isSTL = (src: File | string) => {
      if (typeof src === 'string') return src.toLowerCase().endsWith('.stl')
      if (src instanceof File) return src.name.toLowerCase().endsWith('.stl')
      return false
    }

    // 报告初始进度
    reportProgress(0)

    if (!isSTL(source)) {
      cleanup()
      resolve(null) // 非 STL 文件不进行处理
      return
    }

    // 报告文件检查完成
    reportProgress(10)

    // 公共渲染逻辑
    const renderModel = (geometry: THREE.BufferGeometry) => {
      try {
        // 报告几何体解析完成
        reportProgress(50)

        // 使用白色材质以获得干净的外观，启用阴影接收和投射
        const material = new THREE.MeshLambertMaterial({
          color: 0xffffff,
          side: THREE.DoubleSide
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.castShadow = true // 投射阴影
        mesh.receiveShadow = true // 接收阴影
        scene.add(mesh)

        geometry.computeBoundingBox()

        // 检查边界框是否存在
        if (!geometry.boundingBox) {
          cleanup()
          reject(new Error('Unable to calculate model bounding box'))
          return
        }

        const center = new THREE.Vector3()
        geometry.boundingBox.getCenter(center)
        mesh.position.sub(center)

        const sizeVec = new THREE.Vector3()
        geometry.boundingBox.getSize(sizeVec)
        const maxDim = Math.max(sizeVec.x, sizeVec.y, sizeVec.z)

        // 防止除零错误
        if (maxDim === 0) {
          cleanup()
          reject(new Error('Model size is zero'))
          return
        }

        // 报告模型分析完成
        reportProgress(65)

        // 添加一个几乎透明的地面来接收轻微阴影
        const groundGeometry = new THREE.PlaneGeometry(maxDim * 4, maxDim * 4)
        const groundMaterial = new THREE.MeshLambertMaterial({
          color: 0x8a9795,
          transparent: true,
          opacity: 0.05 // 更加透明，减少阴影强度
        })
        const ground = new THREE.Mesh(groundGeometry, groundMaterial)
        ground.rotation.x = -Math.PI / 2 // 旋转90度使其水平
        ground.position.y = geometry.boundingBox.min.y - maxDim * 0.1 // 放置在模型底部稍下方
        ground.receiveShadow = true // 接收阴影
        scene.add(ground)

        // 基于模型尺寸计算最佳相机位置
        const distance = maxDim * 2.0

        // 分析模型形状以确定最佳观察角度
        const ratioXY = sizeVec.x / sizeVec.y
        const ratioXZ = sizeVec.x / sizeVec.z
        const ratioYZ = sizeVec.y / sizeVec.z

        // 默认的前上右观察角度
        let cameraX = distance * 0.5
        let cameraY = distance * 0.3
        let cameraZ = distance * 0.8

        // 根据模型比例调整相机位置
        if (sizeVec.z > sizeVec.x && sizeVec.z > sizeVec.y) {
          // 模型在 Z 方向较高 - 从侧面角度观察
          cameraX = distance * 0.7
          cameraY = distance * 0.4
          cameraZ = distance * 0.6
        } else if (sizeVec.y > sizeVec.x && sizeVec.y > sizeVec.z) {
          // 模型在 Y 方向较宽 - 从前面角度观察
          cameraX = distance * 0.3
          cameraY = distance * 0.7
          cameraZ = distance * 0.6
        } else if (sizeVec.x > sizeVec.y && sizeVec.x > sizeVec.z) {
          // 模型在 X 方向较长 - 从前上角度观察以展示正面
          cameraX = distance * 0.6
          cameraY = distance * 0.5
          cameraZ = distance * 0.5
        }

        // 确保相机位置能够最佳地展示模型
        camera.position.set(cameraX, cameraY, cameraZ)
        camera.lookAt(0, 0, 0)

        // 添加适中的环境光用于基础照明，保持模型明亮
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
        scene.add(ambientLight)

        // 添加从相机方向的主定向光，启用轻微阴影
        const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
        mainLight.position.set(cameraX * 0.8, cameraY * 0.8, cameraZ * 0.8)
        mainLight.target.position.set(0, 0, 0)
        mainLight.castShadow = true // 启用阴影投射
        mainLight.shadow.mapSize.width = 512 // 降低阴影贴图分辨率以减轻阴影
        mainLight.shadow.mapSize.height = 512
        mainLight.shadow.camera.near = 0.5
        mainLight.shadow.camera.far = distance * 3
        mainLight.shadow.camera.left = -maxDim * 2
        mainLight.shadow.camera.right = maxDim * 2
        mainLight.shadow.camera.top = maxDim * 2
        mainLight.shadow.camera.bottom = -maxDim * 2
        mainLight.shadow.bias = -0.0001 // 减少阴影痤疮
        scene.add(mainLight)
        scene.add(mainLight.target)

        // 添加补充光，增强细节可见性并减轻阴影
        const fillLight = new THREE.DirectionalLight(0xffffff, 0.25)
        fillLight.position.set(-cameraX * 0.5, -cameraY * 0.3, cameraZ * 0.8)
        scene.add(fillLight)

        // 报告渲染设置完成
        reportProgress(85)

        renderer.render(scene, camera)
        const thumbnail = renderer.domElement.toDataURL('image/png')

        // 报告完成
        reportProgress(100)

        // 清理
        cleanup()
        resolve(thumbnail)
      } catch (error) {
        cleanup()
        reject(error)
      }
    }

    // 处理文件或 URL
    if (typeof source === 'string') {
      loader.load(
        source,
        renderModel,
        progress => {
          // 文件加载进度：10% - 50%
          const loadProgress = 10 + (progress.loaded / progress.total) * 40
          reportProgress(loadProgress)
        },
        error => {
          cleanup()
          reject(error)
        }
      )
    } else if (source instanceof File) {
      const reader = new FileReader()

      reader.onprogress = event => {
        if (event.lengthComputable) {
          // 文件读取进度：10% - 30%
          const readProgress = 10 + (event.loaded / event.total) * 20
          reportProgress(readProgress)
        }
      }

      reader.onload = () => {
        try {
          const arrayBuffer = reader.result

          // 检查结果是否为 ArrayBuffer
          if (!arrayBuffer || typeof arrayBuffer === 'string') {
            cleanup()
            reject(new Error('Failed to read file'))
            return
          }

          // 报告文件读取完成
          reportProgress(30)

          const geometry = loader.parse(arrayBuffer)
          renderModel(geometry)
        } catch (error) {
          cleanup()
          reject(error)
        }
      }
      reader.onerror = () => {
        cleanup()
        reject(new Error('Failed to read file'))
      }
      reader.readAsArrayBuffer(source)
    } else {
      cleanup()
      resolve(null)
    }
  })
}
