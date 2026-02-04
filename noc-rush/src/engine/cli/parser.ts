import { useGameStore } from '../session';
import { Device, Interface } from '../types';

export interface CommandResult {
    output: string;
    success: boolean;
}

// Mock device configurations
const DEVICE_CONFIGS: Record<string, string> = {
    'R1': `!
hostname R1
!
interface GigabitEthernet0/0
 ip address 192.168.1.1 255.255.255.0
 no shutdown
!
interface GigabitEthernet0/1
 ip address 10.0.0.1 255.255.255.252
 no shutdown
!
router ospf 1
 network 192.168.1.0 0.0.0.255 area 0
 network 10.0.0.0 0.0.0.3 area 0
!
line con 0
line vty 0 4
 login
!
end`,
    'SW1': `!
hostname SW1
!
vlan 10
 name USERS
!
vlan 20
 name SERVERS
!
interface GigabitEthernet0/1
 switchport mode trunk
!
interface GigabitEthernet0/2
 switchport access vlan 10
!
interface Vlan1
 ip address 192.168.1.2 255.255.255.0
!
end`,
    'R2': `!
hostname R2
!
interface GigabitEthernet0/0
 ip address 10.0.0.2 255.255.255.252
 no shutdown
!
interface GigabitEthernet0/1
 ip address 172.16.0.1 255.255.255.0
 no shutdown
!
router ospf 1
 network 10.0.0.0 0.0.0.3 area 0
 network 172.16.0.0 0.0.0.255 area 0
!
end`
};

// Mock interface data
const DEVICE_INTERFACES: Record<string, Array<{ name: string; ip: string; status: string; protocol: string }>> = {
    'R1': [
        { name: 'GigabitEthernet0/0', ip: '192.168.1.1', status: 'up', protocol: 'up' },
        { name: 'GigabitEthernet0/1', ip: '10.0.0.1', status: 'up', protocol: 'up' },
        { name: 'Loopback0', ip: '1.1.1.1', status: 'up', protocol: 'up' },
    ],
    'SW1': [
        { name: 'GigabitEthernet0/1', ip: 'unassigned', status: 'up', protocol: 'up' },
        { name: 'GigabitEthernet0/2', ip: 'unassigned', status: 'up', protocol: 'up' },
        { name: 'Vlan1', ip: '192.168.1.2', status: 'up', protocol: 'up' },
    ],
    'R2': [
        { name: 'GigabitEthernet0/0', ip: '10.0.0.2', status: 'up', protocol: 'up' },
        { name: 'GigabitEthernet0/1', ip: '172.16.0.1', status: 'up', protocol: 'up' },
        { name: 'Loopback0', ip: '2.2.2.2', status: 'up', protocol: 'up' },
    ]
};

// Mock routing tables
const ROUTING_TABLES: Record<string, string> = {
    'R1': `Codes: C - connected, S - static, R - RIP, O - OSPF, B - BGP

Gateway of last resort is not set

C    192.168.1.0/24 is directly connected, GigabitEthernet0/0
C    10.0.0.0/30 is directly connected, GigabitEthernet0/1
O    172.16.0.0/24 [110/2] via 10.0.0.2, 00:05:32, GigabitEthernet0/1`,
    'R2': `Codes: C - connected, S - static, R - RIP, O - OSPF, B - BGP

Gateway of last resort is not set

C    10.0.0.0/30 is directly connected, GigabitEthernet0/0
C    172.16.0.0/24 is directly connected, GigabitEthernet0/1
O    192.168.1.0/24 [110/2] via 10.0.0.1, 00:05:32, GigabitEthernet0/0`,
    'SW1': `Default gateway is 192.168.1.1

Host               Gateway           Last Use    Total Uses  Interface
ICMP redirect cache is empty`
};

