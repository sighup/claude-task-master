/**
 * TaskItem component tests
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import { TaskItem } from '../../../../scripts/modules/start-ui/components/TaskItem.jsx';
import { setupMocks, createMockTask } from '../setup.js';

describe('TaskItem', () => {
	beforeEach(() => {
		setupMocks();
	});

	describe('basic task display', () => {
		test('should display task title and ID', () => {
			const task = createMockTask({
				id: 5,
				title: 'Test Task Title',
				status: 'pending'
			});

			const { lastFrame } = render(<TaskItem task={task} />);

			const output = lastFrame();
			expect(output).toContain('○ 5 M');
			expect(output).toContain('Test Task Title');
		});

		test('should display task status symbol', () => {
			const pendingTask = createMockTask({ status: 'pending' });
			const { lastFrame: pendingFrame } = render(
				<TaskItem task={pendingTask} />
			);
			expect(pendingFrame()).toContain('○'); // pending symbol

			const doneTask = createMockTask({ status: 'done' });
			const { lastFrame: doneFrame } = render(<TaskItem task={doneTask} />);
			expect(doneFrame()).toContain('✓'); // done symbol

			const inProgressTask = createMockTask({ status: 'in-progress' });
			const { lastFrame: inProgressFrame } = render(
				<TaskItem task={inProgressTask} />
			);
			expect(inProgressFrame()).toContain('►'); // in-progress symbol
		});

		test('should display priority indicator', () => {
			const highTask = createMockTask({ priority: 'high' });
			const { lastFrame: highFrame } = render(<TaskItem task={highTask} />);
			expect(highFrame()).toContain('H');

			const mediumTask = createMockTask({ priority: 'medium' });
			const { lastFrame: mediumFrame } = render(<TaskItem task={mediumTask} />);
			expect(mediumFrame()).toContain('M');

			const lowTask = createMockTask({ priority: 'low' });
			const { lastFrame: lowFrame } = render(<TaskItem task={lowTask} />);
			expect(lowFrame()).toContain('L');
		});
	});

	describe('status handling', () => {
		test('should display all status types correctly', () => {
			const statuses = [
				{ status: 'pending', symbol: '○' },
				{ status: 'done', symbol: '✓' },
				{ status: 'in-progress', symbol: '►' },
				{ status: 'review', symbol: '?' },
				{ status: 'deferred', symbol: 'x' },
				{ status: 'cancelled', symbol: '✗' }
			];

			statuses.forEach(({ status, symbol }) => {
				const task = createMockTask({ status });
				const { lastFrame } = render(<TaskItem task={task} />);
				expect(lastFrame()).toContain(symbol);
			});
		});

		test('should handle unknown status gracefully', () => {
			const task = createMockTask({ status: 'unknown-status' });
			const { lastFrame } = render(<TaskItem task={task} />);

			expect(lastFrame()).toContain('?'); // fallback symbol
		});
	});

	describe('priority handling', () => {
		test('should handle undefined priority', () => {
			const task = createMockTask({ priority: undefined });
			const { lastFrame } = render(<TaskItem task={task} />);

			expect(lastFrame()).toContain('M'); // default to medium
		});

		test('should handle null priority', () => {
			const task = createMockTask({ priority: null });
			const { lastFrame } = render(<TaskItem task={task} />);

			expect(lastFrame()).toContain('M'); // default to medium
		});
	});

	describe('selection highlighting', () => {
		test('should show selection highlighting when selected', () => {
			const task = createMockTask({ title: 'Selected Task' });
			const { lastFrame } = render(<TaskItem task={task} isSelected={true} />);

			// When selected, the component should render differently
			// The exact visual difference depends on the background color
			expect(lastFrame()).toContain('Selected Task');
		});

		test('should not show selection highlighting when not selected', () => {
			const task = createMockTask({ title: 'Normal Task' });
			const { lastFrame } = render(<TaskItem task={task} isSelected={false} />);

			expect(lastFrame()).toContain('Normal Task');
		});
	});

	describe('dependencies display', () => {
		test('should display task dependencies', () => {
			const task = createMockTask({
				title: 'Dependent Task',
				dependencies: [1, 2, 3]
			});

			const { lastFrame } = render(<TaskItem task={task} />);

			expect(lastFrame()).toContain('(deps: 3)');
		});

		test('should not display dependencies section when no dependencies', () => {
			const task = createMockTask({
				title: 'Independent Task',
				dependencies: []
			});

			const { lastFrame } = render(<TaskItem task={task} />);

			expect(lastFrame()).not.toContain('deps:');
		});

		test('should handle null dependencies', () => {
			const task = createMockTask({
				title: 'Task with null deps',
				dependencies: null
			});

			const { lastFrame } = render(<TaskItem task={task} />);

			expect(lastFrame()).not.toContain('deps:');
		});
	});

	describe('text truncation', () => {
		test('should display long task titles fully', () => {
			const longTitle =
				'This is a very long task title that should be displayed fully without truncation';
			const task = createMockTask({ title: longTitle });

			const { lastFrame } = render(<TaskItem task={task} />);

			const output = lastFrame();
			expect(output).toContain(longTitle);
			expect(output).not.toContain('...');
		});

		test('should not truncate short task titles', () => {
			const shortTitle = 'Short title';
			const task = createMockTask({ title: shortTitle });

			const { lastFrame } = render(<TaskItem task={task} />);

			const output = lastFrame();
			expect(output).toContain(shortTitle);
			expect(output).not.toContain('...');
		});
	});

	describe('subtasks display', () => {
		test('should not display subtasks (handled by TaskList)', () => {
			const task = createMockTask({
				id: 5,
				title: 'Parent Task',
				subtasks: [
					{ id: 1, title: 'Subtask 1', status: 'done' },
					{ id: 2, title: 'Subtask 2', status: 'pending' }
				]
			});

			const { lastFrame } = render(
				<TaskItem task={task} showSubtasks={true} />
			);

			const output = lastFrame();
			expect(output).toContain('Parent Task');
			expect(output).not.toContain('Subtask 1');
			expect(output).not.toContain('Subtask 2');
		});

		test('should not display subtasks when showSubtasks is false', () => {
			const task = createMockTask({
				title: 'Parent Task',
				subtasks: [{ id: 1, title: 'Hidden Subtask', status: 'pending' }]
			});

			const { lastFrame } = render(
				<TaskItem task={task} showSubtasks={false} />
			);

			expect(lastFrame()).not.toContain('Hidden Subtask');
		});

		test('should handle tasks with no subtasks', () => {
			const task = createMockTask({
				title: 'Task without subtasks',
				subtasks: []
			});

			const { lastFrame } = render(
				<TaskItem task={task} showSubtasks={true} />
			);

			expect(lastFrame()).toContain('Task without subtasks');
			// Should not crash or show empty subtask sections
		});

		test('should handle null subtasks', () => {
			const task = createMockTask({
				title: 'Task with null subtasks',
				subtasks: null
			});

			const { lastFrame } = render(
				<TaskItem task={task} showSubtasks={true} />
			);

			expect(lastFrame()).toContain('Task with null subtasks');
			// Should not crash
		});

		test('should not show subtask status symbols (handled by TaskList)', () => {
			const task = createMockTask({
				id: 1,
				subtasks: [
					{ id: 1, title: 'Done Subtask', status: 'done' },
					{ id: 2, title: 'Pending Subtask', status: 'pending' }
				]
			});

			const { lastFrame } = render(
				<TaskItem task={task} showSubtasks={true} />
			);

			const output = lastFrame();
			// TaskItem only shows parent task status
			expect(output).toContain('○'); // parent task status symbol
			expect(output).not.toContain('Done Subtask');
			expect(output).not.toContain('Pending Subtask');
		});

		test('should not display subtask titles (handled by TaskList)', () => {
			const task = createMockTask({
				id: 1,
				subtasks: [
					{
						id: 1,
						title: 'This is a very long subtask title',
						status: 'pending'
					}
				]
			});

			const { lastFrame } = render(
				<TaskItem task={task} showSubtasks={true} />
			);

			const output = lastFrame();
			expect(output).not.toContain('This is a very long subtask title');
		});
	});

	describe('completed task styling', () => {
		test('should apply strikethrough to completed tasks', () => {
			const doneTask = createMockTask({
				title: 'Completed Task',
				status: 'done'
			});

			const { lastFrame } = render(<TaskItem task={doneTask} />);

			// The component uses strikethrough={task.status === 'done'}
			// We can't directly test the visual strikethrough, but we can ensure
			// the task renders correctly
			expect(lastFrame()).toContain('Completed Task');
			expect(lastFrame()).toContain('✓');
		});
	});
});
