import { create } from 'zustand';
import { GameSession, Topology, Event, Interface, LinkStats, Fault } from './types';

let lastIncidentAt = 0;
const linkDownUntil: Record<string, number> = {};

interface GameState extends GameSession {
    // Actions
    initSession: (topology: Topology) => void;
    updateScore: (delta: number) => void;
    updateInterface: (deviceId: string, intName: string, updates: Partial<Interface>) => void;
    addEvent: (event: Omit<Event, 'id' | 'timestamp'>) => void;
    triggerPacket: (source: string, target: string, durationMs?: number) => void;
    checkMissions: () => void;
    checkFaults: () => void;
    addAlert: (msg: string, severity: 'critical' | 'major' | 'minor') => void;
    tick: () => void;
}

const INITIAL_TOPOLOGY: Topology = {
    devices: {
        'R1': {
            id: 'R1',
            type: 'router',
            x: 120,
            y: 100,
            interfaces: {
                'GigabitEthernet0/0': { id: 'GigabitEthernet0/0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0', status: 'up', mode: 'routed' },
                'GigabitEthernet0/1': { id: 'GigabitEthernet0/1', name: 'GigabitEthernet0/1', ip: '10.0.0.1', mask: '255.255.255.252', status: 'admin_down', mode: 'routed' },
                'Loopback0': { id: 'Loopback0', name: 'Loopback0', ip: '1.1.1.1', mask: '255.255.255.255', status: 'up', mode: 'routed' }
            },
            config: '',
        },
        'SW1': {
            id: 'SW1',
            type: 'switch',
            x: 350,
            y: 100,
            interfaces: {
                'GigabitEthernet0/1': { id: 'GigabitEthernet0/1', name: 'GigabitEthernet0/1', status: 'up', mode: 'access', accessVlan: 1 },
                'GigabitEthernet0/2': { id: 'GigabitEthernet0/2', name: 'GigabitEthernet0/2', status: 'up', mode: 'access', accessVlan: 1 },
                'Vlan1': { id: 'Vlan1', name: 'Vlan1', ip: '192.168.1.2', mask: '255.255.255.0', status: 'admin_down', mode: 'routed' }
            },
            config: '',
        },
        'R2': {
            id: 'R2',
            type: 'router',
            x: 240,
            y: 280,
            interfaces: {
                'GigabitEthernet0/0': { id: 'GigabitEthernet0/0', name: 'GigabitEthernet0/0', ip: '10.0.0.2', mask: '255.255.255.252', status: 'up', mode: 'routed' },
                'GigabitEthernet0/1': { id: 'GigabitEthernet0/1', name: 'GigabitEthernet0/1', ip: '172.16.1.1', mask: '255.255.255.0', status: 'up', mode: 'routed' },
                'Loopback0': { id: 'Loopback0', name: 'Loopback0', ip: '2.2.2.2', mask: '255.255.255.255', status: 'up', mode: 'routed' }
            },
            config: '',
        }
    },
    links: [
        { id: 'l1', source: 'R1', sourceInt: 'GigabitEthernet0/1', target: 'SW1', targetInt: 'GigabitEthernet0/1', status: 'up' },
        { id: 'l2', source: 'SW1', sourceInt: 'GigabitEthernet0/2', target: 'R2', targetInt: 'GigabitEthernet0/0', status: 'up' }
    ]
};

