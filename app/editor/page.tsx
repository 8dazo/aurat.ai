'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useTimelineStore } from '@/store/useTimelineStore';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/sidebar/AppSidebar';
import { ExportButton } from '@/components/ExportButton';

const PreviewCanvas = dynamic(() => import('@/components/PreviewCanvas').then(mod => mod.PreviewCanvas), { ssr: false });
const Timeline = dynamic(() => import('@/components/Timeline').then(mod => mod.Timeline), { ssr: false });
const UploadZone = dynamic(() => import('@/components/UploadZone').then(mod => mod.UploadZone), { ssr: false });

export default function EditorPage() {
    const clips = useTimelineStore((state) => state.clips);

    return (
        <SidebarProvider defaultOpen={true}>
            <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
                <AppSidebar />

                <SidebarInset className="flex flex-col flex-1 overflow-hidden">
                    {/* Toolbar / Action Area */}
                    <div className="flex items-center justify-between px-6 py-3 border-b border-sidebar-border bg-sidebar/50 backdrop-blur-sm z-10">
                        <div className="flex items-center gap-4">
                            <span className="text-sm font-semibold tracking-tight">Aurat.ai</span>
                            <div className="h-4 w-px bg-sidebar-border" />
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-500" />
                                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Local Engine Active</span>
                            </div>
                        </div>
                        <ExportButton />
                    </div>

                    {/* Editor Workspace */}
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-muted/10">
                        {clips.length > 0 ? (
                            <div className="flex-1 min-h-0 p-8 flex items-center justify-center">
                                <div className="w-full h-full max-w-5xl max-h-full">
                                    <PreviewCanvas />
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-8">
                                <div className="w-full max-w-lg space-y-8 text-center">
                                    <div className="space-y-4">
                                        <h2 className="text-4xl font-bold tracking-tight">
                                            Create something extraordinary.
                                        </h2>
                                        <p className="text-muted-foreground text-lg">
                                            Start by uploading your media clips below. Everything stays in your browser.
                                        </p>
                                    </div>
                                    <UploadZone />
                                </div>
                            </div>
                        )}

                        {clips.length > 0 && <Timeline />}
                    </div>
                </SidebarInset>
            </div>
        </SidebarProvider>
    );
}
