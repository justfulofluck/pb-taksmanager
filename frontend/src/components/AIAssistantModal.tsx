import React, { useState } from 'react';
import { Sparkles, X, Copy, Check, PlusCircle, Wrench, FileText } from 'lucide-react';
import { Task } from '../types';

interface AIAssistantModalProps {
  tasks: Task[];
  onClose: () => void;
  onAddTask: (task: Partial<Task>) => void;
}

export default function AIAssistantModal({ tasks, onClose, onAddTask }: AIAssistantModalProps) {
  const [activeTab, setActiveTab] = useState<'generate' | 'standup'>('generate');
  
  // Generator form
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedTasks, setGeneratedTasks] = useState<Partial<Task>[]>([]);
  const [addedIds, setAddedIds] = useState<string[]>([]);

  // Standup generator
  const [copied, setCopied] = useState(false);

  // Quick preset templates
  const PRESETS = [
    'OAuth Login & Auth Flow',
    'Stripe Payment Gateway',
    'PostgreSQL Database Migration',
    'Unit & Integration Testing Suite',
    'Dark Mode & Mobile UI Polish'
  ];

  const handleGenerate = (searchTopic?: string) => {
    const query = searchTopic || topic;
    if (!query.trim()) return;

    setIsGenerating(true);
    setGeneratedTasks([]);

    setTimeout(() => {
      const simulated: Partial<Task>[] = [
        {
          task: `Design architecture & specs for ${query}`,
          description: `Map out API endpoints, data models, and edge cases for ${query}.`,
          priority: 'High Priority',
          tags: ['Specs', 'Architecture'],
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          assignedTo: []
        },
        {
          task: `Implement core logic for ${query}`,
          description: `Build and test primary functions, service hooks, and data persistence for ${query}.`,
          priority: 'High Priority',
          tags: ['Backend', 'Feature'],
          dueDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
          assignedTo: []
        },
        {
          task: `UI Component integration & responsiveness for ${query}`,
          description: `Create responsive user interfaces, form validations, and error boundaries.`,
          priority: 'Low Priority',
          tags: ['UI/UX', 'Frontend'],
          dueDate: new Date(Date.now() + 86400000 * 6).toISOString().split('T')[0],
          assignedTo: []
        },
        {
          task: `Security review & QA testing for ${query}`,
          description: `Conduct sanity checks, vulnerability scans, and end-to-end user testing.`,
          priority: 'Minimal Priority',
          tags: ['Security', 'QA'],
          dueDate: new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0],
          assignedTo: []
        }
      ];

      setGeneratedTasks(simulated);
      setIsGenerating(false);
    }, 800);
  };

  const handleAddSingleTask = (item: Partial<Task>, index: number) => {
    onAddTask({
      task: item.task,
      description: item.description,
      priority: item.priority || 'Low Priority',
      tags: item.tags || ['AI Generated'],
      dueDate: item.dueDate || new Date().toISOString().split('T')[0],
      assignedTo: item.assignedTo || [],
      status: 'Not started'
    });
    setAddedIds(prev => [...prev, `${index}`]);
  };

  const handleAddAll = () => {
    generatedTasks.forEach((item, index) => {
      if (!addedIds.includes(`${index}`)) {
        handleAddSingleTask(item, index);
      }
    });
  };

  // Generate Daily Standup text
  const doneTasks = tasks.filter(t => t.status === 'Done');
  const inProgTasks = tasks.filter(t => t.status === 'In progress');
  const nextTasks = tasks.filter(t => t.status === 'Not started' && t.priority === 'High Priority');

  const standupReport = `🚀 **Daily Sprint Standup Summary**
📅 *Date: ${new Date().toLocaleDateString()}*

✅ **Completed Items:**
${doneTasks.length > 0 ? doneTasks.map(t => `- ${t.task}`).join('\n') : '- No tasks completed today'}

⚡ **In Progress:**
${inProgTasks.length > 0 ? inProgTasks.map(t => `- ${t.task} (Assigned: ${t.assignedTo.join(', ')})`).join('\n') : '- None'}

🎯 **Next High Priorities:**
${nextTasks.length > 0 ? nextTasks.map(t => `- ${t.task} (Due: ${t.dueDate})`).join('\n') : '- Backlog items ready'}

🔥 *Generated via Pinobite Sprint AI Assistant*`;

  const copyStandup = () => {
    navigator.clipboard.writeText(standupReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center max-sm:items-end justify-center p-0 sm:p-4 animate-overlay-fade">
      <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-2xl max-sm:rounded-b-none max-sm:rounded-t-3xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden max-h-[90vh] animate-popup-in max-sm:animate-mobile-slide-up">
        
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden mt-2.5 mb-1" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-violet-50 dark:from-slate-900 dark:to-indigo-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">AI Sprint Assistant</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Auto-generate ticket breakdowns and instant standup reports</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-white/80 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-5 pt-2 gap-4">
          <button
            onClick={() => setActiveTab('generate')}
            className={`pb-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'generate' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Wrench className="w-4 h-4" />
            Task Generator
          </button>
          <button
            onClick={() => setActiveTab('standup')}
            className={`pb-3 text-xs font-extrabold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              activeTab === 'standup' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            Standup Summary
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'generate' ? (
            <div className="space-y-6">
              
              {/* Input field */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Feature or Epic Topic</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Stripe Payment Gateway, Redis Cache System..."
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                  <button
                    onClick={() => handleGenerate()}
                    disabled={isGenerating || !topic.trim()}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2 shrink-0"
                  >
                    <Sparkles className="w-4 h-4" />
                    {isGenerating ? 'Generating...' : 'Break Down'}
                  </button>
                </div>
              </div>

              {/* Quick Preset Badges */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-400 block">Quick Preset Topics:</span>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => { setTopic(preset); handleGenerate(preset); }}
                      className="text-xs bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-600 font-semibold transition-all cursor-pointer"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generated tasks list */}
              {generatedTasks.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Generated Subtasks ({generatedTasks.length})
                    </span>
                    <button
                      onClick={handleAddAll}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> Add All to Workspace
                    </button>
                  </div>

                  <div className="space-y-3">
                    {generatedTasks.map((item, index) => {
                      const isAdded = addedIds.includes(`${index}`);
                      return (
                        <div 
                          key={index} 
                          className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1">
                            <span className="text-sm font-bold text-slate-900 block">{item.task}</span>
                            <span className="text-xs text-slate-500 block leading-tight">{item.description}</span>
                          </div>
                          <button
                            onClick={() => handleAddSingleTask(item, index)}
                            disabled={isAdded}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all cursor-pointer flex items-center gap-1 ${
                              isAdded 
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                : 'bg-white hover:bg-indigo-600 hover:text-white border border-slate-200 text-slate-700 shadow-xs'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Added
                              </>
                            ) : (
                              'Add Task'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Automated Daily Standup Preview
                </span>
                <button
                  onClick={copyStandup}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy to Clipboard'}
                </button>
              </div>

              <pre className="bg-slate-900 text-slate-100 p-5 rounded-2xl text-xs font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto border border-slate-800">
                {standupReport}
              </pre>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
