import * as THREE from 'three'
import {
  BoxGeometry,
  BufferGeometry,
  Camera,
  Line,
  LineBasicMaterial,
  Material,
  Matrix4,
  Mesh,
  PerspectiveCamera,
  Ray,
  Scene,
  Vector3,
  WebGLRenderer
} from 'three'
import { CONTAINED, INTERSECTED, NOT_INTERSECTED } from 'three-mesh-bvh'
import { generateBoundingBoxHelper } from '../helper/helperUtils'

const selectionParams = {
  toolMode: 'box', // lasso
  selectionMode: 'centroid', // intersection centroid centroid-visible
  liveUpdate: false,
  selectModel: false,
  wireframe: false,
  useBoundsTree: true
}

class TriangleSelection {
  public selectionScene!: Scene
  public selectionRenderer!: WebGLRenderer
  public selectionCamera!: Camera
  public selectionLoadModelMesh!: Mesh

  constructor(
    scene: Scene,
    renderer: WebGLRenderer,
    camera: Camera,
    loadMesh: Mesh
  ) {
    this.selectionCamera = camera
    this.selectionRenderer = renderer
    this.selectionScene = scene
    this.selectionLoadModelMesh = loadMesh
  }

  // selection
  public toScreenSpaceMatrix: Matrix4 = new THREE.Matrix4()
  public invWorldMatrix: Matrix4 = new THREE.Matrix4()

  public selectionPoints: any[] = []
  public lassoSegments: any[] = []
  public perBoundsSegments: any[] = []
  public boxPoints: any = new Array(8)
    .fill(new THREE.Vector3())
    .map(() => new THREE.Vector3())
  public boxLines: any = new Array(12)
    .fill(new THREE.Vector3())
    .map(() => new THREE.Line3())

  public camLocalPosition: Vector3 = new THREE.Vector3()
  public centroid: Vector3 = new THREE.Vector3()
  public screenCentroid: Vector3 = new THREE.Vector3()
  public faceNormal: Vector3 = new THREE.Vector3()

  public tempRay: Ray = new THREE.Ray()
  public highlightMesh!: Mesh
  public highlightWireframeMesh!: Mesh
  public selectionShape!: Line

  public selectionShapeNeedsUpdate: boolean = false
  public selectionNeedsUpdate: boolean = true // false
  public dragging: boolean = false

  public selectionIndexArr: any[] = []
  public delIndexHistoryArr: any[] = []
  public selectionMesh!: Mesh
  public selectionState: boolean = false

  public setSelectionState(state: boolean) {
    this.selectionState = state
  }

  public createHighlightMesh(rootMesh: Mesh) {
    // selection Helper
    // const selectionHelper = new MeshBVHVisualizer(rootMesh, 5);
    // this.scene.add(selectionHelper);

    // meshes for selection highlights
    this.highlightMesh = new THREE.Mesh()
    this.highlightMesh.geometry = rootMesh.geometry.clone()
    this.highlightMesh.geometry.drawRange.count = 0
    this.highlightMesh.material = new THREE.MeshBasicMaterial({
      opacity: 0.05,
      transparent: true,
      depthWrite: false,
      color: 0x5e0000
    })
    this.highlightMesh.renderOrder = 1
    this.selectionScene.add(this.highlightMesh)

    // AABB辅助器 TODO 换位置
    const boxHelper = generateBoundingBoxHelper(this.highlightMesh, 0xccae7f)
    // this.selectionScene.add(boxHelper);

    this.highlightWireframeMesh = new THREE.Mesh()
    this.highlightWireframeMesh.geometry = this.highlightMesh.geometry
    this.highlightWireframeMesh.material = new THREE.MeshBasicMaterial({
      opacity: 0.25,
      transparent: true,
      wireframe: true,
      depthWrite: false,
      color: 0x5e0000
    })
    this.highlightWireframeMesh.renderOrder = 2
    this.selectionScene.add(this.highlightWireframeMesh)
  }

