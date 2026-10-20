import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NeuroScope | C++ / Linux Neural Network Debugger & Visualizer',
  description:
    'Interactive 60 FPS real-time neural network sandbox and educational math visualizer with genuine forward/backpropagation, live oscilloscopes, and C++ ImGui aesthetics.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#111215] text-[#e4e4e7] antialiased h-screen w-screen overflow-hidden">
        {children}
      </body>
    </html>
  );
}
