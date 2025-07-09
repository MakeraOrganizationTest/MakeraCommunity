import { PerspectiveCamera, OrthographicCamera } from "three/src/Three";

function generatePerspectiveCamera(aspect: number): PerspectiveCamera {
  const camera = new PerspectiveCamera(60, aspect, 0.1, 5000);
  camera.position.set(1, 1, 1);
  return camera;
}

function generateOrthographicCamera(orthWidth: number, orthHeight: number, near: number, far: number) {
  const camera = new OrthographicCamera(orthWidth / 2, orthWidth / -2, orthHeight / 2, orthHeight / -2, near, far);
  return camera;
}

export {
  generatePerspectiveCamera,
  generateOrthographicCamera
};