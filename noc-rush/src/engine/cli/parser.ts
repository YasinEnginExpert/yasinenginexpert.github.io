import { useGameStore } from '../session';
import { Event } from '../types';

export interface CommandResult {
    output: string;
    success: boolean;
}

type Mode = 'user' | 'privileged' | 'config' | 'config-if' | 'config-router' | 'config-router-bgp' | 'config-vlan';

interface InterfaceState {
    name: string;
    ip?: string;
    mask?: string;
    status: 'up' | 'down' | 'admin_down';
    protocol: 'up' | 'down';
    description?: string;
    mode: 'access' | 'trunk' | 'routed';
    accessVlan?: number;
    trunkNativeVlan?: number;
    trunkAllowedVlans?: number[];
}

interface VlanState {
    id: number;
    name: string;
    status: 'active' | 'suspend';
}

interface OspfNetwork {
    network: string;
    wildcard: string;
    area: string;
}

interface OspfConfig {
    processId: string;
    networks: OspfNetwork[];
}

interface BgpNeighbor {
    ip: string;
    remoteAs: number;
}

interface BgpNetwork {
    network: string;
    mask: string;
}

interface BgpConfig {
    asn: number;
    neighbors: BgpNeighbor[];
    networks: BgpNetwork[];
}

interface StaticRoute {
    network: string;
    mask: string;
    nextHop: string;
}

interface DeviceState {
    hostname: string;
    type: 'router' | 'switch';
    interfaces: Record<string, InterfaceState>;
    staticRoutes: StaticRoute[];
    ospf?: OspfConfig;
    bgp?: BgpConfig;
    vlans?: Record<number, VlanState>;
    arp: Record<string, string>;
}

class NetworkState {
    private static instance: NetworkState;
    devices: Record<string, DeviceState> = {};

    private constructor() {
        this.reset();
    }

    static getInstance(): NetworkState {
        if (!NetworkState.instance) {
            NetworkState.instance = new NetworkState();
        }
        return NetworkState.instance;
    }

    reset() {
        this.devices = {
            'R1': {
                hostname: 'R1',
                type: 'router',
                interfaces: {
                    'GigabitEthernet0/0': { name: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0', status: 'up', protocol: 'up', mode: 'routed' },
                    'GigabitEthernet0/1': { name: 'GigabitEthernet0/1', ip: '10.0.0.1', mask: '255.255.255.252', status: 'admin_down', protocol: 'down', mode: 'routed' },
                    'Loopback0': { name: 'Loopback0', ip: '1.1.1.1', mask: '255.255.255.255', status: 'up', protocol: 'up', mode: 'routed' }
                },
                staticRoutes: [],
                ospf: {
                    processId: '1',
                    networks: [
                        { network: '10.0.0.0', wildcard: '0.0.0.3', area: '0' },
                        { network: '192.168.1.0', wildcard: '0.0.0.255', area: '0' }
                    ]
                },
                bgp: {
                    asn: 65001,
                    neighbors: [],
                    networks: []
                },
                arp: { '192.168.1.2': 'aabb.cc00.0200', '192.168.1.1': 'aabb.cc00.0100' }
            },
            'SW1': {
                hostname: 'SW1',
                type: 'switch',
                interfaces: {
                    'GigabitEthernet0/1': { name: 'GigabitEthernet0/1', status: 'up', protocol: 'up', mode: 'access', accessVlan: 1 },
                    'GigabitEthernet0/2': { name: 'GigabitEthernet0/2', status: 'up', protocol: 'up', mode: 'access', accessVlan: 1 },
                    'Vlan1': { name: 'Vlan1', ip: '192.168.1.2', mask: '255.255.255.0', status: 'admin_down', protocol: 'down', mode: 'routed' }
                },
                staticRoutes: [],
                vlans: {
                    1: { id: 1, name: 'default', status: 'active' },
                    20: { id: 20, name: 'USERS-20', status: 'active' }
                },
                arp: { '192.168.1.1': 'aabb.cc00.0100' }
            },
            'R2': {
                hostname: 'R2',
                type: 'router',
                interfaces: {
                    'GigabitEthernet0/0': { name: 'GigabitEthernet0/0', ip: '10.0.0.2', mask: '255.255.255.252', status: 'up', protocol: 'up', mode: 'routed' },
                    'GigabitEthernet0/1': { name: 'GigabitEthernet0/1', ip: '172.16.1.1', mask: '255.255.255.0', status: 'up', protocol: 'up', mode: 'routed' },
                    'Loopback0': { name: 'Loopback0', ip: '2.2.2.2', mask: '255.255.255.255', status: 'up', protocol: 'up', mode: 'routed' }
                },
                staticRoutes: [],
                ospf: {
                    processId: '1',
                    networks: [
                        { network: '10.0.0.0', wildcard: '0.0.0.3', area: '0' },
                        { network: '172.16.0.0', wildcard: '0.0.0.255', area: '0' }
                    ]
                },
                bgp: {
                    asn: 65002,
                    neighbors: [],
                    networks: []
                },
                arp: { '10.0.0.1': 'aabb.cc00.0100' }
            }
        };
    }
}

export class CLIParser {
    private mode: Mode = 'privileged';
    private currentInterface: string = '';
    private currentRouter: 'ospf' | 'bgp' | null = null;
    private currentVlan: number | null = null;
    private network = NetworkState.getInstance();