  public selectionInit() {
    // selection shape
    this.selectionShape = new THREE.Line()
    this.selectionShape.material = new LineBasicMaterial({ color: 0x5e0000 })
    this.selectionShape.renderOrder = 1
    this.selectionShape.position.z = -0.2
    ;(this.selectionShape.material as Material).depthTest = false
    this.selectionCamera.add(this.selectionShape)

    let startX = -Infinity
    let startY = -Infinity

    let prevX = -Infinity
    let prevY = -Infinity

    const tempVec0 = new THREE.Vector2()
    const tempVec1 = new THREE.Vector2()
    const tempVec2 = new THREE.Vector2()

    this.selectionRenderer.domElement.addEventListener('pointerdown', e => {
      if (!this.selectionState) return
      prevX = e.clientX
      prevY = e.clientY
      const rect = this.selectionRenderer.domElement.getBoundingClientRect()
      startX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      startY = (-(e.clientY - rect.top) / rect.height) * 2 + 1

      this.selectionPoints.length = 0
      this.dragging = true
    })

    this.selectionRenderer.domElement.addEventListener('pointerup', () => {
      if (!this.selectionState) return
      this.dragging = false
      if (this.selectionPoints.length) {
        this.selectionNeedsUpdate = true
      }
      this.selectionShape.visible = false
      this.showMeshBox()
    })

    this.selectionRenderer.domElement.addEventListener('pointermove', e => {
      // If the left mouse button is not pressed
      if (!this.selectionState) return

      if ((1 & e.buttons) === 0) {
        return
      }
      const ex = e.clientX
      const ey = e.clientY
      const rect = this.selectionRenderer.domElement.getBoundingClientRect()
      const nx = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ny = (-(e.clientY - rect.top) / rect.height) * 2 + 1
      if (selectionParams.toolMode === 'box') {
        // set points for the corner of the box
        this.selectionPoints.length = 3 * 5
        this.selectionPoints[0] = startX
        this.selectionPoints[1] = startY
        this.selectionPoints[2] = 0

        this.selectionPoints[3] = nx
        this.selectionPoints[4] = startY
        this.selectionPoints[5] = 0

        this.selectionPoints[6] = nx
        this.selectionPoints[7] = ny
        this.selectionPoints[8] = 0

        this.selectionPoints[9] = startX
        this.selectionPoints[10] = ny
        this.selectionPoints[11] = 0

        this.selectionPoints[12] = startX
        this.selectionPoints[13] = startY
        this.selectionPoints[14] = 0

        if (ex !== prevX || ey !== prevY) {
          this.selectionShapeNeedsUpdate = true
        }

        prevX = ex
        prevY = ey
        // this.selectionShape.visible = true;
        if (selectionParams.liveUpdate) {
          this.selectionNeedsUpdate = true
        }
      } else {
        // If the mouse hasn't moved a lot since the last point
        if (Math.abs(ex - prevX) >= 3 || Math.abs(ey - prevY) >= 3) {
          // Check if the mouse moved in roughly the same direction as the previous point
          // and replace it if so.
          const i = this.selectionPoints.length / 3 - 1
          const i3 = i * 3
          let doReplace = false
          if (this.selectionPoints.length > 3) {
            // prev segment direction
            tempVec0.set(
              this.selectionPoints[i3 - 3],
              this.selectionPoints[i3 - 3 + 1]
            )
            tempVec1.set(this.selectionPoints[i3], this.selectionPoints[i3 + 1])
            tempVec1.sub(tempVec0).normalize()

            // this segment direction
            tempVec0.set(this.selectionPoints[i3], this.selectionPoints[i3 + 1])
            tempVec2.set(nx, ny)
            tempVec2.sub(tempVec0).normalize()

            const dot = tempVec1.dot(tempVec2)
            doReplace = dot > 0.99
          }

          if (doReplace) {
            this.selectionPoints[i3] = nx
            this.selectionPoints[i3 + 1] = ny
          } else {
            this.selectionPoints.push(nx, ny, 0)
          }

          this.selectionShapeNeedsUpdate = true

          prevX = ex
          prevY = ey

          if (selectionParams.liveUpdate) {
            this.selectionNeedsUpdate = true
          }
        }
      }
    })
  }

  public selectionRender() {
    requestAnimationFrame(this.selectionRender.bind(this))
    // Update the selection lasso lines
    if (!this.selectionState) return
    if (this.selectionShapeNeedsUpdate) {
      if (selectionParams.toolMode === 'lasso') {
        const ogLength = this.selectionPoints.length
        this.selectionPoints.push(
          this.selectionPoints[0],
          this.selectionPoints[1],
          this.selectionPoints[2]
        )
        this.selectionShape.geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(this.selectionPoints, 3, false)
        )
        this.selectionShape.visible = true
        this.selectionPoints.length = ogLength
      } else {
        this.selectionShape.geometry.setAttribute(
          'position',
          new THREE.Float32BufferAttribute(this.selectionPoints, 3, false)
        )

        // 控制选择框和aabb显示
        if (this.dragging) {
          this.selectionShape.visible = true
          if (this.selectionMesh) {
            // 互斥切换显示
            this.selectionMesh.visible = false
          }
        }
      }
      this.selectionShape.frustumCulled = false
      this.selectionShapeNeedsUpdate = false
    }

