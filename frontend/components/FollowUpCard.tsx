
import React, { useState, useEffect } from 'react';
import { FollowUp, Status, Priority, ClientType } from '../types.ts';
import { Button } from './Button.tsx';
import { Modal } from './Modal.tsx';
import { DatePicker } from './DatePicker.tsx';

interface FollowUpCardProps {
  followUp: FollowUp;
  onStatusChange: (id: string, status: Status) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onCompleteCycle: (id: string, nextDate: string, nextNotes: string, changes?: { status?: Status, clientType?: ClientType }) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

type CallOutcome = 'CONNECTED' | 'VOICEMAIL' | 'SALE' | 'WRONG' | null;

export const FollowUpCard: React.FC<FollowUpCardProps> = ({ followUp, onStatusChange, onPriorityChange, onCompleteCycle, onDelete, onEdit }) => {
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [selectedOutcome, setSelectedOutcome] = useState<CallOutcome>(null);
  const [outcomeDate, setOutcomeDate] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const priorityColorClass = followUp.priority === Priority.HIGH ? 'border-l-[10px] border-l-red-500' : 
                            followUp.priority === Priority.MEDIUM ? 'border-l-[10px] border-l-orange-500' :
                            'border-l-[10px] border-l-blue-400';

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const dateOnly = dateStr.split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateOnly === today) return 'Today';
    if (dateOnly === yesterdayStr) return 'Yesterday';
    
