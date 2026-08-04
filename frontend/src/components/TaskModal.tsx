import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertTriangle, Tag, Users, MessageSquare, Plus, Trash2, Send, CheckSquare, Check, Link, ExternalLink } from 'lucide-react';
import { Task, TeamMember, Comment, TaskStatus, TaskPriority } from '../types';
import { INITIAL_TEAM, TAG_OPTIONS } from '../data/team';
import { ApiClient } from '../api';
import { UserAvatar } from './UserAvatar';

interface TaskModalProps {
  task: Task;
  onClose: () => void;
  onUpdate: (updated: Task) => void;
  onDelete: (id: string) => void;
  currentUser: { name: string; email: string };
  teamMembers?: TeamMember[];
  isAdmin?: boolean;
}

export default function TaskModal({ task, onClose, onUpdate, onDelete, currentUser, teamMembers: propTeamMembers, isAdmin = true }: TaskModalProps) {
  const [title, setTitle] = useState(task.task);
  const [description, setDescription] = useState(task.description);
  const [status, setStatus] = useState<TaskStatus>(task.status);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate);
  const [selectedTags, setSelectedTags] = useState<string[]>(task.tags);
  const [assignedTo, setAssignedTo] = useState<string[]>(task.assignedTo);
  const [attachments, setAttachments] = useState<{ id: string; name: string; url: string }[]>(task.attachments || []);
  const [newAttachmentUrl, setNewAttachmentUrl] = useState('');
  const [newAttachmentName, setNewAttachmentName] = useState('');
  const [teamMembersList, setTeamMembersList] = useState<TeamMember[]>(propTeamMembers || []);

  useEffect(() => {
    const fetchTeam = async () => {
      const list = await ApiClient.getTeamMembers();
      if (list && list.length > 0) {
        setTeamMembersList(list);
      }
    };
    fetchTeam();
  }, [propTeamMembers]);
  
  // Comments state (stored in localStorage per task)
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  // Sub-tasks state (stored within the task object)
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; completed: boolean }[]>(task.subtasks || []);
  const [newSubtaskText, setNewSubtaskText] = useState('');

  // Load comments
  useEffect(() => {
    const load = async () => {
      const stored = await ApiClient.getComments(task.id);
      if (stored.length > 0) {
        // Deduplicate in case storage had issues previously
        const uniqueComments = stored.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setComments(uniqueComments);
      } else {
        // Start with empty comments list for new task
        setComments([]);
      }
    };
    load();
  }, [task.id]);

  const handleSave = () => {
    const updated: Task = {
      ...task,
      task: title || 'Untitled Task',
      description,
      status,
      priority,
      dueDate,
      tags: selectedTags,
      assignedTo,
      attachments,
      subtasks,
    };
    onUpdate(updated);
  };

  // Auto-save changes on field changes
  useEffect(() => {
    handleSave();
  }, [title, description, status, priority, dueDate, selectedTags, assignedTo, attachments, subtasks]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const comment: Comment = {
      id: `comment-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      taskId: task.id,
      senderId: currentUser.email || 'user',
      senderName: currentUser.name || 'User',
      senderColor: 'bg-emerald-600',
      content: newComment.trim(),
      timestamp: new Date().toISOString()
    };

    const savedComment = await ApiClient.saveComment(comment);
    const updatedComments = [...comments, savedComment];
    setComments(updatedComments);
    setNewComment('');

    // Trigger parent update with log
    const newLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      taskId: task.id,
      userId: currentUser.email || 'user',
      userName: currentUser.name || 'User',
      action: `commented on "${title || 'Untitled Task'}"`,
      timestamp: new Date().toISOString()
    };
    await ApiClient.addActivityLog(newLog);
    window.dispatchEvent(new Event('pinobite_activity_update'));
  };

  const handleAddSubtask = () => {
    if (!newSubtaskText.trim()) return;
    const n = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: newSubtaskText.trim(),
      completed: false
    };
    setSubtasks([...subtasks, n]);
    setNewSubtaskText('');
  };

  const toggleSubtask = (id: string) => {
    setSubtasks(subtasks.map(s => s.id === id ? { ...s, completed: !s.completed } : s));
  };

  const removeSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const toggleAssignee = (id: string) => {
    if (assignedTo.includes(id)) {
      setAssignedTo(assignedTo.filter(a => a !== id));
    } else {
      setAssignedTo([...assignedTo, id]);
    }
  };

  const handleAddAttachment = () => {
    if (!newAttachmentUrl.trim()) return;
    
    // Simple logic to derive a name if not provided
    const name = newAttachmentName.trim() || new URL(newAttachmentUrl).hostname || 'Link';
    
    const newAttachment = {
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      name,
      url: newAttachmentUrl.trim().startsWith('http') ? newAttachmentUrl.trim() : `https://${newAttachmentUrl.trim()}`
    };
    
    setAttachments([...attachments, newAttachment]);
    setNewAttachmentUrl('');
    setNewAttachmentName('');
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex justify-end max-sm:items-end max-sm:justify-center z-50 animate-overlay-fade" id="task-modal-overlay">
      <div 
        className="w-full max-w-2xl bg-slate-900 border-l max-sm:border-l-0 max-sm:border-t border-slate-800 h-full max-sm:h-[90vh] max-sm:rounded-t-3xl flex flex-col shadow-2xl relative animate-popup-in max-sm:animate-mobile-slide-up text-slate-200"
        id="task-modal-panel"
      >
        {/* Header toolbar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-800 text-slate-450 px-2 py-1 rounded font-mono">
              {task.id}
            </span>
            <span className="text-xs text-slate-500">
              Created by {INITIAL_TEAM.find(t => t.id === task.createdBy)?.name || 'Team'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
                title="Delete Task"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Title */}
          <div className="space-y-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Task"
              className="w-full bg-transparent text-2xl font-bold text-white border-b border-transparent hover:border-slate-800 focus:border-indigo-500 py-1 outline-none transition-all"
            />
          </div>

          {/* Core Properties Panel Grid */}
          <div className="grid grid-cols-2 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-800/80">
            {/* Status */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="bg-slate-850 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 text-xs w-full outline-none cursor-pointer focus:border-indigo-500"
              >
                <option value="Not started">⚪ Not started</option>
                <option value="In progress">🔵 In progress</option>
                <option value="Done">🟢 Done</option>
              </select>
            </div>

            {/* Priority */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="bg-slate-850 border border-slate-750 text-slate-200 rounded px-2.5 py-1.5 text-xs w-full outline-none cursor-pointer focus:border-indigo-500"
              >
                <option value="">No Priority</option>
                <option value="Low Priority">Low Priority</option>
                <option value="Minimal Priority">Minimal Priority</option>
                <option value="High Priority">High Priority</option>
              </select>
            </div>

            {/* Due Date */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-500" />
                <span>Due Date</span>
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="bg-slate-850 border border-slate-750 text-slate-200 rounded px-2.5 py-1 text-xs w-full outline-none focus:border-indigo-500"
              />
            </div>

            {/* Assigned To Multi */}
            <div className="space-y-1.5 col-span-2 sm:col-span-1">
              <label className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users className="w-3 h-3 text-slate-500" />
                  <span>Assigned To</span>
                </span>
                {assignedTo.length > 0 && (
                  <span className="text-[10px] text-indigo-400 font-bold lowercase">
                    {assignedTo.length} assigned
                  </span>
                )}
              </label>
              <div className="flex flex-col gap-1.5 pt-1">
                {teamMembersList.map(member => {
                  const isAssigned = assignedTo.includes(member.id);
                  return (
                    <button
                      key={member.id}
                      type="button"
                      onClick={() => toggleAssignee(member.id)}
                      className={`w-full text-left p-1.5 px-2.5 rounded-xl flex items-center justify-between transition-all cursor-pointer border ${
                        isAssigned 
                          ? 'bg-indigo-950/60 text-indigo-200 border-indigo-500/50 shadow-xs' 
                          : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <UserAvatar member={member} size="sm" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold truncate leading-tight">{member.name}</div>
                          <div className="text-[10px] text-slate-500 truncate">{member.email}</div>
                        </div>
                      </div>
                      <div className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-colors ${
                        isAssigned ? 'bg-indigo-600 text-white' : 'border border-slate-700 bg-slate-800/50'
                      }`}>
                        {isAssigned && <Check className="w-3 h-3" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a detailed description of this task..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-sm text-slate-300 focus:border-indigo-500 outline-none resize-none transition-all"
            />
          </div>

          {/* Tags Multi-select Row */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400 block flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              <span>Tags / Categories</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {TAG_OPTIONS.map(tag => {
                const hasTag = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`text-xs px-2 py-0.5 rounded transition-all cursor-pointer ${
                      hasTag
                        ? 'bg-slate-200 text-slate-950 font-medium'
                        : 'bg-slate-800/60 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Subtasks checklist Section */}
          <div className="space-y-3 pt-2 border-t border-slate-850">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-slate-450" />
              <span>Sprinting checklist / Subtasks</span>
            </h3>

            {/* Checklist elements */}
            <div className="space-y-2">
              {subtasks.map(sub => (
                <div key={sub.id} className="flex items-center justify-between group bg-slate-955 hover:bg-slate-950 p-2 rounded border border-slate-850/50 transition-all">
                  <div className="flex items-center gap-2.5 flex-1">
                    <input
                      type="checkbox"
                      checked={sub.completed}
                      onChange={() => toggleSubtask(sub.id)}
                      className="rounded border-slate-750 bg-slate-850 text-indigo-500 focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <span className={`text-xs ${sub.completed ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                      {sub.title}
                    </span>
                  </div>
                  <button
                    onClick={() => removeSubtask(sub.id)}
                    className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-indigo-400 p-0.5 transition-opacity cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Checklist Field */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add subtask item..."
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask()}
                className="flex-1 bg-slate-950 border border-slate-850 rounded px-2.5 py-1 text-xs outline-none focus:border-indigo-500 text-slate-200"
              />
              <button
                onClick={handleAddSubtask}
                className="bg-slate-800 hover:bg-slate-750 text-slate-200 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="space-y-3 pt-4 border-t border-slate-850">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <Link className="w-3.5 h-3.5 text-slate-450" />
              <span>Task Attachments & Refs</span>
            </h3>

            {/* Attachment Chips */}
            <div className="flex flex-wrap gap-2">
              {attachments.map(att => (
                <div key={att.id} className="flex items-center gap-2 bg-slate-850 hover:bg-slate-800 border border-slate-700/50 p-1.5 pl-2.5 rounded-full transition-all group">
                  <a 
                    href={att.url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[11px] font-medium text-indigo-300 hover:text-indigo-200 flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3 h-3" />
                    <span>{att.name}</span>
                  </a>
                  <button 
                    onClick={() => removeAttachment(att.id)}
                    className="p-1 hover:bg-slate-700 rounded-full text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {attachments.length === 0 && (
                <p className="text-[10px] text-slate-500 italic">No attachments yet.</p>
              )}
            </div>

            {/* Add Attachment Inputs */}
            <div className="space-y-2 bg-slate-950/40 p-3 rounded-xl border border-slate-800/60">
              <div className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    placeholder="Reference URL (e.g. docs.google.com/...)"
                    value={newAttachmentUrl}
                    onChange={(e) => setNewAttachmentUrl(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>
                <div className="w-1/3 space-y-1">
                  <input
                    type="text"
                    placeholder="Name (Optional)"
                    value={newAttachmentName}
                    onChange={(e) => setNewAttachmentName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-[11px] outline-none focus:border-indigo-500 text-slate-200"
                  />
                </div>
              </div>
              <button
                onClick={handleAddAttachment}
                disabled={!newAttachmentUrl.trim()}
                className="w-full bg-indigo-600/10 hover:bg-indigo-600 text-indigo-400 hover:text-white border border-indigo-600/20 py-1.5 rounded text-[11px] font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Attach External Reference</span>
              </button>
            </div>
          </div>

          {/* Collaborative comments stream */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-xs font-bold text-slate-450 uppercase tracking-wider flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-slate-450" />
              <span>Integrated Collaboration Chat</span>
            </h3>

            {/* Chat list */}
            <div className="space-y-3 max-h-[180px] overflow-y-auto pr-1">
              {comments.map((comm) => (
                <div key={comm.id} className="text-xs space-y-1 bg-slate-955 p-2.5 rounded-lg border border-slate-850/40">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${comm.senderColor}`}>
                        {comm.senderName.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="font-bold text-slate-300">{comm.senderName}</span>
                    </div>
                    <span className="text-[9px] text-slate-500">
                      {new Date(comm.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 pl-5 leading-normal">{comm.content}</p>
                </div>
              ))}
            </div>

            {/* Comment inputs */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                placeholder="Ask team or leave an update..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-850 rounded px-3 py-1.5 text-xs outline-none focus:border-indigo-500 text-slate-200"
              />
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 rounded flex items-center justify-center transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

        </div>
      </div>

      {/* CONFIRMATION POPUP MODAL */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-overlay-fade">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-popup-in text-center relative">
            <div className="w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h3 className="text-base font-bold text-white">Delete Task?</h3>
              <p className="text-xs text-slate-400">
                Are you sure you want to delete <span className="text-slate-200 font-semibold">"{task.task}"</span>? This action cannot be undone.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onDelete(task.id);
                  onClose();
                }}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
