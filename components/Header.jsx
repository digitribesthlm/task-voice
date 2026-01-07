import React from 'react';

const Header = ({ onLogout, onNavigateTools }) => {
  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="text-center lg:text-left">
        <h1 className="text-3xl sm:text-4xl font-bold text-white">Patrick&apos;s Unified SEO & Agency Framework</h1>
        <p className="text-slate-400 mt-1">Your Monday Morning OS — Simplified & Focused</p>
      </div>
      {(onLogout || onNavigateTools) && (
        <div className="flex justify-center lg:justify-end gap-3">
          {onNavigateTools && (
            <button
              type="button"
              onClick={onNavigateTools}
              className="inline-flex items-center justify-center rounded-full border border-slate-600 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors duration-200"
            >
              Tool Stack
            </button>
          )}
          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-full bg-slate-800 px-5 py-2 text-sm font-semibold text-white hover:bg-slate-700 border border-slate-600 transition-colors duration-200"
            >
              Log out
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
