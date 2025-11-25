
import React, { useState } from 'react';
import type { Task, Client, Phase, WeekTask } from '../types';
import Card from './Card';
import { TrophyIcon, TrashIcon, ClockIcon } from './Icons';

interface TodayTasksProps {
  tasks: Task[];
  clientsMap: Map<string, Client>;
  phasesMap: Map<string, Phase>;
  onToggle: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onWaitingToggle?: (taskId: string, waitingFor: string) => void;
  onDropWeekTask?: (weekTask: WeekTask) => void;
  waitingInputTaskId?: string | null;
  onWaitingInputChange?: (taskId: string | null) => void;
}

const TodayTasks: React.FC<TodayTasksProps> = ({ tasks, clientsMap, phasesMap, onToggle, onDelete, onWaitingToggle, onDropWeekTask, waitingInputTaskId, onWaitingInputChange }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [waitingForInput, setWaitingForInput] = useState('');

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);

    try {
      const taskData = e.dataTransfer.getData('application/json');
      if (taskData && onDropWeekTask) {
        const weekTask: WeekTask = JSON.parse(taskData);
        onDropWeekTask(weekTask);
      }
    } catch (error) {
      console.error('Error processing dropped task:', error);
    }
  };

  const handleTaskDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    e.stopPropagation(); // Prevent parent drag handlers
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/json', JSON.stringify(task));
    e.dataTransfer.setData('text/plain', task.id);
    
    // Add visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleTaskDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    // Reset visual feedback
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleShowWaitingInput = (taskId: string) => {
    if (onWaitingInputChange) {
      onWaitingInputChange(taskId);
      setWaitingForInput('');
    }
  };

  const handleSubmitWaitingInput = (taskId: string) => {
    if (onWaitingToggle && waitingForInput.trim()) {
      onWaitingToggle(taskId, waitingForInput.trim());
      setWaitingForInput('');
    }
  };

  const handleCancelWaitingInput = () => {
    if (onWaitingInputChange) {
      onWaitingInputChange(null);
      setWaitingForInput('');
    }
  };

  const handleWaitingInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, taskId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmitWaitingInput(taskId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelWaitingInput();
    }
  };

  return (
    <section>
      <div className="flex items-center gap-3 mb-4">
        <TrophyIcon className="w-6 h-6 text-yellow-400" />
        <h2 className="text-xl font-bold text-white">Your Daily Execution Layer</h2>
      </div>
      <Card>
        <div 
          className={`transition-all duration-200 ${isDragOver ? 'ring-2 ring-blue-500 ring-opacity-50 bg-blue-900/10 rounded-lg' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <h3 className="font-semibold text-white mb-4">Today's 3 Critical Tasks</h3>
          {isDragOver && (
            <div className="mb-4 p-4 border-2 border-dashed border-blue-500 rounded-lg text-center text-blue-400">
              Drop task here to add to today's list
            </div>
          )}
          <div className="space-y-3">
            {tasks.map(task => {
              const client = clientsMap.get(task.clientId);
              const phase = phasesMap.get(task.phaseId);
              return (
                <div 
                  key={task.id} 
                  className={`p-4 rounded-lg flex items-start gap-4 transition-colors duration-200 cursor-move ${task.completed ? 'bg-green-900/40' : 'bg-slate-800'} hover:bg-slate-700/50`}
                  draggable
                  onDragStart={(e) => handleTaskDragStart(e, task)}
                  onDragEnd={handleTaskDragEnd}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => onToggle(task.id)}
                    className="mt-1 form-checkbox h-5 w-5 rounded bg-slate-700 border-slate-600 text-blue-500 focus:ring-blue-500 cursor-pointer"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <p className={`text-white ${task.completed ? 'line-through text-slate-400' : ''}`}>{task.title}</p>
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
                    {waitingInputTaskId === task.id && (
                      <div className="mt-3 flex items-center gap-2">
                        <input
                          type="text"
                          value={waitingForInput}
                          onChange={(e) => setWaitingForInput(e.target.value)}
                          onKeyDown={(e) => handleWaitingInputKeyDown(e, task.id)}
                          placeholder="Who are you waiting for?"
                          className="flex-1 px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSubmitWaitingInput(task.id);
                          }}
                          className="p-2 text-green-400 hover:text-green-300 hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
                          title="Submit"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCancelWaitingInput();
                          }}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-slate-700/50 rounded-lg transition-colors duration-200"
                          title="Cancel"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {onWaitingToggle && (
                      <button
                        onClick={() => handleShowWaitingInput(task.id)}
                        className="text-slate-400 hover:text-yellow-400 transition-colors duration-200 p-2 rounded-lg hover:bg-slate-700/50"
                        title="Move to waiting"
                      >
                        <ClockIcon className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(task.id)}
                      className="text-slate-400 hover:text-red-400 transition-colors duration-200 p-2 rounded-lg hover:bg-slate-700/50"
                      title="Delete task"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </section>
  );
};

export default TodayTasks;
