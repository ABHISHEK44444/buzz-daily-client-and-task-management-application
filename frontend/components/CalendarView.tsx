
import React, { useState } from 'react';
// FIX: Removed unused 'Priority' type import which is not exported from '../types'.
import { Task, FollowUp, Status } from '../types';
import { Modal } from './Modal';
import { DatePicker } from './DatePicker';
import { Button } from './Button';

interface CalendarViewProps {
  tasks: Task[];
  followUps: FollowUp[];
  onUpdateTaskDate: (id: string, date: string) => void;
  onUpdateFollowUpDate: (id: string, date: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ 
  tasks, 
  followUps, 
  onUpdateTaskDate, 
  onUpdateFollowUpDate 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [rescheduleItem, setRescheduleItem] = useState<{ id: string, type: 'task' | 'call', currentTitle: string } | null>(null);
  const [newDate, setNewDate] = useState('');

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getItemsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dayTasks = tasks.filter(t => t.dueDate.split('T')[0] === dateStr && t.status !== Status.COMPLETED && t.status !== Status.ARCHIVED);
    
    const allDayCalls = followUps.filter(f => f.nextFollowUpDate.split('T')[0] === dateStr && f.status !== Status.COMPLETED && f.status !== Status.ARCHIVED);
    const pendingCalls = allDayCalls.filter(c => c.status === Status.PENDING);
    const inProgressCalls = allDayCalls.filter(c => c.status === Status.IN_PROGRESS);

    return { 
        dateStr, 
        tasks: dayTasks, 
        pendingCalls,
        inProgressCalls,
        total: dayTasks.length + allDayCalls.length 
    };
  };

  const renderDays = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const cells = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      cells.push(
        <div key={`empty-lead-${i}`} className="bg-slate-50/10 border-b border-r border-slate-100 min-h-[90px] sm:min-h-[120px]"></div>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const { dateStr, tasks: dayTasks, pendingCalls, inProgressCalls, total } = getItemsForDay(day);
      const isToday = dateStr === todayStr;

      const totalCalls = pendingCalls.length + inProgressCalls.length;
      const totalTasks = dayTasks.length;

      let bgClass = "bg-white hover:bg-slate-50";
      if (total > 0 && !isToday) bgClass = "bg-green-50 hover:bg-green-100/60";
      if (isToday) bgClass = "bg-blue-100/50";

      cells.push(
        <div 
          key={day} 
          onClick={() => setSelectedDay(dateStr)}
          className={`min-h-[120px] p-2 border-b border-r border-slate-200 cursor-pointer transition-all flex flex-col items-start relative ${bgClass}`}
        >
          <div className={`
            text-sm font-black w-7 h-7 flex items-center justify-center rounded-full transition-colors shrink-0
            ${isToday ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-slate-700'}
          `}>
            {day}
          </div>
          
          {total > 0 && (
            <div className="mt-auto w-full space-y-1">
                {totalCalls > 0 && (
                    <div className="flex items-center gap-1.5 bg-white rounded-lg p-2 shadow-sm border border-slate-100 w-full">
                        <i className="fa-solid fa-phone text-accent text-xs"></i>
                        <span className="text-xs font-bold text-slate-800">{totalCalls}</span>
                        <span className="text-xs font-medium text-slate-500">Call{totalCalls > 1 ? 's' : ''}</span>
                    </div>
                )}
                {totalTasks > 0 && (
                    <div className="flex items-center gap-1.5 bg-white rounded-lg p-2 shadow-sm border border-slate-100 w-full">
                        <i className="fa-solid fa-list-check text-purple-600 text-xs"></i>
                        <span className="text-xs font-bold text-slate-800">{totalTasks}</span>
                        <span className="text-xs font-medium text-slate-500">Task{totalTasks > 1 ? 's' : ''}</span>
                    </div>
                )}
            </div>
          )}
        </div>
      );
    }

    // Trailing empty cells to fill the grid (7 cols)
    const totalFilled = firstDay + daysInMonth;
    const trailingEmpty = (7 - (totalFilled % 7)) % 7;
    for (let i = 0; i < trailingEmpty; i++) {
      cells.push(
        <div key={`empty-trail-${i}`} className="bg-slate-50/10 border-b border-r border-slate-100 min-h-[90px] sm:min-h-[120px]"></div>
      );
    }

