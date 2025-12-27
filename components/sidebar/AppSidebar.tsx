'use client';

import * as React from 'react';
import {
    Settings2,
    Layout,
    Type,
    Search,
    Plus,
    ChevronLeft,
    ZoomIn
} from 'lucide-react';

import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/redux/store';
import { setActiveTab } from '@/store/redux/slices/sidebarSlice';

import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { PropertiesSidebar } from './PropertiesSidebar';
import { FramesSidebar } from './FramesSidebar';
import { TextSidebar } from './TextSidebar';
import { ZoomSidebar } from './ZoomSidebar';
import { cn } from '@/lib/utils';


const navItems = [
    { id: 'properties', icon: Settings2, label: 'Properties' },
    { id: 'frames', icon: Layout, label: 'Frames' },
    { id: 'text', icon: Type, label: 'Text' },
    { id: 'zoom', icon: ZoomIn, label: 'Zoom' },
];


export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const dispatch = useDispatch();
    const activeTab = useSelector((state: RootState) => state.sidebar.activeTab);
    const { setOpen } = useSidebar();

    const ActiveComponent = React.useMemo(() => {
        switch (activeTab) {
            case 'properties':
                return PropertiesSidebar;
            case 'frames':
                return FramesSidebar;
            case 'text':
                return TextSidebar;
            case 'zoom':
                return ZoomSidebar;
            default:

                return PropertiesSidebar;
        }
    }, [activeTab]);

    return (
        <Sidebar
            collapsible="none"
            className="!w-[calc(var(--sidebar-width-icon)+var(--sidebar-width))] border-r-0"
            {...props}
        >
            <div className="flex h-full w-full overflow-hidden">
                {/* Main Nav (Narrow) */}
                <div className="flex w-[--sidebar-width-icon] flex-col border-r border-sidebar-border bg-sidebar h-full py-4 items-center justify-between gap-4 shrink-0">
                    <div className="flex flex-col items-center gap-4 w-full">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground mb-4">
                            <Plus className="w-5 h-5" />
                        </div>

                        <nav className="flex flex-col gap-2 w-full items-center">
                            {navItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => dispatch(setActiveTab(item.id))}
                                    className={cn(
                                        "p-2 rounded-lg transition-colors group relative",
                                        activeTab === item.id
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                    title={item.label}
                                >
                                    <item.icon className="w-5 h-5" />
                                    {activeTab === item.id && (
                                        <div className="absolute left-[-4px] top-1/2 -translate-y-1/2 w-1 h-6 bg-primary rounded-r-full" />
                                    )}
                                </button>
                            ))}
                        </nav>
                    </div>

                    {/* Bottom Separator and maybe more items later */}
                    <div className="w-full px-3">
                        <div className="h-px bg-sidebar-border w-full mb-4" />
                        <button className="p-2 w-full flex justify-center text-muted-foreground hover:text-foreground transition-colors">
                            <Settings2 className="w-5 h-5 opacity-50" />
                        </button>
                    </div>
                </div>

                {/* Nested Content (Wide) */}
                <div className="flex-1 min-w-0 flex flex-col h-full border-r border-sidebar-border bg-sidebar overflow-hidden">
                    <ActiveComponent />
                </div>
            </div>
        </Sidebar>
    );
}
