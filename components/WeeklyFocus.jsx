import React from 'react';
import Card from './Card';
import { CalendarIcon } from './Icons';

const WeeklyFocus = ({ tasks, clientsMap }) => {
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
              <div key={task._id} className="flex items-center justify-between py-4">
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
              </div>
            );
          })}
        </div>
      </Card>
    </section>
  );
};

export default WeeklyFocus;