// ARP tables
const ARP_TABLES: Record<string, string> = {
    'R1': `Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.1.2           5   aabb.cc00.0200  ARPA   GigabitEthernet0/0
Internet  192.168.1.1           -   aabb.cc00.0100  ARPA   GigabitEthernet0/0
Internet  10.0.0.2              3   aabb.cc00.0300  ARPA   GigabitEthernet0/1`,
    'SW1': `Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  192.168.1.1           2   aabb.cc00.0100  ARPA   Vlan1
Internet  192.168.1.2           -   aabb.cc00.0200  ARPA   Vlan1`,
    'R2': `Protocol  Address          Age (min)  Hardware Addr   Type   Interface
Internet  10.0.0.1              4   aabb.cc00.0100  ARPA   GigabitEthernet0/0
Internet  172.16.0.10           1   aabb.cc00.0500  ARPA   GigabitEthernet0/1`
};

export class CLIParser {
    private mode: 'user' | 'privileged' | 'config' | 'config-if' = 'privileged';
    private currentInterface: string = '';

    getPrompt(hostname: string): string {
        switch (this.mode) {
            case 'user': return `${hostname}>`;
            case 'privileged': return `${hostname}#`;
            case 'config': return `${hostname}(config)#`;
            case 'config-if': return `${hostname}(config-if)#`;
            default: return `${hostname}#`;
        }
    }

