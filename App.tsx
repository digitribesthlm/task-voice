
import React, { useState, useMemo } from 'react';
import type { Task } from './types';
import { CLIENTS, PHASES, TODAY_TASKS, WEEK_TASKS, MONTH_MILESTONES, WEEKLY_TARGET, AUTOMATIONS } from './data';
import Header from './components/Header';
import TodayTasks from './components/TodayTasks';
import WeeklyFocus from './components/WeeklyFocus';
import AgencyTarget from './components/AgencyTarget';
import MonthGlance from './components/MonthGlance';
import SystemStatus from './components/SystemStatus';
import VoiceAssistant from './components/VoiceAssistant';

const App: React.FC = () => {
  const [todayTasks, setTodayTasks] = useState<Task[]>(TODAY_TASKS);

  const clientsMap = useMemo(() => new Map(CLIENTS.map(c => [c.id, c])), []);
  const phasesMap = useMemo(() => new Map(PHASES.map(p => [p.id, p])), []);
  const activeAutomations = useMemo(() => AUTOMATIONS.filter(a => a.status === 'active').length, []);

  const toggleTaskCompletion = (taskId: string) => {
    setTodayTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  const addTask = (title: string, clientName: string) => {
    const client = CLIENTS.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    if (!client) {
        // In a real app, you might want to return an error or a message.
        console.error(`Client "${clientName}" not found.`);
        return `I couldn't find a client named ${clientName}. Please try again with a valid client name.`;
    }

    const newTask: Task = {
        id: `t${Date.now()}`,
        title,
        clientId: client.id,
        phaseId: 'p3', // Default to 'Building & Content'
        completed: false,
    };
    setTodayTasks(prev => [...prev, newTask]);
    return `Okay, I've added the task "${title}" for ${clientName}.`;
  };

  const updateTaskStatus = (taskTitleQuery: string, completed: boolean) => {
     let updated = false;
     let taskTitle = '';
     setTodayTasks(prevTasks => {
       const newTasks = prevTasks.map(task => {
         if (task.title.toLowerCase().includes(taskTitleQuery.toLowerCase()) && !updated) {
           updated = true;
           taskTitle = task.title;
           return { ...task, completed: completed };
         }
         return task;
       });
       return newTasks;
     });
     return updated ? `I've marked "${taskTitle}" as ${completed ? 'complete' : 'incomplete'}.` : `I couldn't find a task matching "${taskTitleQuery}".`;
  };


  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <TodayTasks tasks={todayTasks} clientsMap={clientsMap} phasesMap={phasesMap} onToggle={toggleTaskCompletion} />
            <WeeklyFocus tasks={WEEK_TASKS} clientsMap={clientsMap} />
          </div>
          <div className="space-y-6">
            <AgencyTarget target={WEEKLY_TARGET} />
            <MonthGlance milestones={MONTH_MILESTONES} clientsMap={clientsMap} />
            <SystemStatus seoPhasesCount={PHASES.length} activeAutomationsCount={activeAutomations} totalAutomations={AUTOMATIONS.length} />
          </div>
        </main>
      </div>
      <VoiceAssistant 
        todayTasks={todayTasks} 
        clientsMap={clientsMap}
        addTask={addTask}
        updateTaskStatus={updateTaskStatus}
       />
    </div>
  );
};

export default App;
