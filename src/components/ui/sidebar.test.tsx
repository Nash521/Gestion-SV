import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { SidebarProvider, Sidebar, SidebarTrigger } from './sidebar';

// Mock ResizeObserver which is used in some Shadcn components or dependencies
global.ResizeObserver = class ResizeObserver {
    observe() { }
    unobserve() { }
    disconnect() { }
};

describe('Sidebar Integration', () => {
    // Helper to setup the test
    const SetupSidebar = () => {
        return (
            <SidebarProvider defaultOpen={true}>
                <Sidebar>
                    <div>Sidebar Content</div>
                </Sidebar>
                <SidebarTrigger />
            </SidebarProvider>
        );
    };

    it('renders sidebar expanded by default', () => {
        render(<SetupSidebar />);
        // The sidebar container usually has data-state="expanded"
        // We look for the sidebar via text first to find the element
        const sidebarContent = screen.getByText('Sidebar Content').closest('div[data-state="expanded"]');
        expect(sidebarContent).toBeInTheDocument();
    });

    it('toggles sidebar state when trigger is clicked', () => {
        render(<SetupSidebar />);

        const trigger = screen.getByRole('button', { name: /toggle sidebar/i });
        const sidebar = screen.getByText('Sidebar Content').closest('div[data-state]');

        // Initial state
        expect(sidebar).toHaveAttribute('data-state', 'expanded');

        // Click to collapse
        fireEvent.click(trigger);
        expect(sidebar).toHaveAttribute('data-state', 'collapsed');

        // Click to expand
        fireEvent.click(trigger);
        expect(sidebar).toHaveAttribute('data-state', 'expanded');
    });
});