    if (this.selectionNeedsUpdate) {
      this.selectionNeedsUpdate = true // false
      if (this.selectionPoints.length > 0 && this.selectionShape.visible) {
        this.updateSelection(this.selectionLoadModelMesh)
      }
    }

    const yScale =
      Math.tan(
        (THREE.MathUtils.DEG2RAD *
          (this.selectionCamera as PerspectiveCamera).fov) /
          2
      ) * this.selectionShape.position.z
    this.selectionShape.scale.set(
      -yScale * (this.selectionCamera as PerspectiveCamera).aspect,
      -yScale,
      1
    )
  }

  public updateSelection(selectionMesh: Mesh) {
    // TODO: Possible improvements
    // - Correctly handle the camera near clip
    // - Improve line line intersect performance?
    this.toScreenSpaceMatrix
      .copy(selectionMesh.matrixWorld)
      .premultiply(this.selectionCamera.matrixWorldInverse)
      .premultiply(this.selectionCamera.projectionMatrix)

    // create scratch points and lines to use for selection
    while (this.lassoSegments.length < this.selectionPoints.length) {
      this.lassoSegments.push(new THREE.Line3())
    }

    this.lassoSegments.length = this.selectionPoints.length
    for (let s = 0, l = this.selectionPoints.length; s < l; s += 3) {
      const line = this.lassoSegments[s]
      const sNext = (s + 3) % l
      line.start.x = this.selectionPoints[s]
      line.start.y = this.selectionPoints[s + 1]

      line.end.x = this.selectionPoints[sNext]
      line.end.y = this.selectionPoints[sNext + 1]
    }

    this.invWorldMatrix.copy(selectionMesh.matrixWorld).invert()
    this.camLocalPosition
      .set(0, 0, 0)
      .applyMatrix4(this.selectionCamera.matrixWorld)
      .applyMatrix4(this.invWorldMatrix)

    const indices: any[] = []
    selectionMesh.geometry.boundsTree?.shapecast({
      intersectsBounds: (box, isLeaf, score, depth) => {
        // check if bounds intersect or contain the lasso region
        if (!selectionParams.useBoundsTree) {
          return INTERSECTED
        }
        // Get the bounding box points
        const { min, max } = box
        let index = 0

        let minY = Infinity
        let maxY = -Infinity
        let minX = Infinity
        for (let x = 0; x <= 1; x++) {
          for (let y = 0; y <= 1; y++) {
            for (let z = 0; z <= 1; z++) {
              const v = this.boxPoints[index]
              v.x = x === 0 ? min.x : max.x
              v.y = y === 0 ? min.y : max.y
              v.z = z === 0 ? min.z : max.z
              v.w = 1
              v.applyMatrix4(this.toScreenSpaceMatrix)
              index++

              if (v.y < minY) minY = v.y
              if (v.y > maxY) maxY = v.y
              if (v.x < minX) minX = v.x
            }
          }
        }
        // Find all the relevant segments here and cache them in the above array for
        // subsequent child checks to use.
        const parentSegments =
          this.perBoundsSegments[depth - 1] || this.lassoSegments
        const segmentsToCheck = this.perBoundsSegments[depth] || []
        segmentsToCheck.length = 0
        this.perBoundsSegments[depth] = segmentsToCheck
        for (let i = 0, l = parentSegments.length; i < l; i++) {
          const line = parentSegments[i]
          const sx = line.start.x
          const sy = line.start.y
          const ex = line.end.x
          const ey = line.end.y
          if (sx < minX && ex < minX) continue

          const startAbove = sy > maxY
          const endAbove = ey > maxY
          if (startAbove && endAbove) continue

          const startBelow = sy < minY
          const endBelow = ey < minY
          if (startBelow && endBelow) continue
          segmentsToCheck.push(line)
        }

        if (segmentsToCheck.length === 0) {
          return NOT_INTERSECTED
        }

        // Get the screen space hull lines
        const hull = getConvexHull(this.boxPoints)
        const lines = hull?.map((p, i) => {
          const nextP = hull[(i + 1) % hull.length]
          const line = this.boxLines[i]
          line.start.copy(p)
          line.end.copy(nextP)
          return line
        })
        // If a lasso point is inside the hull then it's intersected and cannot be contained
        if (
          pointRayCrossesSegments(segmentsToCheck[0].start, lines) % 2 ===
          1
        ) {
          return INTERSECTED
        }
        let crossings = 0

        if (hull) {
          // check if the screen space hull is in the lasso
          for (let i = 0, l = hull.length; i < l; i++) {
            const v = hull[i]
            const pCrossings = pointRayCrossesSegments(v, segmentsToCheck)
            if (i === 0) {
              crossings = pCrossings
            }
            // if two points on the hull have different amounts of crossings then
            // it can only be intersected
            if (crossings !== pCrossings) {
              return INTERSECTED
            }
          }
        }

        if (lines) {
          // check if there are any intersections
          for (let i = 0, l = lines.length; i < l; i++) {
            const boxLine = lines[i]
            for (let s = 0, ls = segmentsToCheck.length; s < ls; s++) {
              if (lineCrossesLine(boxLine, segmentsToCheck[s])) {
                return INTERSECTED
              }
            }
          }
        }
        return crossings % 2 === 0 ? NOT_INTERSECTED : CONTAINED
      },
      intersectsTriangle: (tri, index, contained, depth) => {
        const i3 = index * 3
        const a = i3 + 0
        const b = i3 + 1
        const c = i3 + 2

        // check all the segments if using no bounds tree
        const segmentsToCheck = selectionParams.useBoundsTree
          ? this.perBoundsSegments[depth]
          : this.lassoSegments
        if (
          selectionParams.selectionMode === 'centroid' ||
          selectionParams.selectionMode === 'centroid-visible'
        ) {
          // get the center of the triangle
          this.centroid
            .copy(tri.a)
            .add(tri.b)
            .add(tri.c)
            .multiplyScalar(1 / 3)
          this.screenCentroid
            .copy(this.centroid)
            .applyMatrix4(this.toScreenSpaceMatrix)

          // counting the crossings
          if (
            contained ||
            pointRayCrossesSegments(this.screenCentroid, segmentsToCheck) %
              2 ===
              1
          ) {
            // if we're only selecting visible faces then perform a ray check to ensure the centroid
            // is visible.
            if (selectionParams.selectionMode === 'centroid-visible') {
              tri.getNormal(this.faceNormal)
              this.tempRay.origin
                .copy(this.centroid)
                .addScaledVector(this.faceNormal, 1e-6)
              this.tempRay.direction.subVectors(
                this.camLocalPosition,
                this.centroid
              )

              const res = selectionMesh.geometry.boundsTree?.raycastFirst(
                this.tempRay,
                THREE.DoubleSide
              )
              if (res) {
                return false
              }
            }
            indices.push(a, b, c)
            return selectionParams.selectModel
          }
        } else if (selectionParams.selectionMode === 'intersection') {
          // if the parent bounds were marked as contained
          if (contained) {
            indices.push(a, b, c)
            return selectionParams.selectModel
          }
          // get the projected vertices
          const vertices = [tri.a, tri.b, tri.c]

          for (let j = 0; j < 3; j++) {
            const v = vertices[j]
            v.applyMatrix4(this.toScreenSpaceMatrix)
            const crossings = pointRayCrossesSegments(v, segmentsToCheck)
            if (crossings % 2 === 1) {
              indices.push(a, b, c)
              return selectionParams.selectModel
            }
          }

          // get the lines for the triangle
          const lines = [this.boxLines[0], this.boxLines[1], this.boxLines[2]]

          lines[0].start.copy(tri.a)
          lines[0].end.copy(tri.b)

          lines[1].start.copy(tri.b)
          lines[1].end.copy(tri.c)

          lines[2].start.copy(tri.c)
          lines[2].end.copy(tri.a)

          for (let i = 0; i < 3; i++) {
            const l = lines[i]
            for (let s = 0, sl = segmentsToCheck.length; s < sl; s++) {
              if (lineCrossesLine(l, segmentsToCheck[s])) {
                indices.push(a, b, c)
                return selectionParams.selectModel
              }
            }
          }
        }
        return false
      }
    })

    const indexAttr = selectionMesh.geometry.index
    const newIndexAttr = this.highlightMesh.geometry.index
    if (indexAttr && newIndexAttr) {
      if (indices.length && selectionParams.selectModel) {
        // if we found indices and we want to select the whole model
        for (let i = 0, l = indexAttr.count; i < l; i++) {
          const i2 = indexAttr.getX(i)
          newIndexAttr.setX(i, i2)
        }
        this.highlightMesh.geometry.drawRange.count = Infinity
        newIndexAttr.needsUpdate = true
      } else {
        // update the highlight mesh
        for (let i = 0, l = indices.length; i < l; i++) {
          const i2 = indexAttr.getX(indices[i])
          newIndexAttr.setX(i, i2)
        }
        this.highlightMesh.geometry.drawRange.count = indices.length
        this.selectionIndexArr = indices
        newIndexAttr.needsUpdate = true
      }
    }
  }

  public showMeshBox() {
    let xArr = {
      min: 0,
      max: 0
    }
    let yArr = {
      min: 0,
      max: 0
    }
    let zArr = {
      min: 0,
      max: 0
    }
    let flag = false
    const iSize =
      this.selectionLoadModelMesh.geometry.attributes.position.itemSize
    const originIndexAttr = this.selectionLoadModelMesh.geometry.index!

    this.selectionIndexArr.forEach(index => {
      if (originIndexAttr.getX(index) === 0) return
      const vX =
        this.selectionLoadModelMesh.geometry.attributes.position.array[
          originIndexAttr.getX(index) * iSize + 0
        ]
      const vY =
        this.selectionLoadModelMesh.geometry.attributes.position.array[
          originIndexAttr.getX(index) * iSize + 1
        ]
      const vZ =
        this.selectionLoadModelMesh.geometry.attributes.position.array[
          originIndexAttr.getX(index) * iSize + 2
        ]
      if (vX && vY && vZ) {
        if (!flag) {
          xArr.max = xArr.min = vX
          yArr.max = yArr.min = vY
          zArr.max = zArr.min = vZ
        }
        if (vX < xArr.min) xArr.min = vX
        if (vX > xArr.max) xArr.max = vX

        if (vY < yArr.min) yArr.min = vY
        if (vY > yArr.max) yArr.max = vY

        if (vZ < zArr.min) zArr.min = vZ
        if (vZ > zArr.max) zArr.max = vZ
        flag = true
      }
    })

    const minX = xArr.min
    const maxX = xArr.max
    const disX = maxX - minX
    const cenX = (maxX + minX) / 2

    const minY = yArr.min
    const maxY = yArr.max
    const disY = maxY - minY
    const cenY = (maxY + minY) / 2

    const minZ = zArr.min
    const maxZ = zArr.max
    const disZ = maxZ - minZ
    const cenZ = (maxZ + minZ) / 2

    if (disX && disY && disZ) {
      if (!this.selectionMesh) {
        const selectionGeometry = new THREE.BoxGeometry(disX, disY, disZ)
        const selectionMaterial = new THREE.MeshBasicMaterial({
          color: 0x5e0000
        })
        selectionMaterial.wireframe = true
        const selectionMesh = new THREE.Mesh(
          selectionGeometry,
          selectionMaterial
        )
        selectionMesh.position.set(cenX, cenY, cenZ)
        this.selectionMesh = selectionMesh
        this.selectionScene.add(selectionMesh)
      } else {
        const scaleX =
          disX / (this.selectionMesh.geometry as BoxGeometry).parameters.width
        const scaleY =
          disY / (this.selectionMesh.geometry as BoxGeometry).parameters.height
        const scaleZ =
          disZ / (this.selectionMesh.geometry as BoxGeometry).parameters.depth

        this.selectionMesh.scale.set(scaleX, scaleY, scaleZ)
        this.selectionMesh.position.set(cenX, cenY, cenZ)
      }
      this.selectionMesh.visible = true
    }
  }

  public resetSelection = () => {
    this.highlightMesh.geometry.drawRange.count = 0
    this.selectionMesh.visible = false
  }

  public deleteSelectionMesh = () => {
    if (!this.selectionMesh || !this.selectionMesh.visible) return
    const originIndexAttr = this.selectionLoadModelMesh.geometry.index!
    const resetIndex = 0
    // const resetIndex = originIndexAttr.array.length + 1;
    let delIndexArr = []
    for (let i = 0, l = this.selectionIndexArr.length; i < l; i++) {
      delIndexArr.push([
        this.selectionIndexArr[i],
        originIndexAttr.getX(this.selectionIndexArr[i])
      ])
      originIndexAttr.setX(this.selectionIndexArr[i], resetIndex)
    }
    this.delIndexHistoryArr.push(delIndexArr)
    originIndexAttr.needsUpdate = true
    this.resetSelection()
  }

  public undoDelIndex = () => {
    if (!this.delIndexHistoryArr.length) return
    const undoIndexArr = this.delIndexHistoryArr.pop()
    const originIndexAttr = this.selectionLoadModelMesh.geometry.index!
    for (let i = 0, l = undoIndexArr.length; i < l; i++) {
      originIndexAttr.setX(undoIndexArr[i][0], undoIndexArr[i][1])
    }
    originIndexAttr.needsUpdate = true
  }
}