    getPrompt(deviceId: string): string {
        const hostname = this.network.devices[deviceId]?.hostname || deviceId;
        switch (this.mode) {
            case 'user': return `${hostname}>`;
            case 'privileged': return `${hostname}#`;
            case 'config': return `${hostname}(config)#`;
            case 'config-if': return `${hostname}(config-if)#`;
            case 'config-router': return `${hostname}(config-router)#`;
            case 'config-router-bgp': return `${hostname}(config-router)#`;
            case 'config-vlan': return `${hostname}(config-vlan)#`;
            default: return `${hostname}>`;
        }
    }

    execute(deviceId: string, input: string, context: { triggerPacket: (s: string, t: string, d?: number) => void; addEvent: (e: Omit<Event, 'id' | 'timestamp'>) => void }): CommandResult {
        const rawCmd = input.trim();
        const tokens = rawCmd.split(/\s+/);
        const cmd = tokens[0]?.toLowerCase();
        const state = this.network.devices[deviceId];
        const { triggerPacket, addEvent } = context;

        if (!state) return { output: '% Device not found', success: false };
        if (!cmd) return { output: '', success: true };

        if (rawCmd === '?' || cmd === 'help') {
            return { output: this.generateHelp(state), success: true };
        }
        if (tokens.includes('?')) {
            return { output: this.generateContextHelp(state, tokens), success: true };
        }

        if ((this.mode === 'config' || this.mode === 'config-if' || this.mode === 'config-router' || this.mode === 'config-router-bgp' || this.mode === 'config-vlan') && cmd === 'do') {
            const execInput = rawCmd.substring(3).trim();
            const originalMode = this.mode;
            const originalRouter = this.currentRouter;
            const originalVlan = this.currentVlan;
            this.mode = 'privileged';
            this.currentRouter = null;
            this.currentVlan = null;
            const result = this.execute(deviceId, execInput, context);
            this.mode = originalMode;
            this.currentRouter = originalRouter;
            this.currentVlan = originalVlan;
            return result;
        }

        if (cmd === 'exit') {
            if (this.mode === 'config-if' || this.mode === 'config-router' || this.mode === 'config-router-bgp' || this.mode === 'config-vlan') {
                this.mode = 'config';
                this.currentInterface = '';
                this.currentRouter = null;
                this.currentVlan = null;
                return { output: '', success: true };
            }
            if (this.mode === 'config') { this.mode = 'privileged'; return { output: '', success: true }; }
            if (this.mode === 'privileged') { this.mode = 'user'; return { output: '', success: true }; }
            return { output: '', success: true };
        }
        if (cmd === 'end') { this.mode = 'privileged'; this.currentRouter = null; this.currentVlan = null; return { output: '', success: true }; }
        if (cmd === 'enable' && this.mode === 'user') { this.mode = 'privileged'; return { output: '', success: true }; }
        if (cmd === 'disable' && this.mode === 'privileged') { this.mode = 'user'; return { output: '', success: true }; }
        if ((cmd === 'configure' || cmd === 'conf') && (tokens[1]?.toLowerCase() === 'terminal' || tokens[1]?.toLowerCase() === 't') && this.mode === 'privileged') {
            this.mode = 'config';
            return { output: 'Enter configuration commands, one per line.  End with CNTL/Z.', success: true };
        }
        if (cmd === 'write' && this.mode === 'privileged') {
            return { output: 'Building configuration...\n[OK]', success: true };
        }
        if (cmd === 'copy' && this.mode === 'privileged') {
            return { output: 'Destination filename [startup-config]? \nBuilding configuration...\n[OK]', success: true };
        }

        if (this.mode === 'privileged' || this.mode === 'user') {
            if (cmd === 'show') {
                const sub = tokens[1]?.toLowerCase();
                if (sub === 'run' || (sub === 'running-config')) return { output: this.generateRunConfig(state), success: true };
                if (sub === 'ip' && (tokens[2]?.toLowerCase() === 'int' || tokens[2]?.toLowerCase() === 'interface') && tokens[3]?.toLowerCase() === 'brief') {
                    return { output: this.generateIpIntBrief(state, deviceId), success: true };
                }
                if (sub === 'ip' && tokens[2]?.toLowerCase() === 'route') return { output: this.generateIpRoute(state, deviceId), success: true };
                if (sub === 'interfaces') return { output: this.generateInterfaces(state, deviceId, tokens[2]), success: true };
                if (sub === 'vlan') return { output: this.generateVlanBrief(state), success: true };
                if (sub === 'log' || sub === 'logging') return { output: this.generateLog(), success: true };
                if (sub === 'clock') return { output: new Date().toLocaleString(), success: true };
            }
            if (cmd === 'ping') {
                return { output: this.simulatePing(deviceId, tokens[1], triggerPacket, addEvent), success: true };
            }
            if (cmd === 'traceroute') {
                return { output: this.simulateTraceroute(deviceId, tokens[1]), success: true };
            }
            if (cmd === 'ssh' || cmd === 'telnet') {
                const target = tokens[1];
                if (!target) return { output: '% Incomplete command', success: false };
                return { output: `Connecting to ${target}... [OK]\nType "exit" to return.`, success: true };
            }
        }

        if (this.mode === 'config') {
            if (cmd === 'hostname' && tokens[1]) {
                const old = state.hostname;
                state.hostname = tokens[1];
                useGameStore.getState().addEvent({
                    type: 'config',
                    description: `Hostname changed from ${old} to ${tokens[1]}`,
                    source: deviceId
                });
                return { output: '', success: true };
            }
            if ((cmd === 'interface' || cmd === 'int') && tokens[1]) {
                const found = normalizeInterfaceName(tokens[1], state.interfaces);
                if (found) { this.mode = 'config-if'; this.currentInterface = found; return { output: '', success: true }; }
                return { output: '% Invalid interface', success: false };
            }
            if (cmd === 'router' && tokens[1]?.toLowerCase() === 'ospf' && tokens[2]) {
                state.ospf = state.ospf ?? { processId: tokens[2], networks: [] };
                state.ospf.processId = tokens[2];
                this.mode = 'config-router';
                this.currentRouter = 'ospf';
                return { output: '', success: true };
            }
            if (cmd === 'router' && tokens[1]?.toLowerCase() === 'bgp' && tokens[2]) {
                const asn = Number(tokens[2]);
                if (Number.isNaN(asn)) return { output: '% Invalid AS number', success: false };
                state.bgp = state.bgp ?? { asn, neighbors: [], networks: [] };
                state.bgp.asn = asn;
                this.mode = 'config-router-bgp';
                this.currentRouter = 'bgp';
                return { output: '', success: true };
            }
            if (cmd === 'vlan' && tokens[1]) {
                if (state.type !== 'switch') return { output: '% VLAN configuration not supported on this device', success: false };
                const vlanId = Number(tokens[1]);
                if (Number.isNaN(vlanId) || vlanId < 1 || vlanId > 4094) return { output: '% Invalid VLAN ID', success: false };
                state.vlans = state.vlans ?? {};
                state.vlans[vlanId] = state.vlans[vlanId] ?? { id: vlanId, name: `VLAN${vlanId}`, status: 'active' };
                this.mode = 'config-vlan';
                this.currentVlan = vlanId;
                return { output: '', success: true };
            }
            if (cmd === 'ip' && tokens[1]?.toLowerCase() === 'route' && tokens.length >= 5) {
                const network = tokens[2];
                const mask = tokens[3];
                const nextHop = tokens[4];
                state.staticRoutes.push({ network, mask, nextHop });
                useGameStore.getState().addEvent({ type: 'config', description: `Static route added: ${network} ${mask} via ${nextHop}`, source: deviceId });
                return { output: '', success: true };
            }
            if (cmd === 'no' && tokens[1]?.toLowerCase() === 'ip' && tokens[2]?.toLowerCase() === 'route' && tokens.length >= 6) {
                const network = tokens[3];
                const mask = tokens[4];
                const nextHop = tokens[5];
                state.staticRoutes = state.staticRoutes.filter(r => !(r.network === network && r.mask === mask && r.nextHop === nextHop));
                useGameStore.getState().addEvent({ type: 'config', description: `Static route removed: ${network} ${mask} via ${nextHop}`, source: deviceId });
                return { output: '', success: true };
            }
        }

        if (this.mode === 'config-router' && this.currentRouter === 'ospf') {
            if (cmd === 'network' && tokens.length >= 5 && tokens[3]?.toLowerCase() === 'area') {
                const network = tokens[1];
                const wildcard = tokens[2];
                const area = tokens[4];
                state.ospf = state.ospf ?? { processId: '1', networks: [] };
                state.ospf.networks.push({ network, wildcard, area });
                return { output: '', success: true };
            }
        }

        if (this.mode === 'config-router-bgp' && this.currentRouter === 'bgp') {
            if (cmd === 'neighbor' && tokens[2]?.toLowerCase() === 'remote-as' && tokens[3]) {
                const ip = tokens[1];
                const remoteAs = Number(tokens[3]);
                if (Number.isNaN(remoteAs)) return { output: '% Invalid AS number', success: false };
                state.bgp = state.bgp ?? { asn: 65000, neighbors: [], networks: [] };
                const existing = state.bgp.neighbors.find(n => n.ip === ip);
                if (existing) existing.remoteAs = remoteAs;
                else state.bgp.neighbors.push({ ip, remoteAs });
                return { output: '', success: true };
            }
            if (cmd === 'network' && tokens[2]?.toLowerCase() === 'mask' && tokens[3]) {
                const network = tokens[1];
                const mask = tokens[3];
                state.bgp = state.bgp ?? { asn: 65000, neighbors: [], networks: [] };
                state.bgp.networks.push({ network, mask });
                return { output: '', success: true };
            }
        }

        if (this.mode === 'config-vlan' && this.currentVlan) {
            if (cmd === 'name' && tokens[1]) {
                state.vlans = state.vlans ?? {};
                const vlan = state.vlans[this.currentVlan];
                if (vlan) vlan.name = tokens.slice(1).join(' ');
                return { output: '', success: true };
            }
        }

        if (this.mode === 'config-if') {
            const int = state.interfaces[this.currentInterface];
            if (!int) return { output: '% Invalid interface', success: false };

            if (cmd === 'description' && tokens[1]) {
                int.description = tokens.slice(1).join(' ');
                return { output: '', success: true };
            }
            if (cmd === 'ip' && tokens[1]?.toLowerCase() === 'address') {
                const ip = tokens[2];
                const mask = tokens[3];
                if (!ip || !mask) return { output: '% Incomplete command', success: false };
                if (int.mode !== 'routed' && int.name.toLowerCase().startsWith('vlan') === false) {
                    return { output: '% Command rejected: interface is a switchport', success: false };
                }
                int.ip = ip;
                int.mask = mask;
                useGameStore.getState().updateInterface(deviceId, this.currentInterface, { ip, mask });
                return { output: '', success: true };
            }
            if (cmd === 'no' && tokens[1]?.toLowerCase() === 'ip' && tokens[2]?.toLowerCase() === 'address') {
                int.ip = undefined;
                int.mask = undefined;
                useGameStore.getState().updateInterface(deviceId, this.currentInterface, { ip: undefined, mask: undefined });
                return { output: '', success: true };
            }
            if (cmd === 'shutdown') {
                int.status = 'admin_down';
                int.protocol = 'down';
                useGameStore.getState().updateInterface(deviceId, this.currentInterface, { status: 'admin_down' });
                useGameStore.getState().addEvent({
                    type: 'system',
                    description: `Interface ${this.currentInterface} administratively down`,
                    source: deviceId
                });
                return { output: 'Interface changed state to administratively down', success: true };
            }
            if (cmd === 'no' && tokens[1]?.toLowerCase() === 'shutdown') {
                int.status = 'up';
                int.protocol = 'up';
                useGameStore.getState().updateInterface(deviceId, this.currentInterface, { status: 'up' });
                useGameStore.getState().addEvent({
                    type: 'system',
                    description: `Interface ${this.currentInterface} state to UP`,
                    source: deviceId
                });
                return { output: 'Interface changed state to up', success: true };
            }
            if (cmd === 'switchport' && state.type === 'switch') {
                if (tokens[1]?.toLowerCase() === 'mode' && tokens[2]) {
                    const mode = tokens[2].toLowerCase();
                    if (mode === 'access' || mode === 'trunk') {
                        int.mode = mode;
                        useGameStore.getState().updateInterface(deviceId, this.currentInterface, { mode });
                        return { output: '', success: true };
                    }
                }
                if (tokens[1]?.toLowerCase() === 'access' && tokens[2]?.toLowerCase() === 'vlan' && tokens[3]) {
                    const vlan = Number(tokens[3]);
                    if (Number.isNaN(vlan)) return { output: '% Invalid VLAN ID', success: false };
                    int.accessVlan = vlan;
                    useGameStore.getState().updateInterface(deviceId, this.currentInterface, { accessVlan: vlan });
                    return { output: '', success: true };
                }
                if (tokens[1]?.toLowerCase() === 'trunk' && tokens[2]?.toLowerCase() === 'allowed' && tokens[3]?.toLowerCase() === 'vlan' && tokens[4]) {
                    const allowed = parseVlanList(tokens[4]);
                    int.trunkAllowedVlans = allowed;
                    useGameStore.getState().updateInterface(deviceId, this.currentInterface, { trunkAllowedVlans: allowed });
                    return { output: '', success: true };
                }
                if (tokens[1]?.toLowerCase() === 'trunk' && tokens[2]?.toLowerCase() === 'native' && tokens[3]?.toLowerCase() === 'vlan' && tokens[4]) {
                    const nativeVlan = Number(tokens[4]);
                    int.trunkNativeVlan = nativeVlan;
                    useGameStore.getState().updateInterface(deviceId, this.currentInterface, { trunkNativeVlan: nativeVlan });
                    return { output: '', success: true };
                }
            }
        }

        return { output: `% Invalid input detected at '^' marker.\n\n${rawCmd}\n^`, success: false };
    }

