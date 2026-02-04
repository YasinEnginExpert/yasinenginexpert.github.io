import { create } from 'zustand';
import { GameSession, Topology } from './types';

interface GameState extends GameSession {
    // Actions
    initSession: (topology: Topology) => void;
    updateScore: (delta: number) => void;
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
                'GigabitEthernet0/0': { id: 'GigabitEthernet0/0', name: 'GigabitEthernet0/0', ip: '192.168.1.1', status: 'up' },
                'GigabitEthernet0/1': { id: 'GigabitEthernet0/1', name: 'GigabitEthernet0/1', ip: '10.0.0.1', status: 'up' },
                'Loopback0': { id: 'Loopback0', name: 'Loopback0', ip: '1.1.1.1', status: 'up' }
            },
            config: '',
        },
        'SW1': {
            id: 'SW1',
            type: 'switch',
            x: 350,
            y: 100,
            interfaces: {
                'GigabitEthernet0/1': { id: 'GigabitEthernet0/1', name: 'GigabitEthernet0/1', status: 'up' },
                'GigabitEthernet0/2': { id: 'GigabitEthernet0/2', name: 'GigabitEthernet0/2', status: 'up' },
                'Vlan1': { id: 'Vlan1', name: 'Vlan1', ip: '192.168.1.2', status: 'up' }
            },
            config: '',
        },
        'R2': {
            id: 'R2',
            type: 'router',
            x: 240,
            y: 280,
            interfaces: {
                'GigabitEthernet0/0': { id: 'GigabitEthernet0/0', name: 'GigabitEthernet0/0', ip: '10.0.0.2', status: 'up' },
                'GigabitEthernet0/1': { id: 'GigabitEthernet0/1', name: 'GigabitEthernet0/1', ip: '172.16.0.1', status: 'up' },
                'Loopback0': { id: 'Loopback0', name: 'Loopback0', ip: '2.2.2.2', status: 'up' }
            },
            config: '',
        }
    },
    links: [
        { id: 'l1', source: 'R1', sourceInt: 'GigabitEthernet0/1', target: 'SW1', targetInt: 'GigabitEthernet0/1', status: 'up' },
        { id: 'l2', source: 'SW1', sourceInt: 'GigabitEthernet0/2', target: 'R2', targetInt: 'GigabitEthernet0/0', status: 'up' }
    ]
};

export const useGameStore = create<GameState & {
    updateInterface: (deviceId: string, intName: string, updates: Partial<any>) => void,
    addEvent: (event: Omit<any, 'id' | 'timestamp'>) => void,
    triggerPacket: (source: string, target: string) => void,
    checkMissions: () => void
}>((set, get) => ({
    id: 'session-' + Math.random().toString(36).substr(2, 9),
    score: 0,
    sla: 100,
    startTime: Date.now(),
    topology: INITIAL_TOPOLOGY,
    alerts: [],
    events: [],
    packetAnims: [],
    missions: [
        {
            id: 'm1',
            title: 'Initialize Gateway',
            description: 'Configure IP 10.0.0.1 on R1 Gi0/1',
            targetDevice: 'R1',
            targetInt: 'Gi0/1',
            type: 'configure_ip',
            reward: 500,
            completed: false
        },
        {
            id: 'm2',
            title: 'Connectivity Test',
            description: 'Ping R2 from R1 successfully',
            targetDevice: 'R1',
            type: 'ping_test',
            reward: 1000,
            completed: false
        }
    ],

    initSession: (topo) => set({ topology: topo, startTime: Date.now(), score: 0, sla: 100, alerts: [], events: [], packetAnims: [] }),

    updateScore: (delta) => set((state) => ({ score: state.score + delta })),

    triggerPacket: (source, target) => {
        const id = Math.random().toString(36);
        set((state) => ({
            packetAnims: [...state.packetAnims, { id, source, target, timestamp: Date.now() }]
        }));
        setTimeout(() => {
            set((state) => ({
                packetAnims: state.packetAnims.filter(p => p.id !== id)
            }));
        }, 1000); // Remove after animation
    },

    checkMissions: () => {
        const state = get();
        const newMissions = state.missions.map(m => {
            if (m.completed) return m;

            if (m.type === 'configure_ip') {
                const dev = state.topology.devices[m.targetDevice];
                const int = dev?.interfaces[m.targetInt!];
                if (int?.ip === '10.0.0.1') {
                    get().updateScore(m.reward);
                    get().addEvent({ type: 'system', description: `MISSION COMPLETE: ${m.title}`, source: 'SYSTEM' });
                    return { ...m, completed: true };
                }
            }
            return m;
        });
        set({ missions: newMissions });
    },

    addEvent: (event) => set((state) => ({
        events: [
            {
                ...event,
                id: Math.random().toString(36),
                timestamp: Date.now()
            },
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
        const decay = state.alerts.filter(a => a.active).length * 0.1;
        return { sla: Math.max(0, state.sla - decay) };
    })
}));
