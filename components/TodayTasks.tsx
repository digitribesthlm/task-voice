
import React from 'react';
import type { Task, Client, Phase } from '../types';
import Card from './Card';
import { TrophyIcon } from './Icons';

interface TodayTasksProps {
  tasks: Task[];
  clientsMap: Map<string, Client>;
  phasesMap: Map<string, Phase>;
  onToggle: (taskId: string) => void;
}

const TodayTasks: React.FC<TodayTasksProps> = ({ tasks, clientsMap, phasesMap, onToggle }) => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <TrophyIcon className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Your Daily Execution Layer</h2>
      </div>
      <Card>
        <h3 className="font-semibold text-white mb-4">Today's 3 Critical Tasks</h3>
        <div className="space-y-3">
          {tasks.map(task => {
            const client = clientsMap.get(task.clientId);
            const phase = phasesMap.get(task.phaseId);
            return (
              <div key={task.id} className={`p-4 rounded-lg flex items-start gap-4 transition-colors duration-200 ${task.completed ? 'bg-green-900/40' : 'bg-slate-800'}`}>
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggle(task.id)}
                  className="mt-1 form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 cursor-pointer"
                />
                <div className="flex-1">
                  <p className={`text-white ${task.completed ? 'line-through text-slate-400' : ''}`}>{task.title}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
                    {client && (
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }}></span>
                        <span>{client.name}</span>
                      </div>
                    )}
                    {phase && (
                       <span className="px-2 py-0.5 rounded-full text-xs" style={{ backgroundColor: phase.color, color: '#FFFFFF' }}>{phase.name}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
};

export default TodayTasks;
