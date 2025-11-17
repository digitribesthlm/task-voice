
import React from 'react';
import Card from './Card';
import { SettingsIcon } from './Icons';

interface SystemStatusProps {
  seoPhasesCount: number;
  activeAutomationsCount: number;
  totalAutomations: number;
}

const SystemStatus: React.FC<SystemStatusProps> = ({ seoPhasesCount, activeAutomationsCount, totalAutomations }) => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <SettingsIcon className="w-6 h-6 text-slate-400" />
        <h2 className="text-xl font-bold text-white">System Status</h2>
      </div>
      <Card>
        <p className="text-sm text-slate-400 mb-4">Layers 2 & 3 are running in the background.</p>
        <div className="flex justify-around text-center">
          <div>
            <p className="text-4xl font-bold text-white">{seoPhasesCount}</p>
            <p className="text-sm text-slate-400">SEO Phases</p>
          </div>
          <div className="border-l border-slate-700"></div>
          <div>
            <p className="text-4xl font-bold text-white">
              {activeAutomationsCount}/{totalAutomations}
            </p>
            <p className="text-sm text-slate-400">Automations</p>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default SystemStatus;
