import { useState } from 'react'
import { TerminalComponent } from './ui/Terminal'
import { NetworkMap } from './ui/NetworkMap'
import { useGameStore } from './engine/session'

function App() {
    const [activeDevice, setActiveDevice] = useState('R1');
    const { topology, sla, score, alerts } = useGameStore();
    const currentDevice = topology.devices[activeDevice];

    return (
        <div className="flex h-screen w-screen bg-gray-950 text-gray-200 font-mono overflow-hidden relative">
            {/* Global CRT Effects */}
            <div className="crt-overlay"></div>
            <div className="crt-scanline"></div>

            {/* Left Sidebar: Tools & Missions */}
            <div className="w-20 border-r border-gray-800 flex flex-col items-center py-6 gap-6 bg-gray-950/50 backdrop-blur z-20 shadow-2xl relative">
                <div className="w-12 h-12 bg-green-500/10 rounded-xl border border-green-500/50 flex flex-col items-center justify-center hover:bg-green-500/20 cursor-pointer group transition-all shadow-[0_0_15px_rgba(34,197,94,0.1)]">
                    <span className="text-[10px] font-black text-green-500 group-hover:scale-110 transition-transform">CMD</span>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl border border-blue-500/50 flex flex-col items-center justify-center hover:bg-blue-500/20 cursor-pointer group transition-all">
                    <span className="text-[10px] font-black text-blue-500 group-hover:scale-110 transition-transform">MAP</span>
                </div>

                <div className="w-px h-12 bg-gray-800 my-2"></div>

                <div className="flex flex-col gap-4 overflow-y-auto px-2 custom-scrollbar">
                    <h4 className="text-[8px] font-black text-gray-500 uppercase vertical-text tracking-widest mb-2 px-1">Missions</h4>
                    {(useGameStore.getState() as any).missions.map((m: any) => (
                        <div key={m.id}
                            className={`w-12 h-12 rounded-xl border flex items-center justify-center cursor-help transition-all group relative ${m.completed ? 'bg-green-500/20 border-green-500/40' : 'bg-gray-800/20 border-gray-700/40 hover:border-blue-500/40'}`}
                            title={m.description}>
                            <i className={`fas ${m.completed ? 'fa-check text-green-500' : 'fa-bullseye text-gray-600 group-hover:text-blue-400'}`}></i>
                            {!m.completed && <div className="absolute -top-1 -right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_5px_#3b82f6]"></div>}
                        </div>
                    ))}
                </div>

                <div className="mt-auto mb-6 opacity-30 hover:opacity-100 cursor-pointer transition-all">
                    <div className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-[10px] hover:bg-white/5">?</div>
                </div>
            </div>

            {/* Right Panel: Monitor & Alerts & Events */}
            <div className="w-80 border-l border-gray-800 bg-gray-900/40 backdrop-blur-2xl z-20 flex flex-col order-last shrink-0 shadow-2xl">
                {/* Device Monitor Section */}
                <div className="p-4 border-b border-gray-800 bg-black/20">
                    <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                        Status: {activeDevice}
                    </h3>
                    <div className="space-y-1.5">
                        {currentDevice && Object.values(currentDevice.interfaces).map((int: any) => (
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
                            {alerts.filter((a: any) => a.active).length}
                        </span>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-black/5">
                        {alerts.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-[10px] text-gray-700 italic">CLEARED</div>
                        ) : (
                            alerts.map((alert: any) => (
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
                        {(useGameStore.getState() as any).events.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-10">
                                <i className="fas fa-satellite text-2xl mb-2"></i>
                                <span className="text-[7px]">SIGNAL CLEAR</span>
                            </div>
                        ) : (
                            (useGameStore.getState() as any).events.map((event: any) => (
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
            <div className="flex-1 flex flex-col min-w-0 bg-black relative">
                {/* Header / HUD */}
                <div className="h-16 border-b border-gray-800/80 flex items-center px-8 justify-between bg-black/80 backdrop-blur z-30 shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)] group-hover:rotate-12 transition-transform">
                            <i className="fas fa-bolt text-black text-lg"></i>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-2xl font-black italic tracking-tighter leading-none text-white">NOC <span className="text-green-500">RUSH</span></span>
                            <span className="text-[9px] text-gray-500 font-black tracking-widest uppercase">Expert Simulation v0.42</span>
                        </div>
                    </div>

                    <div className="flex gap-10">
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
                        <div className="w-px h-10 bg-gray-800/50 self-center"></div>
                        <div className="flex flex-col items-end justify-center">
                            <span className="text-[8px] text-gray-500 uppercase font-black tracking-[0.2em]">Mission Credits</span>
                            <span className="text-2xl font-black text-white tabular-nums tracking-tighter shadow-sm">{score.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                {/* Viewport Split */}
                <div className="flex-1 flex flex-col relative overflow-hidden">
                    {/* Top: Topology Area */}
                    <div className="flex-1 relative">
                        <NetworkMap
                            activeDevice={activeDevice}
                            onDeviceClick={(deviceId: string) => setActiveDevice(deviceId)}
                        />
                        {/* Topology Overlay Info */}
                        <div className="absolute top-6 left-8 pointer-events-none group">
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
                    <div className="h-[45%] border-t border-gray-800/50 bg-black relative flex flex-col group z-40">
                        <div className="h-10 bg-gray-950/90 flex items-center px-6 justify-between border-b border-gray-800/80 shadow-2xl">
                            <div className="flex items-center gap-3">
                                <div className="flex gap-2">
                                    <div className="w-2 h-2 rounded-full bg-red-500/40"></div>
                                    <div className="w-2 h-2 rounded-full bg-yellow-500/40"></div>
                                    <div className="w-2 h-2 rounded-full bg-green-500/40"></div>
                                </div>
                                <div className="w-px h-4 bg-gray-800 mx-2"></div>
                                <span className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Console Session: {activeDevice}</span>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="text-[8px] text-gray-600 font-bold uppercase tracking-widest">9600-8-N-1 / TTY-01</span>
                                <span className="text-[8px] text-green-500/40 animate-pulse font-black uppercase tracking-widest">● Link Secure</span>
                            </div>
                        </div>
                        <div className="flex-1 relative overflow-hidden">
                            <TerminalComponent key={activeDevice} deviceName={activeDevice} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
