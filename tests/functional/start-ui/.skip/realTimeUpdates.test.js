/**
 * Functional tests for start-ui real-time updates
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import delay from 'delay';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	updateMockTaskStatus,
	addMockTask,
	cleanupMockProject
} from './helpers/mockFileSystem.js';

describe('Start-UI Real-Time Updates', () => {
	let mockProjectRoot;
	let app;

	beforeEach(() => {
		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Monitor this task',
					description: 'Task that will be updated externally',
					status: 'pending',
					priority: 'high',
					subtasks: []
				},
				{
					id: 2,
					title: 'Another task',
					description: 'Secondary task',
					status: 'in-progress',
					priority: 'medium',
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

	test('should show real-time updates from external changes', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Verify initial state
		expect(lastFrame()).toContain('Pending: 1');
		expect(lastFrame()).toContain('In Progress: 1');

		// Simulate external process updating task
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');

		// Manual refresh to see the changes
		stdin.write('r');
		await delay(200);

		const updatedFrame = lastFrame();
		expect(updatedFrame).toContain('Pending: 0');
		expect(updatedFrame).toContain('Done: 1'); // Was 0, now 1
	}, 10000);

	test('should handle multiple external updates', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Simulate multiple external updates
		await updateMockTaskStatus(mockProjectRoot, 1, 'in-progress');
		await updateMockTaskStatus(mockProjectRoot, 2, 'done');
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');

		// Manual refresh to see all changes
		stdin.write('r');
		await delay(200);

		// Both tasks should be done
		const finalFrame = lastFrame();
		expect(finalFrame).toContain('Pending: 0');
		expect(finalFrame).toContain('In Progress: 0');
		expect(finalFrame).toContain('Done: 2');
	}, 10000);

	test('should update when new tasks are added externally', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Initial task count
		expect(lastFrame()).toContain('All Tasks (2)');

		// Add a new task externally
		await addMockTask(mockProjectRoot, {
			id: 3,
			title: 'New external task',
			description: 'Added from outside',
			status: 'pending',
			priority: 'high',
			subtasks: []
		});

		// Manual refresh
		stdin.write('r');
		await delay(200);

		// Should show new task
		const updatedFrame = lastFrame();
		expect(updatedFrame).toContain('All Tasks (3)');
		expect(updatedFrame).toContain('New external task');
		expect(updatedFrame).toContain('Pending: 2'); // Was 1, now 2
	});

	test('should maintain UI stability during rapid external updates', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame } = app;

		await delay(100);

		const frames = [];
		let previousFrame = lastFrame();

		// Simulate rapid external updates
		const rapidUpdates = async () => {
			for (let i = 0; i < 5; i++) {
				await updateMockTaskStatus(
					mockProjectRoot,
					1,
					i % 2 ? 'done' : 'pending'
				);
				await delay(200);
			}
		};

		// Monitor frames during updates
		const monitorFrames = setInterval(() => {
			const currentFrame = lastFrame();
			if (currentFrame !== previousFrame) {
				frames.push({
					time: Date.now(),
					content: currentFrame
				});
				previousFrame = currentFrame;
			}
		}, 100);

		await rapidUpdates();
		await delay(3500); // Wait for final update

		clearInterval(monitorFrames);

		// Should have captured multiple distinct frames
		expect(frames.length).toBeGreaterThan(0);

		// Verify no duplicate consecutive frames (no flicker)
		for (let i = 1; i < frames.length; i++) {
			expect(frames[i].content).not.toBe(frames[i - 1].content);
		}

		// Final state should be stable
		const finalFrame = lastFrame();
		expect(finalFrame).toMatch(/Pending: \d+/);
		expect(finalFrame).toMatch(/Done: \d+/);
	});

	test('should update filtered view when external changes affect visible tasks', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Switch to pending view
		stdin.write('2');
		await delay(100);

		// Should see the pending task
		expect(lastFrame()).toContain('Monitor this task');
		expect(lastFrame()).toContain('Pending Tasks (1)');

		// External update changes task to done
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');

		// Manual refresh
		stdin.write('r');
		await delay(200);

		// Task should disappear from pending view
		const updatedFrame = lastFrame();
		expect(updatedFrame).not.toContain('Monitor this task');
		expect(updatedFrame).toContain('No pending tasks');
		expect(updatedFrame).toContain('Pending Tasks (0)');
	}, 10000);

	test('should handle external updates while in task detail view', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view with 's' key
		stdin.write('s');
		await delay(100);

		// Should show task details
		expect(lastFrame()).toContain('Task: 1 - Monitor this task');
		expect(lastFrame()).toContain('Status: ○ pending');

		// External update changes the task
		await updateMockTaskStatus(mockProjectRoot, 1, 'in-progress');

		// Exit and re-enter detail view to see update
		stdin.write('\u001B'); // ESC
		await delay(100);
		stdin.write('r'); // Refresh
		await delay(200);
		stdin.write('s'); // Show details again
		await delay(100);

		// Task detail should update
		const updatedFrame = lastFrame();
		expect(updatedFrame).toContain('Task: 1 - Monitor this task');
		expect(updatedFrame).toContain('Status: ► in-progress');
	}, 10000);

	test('should not lose user position during external updates', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Navigate to second task
		stdin.write('j');
		await delay(100);

		// Verify selection on task 2
		expect(lastFrame()).toContain('Task 2/2');
		expect(lastFrame()).toContain('Another task');

		// External update to task 1
		await updateMockTaskStatus(mockProjectRoot, 1, 'done');

		// Manual refresh
		stdin.write('r');
		await delay(200);

		// Selection should remain on task 2
		const updatedFrame = lastFrame();
		expect(updatedFrame).toContain('Task 2/2');
		expect(updatedFrame).toContain('Another task');

		// But stats should be updated
		expect(updatedFrame).toContain('Done: 1');
	}, 10000);
});
