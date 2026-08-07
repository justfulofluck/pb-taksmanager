import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  AlertTriangle, 
  Users, 
  Tag, 
  Check, 
  GripVertical, 
  MoreHorizontal, 
  CheckSquare, 
  Sliders, 
  Search, 
  Plus, 
  Trash2, 
  Clock, 
  ChevronDown,
  Info,
  Edit2,
  UserPlus,
  CheckCircle2
} from 'lucide-react';
import { Task, TeamMember, TaskStatus, TaskPriority } from '../types';
import { INITIAL_TEAM, TAG_OPTIONS } from '../data/team';
import { UserAvatar } from './UserAvatar';

interface OverviewTableProps {
  tasks: Task[];
  teamMembers?: TeamMember[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  onAddTask: (task: Task) => void;
  onSelectTask: (task: Task) => void;
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onToggleSelectAll: () => void;
  currentUser?: { email: string; name: string } | null;

  isAdmin?: boolean;
}

const SubtaskRow = ({ st, onUpdate }: { st: any, onUpdate: (updated: any) => void }) => {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(st.timeSpent || 0);

  useEffect(() => {
    let interval: any;
    if (active && !st.completed) {
      interval = setInterval(() => setSeconds((s: number) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [active, st.completed]);

  const handleToggleTimer = () => {
    if (active) {
      setActive(false);
      onUpdate({ ...st, timeSpent: seconds });
    } else {
      setActive(true);
    }
  };

  const handleComplete = (checked: boolean) => {
    setActive(false);
    onUpdate({ ...st, completed: checked, timeSpent: seconds });
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2.5 group/st">
      <input
        type="checkbox"
        checked={st.completed}
        onChange={(e) => handleComplete(e.target.checked)}
        className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-600 focus:ring-emerald-500/20 cursor-pointer transition-colors shrink-0"
      />
      <span className={`text-[12px] font-medium transition-colors truncate ${st.completed ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-700 dark:text-slate-300'}`}>
        {st.title}
      </span>
      
      <div className="ml-auto flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 rounded px-2 py-0.5 shrink-0 border border-slate-200 dark:border-slate-700 transition-colors">
        <Clock className={`w-3 h-3 ${active ? 'text-emerald-500 animate-pulse' : 'text-indigo-500'}`} />
        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-mono w-10 text-center">
          {formatTime(seconds)}
        </span>
        {!st.completed && (
          <button 
            type="button" 
            onClick={handleToggleTimer}
            className={`transition-colors ml-1 cursor-pointer ${active ? 'text-rose-500 hover:text-rose-600' : 'text-slate-400 hover:text-emerald-500'}`} 
            title={active ? "Stop Timer" : "Start Timer"}
          >
            {active ? (
               <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
            ) : (
               <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

const MainTaskTimer = ({ task, onUpdate }: { task: any, onUpdate: (updated: any) => void }) => {
  const [active, setActive] = useState(false);
  const [seconds, setSeconds] = useState(task.timeSpent || 0);

  // Sync if updated externally (e.g., from subtasks)
  useEffect(() => {
    if (!active) {
      setSeconds(task.timeSpent || 0);
    }
  }, [task.timeSpent, active]);

  useEffect(() => {
    let interval: any;
    if (active) {
      interval = setInterval(() => setSeconds((s: number) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [active]);

  const handleToggleTimer = () => {
    if (active) {
      setActive(false);
      onUpdate({ ...task, timeSpent: seconds });
    } else {
      setActive(true);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) return `${hrs}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold border transition-colors shrink-0 ${
      active 
        ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800' 
        : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800'
    }`}>
      <Clock className={`w-3 h-3 ${active ? 'animate-pulse' : ''}`} />
      <span className="font-mono">{formatTime(seconds)}</span>
      <button 
        type="button" 
        onClick={handleToggleTimer}
        className={`ml-1 cursor-pointer transition-colors ${
          active ? 'text-rose-500 hover:text-rose-700' : 'text-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-300'
        }`}
        title={active ? "Stop Timer" : "Start Timer"}
      >
        {active ? (
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M6 6h12v12H6z"/></svg>
        ) : (
          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
        )}
      </button>
    </div>
  );
};

export default function OverviewTable({
  tasks,
  teamMembers = [],
  onUpdateTask,
  onDeleteTask,
  onAddTask,
  onSelectTask,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll,
  currentUser,

  isAdmin = true
}: OverviewTableProps) {

  // Dropdown states per column
  const [activeDropdown, setActiveDropdown] = useState<{ rowId: string; col: 'status' | 'priority' | 'assign' } | null>(null);
  
  // Custom search query for Priority or Assigned dropdowns
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create dropdown container reference to handle clicking outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdown(null);
        setSearchQuery('');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStatusChange = (task: Task, status: TaskStatus) => {
    onUpdateTask({ ...task, status });
    setActiveDropdown(null);
  };

  const handlePriorityChange = (task: Task, priority: TaskPriority) => {
    onUpdateTask({ ...task, priority });
    setActiveDropdown(null);
  };

  const handleAssignChange = (task: Task, memberId: string) => {
    let assigned = [...task.assignedTo];
    if (assigned.includes(memberId)) {
      assigned = assigned.filter(id => id !== memberId);
    } else {
      assigned.push(memberId);
    }
    onUpdateTask({ ...task, assignedTo: assigned });
  };

  // Status visual render helpers
  const getStatusBadgeStyle = (status: TaskStatus) => {
    switch (status) {
      case 'Not started': 
        return 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700';
      case 'In progress': 
        return 'bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/60';
      case 'Done': 
        return 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/60';
    }
  };

  const getStatusBulletColor = (status: TaskStatus) => {
    switch (status) {
      case 'Not started': return 'bg-slate-400';
      case 'In progress': return 'bg-indigo-500';
      case 'Done': return 'bg-emerald-500';
    }
  };

  // Priority badge styling helper
  const getPriorityBadgeStyle = (priority: TaskPriority) => {
    switch (priority) {
      case 'High Priority':
        return 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/60';
      case 'Low Priority':
        return 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/60';
      case 'Minimal Priority':
        return 'bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/60';
      default:
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700';
    }
  };

  // Add new inline task
  const handleInlineAdd = () => {
    const activeMember = teamMembers.find(m => 
      currentUser && (
        m.email.toLowerCase() === currentUser.email.toLowerCase() ||
        m.name.toLowerCase() === currentUser.name.toLowerCase()
      )
    );
    const creatorEmail = currentUser?.email || 'admin@pinobite.com';
    const assignee = activeMember ? activeMember.id : (teamMembers.length > 0 ? teamMembers[0].id : creatorEmail);

    const newTask: Task = {
      id: `task-${Date.now()}`,
      task: '🚀 Active Sprint Task',
      description: 'Sprint collaboration item...',
      status: 'In progress',
      dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
      priority: 'High Priority',
      tags: ['Sprint-1'],
      assignedTo: [assignee],
      createdAt: new Date().toISOString(),
      createdBy: creatorEmail
    };
    onAddTask(newTask);
  };

  return (
    <div className="w-full flex-1 flex flex-col min-h-0 overflow-hidden select-none" id="saas-view-container">
      
      {/* MOBILE RESPONSIVE LIST CARDS (< 640px) */}
      <div className="flex sm:hidden flex-col flex-1 overflow-y-auto p-4 pb-28 space-y-3 bg-slate-50 dark:bg-slate-950" id="saas-mobile-card-list">
        {tasks.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center justify-center space-y-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <Info className="w-8 h-8 text-indigo-500 animate-pulse" />
            <div className="text-sm font-bold text-slate-900 dark:text-slate-100">No active sprint items found</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs">Create or activate sprint tasks in this workspace to monitor team collaboration loops.</p>
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-1 w-full">
              <button
                onClick={handleInlineAdd}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Your First Task</span>
              </button>
            </div>
          </div>
        ) : (
          tasks.map((task) => {
            const isSelected = selectedIds.includes(task.id);
            return (
              <div 
                key={task.id} 
                className={`p-4 rounded-2xl border transition-all space-y-3 text-left ${
                  isSelected ? 'bg-indigo-50/60 dark:bg-indigo-950/60 border-indigo-300 dark:border-indigo-800 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-xs'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelect(task.id)}
                      className="mt-1 rounded border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500/20 w-4 h-4 cursor-pointer shrink-0"
                    />
                    <div className="flex-1 min-w-0 space-y-1">
                      <input
                        type="text"
                        value={task.task}
                        onChange={(e) => onUpdateTask({ ...task, task: e.target.value })}
                        placeholder="Task title..."
                        className="w-full font-bold text-slate-900 dark:text-slate-100 text-sm bg-transparent outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-1 py-0.5"
                      />
                      <input
                        type="text"
                        value={task.description}
                        onChange={(e) => onUpdateTask({ ...task, description: e.target.value })}
                        placeholder="Add brief description..."
                        className="w-full text-xs text-slate-500 dark:text-slate-400 bg-transparent outline-none focus:bg-slate-100 dark:focus:bg-slate-800 rounded px-1 py-0.5"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {isAdmin && onDeleteTask && (
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950 transition-colors shrink-0 cursor-pointer"
                        title="Delete task"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onSelectTask(task)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
                    >
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {task.tags.map((tag) => (
                    <span key={tag} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded font-bold border border-slate-200 dark:border-slate-700">
                      {tag}
                    </span>
                  ))}
                  <button
                    onClick={() => onSelectTask(task)}
                    className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5"
                  >
                    + Tag
                  </button>
                </div>

                {/* Status, Priority, Due Date Badges - Interactive on Mobile */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs gap-2 flex-wrap">
                  <button
                    onClick={() => {
                      const nextStatus: TaskStatus = task.status === 'Not started' ? 'In progress' : task.status === 'In progress' ? 'Done' : 'Not started';
                      handleStatusChange(task, nextStatus);
                    }}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold border cursor-pointer active:scale-95 transition-transform flex items-center gap-1.5 ${getStatusBadgeStyle(task.status)}`}
                    title="Tap to cycle status"
                  >
                    <span className={`w-2 h-2 rounded-full ${getStatusBulletColor(task.status)}`} />
                    <span>{task.status}</span>
                  </button>

                  <button
                    onClick={() => {
                      const priorities: TaskPriority[] = ['High Priority', 'Low Priority', 'Minimal Priority', '' as TaskPriority];
                      const currentIdx = priorities.indexOf(task.priority);
                      const nextPrio = priorities[(currentIdx + 1) % priorities.length];
                      handlePriorityChange(task, nextPrio);
                    }}
                    className={`px-2.5 py-1.5 rounded-full text-[10px] font-black uppercase border cursor-pointer active:scale-95 transition-transform ${
                      task.priority === 'High Priority' ? 'bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-950/80 dark:text-rose-400 dark:border-rose-900/60' :
                      task.priority === 'Low Priority' ? 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/80 dark:text-amber-400 dark:border-amber-900/60' :
                      task.priority === 'Minimal Priority' ? 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-950/80 dark:text-violet-400 dark:border-violet-900/60' :
                      'bg-slate-50 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
                    }`}
                    title="Tap to cycle priority"
                  >
                    {task.priority || 'Normal'}
                  </button>

                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-semibold flex items-center gap-1 bg-slate-50 dark:bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{task.dueDate || 'No date'}</span>
                  </div>

                  {/* Assigned To User Avatars */}
                  <div className="flex items-center gap-1.5 cursor-pointer ml-auto" onClick={() => onSelectTask(task)}>
                    {task.assignedTo.length > 0 ? (
                      <div className="flex -space-x-1.5 overflow-hidden py-0.5">
                        {task.assignedTo.map((id) => {
                          const member = teamMembers.find(t => t.id === id);
                          return <UserAvatar key={id} member={member} size="sm" className="ring-2 ring-white dark:ring-slate-900" />;
                        })}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-semibold italic flex items-center gap-1">
                        <UserPlus className="w-3.5 h-3.5 text-slate-400" /> Unassigned
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}


      </div>

      {/* DESKTOP/TABLET SPREADSHEET TABLE (>= 640px) */}
      <div className="hidden sm:flex flex-1 flex-col min-h-0 overflow-auto bg-white dark:bg-slate-900" id="saas-table-scroller">
        <div className="min-w-[950px] flex-1 flex flex-col min-h-0">
          
          {/* SaaS Tasks Header Row (Sticky at the top) */}
          <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-[10px] font-bold tracking-widest uppercase shrink-0" id="saas-list-header">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="flex items-center justify-center w-8 shrink-0">
                <input
                  type="checkbox"
                  checked={tasks.length > 0 && selectedIds.length === tasks.length}
                  onChange={onToggleSelectAll}
                  className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer w-4 h-4"
                  title="Select all tasks"
                />
              </div>
              <span className="font-sans text-left">Task Details & Description</span>
            </div>

            <div className="flex items-center gap-6 shrink-0 text-left">
              <span className="w-32 font-sans">Status</span>
              <span className="w-32 font-sans">Due Date</span>
              <span className="w-32 font-sans">Priority</span>
              <span className="w-24 font-sans">Assigned</span>
              <span className="w-10 text-center font-sans">More</span>
            </div>
          </div>

          {/* Task List container - Beautiful scrollable list with clean card rows */}
          <div className="flex-1 overflow-y-auto min-h-0 divide-y divide-slate-100 dark:divide-slate-800/80" id="saas-list-body">
            {tasks.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center space-y-4" id="empty-tasks-fallback">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/60 rounded-full border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
                  <Info className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>
                <div className="text-base font-bold text-slate-900 dark:text-slate-100">No active sprint items found</div>
                <p className="text-[13px] text-slate-500 dark:text-slate-400 max-w-sm leading-relaxed">
                  Create a task in this workspace to monitor team collaboration loops and live sprint sync workflows.
                </p>
                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={handleInlineAdd}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Your First Task</span>
                  </button>
                </div>
              </div>
            ) : (
              <AnimatePresence initial={false}>
                {tasks.map((task) => {
                  const isSelected = selectedIds.includes(task.id);
                  return (
                    <motion.div 
                      key={task.id} 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0, scale: 0.98 }}
                      transition={{ duration: 0.18 }}
                      className={`group flex items-center justify-between px-4 py-5 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-all text-[13px] text-slate-700 dark:text-slate-200 ${
                        isSelected ? 'bg-indigo-50/30 dark:bg-indigo-950/30' : 'bg-white dark:bg-slate-900'
                      }`}
                      id={`task-row-${task.id}`}
                    >
                    {/* 1. Left side: Checkbox, Title, and Description stacked */}
                    <div className="flex items-start gap-4 flex-1 min-w-0 pr-4">
                      <div className="flex items-center justify-center w-8 shrink-0 mt-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onToggleSelect(task.id)}
                          className="rounded border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer w-4 h-4 transition-all"
                        />
                      </div>

                      {/* Task text inputs (Sleek seamless inputs) */}
                      <div className="flex-1 min-w-0 text-left space-y-0.5">
                        <div className="flex items-center gap-2 group-hover:translate-x-0.5 transition-transform">
                          <input
                            type="text"
                            value={task.task}
                            onChange={(e) => onUpdateTask({ ...task, task: e.target.value })}
                            placeholder="Type task title..."
                            className="w-full bg-transparent border-transparent text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-600 outline-none focus:bg-slate-100 dark:focus:bg-slate-800 focus:border-slate-200 dark:focus:border-slate-700 focus:ring-0 rounded px-1.5 py-0.5 text-[15px] font-bold transition-all"
                          />
                        </div>
                        <input
                          type="text"
                          value={task.description}
                          onChange={(e) => onUpdateTask({ ...task, description: e.target.value })}
                          placeholder="Add brief task description..."
                          className="w-full bg-transparent border-transparent text-[13px] text-slate-500 dark:text-slate-400 placeholder-slate-300 dark:placeholder-slate-600 outline-none focus:bg-slate-100 dark:focus:bg-slate-800 focus:border-slate-200 dark:focus:border-slate-700 focus:ring-0 rounded px-1.5 py-0.5 transition-all font-medium"
                        />

                        {/* Inline Subtasks List */}
                        {task.subtasks && task.subtasks.length > 0 && (
                          <div className="pt-2 pl-1.5 space-y-1.5">
                            {task.subtasks.map((st) => (
                              <SubtaskRow
                                key={st.id}
                                st={st}
                                onUpdate={(updatedSt) => {
                                  const updatedSubtasks = task.subtasks!.map(s => s.id === updatedSt.id ? updatedSt : s);
                                  
                                  let updatedTask = { ...task, subtasks: updatedSubtasks };
                                  
                                  // Check if all subtasks are completed
                                  const allCompleted = updatedSubtasks.every(s => s.completed);
                                  if (allCompleted) {
                                      const totalTime = updatedSubtasks.reduce((sum, s) => sum + (s.timeSpent || 0), 0);
                                      updatedTask.timeSpent = totalTime;
                                  }
                                  
                                  onUpdateTask(updatedTask);
                                }}
                              />
                            ))}
                          </div>
                        )}

                        {/* Inline Tag List representation */}
                        <div className="flex flex-wrap gap-1.5 pt-2 pl-1.5">
                          {task.tags.map((tag) => (
                            <span 
                              key={tag} 
                              className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2.5 py-0.5 rounded text-[10px] font-bold border border-slate-200 dark:border-slate-700 transition-colors"
                            >
                              {tag}
                            </span>
                          ))}
                          {/* Task Timer (Rendered if no subtasks OR if we just want it available on all tasks) */}
                          <MainTaskTimer task={task} onUpdate={onUpdateTask} />
                          
                          <button
                            onClick={() => onSelectTask(task)}
                            className="text-[10px] text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors font-bold cursor-pointer"
                          >
                            + Tag
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* 2. Right side: Badges and Dropdowns */}
                    <div className="flex items-center gap-6 shrink-0">
                      
                      {/* Status Dropdown */}
                      <div className="w-32 relative">
                        <button
                          onClick={() => setActiveDropdown({ rowId: task.id, col: 'status' })}
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${getStatusBadgeStyle(task.status)}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusBulletColor(task.status)}`} />
                          <span className="truncate">{task.status}</span>
                          <ChevronDown className="w-3 h-3 opacity-50 shrink-0 ml-auto" />
                        </button>

                        {/* Dropdown menu */}
                        {activeDropdown?.rowId === task.id && activeDropdown.col === 'status' && (
                          <div 
                            ref={dropdownRef}
                            className="absolute left-0 mt-1 z-40 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 text-xs text-slate-700 dark:text-slate-200 animate-scale-up text-left"
                          >
                            <div className="space-y-0.5">
                              {(['Not started', 'In progress', 'Done'] as TaskStatus[]).map((status) => (
                                <button
                                  key={status}
                                  onClick={() => handleStatusChange(task, status)}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2.5 transition-all cursor-pointer font-semibold"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${getStatusBulletColor(status)}`} />
                                  <span>{status}</span>
                                  {task.status === status && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-auto" />}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Due Date Column */}
                      <div className="w-32">
                        <div className="flex items-center gap-2 py-2 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 px-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors w-full">
                          <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <input
                            type="date"
                            value={task.dueDate}
                            onChange={(e) => onUpdateTask({ ...task, dueDate: e.target.value })}
                            className="bg-transparent border-none text-slate-700 dark:text-slate-200 focus:text-slate-900 dark:focus:text-white outline-none w-full cursor-pointer py-0 text-xs font-bold"
                          />
                        </div>
                      </div>

                      {/* Priority Column */}
                      <div className="w-32 relative">
                        <button
                          onClick={() => setActiveDropdown({ rowId: task.id, col: 'priority' })}
                          className={`inline-flex items-center justify-between gap-1 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer w-full text-left ${getPriorityBadgeStyle(task.priority)}`}
                        >
                          <span className="truncate">{task.priority || 'No Priority'}</span>
                          <ChevronDown className="w-3 h-3 opacity-50 shrink-0" />
                        </button>

                        {/* Priority dropdown */}
                        {activeDropdown?.rowId === task.id && activeDropdown.col === 'priority' && (
                          <div 
                            ref={dropdownRef}
                            className="absolute left-0 mt-1 z-40 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1 text-xs text-slate-700 dark:text-slate-200 animate-scale-up text-left"
                          >
                            <div className="space-y-0.5">
                              {(['High Priority', 'Minimal Priority', 'Low Priority'] as TaskPriority[]).map((prio) => (
                                <button
                                  key={prio}
                                  onClick={() => handlePriorityChange(task, prio)}
                                  className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-2 transition-all cursor-pointer font-bold"
                                >
                                  <span className={`w-1.5 h-1.5 rounded-full ${prio === 'High Priority' ? 'bg-rose-500' : prio === 'Low Priority' ? 'bg-amber-500' : 'bg-violet-500'}`} />
                                  <span>{prio}</span>
                                  {task.priority === prio && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-auto" />}
                                </button>
                              ))}
                              <button
                                onClick={() => handlePriorityChange(task, '' as TaskPriority)}
                                className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 flex items-center gap-2 transition-all cursor-pointer font-bold"
                              >
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600" />
                                <span>No Priority</span>
                                {!task.priority && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 ml-auto" />}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Assigned To Overlapping Avatars Column */}
                      <div className="w-28 relative flex justify-start">
                        <button
                          onClick={() => setActiveDropdown({ rowId: task.id, col: 'assign' })}
                          className="hover:bg-slate-100 dark:hover:bg-slate-800 p-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 group/btn"
                        >
                          {task.assignedTo.length > 0 ? (
                            <div className="flex -space-x-2 overflow-hidden py-0.5">
                              {task.assignedTo.map((id) => {
                                 const member = teamMembers.find(t => t.id === id);
                                 if (!member) return null;
                                 return (
                                   <UserAvatar
                                     key={id}
                                     member={member}
                                     size="md"
                                     className="ring-2 ring-white dark:ring-slate-900 shadow-xs hover:scale-105 transition-transform"
                                   />
                                 );
                              })}
                            </div>
                          ) : (
                            <span className="text-slate-400 dark:text-slate-500 font-medium text-xs italic flex items-center gap-1 group-hover/btn:text-indigo-600 dark:group-hover/btn:text-indigo-400">
                              <UserPlus className="w-3.5 h-3.5" /> Unassigned
                            </span>
                          )}
                        </button>

                        {/* Assigned to dropdown */}
                        {activeDropdown?.rowId === task.id && activeDropdown.col === 'assign' && (
                          <div 
                            ref={dropdownRef}
                            className="absolute right-0 mt-1 z-40 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-2.5 text-xs text-slate-700 dark:text-slate-200 animate-scale-up text-left space-y-2"
                          >
                            <input
                              type="text"
                              placeholder="Search teammate..."
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              className="w-full bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 focus:border-indigo-400 dark:focus:border-indigo-500 rounded-xl py-2 px-3 text-xs outline-none"
                            />
                            <div className="space-y-1 max-h-52 overflow-y-auto">
                              {teamMembers.length === 0 ? (
                                <div className="p-3 text-center text-slate-400 text-xs font-medium">No team members onboarded yet.</div>
                              ) : (
                                teamMembers
                                  .filter(member => member.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                  .map((member) => {
                                    const isAssigned = task.assignedTo.includes(member.id);
                                    return (
                                      <button
                                        key={member.id}
                                        onClick={() => handleAssignChange(task, member.id)}
                                        className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                                          isAssigned 
                                            ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold' 
                                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2.5">
                                          <UserAvatar member={member} size="sm" />
                                          <div>
                                            <div className="text-xs">{member.name}</div>
                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">{member.email}</div>
                                          </div>
                                        </div>
                                        {isAssigned && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                                      </button>
                                    );
                                  })
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action Settings menu */}
                      <div className="w-16 text-center flex items-center justify-center gap-1">
                        {isAdmin && onDeleteTask && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                            className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/60 transition-all cursor-pointer"
                            title="Delete Task"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onSelectTask(task)}
                          className="text-indigo-600 hover:text-white bg-indigo-50 hover:bg-indigo-600 dark:bg-indigo-900/30 dark:hover:bg-indigo-600 dark:text-indigo-400 dark:hover:text-white px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap"
                          title="View comments & details"
                        >
                          Action
                        </button>
                      </div>

                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}

            {/* Elegant SaaS 'New Task' inline row */}
            <div className="p-4 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between border-t border-slate-100 dark:border-slate-800 shrink-0" id="saas-bottom-actions">
              <button
                onClick={handleInlineAdd}
                className="text-[13px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-2 transition-colors cursor-pointer pl-4"
                id="inline-add-page-btn"
              >
                <Plus className="w-5 h-5" />
                <span>Create New Sprint Task</span>
              </button>
              
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pr-4">Double-click or click text inputs to edit instantly</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
