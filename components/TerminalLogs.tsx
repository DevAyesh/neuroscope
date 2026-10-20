'use client';

import React, { useRef, useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';
import { Terminal, Trash2, Cpu, BarChart2 } from 'lucide-react';

export default function TerminalLogs() {
  const { terminalLogs, outputProbabilities } = useNetworkStore();
  const logEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  return (
    <div className="bg-[#18191c] border border-[#2a2b30] rounded-[2px] p-2.5 font-mono text-xs flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#2a2b30]">
        <div className="flex items-center space-x-1.5">
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[10px] text-zinc-400 uppercase font-semibold">
            KERNEL OUTPUT LOG & PROBABILITIES
          </span>
        </div>
        <span className="text-[9px] text-zinc-500">STDOUT / TELEMETRY</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 flex-1 overflow-hidden">
        {/* Left: Live Output Class Probabilities with Gauges */}
        <div className="flex flex-col justify-between overflow-y-auto space-y-1.5 pr-1">
          <div className="text-[10px] text-zinc-400 flex items-center justify-between pb-1 border-b border-[#2a2b30]/50">
            <span className="flex items-center space-x-1">
              <BarChart2 className="w-3 h-3 text-zinc-400" />
              <span>OUTPUT PROBABILITIES (ŷ)</span>
            </span>
            <span className="text-zinc-500">Softmax / Sigmoid</span>
          </div>

          <div className="space-y-1 max-h-32 overflow-y-auto">
            {outputProbabilities.map((prob, idx) => {
              const pct = Math.round(prob.value * 100);
              const isWinner =
                outputProbabilities.length > 1 &&
                prob.value === Math.max(...outputProbabilities.map((p) => p.value));

              return (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className={isWinner ? 'text-zinc-100 font-bold' : 'text-zinc-400'}>
                      {prob.label}
                    </span>
                    <span className={isWinner ? 'text-zinc-100 font-bold' : 'text-zinc-400'}>
                      {pct}%
                    </span>
                  </div>
                  {/* Gauge Bar */}
                  <div className="w-full bg-[#111215] h-1.5 rounded-[2px] overflow-hidden">
                    <div
                      className={`h-full transition-all duration-150 rounded-[2px] ${
                        isWinner
                          ? 'bg-blue-500'
                          : 'bg-[#2a2b30]'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(3, pct))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Retro Terminal Logs */}
        <div className="flex flex-col overflow-hidden bg-[#111215] border border-[#2a2b30] rounded-[2px] p-2 text-[10px]">
          <div className="flex-1 overflow-y-auto space-y-1 font-mono pr-1">
            {terminalLogs.map((entry) => {
              let badgeColor = 'text-blue-400';
              let badgeText = '[INFO]';

              if (entry.level === 'warn') {
                badgeColor = 'text-amber-400';
                badgeText = '[WARN]';
              } else if (entry.level === 'grad') {
                badgeColor = 'text-purple-400';
                badgeText = '[GRAD]';
              } else if (entry.level === 'necro') {
                badgeColor = 'text-red-400 font-bold';
                badgeText = '[NECRO]';
              } else if (entry.level === 'success') {
                badgeColor = 'text-emerald-400 font-bold';
                badgeText = '[OK]';
              }

              return (
                <div key={entry.id} className="leading-tight flex items-start space-x-1.5">
                  <span className="text-zinc-600 shrink-0">{entry.timestamp}</span>
                  <span className={`${badgeColor} shrink-0`}>{badgeText}</span>
                  <span className="text-zinc-300 break-words">{entry.message}</span>
                </div>
              );
            })}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
}
