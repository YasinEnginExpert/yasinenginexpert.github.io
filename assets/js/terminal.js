/* -------------------------------------------------------------------------
   TERMINAL 2.5 - NETWORK ENGINEER SIMULATOR CORE (Premium)
   - State machine (Linux + Cisco EXEC/PRIV/CONFIG/IF)
   - Process manager (Ctrl+C stop + clean summaries)
   - Context help with '?' (Cisco-like)
   - "do" support in config modes
   - Scenario engine + syslog buffer (show logging)
   - Reverse search (Ctrl+R) inside terminal (no prompt())
   - Autocomplete w/ common-prefix + suggestions list
   ------------------------------------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {
    const isMobileLite = window.matchMedia("(max-width: 768px)").matches;
    if (isMobileLite) {
        const terminalOverlay = document.getElementById("terminal-overlay");
        const terminalToggleBtn = document.getElementById("terminal-toggle-btn");
        if (terminalOverlay) terminalOverlay.style.display = "none";
        if (terminalToggleBtn) terminalToggleBtn.style.display = "none";
        return;
    }

    // --- DOM Elements ---
    const terminalOverlay = document.getElementById("terminal-overlay");
    const terminalBody = document.getElementById("terminal-body");
    const terminalInput = document.getElementById("terminal-input");
    const terminalToggleBtn = document.getElementById("terminal-toggle-btn");
    const closeTerminalBtn = document.getElementById("close-terminal-btn");
    const promptSpan = document.querySelector(".prompt");

    if (!terminalOverlay || !terminalBody || !terminalInput || !promptSpan) return;

    // --- Helpers ---
    const nowTime = () => new Date().toTimeString().split(" ")[0];
    const pad = (s, n) => String(s).padEnd(n, " ");
    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    // Very small HTML escape (default printing is textContent anyway)
    const escapeHTML = (str) =>
        String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");

    // --- State ---
    const termState = {
        // Session Management (Multi-device support)
        activeSessionId: "local",
        sessions: {
            "local": {
                name: "local",
                mode: "linux",
                hostname: "netreka",
                username: "user",
                history: [], // local command history
                currentIf: null
            },
            // Remote sessions will be created on demand:
            // "switch": { mode: "cisco_exec", hostname: "Switch", ... }
        },

        // Global History (Process-wide up-arrow)
        history: [],
        historyIndex: 0,

        // Reverse search
        reverse: {
            active: false,
            query: "",
            lastMatch: "",
            lineEl: null,
            savedInput: "",
        },

        // Active process (only 1 at a time)
        activeProcess: null,

        // Syslog buffer (Global for simplicity, or per-device? Let's keep global for now to show all "simulation" events)
        logs: [],
        maxLogs: 120,

        // Simulated network model (Global State)
        net: {
            gateway: "192.168.1.1",
            dns: "8.8.8.8",
            arpTable: {},
            routes: [
                { prefix: "0.0.0.0/0", via: "192.168.1.1", proto: "S", metric: "1/0" },
            ],
            bgp: {
                asn: 65000,
                routerId: "10.10.10.1",
                neighbors: [
                    { ip: "10.45.0.1", asn: 65001, state: "Established", uptime: "3w2d", pfx: 4 },
                ],
            },
            interfaces: {
                "GigabitEthernet0/0": {
                    ip: "192.168.1.10",
                    mask: "255.255.255.0",
                    adminUp: true,
                    operUp: true,
                    desc: "WAN_UPLINK",
                },
                "GigabitEthernet0/1": {
                    ip: null,
                    mask: null,
                    adminUp: false,
                    operUp: false,
                    desc: "",
                },
                "Loopback0": {
                    ip: "10.10.10.1",
                    mask: "255.255.255.255",
                    adminUp: true,
                    operUp: true,
                    desc: "RID",
                },
            },
        },

        // Scenario engine
        scenario: {
            name: null,
            intervalId: null,
        },
    };

    // Helper to get current session state
    function getSession() {
        return termState.sessions[termState.activeSessionId];
    }

    // --- Logging ---
    function log(level, msg) {
        termState.logs.push({ t: nowTime(), level, msg });
        if (termState.logs.length > termState.maxLogs) termState.logs.shift();
    }

    // Seed a few logs (makes it feel “alive”)
    log("INFO", "System boot complete. Netreka Terminal ready.");
    log("NOTICE", "Telemetry agent: gNMI stream idle (simulated).");

    // --- Rendering ---
    function print(text, type = "text") {
        const div = document.createElement("div");
        div.className = "terminal-line";

        // map types to existing CSS classes
        const ok = new Set(["command", "system", "error", "success", "accent", "text"]);
        const t = ok.has(type) ? type : "text";
        div.classList.add(`line-${t}`);

        // default: safe
        div.textContent = text;

        terminalBody.appendChild(div);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function printHtml(htmlSafe, type = "text") {
        const div = document.createElement("div");
        div.className = "terminal-line";
        div.classList.add(`line-${type}`);
        div.innerHTML = htmlSafe; // Use only internal controlled strings
        terminalBody.appendChild(div);
        terminalBody.scrollTop = terminalBody.scrollHeight;
    }

    function bannerOnce() {
        if (terminalBody.childElementCount > 0) return;
        print("Netreka Terminal [Version 2.5.0-PRO]");
        print("Type 'help' (Linux) or 'enable' (Cisco). Ctrl+R history search. Ctrl+L clear.");
        print("Tip: Try scenarios: 'scenario list' then 'scenario start bgp-flap'.", "system");
        print("------------------------------------------------------------", "system");
    }

    function updatePrompt() {
        const s = getSession();
        let p = "";

        // Dynamic hostname based on session
        const host = s.hostname || "Switch";

        switch (s.mode) {
            case "linux":
                p = `${s.username}@${s.name}:~$`;
                break;
            case "cisco_exec":
                p = `${host}>`;
                break;
            case "cisco_priv":
                p = `${host}#`;
                break;
            case "cisco_config":
                p = `${host}(config)#`;
                break;
            case "cisco_if":
                p = `${host}(config-if)#`;
                break;
        }

        // Hidden “premium detail”: show a tiny health flag in prompt
        // If uplink is down, prompt gets a warning symbol.
        const uplink = termState.net.interfaces["GigabitEthernet0/0"];
        const warn = uplink && (!uplink.adminUp || !uplink.operUp) ? " ⚠" : "";
        promptSpan.textContent = p + warn;
    }

    // --- Process Manager ---
    function stopActiveProcess(reason = "SIGINT") {
        const p = termState.activeProcess;
        if (!p) return false;

        (p.intervalIds || []).forEach((id) => clearInterval(id));
        (p.timeoutIds || []).forEach((id) => clearTimeout(id));

        termState.activeProcess = null;
        if (p.onStop) p.onStop(reason);

        return true;
    }

    function startProcess(proc) {
        // kill existing (no overlap)
        if (termState.activeProcess) stopActiveProcess("KILLED");
        termState.activeProcess = {
            name: proc.name || "job",
            intervalIds: proc.intervalIds || [],
            timeoutIds: proc.timeoutIds || [],
            onStop: proc.onStop || null,
        };
    }

    // --- Persistence ---
    const STORE_KEY = "netreka_term_history_v2";
    function saveSession() {
        try {
            localStorage.setItem(STORE_KEY, JSON.stringify(termState.history));
        } catch { }
    }
    function loadSession() {
        try {
            const raw = localStorage.getItem(STORE_KEY);
            if (!raw) return;
            termState.history = JSON.parse(raw) || [];
            termState.historyIndex = termState.history.length;
        } catch { }
    }

    // --- Command Registry ---
    // Each command: { name, aliases[], modes[], help, handler(ctx,args,line) }
    const registry = [];
    const byName = new Map();
    const aliasTo = new Map();

    function addCmd(cmd) {
        registry.push(cmd);
        byName.set(cmd.name, cmd);
        (cmd.aliases || []).forEach((a) => aliasTo.set(a, cmd.name));
    }

    function resolveCmd(name) {
        const n = name.toLowerCase();
        if (byName.has(n)) return byName.get(n);
        if (aliasTo.has(n)) return byName.get(aliasTo.get(n));
        return null;
    }

    function inMode(cmd) {
        if (!cmd || !cmd.modes) return false;
        return cmd.modes.includes("all") || cmd.modes.includes(getSession().mode);
    }

    // --- Cisco-like '?' help (context)
    const ciscoHelpTree = {
        "": ["show", "enable", "configure", "ping", "exit", "end", "scenario", "help"],
        show: ["ip", "running-config", "version", "logging", "bgp"],
        "show ip": ["interface", "route"],
        "show ip interface": ["brief"],
        "show bgp": ["summary"],
        configure: ["terminal"],
        interface: ["GigabitEthernet0/0", "GigabitEthernet0/1", "Loopback0"],
    };

    function showHelpFor(lineWithoutQ) {
        const trimmed = lineWithoutQ.trim();
        const key = trimmed.toLowerCase();

        // Best-match lookup: longest prefix in tree
        let best = "";
        for (const k of Object.keys(ciscoHelpTree)) {
            if (k === "") continue;
            if (key === k || key.startsWith(k + " ")) {
                if (k.length > best.length) best = k;
            }
        }
        const useKey = best || (ciscoHelpTree[key] ? key : "");
        const options = ciscoHelpTree[useKey] || [];

        if (!options.length) {
            print("% No help available for this context.", "error");
            return;
        }

        // Cisco help style: list options
        print("", "system");
        options.forEach((o) => print("  " + o, "system"));
    }

    // --- Network model helpers (makes everything feel connected) ---
    function getUplink() {
        return termState.net.interfaces["GigabitEthernet0/0"];
    }
    function isUplinkUp() {
        const u = getUplink();
        return !!u && u.adminUp && u.operUp;
    }
    function addArp(ip) {
        if (termState.net.arpTable[ip]) return;
        const mac = `00:50:56:${String(Math.floor(Math.random() * 255)).padStart(2, "0")}:${String(
            Math.floor(Math.random() * 255)
        ).padStart(2, "0")}:${String(Math.floor(Math.random() * 255)).padStart(2, "0")}`;
        termState.net.arpTable[ip] = mac;
    }

    // --- Commands: Linux + Cisco + Premium ---
    addCmd({
        name: "help",
        aliases: ["?"],
        modes: ["all"],
        help: "Show help",
        handler: () => {
            const mode = getSession().mode;
            if (mode === "linux") {
                print("Linux Mode Commands:", "accent");
                print("  help              Show this help");
                print("  neofetch          System info");
                print("  ip a              Show interfaces");
                print("  ping <host>       Ping (simulated)");
                print("  arp -a            ARP table (simulated)");
                print("  ssh <target>      Jump into Cisco simulator (try: ssh switch)");
                print("  scenario list     List scenarios");
                print("  scenario start X  Start scenario (bgp-flap / uplink-down)");
                print("  export transcript Download your session as .txt");
                print("  clear             Clear screen");
                print("");
                print("Cisco Tip: type 'enable' to enter Cisco modes (Switch>).", "system");
            } else {
                print("Cisco Mode Commands:", "accent");
                print("  enable                  Privileged EXEC");
                print("  configure terminal      Global config");
                print("  interface <name>        Interface config");
                print("  show ip int brief       Interface status");
                print("  show ip route           Routing table");
                print("  show bgp summary        BGP neighbor");
                print("  show logging            Syslog buffer");
                print("  ping <ip>               Cisco-style ping");
                print("  do <cmd>                Run show/ping from config modes");
                print("  end / exit              Back/exit");
                print("");
                print("Pro detail: Use '?' after a command for context help (e.g., 'show ?')", "system");
            }
        },
    });

    addCmd({
        name: "clear",
        aliases: ["cls"],
        modes: ["all"],
        handler: () => {
            terminalBody.innerHTML = "";
        },
    });

    addCmd({
        name: "neofetch",
        aliases: [],
        modes: ["linux"],
        handler: () => {
            const s = getSession();
            const art = `ASCII_ART
        .---.
       /     \\    ${s.username}@${s.hostname}
       |  O  |    ------------
       \\     /    OS: YasinOS Land (sim)
        '---'     Host: GitHub Pages
                 Uplink: ${isUplinkUp() ? "UP" : "DOWN"}
`;
            // print as pre to keep monospace
            const pre = document.createElement("pre");
            pre.className = "terminal-line line-accent";
            pre.style.whiteSpace = "pre";
            pre.textContent = art.replace("ASCII_ART", "");
            terminalBody.appendChild(pre);
            terminalBody.scrollTop = terminalBody.scrollHeight;
        },
    });

    addCmd({
        name: "ip",
        aliases: [],
        modes: ["linux"],
        handler: (args) => {
            const sub = (args[0] || "").toLowerCase();
            if (sub === "a" || sub === "addr") {
                const u = termState.net.interfaces["GigabitEthernet0/0"];
                print("1: lo: <LOOPBACK,UP> mtu 65536 qdisc noqueue state UNKNOWN");
                print("    inet 127.0.0.1/8 scope host lo");
                print(
                    `2: eth0: <BROADCAST,MULTICAST,${u.adminUp ? "UP" : "DOWN"}> mtu 1500 state ${u.operUp ? "UP" : "DOWN"}`
                );
                print(`    inet ${u.ip}/24 brd 192.168.1.255 scope global eth0`, "accent");
                return;
            }
            print("usage: ip a", "error");
        },
    });

    addCmd({
        name: "arp",
        aliases: ["arp", "arp -a"],
        modes: ["linux"],
        handler: (args) => {
            const keys = Object.keys(termState.net.arpTable);
            if (!keys.length) {
                print("ARP table empty. Try: ping 192.168.1.1", "system");
                return;
            }
            print("Address                  HWtype  HWaddress                 Iface", "system");
            keys.forEach((ip) => print(`${pad(ip, 24)} ether   ${pad(termState.net.arpTable[ip], 22)} eth0`));
        },
    });

    addCmd({
        name: "ssh",
        aliases: [],
        modes: ["linux"],
        handler: (args) => {
            const target = (args[0] || "").toLowerCase();
            if (!target) {
                print("usage: ssh <target> (try: ssh switch)", "error");
                return;
            }
            print(`OpenSSH_8.9p1 Ubuntu-3, OpenSSL 3.0.2`, "system");
            print(`Connecting to ${target}...`, "system");

            const tid = setTimeout(() => {
                if (["switch", "router", "cisco", "r1", "sw1"].includes(target)) {
                    log("INFO", `SSH session established to ${target} (simulated).`);

                    // SESSION SWITCH
                    const sessId = `ssh_${target}`;
                    if (!termState.sessions[sessId]) {
                        termState.sessions[sessId] = {
                            name: sessId,
                            mode: "cisco_exec",
                            hostname: target, // e.g. 'switch'
                            username: "admin",
                            history: [],
                            currentIf: null
                        };
                    }
                    termState.activeSessionId = sessId;

                    updatePrompt();
                    print("");
                    print(`${target}>`, "accent");
                    print("Type 'enable' to enter privileged mode.", "system");
                } else {
                    print(`ssh: connect to host ${target} port 22: Connection refused`, "error");
                }
            }, 700);

            startProcess({
                name: "ssh",
                timeoutIds: [tid],
                onStop: () => { /* no-op */ },
            });
            // Auto end process after it finishes
            const tid2 = setTimeout(() => stopActiveProcess("DONE"), 900);
            termState.activeProcess.timeoutIds.push(tid2);
        },
    });

    addCmd({
        name: "ping",
        aliases: [],
        modes: ["linux", "cisco_exec", "cisco_priv"],
        handler: (args) => {
            const target = args[0] || termState.net.dns;
            const u = getUplink();

            // Link the model: if uplink down and target not local, fail
            const isLocal = target.startsWith("192.168.1.");
            if (isLocal) addArp(target);

            if (getSession().mode === "linux") {
                // Parse: ping -c N host
                let count = 4;
                const cIndex = args.indexOf("-c");
                if (cIndex !== -1 && args[cIndex + 1]) {
                    count = clamp(parseInt(args[cIndex + 1], 10) || 4, 1, 20);
                }

                if (!u.adminUp || !u.operUp) {
                    print(`PING ${target} (${target}) 56(84) bytes of data.`, "system");
                    print(`From ${u.ip} icmp_seq=1 Destination Host Unreachable`, "error");
                    print(`--- ${target} ping statistics ---`, "system");
                    print(`${count} packets transmitted, 0 received, 100% packet loss`, "system");
                    return;
                }

                print(`PING ${target} (${target}) 56(84) bytes of data.`, "system");

                let sent = 0;
                let recv = 0;

                const iid = setInterval(() => {
                    sent++;
                    // if uplink down mid-run, fail
                    if (!isUplinkUp() && !isLocal) {
                        print(`From ${u.ip} icmp_seq=${sent} Destination Host Unreachable`, "error");
                    } else {
                        const time = (Math.random() * 12 + (isLocal ? 1 : 15)).toFixed(1);
                        recv++;
                        print(`64 bytes from ${target}: icmp_seq=${sent} ttl=${isLocal ? 64 : 117} time=${time} ms`, "success");
                    }

                    if (sent >= count) {
                        stopActiveProcess("DONE");
                    }
                }, 700);

                startProcess({
                    name: "ping",
                    intervalIds: [iid],
                    onStop: (reason) => {
                        if (reason === "SIGINT") print(`--- ${target} ping statistics ---`, "system");
                        const loss = Math.round(((sent - recv) / Math.max(sent, 1)) * 100);
                        print(`--- ${target} ping statistics ---`, "system");
                        print(`${sent} packets transmitted, ${recv} received, ${loss}% packet loss`, "system");
                    },
                });

                return;
            }

            // Cisco ping
            print(`Type escape sequence to abort.`, "system");
            print(`Sending 5, 100-byte ICMP Echos to ${target}, timeout is 2 seconds:`, "system");

            let i = 0;
            let success = 0;
            let out = "";

            const iid = setInterval(() => {
                i++;
                const ok = isLocal ? true : isUplinkUp();
                out += ok ? "!" : ".";
                if (ok) success++;

                if (i >= 5) {
                    stopActiveProcess("DONE");
                }
            }, 220);

            startProcess({
                name: "cisco-ping",
                intervalIds: [iid],
                onStop: () => {
                    print(out || ".....", "system");
                    const rate = Math.round((success / 5) * 100);
                    print(`Success rate is ${rate} percent (${success}/5), round-trip min/avg/max = 1/2/4 ms`, "system");
                },
            });
        },
    });

    // --- Cisco mode transitions ---
    addCmd({
        name: "enable",
        aliases: ["en"],
        modes: ["cisco_exec"],
        handler: () => {
            // Update SESSION mode
            getSession().mode = "cisco_priv";
            updatePrompt();
        },
    });

    addCmd({
        name: "configure",
        aliases: ["conf"],
        modes: ["cisco_priv"],
        handler: (args) => {
            const sub = (args[0] || "").toLowerCase();
            if (sub === "terminal" || sub === "t") {
                print("Enter configuration commands, one per line. End with CNTL/Z.", "system");
                getSession().mode = "cisco_config";
                updatePrompt();
                log("NOTICE", "Entered global configuration mode.");
                return;
            }
            print("% Invalid input detected at '^' marker.", "error");
        },
    });

    addCmd({
        name: "interface",
        aliases: ["int"],
        modes: ["cisco_config"],
        handler: (args) => {
            const ifName = args[0];
            if (!ifName) return print("% Incomplete command.", "error");

            // Crash Guard
            if (typeof ifName !== 'string') return print("% Invalid input.", "error");

            const canonical = Object.keys(termState.net.interfaces).find(
                (k) => k.toLowerCase() === ifName.toLowerCase()
            );
            if (!canonical) return print("% Invalid interface.", "error");

            getSession().currentIf = canonical;
            getSession().mode = "cisco_if";
            updatePrompt();
        },
    });

    // Config-if commands (premium realism)
    addCmd({
        name: "description",
        aliases: [],
        modes: ["cisco_if"],
        handler: (args) => {
            const txt = args.join(" ").trim();
            if (!txt) return print("% Incomplete command.", "error");
            const ifName = getSession().currentIf;
            termState.net.interfaces[ifName].desc = txt;
            log("NOTICE", `Interface ${ifName} description set.`);
        },
    });

    addCmd({
        name: "shutdown",
        aliases: ["shut"],
        modes: ["cisco_if"],
        handler: () => {
            const ifName = getSession().currentIf;
            const intf = termState.net.interfaces[ifName];
            intf.adminUp = false;
            // logic fix: adminDown implies operDown too
            intf.operUp = false;
            log("WARNING", `%LINK-5-CHANGED: Interface ${ifName}, changed state to administratively down`);
            print(`%LINK-5-CHANGED: Interface ${ifName}, changed state to administratively down`, "system");
        },
    });

    addCmd({
        name: "no",
        aliases: [],
        modes: ["cisco_if", "cisco_config"],
        handler: (args) => {
            const sub = (args[0] || "").toLowerCase();
            const mode = getSession().mode;

            if (mode === "cisco_if" && sub === "shutdown") {
                const ifName = getSession().currentIf;
                const intf = termState.net.interfaces[ifName];
                intf.adminUp = true;
                intf.operUp = true; // Simplified simulation
                log("NOTICE", `%LINK-3-UPDOWN: Interface ${ifName}, changed state to up`);
                print(`%LINK-3-UPDOWN: Interface ${ifName}, changed state to up`, "system");
                return;
            }
            print("% Invalid input detected at '^' marker.", "error");
        },
    });

    addCmd({
        name: "ip",
        aliases: [],
        modes: ["cisco_if"],
        handler: (args) => {
            const sub = (args[0] || "").toLowerCase();
            if (sub === "address" || sub === "addr") {
                const ip = args[1];
                const mask = args[2];
                if (!ip || !mask) return print("% Incomplete command.", "error");

                // Basic validation (simulated)
                const ifName = getSession().currentIf;
                const intf = termState.net.interfaces[ifName];
                intf.ip = ip;
                intf.mask = mask;
                log("NOTICE", `Interface ${ifName} IP set to ${ip} ${mask}`);
                return;
            }
            print("% Invalid input detected at '^' marker.", "error");
        },
    });

    // "do" support in config modes (very Cisco)
    addCmd({
        name: "do",
        aliases: [],
        modes: ["cisco_config", "cisco_if"],
        handler: (args, line) => {
            const inner = args.join(" ").trim();
            if (!inner) return print("% Incomplete command.", "error");

            // Temporarily run as privileged
            const s = getSession();
            const prevMode = s.mode;
            s.mode = "cisco_priv";

            updatePrompt();
            // Important: we need to handle "do show run" within global context?
            // Actually handleCommand uses getSession() now, so it will see cisco_priv
            handleCommand(inner, { internal: true });

            s.mode = prevMode;
            updatePrompt();
        },
    });

    // show commands
    addCmd({
        name: "show",
        aliases: ["sh"],
        modes: ["cisco_exec", "cisco_priv"],
        handler: (args) => {
            const sub = args.join(" ").toLowerCase().trim();

            if (sub === "ip interface brief" || sub === "ip int br" || sub === "ip int brief") {
                print("Interface              IP-Address      OK? Method Status                Protocol", "system");
                Object.entries(termState.net.interfaces).forEach(([name, v]) => {
                    const ip = v.ip ? v.ip : "unassigned";
                    const st = v.adminUp ? (v.operUp ? "up" : "down") : "administratively down";
                    const pr = v.operUp ? "up" : "down";
                    const meth = v.ip ? "manual" : "unset";
                    print(`${pad(name, 22)} ${pad(ip, 15)} YES ${pad(meth, 6)} ${pad(st, 22)} ${pr}`, "system");
                });
                return;
            }

            if (sub === "running-config" || sub === "run") {
                print("Building configuration...", "system");
                print("Current configuration : 1420 bytes", "system");
                print("!", "system");
                print("version 17.3", "system");
                print("hostname Switch", "system");
                print("!", "system");
                Object.entries(termState.net.interfaces).forEach(([name, v]) => {
                    print(`interface ${name}`, "system");
                    if (v.desc) print(` description ${v.desc}`, "system");
                    if (v.ip && v.mask) print(` ip address ${v.ip} ${v.mask}`, "system");
                    if (!v.adminUp) print(" shutdown", "system");
                    print("!", "system");
                });
                print(`router bgp ${termState.net.bgp.asn}`, "system");
                print(` bgp router-id ${termState.net.bgp.routerId}`, "system");
                termState.net.bgp.neighbors.forEach((n) => {
                    print(` neighbor ${n.ip} remote-as ${n.asn}`, "system");
                });
                print("end", "system");
                return;
            }

            if (sub === "ip route") {
                print("Codes: C - connected, L - local, S - static, B - BGP", "system");
                print(`Gateway of last resort is ${termState.net.gateway} to network 0.0.0.0`, "system");
                print("", "system");
                print(`S*    0.0.0.0/0 [${termState.net.routes[0].metric}] via ${termState.net.routes[0].via}`, "system");
                // Connected
                const u = termState.net.interfaces["GigabitEthernet0/0"];
                if (u.ip && u.mask) {
                    print(`C     192.168.1.0/24 is directly connected, GigabitEthernet0/0`, "system");
                    print(`L     ${u.ip}/32 is directly connected, GigabitEthernet0/0`, "system");
                }
                const lo = termState.net.interfaces["Loopback0"];
                print(`C     ${lo.ip}/32 is directly connected, Loopback0`, "system");
                return;
            }

            if (sub === "bgp summary" || sub === "bgp sum") {
                print(`BGP router identifier ${termState.net.bgp.routerId}, local AS number ${termState.net.bgp.asn}`, "system");
                print("Neighbor        V    AS MsgRcvd MsgSent   Up/Down  State/PfxRcd", "system");
                termState.net.bgp.neighbors.forEach((n) => {
                    print(`${pad(n.ip, 15)} 4 ${pad(n.asn, 6)} 12492   12389    ${pad(n.uptime, 7)} ${n.state}/${n.pfx}`, "system");
                });
                return;
            }

            if (sub === "logging" || sub === "log") {
                if (!termState.logs.length) return print("No logs.", "system");
                termState.logs.slice(-30).forEach((l) => {
                    print(`${l.t}  ${pad(l.level, 7)}  ${l.msg}`, "system");
                });
                return;
            }

            if (sub === "version") {
                print("Cisco IOS XE Software, Version 17.3.0 (simulated)", "system");
                print("Compiled Tue 01-Jan-26 00:00 by netreka", "system");
                print("ROM: IOS-XE ROMMON", "system");
                return;
            }

            print("% Invalid input detected at '^' marker.", "error");
        },
    });

    addCmd({
        name: "exit",
        aliases: [],
        modes: ["all"],
        handler: () => {
            // active process stop? (optional)
            if (termState.activeProcess) stopActiveProcess("SIGINT");

            const s = getSession();
            if (s.mode === "cisco_if") {
                s.mode = "cisco_config";
            } else if (s.mode === "cisco_config") {
                s.mode = "cisco_priv";
            } else if (s.mode === "cisco_priv") {
                s.mode = "cisco_exec";
            } else if (s.mode === "cisco_exec") {
                // If remote session, drop back to local
                if (termState.activeSessionId !== "local") {
                    print(`Connection to ${s.hostname} closed.`, "system");
                    termState.activeSessionId = "local";
                } else {
                    // Local session "exit" -> clear/hide?
                    // For now, allow "logout" effect or just hide
                    terminalOverlay.style.display = "none";
                }
            } else {
                // Linux exit -> hide
                terminalOverlay.style.display = "none";
            }
            updatePrompt();
        },
    });

    addCmd({
        name: "end",
        aliases: [],
        modes: ["cisco_config", "cisco_if"],
        handler: () => {
            getSession().mode = "cisco_priv";
            print("%SYS-5-CONFIG_I: Configured from console by console", "system");
            log("NOTICE", "Exited configuration mode.");
            updatePrompt();
        },
    });

    // Premium: scenario engine
    addCmd({
        name: "scenario",
        aliases: [],
        modes: ["all"],
        handler: (args) => {
            const sub = (args[0] || "").toLowerCase();
            const name = (args[1] || "").toLowerCase();

            const available = ["bgp-flap", "uplink-down"];
            if (!sub || sub === "list") {
                print("Scenarios:", "accent");
                available.forEach((s) => print("  " + s, "system"));
                print("usage: scenario start <name> | scenario stop", "system");
                return;
            }

            if (sub === "stop") {
                if (termState.scenario.intervalId) clearInterval(termState.scenario.intervalId);
                termState.scenario.intervalId = null;
                termState.scenario.name = null;
                log("NOTICE", "Scenario stopped.");
                print("Scenario stopped.", "system");
                return;
            }

            if (sub === "start") {
                if (!available.includes(name)) {
                    print(`Unknown scenario: ${name}`, "error");
                    return;
                }
                // stop old
                if (termState.scenario.intervalId) clearInterval(termState.scenario.intervalId);

                termState.scenario.name = name;
                log("NOTICE", `Scenario started: ${name}`);
                print(`Scenario started: ${name}`, "system");

                if (name === "bgp-flap") {
                    termState.scenario.intervalId = setInterval(() => {
                        const n = termState.net.bgp.neighbors[0];
                        if (!n) return;
                        if (n.state === "Established") {
                            n.state = "Idle";
                            n.uptime = "00:00:02";
                            log("WARNING", `%BGP-5-ADJCHANGE: neighbor ${n.ip} Down`);
                        } else {
                            n.state = "Established";
                            n.uptime = "00:00:25";
                            log("NOTICE", `%BGP-5-ADJCHANGE: neighbor ${n.ip} Up`);
                        }
                    }, 5500);
                }

                if (name === "uplink-down") {
                    termState.scenario.intervalId = setInterval(() => {
                        const u = getUplink();
                        if (!u) return;
                        u.adminUp = !u.adminUp;
                        u.operUp = u.adminUp;
                        log("WARNING", `%LINK-5-CHANGED: Interface GigabitEthernet0/0, state ${u.adminUp ? "up" : "down"}`);
                    }, 7000);
                }

                updatePrompt();
                return;
            }

            print("usage: scenario list | scenario start <name> | scenario stop", "error");
        },
    });

    // Premium: export transcript
    addCmd({
        name: "export",
        aliases: [],
        modes: ["linux"],
        handler: (args) => {
            const sub = (args[0] || "").toLowerCase();
            if (sub !== "transcript") {
                print("usage: export transcript", "error");
                return;
            }
            const lines = Array.from(terminalBody.querySelectorAll(".terminal-line")).map((el) => el.textContent);
            const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "netreka-terminal-transcript.txt";
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(url);
            print("Transcript exported.", "success");
        },
    });

    // --- Core execution ---
    function handleCommand(raw, opts = {}) {
        const line = String(raw || "").trim();
        if (!line) return;

        // Cisco-like help: if ends with '?'
        if (line.endsWith("?")) {
            const without = line.slice(0, -1);
            showHelpFor(without);
            return;
        }

        // Print prompt + command (skip if internal do-calls)
        if (!opts.internal) print(`${promptSpan.textContent} ${line}`, "command");

        // Parse
        const parts = line.split(/\s+/);
        const cmdName = parts[0].toLowerCase();
        const args = parts.slice(1);

        const cmd = resolveCmd(cmdName);

        if (!cmd) {
            if (getSession().mode === "linux") print(`${cmdName}: command not found`, "error");
            else print("% Invalid input detected at '^' marker.", "error");
            return;
        }

        if (!inMode(cmd)) {
            print("% Invalid input detected at '^' marker. (Not available in this mode)", "error");
            return;
        }

        try {
            cmd.handler(args, line);
            updatePrompt();
        } catch (e) {
            print("Internal error: command failed safely.", "error");
            console.error(e);
        }
    }

    // --- Reverse search (Ctrl+R) without prompt() ---
    function reverseStart() {
        if (termState.reverse.active) return;
        termState.reverse.active = true;
        termState.reverse.query = "";
        termState.reverse.lastMatch = "";
        termState.reverse.savedInput = terminalInput.value;

        const el = document.createElement("div");
        el.className = "terminal-line line-system";
        el.textContent = "(reverse-i-search)`': ";
        terminalBody.appendChild(el);
        terminalBody.scrollTop = terminalBody.scrollHeight;

        termState.reverse.lineEl = el;
        terminalInput.value = "";
        terminalInput.placeholder = "reverse-i-search... (Enter to accept, Esc to cancel)";
    }

    function reverseUpdate() {
        const q = termState.reverse.query;
        const match = [...termState.history].reverse().find((c) => c.includes(q)) || "";
        termState.reverse.lastMatch = match;

        if (termState.reverse.lineEl) {
            termState.reverse.lineEl.textContent = `(reverse-i-search)\`${q}\`: ${match || "(no match)"}`;
        }
    }

    function reverseStop(accept = false) {
        if (!termState.reverse.active) return;
        const match = termState.reverse.lastMatch;

        if (termState.reverse.lineEl) termState.reverse.lineEl.remove();
        termState.reverse.lineEl = null;

        terminalInput.placeholder = "Enter command...";
        terminalInput.value = accept ? match : termState.reverse.savedInput;

        termState.reverse.active = false;
        termState.reverse.query = "";
        termState.reverse.lastMatch = "";
        termState.reverse.savedInput = "";
    }

    // --- Autocomplete (common prefix) ---
    function commonPrefix(arr) {
        if (!arr.length) return "";
        let p = arr[0];
        for (let i = 1; i < arr.length; i++) {
            while (!arr[i].startsWith(p) && p) p = p.slice(0, -1);
        }
        return p;
    }

    function autocomplete() {
        const curr = terminalInput.value.trim();
        if (!curr) return;

        const tokens = curr.split(/\s+/);
        if (tokens.length > 1) return; // keep simple; only first-token autocomplete

        const needle = tokens[0].toLowerCase();
        const names = registry.map((c) => c.name);
        const matches = names.filter((n) => n.startsWith(needle));

        if (matches.length === 1) {
            terminalInput.value = matches[0] + " ";
            return;
        }
        if (matches.length > 1) {
            const pref = commonPrefix(matches);
            if (pref && pref.length > needle.length) {
                terminalInput.value = pref;
                return;
            }
            print(matches.join("  "), "system");
        }
    }

    // --- Input handling ---
    terminalInput.addEventListener("keydown", (e) => {
        // While reverse search is active
        if (termState.reverse.active) {
            if (e.key === "Escape") {
                e.preventDefault();
                reverseStop(false);
                return;
            }
            if (e.key === "Enter") {
                e.preventDefault();
                reverseStop(true);
                return;
            }
            if (e.key === "Backspace") {
                e.preventDefault();
                termState.reverse.query = termState.reverse.query.slice(0, -1);
                reverseUpdate();
                return;
            }
            if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                e.preventDefault();
                termState.reverse.query += e.key;
                reverseUpdate();
                return;
            }
            // ignore other keys
            e.preventDefault();
            return;
        }

        // Ctrl+C => stop active process
        if (e.ctrlKey && e.key.toLowerCase() === "c") {
            e.preventDefault();
            if (termState.activeProcess) {
                print("^C", "error");
                stopActiveProcess("SIGINT");
                terminalInput.value = "";
                terminalInput.focus();
            } else {
                print("^C", "system");
                terminalInput.value = "";
            }
            return;
        }

        // Ctrl+L => clear
        if (e.ctrlKey && e.key.toLowerCase() === "l") {
            e.preventDefault();
            terminalBody.innerHTML = "";
            return;
        }

        // Ctrl+R => reverse search
        if (e.ctrlKey && e.key.toLowerCase() === "r") {
            e.preventDefault();
            reverseStart();
            reverseUpdate();
            return;
        }

        // Tab => autocomplete
        if (e.key === "Tab") {
            e.preventDefault();
            autocomplete();
            return;
        }

        // Enter => execute
        if (e.key === "Enter") {
            e.preventDefault();
            const raw = terminalInput.value;

            // length guard (premium detail)
            if (raw.length > 140) {
                print("Error: Command too long (max 140 chars).", "error");
                terminalInput.value = "";
                return;
            }

            terminalInput.value = "";
            const line = raw.trim();
            if (!line) return;

            // history
            termState.history.push(line);
            if (termState.history.length > 80) termState.history.shift();
            termState.historyIndex = termState.history.length;
            saveSession();

            handleCommand(line);
            return;
        }

        // history up/down
        if (e.key === "ArrowUp") {
            e.preventDefault();
            termState.historyIndex = clamp(termState.historyIndex - 1, 0, termState.history.length);
            terminalInput.value = termState.history[termState.historyIndex] || "";
            return;
        }

        if (e.key === "ArrowDown") {
            e.preventDefault();
            termState.historyIndex = clamp(termState.historyIndex + 1, 0, termState.history.length);
            terminalInput.value = termState.history[termState.historyIndex] || "";
            return;
        }
    });

    // --- Overlay controls ---
    function toggleTerminal() {
        const hidden = terminalOverlay.style.display === "none" || terminalOverlay.style.display === "";
        terminalOverlay.style.display = hidden ? "flex" : "none";
        if (hidden) {
            bannerOnce();
            updatePrompt();
            terminalInput.focus();
        }
    }

    if (terminalToggleBtn) terminalToggleBtn.addEventListener("click", toggleTerminal);
    if (closeTerminalBtn) closeTerminalBtn.addEventListener("click", () => (terminalOverlay.style.display = "none"));

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && terminalOverlay.style.display === "flex") {
            terminalOverlay.style.display = "none";
        }
    });

    // Init
    loadSession();
    updatePrompt();
});