function getConvexHull(points: any) {
  function orientation(p: any, q: any, r: any) {
    const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y)

    if (val === 0) {
      return 0 // colinear
    }

    // clock or counterclock wise
    return val > 0 ? 1 : 2
  }

  function distSq(p1: any, p2: any) {
    return (p1.x - p2.x) * (p1.x - p2.x) + (p1.y - p2.y) * (p1.y - p2.y)
  }

  function compare(p1: any, p2: any) {
    // Find orientation
    const o = orientation(p0, p1, p2)
    if (o === 0) return distSq(p0, p2) >= distSq(p0, p1) ? -1 : 1

    return o === 2 ? -1 : 1
  }

  // find the lowest point in 2d
  let lowestY = Infinity
  let lowestIndex = -1
  for (let i = 0, l = points.length; i < l; i++) {
    const p = points[i]
    if (p.y < lowestY) {
      lowestIndex = i
      lowestY = p.y
    }
  }

  // sort the points
  const p0 = points[lowestIndex]
  points[lowestIndex] = points[0]
  points[0] = p0

  points = points.sort(compare)

  // filter the points
  let m = 1
  const n = points.length
  for (let i = 1; i < n; i++) {
    while (i < n - 1 && orientation(p0, points[i], points[i + 1]) === 0) {
      i++
    }

    points[m] = points[i]
    m++
  }

  // early out if we don't have enough points for a hull
  if (m < 3) return null

  // generate the hull
  const hull = [points[0], points[1], points[2]]
  for (let i = 3; i < m; i++) {
    while (
      orientation(hull[hull.length - 2], hull[hull.length - 1], points[i]) !== 2
    ) {
      hull.pop()
    }

    hull.push(points[i])
  }

  return hull
}

