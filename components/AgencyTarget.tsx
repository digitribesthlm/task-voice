
import React from 'react';
import type { WeeklyTarget } from '../types';
import Card from './Card';
import { TargetIcon } from './Icons';

interface AgencyTargetProps {
  target: WeeklyTarget;
}

const AgencyTarget: React.FC<AgencyTargetProps> = ({ target }) => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <TargetIcon className="w-6 h-6 text-red-500" />
        <h2 className="text-xl font-bold text-white">This Week's Agency Target</h2>
      </div>
      <Card>
        <h3 className="font-semibold text-white">{target.title}</h3>
        <p className="text-sm text-slate-400 mt-2 mb-4">{target.description}</p>
        <div>
          <div className="flex justify-between items-center text-sm text-slate-400 mb-1">
            <span>Progress</span>
            <span>{target.progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${target.progress}%` }}></div>
          </div>
        </div>
      </Card>
    </section>
  );
};

export default AgencyTarget;
