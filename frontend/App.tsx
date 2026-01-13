
import React, { useState, useEffect, useMemo } from 'react';
import { ViewState, Task, FollowUp, Status, ClientType, Frequency, OrgNode, OrgLevel, UserProfile } from './types';
import { INITIAL_TASKS, INITIAL_FOLLOW_UPS, INITIAL_ORG_DATA, INITIAL_USER_PROFILE } from './constants';
import { apiFetch } from './services/api';
import { FollowUpCard } from './components/FollowUpCard';
import { TaskList } from './components/TaskList';
import { OrgChart } from './components/OrgChart';
import { CalendarView } from './components/CalendarView';
import { ProfileView } from './components/ProfileView';
import { Button } from './components/Button';
import { Modal } from './components/Modal';
import { DatePicker } from './components/DatePicker';
import { LoginPage } from './components/LoginPage';
import { PhoneInput } from './components/PhoneInput';

const STORAGE_KEYS = {
  AUTH_TOKEN: 'biztrack_token',
  ACTIVE_USER_EMAIL: 'biztrack_active_email',
  VIEW: 'biztrack_current_view'
};

const ORG_LEVELS: OrgLevel[] = [
  'SUPERVISOR', 'WORLD_TEAM', 'ACTIVE_WORLD_TEAM', 'GET', 'GET_2500', 
  'MILLIONAIRE_TEAM', 'MILLIONAIRE_TEAM_7500', 'PRESIDENT_TEAM', 
  'CHAIRMAN_CLUB', 'FOUNDER_CIRCLE'
];

type SortableFollowUpKeys = 'clientName' | 'clientType' | 'nextFollowUpDate';

