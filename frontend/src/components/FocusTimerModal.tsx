import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, X, Clock, CheckCircle } from 'lucide-react';
import { Task } from '../types';

interface FocusTimerModalProps {
  tasks: Task[];
  onClose: () => void;
}

export default function FocusTimerModal({ tasks, onClose }: FocusTimerModalProps) {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || '');
  const [secondsLeft, setSecondsLeft] = useState(25 * 60); // 25 min pomodoro
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft(sec => sec - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setIsActive(false);
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setSecondsLeft(25 * 60);
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const currentTask = tasks.find(t => t.id === selectedTaskId);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center max-sm:items-end justify-center p-0 sm:p-4 animate-overlay-fade">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl max-sm:rounded-b-none max-sm:rounded-t-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-6 text-center relative animate-popup-in max-sm:animate-mobile-slide-up text-slate-900 dark:text-white">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden -mt-2 mb-2" />
        
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto border border-indigo-100">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900">Sprint Focus Timer</h3>
          <p className="text-xs text-slate-500">Track active work sessions on sprint tickets</p>
        </div>

        {/* Task selector */}
        <div className="text-left space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Target Task</label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 outline-none focus:border-indigo-500"
          >
            {tasks.map(t => (
              <option key={t.id} value={t.id}>{t.task}</option>
            ))}
          </select>
        </div>

        {/* Big Display Clock */}
        <div className="bg-slate-900 text-white rounded-2xl py-8 shadow-inner border border-slate-800 space-y-2">
          <div className="text-5xl font-black font-mono tracking-widest text-indigo-400">
            {formattedTime}
          </div>
          <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">
            {isActive ? '⚡ Active Session' : 'Paused / Ready'}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={resetTimer}
            className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
            title="Reset timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={toggleTimer}
            className={`px-8 py-3 rounded-xl font-bold text-sm text-white shadow-lg transition-all cursor-pointer flex items-center gap-2 ${
              isActive 
                ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-200' 
                : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'
            }`}
          >
            {isActive ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span>{isActive ? 'Pause' : 'Start Focus'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