    private generateHelp(_state: DeviceState): string {
        if (this.mode === 'user') {
            return [
                'Exec commands:',
                '  enable',
                '  show',
                '  ping',
                '  traceroute',
                '  ssh',
                '  telnet',
                '  exit',
                '  ?'
            ].join('\n');
        }
        if (this.mode === 'privileged') {
            return [
                'Exec commands:',
                '  disable',
                '  show',
                '  ping',
                '  traceroute',
                '  configure terminal',
                '  write',
                '  copy',
                '  exit',
                '  ?'
            ].join('\n');
        }
        if (this.mode === 'config') {
            return [
                'Config commands:',
                '  hostname',
                '  interface',
                '  router',
                '  vlan',
                '  ip route',
                '  exit',
                '  end',
                '  do',
                '  ?'
            ].join('\n');
        }
        if (this.mode === 'config-if') {
            return [
                'Interface config commands:',
                '  description',
                '  ip address',
                '  shutdown',
                '  no shutdown',
                '  switchport',
                '  exit',
                '  end',
                '  do',
                '  ?'
            ].join('\n');
        }
        if (this.mode === 'config-router' || this.mode === 'config-router-bgp') {
            return [
                'Router config commands:',
                this.currentRouter === 'ospf' ? '  network <ip> <wildcard> area <id>' : '  neighbor <ip> remote-as <asn>',
                this.currentRouter === 'bgp' ? '  network <ip> mask <mask>' : '',
                '  exit',
                '  end',
                '  do',
                '  ?'
            ].filter(Boolean).join('\n');
        }
        if (this.mode === 'config-vlan') {
            return [
                'VLAN config commands:',
                '  name <VLAN_NAME>',
                '  exit',
                '  end',
                '  do',
                '  ?'
            ].join('\n');
        }
        return 'help';
    }

