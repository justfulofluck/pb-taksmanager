import React, { useState } from 'react';
import { 
  Users, 
  Building, 
  UserPlus, 
  Plus, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  BarChart3, 
  MessageSquare, 
  Send, 
  Sparkles, 
  Briefcase, 
  Tag, 
  Check, 
  ChevronRight,
  TrendingUp,
  Layers,
  Shield,
  LogIn,
  Edit3,
  Trash2
} from 'lucide-react';
import { TeamMember, Task } from '../types';
import { ApiClient } from '../api';
import { AVAILABLE_TEAMS } from '../data/team';
import { UserAvatar } from './UserAvatar';
import EditMemberModal from './EditMemberModal';

interface TeamPanelViewProps {
  teamMembers: TeamMember[];
  tasks: Task[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  onOpenAddTask: (assignedMemberId?: string) => void;
  onOpenOnboardModal: (team?: string) => void;
  onLoginAsMember?: (user: { email: string; name: string }) => void;
  currentUser?: { email: string; name: string } | null;
  isAdmin?: boolean;
}

export default function TeamPanelView({
  teamMembers,
  tasks,
  onUpdateTeamMembers,
  onOpenAddTask,
  onOpenOnboardModal,
  onLoginAsMember,
  currentUser,
  isAdmin = true
}: TeamPanelViewProps) {
  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const handleDeleteMember = async (member: TeamMember) => {
    if (member.isMe || member.email === 'admin@pinobite.com') {
      alert('You cannot delete the primary Workspace Owner account.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete member ${member.name}?`)) {
      await ApiClient.deleteTeamMember(member.id);
      const updatedList = teamMembers.filter(m => m.id !== member.id);
      onUpdateTeamMembers(updatedList);
    }
  };

  // Local Team Discussion Feed
  const [teamPosts, setTeamPosts] = useState<Array<{ id: string; author: string; team: string; text: string; time: string }>>([]);
  const [newPostText, setNewPostText] = useState('');

  // Filtered members by team department & search
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.role && member.role.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTeam = selectedTeam === 'ALL' || member.team === selectedTeam;

    return matchesSearch && matchesTeam;
  });

  // Calculate metrics for selected department
  const departmentMembersCount = filteredMembers.length;

  // Filter tasks belonging to members in this department
  const filteredMemberIds = new Set(filteredMembers.map(m => m.id));
  const departmentTasks = selectedTeam === 'ALL' 
    ? tasks 
    : tasks.filter(t => t.assignedTo.some(id => filteredMemberIds.has(id)));

  const doneTasks = departmentTasks.filter(t => t.status === 'Done').length;
  const inProgressTasks = departmentTasks.filter(t => t.status === 'In progress').length;
  const highPriorityTasks = departmentTasks.filter(t => t.priority === 'High Priority').length;
  const completionRate = departmentTasks.length > 0 ? Math.round((doneTasks / departmentTasks.length) * 100) : 100;

