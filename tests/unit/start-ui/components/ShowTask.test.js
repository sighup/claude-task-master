/**
 * ShowTask component tests
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import { ShowTask } from '../../../../scripts/modules/start-ui/components/ShowTask.jsx';
import { setupMocks, createMockTask } from '../setup.js';

describe('ShowTask', () => {
	beforeEach(() => {
		setupMocks();
	});

	const mockTask = createMockTask({
		id: 1,
		title: 'Test Task',
		status: 'pending',
		priority: 'high',
		description: 'Test description',
		details: 'Implementation details here',
		dependencies: ['2', '3'],
		complexity: 7,
		subtasks: [
			{ id: 1, title: 'Subtask 1', status: 'done', dependencies: [] },
			{
				id: 2,
				title: 'Subtask 2',
				status: 'in-progress',
				dependencies: ['1.1']
			},
			{ id: 3, title: 'Subtask 3', status: 'pending', dependencies: [] }
		]
	});

	it('should render task details correctly', () => {
		const { lastFrame } = render(
			<ShowTask task={mockTask} onClose={() => {}} />
		);

		expect(lastFrame()).toContain('Task: 1 - Test Task');
		expect(lastFrame()).toContain('ID:');
		expect(lastFrame()).toContain('Title:');
		expect(lastFrame()).toContain('Test Task');
		expect(lastFrame()).toContain('Status:');
		expect(lastFrame()).toContain('○ pending');
		expect(lastFrame()).toContain('Priority:');
		expect(lastFrame()).toContain('high');
		expect(lastFrame()).toContain('Dependencies: 2, 3');
		// Complexity is shown in createMockTask but may not be displayed in this view
		expect(lastFrame()).toContain('Description:');
		expect(lastFrame()).toContain('Test description');
	});

	it('should render task content sections', () => {
		const { lastFrame } = render(
			<ShowTask task={mockTask} onClose={() => {}} />
		);

		// Check that main sections are present
		expect(lastFrame()).toContain('Subtasks');
		expect(lastFrame()).toContain('Suggested Actions');
	});

	it('should render subtasks table', () => {
		const { lastFrame } = render(
			<ShowTask task={mockTask} onClose={() => {}} />
		);

		expect(lastFrame()).toContain('Subtasks');
		expect(lastFrame()).toContain('ID');
		expect(lastFrame()).toContain('Status');
		expect(lastFrame()).toContain('Title');
		expect(lastFrame()).toContain('Deps');
		// Check visible subtasks (may be paginated)
		expect(lastFrame()).toContain('1.1');
		expect(lastFrame()).toContain('Subtask 1');
		expect(lastFrame()).toContain('✓ done');
		expect(lastFrame()).toContain('1.2');
		expect(lastFrame()).toContain('Subtask 2');
		expect(lastFrame()).toContain('► in-progress');
		// Third subtask may be below the fold
		expect(lastFrame()).toContain('1 more below');
	});

	it('should show subtask progress', () => {
		const { lastFrame } = render(
			<ShowTask task={mockTask} onClose={() => {}} />
		);

		expect(lastFrame()).toContain('Subtask Progress:');
		expect(lastFrame()).toContain('Completed: 1/3 (33%)');
		expect(lastFrame()).toContain('✓ Done: 1');
		expect(lastFrame()).toContain('► In Progress: 1');
		expect(lastFrame()).toContain('○ Pending: 1');
	});

	it('should show suggested actions', () => {
		const { lastFrame } = render(
			<ShowTask task={mockTask} onClose={() => {}} />
		);

		expect(lastFrame()).toContain('Suggested Actions:');
		expect(lastFrame()).toContain('[1] Mark as in-progress');
		expect(lastFrame()).toContain('[2] Mark as done');
	});

	it('should render complete layout structure', () => {
		const { lastFrame } = render(
			<ShowTask task={mockTask} onClose={() => {}} />
		);

		// Check that main layout sections are present
		const output = lastFrame();
		expect(output).toContain('Task: 1 - Test Task');
		expect(output).toContain('Subtasks');
		expect(output).toContain('Suggested Actions');
		// Footer may be cut off in test environment due to height constraints
	});

	it('should handle task without subtasks', () => {
		const taskWithoutSubtasks = { ...mockTask, subtasks: [] };
		const { lastFrame } = render(
			<ShowTask task={taskWithoutSubtasks} onClose={() => {}} />
		);

		expect(lastFrame()).not.toContain('Subtasks');
		expect(lastFrame()).not.toContain('Subtask Progress:');
	});

	it('should handle task without dependencies', () => {
		const taskWithoutDeps = { ...mockTask, dependencies: [] };
		const { lastFrame } = render(
			<ShowTask task={taskWithoutDeps} onClose={() => {}} />
		);

		expect(lastFrame()).not.toContain('Dependencies:');
	});

	it('should handle null task', () => {
		const { lastFrame } = render(<ShowTask task={null} onClose={() => {}} />);

		expect(lastFrame()).toContain('No task selected');
	});

	it('should handle task without description', () => {
		const taskWithoutDesc = { ...mockTask, description: null };
		const { lastFrame } = render(
			<ShowTask task={taskWithoutDesc} onClose={() => {}} />
		);

		expect(lastFrame()).toContain('No description');
	});
});
