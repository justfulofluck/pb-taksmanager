import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Shield, 
  Sparkles, 
  Check, 
  MoreVertical, 
  Trash2, 
  Send, 
  Grid, 
  List, 
  X, 
  Plus, 
  ChevronRight,
  Filter,
  Briefcase,
  Edit3
} from 'lucide-react';
import { TeamMember, OnboardingTaskItem, Task } from '../types';
import { AVAILABLE_TEAMS } from '../data/team';
import { ApiClient } from '../api';
import { UserAvatar } from './UserAvatar';
import EditMemberModal from './EditMemberModal';

interface TeamOnboardingViewProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  onOpenOnboardModal: (team?: string) => void;
  onOpenAddTask: (assignedMemberId?: string) => void;
  tasks?: Task[];
  onLoginAsMember?: (user: { email: string; name: string }) => void;
  currentUser?: { email: string; name: string } | null;
  isAdmin?: boolean;
}

export default function TeamOnboardingView({
  teamMembers,
  onUpdateTeamMembers,
  onOpenOnboardModal,
  onOpenAddTask,
  tasks = [],
  onLoginAsMember,
  currentUser,
  isAdmin = false
}: TeamOnboardingViewProps) {

  const [selectedTeam, setSelectedTeam] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected member for onboarding checklist management drawer/modal
  const [activeChecklistMember, setActiveChecklistMember] = useState<TeamMember | null>(null);
  const [newChecklistText, setNewChecklistText] = useState('');

  // Selected member for details editing modal
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Filtered members
  const getMemberTeams = (member: TeamMember): string[] => {
    if (member.teams && member.teams.length) return member.teams;
    return member.team ? [member.team] : [];
  };

  const filteredMembers = teamMembers.filter((member) => {
    // Search filter
    const memberTeams = getMemberTeams(member).join(' ').toLowerCase();
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.role && member.role.toLowerCase().includes(searchQuery.toLowerCase())) ||
      memberTeams.includes(searchQuery.toLowerCase());

    // Team filter
    const matchesTeam = selectedTeam === 'ALL' || getMemberTeams(member).includes(selectedTeam);

    // Status filter
    const matchesStatus = selectedStatus === 'ALL' || member.onboardingStatus === selectedStatus;

    return matchesSearch && matchesTeam && matchesStatus;
  });

  // Calculate Metrics
  const totalMembers = teamMembers.length;
  const completedOnboardings = teamMembers.filter(m => m.onboardingStatus === 'Completed').length;
  const inProgressOnboardings = teamMembers.filter(m => m.onboardingStatus === 'In Progress').length;
  const invitedMembers = teamMembers.filter(m => m.onboardingStatus === 'Invited').length;

  const uniqueTeamsCount = Array.from(new Set(teamMembers.flatMap(m => getMemberTeams(m)))).length;
  const completionRate = totalMembers > 0 ? Math.round((completedOnboardings / totalMembers) * 100) : 100;

  // Toggle checklist item inside active member drawer
  const handleToggleChecklistItem = async (member: TeamMember, itemId: string) => {
    const currentList = member.onboardingChecklist || [];
    const updatedList = currentList.map(item => 
      item.id === itemId ? { ...item, completed: !item.completed } : item
    );

    // Calculate new status
    const completedCount = updatedList.filter(i => i.completed).length;
    let newStatus: 'Invited' | 'In Progress' | 'Completed' = 'In Progress';
    if (completedCount === 0) newStatus = 'Invited';
    if (completedCount === updatedList.length) newStatus = 'Completed';

    const updatedMember: TeamMember = {
      ...member,
      onboardingChecklist: updatedList,
      onboardingStatus: newStatus
    };

    await ApiClient.saveTeamMember(updatedMember);
    const refreshed = await ApiClient.getTeamMembers();
    onUpdateTeamMembers(refreshed);
    if (activeChecklistMember?.id === member.id) {
      setActiveChecklistMember(updatedMember);
    }
  };

  // Add custom checklist item to a member
  const handleAddChecklistItem = async (member: TeamMember) => {
    if (!newChecklistText.trim()) return;
    const currentList = member.onboardingChecklist || [];
    const newItem: OnboardingTaskItem = {
      id: `item-${Date.now()}`,
      title: newChecklistText.trim(),
      completed: false
    };

    const updatedMember: TeamMember = {
      ...member,
      onboardingChecklist: [...currentList, newItem],
      onboardingStatus: 'In Progress'
    };

    await ApiClient.saveTeamMember(updatedMember);
    const refreshed = await ApiClient.getTeamMembers();
    onUpdateTeamMembers(refreshed);
    setActiveChecklistMember(updatedMember);
    setNewChecklistText('');
  };

  // Resend Invite Handler
  const handleResendInvite = (member: TeamMember) => {
    window.dispatchEvent(new CustomEvent('pinobite_notification', {
      detail: {
        title: 'Invitation Email Sent ✉️',
        text: `Re-sent team onboarding invitation link to ${member.email}`
      }
    }));
  };

  // Remove Member Handler
  const handleRemoveMember = async (member: TeamMember) => {
    await ApiClient.deleteTeamMember(member.id);
    const refreshed = await ApiClient.getTeamMembers();
    onUpdateTeamMembers(refreshed);
    if (activeChecklistMember?.id === member.id) {
      setActiveChecklistMember(null);
    }
    window.dispatchEvent(new CustomEvent('pinobite_notification', {
      detail: {
        title: 'Member Removed 🗑️',
        text: `Removed ${member.name} from the workspace.`
      }
    }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-50/50 dark:bg-slate-950/40 overflow-y-auto">
      {/* Top Banner & Header */}
      <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Title & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl">
                <Users className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Team Onboarding & Members Hub
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Onboard new members into specific teams, track onboarding checklists, and manage team permissions.
            </p>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => onOpenOnboardModal(selectedTeam !== 'ALL' ? selectedTeam : undefined)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
                id="team-onboard-new-btn"
              >
                <UserPlus className="w-4 h-4" />
                <span>Onboard Member</span>
              </button>
            </div>
          )}
        </div>

        {/* Header Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Total Members</span>
              <span className="p-1.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                <Users className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">{totalMembers}</span>
              <span className="text-[11px] font-bold text-slate-400">Across {uniqueTeamsCount} Teams</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Completed Onboardings</span>
              <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-lg">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{completedOnboardings}</span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                {completionRate}% Rate
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Active Onboardings</span>
              <span className="p-1.5 bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 rounded-lg">
                <Clock className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-600 dark:text-amber-400">{inProgressOnboardings}</span>
              <span className="text-[11px] font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-full">
                In Progress
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 shadow-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Pending Invites</span>
              <span className="p-1.5 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-lg">
                <Mail className="w-3.5 h-3.5" />
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-sky-600 dark:text-sky-400">{invitedMembers}</span>
              <span className="text-[11px] font-bold text-slate-400">Invited</span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 space-y-4 shadow-xs">
          {/* Top Filter Row: Search & View Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <input
                type="text"
                placeholder="Search team members by name, role, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:bg-white"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                  title="Grid View"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    viewMode === 'table'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                  title="Table View"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Department Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> Team:
            </span>
            {['ALL', ...AVAILABLE_TEAMS].map((t) => {
              const active = selectedTeam === t;
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTeam(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    active
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t === 'ALL' ? 'All Teams' : t}
                </button>
              );
            })}
          </div>

          {/* Status Filter Chips */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-400 mr-2 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Status:
            </span>
            {[
              { id: 'ALL', label: 'All Statuses' },
              { id: 'Completed', label: 'Completed Onboarding', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
              { id: 'In Progress', label: 'In Progress', color: 'bg-amber-50 text-amber-700 border-amber-200' },
              { id: 'Invited', label: 'Invited / Pending', color: 'bg-sky-50 text-sky-700 border-sky-200' }
            ].map((st) => {
              const active = selectedStatus === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSelectedStatus(st.id)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    active
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Members Content Area */}
        {filteredMembers.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-8 space-y-4">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto">
              <Users className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">No Team Members Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No members match the selected filters or search query. Click below to onboard a new member to your team.
              </p>
            </div>
            <button
              onClick={() => onOpenOnboardModal(selectedTeam !== 'ALL' ? selectedTeam : undefined)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md inline-flex items-center gap-2 cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>Onboard New Team Member</span>
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMembers.map((member) => {
              const checklist = member.onboardingChecklist || [];
              const completedCount = checklist.filter(c => c.completed).length;
              const totalChecklist = checklist.length || 1;
              const progressPct = Math.round((completedCount / totalChecklist) * 100);
              const memberTasksCount = tasks.filter(t => t.assignedTo.includes(member.id)).length;

              return (
                <div
                  key={member.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 group"
                >
                  {/* Top Row: Avatar, Info, Status */}
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <UserAvatar member={member} size="md" />
                          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${
                            member.onboardingStatus === 'Completed' ? 'bg-emerald-500' :
                            member.onboardingStatus === 'In Progress' ? 'bg-amber-500' : 'bg-sky-500'
                          }`} />
                        </div>
                        <div className="space-y-0.5 min-w-0">
                          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                            {member.name}
                            {member.isMe && (
                              <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded font-bold">You</span>
                            )}
                          </h3>
                          <span className="text-xs text-slate-500 dark:text-slate-400 block truncate">{member.email}</span>
                        </div>
                      </div>

                      {/* Access Level Badge */}
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border shrink-0 ${
                        member.accessLevel === 'Super Admin'
                          ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950 dark:text-violet-300 dark:border-violet-900'
                          : 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                      }`}>
                        {member.accessLevel || 'Member'}
                      </span>
                    </div>

                    {/* Role & Team Badges */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[11px] font-extrabold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-xl border border-indigo-100 dark:border-indigo-900/60">
                        {getMemberTeams(member).join(', ') || 'General Team'}
                      </span>
                      {member.role && (
                        <span className="text-[11px] font-medium text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                          {member.role}
                        </span>
                      )}
                    </div>

                    {/* Onboarding Checklist Progress Bar */}
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-indigo-500" /> Onboarding Checklist
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                          member.onboardingStatus === 'Completed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                          member.onboardingStatus === 'In Progress' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                          'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300'
                        }`}>
                          {completedCount}/{totalChecklist} Done ({progressPct}%)
                        </span>
                      </div>

                      <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-300 ${
                            member.onboardingStatus === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'
                          }`} 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    {/* Skills pills */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {member.skills.map(skill => (
                          <span key={skill} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                    {/* Card Action Footer */}
                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                      <button
                        onClick={() => setActiveChecklistMember(member)}
                        className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs py-2 px-2 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                        <span>Checklist</span>
                      </button>

                      {(() => {
                        const isSelf = currentUser && (
                          member.email.toLowerCase() === currentUser.email.toLowerCase() ||
                          member.name.toLowerCase() === currentUser.name.toLowerCase()
                        );
                        const canEdit = isAdmin || isSelf;

                        return (
                          <>
                            {canEdit && (
                              <button
                                onClick={() => setEditingMember(member)}
                                className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/50 rounded-xl transition-colors cursor-pointer"
                                title="Edit Member Details"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isAdmin && (
                              <button
                                onClick={() => handleResendInvite(member)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                                title="Resend Invitation Email"
                              >
                                <Send className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {isAdmin && !member.isMe && (
                              <button
                                onClick={() => handleRemoveMember(member)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-xl transition-colors cursor-pointer"
                                title="Remove Member"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-[11px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:border-slate-800">
                  <tr>
                    <th className="p-4">Member Name & Email</th>
                    <th className="p-4">Team</th>
                    <th className="p-4">Role Title</th>
                    <th className="p-4">Access Level</th>
                    <th className="p-4">Onboarding Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {filteredMembers.map((member) => {
                    const checklist = member.onboardingChecklist || [];
                    const completedCount = checklist.filter(c => c.completed).length;
                    const totalChecklist = checklist.length || 1;
                    const progressPct = Math.round((completedCount / totalChecklist) * 100);

                    return (
                      <tr key={member.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <UserAvatar member={member} size="sm" />
                            <div>
                              <span className="font-extrabold text-slate-900 dark:text-white block">{member.name}</span>
                              <span className="text-[11px] text-slate-500">{member.email}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-indigo-600 dark:text-indigo-400">
                          {getMemberTeams(member).join(', ') || 'General Team'}
                        </td>
                        <td className="p-4 font-semibold text-slate-700 dark:text-slate-300">
                          {member.role || 'Team Member'}
                        </td>
                        <td className="p-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 border">
                            {member.accessLevel || 'Member'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="space-y-1 max-w-[140px]">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span>{member.onboardingStatus}</span>
                              <span>{progressPct}%</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full ${member.onboardingStatus === 'Completed' ? 'bg-emerald-500' : 'bg-indigo-600'}`} 
                                style={{ width: `${progressPct}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setActiveChecklistMember(member)}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Checklist</span>
                            </button>
                            {(() => {
                              const isSelf = currentUser && (
                                member.email.toLowerCase() === currentUser.email.toLowerCase() ||
                                member.name.toLowerCase() === currentUser.name.toLowerCase()
                              );
                              const canEdit = isAdmin || isSelf;

                              return (
                                <>
                                  {canEdit && (
                                    <button
                                      onClick={() => setEditingMember(member)}
                                      className="p-1.5 text-slate-400 hover:text-amber-500 rounded-lg cursor-pointer"
                                      title="Edit Details"
                                    >
                                      <Edit3 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <button
                                      onClick={() => handleResendInvite(member)}
                                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg cursor-pointer"
                                      title="Resend Invite"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {isAdmin && !member.isMe && (
                                    <button
                                      onClick={() => handleRemoveMember(member)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"
                                      title="Remove Member"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* MEMBER ONBOARDING CHECKLIST DRAWER / MODAL */}
      {activeChecklistMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-popup-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900/80">
              <div className="flex items-center gap-3">
                <UserAvatar member={activeChecklistMember} size="md" />
                <div>
                  <h3 className="text-sm font-black text-slate-900 dark:text-white">
                    {activeChecklistMember.name}'s Onboarding Roadmap
                  </h3>
                  <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                    Team: {getMemberTeams(activeChecklistMember).join(', ') || 'General Team'} • {activeChecklistMember.role}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setActiveChecklistMember(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist items list */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 custom-scrollbar">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">Onboarding Tasks</span>
                <span className="text-xs font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 px-2.5 py-0.5 rounded-full">
                  Status: {activeChecklistMember.onboardingStatus}
                </span>
              </div>

              <div className="space-y-2">
                {(activeChecklistMember.onboardingChecklist || []).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklistItem(activeChecklistMember, item.id)}
                    className={`flex items-center gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                      item.completed
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                      item.completed
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                    }`}>
                      {item.completed && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <span className={`text-xs font-bold flex-1 ${item.completed ? 'line-through opacity-80' : ''}`}>
                      {item.title}
                    </span>
                  </div>
                ))}
              </div>

              {/* Add Custom Checklist Item */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  + Add Custom Onboarding Requirement
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Set up VPN & SSH keys..."
                    value={newChecklistText}
                    onChange={(e) => setNewChecklistText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddChecklistItem(activeChecklistMember);
                      }
                    }}
                    className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={() => handleAddChecklistItem(activeChecklistMember)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition-colors cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-900">
              <button
                onClick={() => onOpenAddTask(activeChecklistMember.id)}
                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Assign Sprint Task
              </button>
              <button
                onClick={() => setActiveChecklistMember(null)}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs px-4 py-2 rounded-xl cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER & ADMIN DETAILS MODAL */}
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