const App: React.FC = () => {
  // Authentication & User State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [currentView, setCurrentView] = useState<ViewState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW);
    return (saved as ViewState) || ViewState.DASHBOARD;
  });

  const [tasks, setTasks] = useState<Task[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [orgData, setOrgData] = useState<OrgNode | null>(null);
  const [isBackendLive, setIsBackendLive] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // For data loading, not auth
  const [isRetrying, setIsRetrying] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filters for Database Table
  const [dbSearch, setDbSearch] = useState('');
  const [dbTypeFilter, setDbTypeFilter] = useState<string>('All');
  const [dbStatusFilter, setDbStatusFilter] = useState<string>('All');
  const [sortConfig, setSortConfig] = useState<{ key: SortableFollowUpKeys; direction: 'asc' | 'desc' }>({ key: 'clientName', direction: 'asc' });


  // Modals State
  const [isAddingFollowUp, setIsAddingFollowUp] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState<FollowUp | null>(null);
  const [activeDetailModal, setActiveDetailModal] = useState<'clients' | 'calls' | 'tasks' | 'efficiency' | null>(null);

  // Org Chart Edit State
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [editingMember, setEditingMember] = useState<OrgNode | null>(null);
  const [memberParentId, setMemberParentId] = useState<string | null>(null);
  const [memberForm, setMemberForm] = useState({ name: '', role: '', level: 'SUPERVISOR' as OrgLevel });

  const [newFollowUp, setNewFollowUp] = useState<Partial<FollowUp>>({
    clientName: '', mobile: '', email: '', clientType: ClientType.PROSPECT,
    frequency: Frequency.WEEKLY, notes: '',
    nextFollowUpDate: new Date().toISOString().split('T')[0], status: Status.PENDING
  });

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    setIsMobileMenuOpen(false);
    localStorage.setItem(STORAGE_KEYS.VIEW, view);
  };

  const handleLogout = () => {
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);
    localStorage.removeItem(STORAGE_KEYS.VIEW);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentView(ViewState.DASHBOARD);
  };
  
  // Session Verification on App Load
  useEffect(() => {
    const verifySession = async () => {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const email = localStorage.getItem(STORAGE_KEYS.ACTIVE_USER_EMAIL);

      if (token && email) {
        try {
          const userProfileData = await apiFetch('/api/user', email);
          if (userProfileData) {
            const userProfile: UserProfile = {
              name: userProfileData.name,
              email: userProfileData.email,
              role: userProfileData.role,
              team: userProfileData.team,
              status: userProfileData.status,
              lastLogin: new Date(userProfileData.lastLogin).toLocaleString(),
              joinedDate: new Date(userProfileData.joinedDate).toISOString().split('T')[0],
              passwordLastChanged: userProfileData.passwordLastChanged,
              avatarUrl: userProfileData.avatarUrl,
              bio: userProfileData.bio,
              phone: userProfileData.phone,
              agendaReminderTime: userProfileData.agendaReminderTime,
            };
            setCurrentUser(userProfile);
            setIsAuthenticated(true);
          } else {
            handleLogout();
          }
        } catch (error) {
          console.error("Session validation failed, logging out:", error);
          handleLogout();
        }
      }
      setIsAuthLoading(false);
    };
    verifySession();
  }, []);
  
  // Open modal and populate form when editing a client
  useEffect(() => {
    if (editingFollowUp) {
      setNewFollowUp(editingFollowUp);
      setIsAddingFollowUp(true);
    }
  }, [editingFollowUp]);

  const buildOrgTree = (members: any[]): OrgNode | null => {
    if (!members || members.length === 0) return null;
    const idMap: Record<string, OrgNode> = {};
    members.forEach(m => {
      const id = m._id?.toString() || m.id?.toString();
      idMap[id] = { id, name: m.name, role: m.role, level: m.level as OrgLevel, avatar: m.avatarUrl, children: [] };
    });
    let root: OrgNode | null = null;
    members.forEach(m => {
      const id = m._id?.toString() || m.id?.toString();
      const node = idMap[id];
      const parentId = m.parentId?.toString();
      if (parentId && idMap[parentId]) {
        idMap[parentId].children?.push(node);
      } else if (!root) {
        root = node; 
      }
    });
    return root;
  };

  const refreshOrgData = async () => {
    if (!currentUser) return;
    try {
      const remoteOrg = await apiFetch('/api/org', currentUser.email);
      setOrgData(buildOrgTree(remoteOrg));
    } catch (err) {
      setOrgData(INITIAL_ORG_DATA);
    }
  };

  const loadData = async () => {
    if (!currentUser) return;
    setIsLoading(true);
    setIsRetrying(true);
    try {
      const [remoteTasks, remoteFollowUps, remoteOrg] = await Promise.all([
        apiFetch('/api/tasks', currentUser.email),
        apiFetch('/api/followups', currentUser.email),
        apiFetch('/api/org', currentUser.email)
      ]);
      setTasks(remoteTasks.map((t: any) => ({ ...t, id: t._id || t.id })));
      setFollowUps(remoteFollowUps.map((f: any) => ({ ...f, id: f._id || f.id })));
      setOrgData(buildOrgTree(remoteOrg));
      setIsBackendLive(true);
    } catch (err) {
      setIsBackendLive(false);
      setTasks([]);
      setFollowUps([]);
      setOrgData(null);
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && currentUser) {
      loadData();
    }
  }, [isAuthenticated, currentUser]);

  const handleUpdateUser = async (updatedProfile: UserProfile) => {
    if (!currentUser || !orgData) return;

    setIsLoading(true);
    try {
      // API call to update the user profile
      await apiFetch('/api/user', currentUser.email, {
        method: 'PATCH',
        body: JSON.stringify(updatedProfile),
      });

      // API call to update the corresponding root org member
      const newLevel = updatedProfile.role.toUpperCase().replace(/ /g, '_') as OrgLevel;
      await apiFetch(`/api/org/${orgData.id}`, currentUser.email, {
        method: 'PATCH',
        body: JSON.stringify({
          name: updatedProfile.name,
          role: updatedProfile.role,
          level: newLevel,
        }),
      });

      // Refresh all data from the backend to ensure UI consistency
      await loadData();
      alert('Profile updated successfully!');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      alert(`Error updating profile: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Task Actions
  const handleAddTask = async (newTask: Omit<Task, 'id'>) => {
    if (!currentUser) return;
    try {
      if (isBackendLive) {
        const saved = await apiFetch('/api/tasks', currentUser.email, { method: 'POST', body: JSON.stringify(newTask) });
        if (saved) setTasks(prev => [{ ...saved, id: saved._id || saved.id }, ...prev]);
      } else {
        setTasks(prev => [{ ...newTask, id: Date.now().toString() }, ...prev]);
      }
    } catch (err) {
      setTasks(prev => [{ ...newTask, id: Date.now().toString() }, ...prev]);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!currentUser) return;
    try {
      if (isBackendLive) {
        await apiFetch(`/api/tasks/${id}`, currentUser.email, { method: 'DELETE' });
      }
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (err) {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
  };

  const handleToggleTaskStatus = async (id: string) => {
    if (!currentUser) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const newStatus = task.status === Status.COMPLETED ? Status.PENDING : Status.COMPLETED;
    
    try {
      if (isBackendLive) {
        const updated = await apiFetch(`/api/tasks/${id}`, currentUser.email, {
          method: 'PATCH',
          body: JSON.stringify({ status: newStatus })
        });
        if (updated) {
          setTasks(prev => prev.map(t => t.id === id ? { ...updated, id: updated._id || updated.id } : t));
          return;
        }
      }
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    } catch (err) {
      setTasks(prev => prev.map(t => t.id === id ? { ...t, status: newStatus } : t));
    }
  };

  // Follow-up Actions
  const handleFollowUpStatusChange = async (id: string, status: Status) => {
    if (!currentUser) return;
    try {
      if (isBackendLive) {
        const updated = await apiFetch(`/api/followups/${id}`, currentUser.email, {
          method: 'PATCH',
          body: JSON.stringify({ status })
        });
        if (updated) {
          setFollowUps(prev => prev.map(f => f.id === id ? { ...updated, id: updated._id || updated.id } : f));
          return;
        }
      }
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    } catch (err) {
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, status } : f));
    }
  };

  const handleCompleteFollowUpCycle = async (id: string, nextDate: string, nextNotes?: string, changes?: { status?: Status, clientType?: ClientType }) => {
    if (!currentUser) return;
    const existing = followUps.find(f => f.id === id);
    const updates = { 
      nextFollowUpDate: nextDate, 
      notes: nextNotes !== undefined ? nextNotes : (existing?.notes || ''), 
      lastContactDate: new Date().toISOString().split('T')[0],
      ...changes
    };
    try {
      if (isBackendLive) {
        const updated = await apiFetch(`/api/followups/${id}`, currentUser.email, {
          method: 'PATCH',
          body: JSON.stringify(updates)
        });
        if (updated) {
          setFollowUps(prev => prev.map(f => f.id === id ? { ...updated, id: updated._id || updated.id } : f));
          return;
        }
      }
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    } catch (err) {
      setFollowUps(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    }
  };

  const handleDeleteFollowUp = async (id: string) => {
    if (!currentUser) return;
    try {
      if (isBackendLive) {
        await apiFetch(`/api/followups/${id}`, currentUser.email, { method: 'DELETE' });
      }
      setFollowUps(prev => prev.filter(f => f.id !== id));
    } catch (err) {
      setFollowUps(prev => prev.filter(f => f.id !== id));
    }
  };
  
  const handleCloseFollowUpModal = () => {
    setIsAddingFollowUp(false);
    setEditingFollowUp(null);
    setNewFollowUp({
      clientName: '', mobile: '', email: '', clientType: ClientType.PROSPECT,
      frequency: Frequency.WEEKLY, notes: '',
      nextFollowUpDate: new Date().toISOString().split('T')[0], status: Status.PENDING
    });
  };

  const handleUpdateFollowUp = async () => {
    if (!currentUser || !editingFollowUp) return;
    try {
      if (isBackendLive) {
        const updated = await apiFetch(`/api/followups/${editingFollowUp.id}`, currentUser.email, {
          method: 'PATCH',
          body: JSON.stringify(newFollowUp)
        });
        if (updated) {
          setFollowUps(prev => prev.map(f => f.id === editingFollowUp.id ? { ...updated, id: updated._id || updated.id } : f));
        }
      } else {
        setFollowUps(prev => prev.map(f => f.id === editingFollowUp.id ? { ...f, ...newFollowUp } as FollowUp : f));
      }
    } catch (err) {
      setFollowUps(prev => prev.map(f => f.id === editingFollowUp.id ? { ...f, ...newFollowUp } as FollowUp : f));
    }
  };

  const handleAddFollowUp = async () => {
    if (!currentUser || !newFollowUp.clientName || !newFollowUp.mobile) return;
    const followUpData = { ...newFollowUp, id: Date.now().toString(), lastContactDate: new Date().toISOString().split('T')[0] } as FollowUp;
    try {
      if (isBackendLive) {
        const saved = await apiFetch('/api/followups', currentUser.email, { method: 'POST', body: JSON.stringify(newFollowUp) });
        if (saved) setFollowUps(prev => [{ ...saved, id: saved._id || saved.id }, ...prev]);
      } else {
        setFollowUps(prev => [followUpData, ...prev]);
      }
    } catch (err) {
      setFollowUps(prev => [followUpData, ...prev]);
    }
  };
  
  const handleSaveFollowUp = async () => {
    if (editingFollowUp) {
      await handleUpdateFollowUp();
    } else {
      await handleAddFollowUp();
    }
    handleCloseFollowUpModal();
  };

  // Org Chart Actions
  const handleOpenAddMember = (parentId: string | null) => {
    setMemberParentId(parentId);
    setEditingMember(null);
    setMemberForm({ name: '', role: '', level: 'SUPERVISOR' });
    setIsAddingMember(true);
  };

  const handleOpenEditMember = (node: OrgNode) => {
    setEditingMember(node);
    setMemberParentId(null);
    setMemberForm({ name: node.name, role: node.role, level: node.level });
    setIsAddingMember(true);
  };

  const handleSaveMember = async () => {
    if (!currentUser || !memberForm.name || !memberForm.role) return;
    if (!isBackendLive) {
      alert("This feature is disabled in offline mode. Please connect to the backend to manage your team.");
      return;
    }
    try {
      if (editingMember) {
        await apiFetch(`/api/org/${editingMember.id}`, currentUser.email, {
          method: 'PATCH',
          body: JSON.stringify(memberForm)
        });
      } else {
        await apiFetch('/api/org', currentUser.email, {
          method: 'POST',
          body: JSON.stringify({ ...memberForm, parentId: memberParentId })
        });
      }
      await refreshOrgData();
      setIsAddingMember(false);
    } catch (err) {
      alert("Action failed. Check your connection.");
    }
  };

  const handleDeleteMember = async (nodeId: string) => {
    if (!currentUser || !window.confirm("Are you sure?")) return;
    if (!isBackendLive) {
      alert("This feature is disabled in offline mode. Please connect to the backend to manage your team.");
      return;
    }
    try {
      await apiFetch(`/api/org/${nodeId}`, currentUser.email, { method: 'DELETE' });
      await refreshOrgData();
    } catch (err) {
      alert("Delete failed.");
    }
  };

  const handleLogin = (user: UserProfile) => {
    setIsAuthenticated(true);
    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, 'true');
    localStorage.setItem(STORAGE_KEYS.ACTIVE_USER_EMAIL, user.email);
    navigateTo(ViewState.DASHBOARD);
  };

  const getTodaysCalls = () => {
    const today = new Date().toISOString().split('T')[0];
    return followUps.filter(f => f.nextFollowUpDate.split('T')[0] <= today && f.status !== Status.COMPLETED);
  };

  const sortedAndFilteredFollowUps = useMemo(() => {
    let sortableItems = [...followUps].filter(f => {
      const matchesSearch = f.clientName.toLowerCase().includes(dbSearch.toLowerCase());
      const matchesType = dbTypeFilter === 'All' || f.clientType === dbTypeFilter;
      const matchesStatus = dbStatusFilter === 'All' || f.status === dbStatusFilter;
      return matchesSearch && matchesType && matchesStatus;
    });

    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        if (sortConfig.key === 'nextFollowUpDate') {
            const dateA = new Date(a.nextFollowUpDate).getTime();
            const dateB = new Date(b.nextFollowUpDate).getTime();
            if (dateA < dateB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (dateA > dateB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        } else {
            const valA = a[sortConfig.key];
            const valB = b[sortConfig.key];
            if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
            if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
            return 0;
        }
      });
    }

    return sortableItems;
  }, [followUps, dbSearch, dbTypeFilter, dbStatusFilter, sortConfig]);

  const requestSort = (key: SortableFollowUpKeys) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const renderSortableHeader = (label: string, key: SortableFollowUpKeys) => {
    const isActive = sortConfig.key === key;
    const icon = isActive 
        ? (sortConfig.direction === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
        : 'fa-sort';
    const color = isActive ? 'text-accent' : 'text-slate-300 group-hover:text-slate-500';

    return (
        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <button onClick={() => requestSort(key)} className="group flex items-center gap-2 focus:outline-none">
                <span className={`${isActive ? 'text-slate-600' : ''}`}>{label}</span>
                <i className={`fa-solid ${icon} transition-colors ${color}`}></i>
            </button>
        </th>
    );
  };


  const todaysTasksOverview = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasks.filter(t => t.dueDate.split('T')[0] === today && t.status !== Status.COMPLETED).slice(0, 5);
  }, [tasks]);

  const efficiency = useMemo(() => {
    if (tasks.length === 0) return 0;
    return Math.round((tasks.filter(t => t.status === Status.COMPLETED).length / tasks.length) * 100);
  }, [tasks]);

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-accent border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated || !currentUser) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const inputClasses = "block w-full rounded-lg border-slate-200 bg-slate-50 text-slate-800 px-4 py-2.5 focus:bg-white focus:border-accent focus:ring-accent transition-all shadow-sm text-sm";
  const labelClasses = "block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5";
  const modalInputClasses = "block w-full rounded-xl border-transparent bg-slate-100/70 text-slate-900 px-4 py-3 focus:bg-white focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all shadow-sm text-sm placeholder:text-slate-400";
  const modalLabelClasses = "block text-[10px] font-extrabold text-slate-600 uppercase tracking-widest mb-2";

  const renderDashboardTask = (task: Task) => (
    <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4 hover:shadow-sm transition-shadow group cursor-pointer" onClick={() => navigateTo(ViewState.TASKS)}>
       <div className="w-2 h-2 rounded-full shrink-0 bg-accent shadow-[0_0_8px_rgba(59,130,246,0.4)]"></div>
       <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800 truncate leading-snug">{task.title}</p>
          <p className="text-[10px] text-slate-400 font-bold mt-0.5">{task.dueDate.split('T')[0]}</p>
       </div>
       <button onClick={(e) => { e.stopPropagation(); handleToggleTaskStatus(task.id); }} className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0 ${task.status === Status.COMPLETED ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-emerald-400'}`}>
          {task.status === Status.COMPLETED && <i className="fa-solid fa-check text-[10px]"></i>}
       </button>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 font-sans relative overflow-hidden">
      {isMobileMenuOpen && <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px] z-[40] lg:hidden" onClick={() => setIsMobileMenuOpen(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-[50] w-72 bg-primary text-white flex flex-col transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2"><i className="fa-solid fa-chart-line text-accent text-xl"></i><span className="text-2xl font-black text-white tracking-tighter">BizTrack</span></div>
          <button onClick={() => setIsMobileMenuOpen(false)} className="lg:hidden text-slate-400 p-2"><i className="fa-solid fa-xmark text-xl"></i></button>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {[
            { id: ViewState.DASHBOARD, label: 'Dashboard', icon: 'fa-gauge' },
            { id: ViewState.CALENDAR, label: 'Calendar', icon: 'fa-calendar-days' },
            { id: ViewState.TASKS, label: 'Tasks', icon: 'fa-list-check' },
            { id: ViewState.FOLLOW_UPS, label: 'Follow Ups', icon: 'fa-users' },
            { id: ViewState.ORG_CHART, label: 'My Team', icon: 'fa-sitemap' },
          ].map(item => (
            <button key={item.id} onClick={() => navigateTo(item.id)} className={`w-full flex items-center px-4 py-3 rounded-xl transition-all ${currentView === item.id ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
              <i className={`fa-solid ${item.icon} w-6 text-lg`}></i><span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between gap-2">
           <button onClick={() => navigateTo(ViewState.PROFILE)} className="flex items-center gap-3 p-2 hover:bg-slate-800 rounded-xl flex-1 min-w-0 text-left transition-colors">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-sm font-bold shadow-md shrink-0">{currentUser.name.charAt(0)}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-white text-sm truncate">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest leading-tight">{currentUser.role}</p>
              </div>
           </button>
           <button 
             onClick={(e) => { e.stopPropagation(); handleLogout(); }} 
             className="p-2 text-slate-500 hover:text-red-400 transition-colors"
             title="Logout"
           >
             <i className="fa-solid fa-right-from-bracket text-lg"></i>
           </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-2"><i className="fa-solid fa-chart-line text-accent text-xl"></i><span className="text-xl font-black text-slate-900 tracking-tighter">BizTrack</span></div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors"><i className="fa-solid fa-bars text-lg"></i></button>
        </header>

        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50">
          {isLoading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-4 border-accent border-t-transparent"></div></div>}

          {currentView === ViewState.DASHBOARD && (
            <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-6 animate-fade-in">
              <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div className="space-y-1"><h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">Overview</h2><p className="text-slate-500 text-sm">Track your progress and manage your pipeline.</p></div>
                <button onClick={() => navigateTo(ViewState.CALENDAR)} className="bg-white px-4 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 flex items-center gap-2 shadow-sm hover:border-accent hover:text-accent transition-all active:scale-95 cursor-pointer">
                    <i className="fa-regular fa-calendar text-accent"></i>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { id: 'clients', label: 'Total Clients', value: followUps.length, sub: 'Active Contacts', icon: 'fa-users', color: 'blue' },
                  { id: 'calls', label: 'Calls Today', value: getTodaysCalls().length, sub: 'Pending Action', icon: 'fa-phone', color: 'orange' },
                  { id: 'tasks', label: 'Pending Tasks', value: tasks.filter(t => t.status !== Status.COMPLETED).length, sub: 'Incomplete', icon: 'fa-list-check', color: 'purple' },
                  { id: 'efficiency', label: 'Efficiency', value: `${efficiency}%`, sub: 'Task Ratio', icon: 'fa-chart-line', color: 'emerald' },
                ].map((stat) => (
                  <button 
                    key={stat.id} 
                    onClick={() => setActiveDetailModal(stat.id as any)} 
                    className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group active:scale-95 text-left w-full"
                  >
                    <div className="flex justify-between items-start">
                       <div className="min-w-0">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                          <h3 className="text-3xl font-black text-slate-900 truncate">{stat.value}</h3>
                          <p className={`text-[10px] font-bold mt-1 text-slate-500`}>{stat.sub}</p>
                       </div>
                       <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner transition-colors ${stat.color === 'blue' ? 'bg-blue-50 text-blue-500 group-hover:bg-blue-500 group-hover:text-white' : stat.color === 'orange' ? 'bg-orange-50 text-orange-500 group-hover:bg-orange-500 group-hover:text-white' : stat.color === 'purple' ? 'bg-purple-50 text-purple-500 group-hover:bg-purple-500 group-hover:text-white' : 'bg-emerald-50 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white'}`}>
                          <i className={`fa-solid ${stat.icon}`}></i>
                       </div>
                    </div>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
                  <div className="lg:col-span-8 space-y-10">
                      <div className="space-y-6">
                        <div className="flex items-center justify-start gap-4 border-l-4 border-accent pl-4"><h4 className="text-xl font-bold text-slate-900">Outreach List</h4><button onClick={() => navigateTo(ViewState.FOLLOW_UPS)} className="text-sm font-bold text-accent hover:underline">View All</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {getTodaysCalls().map(f => (<FollowUpCard key={f.id} followUp={f} onStatusChange={handleFollowUpStatusChange} onCompleteCycle={handleCompleteFollowUpCycle} onDelete={handleDeleteFollowUp} onEdit={() => { setEditingFollowUp(f); }} />))}
                          {getTodaysCalls().length === 0 && (<div className="md:col-span-2 py-16 px-4 bg-white/50 border-2 border-dashed border-slate-200 rounded-3xl text-center"><p className="font-bold text-slate-500">No scheduled calls for today.</p></div>)}
                        </div>
                      </div>
                  </div>
                  <div className="lg:col-span-4 space-y-8">
                     <div className="space-y-4">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => setIsAddingFollowUp(true)} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center gap-3 hover:border-accent transition-all group shadow-sm active:scale-95"><i className="fa-solid fa-user-plus text-accent text-xl"></i><span className="text-[10px] font-black uppercase text-slate-700">Add Client</span></button>
                          <button onClick={() => navigateTo(ViewState.TASKS)} className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col items-center gap-3 hover:border-accent transition-all group shadow-sm active:scale-95"><i className="fa-solid fa-list-check text-purple-600 text-xl"></i><span className="text-[10px] font-black uppercase text-slate-700">All Tasks</span></button>
                        </div>
                     </div>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(59,130,246,0.4)]"></span> Focus Tasks</h4><button onClick={() => navigateTo(ViewState.TASKS)} className="text-[10px] font-bold text-slate-400 hover:text-accent tracking-tight">Expand</button></div>
                        <div className="space-y-3">{todaysTasksOverview.map(task => renderDashboardTask(task))}{todaysTasksOverview.length === 0 && (<p className="text-center text-[10px] text-slate-400 font-bold uppercase py-4 bg-slate-50/50 rounded-xl border border-dashed border-slate-200">Zero tasks today</p>)}</div>
                     </div>
                  </div>
              </div>
            </div>
          )}

          {currentView === ViewState.CALENDAR && (
             <div className="p-4 sm:p-8 h-full animate-fade-in overflow-y-auto">
               <CalendarView tasks={tasks} followUps={followUps} onUpdateTaskDate={(id, date) => {
                 const t = tasks.find(x => x.id === id);
                 if (t) handleAddTask({...t, dueDate: date}); 
               }} onUpdateFollowUpDate={handleCompleteFollowUpCycle} />
             </div>
          )}

          {currentView === ViewState.FOLLOW_UPS && (
            <div className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-12 animate-fade-in pb-20">
               <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                 <h2 className="text-3xl font-black text-slate-900 tracking-tight">Client Hub</h2>
                 <Button onClick={() => setIsAddingFollowUp(true)} className="shadow-xl shadow-accent/20">
                   <i className="fa-solid fa-user-plus mr-3"></i>New Client
                 </Button>
               </div>

               {/* Priority Cards Section */}
               <div className="space-y-6">
                 <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                   <span className="w-8 h-[1px] bg-slate-200"></span> Priority Outreach
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {followUps.filter(f => f.status !== Status.ARCHIVED).slice(0, 6).map(f => (
                     <FollowUpCard 
                        key={f.id} 
                        followUp={f} 
                        onStatusChange={handleFollowUpStatusChange} 
                        onCompleteCycle={handleCompleteFollowUpCycle} 
                        onDelete={handleDeleteFollowUp} 
                        onEdit={() => { setEditingFollowUp(f); }} 
                      />
                   ))}
                 </div>
               </div>

               {/* Database Table Section */}
               <div className="bg-white rounded-3xl border border-slate-200 shadow-xl shadow-slate-200/50 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-slate-50/50">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg">
                           <i className="fa-solid fa-database"></i>
                        </div>
                        <h3 className="text-lg font-black text-slate-900">All Clients Database</h3>
                     </div>

                     <div className="flex flex-wrap items-center gap-3">
                        <div className="relative">
                           <i className="fa-solid fa-search absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"></i>
                           <input 
                              type="text" 
                              placeholder="Search database..." 
                              value={dbSearch}
                              onChange={(e) => setDbSearch(e.target.value)}
                              className="pl-11 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:ring-accent focus:border-accent outline-none w-full sm:w-64" 
                           />
                        </div>
                        <select 
                           value={dbTypeFilter}
                           onChange={(e) => setDbTypeFilter(e.target.value)}
                           className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none cursor-pointer hover:bg-slate-50"
                        >
                           <option value="All">All Types</option>
                           {Object.values(ClientType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select 
                           value={dbStatusFilter}
                           onChange={(e) => setDbStatusFilter(e.target.value)}
                           className="bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold text-slate-600 outline-none cursor-pointer hover:bg-slate-50"
                        >
                           <option value="All">All Status</option>
                           {Object.values(Status).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                     <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50/80 border-b border-slate-200">
                           <tr>
                              <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 text-accent focus:ring-accent" /></th>
                              {renderSortableHeader('Client', 'clientName')}
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contact</th>
                              {renderSortableHeader('Type', 'clientType')}
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                              {renderSortableHeader('Next Call', 'nextFollowUpDate')}
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Notes</th>
                              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                           {sortedAndFilteredFollowUps.map(f => (
                              <tr key={f.id} className="hover:bg-slate-50 transition-colors group">
                                 <td className="px-6 py-5"><input type="checkbox" className="rounded border-slate-300 text-accent focus:ring-accent" /></td>
                                 <td className="px-6 py-5">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center font-black text-slate-400 border border-slate-200 shrink-0">
                                          {f.avatarUrl ? <img src={f.avatarUrl} className="w-full h-full rounded-full object-cover" /> : f.clientName.charAt(0)}
                                       </div>
                                       <div>
                                          <p className="text-sm font-bold text-slate-900 leading-none">{f.clientName}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    <p className="text-sm font-medium text-slate-700">{f.mobile}</p>
                                    <p className="text-[10px] text-slate-400 lowercase truncate max-w-[150px]">{f.email}</p>
                                 </td>
                                 <td className="px-6 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter ${
                                       f.clientType === ClientType.PROSPECT ? 'bg-indigo-50 text-indigo-600' :
                                       f.clientType === ClientType.USER ? 'bg-emerald-50 text-emerald-600' : 'bg-purple-50 text-purple-600'
                                    }`}>
                                       {f.clientType}
                                    </span>
                                 </td>
                                 <td className="px-6 py-5">
                                       <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase w-fit ${
                                          f.status === Status.PENDING ? 'bg-slate-100 text-slate-600' :
                                          f.status === Status.IN_PROGRESS ? 'bg-orange-50 text-orange-600' :
                                          f.status === Status.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                                       }`}>
                                          {f.status}
                                       </span>
                                 </td>
                                 <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                       <p className="text-xs font-bold text-slate-700">{f.frequency}</p>
                                       <p className={`text-[10px] font-medium mt-0.5 ${new Date(f.nextFollowUpDate) < new Date() ? 'text-red-500 font-black' : 'text-slate-400'}`}>
                                          {new Date(f.nextFollowUpDate).toLocaleDateString('en-GB')}
                                       </p>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    <p className="text-xs text-slate-500 max-w-[200px] line-clamp-2 leading-relaxed italic">
                                       {f.notes || 'No recent activity.'}
                                    </p>
                                 </td>
                                 <td className="px-6 py-5 text-right">
                                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={() => setEditingFollowUp(f)} className="text-slate-400 hover:text-accent transition-colors"><i className="fa-regular fa-pen-to-square"></i></button>
                                       <button onClick={() => handleDeleteFollowUp(f.id)} className="text-slate-400 hover:text-red-500 transition-colors"><i className="fa-regular fa-trash-can"></i></button>
                                    </div>
                                 </td>
                              </tr>
                           ))}
                           {sortedAndFilteredFollowUps.length === 0 && (
                              <tr>
                                 <td colSpan={8} className="px-6 py-20 text-center">
                                    <div className="flex flex-col items-center">
                                       <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                                          <i className="fa-solid fa-user-slash text-2xl"></i>
                                       </div>
                                       <p className="text-slate-500 font-bold">No clients match your search criteria.</p>
                                    </div>
                                 </td>
                              </tr>
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </div>
          )}

          {currentView === ViewState.TASKS && (<div className="p-4 sm:p-8 max-w-4xl mx-auto"><TaskList tasks={tasks} onAddTask={handleAddTask} onDeleteTask={handleDeleteTask} onToggleStatus={handleToggleTaskStatus} /></div>)}

          {currentView === ViewState.ORG_CHART && (
            <div className="p-4 sm:p-8 h-full">
              <OrgChart data={orgData} onAddNode={handleOpenAddMember} onEditNode={handleOpenEditMember} onDeleteNode={handleDeleteMember} />
            </div>
          )}

          {currentView === ViewState.PROFILE && (<div className="p-4 sm:p-8"><ProfileView user={currentUser} onUpdateUser={handleUpdateUser} onLogout={handleLogout} /></div>)}
        </main>
      </div>

      {/* Summary Cards Modals */}
      <Modal isOpen={activeDetailModal === 'clients'} onClose={() => setActiveDetailModal(null)} title="Client Database">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
             {followUps.length === 0 ? (
               <p className="text-center text-slate-500 italic py-8">No clients registered yet.</p>
             ) : followUps.map(c => (
               <div key={c.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-black text-xs shadow-sm">{c.clientName.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                     <p className="font-bold text-slate-900 text-sm truncate">{c.clientName}</p>
                  </div>
               </div>
             ))}
          </div>
          <div className="pt-6 flex justify-end">
            <Button onClick={() => { setActiveDetailModal(null); navigateTo(ViewState.FOLLOW_UPS); }} className="w-full sm:w-auto">Go to Client View</Button>
          </div>
      </Modal>

      <Modal isOpen={activeDetailModal === 'calls'} onClose={() => setActiveDetailModal(null)} title="Scheduled Calls Today">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
             {getTodaysCalls().length === 0 ? (
               <p className="text-center text-slate-500 italic py-8">No calls scheduled for today.</p>
             ) : getTodaysCalls().map(c => (
               <div key={c.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black text-xs shadow-sm">{c.clientName.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                     <p className="font-bold text-slate-900 text-sm truncate">{c.clientName}</p>
                     <p className="text-[10px] text-slate-500 font-bold">{c.mobile}</p>
                  </div>
                  <a href={`tel:${c.mobile}`} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-orange-500 hover:bg-orange-500 hover:text-white transition-all shadow-sm">
                    <i className="fa-solid fa-phone text-xs"></i>
                  </a>
               </div>
             ))}
          </div>
          <div className="pt-6 flex justify-end">
            <Button onClick={() => { setActiveDetailModal(null); navigateTo(ViewState.FOLLOW_UPS); }} className="w-full sm:w-auto">Go to Outreach Dashboard</Button>
          </div>
      </Modal>

      <Modal isOpen={activeDetailModal === 'tasks'} onClose={() => setActiveDetailModal(null)} title="Pending Tasks">
          <div className="space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
             {tasks.filter(t => t.status !== Status.COMPLETED).length === 0 ? (
               <p className="text-center text-slate-500 italic py-8">All tasks completed!</p>
             ) : tasks.filter(t => t.status !== Status.COMPLETED).map(t => (
               <div key={t.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 shadow-sm">
                  <div className="w-2 h-8 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"></div>
                  <div className="flex-1 min-w-0">
                     <p className="font-bold text-slate-900 text-sm truncate">{t.title}</p>
                     <p className="text-[10px] text-slate-400 font-bold">Due: {t.dueDate.split('T')[0]}</p>
                  </div>
                  <button onClick={() => handleToggleTaskStatus(t.id)} className="w-8 h-8 rounded-xl border-2 border-slate-200 flex items-center justify-center hover:border-accent hover:text-accent transition-all group bg-white shadow-sm">
                    <i className="fa-solid fa-check text-xs text-transparent group-hover:text-accent"></i>
                  </button>
               </div>
             ))}
          </div>
          <div className="pt-6 flex justify-end">
            <Button onClick={() => { setActiveDetailModal(null); navigateTo(ViewState.TASKS); }} className="w-full sm:w-auto">Manage All Tasks</Button>
          </div>
      </Modal>

      <Modal isOpen={activeDetailModal === 'efficiency'} onClose={() => setActiveDetailModal(null)} title="Performance Breakdown">
          <div className="space-y-6">
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 text-center shadow-sm">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Tasks</p>
                   <p className="text-3xl font-black text-slate-900">{tasks.length}</p>
                </div>
                <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100 text-center shadow-sm">
                   <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Completed</p>
                   <p className="text-3xl font-black text-emerald-700">{tasks.filter(t => t.status === Status.COMPLETED).length}</p>
                </div>
             </div>
             <div className="space-y-3 p-2">
                <div className="flex justify-between items-end">
                   <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Completion Progress</p>
                   <p className="text-2xl font-black text-accent">{efficiency}%</p>
                </div>
                <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200 shadow-inner">
                   <div className="bg-accent h-full transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(59,130,246,0.6)]" style={{ width: `${efficiency}%` }}></div>
                </div>
             </div>
             <p className="text-xs text-slate-500 leading-relaxed italic border-l-4 border-slate-200 pl-4 py-1">
                Your efficiency is calculated based on tasks completed vs total created. High efficiency indicates consistent progress.
             </p>
          </div>
          <div className="pt-6 flex justify-end">
            <Button onClick={() => setActiveDetailModal(null)} className="w-full sm:w-auto">Close Breakdown</Button>
          </div>
      </Modal>

      {/* Org Member Modal */}
      <Modal isOpen={isAddingMember} onClose={() => setIsAddingMember(false)} title={editingMember ? "Edit Team Member" : "Add Team Member"}>
        <div className="space-y-4">
          <div className="space-y-1"><label className={labelClasses}>Full Name</label><input type="text" className={inputClasses} value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} /></div>
          <div className="space-y-1"><label className={labelClasses}>Business Role</label><input type="text" className={inputClasses} value={memberForm.role} onChange={e => setMemberForm({...memberForm, role: e.target.value})} /></div>
          <div className="space-y-1"><label className={labelClasses}>Level</label><select className={inputClasses} value={memberForm.level} onChange={e => setMemberForm({...memberForm, level: e.target.value as OrgLevel})}>{ORG_LEVELS.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}</select></div>
          <div className="pt-4 flex justify-end gap-3"><Button variant="ghost" onClick={() => setIsAddingMember(false)}>Cancel</Button><Button onClick={handleSaveMember}>Save</Button></div>
        </div>
      </Modal>

      {/* Follow-up Add/Edit Modal */}
      <Modal 
        isOpen={isAddingFollowUp} 
        onClose={handleCloseFollowUpModal} 
        title={editingFollowUp ? "Edit Client Record" : "New Client Record"}
        hideCloseButton={true}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSaveFollowUp(); }} className="space-y-5 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
            <div>
              <label className={modalLabelClasses}>Full Name</label>
              <input 
                required 
                type="text" 
                className={modalInputClasses} 
                value={newFollowUp.clientName || ''} 
                onChange={e => setNewFollowUp({...newFollowUp, clientName: e.target.value})} 
                placeholder="e.g., Jane Doe"
              />
            </div>
            <div>
              <label className={modalLabelClasses}>Phone Number</label>
              <PhoneInput 
                required 
                value={newFollowUp.mobile || ''} 
                onChange={v => setNewFollowUp({...newFollowUp, mobile: v})} 
              />
            </div>
          </div>
          <div>
            <label className={modalLabelClasses}>Email</label>
            <input 
              type="email" 
              className={modalInputClasses} 
              value={newFollowUp.email || ''} 
              onChange={e => setNewFollowUp({...newFollowUp, email: e.target.value})}
              placeholder="jane.d@example.com"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-5">
            <div>
              <label className={modalLabelClasses}>Client Type</label>
              <select 
                className={modalInputClasses} 
                value={newFollowUp.clientType} 
                onChange={e => setNewFollowUp({...newFollowUp, clientType: e.target.value as ClientType})}
              >
                {Object.values(ClientType).map(v => <option key={v} value={v}>{v}</option>)}
              </select>
            </div>
            <div>
              <label className={modalLabelClasses}>Next Follow-up Date</label>
              <DatePicker 
                className={modalInputClasses}
                value={newFollowUp.nextFollowUpDate || ''} 
                onChange={e => setNewFollowUp({...newFollowUp, nextFollowUpDate: e.target.value})} 
              />
            </div>
          </div>
          <div>
            <label className={modalLabelClasses}>Notes</label>
            <textarea 
              className={`${modalInputClasses} min-h-[90px] resize-none`} 
              value={newFollowUp.notes || ''} 
              onChange={e => setNewFollowUp({...newFollowUp, notes: e.target.value})}
              placeholder="e.g., Discussed new proposal..."
            />
          </div>
          <div className="pt-5 flex justify-end items-center gap-4 border-t border-slate-100 mt-6">
            <Button variant="ghost" type="button" onClick={handleCloseFollowUpModal}>Cancel</Button>
            <Button type="submit">{editingFollowUp ? 'Save Changes' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default App;