    return cells;
  };

  const getSelectedDayDetails = () => {
    if (!selectedDay) return { tasks: [], calls: [], dateStr: '' };
    const dayTasks = tasks.filter(t => t.dueDate.split('T')[0] === selectedDay && t.status !== Status.COMPLETED);
    const dayCalls = followUps.filter(f => f.nextFollowUpDate.split('T')[0] === selectedDay && f.status !== Status.COMPLETED && f.status !== Status.ARCHIVED);
    return { tasks: dayTasks, calls: dayCalls, dateStr: selectedDay };
  };

  const details = getSelectedDayDetails();

  const handleRescheduleSubmit = () => {
      if (rescheduleItem && newDate) {
          if (rescheduleItem.type === 'task') onUpdateTaskDate(rescheduleItem.id, newDate);
          else onUpdateFollowUpDate(rescheduleItem.id, newDate);
          setRescheduleItem(null);
          setNewDate('');
      }
  };

  return (
    <div className="max-w-7xl mx-auto min-h-full flex flex-col animate-fade-in pb-10">
      <div className="text-center sm:text-left mb-6 px-2">
          <h2 className="text-3xl font-black text-slate-900 leading-tight">Calendar</h2>
          <p className="text-slate-500 text-sm mt-1">Visualize and balance your monthly workload.</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-center sm:justify-start items-center mb-6 gap-4 px-2">
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200 shadow-sm w-full sm:w-auto">
            <button onClick={prevMonth} className="p-2 sm:p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-accent transition-all">
                <i className="fa-solid fa-chevron-left text-xs"></i>
            </button>
            <span className="text-sm font-black text-slate-800 flex-1 sm:min-w-[160px] text-center uppercase tracking-widest px-2">
                {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <button onClick={nextMonth} className="p-2 sm:p-3 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-accent transition-all">
                <i className="fa-solid fa-chevron-right text-xs"></i>
            </button>
            <div className="w-px h-6 bg-slate-200 mx-1"></div>
            <button onClick={goToToday} className="px-4 py-2 text-xs font-black uppercase text-accent hover:bg-blue-50 rounded-xl transition-colors">
                Today
            </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/40 border border-slate-200 flex-1 flex flex-col mx-2 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    {day}
                </div>
            ))}
        </div>
        <div className="grid grid-cols-7 flex-1 auto-rows-fr">
            {renderDays()}
        </div>
      </div>

      <Modal isOpen={!!selectedDay && !rescheduleItem} onClose={() => setSelectedDay(null)} title={selectedDay ? new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}>
          <div className="space-y-4">
              {/* Scheduled Calls Section */}
              <div>
                  <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Scheduled Calls</h4>
                      <span className={`flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${details.calls.length > 0 ? 'bg-blue-100 text-accent' : 'bg-slate-100 text-slate-500'}`}>
                          {details.calls.length}
                      </span>
                  </div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                      {details.calls.length === 0 
                          ? <p className="text-sm text-slate-400 italic py-3 text-center">No calls scheduled.</p> 
                          : details.calls.map(call => (
                              <div key={call.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50/50">
                                  <div className="flex items-center gap-3">
                                      <div className={`w-2 h-2 rounded-full ${call.status === Status.IN_PROGRESS ? 'bg-orange-400' : 'bg-slate-400'}`} title={`Status: ${call.status}`}></div>
                                      <span className="text-sm font-medium text-slate-800">{call.clientName}</span>
                                  </div>
                                  <Button variant="ghost" className="text-xs h-7 px-2.5" onClick={() => setRescheduleItem({ id: call.id, type: 'call', currentTitle: call.clientName })}>
                                    Reschedule
                                  </Button>
                              </div>
                          ))
                      }
                  </div>
              </div>

              {/* Tasks Due Section */}
              <div>
                  <div className="flex justify-between items-center pb-3 mb-3 border-b border-slate-100">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tasks Due</h4>
                      <span className={`flex items-center justify-center w-5 h-5 text-[10px] font-bold rounded-full ${details.tasks.length > 0 ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                          {details.tasks.length}
                      </span>
                  </div>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar pr-1">
                      {details.tasks.length === 0 
                          ? <p className="text-sm text-slate-400 italic py-3 text-center">No tasks due.</p> 
                          : details.tasks.map(task => (
                              <div key={task.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50/50">
                                  <div className="flex items-center gap-3 min-w-0">
                                     <div className={`w-2 h-2 rounded-full ${task.status === Status.IN_PROGRESS ? 'bg-orange-400' : 'bg-purple-400'}`} title={`Status: ${task.status}`}></div>
                                     <span className="text-sm font-medium text-slate-800 truncate">{task.title}</span>
                                  </div>
                                  <Button variant="ghost" className="text-xs h-7 px-2.5" onClick={() => setRescheduleItem({ id: task.id, type: 'task', currentTitle: task.title })}>
                                    Reschedule
                                  </Button>
                              </div>
                          ))
                      }
                  </div>
              </div>
          </div>
      </Modal>

      {rescheduleItem && (
        <Modal isOpen={!!rescheduleItem} onClose={() => setRescheduleItem(null)} title="Reschedule Item">
            <div className="space-y-6">
                <p className="text-sm text-slate-500 font-medium">Select a new date for <span className="text-slate-900 font-bold">"{rescheduleItem.currentTitle}"</span></p>
                <DatePicker value={newDate} onChange={(e) => setNewDate(e.target.value)} />
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-50">
                    <Button variant="ghost" onClick={() => setRescheduleItem(null)}>Cancel</Button>
                    <Button onClick={handleRescheduleSubmit}>Confirm New Date</Button>
                </div>
            </div>
        </Modal>
      )}
    </div>
  );
};
