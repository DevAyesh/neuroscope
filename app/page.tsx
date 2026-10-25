'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import TopControlBar from '@/components/TopControlBar';
import ControlSidebar from '@/components/ControlSidebar';
import NetworkCanvas from '@/components/NetworkCanvas';
import NeuronInspector from '@/components/NeuronInspector';
import DiagnosticsDrawer from '@/components/DiagnosticsDrawer';
import GuidedTour from '@/components/GuidedTour';
import LearningOutcomesModal from '@/components/LearningOutcomesModal';
import { useNetworkStore } from '@/store/useNetworkStore';

function UrlSyncWrapper() {
  const searchParams = useSearchParams();
  const loadStateFromUrl = useNetworkStore((state) => state.loadStateFromUrl);

  useEffect(() => {
    if (searchParams) {
      loadStateFromUrl(searchParams);
    }
  }, [searchParams, loadStateFromUrl]);

  return null;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#111215] font-mono text-zinc-400 items-center justify-center text-xs">
        <div className="flex items-center space-x-2">
          <div className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-200 rounded-full animate-spin" />
          <span className="tracking-wider">INITIALIZING NEUROSCOPE KERNEL...</span>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen overflow-hidden flex flex-col bg-[#111215] font-mono text-zinc-200">
      <Suspense fallback={null}>
        <UrlSyncWrapper />
      </Suspense>

      {/* Guided Tour Spotlight Overlay */}
      <GuidedTour />

      {/* Learning Guide & Outcomes Modal */}
      <LearningOutcomesModal />

      {/* 1. Top IDE Control Bar */}
      <TopControlBar />

      {/* 2. Main Middle Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Control Sidebar */}
        <ControlSidebar />

        {/* Center Main Viewport: HTML5 Canvas */}
        <section className="flex-1 relative overflow-hidden flex flex-col">
          <NetworkCanvas />

          {/* Floating Neuron Inspector Modal / Overlay */}
          <NeuronInspector />
        </section>
      </div>

      {/* 3. Bottom Diagnostics & Telemetry Drawer */}
      <DiagnosticsDrawer />
    </main>
  );
}
