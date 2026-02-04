document.addEventListener('DOMContentLoaded', () => {
const terminalOverlay = document.getElementById('terminal-overlay');
const terminalBody = document.getElementById('terminal-body');
const terminalInput = document.getElementById('terminal-input');
const terminalToggleBtn = document.getElementById('terminal-toggle-btn');
const closeTerminalBtn = document.getElementById('close-terminal-btn');
let commandHistory = [];
let historyIndex = -1;
let isMatrixMode = false;
let matrixInterval = null;
let isCiscoMode = false; // Toggle between Linux prompt and Switch> prompt
let hostname = "netreka";
const availableCommands = [
'help', 'whoami', 'contact', 'projects', 'clear',
'neofetch', 'matrix', 'ping', 'ip a', 'traceroute',
'scan', 'top', 'whois', 'exit', 'reboot',
'enable', 'conf t', 'show running-config', 'show version',
'show ip int br', 'dig', 'nslookup', 'netstat', 'arp', 'tcpdump', 'ssh'
];
function toggleTerminal() {
const isHidden = terminalOverlay.style.display === 'none' || terminalOverlay.style.display === '';
if (isHidden) {
terminalOverlay.style.display = 'flex';
terminalInput.focus();
if (terminalBody.children.length === 0) {
printOutput("YasinOS [Version 3.1.0 - Network Core]", "system");
printOutput("(c) 2026 Yasin Engin. All rights reserved.", "system");
printOutput("Type 'neofetch' or 'help' to start.", "text");
printOutput("---------------------------------------", "system");
}
} else {
terminalOverlay.style.display = 'none';
}
}
if (terminalToggleBtn) terminalToggleBtn.addEventListener('click', toggleTerminal);
if (closeTerminalBtn) closeTerminalBtn.addEventListener('click', () => terminalOverlay.style.display = 'none');
document.addEventListener('keydown', (e) => {
if (e.key === 'Escape' && terminalOverlay.style.display === 'flex') {
terminalOverlay.style.display = 'none';
}
if ((isMatrixMode) && (e.key === 'q' || e.key === 'c')) {
stopMatrix();
}
});
window.addEventListener('click', (e) => {
if (e.target === terminalOverlay) terminalOverlay.style.display = 'none';
});
function randomIP() {
return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}
terminalInput.addEventListener('keydown', (e) => {
if (isMatrixMode) {
e.preventDefault();
if (e.key === 'c' && e.ctrlKey) stopMatrix();
if (e.key === 'q') stopMatrix();
return;
}
if (e.key === 'Enter') {
const command = terminalInput.value.trim();
if (command.length > 100) {
printOutput("Error: Command too long. Maximum 100 characters allowed.", "error");
terminalInput.value = '';
return;
}
if (command) {
const prompt = isCiscoMode ? `${hostname}#` : `user@${hostname}:~$`;
printOutput(`${prompt} ${command}`, "command_safe");
processCommand(command);
commandHistory.push(command);
if (commandHistory.length > 50) commandHistory.shift();
historyIndex = commandHistory.length;
terminalInput.value = '';
}
} else if (e.key === 'ArrowUp') {
e.preventDefault();
if (historyIndex > 0) {
historyIndex--;
terminalInput.value = commandHistory[historyIndex];
}
} else if (e.key === 'ArrowDown') {
e.preventDefault();
if (historyIndex < commandHistory.length - 1) {
historyIndex++;
terminalInput.value = commandHistory[historyIndex];
} else {
historyIndex = commandHistory.length;
terminalInput.value = '';
}
} else if (e.key === 'Tab') {
e.preventDefault();
const current = terminalInput.value;
const match = availableCommands.find(c => c.startsWith(current));
if (match) terminalInput.value = match;
}
});
function printOutput(text, type = "text") {
const div = document.createElement('div');
div.classList.add('terminal-line');
if (type === "command" || type === "command_safe") div.classList.add('line-command');
if (type === "system") div.classList.add('line-system');
if (type === "error") div.classList.add('line-error');
if (type === "success") div.classList.add('line-success');
if (type === "accent") div.classList.add('line-accent');
if (type === "html") {
div.innerHTML = text;
} else if (text.startsWith('ASCII_ART')) {
div.style.whiteSpace = 'pre';
div.style.lineHeight = '1.2';
div.style.color = '#00ff00';
div.textContent = text.replace('ASCII_ART', '');
} else {
div.textContent = text;
}
terminalBody.appendChild(div);
terminalBody.scrollTop = terminalBody.scrollHeight;
}
function startMatrix() {
isMatrixMode = true;
terminalBody.innerHTML = '';
terminalInput.disabled = true;
terminalInput.placeholder = "Press 'q' to stop Matrix...";
const chars = "1010010010101010101XYzABC";
matrixInterval = setInterval(() => {
const span = document.createElement('span');
span.style.color = '#00ff00';
span.style.textShadow = '0 0 5px #00ff00';
span.style.fontFamily = 'monospace';
span.style.display = 'block';
span.textContent = Array(Math.floor(Math.random() * 80)).join(' ').split('').map(() => Math.random() > 0.9 ? chars[Math.floor(Math.random() * chars.length)] : ' ').join('');
terminalBody.appendChild(span);
terminalBody.scrollTop = terminalBody.scrollHeight;
if (terminalBody.childElementCount > 50) terminalBody.removeChild(terminalBody.firstChild);
}, 50);
}
function stopMatrix() {
isMatrixMode = false;
clearInterval(matrixInterval);
terminalBody.innerHTML = '';
printOutput("Matrix connection terminated.", "system");
terminalInput.disabled = false;
terminalInput.placeholder = "Enter command...";
terminalInput.focus();
}
function processCommand(cmd) {
const lowerCmd = cmd.toLowerCase();
if (isCiscoMode) {
if (lowerCmd === 'exit' || lowerCmd === 'end') {
isCiscoMode = false;
printOutput("Configured from console by console", "system");
return;
}
if (lowerCmd === 'show running-config' || lowerCmd === 'sh run') {
printOutput("Building configuration...");
printOutput(`Current configuration : 1840 bytes`);
printOutput(`!`);
printOutput(`version 17.3`);
printOutput(`service timestamps debug datetime msec`);
printOutput(`hostname ${hostname}`);
printOutput(`!`);
printOutput(`interface GigabitEthernet0/0`);
printOutput(` description WAN_UPLINK`);
printOutput(` ip address 192.168.1.10 255.255.255.0`);
printOutput(` no shutdown`);
printOutput(`!`);
printOutput(`interface Loopback0`);
printOutput(` ip address 10.10.10.1 255.255.255.255`);
printOutput(`!`);
printOutput(`router bgp 65000`);
printOutput(` bgp router-id 10.10.10.1`);
printOutput(` neighbor 10.45.0.1 remote-as 65001`);
printOutput(` neighbor 10.45.0.1 description ISP_PEERING`);
printOutput(`!`);
printOutput(`end`);
return;
}
if (lowerCmd === 'show ip interface brief' || lowerCmd === 'sh ip int br') {
printOutput("Interface              IP-Address      OK? Method Status                Protocol");
printOutput("GigabitEthernet0/0     192.168.1.10    YES manual up                    up");
printOutput("GigabitEthernet0/1     unassigned      YES unset  administratively down down");
printOutput("Loopback0              10.10.10.1      YES manual up                    up");
return;
}
if (lowerCmd === 'show bgp summary' || lowerCmd === 'sh bgp sum') {
printOutput("BGP router identifier 10.10.10.1, local AS number 65000");
printOutput("Neighbor        V           AS MsgRcvd MsgSent   TblVer  InQ OutQ Up/Down  State/PfxRcd");
printOutput("10.45.0.1       4        65001   12492   12389      101    0    0 3w2d            4");
return;
}
if (lowerCmd === 'show ip route' || lowerCmd === 'sh ip route') {
printOutput("Codes: L - local, C - connected, S - static, R - RIP, M - mobile, B - BGP");
printOutput("       D - EIGRP, EX - EIGRP external, O - OSPF, IA - OSPF inter area");
printOutput("");
printOutput("Gateway of last resort is 192.168.1.1 to network 0.0.0.0");
printOutput("");
printOutput("B*    0.0.0.0/0 [20/0] via 192.168.1.1, 3d08h, GigabitEthernet0/0");
printOutput("      10.0.0.0/8 is variably subnetted, 2 subnets, 2 masks");
printOutput("C        10.10.10.1/32 is directly connected, Loopback0");
printOutput("S        10.20.0.0/24 [1/0] via 192.168.1.254");
return;
}
if (lowerCmd.startsWith('ping')) {
const target = cmd.split(' ')[1] || '8.8.8.8';
printOutput(`Type escape sequence to abort.`);
printOutput(`Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:`);
let s = "";
const types = ["!", ".", "!", "!", "!"];
let i = 0;
const interval = setInterval(() => {
if (i >= 5) {
clearInterval(interval);
printOutput(s);
printOutput(`Success rate is 80 percent (4/5), round-trip min/avg/max = 28/32/44 ms`);
return;
}
s += types[i];
if (i === 0) printOutput(types[i]); // Show first immediately? No, wait logic is messy here
}, 400);
setTimeout(() => printOutput("!!!!!"), 800);
setTimeout(() => printOutput(`Success rate is 100 percent (5/5), round-trip min/avg/max = 28/32/44 ms`), 1200);
return;
}
if (lowerCmd.startsWith('conf')) {
printOutput("Enter configuration commands, one per line.  End with CNTL/Z.");
return;
}
printOutput("Invalid input detected at '^' marker.", "system");
return;
}
if (lowerCmd.startsWith('ping')) {
const target = cmd.split(' ')[1] || 'google.com';
printOutput(`PING ${target} (142.250.187.14) 56(84) bytes of data.`);
let count = 0;
const pinger = setInterval(() => {
count++;
const time = Math.floor(Math.random() * 20) + 10;
printOutput(`64 bytes from ${target}: icmp_seq=${count} ttl=117 time=${time}ms`, "success");
if (count >= 4) {
clearInterval(pinger);
printOutput(`--- ${target} ping statistics ---`, "system");
printOutput(`4 packets transmitted, 4 received, 0% packet loss`);
}
}, 800);
return;
}
if (lowerCmd.startsWith('traceroute') || lowerCmd.startsWith('trace')) {
const target = cmd.split(' ')[1] || 'google.com';
printOutput(`traceroute to ${target} (142.250.187.14), 30 hops max, 60 byte packets`);
let hop = 1;
const routes = [
"192.168.1.1 (192.168.1.1)  2.456 ms  1.123 ms  1.567 ms",
"10.50.0.1 (10.50.0.1)  12.456 ms  11.123 ms  11.567 ms",
"isp-gateway.net (203.0.113.5)  15.456 ms  14.123 ms  14.567 ms",
"core-router.isp.net (203.0.113.10)  22.456 ms  21.123 ms  21.567 ms",
`${target} (142.250.187.14)  23.456 ms  22.123 ms  22.567 ms`
];
let i = 0;
const traceInterval = setInterval(() => {
if (i >= routes.length) {
clearInterval(traceInterval);
return;
}
printOutput(` ${i + 1}  ${routes[i]}`);
i++;
}, 600);
return;
}
if (lowerCmd.startsWith('whois')) {
const target = cmd.split(' ')[1] || 'yasinengin.com';
printOutput(`Domain Name: ${target.toUpperCase()}`);
printOutput(`Registry Domain ID: 23482394_DOMAIN_COM-VRSN`);
printOutput(`Registrar WHOIS Server: whois.godaddy.com`);
printOutput(`Registrar URL: http://www.godaddy.com`);
printOutput(`Updated Date: 2025-11-20T10:00:00Z`);
printOutput(`Creation Date: 2020-05-15T10:00:00Z`);
printOutput(`Registry Expiry Date: 2030-05-15T10:00:00Z`);
printOutput(`Registrar: GoDaddy.com, LLC`);
return;
}
if (lowerCmd.startsWith('ssh')) {
printOutput(`OpenSSH 8.9p1 Ubuntu, OpenSSL 3.0.2 15 Mar 2026`);
setTimeout(() => printOutput(`${cmd.split(' ')[1] || 'user'}@${cmd.split(' ')[2] || 'remote'}'s password: `), 500);
setTimeout(() => printOutput(`Permission denied, please try again.`, "error"), 2500);
return;
}
if (lowerCmd.startsWith('dig') || lowerCmd.startsWith('nslookup')) {
const domain = cmd.split(' ')[1] || 'netreka.com';
printOutput(`; <<>> DiG 9.18.1 <<>> ${domain}`);
printOutput(`;; global options: +cmd`);
printOutput(`;; ANSWER SECTION:`);
printOutput(`${domain}.		3600	IN	A	${randomIP()}`, "success");
printOutput(`${domain}.		3600	IN	MX	10 mail.${domain}.`);
printOutput(`;; Query time: 12 msec`);
return;
}
if (lowerCmd === 'tcpdump') {
printOutput("tcpdump: verbose output suppressed, use -v or -vv for full protocol decode");
printOutput("listening on eth0, link-type EN10MB (Ethernet), capture size 262144 bytes");
let p = 0;
const dump = setInterval(() => {
p++;
const time = new Date().toTimeString().split(' ')[0];
const src = randomIP();
const dst = randomIP();
printOutput(`${time}.142353 IP ${src}.443 > ${dst}.56231: Flags [P.], seq 1:45, ack 1, win 502, options [nop,nop,TS val 234523 ecr 12345], length 44`, "system");
if (p > 6) {
clearInterval(dump);
printOutput(`6 packets captured`);
printOutput(`24 packets received by filter`);
printOutput(`0 packets dropped by kernel`);
}
}, 400);
return;
}
switch (lowerCmd) {
case 'help':
case '?':
printOutput("Use 'enable' to enter Cisco Mode.", "accent");
printOutput("General Commands:", "system");
printOutput("  ping <host>          ICMP Echo Request");
printOutput("  traceroute <host>    Trace path to destination");
printOutput("  dig / nslookup       DNS Lookup");
printOutput("  whois <domain>       Domain Registration Info");
printOutput("  netstat              Active Connections");
printOutput("  tcpdump              Packet Capture Utility");
printOutput("  top, neofetch        System Info");
printOutput("  clear, exit          Session Management");
printOutput("");
printOutput("Cisco Mode (type 'enable'):", "system");
printOutput("  show ip int brief    Interface Status");
printOutput("  show running-config  See Configuration");
printOutput("  show bgp summary     BGP Neighbors");
printOutput("  show ip route        Routing Table");
break;
case 'enable':
case 'en':
isCiscoMode = true;
hostname = "Core-Router";
printOutput("Changed mode to Cisco IOS. Type 'exit' to return.", "accent");
break;
case 'neofetch':
const art = `ASCII_ART
.---.
/     \\    user@netreka
|  O  |    ------------
\\     /    OS: YasinOS Land
'---'     Host: GitHub Pages
`;
printOutput(art);
break;
case 'matrix':
startMatrix();
break;
case 'ip a':
case 'ifconfig':
printOutput("1: lo: <LOOPBACK,UP,LOWER_UP> mtu 65536 qdisc noqueue state UNKNOWN");
printOutput("    link/loopback 00:00:00:00:00:00 brd 00:00:00:00:00:00");
printOutput("    inet 127.0.0.1/8 scope host lo");
printOutput("2: eth0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 state UP");
printOutput("    inet 192.168.1.10/24 brd 192.168.1.255 scope global eth0", "accent");
break;
case 'netstat':
case 'netstat -tulpen':
printOutput("Active Internet connections (only servers)");
printOutput("Proto Recv-Q Send-Q Local Address           Foreign Address         State       PID/Program name");
printOutput("tcp        0      0 0.0.0.0:22              0.0.0.0:*               LISTEN      892/sshd");
printOutput("tcp        0      0 127.0.0.1:5432          0.0.0.0:*               LISTEN      771/postgres");
printOutput("tcp6       0      0 :::80                   :::*                    LISTEN      102/nginx");
break;
case 'arp':
case 'arp -a':
printOutput("Interface: 192.168.1.10 --- 0x2");
printOutput("  Internet Address      Physical Address      Type");
printOutput(`  192.168.1.1           00-14-22-01-23-45     dynamic`);
printOutput(`  192.168.1.55          12-34-56-78-9a-bc     dynamic`);
break;
case 'scan':
printOutput("Starting Nmap 7.92...", "system");
setTimeout(() => printOutput("Discovered open port 80/tcp on 192.168.1.1", "success"), 1200);
setTimeout(() => printOutput("Discovered open port 22/tcp on 192.168.1.1", "success"), 1800);
break;
case 'whoami':
printOutput("User: Yasin Engin", "accent");
printOutput("Role: Network Engineer | Wireless Specialist | Automation Dev");
break;
case 'top':
printOutput("Tasks: 92 total,   1 running,  91 sleeping,   0 stopped,   0 zombie");
printOutput("%Cpu(s):  1.2 us,  0.5 sy,  0.0 ni, 98.2 id,  0.0 wa,  0.0 hi,  0.1 si");
printOutput("  PID USER      PR  NI    VIRT    RES    SHR S  %CPU %MEM     TIME+ COMMAND");
printOutput("  123 root      20   0  168532   4212   3000 R   0.7  0.1   0:01.44 top");
printOutput("    1 root      20   0  225884   9500   6800 S   0.0  0.2   0:05.11 systemd");
break;
case 'clear':
case 'cls':
terminalBody.innerHTML = '';
break;
case 'exit':
terminalOverlay.style.display = 'none';
break;
case 'reboot':
location.reload();
break;
default:
if (lowerCmd.startsWith('sudo')) {
printOutput("yasin is not in the sudoers file. This incident will be reported.", "error");
} else {
printOutput(`Command not found: ${cmd}. Type 'help'.`, "error");
}
}
}
});