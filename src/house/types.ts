export type RoomId = 'all' | 'living' | 'bedroom' | 'entry';
export type DeviceId = 'lock' | 'bolt-witness' | 'door-contact' | 'light';
export interface HouseSceneProps {
  room: RoomId;
  selectedDevice: DeviceId;
  home: { doorOpen: boolean; boltExtended: boolean; lightOn: boolean };
  roofVisible: boolean;
  onSelectDevice: (id: DeviceId) => void;
  onSelectRoom: (room: RoomId) => void;
  viewCommand: { kind: 'reset' | 'zoom-in' | 'zoom-out'; serial: number };
  reducedMotion: boolean;
  onReady?: () => void;
  onError?: () => void;
  incident?: boolean;
}
