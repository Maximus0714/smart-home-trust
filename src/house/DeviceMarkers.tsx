import { useEffect, useMemo, type MutableRefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Lamp, LockKeyhole, Radio, ScanLine } from 'lucide-react';
import { Vector3 } from 'three';
import type { DeviceId, HouseSceneProps } from './types';
import './device-markers.css';

const devices = [
  { id: 'lock', name: 'Front door', Icon: LockKeyhole, offset: [-46, 32] },
  { id: 'bolt-witness', name: 'Bolt witness', Icon: Radio, offset: [36, 2] },
  { id: 'door-contact', name: 'Door contact', Icon: ScanLine, offset: [12, -44] },
  { id: 'light', name: 'Living room light', Icon: Lamp, offset: [0, -31] },
] as const;

interface MarkerElement { button: HTMLButtonElement | null; line: SVGLineElement | null; dot: SVGCircleElement | null; labelLine: SVGLineElement | null }
export type MarkerElements = Record<DeviceId, MarkerElement>;
type Registry = MutableRefObject<MarkerElements>;
type MarkerProps = Pick<HouseSceneProps, 'selectedDevice' | 'onSelectDevice' | 'reducedMotion'> & { elements: Registry };

export function DeviceMarkers({ elements, selectedDevice, onSelectDevice, reducedMotion }: MarkerProps) {
  return <div className="device-markers" role="group" aria-label="Devices in the home" data-reduced-motion={reducedMotion}>
    <svg className="device-marker-lines" aria-hidden="true">{devices.map(({ id }) => <g key={id} data-selected={selectedDevice === id}>
      <line ref={element => { elements.current[id].line = element; }} />
      <circle r="2.5" ref={element => { elements.current[id].dot = element; }} />
      <line className="device-label-connector" ref={element => { elements.current[id].labelLine = element; }} />
    </g>)}</svg>
    {devices.map(({ id, name, Icon }) => <button key={id} type="button" className="device-pin" data-device={id}
      ref={element => { elements.current[id].button = element; }} aria-label={`Select ${name}`} title={name}
      aria-pressed={selectedDevice === id} onClick={event => { event.stopPropagation(); onSelectDevice(id); }}
      onPointerDown={event => event.stopPropagation()}>
      <span className="device-pin-face"><Icon size={18} strokeWidth={1.8} aria-hidden="true" /></span>
      {selectedDevice === id && <span className="device-pin-label">{name}</span>}
    </button>)}
  </div>;
}

interface Placement { id: DeviceId; x: number; y: number; anchorX: number; anchorY: number; visible: boolean }
const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

