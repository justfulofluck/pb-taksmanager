import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldCheck, 
  ShieldAlert, 
  Users, 
  Settings, 
  Activity, 
  Lock, 
  Key, 
  UserPlus, 
  Search, 
  Filter, 
  CheckCircle2, 
  AlertCircle, 
  Megaphone, 
  FileText, 
  Download, 
  Trash2, 
  RefreshCw, 
  Check, 
  X, 
  Sliders, 
  Building, 
  Globe, 
  Database,
  Cpu,
  UserX,
  UserCheck,
  Edit3
} from 'lucide-react';
import { TeamMember, Task, ActivityLog } from '../types';
import { ApiClient } from '../api';
import { UserAvatar } from './UserAvatar';
import { AVAILABLE_TEAMS, DEFAULT_ADMIN_MEMBER } from '../data/team';
import EditMemberModal from './EditMemberModal';

interface AdminPanelViewProps {
  teamMembers: TeamMember[];
  onUpdateTeamMembers: (members: TeamMember[]) => void;
  tasks: Task[];
  onOpenOnboardModal: (team?: string) => void;
  currentUser: { email: string; name: string } | null;
  announcement: string;
  onUpdateAnnouncement: (text: string) => void;
  onUpdateCurrentUser?: (user: { email: string; name: string }) => void;
}

