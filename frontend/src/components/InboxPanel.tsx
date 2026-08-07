import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Users, Hash, UserCircle2 } from 'lucide-react';
import { Comment, Task, TeamMember } from '../types';
import { ApiClient } from '../api';

interface InboxPanelProps {
  tasks: Task[];
  onTasksUpdateExternally: (updated: Task[]) => void;
  currentUser: { name: string; email: string };
  teamMembers?: TeamMember[];
}

interface ChatTarget {
  id: string;
  name: string;
  type: 'channel' | 'dm';
  email?: string;
  color?: string;
  role?: string;
}

export default function InboxPanel({ tasks, onTasksUpdateExternally, currentUser, teamMembers = [] }: InboxPanelProps) {
  const [activeTarget, setActiveTarget] = useState<ChatTarget>({
    id: 'global',
    name: 'General Workspace',
    type: 'channel'
  });
  
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Load & poll chat messages in real-time
  useEffect(() => {
    const load = async () => {
      try {
        const rawComments = await ApiClient.getComments();
        // Normalize comments to guarantee taskId, senderId, senderName are present regardless of API field case
        const all = (rawComments || []).map((c: any) => ({
          ...c,
          taskId: c.taskId || c.task_id || 'global',
          senderId: c.senderId || c.sender_id || 'user',
          senderName: c.senderName || c.sender_name || 'User',
          senderColor: c.senderColor || c.sender_color || 'bg-indigo-600'
        }));

        let comments: Comment[] = [];
        if (activeTarget.type === 'channel') {
          comments = all.filter(c => c.taskId === activeTarget.id || (activeTarget.id === 'global' && c.taskId === 'global'));
        } else {
          // Direct Messages filtering with bi-directional ID, email & name matching
          const targetId = (activeTarget.id || '').toLowerCase();
          const targetEmail = (activeTarget.email || '').toLowerCase();
          const targetName = (activeTarget.name || '').toLowerCase();

          const myEmail = (currentUser.email || '').toLowerCase();
          const myName = (currentUser.name || '').toLowerCase();

          const myMember = teamMembers.find(
            m => (m.email && m.email.toLowerCase() === myEmail) ||
                 (m.name && m.name.toLowerCase() === myName)
          );
          const myId = (myMember?.id || '').toLowerCase();

          comments = all.filter(c => {
            if (c.taskId === 'global') return false;

            const sId = (c.senderId || '').toLowerCase();
            const sName = (c.senderName || '').toLowerCase();
            const tId = (c.taskId || '').toLowerCase();

            const isSenderTarget = (targetId && sId === targetId) || (targetEmail && sId === targetEmail) || (targetName && sName === targetName);
            const isSenderMe = (myId && sId === myId) || (myEmail && sId === myEmail) || (myName && sName === myName);

            const isTargetMe = (myId && tId === myId) || (myEmail && tId === myEmail) || (myName && tId === myName);
            const isTargetTarget = (targetId && tId === targetId) || (targetEmail && tId === targetEmail) || (targetName && tId === targetName);

            return (isSenderTarget && (isTargetMe || isTargetTarget)) ||
                   (isSenderMe && (isTargetTarget || isTargetMe));
          });
        }

        if (comments.length > 0) {
          const uniqueComments = comments.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
          setChatMessages(uniqueComments);
        } else {
          setChatMessages([]);
        }
      } catch (err) {
        console.warn("Failed to load chat messages", err);
      }
    };

    load();
    const timer = setInterval(load, 2500); // Real-time poll every 2.5 seconds
    return () => clearInterval(timer);
  }, [activeTarget, currentUser, teamMembers]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const contentToSend = typedMessage.trim();
    setTypedMessage('');

    const myChat: any = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      taskId: activeTarget.id,
      task_id: activeTarget.id,
      senderId: currentUser.email || 'user',
      sender_id: currentUser.email || 'user',
      senderName: currentUser.name || 'User',
      sender_name: currentUser.name || 'User',
      senderColor: 'bg-indigo-600',
      sender_color: 'bg-indigo-600',
      content: contentToSend,
      timestamp: new Date().toISOString()
    };

    // Optimistic UI update: immediately add to list
    setChatMessages((prev) => [...prev, myChat]);

    try {
      await ApiClient.saveComment(myChat);
      
      // Save real-time activity log
      await ApiClient.addActivityLog({
        id: `log-${Date.now()}`,
        userId: currentUser.email || 'user',
        userName: currentUser.name || 'User',
        action: `sent message in ${activeTarget.name}: "${contentToSend.length > 25 ? contentToSend.substring(0, 25) + '...' : contentToSend}"`,
        timestamp: new Date().toISOString()
      });

      // Dispatch real-time toast & activity notification event
      window.dispatchEvent(new CustomEvent('pinobite_notification', {
        detail: {
          title: `New Message in ${activeTarget.name}`,
          text: `${currentUser.name}: ${contentToSend}`
        }
      }));
      window.dispatchEvent(new Event('pinobite_activity_update'));
    } catch (err) {
      console.error("Failed to save chat comment:", err);
    }
  };

  const clearSessionLogs = () => {
    localStorage.removeItem('pinobite_comments');
    localStorage.removeItem(`pinobite_comments_${activeTarget.id}`);
    setChatMessages([]);
  };

  return (
    <div className="p-4 sm:p-6 h-[calc(100vh-70px)] flex flex-col w-full max-w-full" id="collaboration-hub">
      <div className="flex-1 flex gap-4 w-full h-full min-h-0">
        
        {/* Left Sidebar: Channels & Direct Messages (Who to chat with) */}
        <div className="w-64 sm:w-72 bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col h-full shrink-0 shadow-lg overflow-y-auto space-y-6">
          
          {/* Header */}
          <div>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Select Chat</h2>
            <p className="text-[11px] text-slate-500">Choose a channel or team member to message</p>
          </div>

          {/* Channels Section */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block">
              Channels
            </span>
            <button
              onClick={() => setActiveTarget({ id: 'global', name: 'General Workspace', type: 'channel' })}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                activeTarget.id === 'global'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
              }`}
            >
              <Hash className="w-4 h-4 text-indigo-400" />
              <div className="truncate flex-1">
                <span className="block font-semibold">General Workspace</span>
                <span className="text-[10px] opacity-75">All team members</span>
              </div>
            </button>
          </div>

          {/* Direct Messages Section */}
          <div className="space-y-1.5 flex-1">
            {(() => {
              const otherMembers = teamMembers.filter(
                m => (m.email && m.email.toLowerCase() !== currentUser.email?.toLowerCase()) &&
                     (m.name && m.name.toLowerCase() !== currentUser.name?.toLowerCase())
              );
              return (
                <>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 block">
                    Direct Messages ({otherMembers.length})
                  </span>
                  
                  {otherMembers.length === 0 ? (
                    <div className="p-3 text-[11px] text-slate-500 italic bg-slate-950/50 rounded-lg">
                      No other teammates added yet. Add team members in the "Team Panel".
                    </div>
                  ) : (
                    otherMembers.map((member) => {
                      const isSelected = activeTarget.id === member.id;
                      const formattedName = member.name 
                        ? member.name.charAt(0).toUpperCase() + member.name.slice(1) 
                        : 'Teammate';
                      return (
                        <button
                          key={member.id}
                          onClick={() => setActiveTarget({
                            id: member.id,
                            name: formattedName,
                            type: 'dm',
                            email: member.email,
                            role: member.role
                          })}
                          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all text-left cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                              : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'
                          }`}
                        >
                          <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-indigo-400 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {formattedName.charAt(0).toUpperCase()}
                          </span>
                          <div className="truncate flex-1">
                            <span className="block font-semibold text-slate-200">{formattedName}</span>
                            <span className="text-[10px] text-slate-400 truncate block">{member.role || member.email}</span>
                          </div>
                        </button>
                      );
                    })
                  )}
                </>
              );
            })()}
          </div>

          {/* Current User Card */}
          <div className="pt-3 border-t border-slate-800 flex items-center gap-2.5">
            <span className="w-7 h-7 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
              {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
            </span>
            <div className="truncate">
              <span className="text-xs font-semibold text-slate-200 block truncate">
                {currentUser.name ? currentUser.name.charAt(0).toUpperCase() + currentUser.name.slice(1) : 'User'} (You)
              </span>
              <span className="text-[10px] text-emerald-400 block truncate">{currentUser.email}</span>
            </div>
          </div>

        </div>

        {/* Right Main Chat Area */}
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 flex flex-col flex-1 h-full shadow-lg min-w-0">
          
          {/* Active Chat Header */}
          <div className="flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600/10 rounded-xl text-indigo-400 border border-indigo-500/20">
                {activeTarget.type === 'channel' ? (
                  <Hash className="w-5 h-5 text-indigo-500" />
                ) : (
                  <UserCircle2 className="w-5 h-5 text-indigo-500" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center gap-2">
                  <span>{activeTarget.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950 text-indigo-400 border border-indigo-800/50 uppercase font-semibold">
                    {activeTarget.type}
                  </span>
                </h3>
                <p className="text-xs text-slate-400">
                  {activeTarget.type === 'channel' 
                    ? 'General workspace chat for all team members' 
                    : `Direct private conversation with ${activeTarget.name} (${activeTarget.email || ''})`}
                </p>
              </div>
            </div>
            
            <button 
              onClick={clearSessionLogs}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 cursor-pointer"
            >
              Clear Chat
            </button>
          </div>

          {/* Message Area */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 mb-4">
            {chatMessages.length === 0 ? (
              <div className="text-center text-sm text-slate-500 flex flex-col items-center justify-center h-full gap-2">
                <MessageSquare className="w-8 h-8 text-slate-700" />
                <span>No messages in {activeTarget.name} yet. Send a message to start chatting!</span>
              </div>
            ) : (
              chatMessages.map((msg) => {
                const isMe = msg.senderId === currentUser.email || msg.senderName === currentUser.name;
                return (
                  <div 
                    key={msg.id} 
                    className={`flex flex-col space-y-1 max-w-[75%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
                  >
                    <div className="flex items-center gap-2 px-1">
                      {!isMe && (
                        <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-[10px] font-extrabold text-white">
                          {msg.senderName.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                      <span className="font-semibold text-xs text-slate-300">{isMe ? 'You' : msg.senderName}</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className={`p-3 rounded-2xl text-xs sm:text-sm leading-relaxed border ${
                      isMe 
                        ? 'bg-indigo-600 text-white border-indigo-500/50 rounded-tr-none' 
                        : 'bg-slate-950 text-slate-200 border-slate-800 rounded-tl-none'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendChat} className="flex gap-3 pt-3 border-t border-slate-800/80">
            <input
              type="text"
              placeholder={`Send message to ${activeTarget.name}...`}
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm outline-none focus:border-indigo-500 text-slate-100 placeholder-slate-500 transition-colors"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-xl flex items-center justify-center gap-2 font-medium text-sm transition-all cursor-pointer min-h-[44px] active:scale-95 shadow-md shadow-indigo-600/20"
            >
              <span>Send</span>
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>
    </div>
  );
}
