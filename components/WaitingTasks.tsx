
import React from 'react';
import type { Task, Client, Phase } from '../types';
import Card from './Card';
import { ClockIcon, PlayIcon } from './Icons';

interface WaitingTasksProps {
  tasks: Task[];
  clientsMap: Map<string, Client>;
  phasesMap: Map<string, Phase>;
  onResume: (taskId: string) => void;
}

const WaitingTasks: React.FC<WaitingTasksProps> = ({ tasks, clientsMap, phasesMap, onResume }) => {
  const calculateDaysWaiting = (waitingSince?: string): string => {
    if (!waitingSince) {
      return '';
    }

    const days = Math.floor((Date.now() - new Date(waitingSince).getTime()) / (1000 * 60 * 60 * 24));

    if (days < 1) {
      return '< 1 day';
    }

    return `${days} day${days === 1 ? '' : 's'}`;
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <ClockIcon className="w-6 h-6 text-slate-400" />
        <h2 className="text-xl font-bold text-white">Waiting Tasks</h2>
      </div>
      <Card>
        <div className="space-y-4">
          {tasks.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-4">No tasks waiting</p>
          ) : (
            tasks.map(task => {
              const client = clientsMap.get(task.clientId);
              const phase = phasesMap.get(task.phaseId);
              const daysWaiting = calculateDaysWaiting(task.waitingSince);

              return (
                <div key={task.id} className="flex justify-between items-start gap-4 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors duration-200">
                  <div className="flex-1">
                    <p className="font-medium text-white">{task.title}</p>
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
                    {(task.waitingFor || daysWaiting) && (
                      <div className="mt-2 text-sm text-slate-500">
                        {task.waitingFor && <span>Waiting for: {task.waitingFor}</span>}
                        {task.waitingFor && daysWaiting && <span> • </span>}
                        {daysWaiting && <span>{daysWaiting}</span>}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => onResume(task.id)}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 rounded-lg transition-colors duration-200"
                    title="Resume task"
                  >
                    <PlayIcon className="w-4 h-4" />
                    <span>Resume</span>
                  </button>
                </div>
              );
            })
          )}
        </div>
      </Card>
    </section>
  );
};

export default WaitingTasks;