/** Reads existing demand frames; no React state updates or independent RAF loop. */
export function MarkerProjection({ elements, selectedDevice }: { elements: Registry; selectedDevice: DeviceId }) {
  const { invalidate } = useThree();
  const point = useMemo(() => new Vector3(), []);
  useEffect(() => { invalidate(); }, [selectedDevice, invalidate]);
  useFrame(({ scene, camera, size }) => {
    const left = 26, right = Math.max(left, size.width - 26);
    // Leave top captions/zoom and bottom help/roof controls unobstructed.
    const top = size.width < 600 ? 102 : 87;
    const bottom = Math.max(top + 100, size.height - 84);
    const positions: Placement[] = devices.map(device => {
      const anchor = scene.getObjectByName(`device-anchor-${device.id}`);
      if (!anchor) return { id: device.id, x: 0, y: 0, anchorX: 0, anchorY: 0, visible: false };
      anchor.updateWorldMatrix(true, false);
      anchor.getWorldPosition(point).project(camera);
      const anchorX = (point.x * .5 + .5) * size.width;
      const anchorY = (-point.y * .5 + .5) * size.height;
      return { id: device.id, anchorX, anchorY, x: clamp(anchorX + device.offset[0], left, right), y: clamp(anchorY + device.offset[1], top, bottom), visible: Number.isFinite(anchorX + anchorY) };
    });
    // The entry's three physical sensors share a small region. Separate their
    // screen targets while keeping leaders attached to the actual objects.
    for (let pass = 0; pass < 12; pass++) {
      for (let i = 0; i < positions.length; i++) for (let j = i + 1; j < positions.length; j++) {
        const a = positions[i], b = positions[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const distance = Math.hypot(dx, dy);
        if (distance >= 55 || !a.visible || !b.visible) continue;
        const vx = distance > .1 ? dx / distance : 1;
        const vy = distance > .1 ? dy / distance : 0;
        const shift = (55 - distance) / 2 + .5;
        a.x = clamp(a.x - vx * shift, left, right); a.y = clamp(a.y - vy * shift, top, bottom);
        b.x = clamp(b.x + vx * shift, left, right); b.y = clamp(b.y + vy * shift, top, bottom);
      }
    }
    for (const p of positions) {
      const { button, line, dot, labelLine } = elements.current[p.id];
      if (!button || !line || !dot) continue;
      button.style.visibility = p.visible ? 'visible' : 'hidden';
      button.style.transform = `translate3d(${p.x.toFixed(2)}px,${p.y.toFixed(2)}px,0) translate(-50%,-50%)`;
      button.dataset.projected = 'true';
      // Leaders terminate at the icon rim, rather than running through its face.
      const anchorX = clamp(p.anchorX, 6, size.width - 6), anchorY = clamp(p.anchorY, 6, size.height - 6);
      const distance = Math.hypot(anchorX - p.x, anchorY - p.y);
      const endX = distance > 18 ? p.x + (anchorX - p.x) / distance * 18 : p.x;
      const endY = distance > 18 ? p.y + (anchorY - p.y) / distance * 18 : p.y;
      line.setAttribute('x1', String(anchorX)); line.setAttribute('y1', String(anchorY));
      line.setAttribute('x2', String(endX)); line.setAttribute('y2', String(endY));
      dot.setAttribute('cx', String(anchorX)); dot.setAttribute('cy', String(anchorY));
      line.style.visibility = dot.style.visibility = p.visible ? 'visible' : 'hidden';
      if (labelLine) labelLine.style.visibility = 'hidden';
      if (p.id !== selectedDevice) continue;
      const label = button.querySelector<HTMLElement>('.device-pin-label');
      if (!label) continue;
      // Fixed text widths avoid DOM measurements in the frame callback.
      const width = p.id === 'light' ? 156 : p.id === 'door-contact' ? 124 : p.id === 'bolt-witness' ? 118 : 105;
      const candidates = [
        { x: 29, y: -15 }, { x: -width - 29, y: -15 },
        { x: -width / 2, y: -61 }, { x: -width / 2, y: 31 },
        { x: -width - 29, y: -61 }, { x: 29, y: -61 },
        { x: -width / 2, y: -94 }, { x: -width / 2, y: -124 },
      ];
      const scored = candidates.map(candidate => {
        const x = clamp(p.x + candidate.x, 8, size.width - width - 8);
        const y = clamp(p.y + candidate.y, 72, size.height - 72 - 30);
        const overlap = positions.filter(other => Math.abs(other.x - clamp(other.x, x, x + width)) < 26 && Math.abs(other.y - clamp(other.y, y, y + 30)) < 26).length;
        const moved = Math.abs(x - p.x - candidate.x) + Math.abs(y - p.y - candidate.y);
        return { x, y, score: overlap * 1000 + moved };
      }).sort((a, b) => a.score - b.score);
      const chosen = scored[0];
      label.style.width = `${width}px`;
      label.style.left = `${chosen.x - p.x + 22}px`;
      label.style.top = `${chosen.y - p.y + 22}px`;
      if (labelLine) {
        const endX = clamp(p.x, chosen.x, chosen.x + width), endY = clamp(p.y, chosen.y, chosen.y + 30);
        const distance = Math.hypot(endX - p.x, endY - p.y);
        if (distance > 24) {
          labelLine.setAttribute('x1', String(p.x + (endX - p.x) / distance * 21));
          labelLine.setAttribute('y1', String(p.y + (endY - p.y) / distance * 21));
          labelLine.setAttribute('x2', String(endX)); labelLine.setAttribute('y2', String(endY));
          labelLine.style.visibility = 'visible';
        }
      }
    }
  });
  return null;
}