export default function AdminPanelView({
  teamMembers,
  onUpdateTeamMembers,
  tasks,
  onOpenOnboardModal,
  currentUser,
  announcement,
  onUpdateAnnouncement,
  onUpdateCurrentUser
}: AdminPanelViewProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'audit'>('users');
  
  // User Management State
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'Super Admin' | 'Member'>('ALL');
  const [teamFilter, setTeamFilter] = useState<string>('ALL');
  
  // Audit Logs State
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [logSearch, setLogSearch] = useState('');
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Settings State
  const [workspaceName, setWorkspaceName] = useState(() => localStorage.getItem('pinobite_ws_name') || 'Enterprise Workspace');
  const [allowedDomains, setAllowedDomains] = useState(() => localStorage.getItem('pinobite_ws_domains') || '@company.com');
  const [defaultPriority, setDefaultPriority] = useState(() => localStorage.getItem('pinobite_ws_def_priority') || 'Minimal Priority');
  
  const [requireAdminForDelete, setRequireAdminForDelete] = useState(() => localStorage.getItem('pinobite_policy_del') === 'true');
  const [allowMemberInvite, setAllowMemberInvite] = useState(() => localStorage.getItem('pinobite_policy_invite') !== 'false');
  const [enableAiCopilot, setEnableAiCopilot] = useState(() => localStorage.getItem('pinobite_policy_ai') !== 'false');
  const [autoArchive, setAutoArchive] = useState(() => localStorage.getItem('pinobite_policy_archive') === 'true');

  const [announcementInput, setAnnouncementInput] = useState(announcement);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Password reset modal state
  const [resetModalMember, setResetModalMember] = useState<TeamMember | null>(null);
  const [newGeneratedPass, setNewGeneratedPass] = useState('');

  // Member editing modal state
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  const handleMemberSaved = (updatedMember: TeamMember) => {
    const exists = teamMembers.some(m => m.id === updatedMember.id);
    const updatedList = exists 
      ? teamMembers.map(m => m.id === updatedMember.id ? updatedMember : m)
      : [...teamMembers, updatedMember];

    onUpdateTeamMembers(updatedList);

    // If editing logged-in user or admin user, sync logged-in profile
    if (currentUser && (updatedMember.email === currentUser.email || updatedMember.isMe || updatedMember.email === 'admin@pinobite.com' || currentUser.email === 'admin@pinobite.com')) {
      const loggedUser = { email: updatedMember.email, name: updatedMember.name };
      localStorage.setItem('pinobite_session', JSON.stringify(loggedUser));
      localStorage.setItem('pinobite_current_user', JSON.stringify(loggedUser));
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(loggedUser);
      }
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const fetched = await ApiClient.getActivityLogs();
      setLogs(fetched);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  // Metrics
  const totalUsers = teamMembers.length;
  const adminCount = teamMembers.filter(m => m.accessLevel === 'Super Admin').length;
  const memberCount = teamMembers.filter(m => m.accessLevel === 'Member' || !m.accessLevel).length;


  // Filtered Members
  const filteredMembers = teamMembers.filter(member => {
    const matchesSearch = 
      member.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      member.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      (member.role && member.role.toLowerCase().includes(userSearch.toLowerCase()));
    
    const matchesRole = roleFilter === 'ALL' || (member.accessLevel || 'Member') === roleFilter;
    const matchesTeam = teamFilter === 'ALL' || member.team === teamFilter;

    return matchesSearch && matchesRole && matchesTeam;
  });

  // Role Change Handler
  const handleRoleChange = async (member: TeamMember, newLevel: 'Super Admin' | 'Member') => {
    const updated = { ...member, accessLevel: newLevel };
    await ApiClient.saveTeamMember(updated);
    const refreshed = await ApiClient.getTeamMembers();
    onUpdateTeamMembers(refreshed);

    // Log Activity
    await ApiClient.addActivityLog({
      id: `log-${Date.now()}`,
      userId: currentUser?.email || 'admin',
      userName: currentUser?.name || 'Administrator',
      action: `updated role of ${member.name} to ${newLevel}`,
      timestamp: new Date().toISOString()
    });
    fetchLogs();
  };

  // Team Change Handler
  const handleTeamChange = async (member: TeamMember, newTeam: string) => {
    const updated = { ...member, team: newTeam };
    await ApiClient.saveTeamMember(updated);
    const refreshed = await ApiClient.getTeamMembers();
    onUpdateTeamMembers(refreshed);
  };

  // Password Reset Handler
  const handleTriggerResetPassword = (member: TeamMember) => {
    const randomPass = 'Pino' + Math.floor(100000 + Math.random() * 900000) + '!';
    setResetModalMember(member);
    setNewGeneratedPass(randomPass);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetModalMember) return;
    const updated = { ...resetModalMember, password: newGeneratedPass };
    await ApiClient.saveTeamMember(updated);
    const refreshed = await ApiClient.getTeamMembers();
    onUpdateTeamMembers(refreshed);
    setResetModalMember(null);
  };

  // Delete Member Handler
  const handleDeleteMember = async (member: TeamMember) => {
    if (member.isMe || member.email === 'admin@pinobite.com') {
      alert('You cannot delete the primary Workspace Owner account.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete member ${member.name}?`)) {
      await ApiClient.deleteTeamMember(member.id);
      const updatedList = teamMembers.filter(m => m.id !== member.id);
      onUpdateTeamMembers(updatedList);

      await ApiClient.addActivityLog({
        id: `log-${Date.now()}`,
        userId: currentUser?.email || 'admin',
        userName: currentUser?.name || 'Administrator',
        action: `deleted member ${member.name} (${member.email})`,
        timestamp: new Date().toISOString()
      });
      fetchLogs();
    }
  };

  // Settings Save Handler
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('pinobite_ws_name', workspaceName);
    localStorage.setItem('pinobite_ws_domains', allowedDomains);
    localStorage.setItem('pinobite_ws_def_priority', defaultPriority);
    
    localStorage.setItem('pinobite_policy_del', String(requireAdminForDelete));
    localStorage.setItem('pinobite_policy_invite', String(allowMemberInvite));
    localStorage.setItem('pinobite_policy_ai', String(enableAiCopilot));
    localStorage.setItem('pinobite_policy_archive', String(autoArchive));

    onUpdateAnnouncement(announcementInput);

    setSaveSuccessMsg('Workspace governance policies and broadcast updated successfully!');
    setTimeout(() => setSaveSuccessMsg(''), 4000);
  };

  // Export Audit Logs as CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'User Email', 'User Name', 'Action', 'Timestamp'];
    const rows = logs.map(l => [
      l.id,
      `"${l.userId}"`,
      `"${l.userName}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${new Date(l.timestamp).toLocaleString()}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit_logs_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-8 bg-slate-50/50 dark:bg-slate-950/50 min-h-screen text-slate-800 dark:text-slate-100">
      
      {/* Admin Panel Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 transform translate-x-12 -translate-y-12 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Console & Workspace Control</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Workspace Administration
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              Manage security roles, access policies, system audit logs, and global workspace defaults from a centralized control panel.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => {
                const adminUser = teamMembers.find(m => m.email === 'admin@pinobite.com') || teamMembers[0] || DEFAULT_ADMIN_MEMBER;
                
                setEditingMember(adminUser);
              }}
              className="px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95"
              title="Edit Admin Profile & Details"
            >
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span>Edit Admin Details</span>
            </button>
            <button
              onClick={() => onOpenOnboardModal()}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/25 flex items-center gap-2 cursor-pointer active:scale-95"
            >
              <UserPlus className="w-4 h-4" />
              <span>Add Member</span>
            </button>
            <div className="px-3.5 py-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Security Enforced</span>
            </div>
          </div>
        </div>

        {/* Quick KPI Grid */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-slate-800/80 pt-6">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Total Users</span>
            <div className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              {totalUsers}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Admins / Staff</span>
            <div className="text-xl sm:text-2xl font-bold text-emerald-400 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5" />
              {adminCount} <span className="text-xs text-slate-400 font-normal">({memberCount} members)</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Active Tasks</span>
            <div className="text-xl sm:text-2xl font-bold text-amber-400 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {tasks.length}
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Audit Log Items</span>
            <div className="text-xl sm:text-2xl font-bold text-purple-400 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              {logs.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Admin Tab Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2 sm:gap-6 overflow-x-auto pb-0">
        <button
          onClick={() => setActiveTab('users')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'users'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Access & Roles ({totalUsers})</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'settings'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Workspace Policy & Announcements</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`pb-3.5 px-2 text-xs sm:text-sm font-bold flex items-center gap-2.5 transition-colors border-b-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'audit'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Security Audit Trail ({logs.length})</span>
        </button>
      </div>

      {/* TAB 1: USER ROLES & ACCESS CONTROL */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {/* Controls & Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search user name, email, or title..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Role Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs font-semibold">
                <span className="text-slate-400 px-2">Access:</span>
                {(['ALL', 'Super Admin', 'Member'] as const).map(role => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                      roleFilter === role
                        ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {/* Department Filter */}
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                <option value="ALL">All Departments</option>
                {AVAILABLE_TEAMS.map(team => (
                  <option key={team} value={team}>{team}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Members Governance Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">User</th>
                    <th className="py-3.5 px-4">Department</th>
                    <th className="py-3.5 px-4">Access Level / Role</th>
                    <th className="py-3.5 px-4">Onboarding</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                  {filteredMembers.map((member) => {
                    const currentLevel = member.accessLevel || 'Member';
                    const badgeClass = currentLevel === 'Super Admin'
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300';
                    return (
                      <tr key={member.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            <UserAvatar name={member.name} color={member.color} size="md" />
                            <div>
                              <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <span>{member.name}</span>
                                {member.isMe && (
                                  <span className="text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                                    YOU
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-400 text-[11px] font-mono">{member.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <select
                            value={member.team || 'Engineering'}
                            onChange={(e) => handleTeamChange(member, e.target.value)}
                            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer focus:outline-none focus:border-indigo-500"
                          >
                            {AVAILABLE_TEAMS.map(team => (
                              <option key={team} value={team}>{team}</option>
                            ))}
                          </select>
                        </td>

                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <select
                              value={currentLevel}
                              onChange={(e) => handleRoleChange(member, e.target.value as any)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer border focus:outline-none ${badgeClass} border-slate-200 dark:border-slate-700`}
                            >
                              <option value="Super Admin">👑 Super Admin</option>
                              <option value="Member">👤 Member</option>
                            </select>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                            member.onboardingStatus === 'Completed'
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                              : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900'
                          }`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            {member.onboardingStatus || 'Active'}
                          </span>
                        </td>

                        <td className="py-4 px-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => setEditingMember(member)}
                              className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/80 hover:bg-indigo-100 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              title="Edit Member Details"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Edit Details</span>
                            </button>
                            <button
                              onClick={() => handleTriggerResetPassword(member)}
                              className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                              title="Reset Credentials"
                            >
                              <Key className="w-3.5 h-3.5 text-indigo-500" />
                              <span>Reset</span>
                            </button>
                            {!member.isMe && member.email !== 'admin@pinobite.com' && (
                              <button
                                onClick={() => handleDeleteMember(member)}
                                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                                title="Delete Member"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                <span>Delete</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {filteredMembers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-slate-400">
                        No team members match your current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: WORKSPACE SETTINGS & GOVERNANCE */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveSettings} className="space-y-6 max-w-4xl">
          {saveSuccessMsg && (
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/80 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 rounded-2xl text-xs font-bold flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          {/* Broadcast Announcement Config */}
          <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 p-6 rounded-3xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                <Megaphone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Global Workspace Broadcast Banner
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Publish an urgent announcement or alert message visible to all team members at the top of their app.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                placeholder="e.g. 📢 Scheduled maintenance at 18:00 UTC. Please sync your active tasks."
                value={announcementInput}
                onChange={(e) => setAnnouncementInput(e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-800/80 rounded-2xl text-xs font-medium focus:outline-none focus:border-amber-500"
              />
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>Leave blank to remove the banner for all members.</span>
                <button
                  type="button"
                  onClick={() => { setAnnouncementInput(''); onUpdateAnnouncement(''); }}
                  className="text-amber-600 dark:text-amber-400 font-bold hover:underline cursor-pointer"
                >
                  Clear Banner
                </button>
              </div>
            </div>
          </div>

          {/* Workspace General Details */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-500" />
              <span>Workspace General Identity</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Workspace Name</label>
                <input
                  type="text"
                  value={workspaceName}
                  onChange={(e) => setWorkspaceName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Restricted Email Domains</label>
                <input
                  type="text"
                  value={allowedDomains}
                  onChange={(e) => setAllowedDomains(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Security & Access Policies */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 space-y-5 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-5 h-5 text-emerald-500" />
              <span>Security & Task Policy Enforcements</span>
            </h3>

            <div className="space-y-4">
              <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Require Admin Confirmation for Task Deletions</div>
                  <div className="text-[11px] text-slate-500">Prevents standard members from permanently deleting high priority tasks without admin rights.</div>
                </div>
                <input
                  type="checkbox"
                  checked={requireAdminForDelete}
                  onChange={(e) => setRequireAdminForDelete(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Allow Non-Admin Members to Invite External Collaborators</div>
                  <div className="text-[11px] text-slate-500">Enables members to trigger onboarding invitations directly from team views.</div>
                </div>
                <input
                  type="checkbox"
                  checked={allowMemberInvite}
                  onChange={(e) => setAllowMemberInvite(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Enable AI Assistant & Automation Copilot</div>
                  <div className="text-[11px] text-slate-500">Provides AI task suggestions, automated summary generation, and smart categorization.</div>
                </div>
                <input
                  type="checkbox"
                  checked={enableAiCopilot}
                  onChange={(e) => setEnableAiCopilot(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">Auto-Archive Completed Sprint Tasks</div>
                  <div className="text-[11px] text-slate-500">Automatically hides completed sprint tasks from main spreadsheet view after 30 days.</div>
                </div>
                <input
                  type="checkbox"
                  checked={autoArchive}
                  onChange={(e) => setAutoArchive(e.target.checked)}
                  className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="submit"
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition-all shadow-md hover:shadow-indigo-500/25 cursor-pointer active:scale-95"
            >
              Save Admin Policy & Broadcast
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: AUDIT TRAIL & LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail by user, action, or keyword..."
                value={logSearch}
                onChange={(e) => setLogSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchLogs}
                disabled={isLoadingLogs}
                className="px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                <span>Refresh Logs</span>
              </button>

              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer active:scale-95 shadow-xs"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200/80 dark:border-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-5">Timestamp</th>
                    <th className="py-3.5 px-4">User</th>
                    <th className="py-3.5 px-5">Action Performed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                  {logs
                    .filter(l => 
                      l.userName.toLowerCase().includes(logSearch.toLowerCase()) ||
                      l.userId.toLowerCase().includes(logSearch.toLowerCase()) ||
                      l.action.toLowerCase().includes(logSearch.toLowerCase())
                    )
                    .map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-5 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 dark:text-white">{log.userName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">{log.userId}</div>
                        </td>
                        <td className="py-3.5 px-5 text-slate-700 dark:text-slate-200">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[11px]">
                            {log.action}
                          </span>
                        </td>
                      </tr>
                    ))}
                  {logs.length === 0 && (
                    <tr>
                      <td colSpan={3} className="text-center py-12 text-slate-400">
                        No security logs available in system audit log.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RESET PASSWORD MODAL */}
      {resetModalMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-5 text-white shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold">Generated New Password</h3>
              </div>
              <button 
                onClick={() => setResetModalMember(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              New temporary login credentials generated for <span className="font-bold text-indigo-400">{resetModalMember.name}</span> ({resetModalMember.email}):
            </p>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between">
              <code className="text-base font-mono font-bold text-emerald-400">{newGeneratedPass}</code>
              <button
                onClick={() => navigator.clipboard.writeText(newGeneratedPass)}
                className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-lg transition-colors"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setResetModalMember(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetPassword}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Save & Update Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MEMBER & ADMIN DETAILS MODAL */}
      {editingMember && (
        <EditMemberModal
          member={editingMember}
          onClose={() => setEditingMember(null)}
          onSave={handleMemberSaved}
        />
      )}

    </div>
  );
}
