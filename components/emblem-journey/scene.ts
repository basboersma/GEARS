import {
  ACESFilmicToneMapping,
  Box3,
  CanvasTexture,
  DirectionalLight,
  ExtrudeGeometry,
  Group,
  HemisphereLight,
  type Material,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  PerspectiveCamera,
  Scene,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
} from "three";
import { createCollage } from "./collage";
import EMBLEM_PARTS from "./emblem-parts.json";
import { STEPS } from "./steps";
import { CLOSING_STAGE, momentAt, OPENING_STAGE } from "./timeline";

type EmblemPart = (typeof EMBLEM_PARTS)[number];

interface Piece {
  id: string;
  mesh: Mesh<ExtrudeGeometry, Material[]>;
  photo: Mesh<ShapeGeometry, MeshBasicMaterial>;
  home: Vector3; //where it sits in the full emblem
  center: Vector3; //middle of the part's own outline
  focusScale: number; //scale where the part fills the view
}

interface Pose {
  position: Vector3;
  scale: number;
  opacity: number;
  photoOpacity: number;
  tilt: Vector2;
}

const PIECE_DEPTH = 0.38;
const BEVEL = 0.025;
const FOCUS_SIZE = 8.2; //how big a part gets when it's in focus
const SMALL_SCALE = 0.64; //background parts and the closing emblem
const SPREAD = 2.2; //how far background parts move out from the middle
const FADED_OPACITY = 0.18;
const FOCUS_TILT = new Vector2(0.08, -0.16);
const EMBLEM_TILT = new Vector2(0.1, -0.2);
const CAMERA_FOV = 32;
const VIEW_HEIGHT = 10.8; //how much you see vertically when the camera is still
const CAMERA_PULL_BACK = 0.5; //camera pulls back this much mid-transition

function outlineToShape(part: EmblemPart): Shape {
  const shape = new Shape(part.outline.map(([x, y]) => new Vector2(x, y)));
  for (const hole of part.holes) {
    shape.holes.push(new Path(hole.map(([x, y]) => new Vector2(x, y))));
  }
  return shape;
}

//flat face on the front of a part, showing its photo collage
function createPhotoFace(shape: Shape, photos: string[], onReady: () => void) {
  const geometry = new ShapeGeometry(shape);
  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox ?? new Box3();
  const size = bounds.getSize(new Vector3());

  //stretch the outline's box over the whole collage
  const position = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  for (let i = 0; i < position.count; i++) {
    uv.setXY(
      i,
      (position.getX(i) - bounds.min.x) / size.x,
      (position.getY(i) - bounds.min.y) / size.y
    );
  }

  const material = new MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    toneMapped: false,
  });

  const showCollage = async () => {
    try {
      const texture = new CanvasTexture(
        await createCollage(photos, size.x / size.y)
      );
      texture.colorSpace = SRGBColorSpace;
      material.map = texture;
      material.needsUpdate = true;
      onReady();
    } catch { }
  };
  showCollage();

  const face = new Mesh(geometry, material);
  face.position.z = PIECE_DEPTH / 2 + BEVEL + 0.004; //just in front of the bevel
  face.renderOrder = 1;
  return face;
}

function createPiece(part: EmblemPart, onPhotoLoad: () => void): Piece {
  const shape = outlineToShape(part);
  const geometry = new ExtrudeGeometry(shape, {
    depth: PIECE_DEPTH,
    bevelThickness: BEVEL,
    bevelSize: BEVEL,
    bevelOffset: -BEVEL,
    bevelSegments: 3,
    curveSegments: 24,
  });
  geometry.translate(0, 0, -PIECE_DEPTH / 2);
  geometry.computeBoundingBox();

  const front = new MeshPhysicalMaterial({
    color: part.color,
    roughness: 0.36,
    metalness: 0.3,
    clearcoat: 0.28,
    clearcoatRoughness: 0.3,
    transparent: true,
  });
  const side = new MeshStandardMaterial({
    color: part.color,
    roughness: 0.28,
    metalness: 0.52,
    transparent: true,
  });
  const mesh = new Mesh(geometry, [front, side]);

  const step = STEPS.find((item) => item.piece === part.id);
  const photo = createPhotoFace(shape, step?.photos ?? [], onPhotoLoad);
  photo.visible = false;
  mesh.add(photo);

  const bounds = geometry.boundingBox ?? new Box3();
  const size = bounds.getSize(new Vector3());

  return {
    id: part.id,
    mesh,
    photo,
    home: new Vector3(part.center[0], part.center[1], 0),
    center: bounds.getCenter(new Vector3()),
    focusScale: FOCUS_SIZE / Math.max(size.x, size.y),
  };
}

function focusPoint(stage: number): Vector3 {
  const step = STEPS[stage];
  return step ? new Vector3(step.focus[0], step.focus[1], 0) : new Vector3();
}

