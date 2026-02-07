import { useEffect, useState } from 'react'
import { TerminalComponent } from './ui/Terminal'
import { NetworkMap } from './ui/NetworkMap'
import { useGameStore } from './engine/session'

function App() {
    const [activeDevice, setActiveDevice] = useState('R1');
    const [mobileTab, setMobileTab] = useState<'map' | 'cli' | 'data'>('map');
    const [showGuide, setShowGuide] = useState(false);
    const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
    const { topology, sla, score, alerts } = useGameStore();
    const faults = useGameStore((s) => s.faults);
    const missions = useGameStore((s) => s.missions);
    const events = useGameStore((s) => s.events);
    const currentDevice = topology.devices[activeDevice];
    const activeFaults = faults.filter(f => !f.resolved);
    const deviceFaults = activeFaults.filter(f => f.deviceId === activeDevice);
    const activeAlerts = alerts.filter(a => a.active);
    const threatScore = activeAlerts.reduce((sum, a) => {
        if (a.severity === 'critical') return sum + 35;
        if (a.severity === 'major') return sum + 20;
        return sum + 10;
    }, 0);
    const threatLevel = Math.min(100, threatScore);
    const xpMax = 1500;
    const opsLevel = Math.max(1, Math.floor(score / xpMax) + 1);
    const xp = score % xpMax;
    const xpPct = Math.round((xp / xpMax) * 100);
    const toggleHint = (id: string) => {
        setRevealedHints((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const tick = useGameStore((s) => s.tick);
    useEffect(() => {
        let intervalId: number | null = null;
        const start = () => {
            if (intervalId === null) {
                intervalId = window.setInterval(() => {
                    tick();
                }, 1000);
            }
        };
        const stop = () => {
            if (intervalId !== null) {
                window.clearInterval(intervalId);
                intervalId = null;
            }
        };
        const handleVisibility = () => {
            if (document.hidden) {
                stop();
            } else {
                start();
            }
        };

        start();
        document.addEventListener('visibilitychange', handleVisibility);
        return () => {
            stop();
            document.removeEventListener('visibilitychange', handleVisibility);
        };
    }, [tick]);

    return (
        <div className="flex flex-col md:flex-row h-screen w-screen bg-gray-950 text-gray-200 font-mono overflow-hidden relative">
            {/* Global CRT Effects */}
            <div className="crt-overlay pointer-events-none fixed inset-0 z-50"></div>
            <div className="crt-scanline pointer-events-none fixed inset-0 z-50"></div>

            {showGuide && (
                <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="w-full max-w-3xl bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl p-6 text-gray-200">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <div className="text-xs font-black uppercase tracking-[0.3em] text-gray-500">Ops Manual</div>
                                <div className="text-2xl font-black text-white">Incident Response Playbook</div>
                            </div>
                            <button
                                onClick={() => setShowGuide(false)}
                                className="text-xs font-black uppercase tracking-widest px-3 py-1 rounded border border-gray-700 hover:border-green-500/60 hover:text-green-400 transition-all"
                            >
                                Close
                            </button>
                        </div>
                        <div className="grid md:grid-cols-2 gap-4 text-[12px] leading-relaxed">
                            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-2">Quick Start</div>
                                <div>1) Click a device on the map to connect.</div>
                                <div>2) Run `show ip int brief` and `show interfaces`.</div>
                                <div>3) Fix issues with `conf t`, `interface`, `no shutdown`, `ip address`, `switchport`.</div>
                                <div>4) Validate with `ping` and `traceroute`.</div>
                            </div>
                            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-2">Common Checks</div>
                                <div>`show vlan brief` for access VLAN mismatches.</div>
                                <div>`show run` to verify interface configs.</div>
                                <div>`show ip route` to confirm reachability.</div>
                                <div>Use device hints from the Ops Intel panel.</div>
                            </div>
                            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-2">CLI Tips</div>
                                <div>`?` or `help` shows command help.</div>
                                <div>`show ?` and `show ip ?` for subcommands.</div>
                                <div>`do` runs exec commands from config mode.</div>
                            </div>
                            <div className="bg-gray-900/40 border border-gray-800 rounded-xl p-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-2">Scoring</div>
                                <div>Clear faults to gain XP and credits.</div>
                                <div>Keep SLA high to avoid penalties.</div>
                                <div>Resolve major faults first to reduce Threat.</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Left Sidebar: Tools & Missions (Desktop Only) */}
            <div className="hidden md:flex w-20 border-r border-gray-800 flex-col items-center py-6 gap-6 bg-gray-950/50 backdrop-blur z-20 shadow-2xl relative">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl border border-green-500/50 flex flex-col items-center justify-center hover:bg-green-500/20 cursor-pointer group transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <span className="text-[10px] font-black text-green-500 group-hover:scale-110 transition-transform">CMD</span>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl border border-blue-500/50 flex flex-col items-center justify-center hover:bg-blue-500/20 cursor-pointer group transition-all">
                    <span className="text-[10px] font-black text-blue-500 group-hover:scale-110 transition-transform">MAP</span>
                </div>

                <div className="w-px h-12 bg-gray-800 my-2"></div>

                <div className="flex flex-col gap-4 overflow-y-auto px-2 custom-scrollbar">
                    <h4 className="text-[8px] font-black text-gray-500 uppercase vertical-text tracking-widest mb-2 px-1">Missions</h4>
                    {missions.map((m) => (
                        <div key={m.id}
                            className={`w-12 h-12 rounded-xl border flex items-center justify-center cursor-help transition-all group relative ${m.completed ? 'bg-green-500/20 border-green-500/40' : 'bg-gray-800/20 border-gray-700/40 hover:border-blue-500/40'}`}
                            title={m.description}>
                            <i className={`fas ${m.completed ? 'fa-check text-green-500' : 'fa-bullseye text-gray-600 group-hover:text-blue-400'}`}></i>
                            {!m.completed && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_5px_#3b82f6]"></div>}
                        </div>
                    ))}
                </div>

                <div className="mt-auto mb-6 opacity-50 hover:opacity-100 cursor-pointer transition-all">
                    <button
                        onClick={() => setShowGuide(true)}
                        className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-[10px] hover:bg-white/5"
                        title="Ops Manual"
                    >
                        ?
                    </button>
                </div>
            </div>

            {/* Right Panel: Monitor & Alerts & Events (Desktop & Mobile 'Data' Tab) */}
            <div className={`
                ${mobileTab === 'data' ? 'flex w-full' : 'hidden'} 
                md:flex md:w-80 md:border-l border-gray-800 bg-gray-900/40 backdrop-blur-2xl z-20 flex-col order-last shrink-0 shadow-2xl relative
            `}>
                {/* Device Monitor Section */}
                <div className="p-4 border-b border-gray-800 bg-black/20">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                        Status: {activeDevice}
                    </h3>
                    <div className="space-y-1.5">
                        {currentDevice && Object.values(currentDevice.interfaces).map((int) => (
                            <div key={int.id} className="group flex items-center justify-between text-[11px] bg-gray-950/60 p-2.5 rounded border border-gray-800/50 hover:border-gray-600/50 transition-all">
                                <span className="text-gray-400 truncate max-w-[100px] font-medium">{int.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className={int.ip ? "text-blue-400/90 font-bold" : "text-gray-700 italic"}>{int.ip || 'none'}</span>
                                    <div className={`w-2 h-2 rounded-full ${int.status === 'up' ? 'bg-green-500 shadow-[0_0_8px_#22c55e]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Ops Intel / Fault Hints */}
                <div className="px-4 py-3 border-b border-gray-800 bg-black/30">
                    <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Ops Intel</h3>
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${deviceFaults.length ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                            {deviceFaults.length}
                        </span>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {deviceFaults.length === 0 ? (
                            <div className="text-[10px] text-gray-600 italic">No local faults detected.</div>
                        ) : (
                            deviceFaults.map((fault) => (
                                <div key={fault.id} className="p-2 rounded border border-gray-800/70 bg-gray-950/40">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className={`text-[8px] font-black uppercase tracking-widest ${fault.severity === 'critical' ? 'text-red-400' : fault.severity === 'major' ? 'text-orange-400' : 'text-blue-400'}`}>
                                            {fault.severity}
                                        </span>
                                        <button
                                            onClick={() => toggleHint(fault.id)}
                                            className="text-[9px] font-bold text-amber-300 hover:text-amber-200"
                                        >
                                            {revealedHints[fault.id] ? 'Hide Hint' : 'Hint'}
                                        </button>
                                    </div>
                                    <div className="text-[11px] font-semibold text-gray-200">{fault.title}</div>
                                    {revealedHints[fault.id] && (
                                        <div className="text-[10px] text-amber-300/90 mt-1">{fault.hint}</div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* SLA Mini Graph */}
                <div className="px-4 py-3 border-b border-gray-800 flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">SLA Perf</span>
                        <span className="text-[10px] font-bold text-green-400 tabular-nums">{sla.toFixed(2)}%</span>
                    </div>
                    <svg className="w-full h-8 overflow-visible">
                        <path
                            d={`M0 ${32 - sla * 0.3} Q 40 ${32 - sla * 0.32}, 80 ${32 - sla * 0.28} T 160 ${32 - sla * 0.3} T 320 ${32 - sla * 0.31}`}
                            fill="none" stroke="#22c55e" strokeWidth="1.5" strokeOpacity="0.5"
                            className="animate-[dash_10s_linear_infinite]"
                            style={{ strokeDasharray: '4 4' }}
                        />
                    </svg>
                </div>

                {/* Alerts Section (Fixed Height) */}
                <div className="h-40 flex flex-col border-b border-gray-800">
                    <div className="p-4 py-2.5 flex justify-between items-center bg-black/10">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Active Alerts</h3>
                        <span className="text-[9px] bg-red-500/20 text-red-500 px-2 py-0.5 rounded-full font-bold">
                            {alerts.filter((a) => a.active).length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-black/5">
                        {alerts.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[10px] text-gray-700 italic">CLEARED</div>
                        ) : (
                            alerts.map((alert) => (
                                <div key={alert.id} className={`p-2 rounded text-[9px] border ${alert.severity === 'critical' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-blue-500/5 border-blue-500/20 text-blue-400'}`}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-black uppercase">{alert.severity}</span>
                                        <span className="opacity-50 text-[8px]">{new Date(alert.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                                    </div>
                                    <p className="font-medium opacity-90">{alert.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Live Traffic / Event Log Section (Flexible) */}
                <div className="flex-1 overflow-hidden flex flex-col">
                    <div className="p-4 py-3 bg-black/10 flex items-center justify-between border-b border-gray-800">
                        <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Live Traffic</h3>
                        <div className="flex gap-1">
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse [animation-delay:0.2s]"></div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 bg-black/40 font-mono text-[9px] custom-scrollbar">
                        {events.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-10">
                                <i className="fas fa-satellite text-2xl mb-2"></i>
                                <span className="text-[7px]">SIGNAL CLEAR</span>
                            </div>
                        ) : (
                            events.map((event) => (
                                <div key={event.id} className="mb-2.5 border-l-2 border-gray-800/50 pl-2 hover:border-blue-500/50 transition-all">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <span className="text-[7px] text-gray-500">{new Date(event.timestamp).toLocaleTimeString([], { hour12: false })}</span>
                                        <span className={`px-1 rounded-sm text-[7px] font-black uppercase ${event.type === 'packet' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}`}>
                                            {event.type}
                                        </span>
                                    </div>
                                    <div className="text-gray-400 text-[10px] leading-tight font-medium">
                                        {event.description}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Middle Area */}
            <div className={`
                ${mobileTab === 'data' ? 'hidden md:flex' : 'flex'} 
                flex-1 flex-col min-w-0 bg-black relative
            `}>
                {/* Header / HUD */}
                <div className="h-16 md:h-16 border-b border-gray-800/80 flex items-center px-4 md:px-8 justify-between bg-black/80 backdrop-blur z-30 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-8 h-8 md:w-10 md:h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] group-hover:rotate-12 transition-transform">
                            <i className="fas fa-bolt text-black text-sm md:text-lg"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-lg md:text-2xl font-black italic tracking-tighter leading-none text-white">NOC <span className="text-green-500">RUSH</span></span>
                            <span className="text-[8px] md:text-[9px] text-gray-500 font-black tracking-widest uppercase">Expert Sim v0.42</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex gap-10">
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em]">Ops Level</span>
                            <div className="flex items-center gap-3">
                                <div className="text-lg font-black text-green-400">L{opsLevel}</div>
                                <div className="w-28 h-2 bg-gray-900 rounded-full border border-white/5 overflow-hidden shadow-inner">
                                    <div
                                        className="h-full bg-gradient-to-r from-green-500 to-emerald-300 transition-all duration-700"
                                        style={{ width: `${xpPct}%` }}
                                    />
                                </div>
                                <span className="text-[9px] font-bold text-gray-400 tabular-nums">{xp}/{xpMax} XP</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em]">Service Level Agreement</span>
                            <div className="flex items-center gap-3">
                                <div className="w-48 h-2 bg-gray-900 rounded-full border border-white/5 overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full transition-all duration-1000 ${sla > 90 ? 'bg-green-500' : sla > 70 ? 'bg-yellow-500' : 'bg-red-500 animate-pulse'}`}
                                        style={{ width: `${sla}%` }}
                                    />
                                </div>
                                <span className={`text-sm font-black italic tabular-nums ${sla > 90 ? 'text-green-400' : sla > 70 ? 'text-yellow-400' : 'text-red-400'}`}>{sla.toFixed(1)}%</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em]">Threat Level</span>
                            <div className="flex items-center gap-3">
                                <div className="w-28 h-2 bg-gray-900 rounded-full border border-white/5 overflow-hidden shadow-inner">
                                    <div
                                        className={`h-full transition-all duration-700 ${threatLevel > 70 ? 'bg-red-500 animate-pulse' : threatLevel > 40 ? 'bg-orange-400' : 'bg-blue-500'}`}
                                        style={{ width: `${threatLevel}%` }}
                                    />
                                </div>
                                <span className={`text-[9px] font-bold tabular-nums ${threatLevel > 70 ? 'text-red-400' : threatLevel > 40 ? 'text-orange-400' : 'text-blue-400'}`}>{threatLevel}%</span>
                            </div>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em]">Open Tickets</span>
                            <div className="flex items-center gap-2">
                                <span className={`text-sm font-black tabular-nums ${activeFaults.length ? 'text-red-400' : 'text-green-400'}`}>{activeFaults.length}</span>
                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-600">OPEN</span>
                            </div>
                        </div>
                        <div className="w-px h-10 bg-gray-800/50 self-center"></div>
                        <div className="flex flex-col items-end justify-center">
                            <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em]">Mission Credits</span>
                            <span className="text-2xl font-black text-white tabular-nums tracking-tighter shadow-sm">{score.toLocaleString()}</span>
                        </div>
                        </div>

                        {/* Mobile Score Compact View */}
                        <div className="flex md:hidden items-center gap-3">
                            <div className="flex flex-col items-end">
                                <span className={`text-xs font-black italic ${sla > 90 ? 'text-green-400' : 'text-red-400'}`}>{sla.toFixed(0)}% SLA</span>
                                <span className="text-xs font-bold text-gray-400">{score} CR</span>
                                <span className="text-[9px] text-gray-500 font-bold">L{opsLevel} | THR {threatLevel}% | TKT {activeFaults.length}</span>
                            </div>
                            <button
                                onClick={() => setShowGuide(true)}
                                className="text-[10px] font-black uppercase tracking-widest text-gray-500 border border-gray-800 rounded px-2 py-1"
                            >
                                Guide
                            </button>
                        </div>

                        <button
                            onClick={() => setShowGuide(true)}
                            className="hidden md:inline-flex items-center gap-2 px-3 py-2 border border-gray-800 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-green-400 hover:border-green-500/50 transition-all"
                        >
                            Ops Manual
                        </button>
                    </div>
                </div>

                {/* Viewport Split */}
                <div className="flex-1 flex flex-col relative overflow-hidden pb-16 md:pb-0">
                    {/* Top: Topology Area */}
                    <div className={`
                        ${mobileTab === 'map' ? 'flex-1' : 'hidden md:flex md:flex-1'} 
                        relative transition-all duration-300
                    `}>
                        <NetworkMap
                            activeDevice={activeDevice}
                            onDeviceClick={(deviceId: string) => setActiveDevice(deviceId)}
                        />
                        {/* Topology Overlay Info */}
                        <div className="absolute top-6 left-8 pointer-events-none group hidden md:block">
                            <div className="bg-black/80 backdrop-blur-md p-4 rounded-2xl border border-white/5 shadow-2xl transition-all hover:border-green-500/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_#22c55e]"></div>
                                    <h4 className="text-[10px] text-white uppercase font-black tracking-widest">Zone: ISTANBUL-4-TX</h4>
                                </div>
                                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Topology: <span className="text-white">Active Production</span></div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom: Extreme Terminal */}
                    <div className={`
                        ${mobileTab === 'cli' ? 'flex-1 h-full' : 'hidden md:flex md:h-[45%]'}
                        border-t border-gray-800/50 bg-black relative flex flex-col group z-40 transition-all duration-300
                    `}>
                        <div className="h-10 bg-gray-950/90 flex items-center px-4 md:px-6 justify-between border-b border-gray-800/80 shadow-2xl shrink-0">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
                                </div>
                                <div className="w-px h-4 bg-gray-800 mx-2"></div>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Console: {activeDevice}</span>
                            </div>
                            <div className="hidden md:flex items-center gap-6">
                                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">9600-8-N-1 / TTY-01</span>
                                <span className="text-[8px] text-green-500/40 animate-pulse font-black uppercase tracking-widest">Link Secure</span>
                            </div>
                        </div>
                        <div className="flex-1 relative overflow-hidden">
                            <TerminalComponent key={activeDevice} deviceName={activeDevice} />
                        </div>
                    </div>
                </div>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden absolute bottom-0 left-0 w-full h-16 bg-gray-950 border-t border-gray-800 flex items-center justify-around z-50 pb-2">
                    <button
                        onClick={() => setMobileTab('map')}
                        className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'map' ? 'text-blue-500' : 'text-gray-600'}`}>
                        <i className="fas fa-network-wired text-lg"></i>
                        <span className="text-[10px] font-bold uppercase">Map</span>
                    </button>
                    <button
                        onClick={() => setMobileTab('cli')}
                        className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'cli' ? 'text-green-500' : 'text-gray-600'}`}>
                        <i className="fas fa-terminal text-lg"></i>
                        <span className="text-[10px] font-bold uppercase">Terminal</span>
                    </button>
                    <button
                        onClick={() => setMobileTab('data')}
                        className={`flex flex-col items-center gap-1 p-2 ${mobileTab === 'data' ? 'text-purple-500' : 'text-gray-600'}`}>
                        <div className="relative">
                            <i className="fas fa-chart-line text-lg"></i>
                            {alerts.some(a => a.active) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>}
                        </div>
                        <span className="text-[10px] font-bold uppercase">Data</span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default App
