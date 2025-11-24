import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Header from '../components/Header';
import CompletedTasks from '../components/CompletedTasks';
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
    // Fetch only completed tasks
    const completedTasks = await db.collection('app_todayTasks').find({ completed: true }).sort({ _id: 1 }).toArray();

    // MongoDB's _id is not directly serializable for Next.js, so we convert it to a string.
    const serialize = (data) => JSON.parse(JSON.stringify(data));

    return {
      props: {
        initialData: {
          clients: serialize(clients),
          phases: serialize(phases),
          completedTasks: serialize(completedTasks),
        },
      },
    };
  } catch (error) {
    console.error('Failed to fetch initial data:', error);
    return {
      props: { initialData: { error: 'Failed to load data' } },
    };
  }
}

const CompletedPage = ({ initialData }) => {
  const router = useRouter();
  const [data, setData] = useState(initialData);

  const clientsMap = useMemo(() => new Map(data.clients.map(c => [c.id, c])), [data.clients]);
  const phasesMap = useMemo(() => new Map(data.phases.map(p => [p.id, p])), [data.phases]);

  const uncompleteTask = async (taskId) => {
    const originalTasks = data.completedTasks;
    const newTasks = originalTasks.filter(task => task.id !== taskId);
    setData(prevData => ({ ...prevData, completedTasks: newTasks }));

    try {
      await fetch(`/api/data`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, completed: false }),
      });
    } catch(e) {
      console.error("Failed to uncomplete task", e);
      setData(prevData => ({ ...prevData, completedTasks: originalTasks }));
    }
  };

  const deleteTask = async (taskId) => {
    const originalTasks = data.completedTasks;
    const taskToDelete = originalTasks.find(task => task.id === taskId);

    if (!taskToDelete) {
      return;
    }

    // Optimistic update
    setData(prev => ({
      ...prev,
      completedTasks: prev.completedTasks.filter(task => task.id !== taskId)
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
      setData(prev => ({...prev, completedTasks: originalTasks}));
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

  const handleBackHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-[#10172A] text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header onLogout={handleLogout} />

        <div className="mt-6 mb-4">
          <button
            onClick={handleBackHome}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200 text-white font-medium"
          >
            Back to Dashboard
          </button>
        </div>

        <main className="mt-6">
          <CompletedTasks
            tasks={data.completedTasks}
            clientsMap={clientsMap}
            phasesMap={phasesMap}
            onUncomplete={uncompleteTask}
            onDelete={deleteTask}
          />
        </main>
      </div>
    </div>
  );
};

export default CompletedPage;
