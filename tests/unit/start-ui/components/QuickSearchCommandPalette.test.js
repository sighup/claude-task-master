/**
 * QuickSearchCommandPalette component tests
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import { Box } from 'ink';
import { QuickSearchCommandPalette } from '../../../../scripts/modules/start-ui/components/QuickSearchCommandPalette.jsx';
import { setupMocks } from '../setup.js';

describe.skip('QuickSearchCommandPalette', () => {
	let mockOnExecute;
	let mockOnClose;

	beforeEach(() => {
		setupMocks();
		mockOnExecute = jest.fn();
		mockOnClose = jest.fn();
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	describe('rendering', () => {
		test('should not render when not active', () => {
			const { lastFrame } = render(
				<QuickSearchCommandPalette
					isActive={false}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
				/>
			);

			// Should render nothing when not active
			expect(lastFrame()).toBe('');
		});

		test('should render command palette when active', () => {
			const { lastFrame } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
				/>
			);

			const output = lastFrame();
			// Should show command input
			expect(output).toContain('/');
			expect(output).toContain('Type to search commands...');
		});

		test('should render search palette in search mode', () => {
			const { lastFrame } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="search"
					tasks={[
						{ id: 1, title: 'Test task 1' },
						{ id: 2, title: 'Test task 2' }
					]}
				/>
			);

			const output = lastFrame();
			// Should show search input
			expect(output).toContain('?');
			expect(output).toContain('Search tasks...');
		});
	});

	describe('command filtering', () => {
		test('should show all commands initially', () => {
			const { lastFrame } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
				/>
			);

			const output = lastFrame();
			// Should show various commands
			expect(output).toContain('add-task');
			expect(output).toContain('show-task');
			expect(output).toContain('refresh');
		});

		test('should filter commands based on input', () => {
			const { lastFrame, stdin } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
				/>
			);

			// Type 'add' to filter
			stdin.write('add');

			const output = lastFrame();
			// Should show add-related commands
			expect(output).toContain('add-task');
			expect(output).toContain('add-subtask');
			// Should not show unrelated commands
			expect(output).not.toContain('show-task');
		});

		test('should filter by aliases', () => {
			const { lastFrame, stdin } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
				/>
			);

			// Type 'a' (alias for add-task)
			stdin.write('a');

			const output = lastFrame();
			// Should show add-task (has 'a' as alias)
			expect(output).toContain('add-task');
		});
	});

	describe('task search', () => {
		const mockTasks = [
			{ id: 1, title: 'Implement authentication', description: 'Add user login' },
			{ id: 2, title: 'Fix navigation bug', description: 'Menu not working' },
			{ id: 3, title: 'Update documentation', description: 'API docs' }
		];

		test('should show all tasks in search mode', () => {
			const { lastFrame } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="search"
					tasks={mockTasks}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('Implement authentication');
			expect(output).toContain('Fix navigation bug');
			expect(output).toContain('Update documentation');
		});

		test('should filter tasks by title', () => {
			const { lastFrame, stdin } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="search"
					tasks={mockTasks}
				/>
			);

			// Search for 'nav'
			stdin.write('nav');

			const output = lastFrame();
			expect(output).toContain('Fix navigation bug');
			expect(output).not.toContain('Implement authentication');
		});

		test('should filter tasks by description', () => {
			const { lastFrame, stdin } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="search"
					tasks={mockTasks}
				/>
			);

			// Search for 'API'
			stdin.write('API');

			const output = lastFrame();
			expect(output).toContain('Update documentation');
			expect(output).not.toContain('Fix navigation bug');
		});
	});

	describe('keyboard interactions', () => {
		test('should close on ESC', () => {
			const { stdin } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
				/>
			);

			// Press ESC
			stdin.write('\u001B');

			expect(mockOnClose).toHaveBeenCalled();
		});

		test('should execute command on Enter', () => {
			const { stdin } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
				/>
			);

			// Type command
			stdin.write('add-task');
			// Press Enter
			stdin.write('\r');

			expect(mockOnExecute).toHaveBeenCalledWith('add-task', 'command');
		});

		test('should navigate to task on Enter in search mode', () => {
			const { stdin } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="search"
					tasks={[{ id: 1, title: 'Test task' }]}
				/>
			);

			// Select first result and press Enter
			stdin.write('\r');

			expect(mockOnExecute).toHaveBeenCalledWith('go-to-task', 'search', { taskId: 1 });
		});
	});

	describe('context handling', () => {
		test('should disable commands requiring selection when no task selected', () => {
			const { lastFrame } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
					context={{
						selectedTask: null
					}}
				/>
			);

			const output = lastFrame();
			// Should show update-task but as disabled
			expect(output).toContain('update-task');
			expect(output).toContain('(disabled)');
		});

		test('should enable commands when task is selected', () => {
			const { lastFrame } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
					context={{
						selectedTask: { id: 1, title: 'Test' }
					}}
				/>
			);

			const output = lastFrame();
			// Should show update-task as enabled
			expect(output).toContain('update-task');
			expect(output).not.toContain('(disabled)');
		});
	});

	describe('edge cases', () => {
		test('should handle empty tasks list', () => {
			const { lastFrame } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="search"
					tasks={[]}
				/>
			);

			const output = lastFrame();
			expect(output).toContain('No tasks found');
		});

		test('should handle undefined callbacks gracefully', () => {
			expect(() => {
				render(
					<QuickSearchCommandPalette
						isActive={true}
						onExecute={undefined}
						onClose={undefined}
						mode="command"
					/>
				);
			}).not.toThrow();
		});

		test('should show suggestions counter when onSuggestionsChange provided', () => {
			const mockOnSuggestionsChange = jest.fn();
			
			const { lastFrame } = render(
				<QuickSearchCommandPalette
					isActive={true}
					onExecute={mockOnExecute}
					onClose={mockOnClose}
					mode="command"
					onSuggestionsChange={mockOnSuggestionsChange}
				/>
			);

			// Should call with initial suggestions count
			expect(mockOnSuggestionsChange).toHaveBeenCalled();
		});
	});
});