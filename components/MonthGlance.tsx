
import React from 'react';
import type { Milestone, Client } from '../types';
import Card from './Card';
import { TelescopeIcon } from './Icons';

interface MonthGlanceProps {
  milestones: Milestone[];
  clientsMap: Map<string, Client>;
}

const MonthGlance: React.FC<MonthGlanceProps> = ({ milestones, clientsMap }) => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <TelescopeIcon className="w-6 h-6 text-slate-400" />
        <h2 className="text-xl font-bold text-white">Month at a Glance</h2>
      </div>
      <Card>
        <div className="space-y-4">
          {milestones.map(milestone => {
            const client = clientsMap.get(milestone.clientId);
            return (
              <div key={milestone.id} className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-white">{milestone.title}</p>
                  {client && (
                    <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }}></span>
                      <span>{client.name}</span>
                    </div>
                  )}
                </div>
                <span className="text-sm text-slate-400 whitespace-nowrap">{milestone.date}</span>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
};

export default MonthGlance;
