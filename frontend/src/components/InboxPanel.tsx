import React, { useState, useEffect } from 'react';
import { Send, MessageSquare, Activity, ShieldCheck, HelpCircle, Users, CheckSquare, Sparkles, RefreshCw } from 'lucide-react';
import { Comment, ActivityLog, Task, TeamMember } from '../types';
import { INITIAL_TEAM } from '../data/team';
import { ApiClient } from '../api';

interface InboxPanelProps {
  tasks: Task[];
  onTasksUpdateExternally: (updated: Task[]) => void;
  currentUser: { name: string; email: string };
  teamMembers?: TeamMember[];
}

export default function InboxPanel({ tasks, onTasksUpdateExternally, currentUser, teamMembers = [] }: InboxPanelProps) {
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [typedMessage, setTypedMessage] = useState('');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [simulationActive, setSimulationActive] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'presence' | 'logs'>('chat');

  // Load chat & logs
  useEffect(() => {
    const load = async () => {
      const comments = await ApiClient.getComments('global');
      if (comments.length > 0) {
        const uniqueComments = comments.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setChatMessages(uniqueComments);
      } else {
        setChatMessages([]);
      }

      const logs = await ApiClient.getActivityLogs();
      if (logs.length > 0) {
        const uniqueLogs = logs.filter((v, i, a) => a.findIndex(t => t.id === v.id) === i);
        setActivityLogs(uniqueLogs);
      } else {
        setActivityLogs([]);
      }
    };
    load();
  }, []);

  // Listen for activity logs updates from TaskModal comments or other files
  useEffect(() => {
    const handleActivityChange = async () => {
      const logs = await ApiClient.getActivityLogs();
      setActivityLogs(logs);
    };
    window.addEventListener('pinobite_activity_update', handleActivityChange);
    return () => window.removeEventListener('pinobite_activity_update', handleActivityChange);
  }, []);

  // Simulating Collaboration updates
  useEffect(() => {
    if (!simulationActive || teamMembers.length === 0 || tasks.length === 0) return;

    const interval = setInterval(() => {
      const teammate = teamMembers[Math.floor(Math.random() * teamMembers.length)];
      if (!teammate) return;
      
      const randomTaskIndex = Math.floor(Math.random() * tasks.length);
      const targetTask = { ...tasks[randomTaskIndex] };


      // Possible collaborative simulation actions
      const actions = [
        {
          type: 'status',
          exec: () => {
            const statuses: ('Not started' | 'In progress' | 'Done')[] = ['Not started', 'In progress', 'Done'];
            const nextStatus = statuses[Math.floor(Math.random() * statuses.length)];
            if (targetTask.status === nextStatus) return null;
            targetTask.status = nextStatus;
            return `changed status to "${nextStatus}" on "${targetTask.task || 'Untitled'}"`;
          }
        },
        {
          type: 'priority',
          exec: () => {
            const priorities: ('Low Priority' | 'Minimal Priority' | 'High Priority')[] = ['Low Priority', 'Minimal Priority', 'High Priority'];
            const nextPriority = priorities[Math.floor(Math.random() * priorities.length)];
            if (targetTask.priority === nextPriority) return null;
            targetTask.priority = nextPriority;
            return `raised priority to "${nextPriority}" on "${targetTask.task || 'Untitled'}"`;
          }
        },
        {
          type: 'chat',
          exec: () => {
            const messages = [
              "We should double-check our criteria for Sprint 1.",
              "Just logged my hours, making solid progress!",
              "Does anyone have eyes on the auth bug?",
              "This UI looking cleaner by the minute. Love the dark vibe.",
              "Will update the spreadsheet metrics in a moment.",
            ];
            const msgContent = messages[Math.floor(Math.random() * messages.length)];
            
            // Add chat message
            const newChat = {
              id: `chat-sim-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              senderId: teammate.id,
              senderName: teammate.name,
              senderColor: teammate.color === 'bg-rose-600' ? 'bg-indigo-600' : teammate.color,
              content: msgContent,
              timestamp: new Date().toISOString()
            };

            const updatedChat = [...chatMessages, newChat];
            setChatMessages(updatedChat);
            localStorage.setItem('pinobite_chat_global', JSON.stringify(updatedChat));
            return `posted a new update in team chat`;
          }
        }
      ];

      const selectedAction = actions[Math.floor(Math.random() * actions.length)];
      const actionMessage = selectedAction.exec();

      if (actionMessage) {
        // Create activity log
        const newLog: ActivityLog = {
          id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          userId: teammate.id,
          userName: teammate.name,
          action: actionMessage,
          timestamp: new Date().toISOString(),
        };

        const updatedLogs = [newLog, ...activityLogs];
        setActivityLogs(updatedLogs);
        localStorage.setItem('pinobite_logs', JSON.stringify(updatedLogs));

        // Save task if it changed
        if (selectedAction.type !== 'chat') {
          const updatedTasks = tasks.map((t, idx) => idx === randomTaskIndex ? targetTask : t);
          onTasksUpdateExternally(updatedTasks);
        }

        // Show a custom collaborative popup / notice
        const notificationEvent = new CustomEvent('pinobite_notification', {
          detail: { title: teammate.name, text: actionMessage }
        });
        window.dispatchEvent(notificationEvent);
      }
    }, 45000); // every 45 seconds

    return () => clearInterval(interval);
  }, [tasks, activityLogs, chatMessages, simulationActive]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedMessage.trim()) return;

    const myChat = {
      id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      taskId: 'global',
      senderId: currentUser.email || 'user',
      senderName: currentUser.name || 'User',
      senderColor: 'bg-emerald-600',
      content: typedMessage.trim(),
      timestamp: new Date().toISOString()
    };

    const savedChat = await ApiClient.saveComment(myChat);
    const nextChat = [...chatMessages, savedChat];
    setChatMessages(nextChat);
    setTypedMessage('');
  };

  const clearSessionLogs = () => {
    localStorage.removeItem('pinobite_logs');
    localStorage.removeItem('pinobite_comments');
    localStorage.removeItem('pinobite_chat_global');
    setChatMessages([]);
    setActivityLogs([]);
  };

  return (
    <div className="p-4 sm:p-8 pb-28 sm:pb-8 max-w-7xl mx-auto space-y-4" id="collaboration-hub">
      
      {/* Mobile Sub-Navigation Segmented Buttons */}
      <div className="flex lg:hidden bg-slate-900 border border-slate-800 p-1 rounded-xl gap-1">
        <button
          onClick={() => setMobileTab('chat')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'chat' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Chat</span>
        </button>

        <button
          onClick={() => setMobileTab('presence')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'presence' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team ({teamMembers.length + 1})</span>
        </button>

        <button
          onClick={() => setMobileTab('logs')}
          className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            mobileTab === 'logs' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Logs ({activityLogs.length})</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 1. Live team presence column */}
        <div className={`bg-slate-900 rounded-xl border border-slate-800 p-4 space-y-4 ${
          mobileTab !== 'presence' ? 'hidden lg:block' : 'block'
        }`}>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              <span>Active Team Presence</span>
            </h3>
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          </div>

          {/* Presence Cards */}
          <div className="space-y-3">
            {/* Current User */}
            <div className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-850">
              <div className="flex items-center gap-2.5">
                <span className="w-8 h-8 rounded-full bg-emerald-600 text-white font-extrabold text-xs flex items-center justify-center uppercase">
                  {(currentUser.name || 'U').charAt(0)}
                </span>
                <div className="text-left">
                  <span className="font-semibold text-slate-200 text-xs block">{currentUser.name} (You)</span>
                  <span className="text-[10px] text-emerald-400 block">{currentUser.email}</span>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-950/40 text-emerald-400 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>

            {/* Other Onboarded Team Members */}
            {teamMembers.map(m => (
              <div key={m.id} className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-850">
                <div className="flex items-center gap-2.5">
                  <span className={`w-8 h-8 rounded-full ${m.color || 'bg-indigo-600'} text-white font-extrabold text-xs flex items-center justify-center uppercase`}>
                    {m.avatarChar || m.name.charAt(0)}
                  </span>
                  <div className="text-left">
                    <span className="font-semibold text-slate-200 text-xs block">{m.name}</span>
                    <span className="text-[10px] text-slate-400 block">{m.role || m.email}</span>
                  </div>
                </div>
                <span className="text-[10px] bg-slate-800/80 text-slate-300 border border-slate-700/50 px-2 py-0.5 rounded-full">
                  {m.onboardingStatus}
                </span>
              </div>
            ))}
          </div>

          {/* Dynamic simulator switch */}
          <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400">Collaboration Simulation</span>
              <input
                type="checkbox"
                checked={simulationActive}
                onChange={(e) => setSimulationActive(e.target.checked)}
                className="rounded text-indigo-600 border-slate-750 bg-slate-800 focus:ring-0 cursor-pointer w-4 h-4"
              />
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              When active, remote teammates will randomly update task priorities, status changes, and send real-time chat messages.
            </p>
          </div>
        </div>

        {/* 2. Team Chat Board */}
        <div className={`bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col h-[400px] ${
          mobileTab !== 'chat' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-indigo-500" />
              <span>Workspace Chat</span>
            </h3>
          </div>

          {/* Message board area */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 mb-3">
            {chatMessages.length === 0 ? (
              <div className="text-center py-10 text-xs text-slate-600">
                No chat history. Start typing below!
              </div>
            ) : (
              chatMessages.map((msg) => (
                <div key={msg.id} className="text-xs space-y-1 bg-slate-950/80 p-2.5 rounded-lg border border-slate-850/40 max-w-[92%]">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-extrabold text-white ${msg.senderColor}`}>
                        {msg.senderName.substring(0, 2).toUpperCase()}
                      </span>
                      <span className="font-bold text-slate-300">{msg.senderName}</span>
                    </div>
                    <span className="text-[8px] text-slate-500">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-slate-400 pl-5 leading-relaxed">{msg.content}</p>
                </div>
              ))
            )}
          </div>

          {/* Input box */}
          <form onSubmit={handleSendChat} className="flex gap-2">
            <input
              type="text"
              placeholder="Send message to sprint chat..."
              value={typedMessage}
              onChange={(e) => setTypedMessage(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs sm:text-sm outline-none focus:border-indigo-500 text-slate-200 placeholder-slate-650"
            />
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 rounded-lg flex items-center justify-center transition-all cursor-pointer min-h-[40px] active:scale-95"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* 3. Real-Time Activity Logs Column */}
        <div className={`bg-slate-900 rounded-xl border border-slate-800 p-4 flex flex-col h-[400px] ${
          mobileTab !== 'logs' ? 'hidden lg:flex' : 'flex'
        }`}>
          <div className="flex justify-between items-center pb-2 border-b border-slate-800 mb-2">
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>Collaboration Logs</span>
            </h3>
            <button 
              onClick={clearSessionLogs}
              className="text-[10px] text-slate-500 hover:text-slate-350 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Clear</span>
            </button>
          </div>

          {/* Log rows */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {activityLogs.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-600">
                No recent collaborative edits.
              </div>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="text-[11px] p-2 bg-slate-950/60 border border-slate-850/40 rounded flex flex-col space-y-0.5">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-slate-300">{log.userName}</span>
                    <span className="text-[8px] text-slate-500">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <span className="text-slate-500 leading-normal">{log.action}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
