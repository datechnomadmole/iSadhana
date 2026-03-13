import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  Plus, 
  Trash2, 
  GripVertical, 
  Code, 
  Layout, 
  Music, 
  Clock, 
  Upload,
  Volume2,
  AlertCircle
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import { ScriptItem, AudioFile, ScriptItemType } from './types';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Components ---

interface SortableItemProps {
  item: ScriptItem;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ScriptItem>) => void;
}

const SortableScriptItem = ({ item, onDelete, onUpdate }: SortableItemProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group flex items-center gap-3 p-3 bg-white border border-zinc-200 rounded-xl shadow-sm mb-2 transition-all",
        isDragging && "shadow-lg ring-2 ring-zinc-900 opacity-50",
        item.type === 'audio' ? "border-l-4 border-l-emerald-500" : "border-l-4 border-l-amber-500"
      )}
    >
      <button 
        {...attributes} 
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-zinc-600"
      >
        <GripVertical size={18} />
      </button>

      <div className="flex-1 flex items-center gap-3">
        {item.type === 'audio' ? (
          <>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Music size={16} />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-zinc-900">{item.fileName || 'Select file...'}</span>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold">Audio Clip</span>
            </div>
          </>
        ) : (
          <>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock size={16} />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={item.duration || 0}
                  onChange={(e) => onUpdate(item.id, { duration: parseFloat(e.target.value) || 0 })}
                  className="w-16 px-2 py-1 text-sm border border-zinc-200 rounded-md focus:outline-none focus:ring-1 focus:ring-zinc-900"
                  step="0.1"
                  min="0"
                />
                <span className="text-sm text-zinc-600">seconds</span>
              </div>
              <span className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold mt-1">Pause</span>
            </div>
          </>
        )}
      </div>

      <button 
        onClick={() => onDelete(item.id)}
        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [script, setScript] = useState<ScriptItem[]>([
    { id: '1', type: 'audio', fileName: 'intro.mp3' },
    { id: '2', type: 'pause', duration: 2.5 },
    { id: '3', type: 'audio', fileName: 'outro.mp3' },
  ]);
  const [library, setLibrary] = useState<AudioFile[]>([]);
  const [activeTab, setActiveTab] = useState<'visual' | 'code'>('visual');
  const [jsonCode, setJsonCode] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync JSON when switching to code tab
  useEffect(() => {
    if (activeTab === 'code') {
      setJsonCode(JSON.stringify(script, null, 2));
    }
  }, [activeTab, script]);

  // DND Sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setScript((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addItem = (type: ScriptItemType) => {
    const newItem: ScriptItem = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      ...(type === 'audio' ? { fileName: '' } : { duration: 1.0 })
    };
    setScript([...script, newItem]);
  };

  const deleteItem = (id: string) => {
    setScript(script.filter(item => item.id !== id));
  };

  const updateItem = (id: string, updates: Partial<ScriptItem>) => {
    setScript(script.map(item => item.id === id ? { ...item, ...updates } : item));
  };

  const handleJsonChange = (value: string) => {
    setJsonCode(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setScript(parsed);
      }
    } catch (e) {
      // Invalid JSON, silently ignore until valid
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newFiles: AudioFile[] = [];
    Array.from(files as FileList).forEach((file: File) => {
      const url = URL.createObjectURL(file);
      newFiles.push({ name: file.name, url });
    });

    setLibrary(prev => [...prev, ...newFiles]);
  };

  // --- Playback Logic ---

  const stopPlayback = useCallback(() => {
    setIsPlaying(false);
    setCurrentIndex(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const playItem = useCallback(async (index: number) => {
    if (index >= script.length) {
      stopPlayback();
      return;
    }

    setCurrentIndex(index);
    const item = script[index];

    if (item.type === 'audio') {
      const file = library.find(f => f.name === item.fileName);
      if (file && audioRef.current) {
        audioRef.current.src = file.url;
        audioRef.current.play();
        audioRef.current.onended = () => playItem(index + 1);
      } else {
        // Skip if file not found or just wait a tiny bit to show progress
        timeoutRef.current = setTimeout(() => playItem(index + 1), 500);
      }
    } else {
      // Pause
      const duration = (item.duration || 0) * 1000;
      timeoutRef.current = setTimeout(() => {
        playItem(index + 1);
      }, duration);
    }
  }, [script, library, stopPlayback]);

  const startPlayback = () => {
    if (script.length === 0) return;
    setIsPlaying(true);
    playItem(0);
  };

  return (
    <div className="flex h-screen bg-zinc-50 font-sans text-zinc-900 overflow-hidden">
      {/* Sidebar - Library */}
      <aside className="w-72 border-r border-zinc-200 bg-white flex flex-col">
        <div className="p-6 border-b border-zinc-100">
          <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">Audio Library</h2>
          <label className="flex items-center justify-center gap-2 w-full p-3 border-2 border-dashed border-zinc-200 rounded-xl cursor-pointer hover:border-zinc-400 hover:bg-zinc-50 transition-all group">
            <Upload size={18} className="text-zinc-400 group-hover:text-zinc-600" />
            <span className="text-sm font-medium text-zinc-600">Import Audio</span>
            <input type="file" multiple accept="audio/*" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {library.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-center px-4">
              <Music size={32} className="text-zinc-200 mb-2" />
              <p className="text-xs text-zinc-400">No audio files imported yet. Add some MP3s to get started.</p>
            </div>
          ) : (
            <div className="space-y-1 mt-4">
              {library.map((file, idx) => (
                <div 
                  key={idx} 
                  className="group flex items-center justify-between p-2 hover:bg-zinc-50 rounded-lg cursor-default transition-colors"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Volume2 size={14} className="text-zinc-400 shrink-0" />
                    <span className="text-sm truncate text-zinc-700">{file.name}</span>
                  </div>
                  <button 
                    onClick={() => {
                      const emptyIdx = script.findIndex(i => i.type === 'audio' && !i.fileName);
                      if (emptyIdx !== -1) {
                        updateItem(script[emptyIdx].id, { fileName: file.name });
                      } else {
                        const id = Math.random().toString(36).substr(2, 9);
                        setScript([...script, { id, type: 'audio', fileName: file.name }]);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-emerald-600 hover:bg-emerald-50 rounded transition-all"
                    title="Add to script"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-zinc-900 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Status</span>
              <span className="text-sm font-medium">{isPlaying ? 'Playing Script...' : 'Engine Ready'}</span>
            </div>
            <div className="flex gap-2">
              {isPlaying ? (
                <button 
                  onClick={stopPlayback}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                >
                  <Square size={18} fill="currentColor" />
                </button>
              ) : (
                <button 
                  onClick={startPlayback}
                  disabled={script.length === 0}
                  className="p-2 bg-emerald-500 hover:bg-emerald-600 rounded-full transition-colors disabled:opacity-50"
                >
                  <Play size={18} fill="currentColor" />
                </button>
              )}
            </div>
          </div>
          {isPlaying && (
            <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{ width: `${((currentIndex || 0) / script.length) * 100}%` }}
              />
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {/* Header / Tabs */}
        <header className="h-16 border-b border-zinc-200 bg-white flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-6">
            <h1 className="text-lg font-bold tracking-tight">Script Architect</h1>
            <nav className="flex bg-zinc-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('visual')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === 'visual' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Layout size={16} />
                Visual
              </button>
              <button
                onClick={() => setActiveTab('code')}
                className={cn(
                  "flex items-center gap-2 px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                  activeTab === 'code' ? "bg-white shadow-sm text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
                )}
              >
                <Code size={16} />
                Code
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={() => addItem('audio')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-all"
            >
              <Plus size={16} />
              Add Audio
            </button>
            <button 
              onClick={() => addItem('pause')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-zinc-200 text-sm font-medium rounded-xl hover:bg-zinc-50 transition-all"
            >
              <Clock size={16} />
              Add Pause
            </button>
          </div>
        </header>

        {/* Editor Area */}
        <div className="flex-1 overflow-hidden relative">
          {activeTab === 'visual' ? (
            <div className="h-full overflow-y-auto p-8 max-w-3xl mx-auto">
              {script.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 border-2 border-dashed border-zinc-200 rounded-3xl text-zinc-400">
                  <Layout size={48} className="mb-4 opacity-20" />
                  <p>Your script is empty. Add items to start building.</p>
                </div>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={script.map(i => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {script.map((item, idx) => (
                      <div key={item.id} className={cn(
                        "relative",
                        currentIndex === idx && isPlaying && "ring-2 ring-emerald-500 ring-offset-4 rounded-xl"
                      )}>
                        <SortableScriptItem
                          item={item}
                          onDelete={deleteItem}
                          onUpdate={updateItem}
                        />
                      </div>
                    ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          ) : (
            <div className="h-full bg-zinc-900">
              <CodeMirror
                value={jsonCode}
                height="100%"
                theme="dark"
                extensions={[json()]}
                onChange={handleJsonChange}
                className="text-sm"
              />
            </div>
          )}
        </div>
      </main>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}