function pointRayCrossesSegments(point: any, segments: any) {
  let crossings = 0
  const firstSeg = segments[segments.length - 1]
  let prevDirection = firstSeg.start.y > firstSeg.end.y
  for (let s = 0, l = segments.length; s < l; s++) {
    const line = segments[s]
    const thisDirection = line.start.y > line.end.y
    if (pointRayCrossesLine(point, line, prevDirection, thisDirection)) {
      crossings++
    }

    prevDirection = thisDirection
  }

  return crossings
}

function lineCrossesLine(l1: any, l2: any) {
  function ccw(A: any, B: any, C: any) {
    return (C.y - A.y) * (B.x - A.x) > (B.y - A.y) * (C.x - A.x)
  }
  const A = l1.start
  const B = l1.end

  const C = l2.start
  const D = l2.end
  return ccw(A, C, D) !== ccw(B, C, D) && ccw(A, B, C) !== ccw(A, B, D)
}

function pointRayCrossesLine(
  point: any,
  line: any,
  prevDirection: any,
  thisDirection: any
) {
  const { start, end } = line
  const px = point.x
  const py = point.y

  const sy = start.y
  const ey = end.y

  if (sy === ey) return false

  if (py > sy && py > ey) return false // above
  if (py < sy && py < ey) return false // below

  const sx = start.x
  const ex = end.x
  if (px > sx && px > ex) return false // right
  if (px < sx && px < ex) {
    // left
    if (py === sy && prevDirection !== thisDirection) {
      return false
    }
    return true
  }

  // check the side
  const dx = ex - sx
  const dy = ey - sy
  const perpx = dy
  const perpy = -dx

  const pdx = px - sx
  const pdy = py - sy

  const dot = perpx * pdx + perpy * pdy
  if (Math.sign(dot) !== Math.sign(perpx)) {
    return true
  }
  return false
}

export { TriangleSelection }
