import React, { useState } from 'react';
import { X, UserPlus, Mail, Shield, Sparkles, Check, Briefcase, Tag, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TeamMember, OnboardingTaskItem, Task } from '../types';
import { AVAILABLE_TEAMS } from '../data/team';
import { ApiClient } from '../api';

interface OnboardMemberModalProps {
  onClose: () => void;
  onMemberOnboarded: (member: TeamMember) => void;
  initialTeam?: string;
  tasks?: Task[];
  onLoginAsMember?: (user: { email: string; name: string }) => void;
}

const AVATAR_COLORS = [
  'bg-emerald-600',
  'bg-indigo-600',
  'bg-purple-600',
  'bg-rose-600',
  'bg-amber-600',
  'bg-sky-600',
  'bg-teal-600',
  'bg-violet-600',
];

const DEFAULT_ONBOARDING_CHECKLIST: OnboardingTaskItem[] = [
  { id: 'ob-1', title: 'Send workspace invitation & welcome email', completed: true },
  { id: 'ob-2', title: 'Setup account security & auth credentials', completed: false },
  { id: 'ob-3', title: 'Grant workspace & repository permissions', completed: false },
  { id: 'ob-4', title: 'Assign initial sprint onboarding task', completed: false },
  { id: 'ob-5', title: 'Schedule 1-on-1 team welcome check-in', completed: false },
];

