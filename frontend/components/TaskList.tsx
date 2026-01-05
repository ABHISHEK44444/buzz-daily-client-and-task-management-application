
import React, { useState } from 'react';
import { Task, Status } from '../types';
import { Button } from './Button';
import { DatePicker } from './DatePicker';

interface TaskListProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id'>) => void;
  onDeleteTask: (id: string) => void;
  onToggleStatus: (id: string) => void;
  sortCriteria?: 'dueDate';
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (criteria: 'dueDate', order: 'asc' | 'desc') => void;
  filterStatus?: Status | 'All';
  onFilterChange?: (type: 'status', value: string) => void;
}

export const TaskList: React.FC<TaskListProps> = ({ 
  tasks, 
  onAddTask, 
  onDeleteTask, 
  onToggleStatus,
  sortCriteria,
  sortOrder,
  onSortChange,
  filterStatus = 'All',
  onFilterChange
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState(() => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [isAdding, setIsAdding] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const inputClasses = "block w-full rounded-lg border-slate-200 bg-slate-50 text-slate-800 px-4 py-2.5 focus:bg-white focus:border-accent focus:ring-accent transition-all shadow-sm text-sm placeholder-slate-400";

  const getLocalTodayISO = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask({
      title: newTaskTitle,
      description: newTaskDescription.trim(),
      status: Status.PENDING,
      dueDate: newTaskDueDate || getLocalTodayISO(),
      notes: newTaskNotes.trim(),
    });
    setNewTaskTitle('');
    setNewTaskDescription('');
    setNewTaskNotes('');
    setNewTaskDueDate(getLocalTodayISO());
    setIsAdding(false);
  };

  const toggleTaskExpansion = (id: string) => {
    setExpandedTaskId(prev => prev === id ? null : id);
  };

  const getDueDateLabel = (dateStr: string) => {
    if (!dateStr) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const parts = dateStr.split('-');
    const formattedDate = `${parts[2]}/${parts[1]}/${parts[0]}`;
    
    if (diffDays < 0) return { text: formattedDate, status: 'Overdue', className: 'text-red-600 font-bold' };
    if (diffDays === 0) return { text: formattedDate, status: 'Today', className: 'text-blue-600 font-bold' };
    if (diffDays === 1) return { text: formattedDate, status: 'Tomorrow', className: 'text-orange-600 font-medium' };
    
    return { text: formattedDate, status: null, className: 'text-slate-500' };
  };

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === Status.COMPLETED).length;
  const progress = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row items-end lg:items-center justify-between gap-6 transition-all hover:shadow-md">
        <div className="flex-1 w-full lg:w-auto">
            <div className="flex justify-between items-end mb-3">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Task Manager</h2>
                    <p className="text-sm text-slate-500 mt-1 font-medium">
                        {completedTasks} of {totalTasks} tasks completed
                    </p>
                </div>
                <div className="text-right">
                    <span className="text-3xl font-bold text-accent">{progress}%</span>
                </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div 
                    className="bg-accent h-2.5 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                    style={{ width: `${progress}%` }}
                ></div>
            </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
            {onFilterChange && (
              <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-50 p-1 rounded-lg border border-slate-200">
                 <select 
                   value={filterStatus}
                   onChange={(e) => onFilterChange?.('status', e.target.value)}
                   className="text-xs bg-transparent border-none rounded-md focus:ring-0 text-slate-600 font-medium cursor-pointer hover:text-slate-900 w-full sm:w-auto"
                 >
                   <option value="All">All Status</option>
                   {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                 </select>
              </div>
            )}

            <div className="flex items-center gap-2 w-full sm:w-auto">
                 {onSortChange && sortCriteria && sortOrder && (
                    <button
                        onClick={() => onSortChange?.(sortCriteria, sortOrder === 'asc' ? 'desc' : 'asc')}
                        className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
                        title={`Sort by ${sortCriteria} (${sortOrder})`}
                    >
                        <i className={`fa-solid ${sortOrder === 'asc' ? 'fa-arrow-up-wide-short' : 'fa-arrow-down-wide-short'}`}></i>
                    </button>
                )}
                <Button 
                    onClick={() => setIsAdding(!isAdding)} 
                    className={`w-full sm:w-auto shadow-sm ${isAdding ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-accent text-white hover:bg-blue-600'}`}
                >
                    <i className={`fa-solid ${isAdding ? 'fa-xmark' : 'fa-plus'} mr-2`}></i>
                    {isAdding ? 'Close' : 'Add Task'}
                </Button>
            </div>
        </div>
      </div>

      {/* Add Task Form */}
      {isAdding && (
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-fade-in ring-4 ring-slate-50">
            <div className="bg-slate-50 px-6 py-3 border-b border-slate-100 flex items-center gap-2">
                <i className="fa-solid fa-pen-to-square text-accent"></i>
                <h3 className="font-bold text-slate-700 text-sm">Create New Task</h3>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                    <input
                        type="text"
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className="text-lg font-semibold placeholder-slate-300 border-0 border-b-2 border-slate-100 focus:border-accent focus:ring-0 w-full bg-transparent px-0 py-2 transition-colors"
                        autoFocus
                    />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Due Date</label>
                        <DatePicker 
                            value={newTaskDueDate}
                            onChange={(e) => setNewTaskDueDate(e.target.value)}
                            className={inputClasses}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Description</label>
                        <textarea
                            value={newTaskDescription}
                            onChange={(e) => setNewTaskDescription(e.target.value)}
                            placeholder="Add brief details..."
                            rows={1}
                            className={`${inputClasses} resize-none`}
                        />
                    </div>
                </div>
                
                <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wide mb-1.5">Additional Notes</label>
                    <textarea
                        value={newTaskNotes}
                        onChange={(e) => setNewTaskNotes(e.target.value)}
                        placeholder="Any extra context..."
                        rows={2}
                        className={`${inputClasses} resize-none`}
                    />
                </div>

                <div className="flex justify-end pt-2">
                    <Button type="submit" className="px-8 shadow-md shadow-blue-500/20">Create Task</Button>
                </div>
            </form>
        </div>
      )}

      {/* Tasks Grid/List */}
      <div className="space-y-3">
        {!tasks || tasks.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-slate-300 p-12 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                <i className="fa-solid fa-clipboard-check text-3xl"></i>
            </div>
            <h3 className="text-slate-900 font-bold text-lg">No tasks found</h3>
            <p className="text-slate-500 mt-1">Try adjusting your filters or add a new task to get started.</p>
            <Button onClick={() => setIsAdding(true)} variant="ghost" className="mt-4 text-accent hover:text-blue-700 hover:bg-blue-50">
                Create your first task
            </Button>
          </div>
        ) : (
          tasks.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const dateLabel = getDueDateLabel(task.dueDate);
            
            return (
              <div 
                key={task.id} 
                className={`group relative bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 ${isExpanded ? 'ring-2 ring-slate-100 shadow-md' : 'hover:shadow-md hover:border-slate-300'}`}
              >
                {/* Visual Accent Strip */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-xl bg-slate-200 group-hover:bg-accent transition-colors"></div>

                <div className="p-4 pl-6 flex items-start gap-4">
                  {/* Custom Checkbox */}
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleStatus(task.id);
                    }}
                    className={`mt-1 w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center transition-all duration-300 border-2 ${
                      task.status === Status.COMPLETED 
                        ? 'bg-emerald-500 border-emerald-500 text-white scale-110' 
                        : 'bg-white border-slate-300 text-transparent hover:border-emerald-400'
                    }`}
                  >
                    <i className="fa-solid fa-check text-xs"></i>
                  </button>

                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => toggleTaskExpansion(task.id)}>
                    {/* Header Row */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1">
                             <h4 className={`text-base font-semibold text-slate-900 transition-all ${task.status === Status.COMPLETED ? 'line-through text-slate-400' : ''}`}>
                                {task.title}
                            </h4>
                            {!isExpanded && task.description && (
                                <p className={`text-sm mt-0.5 truncate ${task.status === Status.COMPLETED ? 'text-slate-300' : 'text-slate-500'}`}>
                                    {task.description}
                                </p>
                            )}
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-auto">
                            {dateLabel && (
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs whitespace-nowrap ${dateLabel.className} flex items-center gap-1.5`}>
                                         <i className="fa-regular fa-calendar text-[10px]"></i>
                                         {dateLabel.text}
                                    </span>
                                    {dateLabel.status && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                            dateLabel.status === 'Overdue' ? 'bg-red-50 text-red-600' : 
                                            dateLabel.status === 'Today' ? 'bg-blue-50 text-blue-600' :
                                            'bg-orange-50 text-orange-600'
                                        }`}>
                                            {dateLabel.status}
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Expanded Content */}
                    <div className={`grid transition-[grid-template-rows] duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr] opacity-100 mt-3' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <div className="pt-2 border-t border-slate-100 space-y-3">
                                {task.description && (
                                    <div>
                                        <p className="text-xs font-bold text-slate-400 uppercase mb-1">Description</p>
                                        <p className="text-sm text-slate-700 leading-relaxed">{task.description}</p>
                                    </div>
                                )}
                                {task.notes && (
                                    <div className="bg-amber-50 rounded-lg p-3 border border-amber-100 flex gap-3">
                                         <i className="fa-regular fa-note-sticky text-amber-400 mt-0.5"></i>
                                         <div className="flex-1">
                                             <p className="text-xs font-bold text-amber-700 uppercase mb-0.5">Notes</p>
                                             <p className="text-sm text-amber-900">{task.notes}</p>
                                         </div>
                                    </div>
                                )}
                                <div className="flex justify-end pt-2">
                                     <Button 
                                        variant="ghost" 
                                        className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 h-8"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Delete this task?')) onDeleteTask(task.id);
                                        }}
                                    >
                                        <i className="fa-solid fa-trash mr-1.5"></i> Delete Task
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                  </div>
                  
                  {/* Chevron Indicator */}
                  <button 
                    onClick={() => toggleTaskExpansion(task.id)}
                    className={`p-1 text-slate-400 hover:text-slate-600 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  >
                    <i className="fa-solid fa-chevron-down"></i>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
