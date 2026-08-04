import React, { useState } from 'react';
import { X, UserCheck, Shield, Mail, Building, Tag, Palette, Check, Sparkles, Edit3, Trash2 } from 'lucide-react';
import { TeamMember } from '../types';
import { AVAILABLE_TEAMS } from '../data/team';
import { ApiClient } from '../api';

interface EditMemberModalProps {
  member: TeamMember;
  onClose: () => void;
  onSave: (updatedMember: TeamMember) => void;
  onDelete?: (memberId: string) => void;
  isAdmin?: boolean;
}

const COLOR_OPTIONS = [
  { label: 'Indigo', value: 'indigo', bg: 'bg-indigo-600' },
  { label: 'Rose', value: 'rose', bg: 'bg-rose-600' },
  { label: 'Emerald', value: 'emerald', bg: 'bg-emerald-600' },
  { label: 'Amber', value: 'amber', bg: 'bg-amber-600' },
  { label: 'Violet', value: 'violet', bg: 'bg-violet-600' },
  { label: 'Sky', value: 'sky', bg: 'bg-sky-600' },
  { label: 'Teal', value: 'teal', bg: 'bg-teal-600' }
];

export default function EditMemberModal({ member, onClose, onSave, onDelete, isAdmin = true }: EditMemberModalProps) {
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.email);
  const [password, setPassword] = useState(member.password || 'Password123!');
  const [role, setRole] = useState(member.role || 'Team Member');
  const [team, setTeam] = useState(member.team || 'Engineering');
  const [accessLevel, setAccessLevel] = useState<'Super Admin' | 'Admin' | 'Member' | 'Viewer'>(member.accessLevel || 'Member');
  const [color, setColor] = useState(member.color || 'indigo');
  const [onboardingStatus, setOnboardingStatus] = useState<'Completed' | 'In Progress' | 'Invited'>(member.onboardingStatus || 'Completed');
  const [skillsInput, setSkillsInput] = useState((member.skills || []).join(', '));
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setError('Name and Email are required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const skillsArr = skillsInput
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const updated: TeamMember = {
        ...member,
        name: name.trim(),
        avatarChar: name.trim().charAt(0).toUpperCase() || 'A',
        email: email.trim().toLowerCase(),
        password: password.trim() || 'Password123!',
        role: role.trim(),
        team,
        accessLevel,
        color,
        onboardingStatus,
        skills: skillsArr
      };

      // Also sync user login credentials into localStorage pinobite_users
      const usersJson = localStorage.getItem('pinobite_users');
      let users = usersJson ? JSON.parse(usersJson) : {};
      
      users[updated.email] = {
        email: updated.email,
        name: updated.name,
        password: updated.password,
        securityQuestion: 'What was the name of your first pet?',
        securityAnswer: 'buddy'
      };

      // If email changed from previous email, clean up old entry if needed
      if (member.email && member.email !== updated.email && users[member.email]) {
        delete users[member.email];
      }
      localStorage.setItem('pinobite_users', JSON.stringify(users));

      await ApiClient.saveTeamMember(updated);
      onSave(updated);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save member details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-6 shadow-2xl text-slate-900 dark:text-white my-8">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Edit Account Details</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Update name, designation, department, and access level.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/80 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-300 rounded-2xl text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Bhavan Badhe"
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Email Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@pinobite.com"
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Account Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Account Password</label>
            <input
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password..."
              required
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-semibold text-amber-500 focus:outline-none focus:border-indigo-500"
            />
            <span className="text-[10px] text-slate-400 block">Password used by this account to log into the workspace.</span>
          </div>

          {/* Designation / Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Role / Designation</label>
            <input
              type="text"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="e.g. Lead Administrator & Workspace Owner"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Grid: Department & Access Level */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Department / Team</label>
              <select
                value={team}
                onChange={(e) => setTeam(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {AVAILABLE_TEAMS.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Access Level</label>
              <select
                value={accessLevel}
                onChange={(e) => setAccessLevel(e.target.value as any)}
                disabled={!isAdmin}
                className={`w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 ${!isAdmin ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <option value="Super Admin">👑 Super Admin (Owner Access)</option>
                <option value="Admin">⚡ Admin (Full System Access)</option>
                <option value="Member">👤 Member (Standard Access)</option>
                <option value="Viewer">👁️ Viewer (Read Only)</option>
              </select>
              {!isAdmin && <span className="text-[10px] text-amber-500 block font-medium">Only workspace administrators can change permissions.</span>}
            </div>
          </div>

          {/* Avatar Color Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Avatar Color Theme</label>
            <div className="flex items-center gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center text-white transition-transform cursor-pointer ${
                    color === c.value ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-900 scale-110' : 'opacity-80 hover:opacity-100'
                  }`}
                  title={c.label}
                >
                  {color === c.value && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Skills (Comma Separated) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Skills & Expertise (Comma separated)</label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              placeholder="e.g. System Security, React, Fullstack, Sprint Planning"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Onboarding Status */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Onboarding Status</label>
            <select
              value={onboardingStatus}
              onChange={(e) => setOnboardingStatus(e.target.value as any)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="Completed">✅ Completed</option>
              <option value="In Progress">⏳ In Progress</option>
              <option value="Invited">✉️ Invited</option>
            </select>
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            {isAdmin && !member.isMe && member.email !== 'admin@pinobite.com' ? (
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm(`Are you sure you want to delete team member ${member.name}?`)) {
                    await ApiClient.deleteTeamMember(member.id);
                    if (onDelete) {
                      onDelete(member.id);
                    }
                    onClose();
                  }
                }}
                className="px-3.5 py-2.5 bg-rose-50 dark:bg-rose-950/80 hover:bg-rose-100 dark:hover:bg-rose-900 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Member</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-indigo-500/20 cursor-pointer active:scale-95"
              >
                {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
}