    private generateContextHelp(state: DeviceState, tokens: string[]): string {
        const qIndex = tokens.indexOf('?');
        const head = tokens.slice(0, qIndex).map(t => t.toLowerCase());

        if (head.length === 0) return this.generateHelp(state);

        if (head[0] === 'show') {
            if (head.length === 1) {
                return [
                    '  running-config',
                    '  interfaces',
                    '  ip',
                    '  vlan',
                    '  logging',
                    '  clock'
                ].join('\n');
            }
            if (head[1] === 'ip') {
                return [
                    '  interface brief',
                    '  route'
                ].join('\n');
            }
            return this.generateHelp(state);
        }

        if (head[0] === 'switchport' && this.mode === 'config-if') {
            return [
                '  access vlan <id>',
                '  mode {access | trunk}',
                '  trunk allowed vlan <list>',
                '  trunk native vlan <id>'
            ].join('\n');
        }

        if (head[0] === 'interface' && this.mode === 'config') {
            const names = Object.keys(state.interfaces);
            return names.length ? names.map(n => `  ${n}`).join('\n') : '  <interface>';
        }

        if (head[0] === 'vlan' && this.mode === 'config') {
            return '  <1-4094>';
        }

        return this.generateHelp(state);
    }

    private generateRunConfig(state: DeviceState): string {
        let out = `!\nhostname ${state.hostname}\n!\n`;
        if (state.type === 'switch' && state.vlans) {
            Object.values(state.vlans).forEach(v => {
                out += `vlan ${v.id}\n name ${v.name}\n!\n`;
            });
        }
        Object.values(state.interfaces).forEach(i => {
            out += `interface ${i.name}\n`;
            if (i.description) out += ` description ${i.description}\n`;
            if (i.mode === 'access' || i.mode === 'trunk') {
                out += ` switchport\n switchport mode ${i.mode}\n`;
                if (i.mode === 'access' && i.accessVlan) out += ` switchport access vlan ${i.accessVlan}\n`;
                if (i.mode === 'trunk' && i.trunkAllowedVlans?.length) {
                    out += ` switchport trunk allowed vlan ${i.trunkAllowedVlans.join(',')}\n`;
                }
                if (i.mode === 'trunk' && i.trunkNativeVlan) {
                    out += ` switchport trunk native vlan ${i.trunkNativeVlan}\n`;
                }
            }
            if (i.ip && i.mask) out += ` ip address ${i.ip} ${i.mask}\n`;
            if (i.status === 'admin_down') out += ' shutdown\n';
            out += '!\n';
        });
        if (state.ospf) {
            out += `router ospf ${state.ospf.processId}\n`;
            state.ospf.networks.forEach(n => {
                out += ` network ${n.network} ${n.wildcard} area ${n.area}\n`;
            });
            out += '!\n';
        }
        if (state.bgp) {
            out += `router bgp ${state.bgp.asn}\n`;
            state.bgp.neighbors.forEach(n => {
                out += ` neighbor ${n.ip} remote-as ${n.remoteAs}\n`;
            });
            state.bgp.networks.forEach(n => {
                out += ` network ${n.network} mask ${n.mask}\n`;
            });
            out += '!\n';
        }
        state.staticRoutes.forEach(r => {
            out += `ip route ${r.network} ${r.mask} ${r.nextHop}\n`;
        });
        return out + 'end';
    }

