import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import TodayTasks from '../components/TodayTasks';
import WeeklyFocus from '../components/WeeklyFocus';
import AgencyTarget from '../components/AgencyTarget';
import MonthGlance from '../components/MonthGlance';
import SystemStatus from '../components/SystemStatus';
import VoiceAssistant from '../components/VoiceAssistant';
import { connectToDatabase } from '../lib/mongodb';

export async function getServerSideProps({ req }) {
  const { isRequestAuthenticated } = await import('../lib/auth');

  if (!isRequestAuthenticated(req)) {
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    };
  }

  try {
    const { db } = await connectToDatabase();
    
    const clients = await db.collection('app_clients').find({}).toArray();
    const phases = await db.collection('app_phases').find({}).toArray();
    const todayTasks = await db.collection('app_todayTasks').find({}).sort({ _id: 1 }).toArray();
    const weekTasks = await db.collection('app_weekTasks').find({}).toArray();
    const monthMilestones = await db.collection('app_monthMilestones').find({}).toArray();
    const weeklyTarget = await db.collection('app_weeklyTarget').findOne({});
    const automations = await db.collection('app_automations').find({}).toArray();

    // MongoDB's _id is not directly serializable for Next.js, so we convert it to a string.
    const serialize = (data) => JSON.parse(JSON.stringify(data));

    return {
      props: {
        initialData: {
          clients: serialize(clients),
          phases: serialize(phases),
          todayTasks: serialize(todayTasks),
          weekTasks: serialize(weekTasks),
          monthMilestones: serialize(monthMilestones),
          weeklyTarget: serialize(weeklyTarget),
          automations: serialize(automations),
        },
        geminiApiKey: process.env.GEMINI_API_KEY || null,
      },
    };
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    return {
      props: { initialData: { error: 'Failed to load data' }, geminiApiKey: process.env.GEMINI_API_KEY || null },
    };
  }
}


