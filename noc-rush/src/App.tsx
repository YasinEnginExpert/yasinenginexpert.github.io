import { useState } from 'react'
import { TerminalComponent } from './ui/Terminal'
import { NetworkMap } from './ui/NetworkMap'

function App() {
    const [activeDevice, setActiveDevice] = useState('R1');

    return (
        <div className="flex h-screen w-screen bg-gray-950 text-gray-200 font-mono overflow-hidden">
            {/* Sidebar / Tools */}
            <div className="w-16 border-r border-gray-800 flex flex-col items-center py-4 gap-4 bg-gray-950 z-10">
                <div className="w-10 h-10 bg-gray-900 rounded border border-gray-700 flex items-center justify-center hover:bg-gray-800 cursor-pointer text-xs font-bold text-green-500">
                    CMD
                </div>
                <div className="w-10 h-10 bg-gray-900 rounded border border-gray-700 flex items-center justify-center hover:bg-gray-800 cursor-pointer text-xs font-bold text-blue-500">
                    MAP
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header / HUD */}
                <div className="h-12 border-b border-gray-800 flex items-center px-4 justify-between bg-gray-900/50 backdrop-blur">
                    <span className="text-xl font-bold tracking-tight text-white">NOC <span className="text-green-500">RUSH</span></span>
                    <div className="flex gap-6 text-sm font-medium">
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase">SLA Status</span>
                            <span className="text-green-400">98.4%</span>
                        </div>
                        <div className="flex flex-col items-end">
                            <span className="text-[10px] text-gray-500 uppercase">Score</span>
                            <span className="text-white">1,240</span>
                        </div>
                    </div>
                </div>

                {/* Viewport Split */}
                <div className="flex-1 flex flex-col relative">

                    {/* Top: Topology */}
                    <div className="flex-1 relative bg-black/50">
                        <NetworkMap
                            activeDevice={activeDevice}
                            onDeviceClick={(deviceId) => setActiveDevice(deviceId)}
                        />
                    </div>

                    {/* Bottom: Terminal */}
                    <div className="h-[40%] border-t border-gray-800 bg-black relative">
                        <div className="absolute top-0 right-0 px-2 py-1 bg-gray-800 text-[10px] text-white rounded-bl opacity-50 z-10">
                            Connected: {activeDevice}
                        </div>
                        <TerminalComponent key={activeDevice} deviceName={activeDevice} />
                    </div>

                </div>
            </div>
        </div>
    )
}

export default App