    const [year, month, day] = dateOnly.split('-');
    return `${day}/${month}/${year}`;
  };

  const getWhatsAppLink = (number: string) => {
    const cleanNumber = number.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  // Sync default values when outcome changes
  useEffect(() => {
    if (!selectedOutcome) return;
    
    const today = new Date();
    let defaultDate = new Date();

    switch (selectedOutcome) {
      case 'CONNECTED':
        defaultDate.setDate(today.getDate() + 7);
        setOutcomeNotes(`Discussed details with ${followUp.clientName}, need to follow up again.`);
        break;
      case 'VOICEMAIL':
        defaultDate.setDate(today.getDate() + 1);
        setOutcomeNotes(`Left voicemail for ${followUp.clientName}.`);
        break;
      case 'SALE':
        defaultDate.setMonth(today.getMonth() + 1);
        setOutcomeNotes(`Success! Sale closed with ${followUp.clientName}.`);
        break;
      case 'WRONG':
        setOutcomeNotes(`Marked as wrong number for ${followUp.clientName}.`);
        break;
    }
    setOutcomeDate(defaultDate.toISOString().split('T')[0]);
  }, [selectedOutcome]);

  const handleConfirmOutcome = () => {
    if (!selectedOutcome) return;

    let changes: { status?: Status, clientType?: ClientType } = {};

    if (selectedOutcome === 'SALE') {
      changes.clientType = ClientType.USER;
    } else if (selectedOutcome === 'WRONG') {
      changes.status = Status.ARCHIVED;
    }

    onCompleteCycle(followUp.id, outcomeDate, outcomeNotes, changes);
    setShowCompleteModal(false);
    setSelectedOutcome(null);
  };

  const OutcomeOption = ({ id, icon, label, sub, activeColor }: { id: CallOutcome, icon: string, label: string, sub: string, activeColor: string }) => {
    const isActive = selectedOutcome === id;
    
    const colorVariants: Record<string, string> = {
      emerald: isActive ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'bg-white border-slate-200 hover:border-emerald-200',
      orange: isActive ? 'bg-orange-50 border-orange-500 ring-1 ring-orange-500' : 'bg-white border-slate-200 hover:border-orange-200',
      blue: isActive ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500' : 'bg-white border-slate-200 hover:border-blue-200',
      red: isActive ? 'bg-red-50 border-red-500 ring-1 ring-red-500' : 'bg-white border-slate-200 hover:border-red-200',
    };

    const iconBgVariants: Record<string, string> = {
      emerald: isActive ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400',
      orange: isActive ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400',
      blue: isActive ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-400',
      red: isActive ? 'bg-red-500 text-white' : 'bg-slate-100 text-slate-400',
    };

    return (
      <button 
        onClick={() => setSelectedOutcome(id)}
        className={`flex items-start gap-4 p-4 rounded-2xl border transition-all text-left group w-full ${colorVariants[activeColor]}`}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-colors flex-shrink-0 ${iconBgVariants[activeColor]}`}>
          <i className={`fa-solid ${icon}`}></i>
        </div>
        <div>
          <p className={`font-bold text-sm ${isActive ? 'text-slate-900' : 'text-slate-800'}`}>{label}</p>
          <p className={`text-[10px] font-medium ${isActive ? 'text-slate-500' : 'text-slate-400'}`}>{sub}</p>
        </div>
      </button>
    );
  };

  return (
    <>
      <div className={`bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all ${priorityColorClass} flex flex-col h-full relative overflow-hidden`}>
        <div className="flex justify-between items-start mb-6">
          <div className="flex items-center gap-4">
             <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm ring-1 ring-slate-100">
               {followUp.avatarUrl ? (
                 <img src={followUp.avatarUrl} alt="" className="w-full h-full object-cover" />
               ) : (
                 <span className="text-xl font-black text-slate-300 uppercase">{followUp.clientName.charAt(0)}</span>
               )}
             </div>
             <div>
               <h4 className="font-bold text-slate-900 text-xl leading-tight lowercase">{followUp.clientName}</h4>
               <p className="text-sm font-medium text-slate-500 lowercase">{followUp.company || 'no company'}</p>
             </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="text-[10px] font-black px-3 py-1 bg-blue-50 text-accent border border-blue-100 rounded-md uppercase tracking-wider">
              {followUp.clientType}
            </span>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2.5 py-1 shadow-sm">
               <i className={`fa-solid ${followUp.priority === Priority.HIGH ? 'fa-fire text-red-500' : 'fa-bell text-orange-400'} text-[11px]`}></i>
               <select 
                 className="text-[11px] font-black text-slate-700 uppercase bg-transparent border-none p-0 focus:ring-0 cursor-pointer outline-none"
                 value={followUp.priority}
                 onChange={(e) => onPriorityChange(followUp.id, e.target.value as Priority)}
               >
                 {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
               </select>
               <i className="fa-solid fa-chevron-down text-[8px] text-slate-400"></i>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-center text-sm text-slate-500 gap-4 group">
            <i className="fa-solid fa-mobile-screen-button w-4 text-slate-300"></i>
            <a 
                href={getWhatsAppLink(followUp.mobile)} 
                target="_blank" 
                rel="noopener noreferrer"
                className="font-bold text-slate-600 hover:text-emerald-600 transition-colors flex items-center gap-2"
                title="Open in WhatsApp"
            >
                {followUp.mobile}
                <i className="fa-brands fa-whatsapp text-emerald-500 text-lg"></i>
            </a>
          </div>
          <div className="flex items-center text-sm text-slate-500 gap-4">
            <i className="fa-solid fa-rotate w-4 text-slate-300"></i>
            <span className="font-bold text-slate-600">{followUp.frequency} Follow-up</span>
          </div>
          <div className="flex items-center text-sm text-slate-500 gap-4">
            <i className="fa-regular fa-calendar w-4 text-slate-300"></i>
            <span className="font-bold text-slate-600">Next Call: <strong className={formatDisplayDate(followUp.nextFollowUpDate) === 'Yesterday' || formatDisplayDate(followUp.nextFollowUpDate) === 'Today' ? 'text-red-500' : 'text-slate-900'}>
              {formatDisplayDate(followUp.nextFollowUpDate)}
            </strong></span>
          </div>
        </div>

        <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl text-xs text-slate-500 leading-relaxed italic mb-6 shadow-inner">
          "{followUp.notes || 'done'}"
        </div>

        <div className="mt-auto flex items-center justify-between pt-6 border-t border-slate-100">
          <div className="flex gap-5 items-center">
             <button onClick={() => onEdit(followUp.id)} className="text-slate-300 hover:text-accent transition-all transform hover:scale-110">
               <i className="fa-regular fa-pen-to-square text-xl"></i>
             </button>
             <button onClick={() => onDelete(followUp.id)} className="text-slate-300 hover:text-red-500 transition-all transform hover:scale-110">
               <i className="fa-regular fa-trash-can text-xl"></i>
             </button>
          </div>
          <button 
            className="flex items-center gap-2.5 rounded-xl font-black text-xs uppercase tracking-[0.1em] bg-blue-500 hover:bg-blue-600 text-white px-8 py-3.5 shadow-xl shadow-blue-500/30 transition-all active:scale-95" 
            onClick={() => {
                setSelectedOutcome(null);
                setShowCompleteModal(true);
            }}
          >
            <i className="fa-solid fa-check text-sm"></i> MARK DONE
          </button>
        </div>
      </div>

      <Modal isOpen={showCompleteModal} onClose={() => setShowCompleteModal(false)} title="How did the call go?">
        <div className="space-y-6 pt-2">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <OutcomeOption 
                id="CONNECTED" 
                icon="fa-comments" 
                label="Connected" 
                sub="Next call: Weekly" 
                activeColor="emerald"
              />
              <OutcomeOption 
                id="VOICEMAIL" 
                icon="fa-voicemail" 
                label="Left Voicemail" 
                sub="Retry in: 1 Day" 
                activeColor="orange"
              />
              <OutcomeOption 
                id="SALE" 
                icon="fa-handshake" 
                label="Sale Closed" 
                sub="Convert to User" 
                activeColor="blue"
              />
              <OutcomeOption 
                id="WRONG" 
                icon="fa-user-slash" 
                label="Wrong Number" 
                sub="Archive Client" 
                activeColor="red"
              />
           </div>

           {selectedOutcome && selectedOutcome !== 'WRONG' && (
             <div className="space-y-6 animate-fade-in pt-4 border-t border-slate-100">
                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Next Follow Up Date</label>
                   <div className="bg-[#fffef5] rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                      <DatePicker value={outcomeDate} onChange={(e) => setOutcomeDate(e.target.value)} className="px-4 py-3 bg-transparent border-none text-slate-800 font-bold" />
                   </div>
                </div>

                <div>
                   <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Notes for Next Call</label>
                   <div className="relative group">
                      <div className="absolute top-4 left-4 text-slate-400 group-focus-within:text-accent transition-colors">
                         <i className="fa-solid fa-pen-to-square"></i>
                      </div>
                      <textarea 
                        value={outcomeNotes}
                        onChange={(e) => setOutcomeNotes(e.target.value)}
                        placeholder="Discussed X, need to follow up on Y..."
                        className="w-full bg-[#fffef5] border border-slate-200 rounded-2xl pl-12 pr-4 py-4 text-sm text-slate-700 min-h-[120px] focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all resize-none shadow-inner"
                      />
                   </div>
                </div>
             </div>
           )}

           {selectedOutcome === 'WRONG' && (
             <div className="bg-red-50 border border-red-100 p-6 rounded-2xl flex items-start gap-4 animate-fade-in mt-4 shadow-sm">
                <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center flex-shrink-0 shadow-md">
                   <i className="fa-solid fa-triangle-exclamation text-xs"></i>
                </div>
                <div className="text-sm text-red-900 leading-relaxed font-medium">
                   This client will be archived and removed from your active follow-up lists. You can still access them in the database if needed.
                </div>
             </div>
           )}

           <div className="flex justify-end gap-6 pt-6 border-t border-slate-100 items-center">
              <button 
                className="text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors"
                onClick={() => setShowCompleteModal(false)}
              >
                Cancel
              </button>
              <button 
                disabled={!selectedOutcome}
                onClick={handleConfirmOutcome}
                className={`flex items-center gap-2 px-10 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all shadow-xl ${
                  selectedOutcome 
                    ? 'bg-blue-500 text-white shadow-blue-500/30 hover:bg-blue-600 cursor-pointer active:scale-95' 
                    : 'bg-slate-100 text-slate-300 cursor-not-allowed shadow-none'
                }`}
              >
                <i className="fa-solid fa-check"></i>
                Confirm
              </button>
           </div>
        </div>
      </Modal>
    </>
  );
};
