import { Component, createRef } from 'react'
import * as THREE from 'three'

import { MeshBVH } from 'three-mesh-bvh'

import { generateScene } from '../scene/sceneUtils'
import { generatePerspectiveCamera } from '../camera/cameraUtils'
import {
  generateAmbientLight,
  generateDirectionalLight
} from '../light/lightUtils'
import {
  gridLineHelper,
  axesHelper,
  cubeHelper,
  generateBoundingBoxHelper,
  generateDirectionalLightHelper
} from '../helper/helperUtils'
import { initOrbitControls } from '../controls/controlsUtils'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
// eslint-disable-next-line
import { STLType, mockSTLTypeData, stlLoader } from '../loader/loaderUtils'

import {
  fitCameraPos,
  fitCameraToCenteredObject,
  fitCameraToSixViews
} from '../tools/toolsUtils'

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  Mesh,
  DirectionalLightHelper,
  DirectionalLight,
  Group,
  Vector3,
  CameraHelper,
  SpotLight,
  SpotLightHelper,
  BoxHelper,
  BufferGeometry,
  Texture,
  OrthographicCamera
} from 'three'

import './editorMain.scss'
import { obj3DPos } from '../dataStructure/dataStructure'

import { Button, Input, Radio } from 'antd'
import TWEEN, { Tween } from '@tweenjs/tween.js'
import { AimOutlined, DownloadOutlined } from '@ant-design/icons'

import { TriangleSelection } from '../tools/selectionUtils'
import { isMobile } from '../tools/judgeUtils'

// 材质配置项定义
interface MaterialOption {
  name: string
  material: THREE.MeshPhysicalMaterial
}

type MaterialType = 'gypsum' | 'wood' | 'plastic' | 'glass'

const materialOptions: Record<MaterialType, MaterialOption> = {
  gypsum: {
    name: '石膏',
    material: new THREE.MeshPhysicalMaterial({
      color: 0xf7f3f0,
      bumpScale: 0.5,
      clearcoat: 0.5,
      clearcoatRoughness: 0.5,
      roughness: 0.9 // 粗糙度
    })
  },
  wood: {
    name: '木头',
    material: new THREE.MeshPhysicalMaterial({
      color: 0x9e7e5d,
      metalness: 0.0, // 金属度
      roughness: 0.9, // 粗糙度
      clearcoat: 0.1, // 清漆层
      clearcoatRoughness: 0.3 // 清漆层粗糙度
    })
  },
  plastic: {
    name: '塑料',
    material: new THREE.MeshPhysicalMaterial({
      color: 0x1e90ff,
      metalness: 0.0, // 无金属感
      roughness: 0.05, // 更光滑的表面，增强透明感
      clearcoat: 0.6, // 增加清漆层
      clearcoatRoughness: 0.05, // 非常光滑的清漆层
      transmission: 0.7, // 大幅增加透射值
      ior: 1.3, // 略微降低折射率
      envMapIntensity: 1.5 // 增加环境反射
    })
  },
  glass: {
    name: '金属',
    material: new THREE.MeshPhysicalMaterial({
      color: 0xd4af37,
      metalness: 1.0,
      roughness: 0.15,
      reflectivity: 1.0, // 反射率
      clearcoat: 0.3,
      clearcoatRoughness: 0.2,
      envMapIntensity: 1.0
    })
  }
}

class EditorMain extends Component<any, any> {
  private cvsDom!: HTMLCanvasElement
  public scene!: Scene
  private sceneControls!: OrbitControls
  public sceneTween!: Tween<any>
  private renderer!: WebGLRenderer
  private camera!: PerspectiveCamera | OrthographicCamera
  private cameraHelper!: CameraHelper
  public sceneLight!: DirectionalLight | SpotLight
  public boxHelper!: BoxHelper
  public lightPos!: obj3DPos
  private lightHelper!: DirectionalLightHelper | SpotLightHelper
  private lightCube!: Mesh
  private selectRef: any // Select组件的引用

  public sizeWidth!: number
  public sizeHeight!: number
  private loadModelGroup!: Group
  private loadModelMesh!: Mesh

  // public helpers!:

