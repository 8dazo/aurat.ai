'use client';

import React from 'react';
import { SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { Layout } from 'lucide-react';

export const FramesSidebar = () => {
    return (
        <div className="flex flex-col h-full bg-sidebar">
            <SidebarHeader className="border-b border-sidebar-border p-4">
                <h4 className="text-sm font-semibold">Frames</h4>
            </SidebarHeader>
            <SidebarContent className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
                <Layout className="w-12 h-12 opacity-20" />
                <p className="text-xs">Frame management coming soon.</p>
            </SidebarContent>
        </div>
    );
};