function poseFor(piece: Piece, stage: number): Pose {
  const focusedPiece = STEPS[stage]?.piece;
  const still = { opacity: 1, photoOpacity: 0, tilt: new Vector2() };

  //opening or closing: the whole emblem, full size or small
  if (!focusedPiece) {
    const scale = stage === CLOSING_STAGE ? SMALL_SCALE : 1;
    return {
      ...still,
      scale,
      position: piece.home.clone().multiplyScalar(scale),
    };
  }

  //a step: its part moves to the focus point, the rest spread out and fade
  if (piece.id !== focusedPiece) {
    return {
      ...still,
      scale: SMALL_SCALE,
      opacity: FADED_OPACITY,
      position: piece.home.clone().multiplyScalar(SPREAD).setZ(-2.5),
    };
  }

  const scale = piece.focusScale;
  return {
    scale,
    opacity: 1,
    photoOpacity: 1,
    tilt: FOCUS_TILT.clone(),
    position: focusPoint(stage)
      .sub(piece.center.clone().multiplyScalar(scale))
      .setZ(1.2),
  };
}

function setOpacity(piece: Piece, opacity: number) {
  for (const material of piece.mesh.material) {
    material.opacity = opacity;
    material.depthWrite = opacity > 0.95; //faded parts shouldn't hide what's behind them
  }
}

export function createEmblemScene(canvas: HTMLCanvasElement) {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;

  const scene = new Scene();
  scene.add(new HemisphereLight(0xff_ff_ff, 0x9c_a3_a8, 2.7));
  const lights: [number, number, number, number][] = [
    [-4, 7, 10, 4],
    [6, -2, 8, 1.8],
    [-4, 2, -3, 2],
  ];
  for (const [x, y, z, intensity] of lights) {
    const light = new DirectionalLight(0xff_ff_ff, intensity);
    light.position.set(x, y, z);
    scene.add(light);
  }

  const camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.1, 150);
  let restDistance = 20;

  const emblem = new Group();
  const pieces = EMBLEM_PARTS.map((part) => createPiece(part, render));
  for (const piece of pieces) {
    emblem.add(piece.mesh);
  }
  scene.add(emblem);

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let time = 0;
  let disposed = false;

  function render() {
    if (disposed) {
      return; //a photo can finish loading after you've left the page
    }
    const moment = momentAt(time);
    if (reducedMotion.matches) {
      //jump straight to each stage, no animation in between
      moment.from = moment.to;
      moment.mix = 0;
    }
    const { from, to, mix } = moment;

    const aim = focusPoint(from).lerp(focusPoint(to), mix);
    camera.position.set(
      aim.x,
      aim.y,
      restDistance * (1 + Math.sin(Math.PI * mix) * CAMERA_PULL_BACK)
    );
    camera.lookAt(aim);

    for (const piece of pieces) {
      const a = poseFor(piece, from);
      const b = poseFor(piece, to);
      piece.mesh.position.lerpVectors(a.position, b.position, mix);
      piece.mesh.scale.setScalar(MathUtils.lerp(a.scale, b.scale, mix));
      const tilt = a.tilt.lerp(b.tilt, mix);
      piece.mesh.rotation.set(tilt.x, tilt.y, 0);
      setOpacity(piece, MathUtils.lerp(a.opacity, b.opacity, mix));

      const photo = piece.photo.material;
      photo.opacity = MathUtils.lerp(a.photoOpacity, b.photoOpacity, mix);
      piece.photo.visible = photo.map !== null && photo.opacity > 0.001;
    }

    //the full emblem is turned a little when it's in one piece
    const isWhole = (stage: number) =>
      stage === OPENING_STAGE || stage === CLOSING_STAGE ? 1 : 0;
    const turn = MathUtils.lerp(isWhole(from), isWhole(to), mix);
    emblem.rotation.set(EMBLEM_TILT.x * turn, EMBLEM_TILT.y * turn, 0);

    renderer.render(scene, camera);
  }

  function resize() {
    const { clientWidth: width, clientHeight: height } = canvas;
    if (!(width && height)) {
      return;
    }
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    //on narrow screens, move the camera back so the emblem keeps its size
    const halfFov = MathUtils.degToRad(CAMERA_FOV / 2);
    restDistance =
      VIEW_HEIGHT / (2 * Math.tan(halfFov)) / Math.min(1, camera.aspect);
    camera.updateProjectionMatrix();
    render();
  }

  function setTime(value: number) {
    if (value === time) {
      return;
    }
    time = value;
    render();
  }

  function dispose() {
    disposed = true;
    for (const piece of pieces) {
      piece.mesh.geometry.dispose();
      for (const material of piece.mesh.material) {
        material.dispose();
      }
      piece.photo.geometry.dispose();
      piece.photo.material.map?.dispose();
      piece.photo.material.dispose();
    }
    renderer.dispose();
  }

  resize();
  return { setTime, resize, dispose };
}

export type EmblemScene = ReturnType<typeof createEmblemScene>;
