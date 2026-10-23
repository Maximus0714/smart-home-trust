import { useEffect, useRef, type ReactNode } from 'react';
import { useFrame, useThree, type ThreeEvent } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import { Group, MathUtils, MeshStandardMaterial } from 'three';
import type { DeviceId, HouseSceneProps, RoomId } from './types';

type Point = [number, number, number];
const colors = { wall: '#f0ece1', wood: '#b18b62', darkWood: '#72563c', sage: '#788774', fabric: '#d8ddcd', ink: '#2e3e3b', brass: '#b99758' };

function Box({ at, size, color, radius = 0, rotation, children, ...rest }: { at: Point; size: Point; color: string; radius?: number; rotation?: Point; children?: ReactNode; onClick?: (e: ThreeEvent<MouseEvent>) => void }) {
  return radius > 0 ? <RoundedBox position={at} args={size} radius={radius} smoothness={2} rotation={rotation} castShadow receiveShadow {...rest}><meshStandardMaterial color={color} roughness={0.78} />{children}</RoundedBox>
    : <mesh position={at} rotation={rotation} castShadow receiveShadow {...rest}><boxGeometry args={size} /><meshStandardMaterial color={color} roughness={0.82} />{children}</mesh>;
}
function Cylinder({ at, radius, height, color, topRadius = radius }: { at: Point; radius: number; height: number; color: string; topRadius?: number }) {
  return <mesh position={at} castShadow receiveShadow><cylinderGeometry args={[topRadius, radius, height, 24]} /><meshStandardMaterial color={color} roughness={0.68} /></mesh>;
}
function Plant({ at, scale = 1 }: { at: Point; scale?: number }) {
  return <group position={at} scale={scale}>
    <Cylinder at={[0, 0.2, 0]} radius={0.23} topRadius={0.28} height={0.4} color="#c7b398" />
    <Cylinder at={[0, 0.4, 0]} radius={0.24} height={0.025} color="#574e3b" />
    {[0, 1, 2, 3, 4, 5].map(i => <mesh key={i} position={[Math.sin(i * 2.4) * 0.2, 0.65 + (i % 3) * 0.16, Math.cos(i * 2.4) * 0.2]} rotation={[i * 0.3, i, 0.5]} scale={[0.16, 0.4, 0.065]} castShadow><sphereGeometry args={[1, 12, 8]} /><meshStandardMaterial color={i % 2 ? '#65795a' : '#899872'} roughness={0.85} /></mesh>)}
  </group>;
}
function Art({ at, width = 1.25, height = 1.1 }: { at: Point; width?: number; height?: number }) {
  return <group position={at}>
    <Box at={[0, 0, 0]} size={[width, height, 0.06]} color={colors.darkWood} />
    <Box at={[0, 0, 0.04]} size={[width - 0.09, height - 0.09, 0.025]} color="#e8ddc8" />
    <mesh position={[-width * 0.14, 0.09, 0.059]}><circleGeometry args={[height * 0.24, 32]} /><meshStandardMaterial color="#a4aa8d" /></mesh>
    <Box at={[width * 0.17, -height * 0.15, 0.06]} size={[width * 0.34, height * 0.32, 0.012]} color="#b87b59" />
  </group>;
}
function Floor({ room, onSelectRoom }: Pick<HouseSceneProps, 'room' | 'onSelectRoom'>) {
  const zone = (id: RoomId, at: Point, size: Point) => <mesh position={at} onClick={e => { e.stopPropagation(); onSelectRoom(id); }}>
    <boxGeometry args={size} /><meshStandardMaterial color="#a3b4a5" transparent opacity={room === id ? 0.22 : 0} depthWrite={false} />
  </mesh>;
  return <>
    <Box at={[0, -0.16, 0]} size={[10.5, 0.34, 7.7]} radius={0.11} color="#ded6c8" />
    <Box at={[0, 0.025, 0]} size={[10.06, 0.07, 7.23]} color="#bda17c" />
    {Array.from({ length: 25 }, (_, i) => <Box key={i} at={[-4.8 + i * 0.4, 0.07, 0]} size={[0.389, 0.022, 7.15]} color={['#bd9d75', '#c4a67f', '#c8ac86', '#bca079'][i % 4]} />)}
    {zone('living', [-2.02, 0.095, 0.35], [5.95, 0.016, 6.3])}
    {zone('bedroom', [3.05, 0.095, -1.35], [3.7, 0.016, 4.3])}
    {zone('entry', [3.05, 0.095, 2.25], [3.7, 0.016, 2.6])}
    <Box at={[0, 0.09, 3.9]} size={[10.1, 0.08, 0.5]} color="#e8e3d7" />
  </>;
}
function Walls() {
  return <group>
    {/* Rear wall and left wall frame the house; near walls remain cut away. */}
    <Box at={[0, 1.34, -3.6]} size={[10.15, 2.65, 0.16]} color={colors.wall} />
    <Box at={[-5, 1.34, 0]} size={[0.16, 2.65, 7.2]} color={colors.wall} />
    <Box at={[5, 0.22, 0]} size={[0.16, 0.3, 7.2]} color={colors.wall} />
    <Box at={[-1.4, 0.22, 3.6]} size={[7.2, 0.3, 0.16]} color={colors.wall} />
    <Box at={[4.4, 0.22, 3.6]} size={[1.2, 0.3, 0.16]} color={colors.wall} />
    <Box at={[1.15, 1.1, -1.45]} size={[0.14, 2.12, 4.3]} color={colors.wall} />
    <Box at={[3.73, 0.55, 0.7]} size={[2.55, 0.94, 0.14]} color={colors.wall} />
    <Box at={[1.15, 0.33, 2.75]} size={[0.14, 0.5, 1.6]} color={colors.wall} />
    <Box at={[0, 0.18, -3.48]} size={[9.8, 0.13, 0.07]} color="#ddd5c5" />
    <Box at={[-4.88, 0.18, 0]} size={[0.07, 0.13, 7.05]} color="#ddd5c5" />
    {/* An inset broad window with joinery and a view of pale sky. */}
    <Box at={[-1.55, 1.77, -3.49]} size={[2.8, 1.24, 0.07]} color="#acbdb9" />
    <Box at={[-1.55, 1.77, -3.42]} size={[2.66, 1.1, 0.025]} color="#d5e2dd" />
    <Box at={[-1.55, 1.77, -3.37]} size={[0.045, 1.15, 0.06]} color="#f7f3e8" />
    <Box at={[-1.55, 1.15, -3.32]} size={[2.97, 0.065, 0.31]} color="#e6dccb" />
    <Art at={[3.05, 1.83, -3.48]} width={1.5} height={0.95} />
  </group>;
}
function Kitchen() {
  return <group>
    <Box at={[-2.2, 0.5, -2.89]} size={[5.15, 0.84, 1]} color={colors.sage} radius={0.035} />
    <Box at={[-2.2, 0.95, -2.89]} size={[5.22, 0.095, 1.06]} color="#e3dfd2" radius={0.028} />
    {[-4.28, -3.25, -2.22, -1.19, -0.16].map(x => <group key={x}>
      <Box at={[x, 0.52, -2.372]} size={[0.985, 0.72, 0.032]} color="#84917c" radius={0.012} />
      <Box at={[x, 0.78, -2.345]} size={[0.31, 0.025, 0.045]} color={colors.brass} radius={0.009} />
    </group>)}
    <Box at={[-2.1, 1.005, -2.9]} size={[1.08, 0.025, 0.68]} color="#aaa89a" radius={0.08} />
    <Box at={[-2.1, 1.018, -2.9]} size={[0.88, 0.025, 0.5]} color="#646e66" radius={0.075} />
    <mesh position={[-2.1, 1.17, -3.17]}><torusGeometry args={[0.16, 0.022, 8, 20, Math.PI]} /><meshStandardMaterial color={colors.brass} metalness={0.65} roughness={0.3} /></mesh>
    <Box at={[-0.35, 1.01, -2.9]} size={[1.04, 0.025, 0.68]} color="#3b4440" radius={0.025} />
    {[-0.65, -0.06].map(x => [-3.09, -2.74].map(z => <mesh key={`${x}${z}`} position={[x, 1.03, z]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.105, 0.119, 24]} /><meshStandardMaterial color="#9a9f93" /></mesh>))}
    <Box at={[-4.13, 1.14, -2.94]} size={[0.41, 0.27, 0.3]} color="#d2bd97" radius={0.04} />
    <Plant at={[-3.2, 0.99, -3.05]} scale={0.48} />
    <Box at={[-2.65, 0.53, -0.95]} size={[2.55, 0.87, 0.88]} color="#e5ddcb" radius={0.045} />
    <Box at={[-2.65, 1, -0.95]} size={[2.78, 0.1, 1.07]} color={colors.wood} radius={0.06} />
    <Cylinder at={[-2.7, 1.08, -0.95]} radius={0.25} height={0.06} color="#dfd2b9" />
    <mesh position={[-2.7, 1.17, -0.95]}><sphereGeometry args={[0.12, 16, 12]} /><meshStandardMaterial color="#b48b57" /></mesh>
    {[-3.45, -1.85].map(x => <group key={x}>
      <Cylinder at={[x, 0.71, -0.07]} radius={0.26} height={0.11} color={colors.darkWood} />
      {[[-0.16, -0.16], [0.16, -0.16], [-0.16, 0.16], [0.16, 0.16]].map(([dx, dz], i) => <Box key={i} at={[x + dx, 0.4, -0.07 + dz]} size={[0.045, 0.56, 0.045]} color={colors.darkWood} />)}
    </group>)}
  </group>;
}
function Living() {
  return <group>
    <Box at={[-2.1, 0.11, 1.85]} size={[4.18, 0.028, 2.8]} color="#e5e1cf" radius={0.1} />
    {Array.from({ length: 12 }, (_, i) => <Box key={i} at={[-3.97 + i * 0.34, 0.128, 1.85]} size={[0.018, 0.006, 2.63]} color="#d2ceba" />)}
    <Box at={[-3.35, 0.36, 1.35]} size={[1.36, 0.37, 2.65]} color={colors.darkWood} radius={0.09} />
    <Box at={[-3.35, 0.65, 1.35]} size={[1.4, 0.32, 2.7]} color={colors.fabric} radius={0.14} />
    <Box at={[-3.93, 1.02, 1.35]} size={[0.27, 0.78, 2.7]} color="#c7cfbc" radius={0.12} />
    {[0.15, 2.55].map(z => <Box key={z} at={[-3.31, 0.92, z]} size={[1.28, 0.5, 0.28]} color="#c7cfbc" radius={0.11} />)}
    {[0.68, 1.94].map(z => <Box key={z} at={[-3.24, 0.86, z]} size={[1.04, 0.16, 1.12]} color="#dce0d0" radius={0.075} />)}
    <Box at={[-3.63, 1.1, 0.65]} size={[0.34, 0.48, 0.55]} rotation={[0.1, 0, -0.24]} color="#b4bea6" radius={0.09} />
    <Box at={[-3.59, 1.08, 2]} size={[0.3, 0.44, 0.51]} rotation={[-0.15, 0, -0.2]} color="#d1b48d" radius={0.09} />
    <Box at={[-1.6, 0.48, 1.58]} size={[1.65, 0.12, 1.09]} color={colors.wood} radius={0.21} />
    {[-2.17, -1.04].map(x => <Box key={x} at={[x, 0.3, 1.58]} size={[0.13, 0.33, 0.55]} color={colors.darkWood} radius={0.035} />)}
    <Box at={[-1.6, 0.56, 1.61]} size={[0.48, 0.055, 0.34]} rotation={[0, 0.15, 0]} color="#7b8c78" radius={0.015} />
    <Cylinder at={[-1.18, 0.64, 1.42]} radius={0.1} height={0.18} color="#ece4d4" />
    <Plant at={[-4.42, 0.11, 2.8]} scale={1.05} />
    <Box at={[0.5, 0.36, 2.36]} size={[0.47, 0.5, 1.55]} color={colors.darkWood} radius={0.035} />
    <Box at={[0.49, 0.82, 2.36]} size={[0.075, 0.63, 1.26]} color="#33423d" radius={0.03} />
    <Box at={[0.44, 0.82, 2.36]} size={[0.015, 0.51, 1.14]} color="#53665d" />
  </group>;
}
function Bedroom() {
  return <group>
    <Box at={[3.13, 0.11, -1.18]} size={[3.05, 0.035, 3.25]} color="#e5ddd0" radius={0.08} />
    <Box at={[3.13, 0.34, -1.55]} size={[2.05, 0.38, 2.75]} color={colors.wood} radius={0.075} />
    <Box at={[3.13, 0.63, -1.55]} size={[1.98, 0.3, 2.68]} color="#f2eee1" radius={0.12} />
    <Box at={[3.13, 0.93, -2.9]} size={[2.18, 1.18, 0.16]} color="#ad9676" radius={0.08} />
    <Box at={[3.13, 0.83, -1.1]} size={[2, 0.15, 1.75]} color="#b5bfa6" radius={0.1} />
    <Box at={[3.13, 0.91, -0.72]} size={[2.025, 0.055, 0.48]} color="#8d9d80" radius={0.025} />
    {[2.62, 3.64].map(x => <Box key={x} at={[x, 0.87, -2.37]} size={[0.78, 0.19, 0.58]} rotation={[0.08, 0, 0]} color="#eee9db" radius={0.12} />)}
    <Box at={[4.54, 0.45, -2.65]} size={[0.61, 0.65, 0.65]} color={colors.wood} radius={0.035} />
    <Cylinder at={[4.54, 0.9, -2.65]} radius={0.07} height={0.2} color={colors.brass} />
    <Cylinder at={[4.54, 1.11, -2.65]} radius={0.2} topRadius={0.12} height={0.29} color="#e8dfc7" />
    <Box at={[1.63, 0.64, -1.28]} size={[0.54, 1.09, 2.08]} color="#d6ccba" radius={0.04} />
    <Box at={[1.92, 0.64, -1.28]} size={[0.025, 0.98, 0.025]} color="#ac9a7e" />
    <Plant at={[4.55, 0.11, 0.12]} scale={0.63} />
  </group>;
}
function DeviceTarget({ id, at, selected, onSelect, children }: { id: DeviceId; at: Point; selected: DeviceId; onSelect: (id: DeviceId) => void; children?: ReactNode; label: string }) {
  const active = selected === id;
  return <group position={at}>
    {children}
    <mesh onClick={e => { e.stopPropagation(); onSelect(id); }} onPointerOver={e => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }} onPointerOut={() => { document.body.style.cursor = ''; }}>
      <sphereGeometry args={[0.25, 12, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
    <mesh position={[0, 0, 0.09]}><sphereGeometry args={[active ? 0.075 : 0.045, 16, 10]} /><meshStandardMaterial color={active ? '#2c7668' : '#f5f2e9'} emissive={active ? '#2c7668' : '#55665c'} emissiveIntensity={0.3} /></mesh>
  </group>;
}
function Entry(props: HouseSceneProps) {
  const pivot = useRef<Group>(null);
  const bolt = useRef<Group>(null);
  const { invalidate } = useThree();
  const target = props.home.doorOpen ? -Math.PI * 0.47 : 0;
  useEffect(() => { invalidate(); }, [target, props.home.boltExtended, invalidate]);
  useFrame((_, dt) => {
    if (!pivot.current || !bolt.current) return;
    const nextDoor = props.reducedMotion ? target : MathUtils.damp(pivot.current.rotation.y, target, 8, dt);
    const boltTarget = props.home.boltExtended ? 0.15 : 0;
    const nextBolt = props.reducedMotion ? boltTarget : MathUtils.damp(bolt.current.position.x, boltTarget, 12, dt);
    const moving = Math.abs(nextDoor - target) > 0.001 || Math.abs(nextBolt - boltTarget) > 0.001;
    pivot.current.rotation.y = moving ? nextDoor : target;
    bolt.current.position.x = moving ? nextBolt : boltTarget;
    if (moving) invalidate();
  });
  return <group>
    <Box at={[3.05, 0.115, 2.66]} size={[1.55, 0.045, 1.08]} color="#6f7867" radius={0.045} />
    <Box at={[2.32, 1.26, 3.57]} size={[0.14, 2.36, 0.22]} color="#d7cbb7" />
    <Box at={[3.63, 1.26, 3.57]} size={[0.14, 2.36, 0.22]} color="#d7cbb7" />
    <Box at={[2.98, 2.48, 3.57]} size={[1.45, 0.12, 0.22]} color="#d7cbb7" />
    <group ref={pivot} position={[2.39, 0.1, 3.57]}>
      <Box at={[0.58, 1.14, 0]} size={[1.16, 2.28, 0.1]} color="#758577" radius={0.025} />
      <Box at={[0.58, 1.5, 0.056]} size={[0.88, 0.96, 0.025]} color="#81907f" radius={0.025} />
      <Box at={[0.58, 0.48, 0.056]} size={[0.88, 0.66, 0.025]} color="#81907f" radius={0.025} />
      <DeviceTarget id="lock" at={[0.99, 1.1, 0.1]} selected={props.selectedDevice} onSelect={props.onSelectDevice} label="Front-door lock">
        <Box at={[0, 0, 0]} size={[0.18, 0.36, 0.07]} color="#33483e" radius={0.035} />
        <Box at={[-0.07, -0.02, 0.07]} size={[0.2, 0.045, 0.055]} color={colors.brass} radius={0.018} />
      </DeviceTarget>
      <group ref={bolt} position={[0, 0, 0]}><Box at={[1.11, 1.32, 0.005]} size={[0.17, 0.075, 0.075]} color="#bca46b" radius={0.015} /></group>
      <Box at={[1.05, 2.08, 0.085]} size={[0.11, 0.18, 0.07]} color="#ede9dd" radius={0.022} />
    </group>
    <DeviceTarget id="bolt-witness" at={[3.74, 1.47, 3.71]} selected={props.selectedDevice} onSelect={props.onSelectDevice} label="Bolt-position witness"><Box at={[0, 0, 0]} size={[0.17, 0.25, 0.09]} color="#ebe7dc" radius={0.025} /></DeviceTarget>
    <DeviceTarget id="door-contact" at={[3.61, 2.23, 3.72]} selected={props.selectedDevice} onSelect={props.onSelectDevice} label="Door-contact witness"><Box at={[0, 0, 0]} size={[0.13, 0.23, 0.07]} color="#ebe7dc" radius={0.025} /></DeviceTarget>
    <Box at={[4.6, 0.42, 2.43]} size={[0.55, 0.6, 1.3]} color={colors.wood} radius={0.045} />
    <Box at={[4.6, 0.78, 2.43]} size={[0.61, 0.12, 1.36]} color="#d5cdb8" radius={0.045} />
    <Plant at={[4.57, 0.84, 2.85]} scale={0.4} />
  </group>;
}
function Lamp(props: HouseSceneProps) {
  const material = useRef<MeshStandardMaterial>(null);
  const intensity = useRef(props.home.lightOn ? 1 : 0);
  const light = useRef<import('three').PointLight>(null);
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [props.home.lightOn, invalidate]);
  useFrame((_, dt) => {
    const target = props.home.lightOn ? 1 : 0;
    intensity.current = props.reducedMotion ? target : MathUtils.damp(intensity.current, target, 9, dt);
    if (material.current) material.current.emissiveIntensity = intensity.current * 0.8;
    if (light.current) light.current.intensity = intensity.current * 15;
    if (Math.abs(intensity.current - target) > 0.002) invalidate();
  });
  return <group position={[-4.3, 0.1, -0.15]}>
    <Cylinder at={[0, 0.055, 0]} radius={0.27} height={0.07} color={colors.darkWood} />
    <Cylinder at={[0, 0.9, 0]} radius={0.025} height={1.7} color={colors.brass} />
    <mesh position={[0, 1.69, 0]} castShadow><cylinderGeometry args={[0.27, 0.42, 0.49, 32, 1, true]} /><meshStandardMaterial ref={material} color="#e7d9b8" emissive="#f7cf83" emissiveIntensity={props.home.lightOn ? 0.8 : 0} side={2} roughness={0.9} /></mesh>
    <pointLight ref={light} position={[0.1, 1.58, 0.1]} color="#ffdca2" intensity={props.home.lightOn ? 15 : 0} distance={4.9} decay={2} />
    <DeviceTarget id="light" at={[0.3, 1.87, 0.2]} selected={props.selectedDevice} onSelect={props.onSelectDevice} label="Living-room light" />
  </group>;
}
function Roof({ visible, reducedMotion }: { visible: boolean; reducedMotion: boolean }) {
  const group = useRef<Group>(null);
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [visible, invalidate]);
  useFrame((_, dt) => {
    if (!group.current) return;
    const target = visible ? 2.86 : 5.4;
    const next = reducedMotion ? target : MathUtils.damp(group.current.position.y, target, 8, dt);
    group.current.position.y = next;
    group.current.visible = visible || Math.abs(next - target) > 0.015;
    if (Math.abs(next - target) > 0.015) invalidate();
  });
  return <group ref={group} visible={visible} position={[0, visible ? 2.86 : 5.4, 0]}>
    <Box at={[-2.62, 0, 0]} size={[5.58, 0.16, 7.65]} rotation={[0, 0, 0.075]} color="#7a897d" radius={0.045} />
    <Box at={[2.62, 0, 0]} size={[5.58, 0.16, 7.65]} rotation={[0, 0, -0.075]} color="#7a897d" radius={0.045} />
    <Box at={[0, 0.22, 0]} size={[0.12, 0.11, 7.7]} color="#5b6d60" radius={0.025} />
  </group>;
}
export default function HouseModel(props: HouseSceneProps) {
  useEffect(() => () => { document.body.style.cursor = ''; }, []);
  return <group>
    <Floor room={props.room} onSelectRoom={props.onSelectRoom} />
    <Walls /><Kitchen /><Living /><Bedroom /><Entry {...props} /><Lamp {...props} />
    <Roof visible={props.roofVisible} reducedMotion={props.reducedMotion} />
  </group>;
}