const HomePage = ({ initialData, geminiApiKey }) => {
  const router = useRouter();
  const [data, setData] = useState(initialData);

  const clientsMap = useMemo(() => new Map(data.clients.map(c => [c.id, c])), [data.clients]);
  const phasesMap = useMemo(() => new Map(data.phases.map(p => [p.id, p])), [data.phases]);
  const activeAutomations = useMemo(() => data.automations.filter(a => a.status === 'active').length, [data.automations]);

  const toggleTaskCompletion = async (taskId, currentStatus) => {
    const originalTasks = data.todayTasks;
    const newTasks = originalTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setData(prevData => ({ ...prevData, todayTasks: newTasks }));

    try {
      await fetch(`/api/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: !currentStatus }),
      });
    } catch(e) {
      console.error("Failed to update task", e);
      setData(prevData => ({ ...prevData, todayTasks: originalTasks }));
    }
  };
  
  const addTask = async (title, clientName) => {
    const client = data.clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    if (!client) {
        console.error(`Client "${clientName}" not found.`);
        return `I couldn't find a client named ${clientName}. Please try again.`;
    }

    const newTask = {
        id: `t${Date.now()}`,
        title,
        clientId: client.id,
        phaseId: 'p3', // Default to 'Building & Content'
        completed: false,
    };
    
    const originalTasks = data.todayTasks;
    // Add a temporary _id for the key prop to avoid warnings before a real one comes from the DB
    const displayTask = {...newTask, _id: `temp_${Date.now()}`};
    setData(prev => ({...prev, todayTasks: [...prev.todayTasks, displayTask]}));
    
    try {
       await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask),
       });
    } catch(e) {
      console.error("Failed to add task", e);
      setData(prev => ({...prev, todayTasks: originalTasks}));
    }

    return `Okay, I've added the task "${title}" for ${clientName}.`;
  };

  const updateTaskStatus = async (taskTitleQuery, completed) => {
    const originalTasks = data.todayTasks;
    let taskToUpdate = null;
    let updated = false;

    const newTasks = originalTasks.map(task => {
        if (!updated && task.title.toLowerCase().includes(taskTitleQuery.toLowerCase())) {
            updated = true;
            taskToUpdate = { ...task, completed: completed };
            return taskToUpdate;
        }
        return task;
    });

    if (taskToUpdate) {
        setData(prev => ({...prev, todayTasks: newTasks})); // Optimistic update
        try {
            await fetch(`/api/data`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskId: taskToUpdate.id, completed: taskToUpdate.completed }),
            });
            return `I've marked "${taskToUpdate.title}" as ${completed ? 'complete' : 'incomplete'}.`;
        } catch (e) {
            console.error("Failed to update task", e);
            setData(prev => ({...prev, todayTasks: originalTasks})); // Revert on failure
            return `Sorry, I couldn't update the task. Please try again.`;
        }
    } else {
        return `I couldn't find a task matching "${taskTitleQuery}".`;
    }
  };

  const deleteTask = async (taskId) => {
    const originalTasks = data.todayTasks;
    const taskToDelete = originalTasks.find(task => task.id === taskId);
    
    if (!taskToDelete) {
      return;
    }

    // Optimistic update
    setData(prev => ({
      ...prev,
      todayTasks: prev.todayTasks.filter(task => task.id !== taskId)
    }));

    try {
      await fetch('/api/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId }),
      });
    } catch (e) {
      console.error("Failed to delete task", e);
      // Revert on failure
      setData(prev => ({...prev, todayTasks: originalTasks}));
    }
  };

  const deleteTaskByTitle = async (taskTitleQuery) => {
    const originalTasks = data.todayTasks;
    let taskToDelete = null;

    for (const task of originalTasks) {
      if (task.title.toLowerCase().includes(taskTitleQuery.toLowerCase())) {
        taskToDelete = task;
        break;
      }
    }

    if (taskToDelete) {
      // Optimistic update
      setData(prev => ({
        ...prev,
        todayTasks: prev.todayTasks.filter(task => task.id !== taskToDelete.id)
      }));

      try {
        await fetch('/api/data', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: taskToDelete.id }),
        });
        return `I've deleted the task "${taskToDelete.title}".`;
      } catch (e) {
        console.error("Failed to delete task", e);
        // Revert on failure
        setData(prev => ({...prev, todayTasks: originalTasks}));
        return `Sorry, I couldn't delete the task. Please try again.`;
      }
    } else {
      return `I couldn't find a task matching "${taskTitleQuery}".`;
    }
  };

  const addWeekTask = async (title, clientName, day) => {
    const client = data.clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    if (!client) {
        return `I couldn't find a client named ${clientName}.`;
    }

    const newTask = {
        id: `w${Date.now()}`,
        title,
        clientId: client.id,
        phaseId: 'p3',
        day: day || 'Monday',
        type: 'week'
    };
    
    const originalTasks = data.weekTasks;
    const displayTask = {...newTask, _id: `temp_${Date.now()}`};
    setData(prev => ({...prev, weekTasks: [...prev.weekTasks, displayTask]}));
    
    try {
       const response = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newTask),
       });
       
       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       const result = await response.json();
       console.log('Week task added:', result);
       return `I've added "${title}" to this week's tasks for ${clientName}.`;
    } catch(e) {
      console.error("Failed to add week task", e);
      setData(prev => ({...prev, weekTasks: originalTasks}));
      return `Sorry, I couldn't add the task. Error: ${e.message}`;
    }
  };

  const addMonthMilestone = async (title, clientName, date) => {
    const client = data.clients.find(c => c.name.toLowerCase() === clientName.toLowerCase());
    if (!client) {
        return `I couldn't find a client named ${clientName}.`;
    }

    const newMilestone = {
        id: `m${Date.now()}`,
        title,
        clientId: client.id,
        date: date || 'TBD',
        type: 'month'
    };
    
    const originalMilestones = data.monthMilestones;
    const displayMilestone = {...newMilestone, _id: `temp_${Date.now()}`};
    setData(prev => ({...prev, monthMilestones: [...prev.monthMilestones, displayMilestone]}));
    
    try {
       const response = await fetch('/api/data', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newMilestone),
       });
       
       if (!response.ok) {
         throw new Error(`HTTP error! status: ${response.status}`);
       }
       
       const result = await response.json();
       console.log('Milestone added:', result);
       return `I've added the milestone "${title}" for ${clientName} on ${date || 'TBD'}.`;
    } catch(e) {
      console.error("Failed to add milestone", e);
      setData(prev => ({...prev, monthMilestones: originalMilestones}));
      return `Sorry, I couldn't add the milestone. Error: ${e.message}`;
    }
  };

  const readWeekTasks = () => {
    if (data.weekTasks.length === 0) {
      return "There are no tasks scheduled for this week.";
    }
    return "This week's tasks: " + data.weekTasks.map(t => `${t.title} for ${clientsMap.get(t.clientId)?.name} on ${t.day}`).join('. ');
  };

  const readMonthMilestones = () => {
    if (data.monthMilestones.length === 0) {
      return "There are no milestones for this month.";
    }
    return "This month's milestones: " + data.monthMilestones.map(m => `${m.title} for ${clientsMap.get(m.clientId)?.name} on ${m.date}`).join('. ');
  };

  const deleteWeekTask = async (taskId) => {
    const originalTasks = data.weekTasks;
    setData(prev => ({
      ...prev,
      weekTasks: prev.weekTasks.filter(task => task.id !== taskId)
    }));

    try {
      const response = await fetch('/api/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, type: 'week' }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (e) {
      console.error("Failed to delete week task", e);
      setData(prev => ({...prev, weekTasks: originalTasks}));
    }
  };

  const deleteWeekTaskByTitle = async (taskTitleQuery) => {
    const originalTasks = data.weekTasks;
    let taskToDelete = null;

    for (const task of originalTasks) {
      if (task.title.toLowerCase().includes(taskTitleQuery.toLowerCase())) {
        taskToDelete = task;
        break;
      }
    }

    if (taskToDelete) {
      setData(prev => ({
        ...prev,
        weekTasks: prev.weekTasks.filter(task => task.id !== taskToDelete.id)
      }));

      try {
        const response = await fetch('/api/data', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: taskToDelete.id, type: 'week' }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return `I've deleted the weekly task "${taskToDelete.title}".`;
      } catch (e) {
        console.error("Failed to delete week task", e);
        setData(prev => ({...prev, weekTasks: originalTasks}));
        return `Sorry, I couldn't delete the task. Error: ${e.message}`;
      }
    } else {
      return `I couldn't find a weekly task matching "${taskTitleQuery}".`;
    }
  };

  const deleteMonthMilestone = async (milestoneId) => {
    const originalMilestones = data.monthMilestones;
    setData(prev => ({
      ...prev,
      monthMilestones: prev.monthMilestones.filter(m => m.id !== milestoneId)
    }));

    try {
      const response = await fetch('/api/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: milestoneId, type: 'month' }),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (e) {
      console.error("Failed to delete milestone", e);
      setData(prev => ({...prev, monthMilestones: originalMilestones}));
    }
  };

  const deleteMonthMilestoneByTitle = async (milestoneQuery) => {
    const originalMilestones = data.monthMilestones;
    let milestoneToDelete = null;

    for (const milestone of originalMilestones) {
      if (milestone.title.toLowerCase().includes(milestoneQuery.toLowerCase())) {
        milestoneToDelete = milestone;
        break;
      }
    }

    if (milestoneToDelete) {
      setData(prev => ({
        ...prev,
        monthMilestones: prev.monthMilestones.filter(m => m.id !== milestoneToDelete.id)
      }));

      try {
        const response = await fetch('/api/data', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ taskId: milestoneToDelete.id, type: 'month' }),
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        return `I've deleted the milestone "${milestoneToDelete.title}".`;
      } catch (e) {
        console.error("Failed to delete milestone", e);
        setData(prev => ({...prev, monthMilestones: originalMilestones}));
        return `Sorry, I couldn't delete the milestone. Error: ${e.message}`;
      }
    } else {
      return `I couldn't find a milestone matching "${milestoneQuery}".`;
    }
  };

  if (initialData.error) {
     return <div className="min-h-screen flex items-center justify-center text-white"><p>Error: {initialData.error}</p></div>;
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (error) {
      console.error('Failed to log out', error);
    } finally {
      router.replace('/login');
    }
  };

  // Drag and drop handler - converts WeekTask to Task and moves it to today
  const handleMoveWeekTaskToToday = async (weekTask) => {
    // Create a new task from the week task
    const newTask = {
      id: `t${Date.now()}`,
      title: weekTask.title,
      clientId: weekTask.clientId,
      phaseId: weekTask.phaseId || 'p3',
      completed: false,
      type: 'today'
    };
    
    const originalTodayTasks = data.todayTasks;
    const originalWeekTasks = data.weekTasks;
    
    // Optimistic update - add to today and remove from week
    const displayTask = {...newTask, _id: `temp_${Date.now()}`};
    setData(prev => ({
      ...prev,
      todayTasks: [...prev.todayTasks, displayTask],
      weekTasks: prev.weekTasks.filter(t => t.id !== weekTask.id)
    }));
    
    try {
      // Add to today's tasks in database
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTask),
      });
      
      // Delete from week tasks in database
      await fetch('/api/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: weekTask.id, type: 'week' }),
      });
    } catch (e) {
      console.error("Failed to move task", e);
      // Revert on failure
      setData(prev => ({
        ...prev,
        todayTasks: originalTodayTasks,
        weekTasks: originalWeekTasks
      }));
    }
  };

  // Reverse drag and drop handler - converts Task to WeekTask and moves it to week
  const handleMoveTodayTaskToWeek = async (todayTask) => {
    // Determine the day for the week task (default to Monday)
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
    const defaultDay = daysOfWeek[today >= 1 && today <= 5 ? today - 1 : 0];

    // Create a new week task from the today task
    const newWeekTask = {
      id: `w${Date.now()}`,
      title: todayTask.title,
      clientId: todayTask.clientId,
      phaseId: todayTask.phaseId || 'p3',
      day: defaultDay,
      type: 'week'
    };
    
    const originalTodayTasks = data.todayTasks;
    const originalWeekTasks = data.weekTasks;
    
    // Optimistic update - add to week and remove from today
    const displayTask = {...newWeekTask, _id: `temp_${Date.now()}`};
    setData(prev => ({
      ...prev,
      weekTasks: [...prev.weekTasks, displayTask],
      todayTasks: prev.todayTasks.filter(t => t.id !== todayTask.id)
    }));
    
    try {
      // Add to week's tasks in database
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWeekTask),
      });
      
      // Delete from today's tasks in database
      await fetch('/api/data', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId: todayTask.id, type: 'today' }),
      });
    } catch (e) {
      console.error("Failed to move task to week", e);
      // Revert on failure
      setData(prev => ({
        ...prev,
        todayTasks: originalTodayTasks,
        weekTasks: originalWeekTasks
      }));
    }
  };

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header onLogout={handleLogout} />
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <TodayTasks tasks={data.todayTasks} clientsMap={clientsMap} phasesMap={phasesMap} onToggle={toggleTaskCompletion} onDelete={deleteTask} onDropWeekTask={handleMoveWeekTaskToToday} />
            <WeeklyFocus tasks={data.weekTasks} clientsMap={clientsMap} onDelete={deleteWeekTask} onMoveToToday={handleMoveWeekTaskToToday} onDropTodayTask={handleMoveTodayTaskToWeek} />
          </div>
          <div className="space-y-6">
            {data.weeklyTarget && <AgencyTarget target={data.weeklyTarget} />}
            <MonthGlance milestones={data.monthMilestones} clientsMap={clientsMap} onDelete={deleteMonthMilestone} />
            <SystemStatus seoPhasesCount={data.phases.length} activeAutomationsCount={activeAutomations} totalAutomations={data.automations.length} />
          </div>
        </main>
      </div>
       <VoiceAssistant 
        todayTasks={data.todayTasks}
        weekTasks={data.weekTasks}
        monthMilestones={data.monthMilestones}
        clients={data.clients}
        clientsMap={clientsMap}
        addTask={addTask}
        addWeekTask={addWeekTask}
        addMonthMilestone={addMonthMilestone}
        updateTaskStatus={updateTaskStatus}
        deleteTask={deleteTaskByTitle}
        deleteWeekTask={deleteWeekTaskByTitle}
        deleteMonthMilestone={deleteMonthMilestoneByTitle}
        readWeekTasks={readWeekTasks}
        readMonthMilestones={readMonthMilestones}
        apiKey={geminiApiKey}
       />
    </div>
  );
};

export default HomePage;
