import { useGameStore } from '../engine/session';

interface NetworkMapProps {
    activeDevice?: string;
    onDeviceClick?: (deviceId: string) => void;
}

// Realistic Cisco-style Router SVG
const RouterIcon = ({ isActive }: { isActive: boolean }) => (
    <svg viewBox="0 0 100 60" className="w-24 h-14">
        {/* Router body - realistic 3D look */}
        <defs>
            <linearGradient id="routerBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isActive ? "#166534" : "#374151"} />
                <stop offset="50%" stopColor={isActive ? "#15803d" : "#1f2937"} />
                <stop offset="100%" stopColor={isActive ? "#14532d" : "#111827"} />
            </linearGradient>
            <linearGradient id="routerTop" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isActive ? "#22c55e" : "#4b5563"} />
                <stop offset="100%" stopColor={isActive ? "#16a34a" : "#374151"} />
            </linearGradient>
        </defs>

        {/* Main chassis */}
        <rect x="5" y="15" width="90" height="40" rx="3" fill="url(#routerBody)" stroke={isActive ? "#22c55e" : "#6b7280"} strokeWidth="1.5" />

        {/* Top panel (3D effect) */}
        <polygon points="5,15 15,5 85,5 95,15" fill="url(#routerTop)" stroke={isActive ? "#22c55e" : "#6b7280"} strokeWidth="1" />

        {/* Right side (3D effect) */}
        <polygon points="95,15 95,55 85,45 85,5" fill={isActive ? "#14532d" : "#111827"} stroke={isActive ? "#22c55e" : "#6b7280"} strokeWidth="1" />

        {/* Ventilation slots */}
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <rect key={i} x={12 + i * 10} y="25" width="6" height="2" fill={isActive ? "#052e16" : "#030712"} rx="0.5" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <rect key={`b${i}`} x={12 + i * 10} y="30" width="6" height="2" fill={isActive ? "#052e16" : "#030712"} rx="0.5" />
        ))}

        {/* LED indicators */}
        <circle cx="15" cy="45" r="2.5" fill={isActive ? "#4ade80" : "#6b7280"}>
            {isActive && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />}
        </circle>
        <circle cx="25" cy="45" r="2.5" fill="#fbbf24">
            <animate attributeName="opacity" values="1;0.3;1" dur="0.5s" repeatCount="indefinite" />
        </circle>
        <circle cx="35" cy="45" r="2.5" fill="#22c55e" />

        {/* Ethernet ports */}
        {[0, 1, 2, 3].map(i => (
            <rect key={`port${i}`} x={55 + i * 10} y="42" width="7" height="10" fill="#1e293b" stroke="#475569" strokeWidth="0.5" rx="1" />
        ))}

        {/* Console port */}
        <rect x="45" y="44" width="6" height="6" fill="#3b82f6" stroke="#60a5fa" strokeWidth="0.5" rx="1" />

        {/* Cisco logo area */}
        <text x="50" y="22" textAnchor="middle" fontSize="6" fill={isActive ? "#86efac" : "#9ca3af"} fontFamily="Arial" fontWeight="bold">CISCO</text>
    </svg>
);

