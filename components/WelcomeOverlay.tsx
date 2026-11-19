'use client';

import React, { useState, useEffect } from 'react';
import { useNetworkStore } from '@/store/useNetworkStore';

export function WelcomeOverlay() {
  const [show, setShow] = useState(false);
  const setTourActive = useNetworkStore((s) => s.setTourActive);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        if (!localStorage.getItem('neuroscope_visited')) {
          const t = setTimeout(() => setShow(true), 500);
          return () => clearTimeout(t);
        }
      } catch (_) {}
    }
  }, []);

  const dismiss = (startTour = false) => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('neuroscope_visited', 'true');
      } catch (_) {}
    }
    setShow(false);
    if (startTour) {
      setTourActive(true);
    }
  };

  return (
    <>
      {show && (
        <div className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-cyan-500/40 rounded-lg p-6 sm:p-8 max-w-md w-full shadow-2xl font-mono text-zinc-200">
            <h2 className="text-cyan-400 font-mono text-xl font-bold mb-2 flex items-center space-x-2">
              <span>👋</span>
              <span>Welcome to NeuroScope</span>
            </h2>
            <p className="text-slate-400 font-mono text-xs mb-5 leading-relaxed">
              A real-time neural network visual debugger for deep learning learners.
            </p>
            <ul className="space-y-2.5 mb-6">
              {[
                '🧠 Watch neurons activate and gradients flow — live.',
                '⚡ Run presets for XOR, Spiral, Regression, and more.',
                '🎓 Follow the Guided Tour to learn step by step.',
              ].map((item) => (
                <li key={item} className="text-slate-300 font-mono text-xs flex items-center space-x-2">
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button
                onClick={() => dismiss(true)}
                className="flex-1 py-2 px-3 bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-semibold rounded shadow transition-colors"
              >
                START GUIDED TOUR
              </button>
              <button
                onClick={() => dismiss(false)}
                className="flex-1 py-2 px-3 border border-slate-600 hover:border-slate-400 text-slate-300 hover:text-white font-mono text-xs rounded transition-colors"
              >
                EXPLORE ON MY OWN
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Always-visible ? help button */}
      <button
        onClick={() => setShow(true)}
        className="fixed bottom-4 right-4 z-[199] w-9 h-9 rounded-full bg-cyan-700 hover:bg-cyan-600 text-white font-mono text-sm font-bold shadow-lg flex items-center justify-center border border-cyan-400/40 transition-transform hover:scale-105"
        title="Open Welcome Guide"
        aria-label="Open Welcome Guide"
      >
        ?
      </button>
    </>
  );
}

export default WelcomeOverlay;
