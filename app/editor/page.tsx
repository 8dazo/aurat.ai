'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useTimelineStore } from '@/store/useTimelineStore';
import { Github, Settings2, Sparkles } from 'lucide-react';

const PreviewCanvas = dynamic(() => import('@/components/PreviewCanvas').then(mod => mod.PreviewCanvas), { ssr: false });
const Timeline = dynamic(() => import('@/components/Timeline').then(mod => mod.Timeline), { ssr: false });
const UploadZone = dynamic(() => import('@/components/UploadZone').then(mod => mod.UploadZone), { ssr: false });
const ExportButton = dynamic(() => import('@/components/ExportButton').then(mod => mod.ExportButton), { ssr: false });
const PropertiesPanel = dynamic(() => import('@/components/PropertiesPanel').then(mod => mod.PropertiesPanel), { ssr: false });



export default function EditorPage() {
    const clips = useTimelineStore((state) => state.clips);

    return (
        <main className="min-h-screen bg-[#0a0a0c] text-white selection:bg-indigo-500/30">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative flex flex-col h-screen overflow-hidden border border-white/5">
                {/* Header */}
                <header className="flex items-center justify-between px-6 py-4 bg-white/5 backdrop-blur-xl border-b border-white/10 z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold tracking-tight">Aurat.ai</h1>
                            <p className="text-[10px] text-white/40 uppercase tracking-widest font-semibold font-mono">
                                Professional Video Suite
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center bg-white/5 rounded-full px-4 py-1.5 border border-white/10">
                            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2" />
                            <span className="text-xs font-medium text-white/60">Local Engine Active</span>
                        </div>
                        <ExportButton />
                    </div>
                </header>

                {/* Workspace */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Main Area */}
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                        {clips.length > 0 ? (
                            <div className="flex-1 p-8 overflow-auto flex items-center justify-center">
                                <PreviewCanvas />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                <div className="w-full max-w-lg space-y-8 text-center">
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-b from-white to-white/60 bg-clip-text text-transparent">
                                            Create something extraordinary.
                                        </h2>
                                        <p className="text-white/40 text-lg">
                                            Start by uploading your media clips below. Everything stays in your browser.
                                        </p>
                                    </div>
                                    <UploadZone />
                                </div>
                            </div>
                        )}

                        {clips.length > 0 && <Timeline />}
                    </div>

                    {/* Right Sidebar - Properties/Settings */}
                    <aside className="w-72 bg-white/5 backdrop-blur-md border-l border-white/10 hidden lg:flex flex-col">
                        <div className="p-4 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Properties</h3>
                            <Settings2 className="w-4 h-4 text-white/40" />
                        </div>
                        <PropertiesPanel />
                        <div className="p-4 mt-auto border-t border-white/10">
                            <a
                                href="#"
                                className="flex items-center gap-2 text-xs text-white/40 hover:text-white/80 transition-colors"
                            >
                                <Github className="w-4 h-4" />
                                <span>View Source</span>
                            </a>
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}
