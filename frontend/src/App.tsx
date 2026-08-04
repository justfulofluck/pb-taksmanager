import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  User,
  Plus, 
  Table, 
  Kanban, 
  Calendar, 
  Inbox, 
  Filter, 
  ArrowUpDown, 
  Activity, 
  Search, 
  Maximize2, 
  Minimize2,
  SlidersHorizontal, 
  ChevronDown, 
  LogOut, 
  Bell, 
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Menu,
  X,
  ChevronRight,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  BarChart3,
  Clock,
  Download,
  MessageSquare,
  Sun,
  Moon,
  Share2,
  Users,
  UserPlus,
  Shield,
  Building,
  Megaphone
} from 'lucide-react';
import { Task, TaskStatus, TaskPriority, TeamMember } from './types';

import { ApiClient } from './api';
import Auth from './components/Auth';
import OverviewTable from './components/OverviewTable';
import KanbanBoard from './components/KanbanBoard';
import InboxPanel from './components/InboxPanel';
import TaskModal from './components/TaskModal';
import AnalyticsView from './components/AnalyticsView';
import TimelineView from './components/TimelineView';
import AIAssistantModal from './components/AIAssistantModal';
import FocusTimerModal from './components/FocusTimerModal';
import SocialMediaMarketingView from './components/SocialMediaMarketingView';
import TeamOnboardingView from './components/TeamOnboardingView';
import OnboardMemberModal from './components/OnboardMemberModal';
import AdminPanelView from './components/AdminPanelView';
import TeamPanelView from './components/TeamPanelView';

