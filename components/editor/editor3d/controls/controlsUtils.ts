import * as THREE from 'three'
import { Camera, Scene, Vector3 } from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'
import { DragControls } from 'three/examples/jsm/controls/DragControls'

function initSelectionControls(camera: Camera, renderDom: HTMLCanvasElement) {
  // selection controls
  const controls = new OrbitControls(camera, renderDom)
  controls.minDistance = 1
  controls.touches.ONE = THREE.TOUCH.PAN
  controls.mouseButtons.LEFT = THREE.MOUSE.PAN
  controls.touches.TWO = THREE.TOUCH.ROTATE
  controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
  controls.enablePan = false
  return controls
}

function setSelectionControls(controls: OrbitControls) {
  // selection controls
  controls.minDistance = 1
  controls.touches.ONE = THREE.TOUCH.PAN
  controls.mouseButtons.LEFT = THREE.MOUSE.PAN
  controls.touches.TWO = THREE.TOUCH.ROTATE
  controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
  controls.enablePan = false
  return controls
}

function initOrbitControls(camera: Camera, renderDom: HTMLCanvasElement) {
  const controls = new OrbitControls(camera, renderDom)

  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.PAN
  }

  controls.target = new Vector3(0, 0, 0)
  controls.enabled = true
  controls.enablePan = true

  // How far you can dolly in and out ( PerspectiveCamera only )
  //最大最小相机移动距离(景深相机)
  controls.minDistance = 0
  controls.maxDistance = Infinity

  // How far you can zoom in and out ( OrthographicCamera only )
  //最大最小鼠标缩放大小（正交相机）
  controls.minZoom = 0
  controls.maxZoom = Infinity

  // How far you can orbit vertically, upper and lower limits.
  // Range is 0 to Math.PI radians.
  //最大仰视角和俯视角
  controls.minPolarAngle = 0 // radians
  controls.maxPolarAngle = Math.PI // radians
  // How far you can orbit horizontally, upper and lower limits.
  // If set, must be a sub-interval of the interval [ - Math.PI, Math.PI ].
  //水平方向视角限制
  controls.minAzimuthAngle = -Infinity // radians
  controls.maxAzimuthAngle = Infinity // radians

  // Set to true to enable damping (inertia)
  // If damping is enabled, you must call controls.update() in your animation loop
  //惯性滑动，滑动大小默认0.25
  controls.enableDamping = false
  controls.dampingFactor = 0.25

  // This option actually enables dollying in and out; left as "zoom" for backwards compatibility.
  // Set to false to disable zooming
  //滚轮是否可控制zoom，zoom速度默认1
  controls.enableZoom = true
  controls.zoomSpeed = 1.0

  // Set to false to disable rotating
  //是否可旋转，旋转速度
  controls.enableRotate = true
  controls.rotateSpeed = 1.0

  // Set to false to disable panning
  //是否可平移，默认移动速度为7px
  controls.enablePan = true
  controls.keyPanSpeed = 7.0 // pixels moved per arrow key push

  controls.autoRotate = false
  controls.autoRotateSpeed = 2.0 // 30 seconds per round when fps is 60
  return controls
}

function initTransformControls(
  camera: Camera,
  renderDom: HTMLCanvasElement,
  mode: 'translate' | 'rotate' | 'scale' = 'translate'
) {
  const controls = new TransformControls(camera, renderDom)
  controls.setMode(mode)
  return controls
}

function initDragControls(
  camera: Camera,
  renderDom: HTMLCanvasElement,
  scene: Scene
) {
  const dragcontrols = new DragControls(scene.children, camera, renderDom)
  //拖拽控件对象设置鼠标事件
  return dragcontrols
}

export {
  initOrbitControls,
  initSelectionControls,
  initTransformControls,
  initDragControls
}
