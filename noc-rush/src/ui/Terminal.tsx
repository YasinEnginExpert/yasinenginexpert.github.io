import { useEffect, useRef } from 'react';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { CLIParser } from '../engine/cli/parser';
import { useGameStore } from '../engine/session';

interface TerminalProps {
    deviceName: string;
}

const parser = new CLIParser();
const historyByDevice: Record<string, string[]> = {};
const bootedDevices = new Set<string>();

export const TerminalComponent = ({ deviceName }: TerminalProps) => {
    const terminalRef = useRef<HTMLDivElement>(null);
    const xtermRef = useRef<Terminal | null>(null);
    const bufferRef = useRef<string>('');
    const historyRef = useRef<string[]>([]);
    const historyIndexRef = useRef<number>(-1);
    const { triggerPacket, addEvent } = useGameStore();

    useEffect(() => {
        if (!terminalRef.current) return;
        historyRef.current = historyByDevice[deviceName] ?? [];

        const term = new Terminal({
            cursorBlink: true,
            theme: {
                background: '#09090b', // zinc-950
                foreground: '#22c55e', // green-500
                cursor: '#22c55e'
            },
            fontFamily: '"Fira Code", monospace',
            fontSize: 14,
            letterSpacing: 0,
            lineHeight: 1.2
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(terminalRef.current);
        fitAddon.fit();

        xtermRef.current = term;

        const writePrompt = () => {
            term.write(`\r${parser.getPrompt(deviceName)} `);
        };

        // Simulated IOS Boot sequence (once per device)
        if (!bootedDevices.has(deviceName)) {
            term.write('\x1b[32mBootstrap program is C3560 boot loader\r\n');
            term.write('Self-decompressing the image : ########################################################################### [OK]\r\n\x1b[0m');
            term.write('\r\nCisco IOS Software, C3560 Software (C3560-IPSERVICESK9-M), Version 15.0(2)SE\r\n');
            term.write('Copyright (c) 1986-2012 by Cisco Systems, Inc.\r\n\r\n');
            bootedDevices.add(deviceName);
            setTimeout(writePrompt, 100);
        } else {
            writePrompt();
        }

        term.onData((data: string) => {
            const charCode = data.charCodeAt(0);

            // Handle multi-character sequences (like arrows)
            if (data.startsWith('\x1b[')) {
                const seq = data.substring(2);
                if (seq === 'A') { // UP arrow
                    if (historyRef.current.length > 0 && historyIndexRef.current < historyRef.current.length - 1) {
                        historyIndexRef.current++;
                        const cmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current];
                        // Clear current line
                        term.write('\b \b'.repeat(bufferRef.current.length));
                        bufferRef.current = cmd;
                        term.write(cmd);
                    }
                    return;
                }
                if (seq === 'B') { // DOWN arrow
                    if (historyIndexRef.current > 0) {
                        historyIndexRef.current--;
                        const cmd = historyRef.current[historyRef.current.length - 1 - historyIndexRef.current];
                        term.write('\b \b'.repeat(bufferRef.current.length));
                        bufferRef.current = cmd;
                        term.write(cmd);
                    } else if (historyIndexRef.current === 0) {
                        historyIndexRef.current = -1;
                        term.write('\b \b'.repeat(bufferRef.current.length));
                        bufferRef.current = '';
                    }
                    return;
                }
                return;
            }

            // Enter key
            if (charCode === 13) {
                const cmd = bufferRef.current.trim();
                term.write('\r\n');

                if (cmd) {
                    historyRef.current.push(cmd);
                    if (historyRef.current.length > 50) historyRef.current.shift();
                    historyByDevice[deviceName] = historyRef.current;
                }
                historyIndexRef.current = -1;
                bufferRef.current = '';

                const res = parser.execute(deviceName, cmd, { triggerPacket, addEvent });
                if (res.output) {
                    const formatted = res.output.split('\n').join('\r\n');
                    term.write(formatted + '\r\n');
                }

                writePrompt();
            }
            // Backspace
            else if (charCode === 127 || charCode === 8) {
                if (bufferRef.current.length > 0) {
                    bufferRef.current = bufferRef.current.slice(0, -1);
                    term.write('\b \b');
                }
            }
            // Tab key
            else if (charCode === 9) {
                // Simple TAB completion shim
                const words = [
                    'show', 'configure', 'conf', 'terminal', 'interface', 'ip', 'address', 'running-config',
                    'ping', 'traceroute', 'hostname', 'no', 'shutdown', 'description', 'router',
                    'ospf', 'bgp', 'network', 'area', 'neighbor', 'remote-as', 'vlan', 'switchport',
                    'access', 'trunk', 'allowed', 'native', 'route', 'end', 'exit', 'write', 'copy',
                    'enable', 'disable', 'help', '?'
                ];
                const current = bufferRef.current.toLowerCase();
                const match = words.find(w => w.startsWith(current) && w !== current);
                if (match) {
                    const addition = match.substring(current.length);
                    bufferRef.current += addition;
                    term.write(addition);
                }
            }
            // Normal characters
            else if (charCode >= 32 && charCode < 127) {
                bufferRef.current += data;
                term.write(data);
            }
        });

        const handleResize = () => fitAddon.fit();
        window.addEventListener('resize', handleResize);
        const resizeObserver = typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => fitAddon.fit())
            : null;
        if (resizeObserver) {
            resizeObserver.observe(terminalRef.current);
        }

        return () => {
            term.dispose();
            window.removeEventListener('resize', handleResize);
            if (resizeObserver) resizeObserver.disconnect();
        };
    }, [deviceName, addEvent, triggerPacket]);

    return (
        <div className="h-full w-full bg-[#09090b] p-2">
            <div ref={terminalRef} className="h-full w-full" />
        </div>
    );
};
