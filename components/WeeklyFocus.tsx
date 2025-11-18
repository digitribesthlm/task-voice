
import React from 'react';
import type { WeekTask, Client } from '../types';
import Card from './Card';
import { CalendarIcon, TrashIcon } from './Icons';

interface WeeklyFocusProps {
  tasks: WeekTask[];
  clientsMap: Map<string, Client>;
  onDelete: (taskId: string) => void;
  onMoveToToday: (task: WeekTask) => void;
}

const WeeklyFocus: React.FC<WeeklyFocusProps> = ({ tasks, clientsMap, onDelete, onMoveToToday }) => {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, task: WeekTask) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    e.dataTransfer.setData('text/plain', task.id);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <CalendarIcon className="w-6 h-6 text-slate-400" />
        <h2 className="text-xl font-bold text-white">This Week's Focus</h2>
      </div>
      <Card>
        <div className="divide-y divide-slate-700">
          {tasks.map(task => {
            const client = clientsMap.get(task.clientId);
            return (
              <div 
                key={task.id} 
                className="flex items-center justify-between py-4 cursor-move hover:bg-slate-700/30 transition-colors duration-200 rounded-lg px-2"
                draggable
                onDragStart={(e) => handleDragStart(e, task)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center gap-4">
                  <span className="w-24 text-sm font-semibold text-slate-400">{task.day}</span>
                  <div>
                    <p className="text-white font-medium">{task.title}</p>
                    {client && (
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-400">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: client.color }}></span>
                        <span>{client.name}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-slate-400 hover:text-red-400 transition-colors duration-200 p-2 rounded-lg hover:bg-slate-700/50"
                  title="Delete task"
                >
                  <TrashIcon className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
};

export default WeeklyFocus;
