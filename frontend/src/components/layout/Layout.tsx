// Main layout component with TopAppBar, BottomNavBar and Drawer (Sidebar)
import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-surface text-on-surface min-h-screen transition-colors duration-300">
      {/* Top Navigation AppBar (Desktop & Mobile header) */}
      <Topbar onMenuClick={() => setSidebarOpen(true)} />

      {/* Main content area */}
      <main className="pt-24 pb-32 px-6 md:px-20 max-w-7xl mx-auto">
        {children}
      </main>

      {/* Bottom Navigation Bar (Mobile only) */}
      <BottomNav onMenuClick={() => setSidebarOpen(true)} />

      {/* Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Off-canvas Sidebar / Drawer Menu for remaining items */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
    </div>
  );
};
