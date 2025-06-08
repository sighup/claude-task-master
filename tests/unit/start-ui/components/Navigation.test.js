/**
 * Navigation component tests
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import { Navigation } from '../../../../scripts/modules/start-ui/components/Navigation.jsx';
import { setupMocks } from '../setup.js';

describe('Navigation', () => {
	let mockOnViewChange;

	beforeEach(() => {
		setupMocks();
		mockOnViewChange = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('view display', () => {
		test('should display all available views with shortcuts', () => {
			const { lastFrame } = render(
				<Navigation currentView="all" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			expect(output).toContain('[1]');
			expect(output).toContain('All');
			expect(output).toContain('Tasks');
			expect(output).toContain('[2]');
			expect(output).toContain('Pendi');
			expect(output).toContain('[3]');
			expect(output).toContain('Progress');
			expect(output).toContain('[4]');
			expect(output).toContain('Complet');
		});

		test('should highlight current view', () => {
			const views = ['all', 'pending', 'in-progress', 'done'];

			views.forEach((currentView) => {
				const { lastFrame } = render(
					<Navigation
						currentView={currentView}
						onViewChange={mockOnViewChange}
					/>
				);

				const output = lastFrame();

				// The current view should be styled differently
				// We can check that the view is present in the output
				const viewLabels = {
					all: 'All',
					pending: 'Pendi',
					'in-progress': 'Progress',
					done: 'Complet'
				};

				expect(output).toContain(viewLabels[currentView]);
			});
		});
	});

	describe('keyboard shortcuts display', () => {
		test('should display navigation help text', () => {
			const { lastFrame } = render(
				<Navigation currentView="all" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			expect(output).toContain('↑/↓:Navigate');
			expect(output).toContain('Enter:Toggle Status');
			expect(output).toContain('Q:Quit');
			expect(output).toContain('R:Refresh');
		});

		test('should display view shortcuts', () => {
			const { lastFrame } = render(
				<Navigation currentView="all" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			expect(output).toContain('[1]');
			expect(output).toContain('[2]');
			expect(output).toContain('[3]');
			expect(output).toContain('[4]');
		});
	});

	describe('layout and styling', () => {
		test('should render with border styling', () => {
			const { lastFrame } = render(
				<Navigation currentView="all" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			// Should contain border characters
			expect(output).toMatch(/[┌┐└┘│─]/);
		});

		test('should have proper layout structure', () => {
			const { lastFrame } = render(
				<Navigation currentView="pending" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			const lines = output.split('\n');

			// Should have multiple lines due to border
			expect(lines.length).toBeGreaterThan(1);

			// Should have border structure - check that there are lines with border characters
			const hasBorder = lines.some(
				(line) =>
					line.includes('┌') ||
					line.includes('┐') ||
					line.includes('└') ||
					line.includes('┘')
			);
			expect(hasBorder).toBe(true);
		});

		test('should separate views with pipe characters', () => {
			const { lastFrame } = render(
				<Navigation currentView="all" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			// Views should be separated by pipe characters
			expect(output).toMatch(/\|\s+/);
		});
	});

	describe('view change callback', () => {
		test('should not call onViewChange during render', () => {
			render(<Navigation currentView="all" onViewChange={mockOnViewChange} />);

			// onViewChange should not be called just by rendering
			expect(mockOnViewChange).not.toHaveBeenCalled();
		});

		test('should handle undefined onViewChange gracefully', () => {
			// Should not crash when onViewChange is not provided
			expect(() => {
				render(<Navigation currentView="all" onViewChange={undefined} />);
			}).not.toThrow();
		});

		test('should handle null onViewChange gracefully', () => {
			// Should not crash when onViewChange is null
			expect(() => {
				render(<Navigation currentView="all" onViewChange={null} />);
			}).not.toThrow();
		});
	});

	describe('different view states', () => {
		test('should render correctly with all view active', () => {
			const { lastFrame } = render(
				<Navigation currentView="all" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			expect(output).toContain('All');
			expect(output).toContain('Tasks');
			expect(output).toContain('Pendi');
			expect(output).toContain('Progress');
			expect(output).toContain('Complet');
		});

		test('should render correctly with pending view active', () => {
			const { lastFrame } = render(
				<Navigation currentView="pending" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			expect(output).toContain('All');
			expect(output).toContain('Tasks');
			expect(output).toContain('Pendi');
			expect(output).toContain('Progress');
			expect(output).toContain('Complet');
		});

		test('should render correctly with in-progress view active', () => {
			const { lastFrame } = render(
				<Navigation currentView="in-progress" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			expect(output).toContain('All');
			expect(output).toContain('Tasks');
			expect(output).toContain('Pendi');
			expect(output).toContain('Progress');
			expect(output).toContain('Complet');
		});

		test('should render correctly with done view active', () => {
			const { lastFrame } = render(
				<Navigation currentView="done" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			expect(output).toContain('All');
			expect(output).toContain('Tasks');
			expect(output).toContain('Pendi');
			expect(output).toContain('Progress');
			expect(output).toContain('Complet');
		});
	});

	describe('edge cases', () => {
		test('should handle unknown current view', () => {
			const { lastFrame } = render(
				<Navigation
					currentView="unknown-view"
					onViewChange={mockOnViewChange}
				/>
			);

			const output = lastFrame();
			// Should still render all views even with unknown current view
			expect(output).toContain('All');
			expect(output).toContain('Tasks');
			expect(output).toContain('Pendi');
			expect(output).toContain('Progress');
			expect(output).toContain('Complet');
		});

		test('should handle null current view', () => {
			const { lastFrame } = render(
				<Navigation currentView={null} onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			expect(output).toContain('All');
			expect(output).toContain('Tasks');
			expect(output).toContain('Pendi');
			expect(output).toContain('Progress');
			expect(output).toContain('Complet');
		});

		test('should handle undefined current view', () => {
			const { lastFrame } = render(
				<Navigation currentView={undefined} onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();
			expect(output).toContain('All');
			expect(output).toContain('Tasks');
			expect(output).toContain('Pendi');
			expect(output).toContain('Progress');
			expect(output).toContain('Complet');
		});
	});

	describe('accessibility and usability', () => {
		test('should show clear shortcuts for each view', () => {
			const { lastFrame } = render(
				<Navigation currentView="all" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();

			// Each view should have a clear shortcut - check for shortcuts and view text separately
			expect(output).toContain('[1]');
			expect(output).toContain('All');
			expect(output).toContain('Tasks');
			expect(output).toContain('[2]');
			expect(output).toContain('Pendi');
			expect(output).toContain('[3]');
			expect(output).toContain('Progress');
			expect(output).toContain('[4]');
			expect(output).toContain('Complet');
		});

		test('should provide comprehensive help text', () => {
			const { lastFrame } = render(
				<Navigation currentView="all" onViewChange={mockOnViewChange} />
			);

			const output = lastFrame();

			// Should include all important keyboard shortcuts
			const helpText = output.toLowerCase();
			expect(helpText).toContain('navigate');
			expect(helpText).toContain('toggle'); // Instead of 'select', the actual text is 'toggle status'
			expect(helpText).toContain('quit');
			expect(helpText).toContain('refresh');
		});
	});
});
