
import React from 'react';
import { useRouter } from 'next/router';

interface HeaderProps {
  onLogout?: () => void;
  showCompletedLink?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onLogout, showCompletedLink = true }) => {
  const router = useRouter();

  return (
    <header className="text-center lg:text-left">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">Patrick's Unified SEO & Agency Framework</h1>
          <p className="text-slate-400 mt-1">Your Monday Morning OS — Simplified & Focused</p>
        </div>
        <div className="flex items-center gap-4">
          {showCompletedLink && router.pathname === '/' && (
            <button
              onClick={() => router.push('/completed')}
              className="px-4 py-2 bg-green-900/40 hover:bg-green-900/60 rounded-lg transition-colors duration-200 text-white font-medium"
            >
              View Completed
            </button>
          )}
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200 text-white font-medium"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
