import React from 'react';
import { Task, TeamMember } from '../types';
import { UserAvatar } from './UserAvatar';
import { Calendar, ChevronLeft, ChevronRight, Clock, CheckCircle2 } from 'lucide-react';

interface TimelineViewProps {
  tasks: Task[];
  teamMembers?: TeamMember[];
  onSelectTask: (task: Task) => void;
}

export default function TimelineView({ tasks, teamMembers = [], onSelectTask }: TimelineViewProps) {
  // Sort tasks by due date
  const sortedTasks = [...tasks].sort((a, b) => {
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  return (
    <div className="p-4 sm:p-8 pb-28 sm:pb-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto" id="gantt-timeline-container">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs gap-3">
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Sprint Schedule & Milestone Roadmap</h3>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Timeline visual view sorted by target delivery dates</span>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-bold text-slate-700 dark:text-slate-200 px-2">July 2026</span>
          <button className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MOBILE RESPONSIVE CARD VIEW (Visible on mobile < 640px) */}
      <div className="block sm:hidden space-y-3">
        {sortedTasks.map((task) => (
          <div 
            key={task.id}
            onClick={() => onSelectTask(task)}
            className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 cursor-pointer hover:border-indigo-300 dark:hover:border-indigo-600 transition-all text-left"
          >
            <div className="flex items-start justify-between gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-100 text-sm block leading-snug">
                {task.task}
              </span>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border shrink-0 ${
                task.priority === 'High Priority' ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/60' :
                task.priority === 'Low Priority' ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/60' :
                'bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/60'
              }`}>
                {task.priority || 'Normal'}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">{task.description}</p>
            )}

            <div className="flex flex-wrap gap-1">
              {task.tags.map(tag => (
                <span key={tag} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                task.status === 'Done' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                task.status === 'In progress' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' :
                'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}>
                {task.status === 'Done' && <CheckCircle2 className="w-3 h-3" />}
                {task.status === 'In progress' && <Clock className="w-3 h-3" />}
                {task.status}
              </span>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                  {task.dueDate || 'No Date'}
                </span>

                <div className="flex -space-x-1.5">
                  {task.assignedTo.map(id => {
                    const member = teamMembers.find(t => t.id === id);
                    if (!member) return null;
                    return (
                      <UserAvatar
                        key={id}
                        member={member}
                        size="xs"
                        className="ring-2 ring-white dark:ring-slate-900"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP/TABLET HORIZONTAL SCROLLABLE TABLE VIEW (Visible on >= 640px) */}
      <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-x-auto" id="gantt-table-view">
        <div className="min-w-[700px]">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 grid grid-cols-12 gap-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <div className="col-span-4">Task Name</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Priority</div>
            <div className="col-span-2">Target Date</div>
            <div className="col-span-2 text-right">Assignees</div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {sortedTasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => onSelectTask(task)}
                className="p-4 grid grid-cols-12 gap-4 items-center hover:bg-indigo-50/40 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group text-left"
              >
                {/* Task Title & Tags */}
                <div className="col-span-4 space-y-1">
                  <span className="font-bold text-slate-900 dark:text-slate-100 text-sm group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors block">
                    {task.task}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {task.tags.map(tag => (
                      <span key={tag} className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Status Badge */}
                <div className="col-span-2">
                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${
                    task.status === 'Done' ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                    task.status === 'In progress' ? 'bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800' :
                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                  }`}>
                    {task.status === 'Done' && <CheckCircle2 className="w-3 h-3" />}
                    {task.status === 'In progress' && <Clock className="w-3 h-3" />}
                    {task.status}
                  </span>
                </div>

                {/* Priority Badge */}
                <div className="col-span-2">
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                    task.priority === 'High Priority' ? 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/60' :
                    task.priority === 'Low Priority' ? 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/60' :
                    'bg-violet-50 dark:bg-violet-950/80 text-violet-600 dark:text-violet-400 border-violet-100 dark:border-violet-900/60'
                  }`}>
                    {task.priority || 'Normal'}
                  </span>
                </div>

                {/* Target Due Date */}
                <div className="col-span-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  {task.dueDate || 'No Date'}
                </div>

                {/* Assignees Avatars */}
                <div className="col-span-2 flex justify-end -space-x-1.5">
                  {task.assignedTo.map(id => {
                    const member = teamMembers.find(t => t.id === id);
                    if (!member) return null;
                    return (
                      <UserAvatar
                        key={id}
                        member={member}
                        size="sm"
                        className="ring-2 ring-white dark:ring-slate-900"
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
