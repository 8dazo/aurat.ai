import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface SidebarState {
    activeTab: string;
    isOpen: boolean;
}

const initialState: SidebarState = {
    activeTab: 'properties',
    isOpen: true,
};

const sidebarSlice = createSlice({
    name: 'sidebar',
    initialState,
    reducers: {
        setActiveTab: (state, action: PayloadAction<string>) => {
            state.activeTab = action.payload;
        },
        toggleSidebar: (state) => {
            state.isOpen = !state.isOpen;
        },
        setSidebarOpen: (state, action: PayloadAction<boolean>) => {
            state.isOpen = action.payload;
        },
    },
});

export const { setActiveTab, toggleSidebar, setSidebarOpen } = sidebarSlice.actions;
export default sidebarSlice.reducer;
