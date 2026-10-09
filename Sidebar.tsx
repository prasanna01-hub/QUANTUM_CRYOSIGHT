/**
 * CRYOSIGHT - Collapsible Icon-Only Left Sidebar Navigation
 * Professional quantum cryogenic tech platform identity (Light Theme)
 * Simple icon-only vertical dock with custom hover tooltips
 */

import React from 'react';
import {
  LayoutDashboard,
  Layers,
  BarChart3,
  BrainCircuit,
  Atom,
  AlertTriangle,
  RefreshCw,
  Network,
} from 'lucide-react';

export type NavTab = 'overview' | 'digital-twin' | 'analytics' | 'diagnostics' | 'quantum-lab' | 'connectivity';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  hasFault: boolean;
  onToggleFault: () => void;
  qubitCount: number;
  mxcTempDisplay: string;
  navigationOpen: boolean;
  onToggleNavigation: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  hasFault,
  onToggleFault,
  qubitCount,
  mxcTempDisplay,
  navigationOpen,
  onToggleNavigation,
}) => {
  const navItems: { id: NavTab; label: string; icon: React.ElementType; kicker: string }[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard, kicker: 'Command Center' },
    { id: 'digital-twin', label: 'Digital Twin', icon: Layers, kicker: '3D Dilution Refrigerator' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, kicker: 'Telemetry Performance' },
    { id: 'diagnostics', label: 'AI Diagnostics', icon: BrainCircuit, kicker: 'Simulated Anomaly Engine' },
    { id: 'quantum-lab', label: 'Quantum Lab', icon: Atom, kicker: '3D Hybrid System Lab' },
    { id: 'connectivity', label: 'Connectivity Architecture', icon: Network, kicker: 'Signal Flow & I/O Mapping' },
  ];

  return (
    <aside className="w-20 shrink-0 bg-white border-r border-slate-200 h-screen sticky top-0 flex flex-col justify-between z-40 select-none shadow-[2px_0_12px_rgba(15,23,42,0.03)] transition-all duration-300 ease-in-out">
      {/* Top Header & Brand Identity */}
      <div>
        <div className="p-4 border-b border-slate-100 flex flex-col items-center gap-2.5">
          
          {/* Custom Quantum Cryogenic Technology Logo Mark */}
          <div
            onClick={() => onTabChange('overview')}
            className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-600 to-cyan-700 flex items-center justify-center text-white shadow-md shadow-sky-600/20 ring-4 ring-sky-50 cursor-pointer hover:scale-105 transition-transform shrink-0"
            title="CRYOSIGHT — Return to Overview"
          >
            <svg viewBox="0 0 24 24" fill="none" className="w-6 h-6 stroke-current stroke-2">
              <path d="M12 2L20 6.5V17.5L12 22L4 17.5V6.5L12 2Z" />
              <circle cx="12" cy="12" r="3" fill="currentColor" fillOpacity="0.3" />
              <line x1="12" y1="2" x2="12" y2="9" />
              <line x1="12" y1="15" x2="12" y2="22" />
              <line x1="4" y1="6.5" x2="9.5" y2="10.5" />
              <line x1="14.5" y1="13.5" x2="20" y2="17.5" />
              <line x1="4" y1="17.5" x2="9.5" y2="13.5" />
              <line x1="14.5" y1="10.5" x2="20" y2="6.5" />
            </svg>
          </div>

          {/* Clean, Bold Brand Title under the logo mark */}
          <div className="text-[10px] font-mono-tech font-extrabold tracking-widest text-slate-900 uppercase text-center leading-none">
            CRYOSIGHT
          </div>

          {/* Navigation Toggle Symbol */}
          <button
            onClick={onToggleNavigation}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-950 transition-colors cursor-pointer shrink-0 border border-slate-200"
            title={navigationOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
          >
            {navigationOpen ? (
              <svg className="w-5 h-5 stroke-current stroke-2" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5 stroke-current stroke-2 animate-pulse text-sky-600" fill="none" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Navigation Items List (Vertically aligned icons, visible when expanded) */}
        <nav className={`transition-all duration-300 overflow-hidden flex flex-col items-center gap-4.5 mt-6 ${
          navigationOpen ? 'opacity-100 max-h-[500px] p-2' : 'opacity-0 max-h-0 pointer-events-none p-0'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
                  isActive
                    ? 'bg-sky-50 text-sky-800 border-l-4 border-sky-600 font-semibold shadow-xs ring-1 ring-sky-100'
                    : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50/80 border-l-4 border-transparent'
                }`}
                title={item.label}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                    isActive ? 'text-sky-600' : 'text-slate-400'
                  }`}
                />
                
                {/* Custom CSS Hover Tooltip */}
                <div className="absolute left-16 bg-slate-900 text-white text-[11px] font-mono-tech font-bold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50">
                  {item.label}
                  <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Live Hardware Quick Telemetry & Fault Simulator Icon */}
      <div className="flex flex-col items-center mb-6 gap-3 shrink-0">
        <button
          onClick={onToggleFault}
          className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all cursor-pointer group relative ${
            hasFault
              ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20'
              : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
          }`}
        >
          {hasFault ? (
            <RefreshCw className="w-5 h-5 animate-spin" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-600 group-hover:scale-110 transition-transform" />
          )}
          
          {/* Custom Hover Tooltip */}
          <div className="absolute left-16 bg-slate-900 text-white text-[11px] font-mono-tech font-bold px-2.5 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-50">
            {hasFault ? 'Resolve Injected Fault' : 'Simulate Fault Anomaly'}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 rotate-45" />
          </div>
        </button>
      </div>
    </aside>
  );
};