export default function OnboardMemberModal({
  onClose,
  onMemberOnboarded,
  initialTeam,
  tasks = [],
  onLoginAsMember
}: OnboardMemberModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [team, setTeam] = useState(initialTeam || AVAILABLE_TEAMS[0]);
  const [customTeam, setCustomTeam] = useState('');
  const [accessLevel, setAccessLevel] = useState<'Admin' | 'Member' | 'Viewer'>('Member');
  const [color, setColor] = useState(AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]);
  const [skillInput, setSkillInput] = useState('');
  const [skills, setSkills] = useState<string[]>(['Teamwork', 'Workspace Setup']);
  const [password, setPassword] = useState('Welcome123');
  const [sendInvite, setSendInvite] = useState(true);
  const [assignInitialTask, setAssignInitialTask] = useState(true);
  const [selectedTaskTitle, setSelectedTaskTitle] = useState('Workspace Onboarding & Team Intro');
  const [checklist, setChecklist] = useState<OnboardingTaskItem[]>(DEFAULT_ONBOARDING_CHECKLIST);
  const [createdMember, setCreatedMember] = useState<TeamMember | null>(null);
  const [copied, setCopied] = useState(false);

  const getInitials = (fullName: string) => {
    if (!fullName.trim()) return 'TM';
    const parts = fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][parts.length - 1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  const toggleChecklistItem = (id: string) => {
    setChecklist(prev => prev.map(item => item.id === id ? { ...item, completed: !item.completed } : item));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    const finalTeam = team === 'CUSTOM' ? (customTeam.trim() || 'General Team') : team;
    const memberId = name.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 20) + `-${Date.now().toString().slice(-4)}`;
    
    // Check completed count
    const completedCount = checklist.filter(c => c.completed).length;
    let status: 'Invited' | 'In Progress' | 'Completed' = 'In Progress';
    if (completedCount === 0) status = 'Invited';
    if (completedCount === checklist.length) status = 'Completed';

    const userPassword = password.trim() || 'Welcome123';

    const newMember: TeamMember = {
      id: memberId,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      role: role.trim() || 'Team Member',
      team: finalTeam,
      accessLevel,
      onboardingStatus: status,
      joinedDate: new Date().toISOString().split('T')[0],
      skills,
      onboardingChecklist: checklist,
      avatarChar: getInitials(name),
      color,
      password: userPassword,
    };

    // Save Team Member
    await ApiClient.saveTeamMember(newMember);

    // Register User in local user accounts so they can log in via Auth screen
    const storedUsers = localStorage.getItem('pinobite_users');
    const users = storedUsers ? JSON.parse(storedUsers) : {};
    users[newMember.email] = {
      email: newMember.email,
      name: newMember.name,
      password: userPassword,
      securityQuestion: 'What was the name of your first pet?',
      securityAnswer: 'buddy'
    };
    localStorage.setItem('pinobite_users', JSON.stringify(users));

    // If assign initial task is checked, create a task for this member
    if (assignInitialTask) {
      const newTask: Task = {
        id: `task-ob-${Date.now()}`,
        task: `${selectedTaskTitle} (${newMember.name})`,
        description: `Welcome task assigned during team onboarding for ${newMember.name} in team ${finalTeam}.`,
        status: 'Not started',
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        priority: 'High Priority',
        tags: ['Onboarding', finalTeam],
        assignedTo: [newMember.id],
        createdAt: new Date().toISOString(),
        createdBy: 'workspace-admin'
      };
      await ApiClient.saveTask(newTask);
    }

    // Add Activity Log
    await ApiClient.addActivityLog({
      id: `log-${Date.now()}`,
      userId: newMember.id,
      userName: newMember.name,
      action: `was onboarded into team "${finalTeam}" as ${newMember.role}`,
      timestamp: new Date().toISOString()
    });

    // Dispatch custom notification
    window.dispatchEvent(new CustomEvent('pinobite_notification', {
      detail: {
        title: 'Team Member Onboarded! 🎉',
        text: `${newMember.name} has been created with login credentials.`
      }
    }));

    onMemberOnboarded(newMember);
    setCreatedMember(newMember);
    setStep(3);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-popup-in">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">Onboard New Team Member</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Step {step} of 2 — {step === 1 ? 'Member Details & Team Selection' : 'Onboarding Setup & Checklist'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          {step === 1 ? (
            <>
              {/* Avatar Preview & Color Selection */}
              <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div className={`w-14 h-14 rounded-2xl ${color} text-white font-black text-lg flex items-center justify-center shadow-md`}>
                  {getInitials(name)}
                </div>
                <div className="flex-1 space-y-1.5">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">Avatar Badge Tone</span>
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-6 h-6 rounded-full ${c} transition-all cursor-pointer ${
                          color === c ? 'ring-2 ring-indigo-500 ring-offset-2 scale-110' : 'opacity-80 hover:opacity-100'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Name & Email Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. sarah@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>
              </div>

              {/* Team / Department Selection */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Assign to Team / Department <span className="text-rose-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {AVAILABLE_TEAMS.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTeam(t)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center justify-between ${
                        team === t
                          ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      <span className="truncate">{t}</span>
                      {team === t && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTeam('CUSTOM')}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      team === 'CUSTOM'
                        ? 'bg-indigo-50 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    + Custom Team
                  </button>
                </div>
                {team === 'CUSTOM' && (
                  <input
                    type="text"
                    required
                    placeholder="Enter custom team name (e.g. AI Research & Data)"
                    value={customTeam}
                    onChange={(e) => setCustomTeam(e.target.value)}
                    className="w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                )}
              </div>

              {/* Job Title / Role & Access Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                    Role / Job Title
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Senior Frontend Engineer"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                    Workspace Permission
                  </label>
                  <div className="relative">
                    <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <select
                      value={accessLevel}
                      onChange={(e) => setAccessLevel(e.target.value as any)}
                      className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3.5 py-2.5 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500 cursor-pointer"
                    >
                      <option value="Member">Member (Standard Access)</option>
                      <option value="Admin">Admin (Full Management)</option>
                      <option value="Viewer">Viewer (Read Only)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Set Login Password */}
              <div className="space-y-1">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Member Login Password
                </label>
                <input
                  type="text"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (e.g. Welcome123)"
                  className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-400 block">Initial password generated for member login dashboard access.</span>
              </div>

              {/* Skills Tags Input */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Skills & Expertise Tags
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Add skill (e.g. React, Figma, SEO)..."
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkill();
                      }
                    }}
                    className="flex-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold px-3 py-2 rounded-xl text-xs transition-colors cursor-pointer shrink-0"
                  >
                    + Add
                  </button>
                </div>
                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {skills.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900"
                      >
                        {s}
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(s)}
                          className="hover:text-rose-500 transition-colors"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : step === 2 ? (
            <>
              {/* Step 2: Onboarding Setup & Checklist */}
              <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/30 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 dark:text-indigo-300">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <span>Onboarding Workflow Package for {name || 'New Member'}</span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  Configure automated invites, default task assignments, and checklist items to ensure a smooth team onboarding experience.
                </p>
              </div>

              {/* Toggle Options */}
              <div className="space-y-3">
                <label className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-300">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Send Email Invitation & Welcome Guide</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Sends instant email with login link & credentials to {email || 'member email'}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sendInvite}
                    onChange={(e) => setSendInvite(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl cursor-pointer hover:border-indigo-300">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">Assign Initial Onboarding Task</span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Automatically creates and assigns a starter sprint task</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={assignInitialTask}
                    onChange={(e) => setAssignInitialTask(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                  />
                </label>
              </div>

              {assignInitialTask && (
                <div className="space-y-1">
                  <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                    Initial Task Title
                  </label>
                  <input
                    type="text"
                    value={selectedTaskTitle}
                    onChange={(e) => setSelectedTaskTitle(e.target.value)}
                    className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-900 dark:text-white outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Onboarding Checklist Steps */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-slate-700 dark:text-slate-300 block">
                  Initial Onboarding Checklist Steps
                </label>
                <div className="space-y-1.5">
                  {checklist.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleChecklistItem(item.id)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        item.completed
                          ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors ${
                        item.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900'
                      }`}>
                        {item.completed && <Check className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-xs font-bold flex-1">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            /* STEP 3: CREATED CREDENTIALS SUMMARY */
            <div className="space-y-5 text-center py-2">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-lg font-black text-slate-900 dark:text-white">Onboarding Complete & Credentials Ready! 🎉</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  <span className="font-bold text-slate-800 dark:text-slate-200">{createdMember?.name}</span> is onboarded into <span className="font-bold text-indigo-600">{createdMember?.team}</span>. Below are the generated login credentials for their dashboard.
                </p>
              </div>

              {/* Copyable Credentials Box */}
              <div className="bg-slate-900 text-slate-100 p-4 rounded-2xl text-left font-mono space-y-3 relative shadow-inner">
                <div className="flex justify-between items-center text-xs text-slate-400 border-b border-slate-800 pb-2">
                  <span>MEMBER ACCESS CREDENTIALS</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(`Email: ${createdMember?.email}\nPassword: ${createdMember?.password}\nTeam: ${createdMember?.team}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="text-xs font-sans font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copied ? '✓ Copied!' : 'Copy Credentials'}
                  </button>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div><span className="text-slate-500 font-sans">Full Name:</span> <span className="text-white font-bold">{createdMember?.name}</span></div>
                  <div><span className="text-slate-500 font-sans">Email:</span> <span className="text-emerald-400 font-bold">{createdMember?.email}</span></div>
                  <div><span className="text-slate-500 font-sans">Password:</span> <span className="text-amber-300 font-bold">{createdMember?.password}</span></div>
                  <div><span className="text-slate-500 font-sans">Department:</span> <span className="text-indigo-300 font-bold">{createdMember?.team} ({createdMember?.role})</span></div>
                </div>
              </div>

              {/* Direct Quick Login Button */}
              {onLoginAsMember && createdMember && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onLoginAsMember({ email: createdMember.email, name: createdMember.name });
                      onClose();
                    }}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 rounded-2xl shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <span>Log in as {createdMember.name} to view member dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls */}
          {step !== 3 && (
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              {step === 2 ? (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  ← Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              )}

              {step === 1 ? (
                <button
                  type="button"
                  disabled={!name.trim() || !email.trim()}
                  onClick={() => setStep(2)}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition-all cursor-pointer"
                >
                  <span>Continue to Setup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-2.5 rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Onboarding</span>
                </button>
              )}
            </div>
          )}
          {step === 3 && (
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
