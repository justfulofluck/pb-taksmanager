import React from 'react';
import { Task, TeamMember } from '../types';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Users, 
  TrendingUp, 
  Target, 
  PieChart,
  Zap,
  Sparkles
} from 'lucide-react';

interface AnalyticsViewProps {
  tasks: Task[];
  teamMembers?: TeamMember[];
  currentUser?: { email: string; name: string } | null;
  isAdmin?: boolean;
}

export default function AnalyticsView({ tasks, teamMembers = [], currentUser, isAdmin = false }: AnalyticsViewProps) {
  // Find current logged-in team member
  const currentMember = currentUser 
    ? teamMembers.find(m => 
        (m.email && currentUser.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) || 
        (m.name && currentUser.name && m.name.toLowerCase() === currentUser.name.toLowerCase())
      )
    : null;

  // Filter tasks: Admin sees all tasks; Member sees ONLY their assigned/relevant tasks
  const displayTasks = isAdmin 
    ? tasks 
    : tasks.filter(t => {
        if (currentMember && t.assignedTo.includes(currentMember.id)) return true;
        if (currentUser?.email && t.assignedTo.includes(currentUser.email)) return true;
        if (currentUser?.name && t.assignedTo.includes(currentUser.name)) return true;
        return false;
      });

  // Filter workload list: Admin sees all members; Member sees ONLY themselves
  const displayMembers = isAdmin 
    ? teamMembers 
    : (currentMember ? [currentMember] : teamMembers.filter(m => 
        (m.email && currentUser?.email && m.email.toLowerCase() === currentUser.email.toLowerCase()) ||
        (m.name && currentUser?.name && m.name.toLowerCase() === currentUser.name.toLowerCase())
      ));

  const totalTasks = displayTasks.length;
  const completedTasks = displayTasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = displayTasks.filter(t => t.status === 'In progress').length;
  const notStartedTasks = displayTasks.filter(t => t.status === 'Not started').length;
  const highPriorityTasks = displayTasks.filter(t => t.priority === 'High Priority').length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Breakdown by assignees (using displayMembers)
  const assigneeStats = displayMembers.map(member => {
    const assignedTasks = tasks.filter(t => t.assignedTo.includes(member.id));
    const completed = assignedTasks.filter(t => t.status === 'Done').length;
    return {
      member,
      total: assignedTasks.length,
      completed,
      rate: assignedTasks.length > 0 ? Math.round((completed / assignedTasks.length) * 100) : 0
    };
  });

  // Priority counts based on displayTasks
  const highCount = displayTasks.filter(t => t.priority === 'High Priority').length;
  const lowCount = displayTasks.filter(t => t.priority === 'Low Priority').length;
  const minCount = displayTasks.filter(t => t.priority === 'Minimal Priority').length;

  return (
    <div className="p-4 sm:p-8 pb-28 sm:pb-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto overflow-y-auto" id="analytics-dashboard">
      
      {/* Top Stat Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Tasks Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Total Sprint Tickets</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">{totalTasks}</span>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1 inline-flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Active Sprint Cycle
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <Target className="w-6 h-6" />
          </div>
        </div>

        {/* Completion Progress */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Completion Rate</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">{completionRate}%</span>
            <div className="w-28 bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden mt-2">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                style={{ width: `${completionRate}%` }} 
              />
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950 border border-emerald-100 dark:border-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">In Progress</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">{inProgressTasks}</span>
            <span className="text-[11px] text-sky-600 dark:text-sky-400 font-bold mt-1 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> Active Development
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 dark:bg-sky-950 border border-sky-100 dark:border-sky-900/50 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <Zap className="w-6 h-6" />
          </div>
        </div>

        {/* High Priority Critical */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">High Priority</span>
            <span className="text-3xl font-black text-slate-900 dark:text-white block mt-1">{highPriorityTasks}</span>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-1 inline-flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Action Required
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950 border border-rose-100 dark:border-rose-900/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Breakdown Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Status Breakdown Bar */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">Sprint Status Breakdown</h3>
            </div>
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500">Live Metric</span>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Completed Tasks ({completedTasks})</span>
                <span className="text-emerald-600 dark:text-emerald-400">{totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-600 dark:text-slate-300">In Progress ({inProgressTasks})</span>
                <span className="text-indigo-600 dark:text-indigo-400">{totalTasks > 0 ? Math.round((inProgressTasks / totalTasks) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalTasks > 0 ? (inProgressTasks / totalTasks) * 100 : 0}%` }} 
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className="text-slate-600 dark:text-slate-300">Not Started ({notStartedTasks})</span>
                <span className="text-slate-400 dark:text-slate-500">{totalTasks > 0 ? Math.round((notStartedTasks / totalTasks) * 100) : 0}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                <div 
                  className="bg-slate-300 dark:bg-slate-700 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${totalTasks > 0 ? (notStartedTasks / totalTasks) * 100 : 0}%` }} 
                />
              </div>
            </div>
          </div>

          {/* Priority Distribution */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-3 gap-4 text-center">
            <div className="bg-rose-50 dark:bg-rose-950/80 p-3 rounded-xl border border-rose-100 dark:border-rose-900/60">
              <span className="text-[10px] font-bold uppercase text-rose-500 dark:text-rose-400 block">High Priority</span>
              <span className="text-xl font-black text-rose-700 dark:text-rose-300">{highCount}</span>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/80 p-3 rounded-xl border border-amber-100 dark:border-amber-900/60">
              <span className="text-[10px] font-bold uppercase text-amber-500 dark:text-amber-400 block">Low Priority</span>
              <span className="text-xl font-black text-amber-700 dark:text-amber-300">{lowCount}</span>
            </div>
            <div className="bg-violet-50 dark:bg-violet-950/80 p-3 rounded-xl border border-violet-100 dark:border-violet-900/60">
              <span className="text-[10px] font-bold uppercase text-violet-500 dark:text-violet-400 block">Minimal Priority</span>
              <span className="text-xl font-black text-violet-700 dark:text-violet-300">{minCount}</span>
            </div>
          </div>
        </div>

        {/* Team Workload Distribution */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-slate-900 dark:text-white text-base">{isAdmin ? 'Team Workload' : 'My Workload'}</h3>
            </div>
          </div>

          <div className="space-y-4">
            {assigneeStats.map(({ member, total, completed, rate }) => (
              <div key={member.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center text-[10px] font-bold text-white uppercase ${member.color}`}>
                    {member.avatarChar}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">{member.name}</span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">{total} assigned ({completed} done)</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 block">{rate}%</span>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-bold uppercase">Progress</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
