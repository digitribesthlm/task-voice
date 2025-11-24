
import React from 'react';
import type { Task, Client, Phase } from '../types';
import Card from './Card';
import { TrophyIcon, TrashIcon } from './Icons';

interface CompletedTasksProps {
  tasks: Task[];
  clientsMap: Map<string, Client>;
  phasesMap: Map<string, Phase>;
  onUncomplete: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

const CompletedTasks: React.FC<CompletedTasksProps> = ({
  tasks,
  clientsMap,
  phasesMap,
  onUncomplete,
  onDelete
}) => {
  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <TrophyIcon className="w-6 h-6 text-green-400" />
        <h2 className="text-xl font-bold text-white">Completed Tasks</h2>
      </div>
      <Card>
        <div>
          <h3 className="font-semibold text-white mb-4">Your Completed Achievements</h3>
          {tasks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-400">No completed tasks yet. Keep working!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const client = clientsMap.get(task.clientId);
                const phase = phasesMap.get(task.phaseId);
                return (
                  <div
                    key={task.id}
                    className="p-4 rounded-lg flex items-start gap-4 bg-green-900/40 transition-colors duration-200 hover:bg-green-900/50"
                  >
                    <button
                      onClick={() => onUncomplete(task.id)}
                      className="mt-1 px-3 py-1 text-xs font-medium text-white bg-slate-700 hover:bg-slate-600 rounded transition-colors duration-200"
                      title="Mark as incomplete"
                    >
                      Restore
                    </button>
                    <div className="flex-1">
                      <p className="text-white line-through text-slate-300">{task.title}</p>
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
                    <button
                      onClick={() => onDelete(task.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors duration-200 p-2 rounded-lg hover:bg-slate-700/50"
                      title="Permanently delete task"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </section>
  );
};

export default CompletedTasks;
