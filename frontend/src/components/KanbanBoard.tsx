import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, AlertTriangle, Users, Tag, ArrowLeftRight, ArrowRight, ArrowLeft, LayoutGrid, GripVertical, ChevronDown, Check, Trash2 } from 'lucide-react';
import { Task, TaskStatus, TeamMember } from '../types';
import { UserAvatar } from './UserAvatar';

interface KanbanBoardProps {
  tasks: Task[];
  teamMembers?: TeamMember[];
  onUpdateTask: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  onSelectTask: (task: Task) => void;
  isAdmin?: boolean;
}

const COLUMNS: { id: TaskStatus; title: string; color: string; bullet: string }[] = [
  { id: 'Not started', title: 'Not Started', color: 'border-slate-200', bullet: 'bg-slate-400' },
  { id: 'In progress', title: 'In Progress', color: 'border-indigo-100', bullet: 'bg-indigo-500' },
  { id: 'Done', title: 'Done / Completed', color: 'border-emerald-100', bullet: 'bg-emerald-500' },
];

export default function KanbanBoard({ tasks, teamMembers = [], onUpdateTask, onDeleteTask, onSelectTask, isAdmin = true }: KanbanBoardProps) {
  const [mobileActiveCol, setMobileActiveCol] = useState<TaskStatus | 'all'>('all');
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<TaskStatus | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [collapsedColumns, setCollapsedColumns] = useState<Record<string, boolean>>({});

  const toggleColumnCollapse = (colId: string) => {
    setCollapsedColumns(prev => ({ ...prev, [colId]: !prev[colId] }));
  };
  
  const handleMoveStatus = (task: Task, direction: 'forward' | 'backward') => {
    let nextStatus: TaskStatus = task.status;
    if (task.status === 'Not started') {
      if (direction === 'forward') nextStatus = 'In progress';
    } else if (task.status === 'In progress') {
      if (direction === 'forward') nextStatus = 'Done';
      if (direction === 'backward') nextStatus = 'Not started';
    } else if (task.status === 'Done') {
      if (direction === 'backward') nextStatus = 'In progress';
    }
    onUpdateTask({ ...task, status: nextStatus });
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('text/plain', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent, colId: TaskStatus) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumn !== colId) {
      setDragOverColumn(colId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, colId: TaskStatus) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      if (dragOverColumn === colId) {
        setDragOverColumn(null);
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    if (taskId) {
      const draggedTask = tasks.find((t) => t.id === taskId);
      if (draggedTask && draggedTask.status !== targetStatus) {
        onUpdateTask({ ...draggedTask, status: targetStatus });
      }
    }
    setDraggedTaskId(null);
    setDragOverColumn(null);
  };

  const scrollToColumn = (colId: TaskStatus | 'all') => {
    setMobileActiveCol(colId);
    if (colId !== 'all') {
      const el = document.getElementById(`column-${colId.replace(/\s+/g, '-').toLowerCase()}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  };

  const getPriorityBadgeStyle = (priority: string) => {
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

  return (
    <div className="space-y-4">
      {/* Mobile Custom Styled Column Switcher Popover Dropdown */}
      <div className="md:hidden px-1 z-30">
        <div className="relative w-full">
          <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-1.5 block">
            Select Column View
          </label>
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full flex items-center justify-between bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2.5 shadow-sm transition-all cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
              {mobileActiveCol === 'all' ? (
                <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white truncate">
                  <span>All Columns</span>
                  <span className="bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200/80 dark:border-indigo-800/80 px-2 py-0.5 rounded-full text-[10px] font-bold">
                    {tasks.length}
                  </span>
                </div>
              ) : (
                (() => {
                  const colInfo = COLUMNS.find((c) => c.id === mobileActiveCol);
                  const count = tasks.filter((t) => t.status === mobileActiveCol).length;
                  return (
                    <div className="flex items-center gap-2 font-black text-xs text-slate-900 dark:text-white truncate">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${colInfo?.bullet}`} />
                      <span>{colInfo?.title}</span>
                      <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                        {count}
                      </span>
                    </div>
                  );
                })()
              )}
            </div>
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
                isDropdownOpen ? 'rotate-180 text-indigo-600 dark:text-indigo-400' : ''
              }`}
            />
          </button>

          {/* Floating Popover Menu */}
          {isDropdownOpen && (
            <>
              {/* Backdrop listener to close when clicking outside */}
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-1.5 space-y-1 z-50 animate-popup-in backdrop-blur-xl">
                {/* All Columns Option */}
                <button
                  type="button"
                  onClick={() => {
                    setMobileActiveCol('all');
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    mobileActiveCol === 'all'
                      ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black border border-indigo-100 dark:border-indigo-900/60 shadow-xs'
                      : 'text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <LayoutGrid className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>All Columns</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                      {tasks.length}
                    </span>
                    {mobileActiveCol === 'all' && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                  </div>
                </button>

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                {/* Individual Column Options */}
                {COLUMNS.map((col) => {
                  const count = tasks.filter((t) => t.status === col.id).length;
                  const isSelected = mobileActiveCol === col.id;
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => {
                        setMobileActiveCol(col.id);
                        setIsDropdownOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 font-black border border-indigo-100 dark:border-indigo-900/60 shadow-xs'
                          : 'text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${col.bullet}`} />
                        <span>{col.title}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full text-[10px] font-bold">
                          {count}
                        </span>
                        {isSelected && <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Kanban Canvas Grid */}
      <div 
        className="p-1 pb-28 md:pb-1 min-h-[450px] grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6" 
        id="kanban-canvas"
      >
        {COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          const isHiddenOnMobile = mobileActiveCol !== 'all' && mobileActiveCol !== col.id;
          const isHoveredColumn = dragOverColumn === col.id;
          const isCollapsed = !!collapsedColumns[col.id];
          
          return (
            <div 
              key={col.id} 
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDragLeave={(e) => handleDragLeave(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              className={`w-full rounded-2xl border p-4 sm:p-5 flex flex-col space-y-4 sm:space-y-6 transition-all duration-200 ${
                isHoveredColumn 
                  ? 'bg-indigo-50/70 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 ring-2 ring-indigo-500/40 shadow-lg scale-[1.01]' 
                  : 'bg-slate-100/50 dark:bg-slate-900/60 border-slate-200/60 dark:border-slate-800'
              } ${isHiddenOnMobile ? 'hidden md:flex' : 'flex'}`}
              id={`column-${col.id.replace(/\s+/g, '-').toLowerCase()}`}
            >
              {/* Column Header - Click to toggle collapse/expand */}
              <div 
                onClick={() => toggleColumnCollapse(col.id)}
                className={`flex justify-between items-center select-none cursor-pointer group/colheader ${
                  isCollapsed ? 'pb-0 border-b-0' : 'pb-3 border-b border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-3 h-3 rounded-full ${col.bullet} shadow-xs`} />
                  <h3 className="font-black text-slate-900 dark:text-white text-[13px] uppercase tracking-wider group-hover/colheader:text-indigo-600 transition-colors">
                    {col.title}
                  </h3>
                  <span className="text-[11px] bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700 font-bold shadow-2xs">
                    {colTasks.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Drop indicator label */}
                  {isHoveredColumn && (
                    <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 animate-pulse bg-indigo-100/80 dark:bg-indigo-950 px-2 py-0.5 rounded-md border border-indigo-300 dark:border-indigo-800">
                      Drop to move
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleColumnCollapse(col.id);
                    }}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                    title={isCollapsed ? "Expand column" : "Collapse column"}
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? '-rotate-90' : 'rotate-0'}`} />
                  </button>
                </div>
              </div>

              {/* Cards container */}
              {!isCollapsed && (
                <div className="flex-1 space-y-3.5 overflow-y-auto max-h-[70vh] md:max-h-[620px] p-0.5 pr-1.5 min-h-[140px] custom-scrollbar">
                  {colTasks.length === 0 ? (
                    <div className={`text-center py-12 text-xs font-bold transition-all rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 ${
                      isHoveredColumn 
                        ? 'border-indigo-400 text-indigo-600 dark:text-indigo-400 bg-indigo-100/50 dark:bg-indigo-900/40' 
                        : 'border-slate-200 dark:border-slate-800/80 text-slate-400 dark:text-slate-500 bg-white/40 dark:bg-slate-900/30'
                    }`}>
                      <span className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500">
                        {col.title.charAt(0)}
                      </span>
                      <span>{isHoveredColumn ? 'Release mouse to drop here' : 'No tasks in this stage'}</span>
                    </div>
                  ) : (
                    <AnimatePresence initial={false}>
                      {colTasks.map((task) => {
                        const isBeingDragged = draggedTaskId === task.id;
                        return (
                          <motion.div
                            key={task.id}
                            initial={{ opacity: 0, scale: 0.92, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: -10 }}
                            transition={{ duration: 0.2 }}
                            draggable
                            onDragStart={(e) => handleDragStart(e as any, task.id)}
                            onDragEnd={() => {
                              setDraggedTaskId(null);
                              setDragOverColumn(null);
                            }}
                            className={`bg-white dark:bg-slate-900 border rounded-2xl p-4 sm:p-5 space-y-3.5 transition-all duration-200 group relative shadow-xs hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-0.5 cursor-grab active:cursor-grabbing ${
                              isBeingDragged 
                                ? 'opacity-30 scale-[0.97] border-dashed border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/40' 
                                : 'border-slate-200/90 dark:border-slate-800/90'
                            }`}
                            id={`card-${task.id}`}
                          >
                        {/* Top line: drag handle + priority badge + move controls */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="p-1 -ml-1 text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors shrink-0 cursor-grab">
                              <GripVertical className="w-4 h-4" />
                            </span>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-tight truncate ${getPriorityBadgeStyle(task.priority)}`}>
                              {task.priority || 'No Priority'}
                            </span>
                          </div>

                          {/* Direction controls for moving card status - visible on mobile touch */}
                          <div className="flex items-center gap-1 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all shrink-0">
                            {col.id !== 'Not started' && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMoveStatus(task, 'backward'); }}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg cursor-pointer transition-all border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center justify-center"
                                title="Move to previous status"
                              >
                                <ArrowLeft className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {col.id !== 'Done' && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleMoveStatus(task, 'forward'); }}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-950 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 p-1.5 rounded-lg cursor-pointer transition-all border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center justify-center"
                                title="Move to next status"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {isAdmin && onDeleteTask && (
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                className="bg-slate-100 dark:bg-slate-800 hover:bg-rose-100 dark:hover:bg-rose-950 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 p-1.5 rounded-lg cursor-pointer transition-all border border-slate-200 dark:border-slate-700 active:scale-95 flex items-center justify-center"
                                title="Delete Task"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Task name & details */}
                        <div className="space-y-1.5">
                          <button
                            onClick={() => onSelectTask(task)}
                            className="text-left font-black text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 text-[14px] sm:text-[15px] leading-tight block cursor-pointer transition-colors"
                          >
                            {task.task || 'Untitled Task'}
                          </button>
                          {task.description && (
                            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-[13px] line-clamp-3 leading-relaxed font-medium">
                              {task.description}
                            </p>
                          )}
                        </div>

                        {/* Tags */}
                        {task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {task.tags.map(tag => (
                              <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold border border-slate-200 dark:border-slate-700">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Footer: Date and assigned members */}
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
                          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                            <span className="font-bold text-slate-600 dark:text-slate-300">{task.dueDate || 'No Date'}</span>
                          </div>

                          {/* Member Avatars */}
                          <div className="flex -space-x-1.5">
                            {task.assignedTo.map(id => {
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
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
              </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