    private generateIpIntBrief(state: DeviceState, deviceId: string): string {
        const topo = useGameStore.getState().topology;
        const live = topo.devices[deviceId];
        let out = 'Interface              IP-Address      OK? Method Status                Protocol\n';
        Object.values(state.interfaces).forEach(i => {
            const liveInt = live?.interfaces[i.name];
            const statusRaw = liveInt?.status ?? i.status;
            const status = statusRaw === 'admin_down' ? 'administratively down' : statusRaw;
            const ip = liveInt?.ip ?? i.ip ?? 'unassigned';
            const protocol = statusRaw === 'up' ? 'up' : 'down';
            const method = ip === 'unassigned' ? 'unset' : 'manual';
            out += `${i.name.padEnd(22)} ${ip.padEnd(15)} YES ${method.padEnd(6)} ${status.padEnd(20)} ${protocol}\n`;
        });
        return out;
    }

    private generateInterfaces(state: DeviceState, deviceId: string, target?: string): string {
        const topo = useGameStore.getState().topology;
        const live = topo.devices[deviceId];
        const ints = Object.values(state.interfaces);
        const list = target ? ints.filter(i => i.name.toLowerCase().startsWith(target.toLowerCase())) : ints;
        let out = '';
        list.forEach(i => {
            const liveInt = live?.interfaces[i.name];
            const statusRaw = liveInt?.status ?? i.status;
            const status = statusRaw === 'admin_down' ? 'administratively down' : statusRaw;
            const protocol = statusRaw === 'up' ? 'up' : 'down';
            const ip = liveInt?.ip ?? i.ip ?? 'unassigned';
            out += `${i.name} is ${status}, line protocol is ${protocol}\n`;
            if (i.description) out += `  Description: ${i.description}\n`;
            out += `  Internet address is ${ip}${i.mask ? ` ${i.mask}` : ''}\n`;
            out += `  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec\n`;
            out += `  Encapsulation ARPA, loopback not set\n\n`;
        });
        return out.trimEnd();
    }