const createInitialFaults = (): Fault[] => ([
    {
        id: 'f1',
        title: 'R1 Uplink Admin Down',
        description: 'Gi0/1 is administratively shut on R1.',
        deviceId: 'R1',
        interfaceId: 'GigabitEthernet0/1',
        severity: 'major',
        hint: 'Check "show ip int brief" then run: interface gi0/1 -> no shutdown.',
        reward: 250,
        resolved: false,
        check: { kind: 'interface_up', interfaceId: 'GigabitEthernet0/1' }
    },
    {
        id: 'f2',
        title: 'SW1 SVI Down',
        description: 'Vlan1 SVI is administratively down on SW1.',
        deviceId: 'SW1',
        interfaceId: 'Vlan1',
        severity: 'minor',
        hint: 'Open interface vlan1 and use "no shutdown".',
        reward: 200,
        resolved: false,
        check: { kind: 'interface_up', interfaceId: 'Vlan1' }
    },
    {
        id: 'f3',
        title: 'Access VLAN Mismatch',
        description: 'Gi0/2 should be in VLAN 20 on SW1.',
        deviceId: 'SW1',
        interfaceId: 'GigabitEthernet0/2',
        severity: 'major',
        hint: 'Run "show vlan brief". Then: interface gi0/2 -> switchport access vlan 20.',
        reward: 300,
        resolved: false,
        check: { kind: 'access_vlan', interfaceId: 'GigabitEthernet0/2', vlan: 20 }
    },
    {
        id: 'f4',
        title: 'Wrong R2 LAN IP',
        description: 'Gi0/1 should be 172.16.0.1/24 on R2.',
        deviceId: 'R2',
        interfaceId: 'GigabitEthernet0/1',
        severity: 'critical',
        hint: 'Use "show ip int brief". Then: interface gi0/1 -> ip address 172.16.0.1 255.255.255.0.',
        reward: 400,
        resolved: false,
        check: { kind: 'interface_ip', interfaceId: 'GigabitEthernet0/1', ip: '172.16.0.1', mask: '255.255.255.0' }
    }
]);

