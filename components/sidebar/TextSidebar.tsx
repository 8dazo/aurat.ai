'use client';

import React from 'react';
import { SidebarHeader, SidebarContent } from '@/components/ui/sidebar';
import { Type } from 'lucide-react';

export const TextSidebar = () => {
    return (
        <div className="flex flex-col h-full bg-sidebar">
            <SidebarHeader className="border-b border-sidebar-border p-4">
                <h4 className="text-sm font-semibold">Text</h4>
            </SidebarHeader>
            <SidebarContent className="p-6 flex flex-col items-center justify-center text-center text-muted-foreground space-y-4">
                <Type className="w-12 h-12 opacity-20" />
                <p className="text-xs">Text presets and styles coming soon.</p>
            </SidebarContent>
        </div>
    );
};
