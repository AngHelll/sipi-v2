// Main layout — sidebar fijo desktop + drawer móvil (W4a / Stitch Academic Prestige)
import { useState, type ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { BottomNav } from './BottomNav';
import { ds } from '../../lib/designSystem';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="bg-surface text-on-surface min-h-screen">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className={ds.layout.mainOffset}>
        <Topbar onMenuClick={() => setSidebarOpen(true)} />

        <main className={`${ds.layout.contentShell} ${ds.layout.contentPaddingBottom} pt-stack-md animate-fade-in`}>
          {children}
        </main>

        <BottomNav onMenuClick={() => setSidebarOpen(true)} />
      </div>

      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}
    </div>
  );
};
