import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import TodayTasks from './components/TodayTasks';
import WeeklyFocus from './components/WeeklyFocus';
import AgencyTarget from './components/AgencyTarget';
import MonthGlance from './components/MonthGlance';
import SystemStatus from './components/SystemStatus';
import VoiceAssistant from './components/VoiceAssistant';

const App = () => {
  const [data, setData] = useState({
    clients: [],
    phases: [],
    todayTasks: [],
    weekTasks: [],
    monthMilestones: [],
    weeklyTarget: null,
    automations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real Next.js app, this would be '/api/data'
        // We are mocking the fetch call here
        console.log("Fetching data... (Note: This is a mock as we can't run a real backend here)");
        
        // Simulating a delay and a potential failure
        await new Promise(resolve => setTimeout(resolve, 500));

        // In this environment, we can't actually make a network request to a new file.
        // So, we will have to load mock data. In a real project, the commented-out fetch call would work.
        // const response = await fetch('/api/data');
        // if (!response.ok) {
        //   throw new Error('Failed to fetch data');
        // }
        // const fetchedData = await response.json();

        const mockData = {
          clients: [
            { _id: 'c1', id: 'c1', name: 'Innovate Inc.', color: '#3498db' },
            { _id: 'c2', id: 'c2', name: 'Quantum Leap', color: '#e74c3c' },
            { _id: 'c3', id: 'c3', name: 'Starlight Solutions', color: '#f1c40f' },
            { _id: 'c4', id: 'c4', name: 'Apex Digital', color: '#2ecc71' }
          ],
          phases: [
            { _id: 'p1', id: 'p1', name: 'Learning & Discovery', color: '#9b59b6' },
            { _id: 'p2', id: 'p2', name: 'Improving & Optimization', color: '#7f8c8d' },
            { _id: 'p3', id: 'p3', name: 'Building & Content', color: '#1abc9c' },
            { _id: 'p4', id: 'p4', name: 'Promoting & Authority', color: '#e67e22' },
            { _id: 'p5', id: 'p5', name: 'Evaluation & Transition', color: '#bdc3c7' }
          ],
          todayTasks: [
            { _id: 't1', id: 't1', title: 'Finalize Q4 keyword research for Innovate Inc.', clientId: 'c1', phaseId: 'p1', completed: false },
            { _id: 't2', id: 't2', title: "Implement schema markup for Quantum Leap's service pages", clientId: 'c2', phaseId: 'p2', completed: true },
            { _id: 't3', id: 't3', title: "Draft blog post on 'AI in Marketing' for Starlight Solutions", clientId: 'c3', phaseId: 'p3', completed: false }
          ],
          weekTasks: [
            { _id: 'w1', id: 'w1', day: 'Monday', title: 'Review backlink profile for Apex Digital', clientId: 'c4', phaseId: 'p4' },
            { _id: 'w2', id: 'w2', day: 'Tuesday', title: 'Prepare monthly performance report for Innovate Inc.', clientId: 'c1', phaseId: 'p5' },
            { _id: 'w3', id: 'w3', day: 'Wednesday', title: 'On-page SEO audit for new Quantum Leap landing page', clientId: 'c2', phaseId: 'p2' },
            { _id: 'w4', id: 'w4', day: 'Thursday', title: 'Outline content calendar for November for Starlight Solutions', clientId: 'c3', phaseId: 'p1' },
            { _id: 'w5', id: 'w5', day: 'Friday', title: 'Fix 404 errors reported in GSC for Apex Digital', clientId: 'c4', phaseId: 'p2' }
          ],
          monthMilestones: [
            { _id: 'm1', id: 'm1', title: 'Launch new blog for Starlight Solutions', clientId: 'c3', date: 'October 5' },
            { _id: 'm2', id: 'm2', title: 'Complete technical SEO overhaul for Quantum Leap', clientId: 'c2', date: 'October 18' },
            { _id: 'm3', id: 'm3', title: 'Innovate Inc. Q3 performance review meeting', clientId: 'c1', date: 'October 26' }
          ],
          weeklyTarget: {
            _id: 'wt1', id: 'wt1',
            title: 'Standardize Client Reporting System',
            description: 'Create one unified reporting template in Looker Studio to be used for all monthly client performance reviews.',
            progress: 65
          },
          automations: [
            { _id: 'a1', id: 'a1', name: 'Weekly Update Generator', description: 'GA4 + GSC → Summary → Email', status: 'active' },
            { _id: 'a2', id: 'a2', name: 'Monthly SEO Report Builder', description: 'KPIs → PDF → Client Delivery', status: 'active' },
            { _id: 'a3', id: 'a3', name: 'Technical Monitoring', description: 'Crawls for errors → Creates tasks', status: 'active' },
            { _id: 'a4', id: 'a4', name: 'Content Opportunity Finder', description: 'Query data → New topics → Briefs', status: 'idle' },
            { _id: 'a5', id: 'a5', name: 'Backlink & Mention Monitor', description: 'Tracks links → Creates tasks', status: 'active' },
            { _id: 'a6', id: 'a6', name: 'Client Health Score', description: 'Comms + KPIs → Health Rating', status: 'active' },
            { _id: 'a7', id: 'a7', name: 'Onboarding Automation', description: 'Setup Folder + ClickUp + Templates', status: 'active' }
          ]
        };

        setData(mockData);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  const clientsMap = useMemo(() => new Map(data.clients.map(c => [c.id, c])), [data.clients]);
  const phasesMap = useMemo(() => new Map(data.phases.map(p => [p.id, p])), [data.phases]);
  const activeAutomations = useMemo(() => data.automations.filter(a => a.status === 'active').length, [data.automations]);

  const toggleTaskCompletion = (taskId) => {
    // Optimistic UI update
    const originalTasks = data.todayTasks;
    const newTasks = originalTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    setData(prevData => ({ ...prevData, todayTasks: newTasks }));

    // In a real app, you would then make an API call
    // fetch(`/api/data`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ taskId, completed: newTasks.find(t=>t.id === taskId).completed }),
    // }).catch(() => {
    //   // If API call fails, revert the change
    //   setData(prevData => ({ ...prevData, todayTasks: originalTasks }));
    // });
  };
  
  const addTask = (title, clientName) => {
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
    
    setData(prev => ({...prev, todayTasks: [...prev.todayTasks, newTask]}));
    
    // API call would go here
    // fetch('/api/data', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(newTask),
    // })

    return `Okay, I've added the task "${title}" for ${clientName}.`;
  };

  const updateTaskStatus = (taskTitleQuery, completed) => {
     let updated = false;
     let taskTitle = '';
     const originalTasks = data.todayTasks;
     const newTasks = originalTasks.map(task => {
         if (task.title.toLowerCase().includes(taskTitleQuery.toLowerCase()) && !updated) {
             updated = true;
             taskTitle = task.title;
             return { ...task, completed: completed };
         }
         return task;
     });

     if(updated) {
       setData(prev => ({...prev, todayTasks: newTasks}));
       // API call would go here
     }
     
     return updated ? `I've marked "${taskTitle}" as ${completed ? 'complete' : 'incomplete'}.` : `I couldn't find a task matching "${taskTitleQuery}".`;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-white"><p>Loading Dashboard...</p></div>;
  }

  return (
    <div className="min-h-screen text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <Header />
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

export default App;