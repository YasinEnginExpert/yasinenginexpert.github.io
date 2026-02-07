export type DeviceType = 'router' | 'switch' | 'server' | 'firewall';

export interface Interface {
    id: string; // e.g. "Fa0/0"
    name: string;
    ip?: string;
    mask?: string;
    subnet?: string; // /24
    status: 'up' | 'down' | 'admin_down';
    description?: string;
    mode?: 'access' | 'trunk' | 'routed';
    vlan?: number;
    accessVlan?: number;
    trunkNativeVlan?: number;
    trunkAllowedVlans?: number[];
}

export interface Device {
    id: string; // hostname
    type: DeviceType;
    interfaces: Record<string, Interface>;
    config: string; // Running config as string or object
    x: number;
    y: number;
}

export interface Link {
    id: string;
    source: string; // deviceId
    sourceInt: string; // interfaceId
    target: string;
    targetInt: string;
    status: 'up' | 'down';
}

export interface Topology {
    devices: Record<string, Device>;
    links: Link[];
}

export interface Event {
    id: string;
    type: 'packet' | 'config' | 'system';
    source?: string;
    destination?: string;
    description: string;
    timestamp: number;
}

export interface Mission {
    id: string;
    title: string;
    description: string;
    targetDevice: string;
    targetInt?: string;
    type: 'configure_ip' | 'restore_link' | 'ping_test' | 'interface_up' | 'access_vlan';
    expectedIp?: string;
    expectedMask?: string;
    expectedVlan?: number;
    reward: number;
    completed: boolean;
}

export type FaultCheck =
    | { kind: 'interface_up'; interfaceId: string }
    | { kind: 'interface_ip'; interfaceId: string; ip: string; mask: string }
    | { kind: 'access_vlan'; interfaceId: string; vlan: number };

export interface Fault {
    id: string;
    title: string;
    description: string;
    deviceId: string;
    interfaceId?: string;
    severity: 'critical' | 'major' | 'minor';
    hint: string;
    reward: number;
    resolved: boolean;
    check: FaultCheck;
}

export interface PacketAnimation {
    id: string;
    source: string;
    target: string;
    timestamp: number;
    durationMs?: number;
}

export interface GameSession {
    id: string;
    score: number;
    sla: number; // 0-100
    startTime: number;
    topology: Topology;
    linkStats: Record<string, LinkStats>;
    alerts: Alert[];
    events: Event[];
    missions: Mission[]; // Added this
    faults: Fault[];
    packetAnims: PacketAnimation[]; // Added for visual triggers
}

export interface LinkStats {
    latencyMs: number;
    jitterMs: number;
    lossPct: number;
    lastUpdated: number;
}

export interface Alert {
    id: string;
    severity: 'critical' | 'major' | 'minor';
    message: string;
    timestamp: number;
    active: boolean;
}
