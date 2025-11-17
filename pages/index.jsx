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
        }
      },
    };
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    return {
      props: { initialData: { error: 'Failed to load data' } },
    };
  }
}


const HomePage = ({ initialData }) => {
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

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header onLogout={handleLogout} />
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          <div className="lg:col-span-2 space-y-6">
            <TodayTasks tasks={data.todayTasks} clientsMap={clientsMap} phasesMap={phasesMap} onToggle={toggleTaskCompletion} />
            <WeeklyFocus tasks={data.weekTasks} clientsMap={clientsMap} />
          </div>
          <div className="space-y-6">
            {data.weeklyTarget && <AgencyTarget target={data.weeklyTarget} />}
            <MonthGlance milestones={data.monthMilestones} clientsMap={clientsMap} />
            <SystemStatus seoPhasesCount={data.phases.length} activeAutomationsCount={activeAutomations} totalAutomations={data.automations.length} />
          </div>
        </main>
      </div>
      <VoiceAssistant 
        todayTasks={data.todayTasks} 
        clients={data.clients}
        clientsMap={clientsMap}
        addTask={addTask}
        updateTaskStatus={updateTaskStatus}
       />
    </div>
  );
};

export default HomePage;