// Realistic Cisco-style Switch SVG
const SwitchIcon = ({ isActive }: { isActive: boolean }) => (
    <svg viewBox="0 0 120 50" className="w-28 h-12">
        <defs>
            <linearGradient id="switchBody" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={isActive ? "#1e40af" : "#374151"} />
                <stop offset="50%" stopColor={isActive ? "#1e3a8a" : "#1f2937"} />
                <stop offset="100%" stopColor={isActive ? "#172554" : "#111827"} />
            </linearGradient>
        </defs>

        {/* Main chassis - wide and low like real switch */}
        <rect x="2" y="8" width="116" height="35" rx="2" fill="url(#switchBody)" stroke={isActive ? "#3b82f6" : "#6b7280"} strokeWidth="1.5" />

        {/* Top edge highlight */}
        <rect x="2" y="8" width="116" height="4" rx="2" fill={isActive ? "#2563eb" : "#4b5563"} />

        {/* 24 Port indicators (2 rows of 12) */}
        {[...Array(12)].map((_, i) => (
            <g key={`port1-${i}`}>
                <rect x={8 + i * 9} y="16" width="6" height="5" fill="#0f172a" stroke="#334155" strokeWidth="0.3" rx="0.5" />
                <circle cx={11 + i * 9} y="15" r="1" fill={Math.random() > 0.3 ? "#22c55e" : "#6b7280"}>
                    {Math.random() > 0.5 && <animate attributeName="opacity" values="1;0.3;1" dur={`${0.2 + Math.random() * 0.3}s`} repeatCount="indefinite" />}
                </circle>
            </g>
        ))}
        {[...Array(12)].map((_, i) => (
            <g key={`port2-${i}`}>
                <rect x={8 + i * 9} y="24" width="6" height="5" fill="#0f172a" stroke="#334155" strokeWidth="0.3" rx="0.5" />
                <circle cx={11 + i * 9} y="23" r="1" fill={Math.random() > 0.3 ? "#22c55e" : "#6b7280"}>
                    {Math.random() > 0.5 && <animate attributeName="opacity" values="1;0.3;1" dur={`${0.2 + Math.random() * 0.3}s`} repeatCount="indefinite" />}
                </circle>
            </g>
        ))}

        {/* SFP Uplink ports */}
        <rect x="100" y="16" width="12" height="12" fill="#1e293b" stroke="#475569" strokeWidth="0.5" rx="1" />
        <text x="106" y="24" textAnchor="middle" fontSize="4" fill="#94a3b8">SFP+</text>

        {/* Status LEDs */}
        <circle cx="8" cy="38" r="2" fill={isActive ? "#22c55e" : "#6b7280"}>
            {isActive && <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite" />}
        </circle>
        <circle cx="16" cy="38" r="2" fill="#f59e0b" />

        {/* Model label */}
        <text x="60" y="40" textAnchor="middle" fontSize="5" fill={isActive ? "#93c5fd" : "#9ca3af"} fontFamily="Arial">Catalyst 3560-24PS</text>
    </svg>
);

// Ethernet Cable Component
const EthernetCable = ({ x1, y1, x2, y2, isActive }: { x1: number; y1: number; x2: number; y2: number; isActive: boolean }) => {
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    const angle = Math.atan2(y2 - y1, x2 - x1);

    // Calculate connector positions (slightly inside the endpoints)
    const connectorOffset = 15;
    const cx1 = x1 + Math.cos(angle) * connectorOffset;
    const cy1 = y1 + Math.sin(angle) * connectorOffset;
    const cx2 = x2 - Math.cos(angle) * connectorOffset;
    const cy2 = y2 - Math.sin(angle) * connectorOffset;

    return (
        <g>
            {/* Cable shadow */}
            <line
                x1={cx1} y1={cy1 + 2}
                x2={cx2} y2={cy2 + 2}
                stroke="rgba(0,0,0,0.3)"
                strokeWidth="6"
                strokeLinecap="round"
            />

            {/* Main cable - looks like ethernet cable */}
            <line
                x1={cx1} y1={cy1}
                x2={cx2} y2={cy2}
                stroke={isActive ? "#2563eb" : "#374151"}
                strokeWidth="5"
                strokeLinecap="round"
            />

            {/* Cable inner wire highlight */}
            <line
                x1={cx1} y1={cy1}
                x2={cx2} y2={cy2}
                stroke={isActive ? "#60a5fa" : "#4b5563"}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="0"
            />

            {/* RJ45 Connector at source */}
            <g transform={`translate(${cx1}, ${cy1}) rotate(${angle * 180 / Math.PI})`}>
                <rect x="-8" y="-4" width="10" height="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.5" rx="1" />
                <rect x="-6" y="-2" width="4" height="4" fill="#f3f4f6" />
                {/* Clip */}
                <rect x="0" y="-2" width="2" height="4" fill="#d1d5db" />
            </g>

            {/* RJ45 Connector at destination */}
            <g transform={`translate(${cx2}, ${cy2}) rotate(${(angle * 180 / Math.PI) + 180})`}>
                <rect x="-8" y="-4" width="10" height="8" fill="#e5e7eb" stroke="#9ca3af" strokeWidth="0.5" rx="1" />
                <rect x="-6" y="-2" width="4" height="4" fill="#f3f4f6" />
                <rect x="0" y="-2" width="2" height="4" fill="#d1d5db" />
            </g>

            {/* Data flow animation */}
            {isActive && (
                <circle r="3" fill="#22c55e">
                    <animateMotion
                        dur="2s"
                        repeatCount="indefinite"
                        path={`M${cx1},${cy1} L${cx2},${cy2}`}
                    />
                </circle>
            )}
        </g>
    );
};

export const NetworkMap = ({ activeDevice, onDeviceClick }: NetworkMapProps) => {
    const { topology } = useGameStore();

    // Enhanced mock data with more realistic positioning
    const devices = Object.keys(topology.devices).length ? topology.devices : {
        'R1': { id: 'R1', type: 'router', x: 120, y: 100, interfaces: {}, config: '' },
        'SW1': { id: 'SW1', type: 'switch', x: 350, y: 100, interfaces: {}, config: '' },
        'R2': { id: 'R2', type: 'router', x: 240, y: 280, interfaces: {}, config: '' },
    };

    const links = topology.links.length ? topology.links : [
        { source: 'R1', target: 'SW1', id: 'l1' },
        { source: 'SW1', target: 'R2', id: 'l2' },
        { source: 'R1', target: 'R2', id: 'l3' }
    ];

    return (
        <div className="w-full h-full relative bg-gradient-to-br from-slate-900 via-gray-900 to-zinc-900 overflow-hidden">
            {/* Rack/datacenter floor pattern */}
            <div
                className="absolute inset-0 opacity-5"
                style={{
                    backgroundImage: `
                        linear-gradient(90deg, #ffffff 1px, transparent 1px),
                        linear-gradient(#ffffff 1px, transparent 1px)
                    `,
                    backgroundSize: '50px 50px'
                }}
            />

            {/* Subtle glow effect in center */}
            <div className="absolute inset-0 bg-gradient-radial from-green-900/10 via-transparent to-transparent"
                style={{ background: 'radial-gradient(circle at 50% 50%, rgba(34, 197, 94, 0.05) 0%, transparent 50%)' }} />

            {/* SVG for cables */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {links.map((link: any, i: number) => {
                    const src = (devices as any)[link.source];
                    const dst = (devices as any)[link.target];
                    if (!src || !dst) return null;
                    const isLinkActive = activeDevice === src.id || activeDevice === dst.id;
                    return (
                        <EthernetCable
                            key={i}
                            x1={src.x}
                            y1={src.y}
                            x2={dst.x}
                            y2={dst.y}
                            isActive={isLinkActive}
                        />
                    );
                })}
            </svg>

            {/* Device nodes */}
            {Object.values(devices).map((dev: any) => {
                const isActive = activeDevice === dev.id;
                const isRouter = dev.type === 'router';

                return (
                    <div
                        key={dev.id}
                        onClick={() => onDeviceClick?.(dev.id)}
                        className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${isActive ? 'scale-110 z-20' : 'hover:scale-105 z-10'
                            }`}
                        style={{ left: dev.x, top: dev.y }}
                    >
                        {/* Device glow effect when active */}
                        {isActive && (
                            <div className="absolute inset-0 -m-4 bg-green-500/20 blur-xl rounded-full animate-pulse" />
                        )}

                        {/* Device icon */}
                        <div className={`relative ${isActive ? 'drop-shadow-[0_0_15px_rgba(34,197,94,0.5)]' : ''}`}>
                            {isRouter ? <RouterIcon isActive={isActive} /> : <SwitchIcon isActive={isActive} />}
                        </div>

                        {/* Device label */}
                        <div className={`text-center mt-1 px-2 py-0.5 rounded ${isActive ? 'bg-green-900/50 text-green-400' : 'bg-gray-800/50 text-gray-400'
                            }`}>
                            <span className="text-xs font-bold">{dev.id}</span>
                        </div>

                        {/* Connection indicator */}
                        {isActive && (
                            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-[10px] text-green-400 whitespace-nowrap">
                                ● Connected
                            </div>
                        )}
                    </div>
                );
            })}

            {/* Legend */}
            <div className="absolute bottom-4 left-4 bg-gray-900/80 backdrop-blur-sm rounded-lg p-3 border border-gray-700">
                <div className="text-[10px] text-gray-400 mb-2 font-semibold uppercase tracking-wider">Network Topology</div>
                <div className="flex gap-4 text-[10px]">
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-3 rounded bg-green-500" />
                        <span className="text-gray-300">Active</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-3 h-1 bg-blue-500 rounded" />
                        <span className="text-gray-300">Link Up</span>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="absolute bottom-4 right-4 text-[10px] text-gray-500 bg-gray-900/50 px-2 py-1 rounded">
                Click a device to connect
            </div>
        </div>
    );
};