    private generateVlanBrief(state: DeviceState): string {
        if (state.type !== 'switch') return '% VLAN table not supported on this device';
        const vlans = state.vlans ?? {};
        let out = 'VLAN Name                             Status    Ports\n';
        Object.values(vlans).forEach(v => {
            const ports = Object.values(state.interfaces)
                .filter(i => i.mode === 'access' && i.accessVlan === v.id)
                .map(i => i.name)
                .join(', ') || '-';
            out += `${String(v.id).padEnd(4)} ${v.name.padEnd(32)} ${v.status.padEnd(9)} ${ports}\n`;
        });
        return out;
    }

    private generateLog(): string {
        const events = useGameStore.getState().events.slice(0, 20);
        if (events.length === 0) return '%SYS-5-CONFIG_I: No logs available';
        return events.map(e => {
            const t = new Date(e.timestamp).toLocaleTimeString([], { hour12: false });
            return `${t} ${e.type.toUpperCase()}: ${e.description}`;
        }).join('\n');
    }

    private generateIpRoute(state: DeviceState, deviceId: string): string {
        const routes = this.buildRoutes(state, deviceId);
        if (routes.length === 0) return 'Gateway of last resort is not set';
        return routes.join('\n');
    }

    private buildRoutes(state: DeviceState, deviceId: string): string[] {
        const routes: string[] = [];
        const topo = useGameStore.getState().topology;
        const live = topo.devices[deviceId];
        Object.values(state.interfaces).forEach(i => {
            const ip = live?.interfaces[i.name]?.ip ?? i.ip;
            const mask = i.mask;
            const status = live?.interfaces[i.name]?.status ?? i.status;
            if (ip && mask && status === 'up') {
                const network = calcNetwork(ip, mask);
                routes.push(`C    ${network}/${maskToPrefix(mask)} is directly connected, ${i.name}`);
            }
        });

        state.staticRoutes.forEach(r => {
            routes.push(`S    ${r.network}/${maskToPrefix(r.mask)} [1/0] via ${r.nextHop}`);
        });

        if (state.ospf) {
            const ospfRoutes = this.buildOspfRoutes(state, deviceId);
            routes.push(...ospfRoutes.map(r => `O    ${r.network}/${maskToPrefix(r.mask)} [110/2] via ${r.nextHop}, 00:05:${pad2(Math.floor(Math.random() * 60))}, ${r.outInt}`));
        }

        if (state.bgp) {
            const bgpRoutes = this.buildBgpRoutes(state);
            routes.push(...bgpRoutes.map(r => `B    ${r.network}/${maskToPrefix(r.mask)} [20/0] via ${r.nextHop}, 00:02:${pad2(Math.floor(Math.random() * 60))}`));
        }

        return routes;
    }

    private buildOspfRoutes(state: DeviceState, deviceId: string): { network: string; mask: string; nextHop: string; outInt: string }[] {
        const topo = useGameStore.getState().topology;
        if (!state.ospf) return [];
        const graph = buildGraph(topo);
        const ospfDevices = Object.entries(this.network.devices).filter(([, d]) => d.ospf);
        const reachable = bfsReachable(deviceId, graph);

        const localNetworks = getOspfNetworksForDevice(state);
        const routes: { network: string; mask: string; nextHop: string; outInt: string }[] = [];

        ospfDevices.forEach(([id, dev]) => {
            if (id === deviceId || !reachable.has(id)) return;
            const remoteNetworks = getOspfNetworksForDevice(dev);
            const firstHop = graph.get(deviceId)?.find(n => reachable.has(n.node))?.node;
            const link = findLinkBetween(topo, deviceId, firstHop);
            const nextHopIp = firstHop ? this.findNeighborIp(deviceId, firstHop) : undefined;
            remoteNetworks.forEach(r => {
                if (localNetworks.some(l => l.network === r.network && l.mask === r.mask)) return;
                if (nextHopIp && link) routes.push({ ...r, nextHop: nextHopIp, outInt: link.source === deviceId ? link.sourceInt : link.targetInt });
            });
        });

        return routes;
    }

    private buildBgpRoutes(state: DeviceState): { network: string; mask: string; nextHop: string }[] {
        if (!state.bgp) return [];
        const routes: { network: string; mask: string; nextHop: string }[] = [];
        const neighbors = state.bgp.neighbors;

        neighbors.forEach(n => {
            const neighborDevice = this.findDeviceByIp(n.ip);
            if (!neighborDevice) return;
            const remote = this.network.devices[neighborDevice];
            if (!remote?.bgp) return;
            const expects = remote.bgp.asn === n.remoteAs;
            if (!expects) return;
            remote.bgp.networks.forEach(net => {
                routes.push({ network: net.network, mask: net.mask, nextHop: n.ip });
            });
        });

        return routes;
    }

    private findDeviceByIp(ip: string): string | null {
        for (const [id, dev] of Object.entries(this.network.devices)) {
            for (const int of Object.values(dev.interfaces)) {
                if (int.ip === ip) return id;
            }
        }
        for (const [id, dev] of Object.entries(this.network.devices)) {
            for (const int of Object.values(dev.interfaces)) {
                if (int.ip && int.mask && ipInSubnet(ip, calcNetwork(int.ip, int.mask), int.mask)) {
                    return id;
                }
            }
        }
        return null;
    }

