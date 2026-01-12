
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
    const dayTasks = tasks.filter(t => t.dueDate === dateStr && t.status !== Status.COMPLETED && t.status !== Status.ARCHIVED);
    
    const allDayCalls = followUps.filter(f => f.nextFollowUpDate === dateStr && f.status !== Status.COMPLETED && f.status !== Status.ARCHIVED);
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

      let bgClass = "bg-white hover:bg-slate-50";
      if (total > 0) bgClass = "bg-blue-50/20 hover:bg-blue-50/40";
      if (isToday) bgClass = "bg-blue-50/50";

      cells.push(
        <div 
          key={day} 
          onClick={() => setSelectedDay(dateStr)}
          className={`min-h-[90px] sm:min-h-[120px] p-1 sm:p-2 border-b border-r border-slate-200 cursor-pointer transition-all flex flex-col items-start relative ${bgClass}`}
        >
          <div className="flex items-center justify-between w-full mb-1 sm:mb-2">
             <div className={`
               text-xs sm:text-sm font-black w-6 h-6 sm:w-8 sm:h-8 flex items-center justify-center rounded-full transition-colors shrink-0
               ${isToday ? 'bg-accent text-white shadow-md shadow-accent/20' : 'text-slate-700'}
             `}>
               {day}
             </div>
          </div>
          
          <div className="flex flex-col items-start w-full gap-1 mt-auto pb-1">
              {dayTasks.length > 0 && (
                  <div className="flex items-center gap-1.5 text-purple-700 bg-purple-50 py-0.5 px-1.5 rounded-md border border-purple-100 shadow-sm w-fit" title={`${dayTasks.length} task(s) due`}>
                      <i className="fa-solid fa-list-check text-[9px]"></i>
                      <span className="text-[10px] sm:text-[11px] font-black leading-none">{dayTasks.length}</span>
                  </div>
              )}
              {pendingCalls.length > 0 && (
                  <div className="flex items-center gap-1.5 text-slate-700 bg-slate-100 py-0.5 px-1.5 rounded-md border border-slate-200 shadow-sm w-fit" title={`${pendingCalls.length} pending call(s)`}>
                      <i className="fa-solid fa-phone text-slate-400 text-[9px]"></i>
                      <span className="text-[10px] sm:text-[11px] font-black leading-none">{pendingCalls.length}</span>
                  </div>
              )}
              {inProgressCalls.length > 0 && (
                  <div className="flex items-center gap-1.5 text-orange-700 bg-orange-50 py-0.5 px-1.5 rounded-md border border-orange-100 shadow-sm w-fit" title={`${inProgressCalls.length} in-progress call(s)`}>
                      <i className="fa-solid fa-phone-volume text-orange-500 text-[9px]"></i>
                      <span className="text-[10px] sm:text-[11px] font-black leading-none">{inProgressCalls.length}</span>
                  </div>
              )}
          </div>
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
    const dayTasks = tasks.filter(t => t.dueDate === selectedDay && t.status !== Status.COMPLETED);
    const dayCalls = followUps.filter(f => f.nextFollowUpDate === selectedDay && f.status !== Status.COMPLETED && f.status !== Status.ARCHIVED);
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

      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-6 text-[10px] font-black uppercase tracking-widest text-slate-400 justify-center px-4">
          <div className="flex items-center gap-2"><i className="fa-solid fa-list-check text-purple-700"></i> Task Due</div>
          <div className="flex items-center gap-2"><i className="fa-solid fa-phone text-slate-500"></i> Pending Call</div>
          <div className="flex items-center gap-2"><i className="fa-solid fa-phone-volume text-orange-500"></i> In-Progress Call</div>
      </div>

      <Modal isOpen={!!selectedDay && !rescheduleItem} onClose={() => setSelectedDay(null)} title={selectedDay ? new Date(selectedDay).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : ''}>
          <div className="space-y-6">
              <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                      <span>Scheduled Calls</span>
                      <span className="bg-blue-50 text-accent px-2 py-0.5 rounded-full">{details.calls.length}</span>
                  </h4>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                      {details.calls.length === 0 ? <p className="text-xs text-slate-400 italic">No calls today.</p> : details.calls.map(call => (
                          <div key={call.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">{call.clientName.charAt(0)}</div>
                                  <span className="text-sm font-bold text-slate-800">{call.clientName}</span>
                              </div>
                              <Button variant="ghost" className="text-[10px] h-7 px-2" onClick={() => setRescheduleItem({ id: call.id, type: 'call', currentTitle: call.clientName })}>Reschedule</Button>
                          </div>
                      ))}
                  </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
                      <span>Tasks Due</span>
                      <span className="bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full">{details.tasks.length}</span>
                  </h4>
                  <div className="space-y-2 max-h-[150px] overflow-y-auto custom-scrollbar">
                      {details.tasks.length === 0 ? <p className="text-xs text-slate-400 italic">No tasks today.</p> : details.tasks.map(task => (
                          <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                              <span className="text-sm font-bold text-slate-800 truncate">{task.title}</span>
                              <Button variant="ghost" className="text-[10px] h-7 px-2" onClick={() => setRescheduleItem({ id: task.id, type: 'task', currentTitle: task.title })}>Reschedule</Button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
          <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedDay(null)} className="w-full sm:w-auto">Close</Button>
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