  // selection
  public selsectionApp!: TriangleSelection
  public saveTextMesh!: Mesh
  public loadFont!: any

  componentDidMount() {
    this.cvsDom = document.getElementById('editorCvs') as HTMLCanvasElement
    this.sizeWidth = window.innerWidth
    this.sizeHeight = window.innerHeight
    this.init()
  }

  componentDidUpdate() {
    try {
      // 路由刷新时
      // 只有在确保所有必要资源都加载完成、且模型仍在场景中时才执行
      if (
        this.camera &&
        this.loadModelMesh &&
        this.sceneControls &&
        this.scene.children.includes(this.loadModelMesh) &&
        this.props.shouldReloadModel // 只在需要重新加载模型时执行
      ) {
        // 先更新视图而不清除场景
        this.fitView()
      }
    } catch (error) {
      console.error('组件更新时出错:', error)
    }
  }

  constructor(props: any) {
    super(props)
    this.state = {
      saveSpeed: 0,
      radioValue: 1,
      viewDirection: 'front', // 默认为正视图
      currentMaterial: 'wood' as MaterialType // 默认使用木头材质
    }
  }

  // 材质变更处理函数
  public handleMaterialChange = (value: MaterialType) => {
    this.setState({ currentMaterial: value }, () => {
      this.updateModelMaterial()
    })
  }

  // 更新模型材质
  private updateModelMaterial = () => {
    const currentMaterial = this.state.currentMaterial as MaterialType
    if (this.loadModelMesh && materialOptions[currentMaterial]) {
      this.loadModelMesh.material = materialOptions[currentMaterial].material
      // 如果有特殊处理需求，可以在这里添加
    }
  }

  // 显示当前选择的材质名称
  renderMaterialName() {
    const currentMaterial = this.state.currentMaterial as MaterialType
    return materialOptions[currentMaterial].name
  }

  private init() {
    // const headerHeight = document.getElementsByClassName("HeaderLayout")[0].clientHeight;
    // const footerHeight = document.getElementsByClassName("FooterLayout")[0].clientHeight;
    const headerHeight = 0
    const footerHeight = 0
    const dHeight = headerHeight + footerHeight
    const rendererWidth = this.sizeWidth
    const rendererHeight = this.sizeHeight - dHeight
    const aspect = rendererWidth / rendererHeight

    this.initScene()
    this.initRenderer(this.cvsDom, rendererWidth, rendererHeight)

    this.initCamera(this.scene, aspect)
    this.initLight(this.scene)
    this.initControls(this.scene)

    this.LoopRender()
    this.initWindowResize()
    this.addListener()

    this.loadStlFile(mockSTLTypeData)
  }

