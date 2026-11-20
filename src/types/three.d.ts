declare module 'three' {
  export class Vector3 {
    x: number; y: number; z: number;
    constructor(x?: number, y?: number, z?: number);
    set(x: number, y: number, z: number): this;
    add(value: Vector3): this;
    multiplyScalar(value: number): this;
    normalize(): this;
    setScalar(value: number): this;
    lerp(value: Vector3, alpha: number): this;
  }
  export class Euler { x: number; y: number; z: number; }
  export class Object3D {
    name: string;
    matrix: unknown;
    position: Vector3;
    rotation: Euler;
    scale: Vector3;
    castShadow: boolean;
    receiveShadow: boolean;
    add(...objects: Object3D[]): this;
    updateMatrix(): void;
  }
  export class Group extends Object3D {}
  export class Material { side: number; dispose(): void; }
  export class BufferGeometry { setAttribute(name: string, attribute: BufferAttribute): this; computeVertexNormals(): void; dispose(): void; }
  export class BufferAttribute { constructor(array: Float32Array, itemSize: number); }
  export class Mesh extends Object3D {
    geometry: BufferGeometry;
    material: Material | Material[];
    constructor(geometry?: BufferGeometry, material?: Material | Material[]);
  }
  export class InstancedMesh extends Mesh {
    count: number;
    instanceMatrix: { needsUpdate: boolean };
    constructor(geometry: BufferGeometry, material: Material, count: number);
    setMatrixAt(index: number, matrix: unknown): void;
  }
  export class Scene extends Group { background: unknown; fog: Fog | null; traverse(callback: (object: Object3D) => void): void; }
  export class Color { constructor(value?: string | number); }
  export class Fog { constructor(color: string, near: number, far: number); }
  export class PerspectiveCamera extends Object3D {
    aspect: number;
    constructor(fov: number, aspect: number, near: number, far: number);
    updateProjectionMatrix(): void;
    lookAt(x: number, y: number, z: number): void;
  }
  export class WebGLRenderer {
    domElement: HTMLCanvasElement;
    shadowMap: { enabled: boolean; type: unknown };
    outputColorSpace: unknown;
    toneMapping: unknown;
    toneMappingExposure: number;
    constructor(options?: Record<string, unknown>);
    setPixelRatio(value: number): void;
    setSize(width: number, height: number, updateStyle?: boolean): void;
    render(scene: Scene, camera: PerspectiveCamera): void;
    dispose(): void;
  }
  export class MeshStandardMaterial extends Material { constructor(parameters?: Record<string, unknown>); }
  export class MeshPhysicalMaterial extends MeshStandardMaterial { constructor(parameters?: Record<string, unknown>); }
  export class MeshBasicMaterial extends Material { constructor(parameters?: Record<string, unknown>); }
  export class HemisphereLight extends Object3D { constructor(skyColor?: string, groundColor?: string, intensity?: number); }
  export class DirectionalLight extends Object3D { shadow: { mapSize: { set(width: number, height: number): void }; camera: { left: number; right: number; top: number; bottom: number }; bias: number }; target: Object3D; constructor(color?: string, intensity?: number); }
  export class PointLight extends Object3D { constructor(color?: string, intensity?: number, distance?: number); }
  export class BoxGeometry extends BufferGeometry { constructor(width?: number, height?: number, depth?: number); }
  export class PlaneGeometry extends BufferGeometry { constructor(width?: number, height?: number); }
  export class CircleGeometry extends BufferGeometry { constructor(radius?: number, segments?: number); }
  export class CylinderGeometry extends BufferGeometry { constructor(radiusTop?: number, radiusBottom?: number, height?: number, radialSegments?: number, heightSegments?: number, openEnded?: boolean); }
  export class ConeGeometry extends BufferGeometry { constructor(radius?: number, height?: number, radialSegments?: number); }
  export class SphereGeometry extends BufferGeometry { constructor(radius?: number, widthSegments?: number, heightSegments?: number, phiStart?: number, phiLength?: number, thetaStart?: number, thetaLength?: number); }
  export class IcosahedronGeometry extends BufferGeometry { constructor(radius?: number, detail?: number); }
  export class CapsuleGeometry extends BufferGeometry { constructor(radius?: number, length?: number, capSegments?: number, radialSegments?: number); }
  export class TorusGeometry extends BufferGeometry { constructor(radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number); }
  export class Object3DConstructor extends Object3D {}
  export const MathUtils: { clamp(value: number, min: number, max: number): number };
  export const DoubleSide: number;
  export const SRGBColorSpace: unknown;
  export const ACESFilmicToneMapping: unknown;
  export const PCFSoftShadowMap: unknown;
}
