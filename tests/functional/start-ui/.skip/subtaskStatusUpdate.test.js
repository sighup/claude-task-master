/**
 * Functional tests for start-ui subtask status updates
 * Ensures that updating subtask status doesn't switch to a different task
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

describe('Start-UI Subtask Status Updates', () => {
	let mockProjectRoot;
	let app;

	beforeEach(() => {
		// Set up mock file system with tasks that have subtasks
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'First task with subtasks',
					description: 'Main task 1',
					status: 'in-progress',
					priority: 'high',
					details: 'Implementation details for task 1',
					subtasks: [
						{
							id: 1,
							title: 'Subtask 1.1',
							status: 'pending',
							details: 'Details for subtask 1.1'
						},
						{
							id: 2,
							title: 'Subtask 1.2',
							status: 'pending',
							details: 'Details for subtask 1.2'
						}
					]
				},
				{
					id: 2,
					title: 'Second task with subtasks',
					description: 'Main task 2',
					status: 'pending',
					priority: 'medium',
					details: 'Implementation details for task 2',
					subtasks: [
						{
							id: 1,
							title: 'Subtask 2.1',
							status: 'pending',
							details: 'Details for subtask 2.1'
						}
					]
				},
				{
					id: 3,
					title: 'Third task without subtasks',
					description: 'Main task 3',
					status: 'pending',
					priority: 'low',
					details: 'Implementation details for task 3',
					subtasks: []
				}
			]
		});
	});

	afterEach(() => {
		if (app) {
			app.unmount();
		}
		cleanupMockProject(mockProjectRoot);
	});

	test('should remain on same task when updating subtask status', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view for task 1
		stdin.write('s');
		await delay(100);

		// Verify we're viewing task 1
		let frame = lastFrame();
		expect(frame).toContain('Task: 1 - First task with subtasks');
		expect(frame).toContain('Subtask 1.1');
		expect(frame).toContain('Subtask 1.2');

		// Select first subtask
		stdin.write('\u001B[B'); // Down arrow
		await delay(100);

		// Update subtask status using keyboard shortcut
		stdin.write('3'); // Mark subtask as in-progress
		await delay(100);

		// Should still be viewing task 1, not switched to another task
		frame = lastFrame();
		expect(frame).toContain('Task: 1 - First task with subtasks');
		expect(frame).toContain('Subtask 1.1');
		expect(frame).toContain('Subtask 1.2');

		// Verify the subtask status was updated
		const tasksData = getMockTasksData(mockProjectRoot);
		const task1 = tasksData.tasks.find((t) => t.id === 1);
		expect(task1.subtasks[0].status).toBe('in-progress');
	});

	test('should maintain task view when updating multiple subtask statuses', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Navigate to second task - need to account for subtasks being shown
		// Task 1 + 2 subtasks = 3 lines, so task 2 is on line 4
		stdin.write('j'); // Down arrow to subtask 1.1
		await delay(100);
		stdin.write('j'); // Down arrow to subtask 1.2
		await delay(100);
		stdin.write('j'); // Down arrow to task 2
		await delay(100);

		// Enter task detail view for task 2
		stdin.write('s');
		await delay(100);

		// Verify we're viewing task 2
		let frame = lastFrame();
		expect(frame).toContain('Task: 2 - Second task with subtasks');
		expect(frame).toContain('Subtask 2.1');

		// Select the subtask
		stdin.write('\u001B[B'); // Down arrow
		await delay(100);

		// Update subtask status
		stdin.write('4'); // Mark subtask as done
		await delay(100);

		// Should still be viewing task 2
		frame = lastFrame();
		expect(frame).toContain('Task: 2 - Second task with subtasks');
		expect(frame).not.toContain('Task: 1'); // Should not have switched to task 1
		expect(frame).not.toContain('Task: 3'); // Should not have switched to task 3

		// Update again
		stdin.write('3'); // Mark as in-progress
		await delay(100);

		// Still should be viewing task 2
		frame = lastFrame();
		expect(frame).toContain('Task: 2 - Second task with subtasks');
	});

	test('should maintain task view after navigating between tasks and updating subtasks', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view for task 1
		stdin.write('s');
		await delay(100);

		// Navigate to task 2 using right arrow
		stdin.write('\u001B[C'); // Right arrow
		await delay(100);

		// Should now be viewing task 2
		let frame = lastFrame();
		expect(frame).toContain('Task: 2 - Second task with subtasks');

		// Select subtask and update
		stdin.write('\u001B[B'); // Down arrow
		await delay(100);
		stdin.write('4'); // Mark as done
		await delay(100);

		// Should still be on task 2
		frame = lastFrame();
		expect(frame).toContain('Task: 2 - Second task with subtasks');

		// Navigate back to task 1
		stdin.write('\u001B[D'); // Left arrow
		await delay(100);

		// Should be back on task 1
		frame = lastFrame();
		expect(frame).toContain('Task: 1 - First task with subtasks');
	});

	test('should show subtask detail and maintain view after status update', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view for task 1
		stdin.write('s');
		await delay(100);

		// Select first subtask
		stdin.write('\u001B[B'); // Down arrow
		await delay(100);

		// Enter subtask detail view
		stdin.write('s');
		await delay(100);

		// Should show subtask details
		let frame = lastFrame();
		expect(frame).toContain('Subtask: 1.1 - Subtask 1.1');
		expect(frame).toContain('Details for subtask 1.1');

		// Update subtask status from subtask detail view
		stdin.write('1'); // Mark as in-progress
		await delay(100);

		// Should still be in subtask detail view
		frame = lastFrame();
		expect(frame).toContain('Subtask: 1.1 - Subtask 1.1');

		// Exit subtask detail view
		stdin.write('\u001B'); // ESC
		await delay(100);

		// Should be back in task 1 detail view
		frame = lastFrame();
		expect(frame).toContain('Task: 1 - First task with subtasks');
		expect(frame).not.toContain('Task: 2'); // Not switched to another task
	});

	test('should handle rapid subtask updates without switching tasks', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view for task 1
		stdin.write('s');
		await delay(100);

		// Rapidly update subtasks
		for (let i = 0; i < 5; i++) {
			// Select subtask
			stdin.write('\u001B[B'); // Down arrow
			await delay(50);

			// Update status
			stdin.write(i % 2 === 0 ? '3' : '4'); // Alternate between in-progress and done
			await delay(50);

			// Move to next subtask if available
			if (i === 0) {
				stdin.write('\u001B[B'); // Down arrow to second subtask
				await delay(50);
			}
		}

		// After all updates, should still be on task 1
		const frame = lastFrame();
		expect(frame).toContain('Task: 1 - First task with subtasks');
		expect(frame).not.toContain('Task: 2');
		expect(frame).not.toContain('Task: 3');
	});

	test('should maintain correct task after external task status changes', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Navigate to second task - need to account for subtasks being shown
		// Task 1 + 2 subtasks = 3 lines, so task 2 is on line 4
		stdin.write('j'); // Down arrow to subtask 1.1
		await delay(100);
		stdin.write('j'); // Down arrow to subtask 1.2
		await delay(100);
		stdin.write('j'); // Down arrow to task 2
		await delay(100);

		// Enter task detail view for task 2
		stdin.write('s');
		await delay(100);

		// Verify viewing task 2
		expect(lastFrame()).toContain('Task: 2 - Second task with subtasks');

		// Simulate external update to task 1 (different task)
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');

		// Manual refresh
		stdin.write('r');
		await delay(200);

		// Should still be viewing task 2, not switched to task 1
		const frame = lastFrame();
		expect(frame).toContain('Task: 2 - Second task with subtasks');
		expect(frame).not.toContain('Task: 1');
	});
});