  public loadStlFile(modelFile: STLType) {
    const res = stlLoader(modelFile)
    res.then((result: any) => {
      // 使用当前选择的材质
      const currentMaterial = this.state.currentMaterial as MaterialType
      const material = materialOptions[currentMaterial].material

      const mesh = new Mesh(result, material)
      mesh.geometry.boundsTree = new MeshBVH(mesh.geometry)
      mesh.castShadow = false
      mesh.receiveShadow = true
      this.loadModelMesh = mesh

      this.selsectionApp = new TriangleSelection(
        this.scene,
        this.renderer,
        this.camera,
        this.loadModelMesh
      )
      this.selsectionApp.selectionInit()
      this.selsectionApp.selectionRender()

      this.scene.add(mesh)
      this.selsectionApp.createHighlightMesh(mesh)

      // 这是正前方视角
      const bbox = new THREE.Box3().setFromObject(mesh)
      const size = new THREE.Vector3()
      bbox.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)

      // 将相机放在正前方，距离为物体最大尺寸的 2 倍
      this.camera.position.set(0, 0, maxDim * 2)
      this.camera.lookAt(0, 0, 0) // 确保相机看向场景中心
      this.initSceneLight(this.scene, mesh)

      // this.initHelper(this.scene)
    })
  }

  public setMeshConfig(geometry: BufferGeometry, texture: Texture) {
    texture.encoding = THREE.sRGBEncoding
    let material = new THREE.MeshToonMaterial()
    // let material = new THREE.MeshPhysicalMaterial();
    material.map = texture
    material.wireframe = false
    // material.wireframe = true;
    material.bumpScale = 0.5
    // material.clearcoat = 0.5;
    // material.clearcoatRoughness = 0.5;
    material.side = THREE.DoubleSide

    const mesh = new Mesh(geometry, material)
    mesh.geometry.boundsTree = new MeshBVH(mesh.geometry)

    // 这是斜45度角视角
    // fitCameraToCenteredObject(this.camera, mesh, 3 / 4, this.sceneControls);

    // 这是正前方视角
    const bbox = new THREE.Box3().setFromObject(mesh)
    const size = new THREE.Vector3()
    bbox.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)

    // 将相机放在正前方，距离为物体最大尺寸的 2 倍
    this.camera.position.set(0, 0, maxDim * 1.5)
    this.camera.lookAt(0, 0, 0) // 确保相机看向场景中心

    mesh.castShadow = false
    mesh.receiveShadow = true
    this.loadModelMesh = mesh

    this.selsectionApp = new TriangleSelection(
      this.scene,
      this.renderer,
      this.camera,
      this.loadModelMesh
    )
    this.selsectionApp.selectionInit()
    this.selsectionApp.selectionRender()

    this.scene.add(mesh)
    this.initSceneLight(this.scene, mesh)
    this.selsectionApp.createHighlightMesh(mesh)
    // normal Helper
    this.initHelper(this.scene)
  }

  public initScene(): void {
    this.scene = generateScene()
  }

  public sceneState() {
    console.log(this.scene)
  }

  private initRenderer(
    cvs: HTMLCanvasElement,
    sizeWidth: number,
    sizeHeight: number
  ): void {
    this.renderer = new WebGLRenderer({
      canvas: cvs,
      antialias: true,
      alpha: true
    })

    this.renderer.shadowMap.enabled = true
    this.renderer.setSize(sizeWidth, sizeHeight)
    this.renderer.outputEncoding = THREE.sRGBEncoding

    // 渲染优化
    this.renderer.physicallyCorrectLights = true //正确的物理灯光照射
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    this.renderer.toneMappingExposure = 2.0
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap

    // 色调映射参数
    // THREE.NoToneMapping
    // THREE.LinearToneMapping
    // THREE.ReinhardToneMapping
    // THREE.CineonToneMapping
    // THREE.ACESFilmicToneMapping
    // 使用算法将HDR值转换为LDR值，使其介于0到1之间， 0 <---> 1

    // // 渲染器将允许多少光线进入
    // // synchronise light values between 3D software and three.js
    // this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  }

  private initCamera(scene: Scene, aspect: number): void {
    const camera = generatePerspectiveCamera(aspect)
    this.camera = camera
    scene.add(camera)
  }

  private initLight(scene: Scene): void {
    // 环境光
    this.initAmbientLight(scene)
  }

  private initAmbientLight(scene: Scene) {
    const ambientLight = generateAmbientLight()
    scene.add(ambientLight)
  }

  /**
   * 优化的灯光位置计算
   * @param scaleK 相机距离缩放因子
   * @param angleOffset 灯光角度偏移(弧度)
   * @param heightOffset 灯光高度偏移系数
   * @returns 灯光位置
   */
  public getCameraScalarPos(
    scaleK: number = 0.5,
    angleOffset: number = Math.PI / 30,
    heightOffset: number = 0.5
  ): obj3DPos {
    // 获取相机位置并缩放
    const lightPos = this.camera.position.clone().multiplyScalar(scaleK)

    // 计算相机到原点的方向向量(归一化)
    const direction = lightPos.clone().normalize()

    // 创建一个旋转矩阵，绕Y轴旋转
    const rotationMatrix = new THREE.Matrix4().makeRotationY(angleOffset)

    // 应用旋转矩阵到方向向量
    direction.applyMatrix4(rotationMatrix)

    // 重新计算灯光位置(基于方向和距离)
    lightPos.copy(direction.multiplyScalar(lightPos.length()))

    // 略微提高灯光高度，创造更好的阴影
    lightPos.y += lightPos.length() * heightOffset

    return {
      x: lightPos.x,
      y: lightPos.y,
      z: lightPos.z
    }
  }

  private initSceneLight(scene: Scene, obj: Mesh) {
    const sceneLightPos = this.getCameraScalarPos()
    const sceneLight = generateDirectionalLight(obj, sceneLightPos, 0x950525)
    this.sceneLight = sceneLight
    scene.add(sceneLight)
  }

  private initHelper(scene: Scene): void {
    // 网格
    const gh = gridLineHelper()
    scene.add(gh)

    // 坐标轴
    const ah = axesHelper()
    scene.add(ah)

    // AABB辅助器
    const boxHelper = generateBoundingBoxHelper(this.loadModelMesh, 0xccae7f)
    if (!this.boxHelper) {
      scene.add(boxHelper)
    }
    this.boxHelper = boxHelper
    const pos = this.getCameraScalarPos()

    // 光源辅助器
    if (this.sceneLight) {
      const lightHelper = generateDirectionalLightHelper(
        this.sceneLight as THREE.DirectionalLight
      )
      this.lightHelper = lightHelper
      scene.add(lightHelper)
    }

    // cube辅助器
    const cube = cubeHelper(pos, 0x950525)
    this.lightCube = cube
    scene.add(cube)
  }

  private initControls(scene: Scene): void {
    const sceneControls = initOrbitControls(
      this.camera,
      this.renderer.domElement
    )
    this.sceneControls = sceneControls

    // const transformControls = initTransformControls(this.camera, this.renderer.domElement);
    // this.scene.add(transformControls);

    // const dragcontrols = initDragControls(this.camera, this.renderer.domElement, scene);
    // dragcontrols.addEventListener('hoveron', function (event) {
    //   transformControls.attach(event.object);
    // });
  }

  protected LoopRender(): void {
    requestAnimationFrame(this.LoopRender.bind(this))

    try {
      // 安全地更新动画
      if (this.sceneTween) {
        this.sceneTween.update()
      }

      // 确保场景和相机存在再进行渲染
      if (this.scene && this.camera) {
        this.renderer.render(this.scene, this.camera)
      }
    } catch (error) {
      console.error('渲染循环出错:', error)
    }
  }

  public initWindowResize(): void {
    // const headerHeight = document.getElementsByClassName("HeaderLayout")[0].clientHeight;
    // const footerHeight = document.getElementsByClassName("FooterLayout")[0].clientHeight;
    const headerHeight = 0
    const footerHeight = 0
    const dHeight = headerHeight + footerHeight
    window.onresize = _ => {
      this.setWindowSize(window.innerWidth, window.innerHeight - dHeight)
    }
  }

  public clearMesh(mesh: THREE.Mesh | THREE.Object3D) {
    const disposeMaterial = (material: THREE.Material) => {
      if ((material as any).map) {
        ;(material as any).map.dispose()
      }
      material.dispose()
    }
    // 释放geometry和material，防止内存泄漏
    const disposeMesh = (object: any) => {
      if (object.geometry) object.geometry.dispose()
      if (object.material) {
        if (object.material instanceof Array) {
          object.material.forEach((m: any) => {
            disposeMaterial(m)
          })
        } else {
          disposeMaterial(object.material)
        }
      }
    }
    if (mesh) {
      mesh.traverse(object => {
        disposeMesh(object)
      })
      disposeMesh(mesh)
    }
  }

  public clearGroup(objGroup: Group): void {
    if (!objGroup) return
    // 删除掉所有的模型组内的mesh
    objGroup.traverse(item => {
      if (item instanceof THREE.Mesh) {
        if (Array.isArray(item.material)) {
          item.material.forEach(a => {
            a.dispose()
          })
        } else {
          item.material.dispose()
        }
        item.geometry.dispose()
      }
    })
    objGroup.clear()
  }

  private mouseMoveHandler(): void {
    const cameraPos = this.getCameraScalarPos()
    if (this.sceneLight) {
      this.sceneLight.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
    }
    if (this.lightCube && this.lightHelper) {
      this.lightCube.position.set(cameraPos.x, cameraPos.y, cameraPos.z)
      this.lightHelper.update()
    }

    if (this.cameraHelper) {
      this.cameraHelper.update()
    }
  }

  private apeMouseMove = this.mouseMoveHandler.bind(this)

  private addListener(): void {
    this.cvsDom.addEventListener('mousemove', this.apeMouseMove)
  }

  public setCurrInputValueObj = (e: any) => {
    this.setState({
      currInputValueObj: e.target.value
    })
  }

  public setCurrInputValueMtl = (e: any) => {
    this.setState({
      currInputValueMtl: e.target.value
    })
  }

  public clearScene() {
    try {
      // 检查场景中是否存在各元素，避免删除不存在的对象
      if (this.lightCube && this.scene.children.includes(this.lightCube)) {
        this.scene.remove(this.lightCube)
      }

      if (this.lightHelper && this.scene.children.includes(this.lightHelper)) {
        this.scene.remove(this.lightHelper)
      }

      if (this.sceneLight && this.scene.children.includes(this.sceneLight)) {
        this.scene.remove(this.sceneLight)
      }

      if (this.loadModelGroup) {
        this.clearGroup(this.loadModelGroup)
      }

      if (
        this.loadModelMesh &&
        this.scene.children.includes(this.loadModelMesh)
      ) {
        this.scene.remove(this.loadModelMesh)
        this.clearMesh(this.loadModelMesh)
      }

      console.log('场景已清除')
    } catch (error) {
      console.error('清除场景出错:', error)
    }
  }

  public lookOssObj = () => {
    this.clearScene()
    const enterModel = {
      stlUrl: this.state.currInputValueObj
    }
    this.loadStlFile(enterModel)
  }

  public deleteSelectionMesh = () => {
    this.selsectionApp.deleteSelectionMesh()
  }

  public undoDelIndex = () => {
    this.selsectionApp.undoDelIndex()
  }

  public fitView = () => {
    try {
      // 首先检查模型是否存在且在场景中
      if (
        !this.loadModelMesh ||
        !this.scene.children.includes(this.loadModelMesh)
      ) {
        console.warn('无法调整视图：模型不存在或不在场景中')
        return
      }

      // 获取当前相机位置作为动画起点
      const oldPosition = {
        x: this.camera.position.x,
        y: this.camera.position.y,
        z: this.camera.position.z
      }

      // 计算适合的相机位置
      const fitPos = fitCameraPos(
        this.camera,
        this.loadModelMesh,
        1.5,
        this.sceneControls
      )

      // 设置目标位置
      const rootPosition = {
        x: oldPosition.x < 0 ? -fitPos : fitPos,
        y: fitPos,
        z: oldPosition.z < 0 ? -fitPos : fitPos
      }

      // 停止任何正在进行的动画
      if (this.sceneTween) {
        this.sceneTween.stop()
      }

      // 创建新的动画
      const sceneTween = new TWEEN.Tween(oldPosition)
        .to(rootPosition, 1555) // 指定目标位置和耗时
        .easing(TWEEN.Easing.Cubic.InOut) // 指定动画效果曲线
        .onUpdate((obj: any) => {
          // 渲染时每一帧执行：设定相机位置
          this.sceneControls.object.position.set(obj.x, obj.y, obj.z)
          this.sceneControls.target = new THREE.Vector3(0, 0, 0)
          this.sceneControls.update()
          this.mouseMoveHandler()
        })
        .start()

      this.sceneTween = sceneTween
    } catch (error) {
      console.error('调整视图出错:', error)
    }
  }

  public selectionSwitch = (checked: boolean) => {
    this.selsectionApp.setSelectionState(checked)
    if (checked) {
      if (isMobile()) {
        this.sceneControls.enabled = false
      } else {
        this.sceneControls.mouseButtons.LEFT = undefined
      }
    } else {
      if (isMobile()) {
        this.sceneControls.enabled = true
      } else {
        this.sceneControls.mouseButtons.LEFT = THREE.MOUSE.ROTATE
      }
    }
  }

  public saveModelFile = () => {
    // 导出 模型 文件
  }

  public setWindowSize(width: number, height: number) {
    this.renderer.setSize(width, height)
    ;(this.camera as PerspectiveCamera).aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  public setCvsSize = () => {
    if (this.sizeWidth && this.sizeHeight) {
      this.setWindowSize(this.sizeWidth, this.sizeHeight)
      fitCameraToCenteredObject(
        this.camera,
        this.loadModelMesh,
        3 / 4,
        this.sceneControls
      )
    }
  }

  public setCvsWidth = (e: any) => {
    this.sizeWidth = e.target.value
  }

  public setCvsHeight = (e: any) => {
    this.sizeHeight = e.target.value
  }

  /**
   * 切换到六视图中的一个视角
   * @param direction 视图方向：'front', 'back', 'left', 'right', 'top', 'bottom'
   */
  public switchToView = (direction: string) => {
    if (
      !this.loadModelMesh ||
      !this.scene.children.includes(this.loadModelMesh)
    ) {
      console.warn('没有找到模型或模型已被移除')
      return
    }

    try {
      // 停止所有动画
      TWEEN.removeAll()
      if (this.sceneTween) {
        this.sceneTween.stop()
      }

      // 计算模型的包围盒和尺寸
      const bbox = new THREE.Box3().setFromObject(this.loadModelMesh)
      const size = new THREE.Vector3()
      bbox.getSize(size)
      const maxDim = Math.max(size.x, size.y, size.z)
      const radius = maxDim * 2 // 相机距离

      // 定义准确的固定位置
      let x = 0,
        y = 0,
        z = 0

      // 基于方向直接设置新位置
      switch (direction) {
        case 'front':
          x = 0
          y = 0
          z = radius
          break
        case 'back':
          x = 0
          y = 0
          z = -radius
          break
        case 'left':
          x = -radius
          y = 0
          z = 0
          break
        case 'right':
          x = radius
          y = 0
          z = 0
          break
        case 'top':
          x = 0
          y = radius
          z = 0
          break
        case 'bottom':
          x = 0
          y = -radius
          z = 0
          break
        default:
          x = 0
          y = 0
          z = radius // 默认正视图
      }

      // 直接设置相机位置 - 无动画
      this.camera.position.set(x, y, z)
      this.camera.lookAt(0, 0, 0)
      this.sceneControls.target.set(0, 0, 0)
      this.sceneControls.update()
      this.mouseMoveHandler() // 更新光源位置

      // 更新当前视图方向状态
      this.setState({ viewDirection: direction })
    } catch (error) {
      console.error('切换视图出错:', error)
    }
  }

  // 视图方向变更处理函数
  public handleViewChange = (e: any) => {
    try {
      // 首先检查模型是否存在
      if (
        !this.loadModelMesh ||
        !this.scene.children.includes(this.loadModelMesh)
      ) {
        console.warn('视图切换失败：模型不存在')
        return
      }

      // 视图切换前确保模型可见
      if (!this.loadModelMesh.visible) {
        this.loadModelMesh.visible = true
      }

      // 进行视图切换
      this.switchToView(e.target.value)
    } catch (error) {
      console.error('视图切换出错:', error)
    }
  }

  render() {
    return (
      <div className="editorMain">
        <span id="saveSpeedId" className="saveSpeed"></span>
        <canvas id="editorCvs"></canvas>
        <div
          style={{ position: 'absolute', top: 0, left: 0 }}
          onClick={this.fitView}
        >
          Reset
        </div>
        <div className="viewControls">
          <Radio.Group
            value={this.state.viewDirection}
            onChange={this.handleViewChange}
            buttonStyle="solid"
          >
            <Radio.Button value="front">front</Radio.Button>
            <Radio.Button value="back">back</Radio.Button>
            <Radio.Button value="left">left</Radio.Button>
            <Radio.Button value="right">right</Radio.Button>
            <Radio.Button value="top">top</Radio.Button>
            <Radio.Button value="bottom">bottom</Radio.Button>
          </Radio.Group>
          <div className="native-select-container">
            <select
              value={this.state.currentMaterial}
              onChange={e =>
                this.handleMaterialChange(e.target.value as MaterialType)
              }
              className="native-select"
            >
              {(Object.keys(materialOptions) as MaterialType[]).map(key => (
                <option key={key} value={key}>
                  {materialOptions[key].name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    )
  }
}

export { EditorMain }
