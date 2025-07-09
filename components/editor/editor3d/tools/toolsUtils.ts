import * as THREE from 'three'

function fitCameraToCenteredObject(
  camera: any,
  object: any,
  offset: any,
  orbitControls: any
) {
  const boundingBox = new THREE.Box3()
  boundingBox.setFromObject(object)

  var size = new THREE.Vector3()
  boundingBox.getSize(size)

  // figure out how to fit the box in the view:
  // 1. figure out horizontal FOV (on non-1.0 aspects)
  // 2. figure out distance from the object in X and Y planes
  // 3. select the max distance (to fit both sides in)
  //
  // The reason is as follows:
  //
  // Imagine a bounding box (BB) is centered at (0,0,0).
  // Camera has vertical FOV (camera.fov) and horizontal FOV
  // (camera.fov scaled by aspect, see fovh below)
  //
  // Therefore if you want to put the entire object into the field of view,
  // you have to compute the distance as: z/2 (half of Z size of the BB
  // protruding towards us) plus for both X and Y size of BB you have to
  // figure out the distance created by the appropriate FOV.
  //
  // The FOV is always a triangle:
  //
  //  (size/2)
  // +--------+
  // |       /
  // |      /
  // |     /
  // | F° /
  // |   /
  // |  /
  // | /
  // |/
  //
  // F° is half of respective FOV, so to compute the distance (the length
  // of the straight line) one has to: `size/2 / Math.tan(F)`.
  //
  // FTR, from https://threejs.org/docs/#api/en/cameras/PerspectiveCamera
  // the camera.fov is the vertical FOV.
  // TODO
  const sizeK = 2
  const fov = camera.fov * (Math.PI / 180)
  const fovh = sizeK * Math.atan(Math.tan(fov / sizeK) * camera.aspect)
  let dx = size.z / sizeK + Math.abs(size.x / sizeK / Math.tan(fovh / sizeK))
  let dy = size.z / sizeK + Math.abs(size.y / sizeK / Math.tan(fov / 2))
  let cameraZ = Math.max(dx, dy)

  // offset the camera, if desired (to avoid filling the whole canvas)
  if (offset !== undefined && offset !== 0) cameraZ *= offset
  camera.position.set(cameraZ, cameraZ, cameraZ)

  // set the far plane of the camera so that it easily encompasses the whole object
  const minZ = boundingBox.min.z
  const cameraToFarEdge = minZ < 0 ? -minZ + cameraZ : cameraZ - minZ

  // camera.far = cameraToFarEdge * 3;
  camera.updateProjectionMatrix()

  if (orbitControls !== undefined) {
    // set camera to rotate around the center
    orbitControls.target = new THREE.Vector3(0, 0, 0)
    // prevent camera from zooming out far enough to create far plane cutoff
    orbitControls.maxDistance = cameraToFarEdge * 5
  }
}

function fitCameraToSixViews(
  camera: any,
  object: any,
  view: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom',
  offset: any = 1.2,
  orbitControls: any
) {
  const boundingBox = new THREE.Box3()
  boundingBox.setFromObject(object)

  var size = new THREE.Vector3()
  boundingBox.getSize(size)

  const sizeK = 2
  const fov = camera.fov * (Math.PI / 180)
  const fovh = sizeK * Math.atan(Math.tan(fov / sizeK) * camera.aspect)

  // 计算不同视图所需的距离
  let dx = size.z / sizeK + Math.abs(size.x / sizeK / Math.tan(fovh / sizeK))
  let dy = size.z / sizeK + Math.abs(size.y / sizeK / Math.tan(fov / 2))
  let dz = size.y / sizeK + Math.abs(size.z / sizeK / Math.tan(fov / 2))

  // 根据视图选择适当的距离
  let distance

  switch (view) {
    case 'front':
    case 'back':
      distance = Math.max(dx, dy)
      break
    case 'left':
    case 'right':
      distance = Math.max(dz, dy)
      break
    case 'top':
    case 'bottom':
      distance = Math.max(dx, dz)
      break
  }

  // 应用偏移
  if (offset !== undefined && offset !== 0) distance *= offset

  // 根据选择的视图设置相机位置
  switch (view) {
    case 'front':
      camera.position.set(0, 0, distance)
      break
    case 'back':
      camera.position.set(0, 0, -distance)
      break
    case 'left':
      camera.position.set(-distance, 0, 0)
      break
    case 'right':
      camera.position.set(distance, 0, 0)
      break
    case 'top':
      camera.position.set(0, distance, 0)
      break
    case 'bottom':
      camera.position.set(0, -distance, 0)
      break
  }

  // 更新投影矩阵
  camera.updateProjectionMatrix()

  if (orbitControls !== undefined) {
    // 设置相机旋转中心为原点
    orbitControls.target = new THREE.Vector3(0, 0, 0)

    // 防止相机缩放太远导致远平面裁剪
    const minZ = boundingBox.min.z
    const cameraToFarEdge = Math.max(
      distance + Math.abs(boundingBox.min.x),
      distance + Math.abs(boundingBox.max.x),
      distance + Math.abs(boundingBox.min.y),
      distance + Math.abs(boundingBox.max.y),
      distance + Math.abs(boundingBox.min.z),
      distance + Math.abs(boundingBox.max.z)
    )
    orbitControls.maxDistance = cameraToFarEdge * 3
  }
}

function fitCameraPos(
  camera: any,
  object: any,
  offset: any,
  orbitControls: any
) {
  const boundingBox = new THREE.Box3()
  boundingBox.setFromObject(object)

  var size = new THREE.Vector3()
  boundingBox.getSize(size)

  const sizeK = 2
  const fov = camera.fov * (Math.PI / 180)
  const fovh = sizeK * Math.atan(Math.tan(fov / sizeK) * camera.aspect)
  let dx = size.z / sizeK + Math.abs(size.x / sizeK / Math.tan(fovh / sizeK))
  let dy = size.z / sizeK + Math.abs(size.y / sizeK / Math.tan(fov / 2))
  let cameraZ = Math.max(dx, dy)

  // offset the camera, if desired (to avoid filling the whole canvas)
  if (offset !== undefined && offset !== 0) cameraZ *= offset
  return cameraZ
}

export { fitCameraToCenteredObject, fitCameraPos, fitCameraToSixViews }