export default function App() {
  // Authentication State
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string } | null>(() => {
    const session = localStorage.getItem('pinobite_session');
    return session ? JSON.parse(session) : null;
  });

  // Tasks & Team Members State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentView, setCurrentView] = useState<'overview' | 'kanban' | 'timeline' | 'analytics' | 'due' | 'inbox' | 'social_media' | 'team_onboarding' | 'admin_panel' | 'team_panel'>('overview');
  
  // Workspace Announcement State
  const [announcement, setAnnouncement] = useState(() => localStorage.getItem('pinobite_ws_announcement') || 'Welcome to the Workspace.');

  // User role check & permission state
  const currentUserMember = teamMembers.find(m => 
    currentUser && (
      m.email.toLowerCase() === currentUser.email.toLowerCase() ||
      m.name.toLowerCase() === currentUser.name.toLowerCase()
    )
  );

  const isAdmin = currentUserMember 
    ? (currentUserMember.accessLevel === 'Super Admin' || currentUserMember.email === 'admin@pinobite.com')
    : (currentUser?.email === 'admin@pinobite.com');

  // Guard restricted views for non-admins & specific team roles
  useEffect(() => {
    if (!isAdmin && (currentView === 'admin_panel' || currentView === 'team_onboarding')) {
      setCurrentView('overview');
      setToast({
        title: 'Permission Restricted 🔒',
        message: 'Only Super Admins can access Team Onboarding & Admin controls.'
      });
    }

    const isMarketingTeam = currentUserMember?.team === 'Marketing';
    if (!isAdmin && !isMarketingTeam && currentView === 'social_media') {
      setCurrentView('overview');
      setToast({
        title: 'Restricted Module 🔒',
        message: 'Social Media Marketing Hub is restricted to Marketing team members & Super Admins.'
      });
    }
  }, [isAdmin, currentView, currentUserMember]);

  
  // Onboarding Modal state
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [onboardTargetTeam, setOnboardTargetTeam] = useState<string | undefined>(undefined);
  
  // Modal / detail view
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Add-on Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isFocusTimerOpen, setIsFocusTimerOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('');

  // Interactive toolbar state
  const [filterAssigned, setFilterAssigned] = useState<'ME' | 'ALL' | string>('ME');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'default' | 'title' | 'priority' | 'status' | 'dueDate'>('default');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Real-time Collaboration Notification Toast State
  const [toast, setToast] = useState<{ title: string; message: string } | null>(null);

  // Theme State (Light / Dark Mode)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('pinobite_theme') === 'dark';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('pinobite_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('pinobite_theme', 'light');
    }
  }, [isDarkMode]);

  // Mobile layout sidebar toggle state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Load / initialize tasks & team members
  useEffect(() => {
    const load = async () => {
      const list = await ApiClient.getTasks();
      setTasks(list);

      const members = await ApiClient.getTeamMembers();
      setTeamMembers(members);
    };
    load();
  }, []);

  // Auto dismiss toast notification after 2 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Listen for simulated real-time teammate actions
  useEffect(() => {
    const handleNotification = async (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        setToast({
          title: customEvent.detail.title,
          message: customEvent.detail.text
        });

        // Refresh tasks since they might have changed from teammate edits
        const list = await ApiClient.getTasks();
        setTasks(list);
      }
    };

    window.addEventListener('pinobite_notification', handleNotification);
    return () => window.removeEventListener('pinobite_notification', handleNotification);
  }, []);

  const handleLoginSuccess = async (user: { email: string; name: string }) => {
    setCurrentUser(user);
    localStorage.setItem('pinobite_session', JSON.stringify(user));
    
    // Log login activity
    const newLog = {
      id: `log-${Date.now()}`,
      userId: user.email || 'user',
      userName: user.name,
      action: 'entered the workspace sprint portal',
      timestamp: new Date().toISOString()
    };
    await ApiClient.addActivityLog(newLog);
    window.dispatchEvent(new Event('pinobite_activity_update'));
  };

  const handleLogout = () => {
    localStorage.removeItem('pinobite_session');
    setCurrentUser(null);
  };

  const handleAddTask = async (customTaskOrMemberId?: Task | string) => {
    let newTask: Task;
    if (typeof customTaskOrMemberId === 'object' && customTaskOrMemberId !== null) {
      newTask = customTaskOrMemberId;
    } else {
      const defaultAssignee = !isAdmin ? (currentUserMember?.id || currentUser?.email || 'user') : (currentUser?.email || 'user');
      const assignedId = typeof customTaskOrMemberId === 'string' ? customTaskOrMemberId : defaultAssignee;
      newTask = {
        id: `task-${Date.now()}`,
        task: 'New Team Sprint Task',
        description: 'Provide requirements and design guidelines here...',
        status: 'Not started',
        dueDate: new Date().toISOString().split('T')[0],
        priority: 'Minimal Priority',
        tags: ['Ops'],
        assignedTo: [assignedId],
        createdAt: new Date().toISOString(),
        createdBy: currentUser?.email || 'user'
      };
    }

    const saved = await ApiClient.saveTask(newTask);
    const updated = [saved, ...tasks];
    setTasks(updated);

    // Create log
    const newLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.email || 'user',
      userName: currentUser?.name || 'User',
      action: `created new task "${newTask.task}"`,
      timestamp: new Date().toISOString()
    };
    await ApiClient.addActivityLog(newLog);
    window.dispatchEvent(new Event('pinobite_activity_update'));
  };



  // Audio feedback generator for completed tasks
  const playCompletionPing = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;

      // Dual-tone harmonic ping chime (A5: 880Hz -> A6: 1760Hz with E6 overtone)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now);
      osc1.frequency.exponentialRampToValueAtTime(1760, now + 0.1);

      gain1.gain.setValueAtTime(0.2, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1318.51, now + 0.04);

      gain2.gain.setValueAtTime(0.12, now + 0.04);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.3);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.35);

      osc2.start(now + 0.04);
      osc2.stop(now + 0.3);
    } catch (e) {
      // Audio Context safety catch for un-clicked browsers
    }
  };

  const handleUpdateTask = async (updated: Task) => {
    const oldTask = tasks.find(t => t.id === updated.id);

    const saved = await ApiClient.saveTask(updated);
    const updatedList = tasks.map(t => t.id === saved.id ? saved : t);
    setTasks(updatedList);

    // Audio-visual feedback on completion
    if (oldTask && oldTask.status !== updated.status) {
      if (updated.status === 'Done' || (updated.status as string) === 'Completed') {
        playCompletionPing();
        setToast({
          title: 'Task Completed! 🎉',
          message: `"${updated.task}" marked as completed.`
        });
      }
    }

    // Create log for general changes
    let actionStr = `updated task "${updated.task}"`;
    if (oldTask && oldTask.status !== updated.status) {
      actionStr = `changed status of "${updated.task}" to "${updated.status}"`;
    } else if (oldTask && oldTask.priority !== updated.priority) {
      actionStr = `changed priority of "${updated.task}" to "${updated.priority}"`;
    }

    const newLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.email || 'user',
      userName: currentUser?.name || 'User',
      action: actionStr,
      timestamp: new Date().toISOString()
    };
    await ApiClient.addActivityLog(newLog);
    window.dispatchEvent(new Event('pinobite_activity_update'));
  };

  const handleDeleteTask = async (id: string) => {
    if (!isAdmin) {
      alert('Only Workspace Admins can delete tasks. Team members cannot delete tasks.');
      return;
    }
    const target = tasks.find(t => t.id === id);
    await ApiClient.deleteTask(id);
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    setSelectedIds(selectedIds.filter(selId => selId !== id));

    if (selectedTask?.id === id) {
      setSelectedTask(null);
    }

    setToast({
      title: 'Task Deleted 🗑️',
      message: `Removed "${target?.task || 'Task'}" from workspace.`
    });

    // Create log
    const newLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.email || 'user',
      userName: currentUser?.name || 'User',
      action: `deleted task "${target?.task || 'Untitled Task'}"`,
      timestamp: new Date().toISOString()
    };
    await ApiClient.addActivityLog(newLog);
    window.dispatchEvent(new Event('pinobite_activity_update'));
  };

  // Sync external simulator changes
  const handleTasksUpdateExternally = (updatedList: Task[]) => {
    setTasks(updatedList);
  };

  // Row selection handlers
  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleToggleSelectAll = () => {
    if (selectedIds.length === filteredTasks.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredTasks.map(t => t.id));
    }
  };

  const handleBulkDelete = async () => {
    if (!isAdmin) {
      alert('Only Workspace Admins can delete tasks. Team members cannot delete tasks.');
      return;
    }
    if (selectedIds.length === 0) return;
    const count = selectedIds.length;
    await ApiClient.bulkDeleteTasks(selectedIds);
    const updated = tasks.filter(t => !selectedIds.includes(t.id));
    setTasks(updated);
    
    if (selectedTask && selectedIds.includes(selectedTask.id)) {
      setSelectedTask(null);
    }
    
    setSelectedIds([]);

    setToast({
      title: 'Tasks Deleted 🗑️',
      message: `Removed ${count} tasks from workspace.`
    });

    // Create log
    const newLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.email || 'user',
      userName: currentUser?.name || 'User',
      action: `bulk deleted ${count} tasks`,
      timestamp: new Date().toISOString()
    };
    await ApiClient.addActivityLog(newLog);
    window.dispatchEvent(new Event('pinobite_activity_update'));
  };

  // CSV Export Add-on
  const handleExportCSV = () => {
    const headers = ['ID', 'Task Name', 'Description', 'Status', 'Priority', 'Due Date', 'Tags', 'Assigned To'];
    const rows = tasks.map(t => [
      t.id,
      `"${t.task.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.dueDate,
      `"${t.tags.join(', ')}"`,
      `"${t.assignedTo.join(', ')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sprint_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Add Task generated by AI Assistant
  const handleAiAddTask = async (taskData: Partial<Task>) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      task: taskData.task || 'New AI Task',
      description: taskData.description || '',
      status: taskData.status || 'Not started',
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      priority: taskData.priority || 'Low Priority',
      tags: taskData.tags || ['AI Generated'],
      assignedTo: taskData.assignedTo || [],
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentUser?.email || 'user'
    };

    await ApiClient.saveTask(newTask);
    setTasks(prev => [newTask, ...prev]);

    const newLog = {
      id: `log-${Date.now()}`,
      userId: currentUser?.email || 'user',
      userName: currentUser?.name || 'User',
      action: `added AI-generated task "${newTask.task}"`,
      timestamp: new Date().toISOString()
    };
    await ApiClient.addActivityLog(newLog);
    window.dispatchEvent(new Event('pinobite_activity_update'));
  };

  // Resolve user identifiers for current logged in user
  const getLoggedInUserIdentifiers = () => {
    if (!currentUser) return [];
    const list = [currentUser.email.toLowerCase(), currentUser.name.toLowerCase()];
    
    const matchingMember = teamMembers.find(
      m => m.email.toLowerCase() === currentUser.email.toLowerCase() ||
           m.name.toLowerCase() === currentUser.name.toLowerCase()
    );

    if (matchingMember) {
      list.push(matchingMember.id.toLowerCase());
      list.push(matchingMember.name.toLowerCase());
      list.push(matchingMember.email.toLowerCase());
    } else {
      const firstName = currentUser.name.split(' ')[0].toLowerCase();
      if (firstName && firstName.length >= 2) list.push(firstName);
    }

    return list;
  };

  // Filter logic based on current views, toolbar controls & search bar
  const getFilteredTasks = () => {
    let result = [...tasks];

    // Search query matches
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => 
        t.task.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }

    // Non-admin members can strictly ONLY see tasks assigned to them or created by them
    if (!isAdmin) {
      const userIds = getLoggedInUserIdentifiers();
      result = result.filter(t => {
        const assigned = t.assignedTo || [];
        const createdBy = (t.createdBy || '').toLowerCase();

        const isAssigned = assigned.some(assignee => {
          const lower = assignee.toLowerCase();
          return userIds.some(id => id === lower || lower.includes(id) || id.includes(lower));
        });

        const isCreated = userIds.some(id => id === createdBy || createdBy.includes(id));

        return isAssigned || isCreated;
      });
    } else if (filterAssigned !== 'ALL') {
      const userIds = getLoggedInUserIdentifiers();
      result = result.filter(t => {
        if (filterAssigned === 'ME') {
          const assigned = t.assignedTo || [];
          const createdBy = (t.createdBy || '').toLowerCase();

          const isAssigned = assigned.some(assignee => {
            const lower = assignee.toLowerCase();
            return userIds.some(id => id === lower || lower.includes(id) || id.includes(lower));
          });

          const isCreated = userIds.some(id => id === createdBy || createdBy.includes(id));

          return isAssigned || isCreated;
        } else {
          const targetMember = teamMembers.find(m => m.id === filterAssigned);
          if (!targetMember) return true;
          const targetIds = [targetMember.id.toLowerCase(), targetMember.email.toLowerCase(), targetMember.name.toLowerCase()];
          return (t.assignedTo || []).some(assignee => {
            const lower = assignee.toLowerCase();
            return targetIds.some(tid => tid === lower || lower.includes(tid) || tid.includes(lower));
          });
        }
      });
    }

    // Priority dropdown filter
    if (filterPriority !== 'ALL') {
      result = result.filter(t => t.priority === filterPriority);
    }

    // Status dropdown filter
    if (filterStatus !== 'ALL') {
      result = result.filter(t => t.status === filterStatus);
    }

    // Tab Views filter
    if (currentView === 'due') {
      // Show tasks with a due date within next 7 days, or high priority
      result = result.filter(t => t.dueDate || t.priority === 'High Priority');
    }

    // Sorting logic
    if (sortBy !== 'default') {
      const priorityWeight: Record<string, number> = {
        'High Priority': 4,
        'Medium Priority': 3,
        'Low Priority': 2,
        'Minimal Priority': 1
      };

      result.sort((a, b) => {
        let cmp = 0;
        if (sortBy === 'title') {
          cmp = a.task.localeCompare(b.task);
        } else if (sortBy === 'priority') {
          cmp = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
        } else if (sortBy === 'status') {
          cmp = a.status.localeCompare(b.status);
        } else if (sortBy === 'dueDate') {
          const dA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          cmp = dA - dB;
        }

        return sortOrder === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  };

  const filteredTasks = getFilteredTasks();

  // If session is empty, load Auth form
  if (!currentUser) {
    return <Auth onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex font-sans overflow-hidden transition-colors duration-200 relative" id="app-root-workspace">
      
      {/* AMBIENT LIQUID GLASS FLOATING MESH BLOBS */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 opacity-70 dark:opacity-50">
        <div className="absolute -top-32 -left-32 w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-indigo-400/35 via-purple-400/25 to-pink-400/30 blur-3xl animate-liquid-blob-1" />
        <div className="absolute top-1/3 -right-32 w-[34rem] h-[34rem] rounded-full bg-gradient-to-tr from-sky-400/35 via-teal-300/20 to-indigo-500/30 blur-3xl animate-liquid-blob-2" />
        <div className="absolute -bottom-32 left-1/4 w-[32rem] h-[32rem] rounded-full bg-gradient-to-tl from-violet-400/30 via-fuchsia-300/20 to-indigo-400/30 blur-3xl animate-liquid-blob-1" />
      </div>

      {/* MOBILE HEADER BAR */}
      <div className="lg:hidden w-full flex items-center justify-between px-4 py-3 bg-white/75 dark:bg-slate-900/75 backdrop-blur-2xl border-b border-white/60 dark:border-slate-800/80 z-30 fixed top-0 left-0 right-0 h-14 shadow-xs" id="mobile-top-bar">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold text-xs shadow-md shadow-indigo-500/20">
            P
          </div>
          <span className="text-sm font-black tracking-tight text-slate-900 dark:text-white">Pinobite</span>
          <span className="text-[9px] bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-bold uppercase backdrop-blur-md">
            Live
          </span>
        </div>

        <div className="flex items-center gap-1">
          {/* AI Helper Trigger */}
          <button
            onClick={() => setIsAiModalOpen(true)}
            className="p-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50/80 dark:hover:bg-indigo-950/80 rounded-xl transition-colors cursor-pointer"
            title="AI Helper"
          >
            <Sparkles className="w-4 h-4" />
          </button>

          {/* Theme Toggle Trigger */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-2 text-slate-600 dark:text-amber-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode (Night Work)'}
            id="mobile-theme-toggle"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Focus Timer Trigger */}
          <button
            onClick={() => setIsFocusTimerOpen(true)}
            className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer"
            title="Focus Timer"
          >
            <Clock className="w-4 h-4" />
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 rounded-xl transition-colors cursor-pointer relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
            </button>

            {isNotifOpen && (
              <div className="fixed top-14 right-3 w-72 bg-white/85 dark:bg-slate-900/85 backdrop-blur-2xl border border-white/80 dark:border-slate-800/80 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-tooltip-pop origin-top-right text-slate-900 dark:text-slate-100">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <span className="text-xs font-black uppercase">Recent Updates</span>
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/80 px-2 py-0.5 rounded-full">Live Feed</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white block">Sprint Goal Active</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Team updated task statuses in Kanban board</span>
                  </div>
                  <div className="p-2.5 bg-slate-50/80 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white block">High Priority Due Alert</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">{tasks.filter(t => t.priority === 'High Priority').length} high-priority tickets pending</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 rounded-xl transition-colors"
            id="mobile-menu-toggle"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* SIDEBAR NAVIGATION (Desktop & Mobile drawer) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-[60] lg:z-30 ${isSidebarCollapsed ? 'w-20' : 'w-64'} bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl border-r border-white/60 dark:border-slate-800/80 flex flex-col justify-between transform transition-all duration-300 ease-in-out lg:relative lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } shadow-xl lg:shadow-none`}
        id="app-sidebar"
      >
        {/* Top brand header */}
        <div className="overflow-hidden">
          <div className={`p-5 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'justify-between'}`} id="sidebar-logo-container">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              {!isSidebarCollapsed && (
                <div className="text-left">
                  <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-sans leading-tight">
                    Pinobite
                  </h1>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium block">Sprint Sync Hub</span>
                </div>
              )}
            </div>
            {/* Close button on mobile or Collapse on Desktop */}
            <div className="flex items-center">
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="lg:hidden p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded transition-colors"
                id="mobile-close-sidebar"
              >
                <X className="w-5 h-5" />
              </button>
              {!isSidebarCollapsed && (
                <button 
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="hidden lg:flex p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                  id="desktop-collapse-sidebar"
                  title="Collapse sidebar"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {isSidebarCollapsed && (
            <div className="flex justify-center pb-4">
              <button 
                onClick={() => setIsSidebarCollapsed(false)}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Expand sidebar"
              >
                <PanelLeftOpen className="w-4.5 h-4.5" />
              </button>
            </div>
          )}

          {/* Navigation Links list */}
          <nav className={`px-3 ${isSidebarCollapsed ? 'py-4' : 'py-6'} space-y-1 text-left`} id="sidebar-navigation">
            {!isSidebarCollapsed && (
              <span className="px-4 py-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest uppercase block text-left">
                Views
              </span>
            )}
            
            {[
              { id: 'overview', label: 'Overview (Spreadsheet)', icon: Table, count: tasks.length },
              { id: 'kanban', label: 'Kanban Board', icon: Kanban, count: tasks.filter(t => t.status === 'In progress').length },
              ...(isAdmin ? [{ id: 'admin_panel', label: 'Admin Panel', icon: Shield, textBadge: 'ADMIN', badgeColor: 'rose', iconColor: 'text-rose-500' }] : []),
              { id: 'team_panel', label: 'Team Panel', icon: Building, count: teamMembers.length, badgeColor: 'indigo', iconColor: 'text-indigo-500' },
              { id: 'analytics', label: 'Analytics & Metrics', icon: BarChart3 },
              { id: 'due', label: 'Due / Critical Items', icon: Activity, count: tasks.filter(t => t.priority === 'High Priority').length, badgeColor: 'rose' },
              ...(isAdmin ? [{ id: 'team_onboarding', label: 'Team & Onboarding', icon: Users, count: teamMembers.length, badgeColor: 'emerald', iconColor: 'text-emerald-500' }] : []),
              ...((isAdmin || currentUserMember?.team === 'Marketing') ? [{ id: 'social_media', label: 'Social Marketing', icon: Share2, textBadge: 'NEW', badgeColor: 'purple', iconColor: 'text-purple-500' }] : []),
              { id: 'inbox', label: 'Inbox & Activity Logs', icon: Inbox, dot: true }
            ].map((item) => {

              const active = currentView === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setCurrentView(item.id as any); setSelectedIds([]); setIsSidebarOpen(false); }}
                  className={`relative w-full ${isSidebarCollapsed ? 'px-2 py-2.5 justify-center' : 'px-3.5 py-2.5 justify-between'} rounded-xl text-[13px] font-semibold flex items-center transition-colors cursor-pointer group outline-none ${
                    active 
                      ? 'text-indigo-600 dark:text-indigo-400 font-bold' 
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/60'
                  }`}
                  id={`sidebar-view-${item.id}`}
                  title={isSidebarCollapsed ? item.label : ''}
                >
                  {/* Sliding active background indicator */}
                  {active && (
                    <motion.div
                      layoutId="sidebarActivePill"
                      className="absolute inset-0 bg-indigo-50/90 dark:bg-indigo-950/80 border border-indigo-200/80 dark:border-indigo-800/80 rounded-xl shadow-xs"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-3 min-w-0">
                    <Icon className={`w-4.5 h-4.5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${active ? 'text-indigo-600 dark:text-indigo-400' : (item.iconColor || 'text-slate-500 dark:text-slate-400')}`} />
                    {!isSidebarCollapsed && (
                      <span className="truncate text-left whitespace-nowrap">{item.label}</span>
                    )}
                  </div>

                  {!isSidebarCollapsed && item.count !== undefined && (
                    <motion.span 
                      key={`${item.id}-${item.count}`}
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={`relative z-10 text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ml-1 ${
                        item.badgeColor === 'rose'
                          ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950 border-rose-200 dark:border-rose-900'
                          : item.badgeColor === 'emerald'
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800'
                          : active
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {item.count}
                    </motion.span>
                  )}

                  {!isSidebarCollapsed && item.textBadge && (
                    <span className="relative z-10 text-[10px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800 shrink-0 ml-1 animate-pulse">
                      {item.textBadge}
                    </span>
                  )}

                  {item.dot && (
                    <div className="relative z-10">
                      {!isSidebarCollapsed ? (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75" />
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600" />
                        </span>
                      ) : (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 bg-indigo-600 rounded-full animate-pulse" />
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom user profile context */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 space-y-4" id="sidebar-footer">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center p-1.5' : 'gap-3 p-2.5'} bg-white dark:bg-slate-800/90 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-xs relative group`}>
            <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold text-xs flex items-center justify-center shrink-0 uppercase">
              {currentUser.name.substring(0,2)}
            </div>
            {!isSidebarCollapsed && (
              <div className="text-left min-w-0 flex-1">
                <span className="text-[12px] font-bold text-slate-900 dark:text-white block truncate">{currentUser.name}</span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block truncate leading-tight">{currentUser.email}</span>
              </div>
            )}
            {!isSidebarCollapsed ? (
              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all shrink-0 cursor-pointer"
                title="Logout session"
                id="sidebar-logout-btn"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleLogout}
                className="absolute -top-2 -right-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-1 rounded-full shadow-xs opacity-0 group-hover:opacity-100 transition-opacity"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-slate-400" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Overlay backdrop for mobile side navigation when active */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-50 transition-opacity"
          id="sidebar-overlay-backdrop"
        />
      )}

      {/* MAIN LAYOUT SPACE */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden pt-14 lg:pt-0" id="main-layout-viewport">
        
        {/* PREMIUM SAAS COMPACT ACTION HEADER */}
        <header className="hidden lg:flex h-16 border-b border-white/60 dark:border-slate-800/80 bg-white/70 dark:bg-slate-900/70 backdrop-blur-2xl px-8 items-center justify-between shrink-0 z-30 relative shadow-xs" id="saas-header">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="font-semibold hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer">Workspaces</span>
            <ChevronRight className="w-3 h-3 text-slate-300 dark:text-slate-600" />
            <span className="font-bold text-indigo-600 dark:text-indigo-400 capitalize">
              {currentView} view
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
            {/* Unified Search engine inside the header */}
            <div className="relative w-40 sm:w-60 lg:w-80">
              <Search className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500 w-4 h-4 my-auto" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-900 dark:text-slate-100 border border-white/80 dark:border-slate-700/80 focus:border-indigo-400 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 rounded-xl py-2 pl-9 sm:pl-10 pr-3 text-xs sm:text-[13px] outline-none transition-all placeholder-slate-400 dark:placeholder-slate-500 shadow-inner"
              />
            </div>

            {/* ADD-ON ACTION BUTTONS */}
            <div className="flex items-center gap-2">
              {/* AI Assistant Button */}
              <button
                onClick={() => setIsAiModalOpen(true)}
                className="bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-indigo-950/80 dark:to-violet-950/80 border border-indigo-200/80 dark:border-indigo-800/80 text-indigo-700 dark:text-indigo-300 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs hover:border-indigo-300"
                title="AI Task Generator & Standup Summary"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="hidden sm:inline">AI Helper</span>
              </button>

              {/* Focus Timer Button */}
              <button
                onClick={() => setIsFocusTimerOpen(true)}
                className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Sprint Focus Timer"
              >
                <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Timer</span>
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-amber-400 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode (Night Work)'}
                id="desktop-theme-toggle"
              >
                {isDarkMode ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="hidden sm:inline text-amber-300 font-bold">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-slate-600" />
                    <span className="hidden sm:inline text-slate-700 font-bold">Night</span>
                  </>
                )}
              </button>

              {/* CSV Export Button */}
              <button
                onClick={handleExportCSV}
                className="bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer"
                title="Export Tasks to CSV"
              >
                <Download className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                <span className="hidden sm:inline">Export</span>
              </button>

              {/* Notification Center Bell Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsNotifOpen(!isNotifOpen)}
                  className="p-2.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer relative"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full animate-pulse" />
                </button>

                {isNotifOpen && (
                  <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 space-y-3 animate-popup-in text-slate-900 dark:text-slate-100">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                      <span className="text-xs font-black uppercase">Recent Updates</span>
                      <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">Live Feed</span>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white block">Sprint Goal Active</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">Team updated task statuses in Kanban board</span>
                      </div>
                      <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-100 dark:border-slate-700/60 text-slate-700 dark:text-slate-300">
                        <span className="font-bold text-slate-900 dark:text-white block">High Priority Due Alert</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{tasks.filter(t => t.priority === 'High Priority').length} high-priority tickets pending</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {selectedIds.length > 0 && (
                <button
                  onClick={() => setShowBulkDeleteModal(true)}
                  className="bg-rose-50 border border-rose-100 text-rose-600 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-rose-100 transition-colors animate-popup-in"
                  id="header-bulk-delete"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete ({selectedIds.length})</span>
                </button>
              )}

              {isAdmin && (
                <button
                  onClick={() => { setOnboardTargetTeam(undefined); setIsOnboardModalOpen(true); }}
                  className="bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-[13px] px-3.5 py-2.5 rounded-xl shadow-md shadow-emerald-500/10 flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
                  id="top-onboard-member-btn"
                  title="Onboard New Team Member"
                >
                  <UserPlus className="w-4 h-4" />
                  <span className="hidden sm:inline">Onboard Member</span>
                </button>
              )}

              <button
                onClick={() => handleAddTask()}
                className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-[13px] px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-100 flex items-center gap-2 transition-all cursor-pointer shrink-0"
                id="top-add-task-btn"
              >
                <Plus className="w-4 h-4" />
                <span>New Task</span>
              </button>
            </div>
          </div>
        </header>

        {/* GLOBAL BROADCAST ANNOUNCEMENT BANNER */}
        {announcement && (
          <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 font-bold px-4 py-2 text-xs flex items-center justify-between shrink-0 shadow-md z-20">
            <div className="flex items-center gap-2 max-w-5xl truncate mx-auto">
              <Megaphone className="w-4 h-4 shrink-0 animate-bounce text-slate-900" />
              <span className="truncate">{announcement}</span>
            </div>
            <button 
              onClick={() => setAnnouncement('')}
              className="p-1 hover:bg-amber-600/30 rounded-lg text-slate-900 transition-colors cursor-pointer"
              title="Dismiss Banner"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* WORKSPACE ACTIVE VIEW SECTION */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 pb-24 lg:pb-0" id="main-content-area">
          <div className="w-full flex flex-col h-full" id="sprint-dashboard-stage-wrapper">
            
            {/* View header description area */}
            <div className="flex flex-row items-center justify-between gap-2 px-3 sm:px-8 py-2.5" id="view-intro-bar">
              {/* Mobile Search Bar */}
              <div className="lg:hidden relative flex-1 min-w-0">
                <Search className="absolute inset-y-0 left-3 flex items-center text-slate-400 dark:text-slate-500 w-3.5 h-3.5 my-auto" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:border-indigo-300 dark:focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 rounded-xl py-1.5 pl-8 pr-3 text-xs outline-none shadow-xs truncate"
                />
              </div>

              {/* Grid-Utility bar widgets */}
              {currentView !== 'inbox' && currentView !== 'analytics' && (
                <>
                  {/* Click outside backdrop for popovers */}
                  {(isFilterOpen || isSortOpen) && (
                    <div 
                      className="fixed inset-0 z-20 bg-black/5 sm:bg-transparent" 
                      onClick={() => { setIsFilterOpen(false); setIsSortOpen(false); }} 
                    />
                  )}

                  <div className="w-fit ml-auto flex items-center gap-1 text-slate-500 dark:text-slate-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-xs relative z-20 shrink-0" id="utility-bar-widgets">
                    


                    {/* FILTER BUTTON & POPUP */}
                    <div className="relative">
                      <button 
                        onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          filterPriority !== 'ALL' || filterStatus !== 'ALL'
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200/80 dark:border-indigo-800 shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        }`} 
                        title="Filter tasks"
                        id="utility-filter-btn"
                      >
                        <Filter className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Filter</span>
                        {(filterPriority !== 'ALL' || filterStatus !== 'ALL') && (
                          <span className="flex items-center justify-center w-4 h-4 text-[9px] font-black bg-indigo-600 text-white rounded-full">
                            {(filterPriority !== 'ALL' ? 1 : 0) + (filterStatus !== 'ALL' ? 1 : 0)}
                          </span>
                        )}
                      </button>

                      {isFilterOpen && (
                        <div className="absolute left-0 sm:left-auto sm:right-0 top-11 w-72 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-popup-in text-slate-800 dark:text-slate-100 space-y-4" id="filter-popover-menu">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2.5">
                            <div className="flex items-center gap-2">
                              <Filter className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">Filter Tasks</span>
                            </div>
                            {(filterPriority !== 'ALL' || filterStatus !== 'ALL' || filterAssigned !== 'ME') && (
                              <button 
                                onClick={() => { setFilterPriority('ALL'); setFilterStatus('ALL'); setFilterAssigned('ME'); }}
                                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Clear All
                              </button>
                            )}
                          </div>

                          {/* Assignee Filter Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Assigned Member</label>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                onClick={() => setFilterAssigned('ME')}
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                  filterAssigned === 'ME' || !isAdmin
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-2 ring-indigo-500/30 font-black'
                                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                }`}
                              >
                                <User className="w-3 h-3 text-indigo-500" />
                                My Assigned Tasks ({currentUser?.name ? currentUser.name.split(' ')[0] : 'Me'})
                              </button>

                              {isAdmin ? (
                                <button
                                  onClick={() => setFilterAssigned('ALL')}
                                  className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                                    filterAssigned === 'ALL'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-2 ring-emerald-500/30 font-black'
                                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  <Users className="w-3 h-3 text-emerald-500" />
                                  All Workspace Tasks
                                </button>
                              ) : (
                                <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/60 border border-amber-200/60 dark:border-amber-900 px-2 py-1 rounded-xl flex items-center gap-1">
                                  <span>🔒 Team Member: Restricted to assigned tasks</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Priority Filter Chip Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Priority Level</label>
                            <div className="flex flex-wrap gap-1.5">
                              {[
                                { id: 'ALL', label: 'All', color: 'bg-slate-100 text-slate-700 border-slate-200' },
                                { id: 'High Priority', label: 'High', dot: 'bg-rose-500', color: 'bg-rose-50 text-rose-700 border-rose-200' },
                                { id: 'Medium Priority', label: 'Medium', dot: 'bg-amber-500', color: 'bg-amber-50 text-amber-700 border-amber-200' },
                                { id: 'Low Priority', label: 'Low', dot: 'bg-blue-500', color: 'bg-blue-50 text-blue-700 border-blue-200' },
                                { id: 'Minimal Priority', label: 'Minimal', dot: 'bg-slate-400', color: 'bg-slate-50 text-slate-600 border-slate-200' }
                              ].map((p) => {
                                const active = filterPriority === p.id;
                                return (
                                  <button
                                    key={p.id}
                                    onClick={() => setFilterPriority(p.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                      active 
                                        ? `${p.color} ring-2 ring-indigo-500/30 shadow-xs font-black scale-105` 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {p.dot && <span className={`w-2 h-2 rounded-full ${p.dot}`} />}
                                    {p.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Status Filter Chip Selector */}
                          <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Status</label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {[
                                { id: 'ALL', label: 'All Statuses' },
                                { id: 'Not started', label: 'Not Started', dot: 'bg-slate-400' },
                                { id: 'In progress', label: 'In Progress', dot: 'bg-indigo-500' },
                                { id: 'In review', label: 'In Review', dot: 'bg-purple-500' },
                                { id: 'Completed', label: 'Completed', dot: 'bg-emerald-500' }
                              ].map((s) => {
                                const active = filterStatus === s.id;
                                return (
                                  <button
                                    key={s.id}
                                    onClick={() => setFilterStatus(s.id)}
                                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border text-left transition-all cursor-pointer ${
                                      active 
                                        ? 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold shadow-xs' 
                                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                  >
                                    {s.dot ? <span className={`w-2 h-2 rounded-full ${s.dot}`} /> : <span className="w-2 h-2 rounded-full bg-slate-300" />}
                                    <span className="truncate">{s.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* Footer Stats summary */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-slate-500">
                            <span>Showing {filteredTasks.length} of {tasks.length} tasks</span>
                            <button
                              onClick={() => setIsFilterOpen(false)}
                              className="bg-slate-900 text-white hover:bg-slate-800 px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* SORT BUTTON & POPUP */}
                    <div className="relative">
                      <button 
                        onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          sortBy !== 'default'
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200/80 dark:border-indigo-800 shadow-xs'
                            : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                        }`} 
                        title="Sort tasks"
                        id="utility-sort-btn"
                      >
                        <ArrowUpDown className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold">Sort</span>
                        {sortBy !== 'default' && (
                          <span className="w-2 h-2 bg-indigo-600 rounded-full" />
                        )}
                      </button>

                      {isSortOpen && (
                        <div className="absolute left-0 sm:left-auto sm:right-0 top-11 w-64 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-popup-in text-slate-800 dark:text-slate-100 space-y-3" id="sort-popover-menu">
                          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                            <div className="flex items-center gap-2">
                              <ArrowUpDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                              <span className="text-xs font-black uppercase text-slate-800 dark:text-white tracking-wider">Sort Tasks</span>
                            </div>
                            {sortBy !== 'default' && (
                              <button 
                                onClick={() => { setSortBy('default'); setSortOrder('asc'); }}
                                className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Reset
                              </button>
                            )}
                          </div>

                          <div className="space-y-1">
                            {[
                              { id: 'default', label: 'Default Order' },
                              { id: 'title', label: 'Task Title (A-Z)' },
                              { id: 'priority', label: 'Priority Level' },
                              { id: 'status', label: 'Task Status' },
                              { id: 'dueDate', label: 'Due Date' }
                            ].map((opt) => {
                              const active = sortBy === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => setSortBy(opt.id as any)}
                                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                    active 
                                      ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-200/80 dark:border-indigo-800 shadow-2xs' 
                                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  <span>{opt.label}</span>
                                  {active && <span className="text-indigo-600 dark:text-indigo-400">✓</span>}
                                </button>
                              );
                            })}
                          </div>

                          {sortBy !== 'default' && (
                            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Direction</span>
                              <button
                                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                                className="text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
                              >
                                {sortOrder === 'asc' ? '↑ Ascending' : '↓ Descending'}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* FULLSCREEN BUTTON */}
                    <button 
                      onClick={() => {
                        const nextState = !isFullscreen;
                        setIsFullscreen(nextState);
                        if (nextState) {
                          if (document.documentElement.requestFullscreen) {
                            document.documentElement.requestFullscreen().catch(() => {});
                          }
                        } else {
                          if (document.fullscreenElement && document.exitFullscreen) {
                            document.exitFullscreen().catch(() => {});
                          }
                        }
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        isFullscreen 
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 border border-indigo-200/80 dark:border-indigo-800 shadow-xs' 
                          : 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100/80 dark:hover:bg-slate-800/80'
                      }`} 
                      title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen View'}
                      id="utility-fullscreen-btn"
                    >
                      {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
                    </button>

                  </div>
                </>
              )}
            </div>

            {/* Active Rendered Content Stage */}
            <div 
              className={`flex-1 min-h-0 ${
                isFullscreen 
                  ? 'fixed inset-0 z-50 bg-slate-50 dark:bg-slate-950 p-6 overflow-auto flex flex-col shadow-2xl animate-popup-in' 
                  : ''
              }`} 
              id="sprint-dashboard-stage"
            >
              {isFullscreen && (
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 bg-white p-3 rounded-xl shadow-xs">
                  <span className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-indigo-600" />
                    Expanded Stage View
                  </span>
                  <button
                    onClick={() => {
                      setIsFullscreen(false);
                      if (document.fullscreenElement && document.exitFullscreen) {
                        document.exitFullscreen().catch(() => {});
                      }
                    }}
                    className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-colors"
                  >
                    Exit Fullscreen
                  </button>
                </div>
              )}
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentView}
                  initial={{ opacity: 0, y: 8, scale: 0.995 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.995 }}
                  transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
                  className="h-full flex flex-col min-h-0"
                >
                  {currentView === 'overview' && (
                    <OverviewTable 
                      tasks={filteredTasks}
                      teamMembers={teamMembers}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                      onAddTask={handleAddTask}
                      onSelectTask={setSelectedTask}
                      selectedIds={selectedIds}
                      onToggleSelect={handleToggleSelect}
                      onToggleSelectAll={handleToggleSelectAll}
                      currentUser={currentUser}

                      isAdmin={isAdmin}
                    />
                  )}

                  {currentView === 'kanban' && (
                    <KanbanBoard 
                      tasks={filteredTasks}
                      teamMembers={teamMembers}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                      onSelectTask={setSelectedTask}
                      isAdmin={isAdmin}
                    />
                  )}

                  {currentView === 'timeline' && (
                    <TimelineView 
                      tasks={filteredTasks}
                      teamMembers={teamMembers}
                      onSelectTask={setSelectedTask}
                    />
                  )}

                  {currentView === 'analytics' && (
                    <AnalyticsView 
                      tasks={tasks}
                      teamMembers={teamMembers}
                    />
                  )}

                  {currentView === 'due' && (
                    <div className="space-y-6 flex flex-col h-full">
                      <div className="p-4 bg-rose-50 border border-rose-100 text-rose-700 rounded-xl text-[13px] font-semibold flex items-start gap-3 max-w-2xl text-left mx-8">
                        <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 animate-pulse" />
                        <span>Below are high-priority sprint items requiring immediate review.</span>
                      </div>
                      <OverviewTable 
                        tasks={filteredTasks}
                        teamMembers={teamMembers}
                        onUpdateTask={handleUpdateTask}
                        onDeleteTask={handleDeleteTask}
                        onAddTask={handleAddTask}
                        onSelectTask={setSelectedTask}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onToggleSelectAll={handleToggleSelectAll}
                        currentUser={currentUser}

                        isAdmin={isAdmin}
                      />
                    </div>
                  )}

                  {currentView === 'inbox' && (
                    <InboxPanel 
                      tasks={tasks}
                      teamMembers={teamMembers}
                      onTasksUpdateExternally={handleTasksUpdateExternally}
                      currentUser={currentUser}
                    />
                  )}

                  {isAdmin && currentView === 'admin_panel' && (
                    <AdminPanelView 
                      teamMembers={teamMembers}
                      onUpdateTeamMembers={(updated) => setTeamMembers(updated)}
                      tasks={tasks}
                      onOpenOnboardModal={(team) => {
                        setOnboardTargetTeam(team);
                        setIsOnboardModalOpen(true);
                      }}
                      currentUser={currentUser}
                      onUpdateCurrentUser={(user) => setCurrentUser(user)}
                      announcement={announcement}
                      onUpdateAnnouncement={(text) => {
                        setAnnouncement(text);
                        localStorage.setItem('pinobite_ws_announcement', text);
                      }}
                    />
                  )}

                  {currentView === 'team_panel' && (
                    <TeamPanelView 
                      teamMembers={teamMembers}
                      tasks={tasks}
                      onUpdateTeamMembers={(updated) => setTeamMembers(updated)}
                      onOpenAddTask={(assignedMemberId) => {
                        handleAddTask(assignedMemberId);
                      }}
                      onOpenOnboardModal={(team) => {
                        setOnboardTargetTeam(team);
                        setIsOnboardModalOpen(true);
                      }}
                      onLoginAsMember={handleLoginSuccess}
                      currentUser={currentUser}
                      isAdmin={isAdmin}
                    />
                  )}

                  {currentView === 'social_media' && (
                    <SocialMediaMarketingView />
                  )}

                  {currentView === 'team_onboarding' && (
                    <TeamOnboardingView 
                      teamMembers={teamMembers}
                      onUpdateTeamMembers={(updated) => setTeamMembers(updated)}
                      onOpenOnboardModal={(team) => {
                        setOnboardTargetTeam(team);
                        setIsOnboardModalOpen(true);
                      }}
                      onOpenAddTask={(assignedMemberId) => {
                        handleAddTask(assignedMemberId);
                      }}
                      tasks={tasks}
                      onLoginAsMember={handleLoginSuccess}
                      currentUser={currentUser}
                      isAdmin={isAdmin}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

          </div>
        </main>

      </div>

      {/* NATIVE MOBILE BOTTOM NAVIGATION BAR */}
      <nav 
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 shadow-2xl py-1.5 px-2 flex justify-around items-center"
        id="native-mobile-bottom-nav"
      >
        <button
          onClick={() => { setCurrentView('overview'); setSelectedIds([]); }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            currentView === 'overview' ? 'text-indigo-600 font-black' : 'text-slate-400 font-semibold'
          }`}
        >
          <Table className="w-5 h-5" />
          <span className="text-[10px]">Overview</span>
        </button>

        <button
          onClick={() => { setCurrentView('kanban'); setSelectedIds([]); }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            currentView === 'kanban' ? 'text-indigo-600 font-black' : 'text-slate-400 font-semibold'
          }`}
        >
          <Kanban className="w-5 h-5" />
          <span className="text-[10px]">Board</span>
        </button>

        <button
          onClick={() => handleAddTask()}
          className="flex flex-col items-center gap-1 p-1 text-indigo-600 font-bold active:scale-95 transition-all cursor-pointer"
          id="bottom-nav-create-btn"
        >
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-black text-indigo-600">Create</span>
        </button>

        <button
          onClick={() => { setCurrentView('analytics'); setSelectedIds([]); }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
            currentView === 'analytics' ? 'text-indigo-600 font-black' : 'text-slate-400 font-semibold'
          }`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px]">Metrics</span>
        </button>

        <button
          onClick={() => { setCurrentView('inbox'); setSelectedIds([]); }}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all relative ${
            currentView === 'inbox' ? 'text-indigo-600 font-black' : 'text-slate-400 font-semibold'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px]">Inbox</span>
        </button>
      </nav>

      {/* LIVE COLLABORATION & ACTION ALERT TOAST (Auto-dismisses in 2 seconds) */}
      {toast && (
        <div 
          onClick={() => setToast(null)}
          className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-50 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 shadow-2xl flex items-start gap-3 max-w-sm animate-popup-in text-slate-100 cursor-pointer backdrop-blur-md"
          id="realtime-notification-toast"
        >
          <div className="w-8 h-8 rounded-full bg-indigo-600 text-white font-extrabold text-[11px] flex items-center justify-center shrink-0 shadow">
            {toast.title.substring(0,2).toUpperCase()}
          </div>
          <div className="text-left space-y-0.5 flex-1 pr-1">
            <span className="text-xs font-bold text-indigo-400 block">{toast.title}</span>
            <span className="text-xs text-slate-400 leading-normal block">{toast.message}</span>
          </div>
          <button 
            type="button"
            onClick={(e) => { e.stopPropagation(); setToast(null); }}
            className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded-lg hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* DRAWER / MODAL FOR SINGLE TASK */}
      {selectedTask && (
        <TaskModal 
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={handleUpdateTask}
          onDelete={handleDeleteTask}
          currentUser={currentUser}
          teamMembers={teamMembers}
          isAdmin={isAdmin}
        />
      )}

      {/* MEMBER ONBOARDING MODAL */}
      {isOnboardModalOpen && (
        <OnboardMemberModal
          onClose={() => setIsOnboardModalOpen(false)}
          initialTeam={onboardTargetTeam}
          onMemberOnboarded={async () => {
            const updatedMembers = await ApiClient.getTeamMembers();
            setTeamMembers(updatedMembers);
          }}
          tasks={tasks}
          onLoginAsMember={handleLoginSuccess}
        />
      )}

      {/* AI ASSISTANT MODAL ADD-ON */}
      {isAiModalOpen && (
        <AIAssistantModal
          tasks={tasks}
          onClose={() => setIsAiModalOpen(false)}
          onAddTask={handleAiAddTask}
        />
      )}

      {/* FOCUS TIMER MODAL ADD-ON */}
      {isFocusTimerOpen && (
        <FocusTimerModal
          tasks={tasks}
          onClose={() => setIsFocusTimerOpen(false)}
        />
      )}

      {/* BULK DELETE CONFIRMATION POPUP MODAL */}
      {showBulkDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-overlay-fade">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-popup-in text-center relative">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Selected Tasks?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete <span className="text-rose-400 font-bold">{selectedIds.length}</span> selected tasks? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowBulkDeleteModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleBulkDelete();
                  setShowBulkDeleteModal(false);
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Delete {selectedIds.length}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