  // Handler to submit team announcement
  const handleAddPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostText.trim()) return;
    setTeamPosts([
      {
        id: `post-${Date.now()}`,
        author: 'You (Current Member)',
        team: selectedTeam === 'ALL' ? 'General' : selectedTeam,
        text: newPostText.trim(),
        time: 'Just now'
      },
      ...teamPosts
    ]);
    setNewPostText('');
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen text-slate-800 dark:text-slate-100">
      
      {/* Team Panel Top Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-800/50">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cross-Functional Team Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {selectedTeam === 'ALL' ? 'Workspace Team Operations' : `${selectedTeam} Department`}
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Track team workload distribution, department sprint progress, active task assignments, and member directory.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            {isAdmin && (
              <button
                onClick={() => onOpenOnboardModal(selectedTeam === 'ALL' ? undefined : selectedTeam)}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
              >
                <UserPlus className="w-4 h-4" />
                <span>Invite To {selectedTeam === 'ALL' ? 'Workspace' : selectedTeam}</span>
              </button>
            )}
            <button
              onClick={() => onOpenAddTask()}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Create Task</span>
            </button>
          </div>
        </div>

        {/* Overview Metrics Strip */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Department Members</span>
            <div className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              {departmentMembersCount}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Sprints / Tasks</span>
            <div className="text-xl sm:text-2xl font-bold text-indigo-300 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-indigo-400" />
              {departmentTasks.length} <span className="text-xs text-slate-400 font-normal">({inProgressTasks} active)</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Completion Rate</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              {completionRate}%
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Critical Priority</span>
            <div className="text-xl sm:text-2xl font-bold text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-400" />
              {highPriorityTasks}
            </div>
          </div>
        </div>
      </div>

      {/* Department Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        <button
          onClick={() => setSelectedTeam('ALL')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
            selectedTeam === 'ALL'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
          }`}
        >
          All Departments ({teamMembers.length})
        </button>
        {AVAILABLE_TEAMS.map(team => {
          const count = teamMembers.filter(m => m.team === team).length;
          return (
            <button
              key={team}
              onClick={() => setSelectedTeam(team)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                selectedTeam === team
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <span>{team}</span>
              <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                selectedTeam === team ? 'bg-indigo-500 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* SECTION 1: WORKLOAD & CAPACITY HEATMAP */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-500" />
              <span>Team Workload & Capacity Heatmap</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Visual breakdown of tasks assigned per member to optimize workload balance.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search member..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMembers.map((member) => {
            const memberTasks = tasks.filter(t => t.assignedTo.includes(member.id));
            const activeTasksCount = memberTasks.filter(t => t.status !== 'Done').length;
            const completedCount = memberTasks.filter(t => t.status === 'Done').length;
            
            // Capacity logic
            let capacityLabel = 'Optimal Load';
            let capacityBadgeClass = 'bg-emerald-50 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
            if (activeTasksCount === 0) {
              capacityLabel = 'Available';
              capacityBadgeClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700';
            } else if (activeTasksCount >= 4) {
              capacityLabel = 'High Capacity';
              capacityBadgeClass = 'bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800';
            } else if (activeTasksCount >= 6) {
              capacityLabel = 'Overloaded';
              capacityBadgeClass = 'bg-rose-50 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-800';
            }

            const total = memberTasks.length;
            const pct = total > 0 ? Math.round((completedCount / total) * 100) : 100;

            return (
              <div 
                key={member.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 space-y-4 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <UserAvatar name={member.name} color={member.color} size="md" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                        <span>{member.name}</span>
                        {member.isMe && (
                          <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded">YOU</span>
                        )}
                      </h3>
                      <p className="text-slate-400 text-xs">{member.role || 'Team Specialist'}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${capacityBadgeClass}`}>
                    {capacityLabel}
                  </span>
                </div>

                {/* Task progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-slate-500 font-medium">
                    <span>{activeTasksCount} active tasks</span>
                    <span>{pct}% complete ({completedCount}/{total})</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Skills or tags */}
                {member.skills && member.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {member.skills.map((skill, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[10px] font-semibold rounded-md">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                {(() => {
                  const isSelf = currentUser && (
                    member.email.toLowerCase() === currentUser.email.toLowerCase() ||
                    member.name.toLowerCase() === currentUser.name.toLowerCase() ||
                    member.id === currentUser.email.toLowerCase()
                  );
                  const canEdit = isAdmin || isSelf;

                  return (
                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-3 text-xs">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => onOpenAddTask(member.id)}
                          className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Assign</span>
                        </button>
                        {canEdit && (
                          <button
                            onClick={() => setEditingMember(member)}
                            className="text-amber-600 dark:text-amber-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        )}
                        {isAdmin && !member.isMe && member.email !== 'admin@pinobite.com' && (
                          <button
                            onClick={() => handleDeleteMember(member)}
                            className="text-rose-600 dark:text-rose-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                            title="Delete Team Member"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>

                      {isAdmin && onLoginAsMember && (
                        <button
                          onClick={() => onLoginAsMember({ email: member.email, name: member.name })}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                          title="Switch context for demo"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Switch View</span>
                        </button>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}

          {filteredMembers.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-400">
              No team members found for this department.
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2: TEAM BULLETIN BOARD & ANNOUNCEMENT FEED */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-500" />
              <span>Team Bulletin Board & Announcements</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Share updates, announcements, and team notices directly with department colleagues.
            </p>
          </div>
        </div>

        <form onSubmit={handleAddPost} className="flex gap-3">
          <input
            type="text"
            placeholder={`Post an update or notice for ${selectedTeam === 'ALL' ? 'the team' : selectedTeam}...`}
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-medium focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer shrink-0 active:scale-95"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Post</span>
          </button>
        </form>

        <div className="space-y-3 divide-y divide-slate-100 dark:divide-slate-800">
          {teamPosts
            .filter(p => selectedTeam === 'ALL' || p.team === selectedTeam || p.team === 'General')
            .map((post) => (
              <div key={post.id} className="pt-3 first:pt-0 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">{post.author}</span>
                    <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 text-[10px] font-bold rounded-md">
                      {post.team}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">{post.time}</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {post.text}
                </p>
              </div>
            ))}
        </div>
      </div>

      {editingMember && (
        <EditMemberModal
          member={editingMember}
          isAdmin={isAdmin}
          onClose={() => setEditingMember(null)}
          onSave={(updated) => {
            const list = teamMembers.map(m => m.id === updated.id ? updated : m);
            onUpdateTeamMembers(list);
          }}
          onDelete={(deletedId) => {
            const list = teamMembers.filter(m => m.id !== deletedId);
            onUpdateTeamMembers(list);
          }}
        />
      )}

    </div>
  );
}
