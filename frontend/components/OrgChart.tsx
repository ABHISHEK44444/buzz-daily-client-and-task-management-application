

import React, { useState } from 'react';
import { OrgNode, OrgLevel } from '../types';
import { Button } from './Button';

interface TreeNodeProps {
  node: OrgNode;
  onAdd: (parentId: string) => void;
  onEdit: (node: OrgNode) => void;
  onDelete: (nodeId: string) => void;
  isRoot?: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({ node, onAdd, onEdit, onDelete, isRoot }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const getStyles = (level: OrgLevel) => {
    switch (level) {
      case 'ROOT':
        return 'bg-slate-900 text-white border-slate-700 shadow-slate-900/20';
        
      case 'FOUNDER_CIRCLE':
        return 'bg-gradient-to-br from-slate-50 to-slate-200 text-slate-900 border-slate-300 ring-2 ring-white shadow-xl shadow-slate-200/50';
      case 'CHAIRMAN_CLUB':
        return 'bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 border-slate-400 shadow-lg';
      case 'PRESIDENT_TEAM':
        return 'bg-white text-slate-900 border-slate-200 shadow-md shadow-slate-200/30';
      
      case 'MILLIONAIRE_TEAM_7500':
        return 'bg-sky-500 text-white border-sky-600 shadow-sky-500/20';
      case 'MILLIONAIRE_TEAM':
        return 'bg-emerald-800 text-white border-emerald-900 shadow-emerald-800/20';
      case 'GET_2500':
        return 'bg-amber-500 text-white border-amber-600 shadow-amber-500/20'; 
      case 'GET':
        return 'bg-red-600 text-white border-red-700 shadow-red-600/20';
      
      case 'ACTIVE_WORLD_TEAM':
        return 'bg-blue-600 text-white border-blue-700 shadow-blue-600/20';
      case 'WORLD_TEAM':
        return 'bg-orange-500 text-white border-orange-600 shadow-orange-500/20';
      case 'SUPERVISOR':
        return 'bg-green-600 text-white border-green-700 shadow-green-600/20';
        
      default:
        return 'bg-slate-500 text-white border-slate-600';
    }
  };

  const getLabelColor = (level: OrgLevel) => {
      if (['PRESIDENT_TEAM', 'CHAIRMAN_CLUB', 'FOUNDER_CIRCLE', 'ROOT'].includes(level)) {
          return 'text-slate-500';
      }
      return 'text-white/80';
  }

  return (
    <li className="flex flex-col items-center relative px-2 sm:px-4 transition-all duration-500 ease-in-out">
      {/* Node Card Container */}
      <div className="group relative z-10 py-6">
        <div 
            className={`
                flex flex-col items-center justify-center 
                px-5 py-4 rounded-2xl shadow-lg border-b-4 transition-all hover:-translate-y-2 duration-300
                min-w-[170px] max-w-[210px] text-center relative
                ${getStyles(node.level)}
            `}
        >
            {/* Avatar / Initial Circle */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-base font-bold mb-2.5 backdrop-blur-md shadow-inner ring-2 ring-white/20 ${['PRESIDENT_TEAM', 'CHAIRMAN_CLUB', 'FOUNDER_CIRCLE'].includes(node.level) ? 'bg-slate-900/5 text-slate-700' : 'bg-white/10 text-white'}`}>
                {node.avatar ? (
                     <img src={node.avatar} alt={node.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                    node.name.charAt(0)
                )}
            </div>
            
            <h4 className="font-extrabold text-sm leading-tight break-words w-full px-1">{node.name}</h4>
            <p className={`text-[10px] uppercase tracking-[0.1em] font-bold mt-1.5 ${getLabelColor(node.level)}`}>
                {node.role}
            </p>

            {/* Unified Floating Action Bar */}
            <div className="absolute -top-3 -right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100 z-30">
                <button 
                    onClick={(e) => { e.stopPropagation(); onEdit(node); }}
                    className="w-8 h-8 rounded-full bg-white text-slate-600 border border-slate-200 shadow-xl flex items-center justify-center hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all active:scale-95"
                    title="Edit Member"
                >
                    <i className="fa-solid fa-pen text-[10px] block"></i>
                </button>
                {!isRoot && (
                  <button 
                      onClick={(e) => { e.stopPropagation(); onDelete(node.id); }}
                      className="w-8 h-8 rounded-full bg-white text-slate-600 border border-slate-200 shadow-xl flex items-center justify-center hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95"
                      title="Delete Member"
                  >
                      <i className="fa-solid fa-trash text-[10px] block"></i>
                  </button>
                )}
                <button
                    onClick={(e) => { e.stopPropagation(); onAdd(node.id); setIsExpanded(true); }}
                    className="w-8 h-8 rounded-full bg-white text-slate-600 border border-slate-200 shadow-xl flex items-center justify-center hover:bg-accent hover:text-white hover:border-accent transition-all active:scale-95"
                    title="Add Child Member"
                >
                    <i className="fa-solid fa-plus text-[10px] block"></i>
                </button>
            </div>

            {/* Expand/Collapse Toggle Button */}
            {hasChildren && (
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`absolute -bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-slate-700 border border-slate-200 flex items-center justify-center shadow-md z-20 transition-all duration-300 hover:bg-slate-50 hover:scale-110 ${isExpanded ? '' : 'animate-pulse ring-2 ring-accent/20'}`}
                title={isExpanded ? "Collapse Branch" : "Expand Branch"}
            >
                <i className={`fa-solid fa-chevron-down text-[10px] transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`}></i>
            </button>
            )}
        </div>
      </div>

      {/* Children Section with Animation */}
      {hasChildren && (
        <div className={`transition-all duration-500 ease-in-out overflow-hidden flex flex-col items-center ${isExpanded ? 'max-h-[5000px] opacity-100' : 'max-h-0 opacity-0 transform -translate-y-4'}`}>
            <ul className="flex pt-12 relative">
                {node.children!.map((child) => (
                    <TreeNode 
                        key={child.id} 
                        node={child} 
                        onAdd={onAdd}
                        onEdit={onEdit}
                        onDelete={onDelete}
                    />
                ))}
            </ul>
        </div>
      )}
    </li>
  );
};

interface OrgChartProps {
    data: OrgNode | null;
    onAddNode: (parentId: string | null) => void;
    onEditNode: (node: OrgNode) => void;
    onDeleteNode: (nodeId: string) => void;
}

export const OrgChart: React.FC<OrgChartProps> = ({ data, onAddNode, onEditNode, onDeleteNode }) => {
  return (
    <div className="w-full h-full flex flex-col animate-fade-in">
       <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 gap-6">
            <div>
                <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">My Organization</h2>
                <p className="text-slate-500 text-sm mt-1">Manage your team hierarchy and business levels</p>
            </div>
            
            {/* Legend */}
            <div className="flex flex-wrap gap-x-5 gap-y-3 text-[10px] font-bold uppercase tracking-wider bg-white p-4 rounded-2xl border border-slate-200 shadow-sm max-w-full">
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-green-600 shadow-sm group-hover:scale-125 transition-transform"></span> Supervisor</div>
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-orange-500 shadow-sm group-hover:scale-125 transition-transform"></span> World Team</div>
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-blue-600 shadow-sm group-hover:scale-125 transition-transform"></span> Active WT</div>
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-red-600 shadow-sm group-hover:scale-125 transition-transform"></span> GET</div>
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-amber-500 shadow-sm group-hover:scale-125 transition-transform"></span> GET 2500</div>
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-emerald-800 shadow-sm group-hover:scale-125 transition-transform"></span> Millionaire</div>
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-sky-500 shadow-sm group-hover:scale-125 transition-transform"></span> Mill 7500</div>
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-white border-2 border-slate-200 shadow-sm group-hover:scale-125 transition-transform"></span> President</div>
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-slate-300 shadow-sm group-hover:scale-125 transition-transform"></span> Chairman</div>
                <div className="flex items-center gap-2 group"><span className="w-3 h-3 rounded-full bg-slate-100 border-2 border-slate-200 shadow-sm group-hover:scale-125 transition-transform"></span> Founder</div>
            </div>
       </div>

       {/* Chart Container */}
       <div className="flex-1 bg-slate-50 rounded-3xl border-2 border-white shadow-[inset_0_2px_10px_rgba(0,0,0,0.05)] p-6 md:p-12 overflow-x-auto overflow-y-auto custom-scrollbar flex justify-center items-start min-h-[600px] relative">
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #0f172a 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            
            {data ? (
                <div className="org-tree relative z-10">
                    <ul className="flex">
                        <TreeNode 
                            node={data} 
                            onAdd={onAddNode}
                            onEdit={onEditNode}
                            onDelete={onDeleteNode}
                            isRoot={true}
                        />
                    </ul>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-300 mb-2">
                        <i className="fa-solid fa-sitemap text-4xl"></i>
                    </div>
                    <h3 className="text-xl font-bold text-slate-900">Build Your Organization</h3>
                    <p className="text-slate-500 max-w-xs">You haven't added any team members yet. Start by creating the root of your organization.</p>
                    <Button onClick={() => onAddNode(null)} className="px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-accent/20">
                        <i className="fa-solid fa-plus mr-2"></i> Add First Leader
                    </Button>
                </div>
            )}
       </div>

       <style>{`
        .org-tree ul {
            padding-top: 24px; 
            position: relative;
            display: flex;
            justify-content: center;
        }

        .org-tree li {
            float: left; text-align: center;
            list-style-type: none;
            position: relative;
            padding: 24px 8px 0 8px;
        }

        .org-tree li::before, .org-tree li::after {
            content: '';
            position: absolute; top: 0; right: 50%;
            border-top: 2px solid #cbd5e1;
            width: 50%; height: 24px;
            transition: border-color 0.3s ease;
        }
        .org-tree li::after {
            right: auto; left: 50%;
            border-left: 2px solid #cbd5e1;
        }

        .org-tree li:only-child::after, .org-tree li:only-child::before {
            display: none;
        }
        .org-tree li:only-child { padding-top: 0; }
        .org-tree li:first-child::before, .org-tree li:last-child::after {
            border: 0 none;
        }
        
        .org-tree li:last-child::before {
            border-right: 2px solid #cbd5e1;
            border-radius: 0 8px 0 0;
        }
        .org-tree li:first-child::after {
            border-radius: 8px 0 0 0;
        }

        .org-tree ul::before {
            content: '';
            position: absolute; top: 0; left: 50%;
            border-left: 2px solid #cbd5e1;
            width: 0; height: 24px;
            transition: border-color 0.3s ease;
        }
       `}</style>
    </div>
  );
};
