import { Component, useEffect, useInsertionEffect, useLayoutEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { Box3, MathUtils, OrthographicCamera, PCFShadowMap, Vector3 } from 'three';
import type { OrbitControls as Controls } from 'three-stdlib';
import HouseModel from './HouseModel';
import { DeviceMarkers, MarkerProjection, type MarkerElements } from './DeviceMarkers';
import type { HouseSceneProps, RoomId } from './types';

const overview = new Box3(new Vector3(-5.65, -0.4, -4.1), new Vector3(5.65, 3.15, 4.65));
const roomBounds: Record<RoomId, Box3> = {
  all: overview,
  living: new Box3(new Vector3(-5, 0, -0.6), new Vector3(1, 2.55, 3.6)),
  bedroom: new Box3(new Vector3(1, 0, -3.6), new Vector3(5, 2.55, 0.7)),
  entry: new Box3(new Vector3(1.05, 0, 0.55), new Vector3(5, 2.65, 4.6)),
};
const direction = new Vector3(10.8, 12.7, 14.8).normalize();

function CameraRig({ room, viewCommand, reducedMotion }: Pick<HouseSceneProps, 'room' | 'viewCommand' | 'reducedMotion'>) {
  const controls = useRef<Controls>(null);
  const { camera, size, invalidate } = useThree();
  const targetPosition = useRef(new Vector3());
  const targetLook = useRef(new Vector3());
  const targetZoom = useRef(1);
  const baseZoom = useRef(1);
  const transition = useRef(false);
  const initial = useRef(true);
  const settleFrames = useRef(0);

  const fit = () => {
    // Own both frustum dimensions together. A resize must never compose a new
    // viewport with the previous canvas aspect ratio under demand rendering.
    const cam = camera as OrthographicCamera;
    cam.left = -size.width / 2;
    cam.right = size.width / 2;
    cam.top = size.height / 2;
    cam.bottom = -size.height / 2;
    cam.updateProjectionMatrix();
    const bounds = roomBounds[room];
    const center = bounds.getCenter(new Vector3());
    const right = new Vector3().crossVectors(direction, new Vector3(0, 1, 0)).normalize();
    const up = new Vector3().crossVectors(right, direction).normalize();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const x of [bounds.min.x, bounds.max.x]) for (const y of [bounds.min.y, bounds.max.y]) for (const z of [bounds.min.z, bounds.max.z]) {
      const relative = new Vector3(x, y, z).sub(center);
      const px = relative.dot(right), py = relative.dot(up);
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
    baseZoom.current = Math.min(size.width / (maxX - minX), size.height / (maxY - minY)) * (size.width < 500 ? 0.86 : 0.91);
    targetZoom.current = baseZoom.current;
    targetLook.current.copy(center);
    targetPosition.current.copy(center).addScaledVector(direction, 23);
    transition.current = true;
    settleFrames.current = 2;
    if (initial.current || reducedMotion) {
      camera.position.copy(targetPosition.current);
      (camera as OrthographicCamera).zoom = targetZoom.current;
      camera.lookAt(center);
      camera.updateProjectionMatrix();
      controls.current?.target.copy(center);
      initial.current = false;
    }
    invalidate();
  };
  useLayoutEffect(fit, [room, size.width, size.height, reducedMotion]);
  useEffect(() => {
    if (viewCommand.kind === 'reset') fit();
    else {
      const cam = camera as OrthographicCamera;
      targetPosition.current.copy(camera.position);
      if (controls.current) targetLook.current.copy(controls.current.target);
      targetZoom.current = MathUtils.clamp(cam.zoom * (viewCommand.kind === 'zoom-in' ? 1.22 : 1 / 1.22), baseZoom.current * 0.68, baseZoom.current * 2.4);
      transition.current = true;
      invalidate();
    }
  }, [viewCommand.serial]);
  useFrame((_, dt) => {
    const cam = camera as OrthographicCamera;
    // Fiber's ResizeObserver/store and React effects may settle in separate
    // commits. Reconcile the frustum immediately before the actual GL render.
    if (cam.left !== -_.size.width / 2 || cam.top !== _.size.height / 2) {
      cam.left = -_.size.width / 2;
      cam.right = _.size.width / 2;
      cam.top = _.size.height / 2;
      cam.bottom = -_.size.height / 2;
      cam.updateProjectionMatrix();
      settleFrames.current = 2;
    }
    if (settleFrames.current > 0) {
      settleFrames.current -= 1;
      invalidate();
    }
    if (!transition.current || !controls.current) return;
    const alpha = reducedMotion ? 1 : 1 - Math.exp(-dt * 9);
    cam.position.lerp(targetPosition.current, alpha);
    controls.current.target.lerp(targetLook.current, alpha);
    cam.zoom = MathUtils.lerp(cam.zoom, targetZoom.current, alpha);
    cam.updateProjectionMatrix();
    controls.current.update();
    const moving = cam.position.distanceToSquared(targetPosition.current) > 0.00001 || Math.abs(cam.zoom - targetZoom.current) > 0.01 || controls.current.target.distanceToSquared(targetLook.current) > 0.00001;
    if (moving) invalidate();
    else transition.current = false;
  });
  return <OrbitControls ref={controls} makeDefault enablePan={false} enableZoom={false} enableDamping={false} minPolarAngle={0.36} maxPolarAngle={1.12} minAzimuthAngle={-0.55} maxAzimuthAngle={1.32} onStart={() => { transition.current = false; }} onChange={() => invalidate()} />;
}

function Ready({ onReady }: { onReady?: () => void }) {
  const complete = useRef(false);
  const frames = useRef(0);
  const invalidate = useThree(state => state.invalidate);
  const gl = useThree(state => state.gl);
  useFrame(() => {
    if (complete.current) return;
    frames.current += 1;
    if (frames.current === 1) { invalidate(); return; }
    complete.current = true;
    gl.domElement.dataset.drawCalls = String(gl.info.render.calls);
    gl.domElement.dataset.triangles = String(gl.info.render.triangles);
    onReady?.();
  });
  return null;
}

class SceneBoundary extends Component<{ children: ReactNode; onError?: () => void }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(_error: Error, _info: ErrorInfo) { this.props.onError?.(); }
  render() { return this.state.failed ? <SceneUnavailable /> : this.props.children; }
}
function SceneUnavailable() {
  return <div role="status" style={{ display: 'grid', placeItems: 'center', height: '100%', padding: 24, textAlign: 'center', color: '#50615d', background: '#eeefe7' }}>The 3D view is unavailable. Use the device controls below to explore the home.</div>;
}
export default function HouseScene(props: HouseSceneProps) {
  const wrapper = useRef<HTMLDivElement>(null);
  const markers = useRef<MarkerElements>({
    lock: { button: null, line: null, dot: null, labelLine: null },
    'bolt-witness': { button: null, line: null, dot: null, labelLine: null },
    'door-contact': { button: null, line: null, dot: null, labelLine: null },
    light: { button: null, line: null, dot: null, labelLine: null },
  });
  const [active, setActive] = useState(true);
  const contextCleanup = useRef<(() => void) | null>(null);
  const errorCallback = useRef(props.onError);
  errorCallback.current = props.onError;
  // Match Canvas' final-removal lifecycle: StrictMode effect replay must not
  // remove a listener from a renderer that remains mounted.
  useInsertionEffect(() => () => { contextCleanup.current?.(); contextCleanup.current = null; }, []);
  useEffect(() => {
    let intersecting = true;
    const update = () => setActive(intersecting && document.visibilityState !== 'hidden');
    const observer = new IntersectionObserver(entries => { intersecting = entries[0]?.isIntersecting ?? true; update(); }, { rootMargin: '80px' });
    if (wrapper.current) observer.observe(wrapper.current);
    document.addEventListener('visibilitychange', update);
    update();
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); };
  }, []);
  return <div ref={wrapper} className="house-scene" role="group" style={{ width: '100%', height: '100%', minHeight: 300, position: 'relative' }} aria-label="Interactive furnished house. Drag to orbit; use the view controls to zoom or reset. All devices also have controls below.">
    <SceneBoundary onError={props.onError}>
      <Canvas aria-hidden="true" orthographic shadows frameloop={active ? 'demand' : 'never'} dpr={[1, window.innerWidth < 600 ? 1.2 : 1.5]} camera={{ position: [10.8, 12.7, 14.8], zoom: 40, near: 0.1, far: 90 }} gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }} fallback={<SceneUnavailable />} onCreated={({ gl }) => {
        contextCleanup.current?.();
        const canvas = gl.domElement;
        const lost = (event: Event) => { event.preventDefault(); errorCallback.current?.(); };
        canvas.addEventListener('webglcontextlost', lost);
        contextCleanup.current = () => canvas.removeEventListener('webglcontextlost', lost);
        gl.shadowMap.type = PCFShadowMap;
        gl.setClearColor('#f2f1e9');
      }}>
        <color attach="background" args={['#f2f1e9']} />
        <ambientLight intensity={0.9} color="#fff5e4" />
        <hemisphereLight args={['#f8fbf3', '#b9a587', 1.7]} />
        <directionalLight position={[-3, 11, 6]} intensity={3.1} color="#fff8e8" castShadow shadow-mapSize={[1536, 1536]} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={10} shadow-camera-bottom={-10} shadow-camera-near={0.5} shadow-camera-far={30} shadow-normalBias={0.035} shadow-bias={-0.0001} shadow-radius={4} />
        <directionalLight position={[6, 5, -5]} intensity={0.65} color="#dce9e3" />
        <HouseModel {...props} />
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.345, 0]} receiveShadow><planeGeometry args={[200, 200]} /><shadowMaterial transparent opacity={0.13} /></mesh>
        <CameraRig room={props.room} viewCommand={props.viewCommand} reducedMotion={props.reducedMotion} />
        <MarkerProjection elements={markers} selectedDevice={props.selectedDevice} />
        <Ready onReady={props.onReady} />
      </Canvas>
    </SceneBoundary>
    <DeviceMarkers elements={markers} selectedDevice={props.selectedDevice} onSelectDevice={props.onSelectDevice} reducedMotion={props.reducedMotion} />
  </div>;
}

export type { HouseSceneProps } from './types';
