
import React, { useState, useMemo } from 'react';
import type { Task, WeekTask } from './types';
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
  const [weekTasks, setWeekTasks] = useState<WeekTask[]>(WEEK_TASKS);

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

  const deleteTask = (taskTitleQuery: string) => {
    let deleted = false;
    let taskTitle = '';
    setTodayTasks(prevTasks => {
      const taskToDelete = prevTasks.find(task => 
        task.title.toLowerCase().includes(taskTitleQuery.toLowerCase())
      );
      if (taskToDelete) {
        deleted = true;
        taskTitle = taskToDelete.title;
        return prevTasks.filter(task => task.id !== taskToDelete.id);
      }
      return prevTasks;
    });
    return deleted ? `I've deleted the task "${taskTitle}".` : `I couldn't find a task matching "${taskTitleQuery}".`;
  };

  const addWeekTask = (title: string, clientName: string, day: string) => {
    return `Week task feature not available in demo mode. Would add: "${title}" for ${clientName} on ${day}.`;
  };

  const addMonthMilestone = (title: string, clientName: string, date: string) => {
    return `Month milestone feature not available in demo mode. Would add: "${title}" for ${clientName} on ${date}.`;
  };

  const readWeekTasks = () => {
    return "This week's tasks: " + weekTasks.map(t => `${t.title} for ${clientsMap.get(t.clientId)?.name} on ${t.day}`).join('. ');
  };

  const readMonthMilestones = () => {
    return "This month's milestones: " + MONTH_MILESTONES.map(m => `${m.title} for ${clientsMap.get(m.clientId)?.name} on ${m.date}`).join('. ');
  };

  const deleteWeekTask = (taskId: string) => {
    setWeekTasks(prev => prev.filter(t => t.id !== taskId));
  };

  const deleteWeekTaskByTitle = (taskTitle: string) => {
    return `Week task deletion not available in demo mode. Would delete: "${taskTitle}".`;
  };

  const deleteMonthMilestone = (milestoneId: string) => {
    console.log('Delete milestone not available in demo mode:', milestoneId);
  };

  const deleteMonthMilestoneByTitle = (milestoneTitle: string) => {
    return `Milestone deletion not available in demo mode. Would delete: "${milestoneTitle}".`;
  };

  // Drag and drop handler - converts WeekTask to Task and moves it to today
  const handleMoveWeekTaskToToday = (weekTask: WeekTask) => {
    // Create a new task from the week task
    const newTask: Task = {
      id: `t${Date.now()}`,
      title: weekTask.title,
      clientId: weekTask.clientId,
      phaseId: weekTask.phaseId || 'p3', // Use existing phaseId or default
      completed: false,
    };
    
    // Add to today's tasks
    setTodayTasks(prev => [...prev, newTask]);
    
    // Remove from week tasks
    setWeekTasks(prev => prev.filter(t => t.id !== weekTask.id));
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <TodayTasks 
              tasks={todayTasks} 
              clientsMap={clientsMap} 
              phasesMap={phasesMap} 
              onToggle={toggleTaskCompletion} 
              onDelete={(taskId) => setTodayTasks(prev => prev.filter(t => t.id !== taskId))}
              onDropWeekTask={handleMoveWeekTaskToToday}
            />
            <WeeklyFocus 
              tasks={weekTasks} 
              clientsMap={clientsMap} 
              onDelete={deleteWeekTask}
              onMoveToToday={handleMoveWeekTaskToToday}
            />
          </div>
          <div className="space-y-6">
            <AgencyTarget target={WEEKLY_TARGET} />
            <MonthGlance milestones={MONTH_MILESTONES} clientsMap={clientsMap} onDelete={deleteMonthMilestone} />
            <SystemStatus seoPhasesCount={PHASES.length} activeAutomationsCount={activeAutomations} totalAutomations={AUTOMATIONS.length} />
          </div>
        </main>
      </div>
      <VoiceAssistant 
        todayTasks={todayTasks}
        weekTasks={weekTasks}
        monthMilestones={MONTH_MILESTONES}
        clients={CLIENTS}
        clientsMap={clientsMap}
        addTask={addTask}
        addWeekTask={addWeekTask}
        addMonthMilestone={addMonthMilestone}
        updateTaskStatus={updateTaskStatus}
        deleteTask={deleteTask}
        deleteWeekTask={deleteWeekTaskByTitle}
        deleteMonthMilestone={deleteMonthMilestoneByTitle}
        readWeekTasks={readWeekTasks}
        readMonthMilestones={readMonthMilestones}
       />
    </div>
  );
};

export default App;
