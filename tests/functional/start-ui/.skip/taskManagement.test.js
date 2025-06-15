import React from 'react';
import { render } from 'ink-testing-library';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject,
	getMockTasksData,
	updateMockTaskStatus
} from './helpers/mockFileSystem.js';

describe('Task Management Tests', () => {
	let mockProjectRoot;
	let app;
	let stdin;
	let lastFrame;

	const sampleTasks = {
		tasks: [
			{
				id: 1,
				title: 'Initial task',
				description: 'First task in the list',
				status: 'pending',
				priority: 'medium'
			},
			{
				id: 2,
				title: 'Second task',
				description: 'Another task',
				status: 'in-progress',
				priority: 'high'
			}
		]
	};

	beforeEach(async () => {
		mockProjectRoot = setupMockProject(sampleTasks);
		app = render(<App projectRoot={mockProjectRoot} />);
		({ stdin, lastFrame } = app);

		// Wait for app to fully initialize
		await new Promise((resolve) => setTimeout(resolve, 1000));
	});

	afterEach(() => {
		app.unmount();
		cleanupMockProject(mockProjectRoot);
	});

	describe('Add Task (a key)', () => {
		test('should open add task modal', async () => {
			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Add Task:');
			expect(frame).toContain('Describe your task');
			expect(frame).toContain('ESC to cancel');
		});

		test('should add task with form input', async () => {
			// Open add task input
			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Type task description
			await stdin.write('Implement new feature with high priority');
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Press Enter to show confirmation
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should show confirmation prompt
			const confirmFrame = lastFrame();
			expect(confirmFrame).toContain('Add this task?');
			expect(confirmFrame).toContain(
				'Implement new feature with high priority'
			);

			// Skip actual task creation since it requires AI in test environment
			// Just verify the confirmation prompt works
		});

		test('should show confirmation after adding task', async () => {
			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Type task description
			await stdin.write('Quick task');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Press Enter
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should show confirmation prompt
			expect(frame).toContain('Add this task?');
			expect(frame).toContain('Quick task');
		});

		test('should cancel add task with ESC', async () => {
			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 100));

			await stdin.write('Task to cancel');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Press ESC
			await stdin.write('\u001b');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).not.toContain('Add Task:');
			expect(frame).not.toContain('Task to cancel');

			// Verify task was not added
			const data = getMockTasksData(mockProjectRoot);
			expect(data.tasks.length).toBe(2); // Original count
		});
	});

	describe('Remove Task (r key)', () => {
		test('should open remove confirmation dialog', async () => {
			await stdin.write('r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Remove Task');
			expect(frame).toContain('Are you sure');
			expect(frame).toContain('Initial task'); // Selected task
		});

		test('should remove task on confirmation', async () => {
			await stdin.write('r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Confirm removal
			await stdin.write('y');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			expect(frame).not.toContain('Initial task');

			// Verify in file system
			const data = getMockTasksData(mockProjectRoot);
			expect(data.tasks.find((t) => t.id === 1)).toBeUndefined();
		});

		test('should cancel removal with n', async () => {
			await stdin.write('r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Cancel removal
			await stdin.write('n');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Initial task');

			// Verify task still exists
			const data = getMockTasksData(mockProjectRoot);
			expect(data.tasks.find((t) => t.id === 1)).toBeDefined();
		});
	});

	describe('Update Task (e key)', () => {
		test('should open edit modal for selected task', async () => {
			await stdin.write('e');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Edit Task');
			expect(frame).toContain('Initial task'); // Current title
			expect(frame).toContain('First task in the list'); // Current description
		});

		test('should update task details', async () => {
			await stdin.write('e');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Clear and update title
			for (let i = 0; i < 20; i++) {
				await stdin.write('\u007F'); // Backspace
			}
			await stdin.write('Updated task title');

			// Tab to description
			await stdin.write('\t');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Clear and update description
			for (let i = 0; i < 30; i++) {
				await stdin.write('\u007F'); // Backspace
			}
			await stdin.write('New description');

			// Submit
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			expect(frame).toContain('Updated task title');

			// Verify in file system
			const data = getMockTasksData(mockProjectRoot);
			const updatedTask = data.tasks.find((t) => t.id === 1);
			expect(updatedTask.title).toBe('Updated task title');
			expect(updatedTask.description).toBe('New description');
		});
	});

	describe('Update Multiple Tasks (U key)', () => {
		test('should open batch update modal', async () => {
			await stdin.write('U');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Batch Update Tasks');
			expect(frame).toContain('Enter task IDs');
		});

		test('should update multiple tasks status', async () => {
			await stdin.write('U');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Enter task IDs
			await stdin.write('1,2');
			await stdin.write('\t');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Select status
			await stdin.write('\u001b[B'); // Down arrow to select 'done'
			await stdin.write('\u001b[B');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Submit
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Verify both tasks updated
			const data = getMockTasksData(mockProjectRoot);
			expect(data.tasks.find((t) => t.id === 1).status).toBe('done');
			expect(data.tasks.find((t) => t.id === 2).status).toBe('done');
		});
	});

	describe('Set Task Status (u key)', () => {
		test('should open status selector', async () => {
			await stdin.write('u');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Update Status');
			expect(frame).toContain('pending');
			expect(frame).toContain('in-progress');
			expect(frame).toContain('done');
			expect(frame).toContain('blocked');
			expect(frame).toContain('review');
		});

		test('should update task status', async () => {
			await stdin.write('u');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Select 'done' status
			await stdin.write('\u001b[B'); // Down arrow
			await stdin.write('\u001b[B');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			// Task should show as done
			expect(frame).toMatch(/✓.*Initial task/);

			// Verify in file system
			const data = getMockTasksData(mockProjectRoot);
			expect(data.tasks.find((t) => t.id === 1).status).toBe('done');
		});

		test('should handle all status options', async () => {
			const statuses = [
				'pending',
				'in-progress',
				'done',
				'blocked',
				'review',
				'deferred',
				'cancelled'
			];

			for (let i = 0; i < statuses.length; i++) {
				// Update status
				await stdin.write('u');
				await new Promise((resolve) => setTimeout(resolve, 100));

				// Navigate to status
				for (let j = 0; j < i; j++) {
					await stdin.write('\u001b[B'); // Down arrow
				}

				await stdin.write('\r');
				await new Promise((resolve) => setTimeout(resolve, 200));

				// Verify
				const data = getMockTasksData(mockProjectRoot);
				expect(data.tasks.find((t) => t.id === 1).status).toBe(statuses[i]);
			}
		});
	});

	describe('Generate Task Files (g key)', () => {
		test('should generate task files', async () => {
			await stdin.write('g');
			await new Promise((resolve) => setTimeout(resolve, 300));

			const frame = lastFrame();
			expect(frame).toContain('Generating task files');

			// Should show progress or completion
			await new Promise((resolve) => setTimeout(resolve, 500));
			const finalFrame = lastFrame();
			expect(finalFrame).toMatch(/generated|complete|success/i);
		});

		test('should show error if generation fails', async () => {
			// Mock a failure scenario by removing write permissions
			const fs = require('fs');
			const tasksDir = require('path').join(
				mockProjectRoot,
				'.taskmaster',
				'tasks'
			);
			fs.chmodSync(tasksDir, 0o444); // Read-only

			await stdin.write('g');
			await new Promise((resolve) => setTimeout(resolve, 300));

			const frame = lastFrame();
			expect(frame).toMatch(/error|failed/i);

			// Restore permissions
			fs.chmodSync(tasksDir, 0o755);
		});
	});

	describe('Task Dependencies', () => {
		test('should handle tasks with dependencies', async () => {
			// Add task with dependency
			const tasksWithDeps = {
				tasks: [
					...sampleTasks.tasks,
					{
						id: 3,
						title: 'Dependent task',
						description: 'This depends on task 1',
						status: 'pending',
						priority: 'medium',
						dependencies: [1]
					}
				]
			};

			cleanupMockProject(mockProjectRoot);
			mockProjectRoot = setupMockProject(tasksWithDeps);
			app.unmount();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Go to dependent task
			await stdin.write('j');
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Try to update status
			await stdin.write('u');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Select 'done'
			await stdin.write('\u001b[B');
			await stdin.write('\u001b[B');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			// Should show warning about dependencies
			expect(frame).toMatch(/depend|blocked|cannot/i);
		});
	});
});