    private findNeighborIp(src: string, neighbor: string): string | undefined {
        const topo = useGameStore.getState().topology;
        const link = findLinkBetween(topo, src, neighbor);
        if (!link) return undefined;
        const neighborIntName = link.source === neighbor ? link.sourceInt : link.targetInt;
        const neighborState = this.network.devices[neighbor];
        return neighborState?.interfaces[neighborIntName]?.ip;
    }

    private simulatePing(deviceId: string, target?: string, triggerPacket?: (s: string, t: string, d?: number) => void, addEvent?: (e: Omit<Event, 'id' | 'timestamp'>) => void): string {
        if (!target) return '% Incomplete command';
        const route = this.resolveRoute(deviceId, target);
        if (!route) {
            return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\n.....\nSuccess rate is 0 percent (0/5)`;
        }

        const path = this.findPathToTarget(deviceId, target);
        const stats = path ? this.getPathStats(path.linkIds) : { lossPct: 0, latencyMs: 20 };
        const lossPct = Math.min(90, stats.lossPct);

        let success = 0;
        const results: string[] = [];
        for (let i = 0; i < 5; i++) {
            const ok = Math.random() * 100 > lossPct;
            results.push(ok ? '!' : '.');
            if (ok) success++;
        }

        if (path && triggerPacket) {
            const targetDevice = path.targetDevice;
            const duration = Math.max(300, stats.latencyMs * 10);
            triggerPacket(deviceId, targetDevice, duration);
        }
        if (addEvent) {
            addEvent({
                type: 'packet',
                description: `ICMP Echo Request to ${target}`,
                source: deviceId,
                destination: target
            });
        }
        const rate = Math.round((success / 5) * 100);
        const avg = Math.max(1, Math.round(stats.latencyMs));
        const min = Math.max(1, Math.round(avg * 0.7));
        const max = Math.max(min + 1, Math.round(avg * 1.4));
        return `Type escape sequence to abort.\nSending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:\n${results.join('')}\nSuccess rate is ${rate} percent (${success}/5), round-trip min/avg/max = ${min}/${avg}/${max} ms`;
    }

    private simulateTraceroute(deviceId: string, target?: string): string {
        if (!target) return '% Incomplete command';
        const path = this.findPathToTarget(deviceId, target);
        if (!path) return 'Type escape sequence to abort.\nTracing the route to ' + target + '\n  1  *  *  *';
        let out = `Type escape sequence to abort.\nTracing the route to ${target}\n`;
        path.hops.forEach((hop, idx) => {
            out += `  ${idx + 1}  ${hop.ip ?? '*'}  ${Math.round(hop.latencyMs)} ms  ${Math.round(hop.latencyMs + 2)} ms  ${Math.round(hop.latencyMs + 5)} ms\n`;
        });
        return out.trimEnd();
    }

    private resolveRoute(deviceId: string, targetIp: string): { network: string; mask: string; nextHop?: string } | null {
        const state = this.network.devices[deviceId];
        const routes: { network: string; mask: string; nextHop?: string }[] = [];
        const topo = useGameStore.getState().topology;
        const live = topo.devices[deviceId];
        Object.values(state.interfaces).forEach(i => {
            const ip = live?.interfaces[i.name]?.ip ?? i.ip;
            const mask = i.mask;
            const status = live?.interfaces[i.name]?.status ?? i.status;
            if (ip && mask && status === 'up') {
                routes.push({ network: calcNetwork(ip, mask), mask });
            }
        });
        state.staticRoutes.forEach(r => routes.push({ network: r.network, mask: r.mask, nextHop: r.nextHop }));
        if (state.ospf) this.buildOspfRoutes(state, deviceId).forEach(r => routes.push({ network: r.network, mask: r.mask, nextHop: r.nextHop }));
        if (state.bgp) this.buildBgpRoutes(state).forEach(r => routes.push({ network: r.network, mask: r.mask, nextHop: r.nextHop }));

        const match = routes
            .filter(r => ipInSubnet(targetIp, r.network, r.mask))
            .sort((a, b) => maskToPrefix(b.mask) - maskToPrefix(a.mask))[0];
        return match ?? null;
    }

    private findPathToTarget(deviceId: string, targetIp: string): { targetDevice: string; linkIds: string[]; hops: { ip?: string; latencyMs: number }[] } | null {
        const topo = useGameStore.getState().topology;
        const graph = buildGraph(topo);
        const targetDevice = this.findDeviceByIp(targetIp);
        if (!targetDevice) return null;
        const result = bfsPath(deviceId, targetDevice, graph);
        if (!result) return null;
        const linkIds = result.links;
        const stats = this.getPathStats(linkIds);
        const hops = result.nodes.slice(1).map((node, idx) => ({
            ip: this.findNeighborIp(result.nodes[idx], node),
            latencyMs: stats.latencyMs / Math.max(1, result.nodes.length - 1)
        }));
        return { targetDevice, linkIds, hops };
    }

    private getPathStats(linkIds: string[]): { latencyMs: number; lossPct: number } {
        const stats = useGameStore.getState().linkStats;
        let latency = 0;
        let lossFactor = 1;
        linkIds.forEach(id => {
            const s = stats[id];
            if (!s) return;
            latency += s.latencyMs + s.jitterMs;
            lossFactor *= (1 - s.lossPct / 100);
        });
        const lossPct = (1 - lossFactor) * 100;
        return { latencyMs: Math.max(10, latency), lossPct };
    }
}

function normalizeInterfaceName(input: string, interfaces: Record<string, InterfaceState>): string | null {
    const lower = input.toLowerCase();
    const direct = Object.keys(interfaces).find(k => k.toLowerCase() === lower);
    if (direct) return direct;

    const expanded = expandInterfaceAlias(lower);
    const match = Object.keys(interfaces).find(k => k.toLowerCase().startsWith(expanded));
    return match ?? null;
}

function expandInterfaceAlias(name: string): string {
    const map: Record<string, string> = {
        'gi': 'gigabitethernet',
        'g': 'gigabitethernet',
        'fa': 'fastethernet',
        'lo': 'loopback',
        'vl': 'vlan'
    };
    const parts = name.split('/');
    const head = parts[0];
    const expanded = map[head] ?? head;
    return [expanded, ...parts.slice(1)].join('/');
}

function parseVlanList(raw: string): number[] {
    const out: number[] = [];
    raw.split(',').forEach(seg => {
        if (seg.includes('-')) {
            const [s, e] = seg.split('-').map(n => parseInt(n, 10));
            if (!Number.isNaN(s) && !Number.isNaN(e)) {
                for (let v = s; v <= e; v++) out.push(v);
            }
        } else {
            const v = parseInt(seg, 10);
            if (!Number.isNaN(v)) out.push(v);
        }
    });
    return out;
}

function buildGraph(topo: { links: { id: string; source: string; target: string; status: 'up' | 'down' }[] }): Map<string, { node: string; linkId: string }[]> {
    const graph = new Map<string, { node: string; linkId: string }[]>();
    topo.links.forEach(l => {
        if (l.status !== 'up') return;
        if (!graph.has(l.source)) graph.set(l.source, []);
        if (!graph.has(l.target)) graph.set(l.target, []);
        graph.get(l.source)!.push({ node: l.target, linkId: l.id });
        graph.get(l.target)!.push({ node: l.source, linkId: l.id });
    });
    return graph;
}

function bfsReachable(start: string, graph: Map<string, { node: string; linkId: string }[]>): Set<string> {
    const visited = new Set<string>();
    const queue = [start];
    visited.add(start);
    while (queue.length) {
        const node = queue.shift()!;
        const neighbors = graph.get(node) ?? [];
        neighbors.forEach(n => {
            if (!visited.has(n.node)) {
                visited.add(n.node);
                queue.push(n.node);
            }
        });
    }
    return visited;
}

function bfsPath(start: string, end: string, graph: Map<string, { node: string; linkId: string }[]>): { nodes: string[]; links: string[] } | null {
    const queue: string[] = [start];
    const prev = new Map<string, { node: string; linkId: string }>();
    const visited = new Set<string>([start]);

    while (queue.length) {
        const node = queue.shift()!;
        if (node === end) break;
        const neighbors = graph.get(node) ?? [];
        for (const n of neighbors) {
            if (!visited.has(n.node)) {
                visited.add(n.node);
                prev.set(n.node, { node, linkId: n.linkId });
                queue.push(n.node);
            }
        }
    }

    if (!visited.has(end)) return null;
    const nodes: string[] = [];
    const links: string[] = [];
    let cur = end;
    while (cur !== start) {
        const p = prev.get(cur);
        if (!p) break;
        nodes.push(cur);
        links.push(p.linkId);
        cur = p.node;
    }
    nodes.push(start);
    nodes.reverse();
    links.reverse();
    return { nodes, links };
}

function findLinkBetween(topo: { links: { id: string; source: string; target: string; sourceInt: string; targetInt: string; status: 'up' | 'down' }[] }, a?: string, b?: string) {
    if (!a || !b) return null;
    return topo.links.find(l => (l.source === a && l.target === b) || (l.source === b && l.target === a)) ?? null;
}

function getOspfNetworksForDevice(device: DeviceState): { network: string; mask: string }[] {
    if (!device.ospf) return [];
    const result: { network: string; mask: string }[] = [];
    Object.values(device.interfaces).forEach(i => {
        if (!i.ip || !i.mask) return;
        const matches = device.ospf!.networks.some(n => ipInSubnet(i.ip!, n.network, wildcardToMask(n.wildcard)));
        if (matches) result.push({ network: calcNetwork(i.ip, i.mask), mask: i.mask });
    });
    return result;
}

function ipToInt(ip: string): number {
    return ip.split('.').reduce((acc, oct) => (acc << 8) + Number(oct), 0) >>> 0;
}

function intToIp(int: number): string {
    return [24, 16, 8, 0].map(shift => (int >> shift) & 255).join('.');
}

function maskToPrefix(mask: string): number {
    const int = ipToInt(mask);
    let count = 0;
    for (let i = 31; i >= 0; i--) {
        if ((int & (1 << i)) !== 0) count++;
    }
    return count;
}

function wildcardToMask(wildcard: string): string {
    const int = ipToInt(wildcard);
    const mask = (~int) >>> 0;
    return intToIp(mask);
}

function calcNetwork(ip: string, mask: string): string {
    const net = ipToInt(ip) & ipToInt(mask);
    return intToIp(net);
}

function ipInSubnet(ip: string, network: string, mask: string): boolean {
    return (ipToInt(ip) & ipToInt(mask)) === (ipToInt(network) & ipToInt(mask));
}

function pad2(v: number): string {
    return v < 10 ? `0${v}` : `${v}`;
}
