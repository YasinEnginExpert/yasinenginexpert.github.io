import { useGameStore } from '../session';

export interface CommandResult {
    output: string;
    success: boolean;
}

interface InterfaceState {
    name: string;
    ip: string;
    mask: string;
    status: 'up' | 'down';
    protocol: 'up' | 'down';
    description?: string;
}

interface DeviceState {
    hostname: string;
    type: 'router' | 'switch';
    interfaces: Record<string, InterfaceState>;
    routes: string[];
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
                    'GigabitEthernet0/0': { name: 'GigabitEthernet0/0', ip: '192.168.1.1', mask: '255.255.255.0', status: 'up', protocol: 'up' },
                    'GigabitEthernet0/1': { name: 'GigabitEthernet0/1', ip: '10.0.0.1', mask: '255.255.255.252', status: 'up', protocol: 'up' },
                    'Loopback0': { name: 'Loopback0', ip: '1.1.1.1', mask: '255.255.255.255', status: 'up', protocol: 'up' }
                },
                routes: [
                    'C    192.168.1.0/24 is directly connected, GigabitEthernet0/0',
                    'C    10.0.0.0/30 is directly connected, GigabitEthernet0/1',
                    'O    172.16.0.0/24 [110/2] via 10.0.0.2, 00:05:32, GigabitEthernet0/1'
                ],
                arp: { '192.168.1.2': 'aabb.cc00.0200', '192.168.1.1': 'aabb.cc00.0100' }
            },
            'SW1': {
                hostname: 'SW1',
                type: 'switch',
                interfaces: {
                    'GigabitEthernet0/1': { name: 'GigabitEthernet0/1', ip: 'unassigned', mask: '', status: 'up', protocol: 'up' },
                    'Vlan1': { name: 'Vlan1', ip: '192.168.1.2', mask: '255.255.255.0', status: 'up', protocol: 'up' }
                },
                routes: [],
                arp: { '192.168.1.1': 'aabb.cc00.0100' }
            },
            'R2': {
                hostname: 'R2',
                type: 'router',
                interfaces: {
                    'GigabitEthernet0/0': { name: 'GigabitEthernet0/0', ip: '10.0.0.2', mask: '255.255.255.252', status: 'up', protocol: 'up' },
                    'GigabitEthernet0/1': { name: 'GigabitEthernet0/1', ip: '172.16.0.1', mask: '255.255.255.0', status: 'up', protocol: 'up' }
                },
                routes: [
                    'C    10.0.0.0/30 is directly connected, GigabitEthernet0/0',
                    'O    192.168.1.0/24 [110/2] via 10.0.0.1, 00:05:32'
                ],
                arp: { '10.0.0.1': 'aabb.cc00.0100' }
            }
        };
    }
}

export class CLIParser {
    private mode: 'user' | 'privileged' | 'config' | 'config-if' = 'privileged';
    private currentInterface: string = '';
    private network = NetworkState.getInstance();

    getPrompt(deviceId: string): string {
        const hostname = this.network.devices[deviceId]?.hostname || deviceId;
        switch (this.mode) {
            case 'user': return `${hostname}>`;
            case 'privileged': return `${hostname}#`;
            case 'config': return `${hostname}(config)#`;
            case 'config-if': return `${hostname}(config-if)#`;
            default: return `${hostname}>`;
        }
    }

