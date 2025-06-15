import React from 'react';
import { render } from 'ink-testing-library';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject,
	getMockTasksData
} from './helpers/mockFileSystem.js';

describe('Subtask Management Tests', () => {
	let mockProjectRoot;
	let app;
	let stdin;
	let lastFrame;

	const sampleTasks = {
		tasks: [
			{
				id: 1,
				title: 'Main feature implementation',
				description: 'Implement the main feature',
				status: 'in-progress',
				priority: 'high',
				subtasks: [
					{
						id: '1.1',
						title: 'Design architecture',
						status: 'done',
						description: 'Create system design'
					},
					{
						id: '1.2',
						title: 'Write core logic',
						status: 'in-progress',
						description: 'Implement business logic'
					},
					{
						id: '1.3',
						title: 'Add tests',
						status: 'pending',
						description: 'Write unit tests'
					}
				]
			},
			{
				id: 2,
				title: 'Task without subtasks',
				description: 'Simple task',
				status: 'pending',
				priority: 'medium'
			}
		]
	};

	beforeEach(() => {
		mockProjectRoot = setupMockProject(sampleTasks);
		app = render(<App projectRoot={mockProjectRoot} />);
		({ stdin, lastFrame } = app);
	});

	afterEach(() => {
		app.unmount();
		cleanupMockProject(mockProjectRoot);
	});

	describe('Add Subtask (A key in detail view)', () => {
		test('should open add subtask modal in detail view', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Press A to add subtask
			await stdin.write('A');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Add Subtask');
			expect(frame).toContain('Title');
			expect(frame).toContain('Description');
		});

		test('should add subtask to current task', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Add subtask
			await stdin.write('A');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Enter subtask details
			await stdin.write('New subtask');
			await stdin.write('\t');
			await stdin.write('Subtask description');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			expect(frame).toContain('New subtask');

			// Verify in file system
			const data = getMockTasksData(mockProjectRoot);
			const task = data.tasks.find((t) => t.id === 1);
			const newSubtask = task.subtasks.find((s) => s.title === 'New subtask');
			expect(newSubtask).toBeDefined();
			expect(newSubtask.description).toBe('Subtask description');
			expect(newSubtask.id).toMatch(/^1\.\d+$/);
		});

		test('should not allow adding subtask from list view', async () => {
			// Try to add subtask from list view
			await stdin.write('A');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should not open add subtask modal
			expect(frame).not.toContain('Add Subtask');
		});
	});

	describe('Remove Subtask (R key in detail view)', () => {
		test('should open remove subtask dialog', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Navigate to a subtask
			await stdin.write('j'); // Move to subtasks section
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Remove subtask
			await stdin.write('R');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Remove Subtask');
			expect(frame).toContain('Are you sure');
			expect(frame).toContain('Design architecture');
		});

		test('should remove subtask on confirmation', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Navigate to subtask
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Remove subtask
			await stdin.write('R');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Confirm
			await stdin.write('y');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			expect(frame).not.toContain('Design architecture');

			// Verify in file system
			const data = getMockTasksData(mockProjectRoot);
			const task = data.tasks.find((t) => t.id === 1);
			expect(task.subtasks.find((s) => s.id === '1.1')).toBeUndefined();
		});

		test('should optionally convert subtask to task', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Navigate to subtask
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Remove subtask
			await stdin.write('R');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Choose to convert to task
			await stdin.write('c'); // Convert option
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Go back to list
			await stdin.write('\u001b'); // ESC
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Design architecture'); // Now as main task

			// Verify in file system
			const data = getMockTasksData(mockProjectRoot);
			const convertedTask = data.tasks.find(
				(t) => t.title === 'Design architecture'
			);
			expect(convertedTask).toBeDefined();
			expect(convertedTask.id).toBeGreaterThan(2); // New ID
		});
	});

	describe('Update Subtask (E key in detail view)', () => {
		test('should open update subtask modal', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Navigate to subtask
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Update subtask
			await stdin.write('E');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Update Subtask');
			expect(frame).toContain('Design architecture');
		});

		test('should update subtask details', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Navigate to subtask
			await stdin.write('j');
			await stdin.write('j'); // Second subtask
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Update subtask
			await stdin.write('E');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Add additional info
			await stdin.write(' - Updated info');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			expect(frame).toContain('Updated info');

			// Verify in file system
			const data = getMockTasksData(mockProjectRoot);
			const task = data.tasks.find((t) => t.id === 1);
			const subtask = task.subtasks.find((s) => s.id === '1.2');
			expect(subtask.title).toContain('Updated info');
		});
	});

	describe('Clear All Subtasks (C key)', () => {
		test('should open clear subtasks dialog', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Clear subtasks
			await stdin.write('C');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Clear All Subtasks');
			expect(frame).toContain('remove all subtasks');
			expect(frame).toContain('This action cannot be undone');
		});

		test('should clear all subtasks on confirmation', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Clear subtasks
			await stdin.write('C');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Confirm
			await stdin.write('y');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			expect(frame).not.toContain('Design architecture');
			expect(frame).not.toContain('Write core logic');
			expect(frame).not.toContain('Add tests');

			// Verify in file system
			const data = getMockTasksData(mockProjectRoot);
			const task = data.tasks.find((t) => t.id === 1);
			expect(task.subtasks).toEqual([]);
		});
	});

	describe('Toggle Subtask Visibility (s key)', () => {
		test('should toggle subtask visibility in list view', async () => {
			// Initially subtasks should not be visible
			let frame = lastFrame();
			expect(frame).not.toContain('Design architecture');

			// Toggle on
			await stdin.write('s');
			await new Promise((resolve) => setTimeout(resolve, 100));

			frame = lastFrame();
			expect(frame).toContain('Design architecture');
			expect(frame).toContain('Write core logic');
			expect(frame).toContain('Add tests');

			// Toggle off
			await stdin.write('s');
			await new Promise((resolve) => setTimeout(resolve, 100));

			frame = lastFrame();
			expect(frame).not.toContain('Design architecture');
		});

		test('should show subtask status indicators', async () => {
			// Toggle subtasks on
			await stdin.write('s');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Check for status indicators
			expect(frame).toMatch(/✓.*Design architecture/); // Done
			expect(frame).toMatch(/►.*Write core logic/); // In progress
			expect(frame).toMatch(/○.*Add tests/); // Pending
		});
	});

	describe('Subtask Navigation', () => {
		test('should navigate between subtasks in detail view', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Navigate through subtasks
			await stdin.write('j'); // To first subtask
			await new Promise((resolve) => setTimeout(resolve, 50));

			let frame = lastFrame();
			expect(frame).toMatch(/[>▶].*Design architecture/);

			await stdin.write('j'); // To second subtask
			await new Promise((resolve) => setTimeout(resolve, 50));

			frame = lastFrame();
			expect(frame).toMatch(/[>▶].*Write core logic/);

			await stdin.write('k'); // Back up
			await new Promise((resolve) => setTimeout(resolve, 50));

			frame = lastFrame();
			expect(frame).toMatch(/[>▶].*Design architecture/);
		});

		test('should update subtask status', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Navigate to pending subtask
			await stdin.write('j');
			await stdin.write('j');
			await stdin.write('j'); // Third subtask (pending)
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Update status
			await stdin.write('u');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Select in-progress
			await stdin.write('\u001b[B'); // Down arrow
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			// Should show updated status
			expect(frame).toMatch(/►.*Add tests/);

			// Verify in file system
			const data = getMockTasksData(mockProjectRoot);
			const task = data.tasks.find((t) => t.id === 1);
			const subtask = task.subtasks.find((s) => s.id === '1.3');
			expect(subtask.status).toBe('in-progress');
		});
	});

	describe('Subtask Constraints', () => {
		test('should not allow subtasks on subtasks', async () => {
			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Navigate to a subtask
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Try to add subtask to subtask
			await stdin.write('A');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should show error or not allow
			expect(frame).toMatch(/cannot|not allowed|subtask/i);
		});

		test('should handle empty subtask list gracefully', async () => {
			// Go to second task (no subtasks)
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('No subtasks');

			// Should still allow adding subtasks
			await stdin.write('A');
			await new Promise((resolve) => setTimeout(resolve, 100));

			expect(lastFrame()).toContain('Add Subtask');
		});
	});
});
