import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
    it('renders correctly with text', () => {
        render(<Button>Click me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
    });

    it('applies variant class', () => {
        render(<Button variant="destructive">Delete</Button>);
        const button = screen.getByRole('button', { name: /delete/i });
        // Check if the class is applied (simplistic check, depends on implementation details but good enough for now)
        expect(button.className).toContain('bg-destructive');
    });
});