    execute(deviceId: string, input: string): CommandResult {
        const rawCmd = input.trim();
        const tokens = rawCmd.toLowerCase().split(/\s+/);
        const cmd = tokens[0];
        const state = this.network.devices[deviceId];

        if (!state) return { output: '% Device not found', success: false };
        if (!cmd) return { output: '', success: true };

        // Handle "do" commands in config modes
        if ((this.mode === 'config' || this.mode === 'config-if') && cmd === 'do') {
            const execInput = rawCmd.substring(3).trim();
            const originalMode = this.mode;
            this.mode = 'privileged';
            const result = this.execute(deviceId, execInput);
            this.mode = originalMode;
            return result;
        }

        // Mode Transitions & Global Exit
        if (cmd === 'exit') {
            if (this.mode === 'config-if') { this.mode = 'config'; return { output: '', success: true }; }
            if (this.mode === 'config') { this.mode = 'privileged'; return { output: '', success: true }; }
            if (this.mode === 'privileged') { this.mode = 'user'; return { output: '', success: true }; }
            return { output: '', success: true };
        }
        if (cmd === 'end') { this.mode = 'privileged'; return { output: '', success: true }; }
        if (cmd === 'enable' && this.mode === 'user') { this.mode = 'privileged'; return { output: '', success: true }; }
        if (cmd === 'configure' && tokens[1] === 'terminal' && this.mode === 'privileged') {
            this.mode = 'config';
            return { output: 'Enter configuration commands, one per line.  End with CNTL/Z.', success: true };
        }

        // Exec Commands
        if (this.mode === 'privileged') {
            if (cmd === 'show') {
                const sub = tokens[1];
                if (sub === 'run') return { output: this.generateRunConfig(state), success: true };
                if (sub === 'ip' && (tokens[2] === 'int' || tokens[2] === 'interface')) return { output: this.generateIpIntBrief(state), success: true };
                if (sub === 'ip' && tokens[2] === 'route') return { output: state.routes.join('\n'), success: true };
            }
            if (cmd === 'ping') {
                const target = tokens[1];
                const output = this.simulatePing(target);

                // Trigger visual packet sequence
                if (output.includes('Success rate is 100 percent')) {
                    useGameStore.getState().triggerPacket(deviceId, 'R2'); // Simulating flow to R2
                    setTimeout(() => useGameStore.getState().triggerPacket('R2', deviceId), 400); // Echo reply
                }

                useGameStore.getState().addEvent({
                    type: 'packet',
                    description: `ICMP Echo Request to ${target}`,
                    source: deviceId,
                    destination: target
                });
                return { output, success: true };
            }
            if (cmd === 'ssh' || cmd === 'telnet') {
                const target = tokens[1];
                if (!target) return { output: '% Incomplete command', success: false };
                // In this sim, we allow switching active UI device via terminal
                // This is a powerful "meta-command" for the user
                return { output: `Connecting to ${target}... [OK]\nType "exit" to return.`, success: true };
            }
        }

        // Config Mode Commands
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
            if (cmd === 'interface' || cmd === 'int') {
                const found = Object.keys(state.interfaces).find(k => k.toLowerCase().startsWith(tokens[1]));
                if (found) { this.mode = 'config-if'; this.currentInterface = found; return { output: '', success: true }; }
                return { output: '% Invalid interface', success: false };
            }
        }

        // Interface Mode Commands
        if (this.mode === 'config-if') {
            const int = state.interfaces[this.currentInterface];
            if (cmd === 'ip' && tokens[1] === 'address') {
                const ip = tokens[2];
                if (ip) {
                    int.ip = ip;
                    useGameStore.getState().updateInterface(deviceId, this.currentInterface, { ip });
                    return { output: '', success: true };
                }
            }
            if (cmd === 'shutdown') {
                int.status = 'down';
                useGameStore.getState().updateInterface(deviceId, this.currentInterface, { status: 'down' });
                useGameStore.getState().addEvent({
                    type: 'system',
                    description: `Interface ${this.currentInterface} administratively down`,
                    source: deviceId
                });
                return { output: 'Interface changed state to down', success: true };
            }
            if (cmd === 'no' && tokens[1] === 'shutdown') {
                int.status = 'up';
                useGameStore.getState().updateInterface(deviceId, this.currentInterface, { status: 'up' });
                useGameStore.getState().addEvent({
                    type: 'system',
                    description: `Interface ${this.currentInterface} state to UP`,
                    source: deviceId
                });
                return { output: 'Interface changed state to up', success: true };
            }
        }

        return { output: `% Invalid input detected at '^' marker.\n\n${rawCmd}\n^`, success: false };
    }

    private generateRunConfig(state: DeviceState): string {
        let out = `!\nhostname ${state.hostname}\n!\n`;
        Object.values(state.interfaces).forEach(i => {
            out += `interface ${i.name}\n${i.ip !== 'unassigned' ? ` ip address ${i.ip} ${i.mask}\n` : ''}${i.status === 'down' ? ' shutdown\n' : ''}!\n`;
        });
        return out + 'end';
    }

    private generateIpIntBrief(state: DeviceState): string {
        let out = 'Interface              IP-Address      OK? Method Status                Protocol\n';
        Object.values(state.interfaces).forEach(i => {
            out += `${i.name.padEnd(22)} ${i.ip.padEnd(15)} YES manual ${i.status.padEnd(20)} up\n`;
        });
        return out;
    }

    private simulatePing(target: string): string {
        if (!target) return '% Incomplete command';
        let found = false;
        Object.values(this.network.devices).forEach(d => {
            if (Object.values(d.interfaces).some(i => i.ip === target && i.status === 'up')) found = true;
        });
        return found ? '!!!!!\nSuccess rate is 100 percent' : '.....\nSuccess rate is 0 percent';
    }
}