export const useGameStore = create<GameState>((set, get) => ({
    id: 'session-' + Math.random().toString(36).substr(2, 9),
    score: 0,
    sla: 100,
    startTime: Date.now(),
    topology: INITIAL_TOPOLOGY,
    linkStats: {},
    alerts: [],
    events: [],
    packetAnims: [],
    faults: createInitialFaults(),
    missions: [
        {
            id: 'm1',
            title: 'Restore R1 Uplink',
            description: 'Bring Gi0/1 up on R1',
            targetDevice: 'R1',
            targetInt: 'GigabitEthernet0/1',
            type: 'interface_up',
            reward: 300,
            completed: false
        },
        {
            id: 'm2',
            title: 'Revive SW1 SVI',
            description: 'Enable interface Vlan1 on SW1',
            targetDevice: 'SW1',
            targetInt: 'Vlan1',
            type: 'interface_up',
            reward: 250,
            completed: false
        },
        {
            id: 'm3',
            title: 'Fix Access VLAN',
            description: 'Set Gi0/2 access VLAN to 20 on SW1',
            targetDevice: 'SW1',
            targetInt: 'GigabitEthernet0/2',
            type: 'access_vlan',
            expectedVlan: 20,
            reward: 350,
            completed: false
        },
        {
            id: 'm4',
            title: 'Correct R2 LAN IP',
            description: 'Set Gi0/1 to 172.16.0.1/24 on R2',
            targetDevice: 'R2',
            targetInt: 'GigabitEthernet0/1',
            type: 'configure_ip',
            expectedIp: '172.16.0.1',
            expectedMask: '255.255.255.0',
            reward: 400,
            completed: false
        }
    ],

    initSession: (topo) => set({
        topology: topo,
        startTime: Date.now(),
        score: 0,
        sla: 100,
        alerts: [],
        events: [],
        packetAnims: [],
        linkStats: {},
        faults: createInitialFaults()
    }),

    updateScore: (delta) => set((state) => ({ score: state.score + delta })),

    triggerPacket: (source, target, durationMs = 800) => {
        const id = Math.random().toString(36);
        set((state) => ({
            packetAnims: [...state.packetAnims, { id, source, target, timestamp: Date.now(), durationMs }]
        }));
        setTimeout(() => {
            set((state) => ({
                packetAnims: state.packetAnims.filter(p => p.id !== id)
            }));
        }, Math.max(300, durationMs + 200)); // Remove after animation
    },

    checkMissions: () => {
        const state = get();
        const newMissions = state.missions.map(m => {
            if (m.completed) return m;
            const dev = state.topology.devices[m.targetDevice];
            const int = m.targetInt ? dev?.interfaces[m.targetInt] : undefined;

            let done = false;
            if (m.type === 'configure_ip') {
                done = !!int && int.ip === m.expectedIp && int.mask === m.expectedMask;
            } else if (m.type === 'interface_up' || m.type === 'restore_link') {
                done = !!int && int.status === 'up';
            } else if (m.type === 'access_vlan') {
                done = !!int && int.mode === 'access' && int.accessVlan === m.expectedVlan;
            }

            if (done) {
                get().updateScore(m.reward);
                get().addEvent({ type: 'system', description: `MISSION COMPLETE: ${m.title}`, source: 'SYSTEM' });
                return { ...m, completed: true };
            }
            return m;
        });
        set({ missions: newMissions });
    },

    checkFaults: () => {
        const state = get();
        const resolved: Fault[] = [];
        const updated = state.faults.map(f => {
            if (f.resolved) return f;
            const dev = state.topology.devices[f.deviceId];
            const int = f.interfaceId ? dev?.interfaces[f.interfaceId] : undefined;
            let ok = false;
            if (f.check.kind === 'interface_up') {
                ok = !!int && int.status === 'up';
            } else if (f.check.kind === 'interface_ip') {
                ok = !!int && int.ip === f.check.ip && int.mask === f.check.mask;
            } else if (f.check.kind === 'access_vlan') {
                ok = !!int && int.mode === 'access' && int.accessVlan === f.check.vlan;
            }
            if (ok) {
                resolved.push(f);
                return { ...f, resolved: true };
            }
            return f;
        });

        if (resolved.length) {
            const reward = resolved.reduce((sum, f) => sum + f.reward, 0);
            resolved.forEach(f => {
                get().addEvent({ type: 'system', description: `FAULT CLEARED: ${f.title}`, source: 'NMS' });
            });
            set({ faults: updated, score: state.score + reward });
        } else {
            set({ faults: updated });
        }
    },

    addEvent: (event: Omit<Event, 'id' | 'timestamp'>) => set((state) => ({
        events: [
            {
                ...event,
                id: Math.random().toString(36),
                timestamp: Date.now()
            } as Event,
            ...state.events.slice(0, 49) // Keep last 50 events
        ]
    })),

    updateInterface: (deviceId, intName, updates) => {
        set((state) => {
            const newDevices = { ...state.topology.devices };
            if (newDevices[deviceId]) {
                newDevices[deviceId].interfaces[intName] = {
                    ...newDevices[deviceId].interfaces[intName],
                    ...updates
                };
            }
            return { topology: { ...state.topology, devices: newDevices } };
        });
        get().checkMissions(); // Auto-check after interface change
        get().checkFaults();
    },

    addAlert: (msg, severity) => set((state) => ({
        alerts: [
            {
                id: Math.random().toString(36),
                message: msg,
                severity,
                timestamp: Date.now(),
                active: true
            },
            ...state.alerts
        ]
    })),

    tick: () => set((state) => {
        const now = Date.now();

        const severityWeight = (s: 'critical' | 'major' | 'minor') => {
            if (s === 'critical') return 2.5;
            if (s === 'major') return 1.2;
            return 0.4;
        };

        const activeAlerts = state.alerts.filter(a => a.active);
        const decay = activeAlerts.reduce((sum, a) => sum + severityWeight(a.severity), 0) * 0.12;

        const resolveAfterMs = 45_000;
        let alertsChanged = false;
        const newAlerts = state.alerts.map(a => {
            if (!a.active) return a;
            if (now - a.timestamp >= resolveAfterMs) {
                alertsChanged = true;
                return { ...a, active: false };
            }
            return a;
        });

        const hasActiveCritical = activeAlerts.some(a => a.severity === 'critical');
        const incidentCooldownMs = 20_000;
        const canCreateIncident = now - lastIncidentAt > incidentCooldownMs;

        let newAlert: { id: string; message: string; severity: 'critical' | 'major' | 'minor'; timestamp: number; active: boolean } | null = null;
        let newEvent: { id: string; type: 'system'; description: string; source: string; timestamp: number } | null = null;
        let resolveEvent: { id: string; type: 'system'; description: string; source: string; timestamp: number } | null = null;

        if (!hasActiveCritical && canCreateIncident) {
            const roll = Math.random();
            const createMinor = roll < 0.05;
            const createMajor = roll >= 0.05 && roll < 0.07;
            const createCritical = roll >= 0.07 && roll < 0.075;

            if (createMinor || createMajor || createCritical) {
                lastIncidentAt = now;
                const severity: 'critical' | 'major' | 'minor' = createCritical ? 'critical' : (createMajor ? 'major' : 'minor');
                const msg = severity === 'critical'
                    ? 'BGP session flap detected on edge (R1)'
                    : severity === 'major'
                        ? 'Interface errors rising on SW1 uplink'
                        : 'Latency spike detected on transit path';

                newAlert = {
                    id: Math.random().toString(36),
                    message: msg,
                    severity,
                    timestamp: now,
                    active: true
                };
                newEvent = {
                    id: Math.random().toString(36),
                    type: 'system',
                    description: `INCIDENT OPENED: ${severity.toUpperCase()} - ${msg}`,
                    source: 'NMS',
                    timestamp: now
                };
            }
        }

        if (alertsChanged) {
            const resolvedCount = newAlerts.filter(a => !a.active && (now - a.timestamp >= resolveAfterMs)).length;
            if (resolvedCount > 0) {
                resolveEvent = {
                    id: Math.random().toString(36),
                    type: 'system',
                    description: `INCIDENT UPDATE: Auto-resolved ${resolvedCount} alert(s)`,
                    source: 'NMS',
                    timestamp: now
                };
            }
        }

        const finalAlerts = alertsChanged ? newAlerts : state.alerts;

        const linkStats: Record<string, LinkStats> = { ...state.linkStats };
        const linkEvents: Event[] = [];
        const links = state.topology.links.map(link => {
            const existing = linkStats[link.id];
            const baselineLatency = existing?.latencyMs ?? (20 + Math.random() * 40);
            const jitter = Math.max(1, (existing?.jitterMs ?? 3) + (Math.random() - 0.5) * 2);
            const loss = Math.max(0, Math.min(6, (existing?.lossPct ?? 0.5) + (Math.random() - 0.4)));
            linkStats[link.id] = {
                latencyMs: Math.max(5, Math.min(120, baselineLatency + (Math.random() - 0.5) * 10)),
                jitterMs: Math.max(0.5, Math.min(30, jitter)),
                lossPct: Math.max(0, Math.min(12, loss)),
                lastUpdated: now
            };

            const isDown = link.status === 'down';
            const cooldownOk = !linkDownUntil[link.id] || now > linkDownUntil[link.id];
            const flapChance = 0.015;
            if (!isDown && Math.random() < flapChance) {
                linkDownUntil[link.id] = now + 8000 + Math.random() * 12000;
                linkEvents.push({
                    id: Math.random().toString(36),
                    type: 'system',
                    description: `LINK DOWN: ${link.source} ${link.sourceInt} -> ${link.target} ${link.targetInt}`,
                    source: 'NMS',
                    timestamp: now
                });
                return { ...link, status: 'down' as const };
            }
            if (isDown && cooldownOk) {
                linkEvents.push({
                    id: Math.random().toString(36),
                    type: 'system',
                    description: `LINK UP: ${link.source} ${link.sourceInt} -> ${link.target} ${link.targetInt}`,
                    source: 'NMS',
                    timestamp: now
                });
                return { ...link, status: 'up' as const };
            }
            return link;
        });

        const devices = { ...state.topology.devices };
        const linkMap = new Map(links.map(l => [l.id, l]));
        state.topology.links.forEach((oldLink) => {
            const updated = linkMap.get(oldLink.id);
            if (!updated || updated.status === oldLink.status) return;
            const src = devices[updated.source];
            const dst = devices[updated.target];
            const srcInt = src?.interfaces[updated.sourceInt];
            const dstInt = dst?.interfaces[updated.targetInt];
            if (srcInt && srcInt.status !== 'admin_down') {
                src.interfaces[updated.sourceInt] = {
                    ...srcInt,
                    status: updated.status === 'down' ? 'down' : 'up'
                };
            }
            if (dstInt && dstInt.status !== 'admin_down') {
                dst.interfaces[updated.targetInt] = {
                    ...dstInt,
                    status: updated.status === 'down' ? 'down' : 'up'
                };
            }
        });

        const topology = { ...state.topology, links, devices };

        const finalEvents = [
            ...(newEvent ? [newEvent] : []),
            ...(resolveEvent ? [resolveEvent] : []),
            ...linkEvents,
            ...state.events
        ].slice(0, 50);

        return {
            sla: Math.max(0, state.sla - decay),
            alerts: newAlert ? [newAlert, ...finalAlerts] : finalAlerts,
            events: finalEvents,
            linkStats,
            topology
        };
    })
}));