    execute(hostname: string, input: string): CommandResult {
        const cmd = input.trim().toLowerCase();
        if (!cmd) return { output: '', success: true };

        // Help command
        if (cmd === '?' || cmd === 'help') {
            return {
                output: `Available Commands:
  show running-config    Display running configuration
  show ip interface brief Display interface status
  show ip route          Display routing table
  show arp               Display ARP table
  show version           Display system version
  show clock             Display current time
  show interfaces        Display detailed interface info
  ping <ip>              Send ICMP echo requests
  traceroute <ip>        Trace route to destination
  configure terminal     Enter configuration mode
  exit                   Exit current mode
  enable                 Enter privileged mode
  disable                Exit privileged mode
  clear                  Clear screen`,
                success: true
            };
        }

        // Enable/Disable
        if (cmd === 'enable' || cmd === 'en') {
            this.mode = 'privileged';
            return { output: '', success: true };
        }

        if (cmd === 'disable') {
            this.mode = 'user';
            return { output: '', success: true };
        }

        // Exit commands
        if (cmd === 'exit' || cmd === 'end') {
            if (this.mode === 'config-if') {
                this.mode = 'config';
            } else if (this.mode === 'config') {
                this.mode = 'privileged';
            }
            return { output: '', success: true };
        }

        // Configure terminal
        if (cmd === 'configure terminal' || cmd === 'conf t') {
            this.mode = 'config';
            return { output: 'Enter configuration commands, one per line. End with CNTL/Z.', success: true };
        }

        // Show commands
        if (cmd === 'show running-config' || cmd === 'sh run' || cmd === 'show run') {
            const config = DEVICE_CONFIGS[hostname] || '! No configuration available';
            return { output: config, success: true };
        }

        if (cmd === 'show ip interface brief' || cmd === 'sh ip int br' || cmd === 'sh ip int brief') {
            const interfaces = DEVICE_INTERFACES[hostname] || [];
            const header = 'Interface                  IP-Address      OK? Method Status                Protocol';
            const lines = interfaces.map(iface =>
                `${iface.name.padEnd(26)} ${iface.ip.padEnd(15)} YES manual ${iface.status.padEnd(21)} ${iface.protocol}`
            );
            return { output: [header, ...lines].join('\n'), success: true };
        }

        if (cmd === 'show ip route' || cmd === 'sh ip route') {
            const routes = ROUTING_TABLES[hostname] || '% Routing table not available';
            return { output: routes, success: true };
        }

        if (cmd === 'show arp' || cmd === 'sh arp') {
            const arp = ARP_TABLES[hostname] || '% ARP table not available';
            return { output: arp, success: true };
        }

        if (cmd === 'show version' || cmd === 'sh ver') {
            const isRouter = hostname.startsWith('R');
            return {
                output: `Cisco IOS Software, ${isRouter ? 'ISR' : 'Catalyst'} Software
Technical Support: http://www.cisco.com/techsupport
Copyright (c) 1986-2024 by Cisco Systems, Inc.

ROM: System Bootstrap, Version 15.1(4)M4

${hostname} uptime is 2 days, 14 hours, 32 minutes
System returned to ROM by power-on
System image file is "flash:c${isRouter ? '2900' : '3560'}-universalk9-mz.SPA.155-3.M"

${isRouter ? 'Cisco CISCO2911/K9 (revision 1.0)' : 'Cisco WS-C3560-24PS (revision 1.0)'}
Processor board ID FTX1234A567
${isRouter ? '3' : '24'} ${isRouter ? 'Gigabit' : 'FastEthernet'} interfaces
${isRouter ? '256K' : '64K'} bytes of NVRAM.
${isRouter ? '250880K' : '65536K'} bytes of flash memory.`,
                success: true
            };
        }

        if (cmd === 'show clock' || cmd === 'sh clock') {
            const now = new Date();
            return {
                output: `*${now.toTimeString().split(' ')[0]}.${now.getMilliseconds()} UTC ${now.toDateString()}`,
                success: true
            };
        }

        if (cmd === 'show interfaces' || cmd === 'sh int') {
            const interfaces = DEVICE_INTERFACES[hostname] || [];
            const output = interfaces.map(iface => `
${iface.name} is ${iface.status}, line protocol is ${iface.protocol}
  Hardware is Gigabit Ethernet, address is aabb.cc00.0${Math.floor(Math.random() * 900) + 100}
  Internet address is ${iface.ip}/24
  MTU 1500 bytes, BW 1000000 Kbit/sec, DLY 10 usec,
     reliability 255/255, txload 1/255, rxload 1/255
  Encapsulation ARPA, loopback not set
  Full-duplex, 1000Mb/s, media type is RJ45
  5 minute input rate ${Math.floor(Math.random() * 10000)} bits/sec, ${Math.floor(Math.random() * 100)} packets/sec
  5 minute output rate ${Math.floor(Math.random() * 10000)} bits/sec, ${Math.floor(Math.random() * 100)} packets/sec
     ${Math.floor(Math.random() * 100000)} packets input, ${Math.floor(Math.random() * 10000000)} bytes
     ${Math.floor(Math.random() * 100000)} packets output, ${Math.floor(Math.random() * 10000000)} bytes`).join('\n');
            return { output, success: true };
        }

        // Ping command
        if (cmd.startsWith('ping ')) {
            const target = cmd.split(' ')[1];
            if (!target) {
                return { output: '% Incomplete command.', success: false };
            }
            const successRate = Math.random() > 0.1 ? 100 : Math.floor(Math.random() * 100);
            const successes = Math.floor(successRate / 20);
            const dots = '!'.repeat(successes) + '.'.repeat(5 - successes);
            return {
                output: `Type escape sequence to abort.
Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:
${dots}
Success rate is ${successRate} percent (${successes}/5)${successRate === 100 ? ', round-trip min/avg/max = 1/2/4 ms' : ''}`,
                success: true
            };
        }

        // Traceroute command  
        if (cmd.startsWith('traceroute ') || cmd.startsWith('trace ')) {
            const target = cmd.split(' ')[1];
            if (!target) {
                return { output: '% Incomplete command.', success: false };
            }
            return {
                output: `Type escape sequence to abort.
Tracing the route to ${target}

  1 10.0.0.${hostname === 'R1' ? '2' : '1'} 4 msec 4 msec 4 msec
  2 ${target} 8 msec 8 msec 8 msec`,
                success: true
            };
        }

        // Clear screen
        if (cmd === 'clear' || cmd === 'cls') {
            return { output: '\x1b[2J\x1b[H', success: true };
        }

        // Unknown command
        return {
            output: `% Invalid input detected at '^' marker.\n\n${cmd}\n^`,
            success: false
        };
    }
}
