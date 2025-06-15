/**
 * Functional tests for start-ui task state changes
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import delay from 'delay';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	updateMockTaskStatus,
	cleanupMockProject,
	getMockTasksData
} from './helpers/mockFileSystem.js';

describe('Start-UI Task State Changes', () => {
	let mockProjectRoot;
	let app;

	beforeEach(() => {
		// Set up mock file system with initial tasks
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Task 1',
					description: 'First task',
					status: 'pending',
					priority: 'high',
					subtasks: []
				},
				{
					id: 2,
					title: 'Task 2',
					description: 'Second task',
					status: 'in-progress',
					priority: 'medium',
					subtasks: []
				},
				{
					id: 3,
					title: 'Task 3',
					description: 'Third task',
					status: 'done',
					priority: 'low',
					subtasks: []
				}
			]
		});
	});

	afterEach(() => {
		// Clean up
		if (app) {
			app.unmount();
		}
		cleanupMockProject(mockProjectRoot);
	});

	test('should update UI when task status changes from pending to in-progress', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		// Wait for initial render
		await delay(100);

		// Verify initial state shows 1 pending task
		const initialFrame = lastFrame();
		expect(initialFrame).toContain('Pending: 1');
		expect(initialFrame).toContain('In Progress: 1');
		expect(initialFrame).toContain('Done: 1');

		// Change task 1 status in mock file
		await updateMockTaskStatus(mockProjectRoot, 1, 'in-progress');

		// Force a manual refresh with 'r' key to verify file change
		stdin.write('r');
		await delay(100);

		// Verify UI updated
		const updatedFrame = lastFrame();
		expect(updatedFrame).toContain('Pending: 0');
		expect(updatedFrame).toContain('In Progress: 2');
		expect(updatedFrame).toContain('Done: 1');
	});

	test('should update task counts when multiple tasks change status', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Change multiple task statuses
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');
		await updateMockTaskStatus(mockProjectRoot, 2, 'done');

		// Manual refresh
		stdin.write('r');
		await delay(200);

		// All tasks should now be done
		const updatedFrame = lastFrame();
		expect(updatedFrame).toContain('Pending: 0');
		expect(updatedFrame).toContain('In Progress: 0');
		expect(updatedFrame).toContain('Done: 3');
	});

	test('should update filtered view when task status changes', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Switch to pending view
		stdin.write('2');
		await delay(100);

		// Should see Task 1 in pending view
		expect(lastFrame()).toContain('Task 1');
		expect(lastFrame()).toContain('pending');

		// Change Task 1 to in-progress
		await updateMockTaskStatus(mockProjectRoot, 1, 'in-progress');

		// Manual refresh
		stdin.write('r');
		await delay(200);

		// Task 1 should disappear from pending view
		const updatedFrame = lastFrame();
		expect(updatedFrame).toContain('No pending tasks');
		expect(updatedFrame).toContain('Pending Tasks (0)');
		// The task list should be empty in pending view
		expect(updatedFrame).not.toContain('○ 1'); // Pending task indicator
	});

	test('should handle rapid task updates without losing changes', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Make rapid changes
		await updateMockTaskStatus(mockProjectRoot, 1, 'in-progress');
		await delay(100);
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');
		await delay(100);
		await updateMockTaskStatus(mockProjectRoot, 2, 'done');

		// Manual refresh to see all changes
		stdin.write('r');
		await delay(200);

		// Final state should reflect all changes
		const finalFrame = lastFrame();
		expect(finalFrame).toContain('Pending: 0');
		expect(finalFrame).toContain('In Progress: 0');
		expect(finalFrame).toContain('Done: 3');

		// Verify actual file state matches UI
		const fileData = getMockTasksData(mockProjectRoot);
		expect(fileData.tasks.find((t) => t.id === 1).status).toBe('done');
		expect(fileData.tasks.find((t) => t.id === 2).status).toBe('done');
	});

	test('should show correct task details after status update', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Press 's' to show task details
		stdin.write('s');
		await delay(100);

		// Should show task details
		expect(lastFrame()).toContain('Task: 1 - Task 1');
		expect(lastFrame()).toContain('Description: First task');
		expect(lastFrame()).toContain('Status: ○ pending');

		// Update task status externally
		await updateMockTaskStatus(mockProjectRoot, 1, 'in-progress');

		// Exit and re-enter task details to see update
		stdin.write('\u001B'); // ESC
		await delay(100);
		stdin.write('r'); // Refresh
		await delay(200);
		stdin.write('s'); // Show details again
		await delay(100);

		// Task details should update
		expect(lastFrame()).toContain('Status: ► in-progress');
	});

	test('should maintain selection when tasks update', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Navigate down to select Task 2
		stdin.write('j'); // down arrow
		await delay(100);

		// Verify Task 2 is selected (should have selection indicator)
		const beforeUpdate = lastFrame();
		expect(beforeUpdate).toMatch(/►.*Task 2/); // ► indicates selection

		// Update a different task
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');
		await delay(3500);

		// Task 2 should still be selected
		const afterUpdate = lastFrame();
		expect(afterUpdate).toMatch(/►.*Task 2/);
	});
});
