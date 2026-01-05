
import React from 'react';
import { FollowUp, Priority, ClientType } from '../types';
import { Button } from './Button';

interface CompactFollowUpProps {
  followUp: FollowUp;
  onMarkDone: (id: string) => void;
  onSelect: (id: string) => void;
  isActive?: boolean;
}

export const CompactFollowUp: React.FC<CompactFollowUpProps> = ({ followUp, onMarkDone, onSelect, isActive }) => {
  const getPriorityColor = (p: Priority) => {
    switch (p) {
      case Priority.HIGH: return 'bg-red-500';
      case Priority.MEDIUM: return 'bg-orange-500';
      case Priority.LOW: return 'bg-blue-500';
      default: return 'bg-slate-300';
    }
  };

  const getWhatsAppLink = (mobile: string) => {
    const cleanNumber = mobile.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}`;
  };

  const getClientTypeIcon = (type: ClientType) => {
    switch (type) {
      case ClientType.PROSPECT: return 'fa-bullseye text-indigo-500';
      case ClientType.USER: return 'fa-user-check text-emerald-500';
      case ClientType.ASSOCIATE: return 'fa-handshake text-purple-500';
      default: return 'fa-user text-slate-400';
    }
  };

  return (
    <div 
      onClick={() => onSelect(followUp.id)}
      className={`group flex items-center gap-4 p-3 rounded-xl border transition-all cursor-pointer ${
        isActive 
          ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-100 shadow-sm' 
          : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      <div className="relative">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
          {followUp.avatarUrl ? (
            <img src={followUp.avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-xs font-bold text-slate-500">{followUp.clientName.charAt(0)}</span>
          )}
        </div>
        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getPriorityColor(followUp.priority)}`}></div>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className={`text-sm font-bold truncate ${isActive ? 'text-blue-900' : 'text-slate-800'}`}>
            {followUp.clientName}
          </h4>
          <i className={`fa-solid ${getClientTypeIcon(followUp.clientType)} text-[10px]`}></i>
        </div>
        <p className="text-[10px] text-slate-500 truncate">{followUp.company}</p>
      </div>

      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <a 
          href={getWhatsAppLink(followUp.mobile)}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
          title="WhatsApp Chat"
        >
          <i className="fa-brands fa-whatsapp text-xs"></i>
        </a>
        <a 
          href={`tel:${followUp.mobile}`} 
          onClick={(e) => e.stopPropagation()}
          className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-accent hover:text-white transition-colors"
          title="Call Client"
        >
          <i className="fa-solid fa-phone text-xs"></i>
        </a>
        <button 
          onClick={(e) => {
            e.stopPropagation();
            onMarkDone(followUp.id);
          }}
          className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors"
          title="Complete Task"
        >
          <i className="fa-solid fa-check text-xs"></i>
        </button>
      </div>
    </div>
  );
};
