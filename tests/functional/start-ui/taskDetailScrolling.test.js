/**
 * Functional tests for start-ui task detail scrolling
 */

import { jest } from '@jest/globals';
import React from 'react';
import { render } from 'ink-testing-library';
import delay from 'delay';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject
} from './helpers/mockFileSystem.js';

describe('Start-UI Task Detail Scrolling', () => {
	let mockProjectRoot;
	let app;

	beforeEach(() => {
		// Create a task with long implementation details that will require scrolling
		const longDetails = Array.from({ length: 30 }, (_, i) => 
			`Line ${i + 1}: This is a detailed implementation step that explains what needs to be done in this part of the task.`
		).join('\n');

		mockProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Task with long details',
					description: 'Task that has implementation details requiring scrolling',
					status: 'pending',
					priority: 'high',
					details: longDetails,
					subtasks: []
				},
				{
					id: 2,
					title: 'Task with subtasks',
					description: 'Task that has subtasks with long details',
					status: 'pending',
					priority: 'medium',
					details: 'Short main task details',
					subtasks: [
						{
							id: '1.1',
							title: 'Subtask with long details',
							status: 'pending',
							details: longDetails
						}
					]
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

	test('should scroll main task implementation details with Page Down', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view
		stdin.write('s');
		await delay(100);

		// Should show task details with scroll indicator
		let frame = lastFrame();
		expect(frame).toContain('Implementation Details:');
		expect(frame).toContain('Line 1:'); // Should see beginning
		expect(frame).toContain('(Lines 1-'); // Should show scroll indicator

		// Press Page Down to scroll
		stdin.write('\u001B[6~'); // Page Down key
		await delay(100);

		// Should have scrolled down
		frame = lastFrame();
		expect(frame).not.toContain('Line 1:'); // Should no longer see beginning
		expect(frame).toContain('Line '); // Should see some lines
		expect(frame).toContain('(Lines '); // Should still show scroll indicator
	});

	test('should scroll main task implementation details with Page Up', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view
		stdin.write('s');
		await delay(100);

		// Scroll down first
		stdin.write('\u001B[6~'); // Page Down
		await delay(100);
		stdin.write('\u001B[6~'); // Page Down again
		await delay(100);

		// Should be scrolled down
		let frame = lastFrame();
		expect(frame).not.toContain('Line 1:');

		// Press Page Up to scroll back up
		stdin.write('\u001B[5~'); // Page Up key
		await delay(100);

		// Should have scrolled back up
		frame = lastFrame();
		expect(frame).toContain('Line '); // Should see lines
		// Line numbers should be lower than before
	});

	test('should scroll with Ctrl+D and Ctrl+U', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view
		stdin.write('s');
		await delay(100);

		// Should show beginning
		let frame = lastFrame();
		expect(frame).toContain('Line 1:');

		// Press Ctrl+D to scroll down
		stdin.write('\u0004'); // Ctrl+D
		await delay(100);

		// Should have scrolled down
		frame = lastFrame();
		expect(frame).not.toContain('Line 1:');

		// Press Ctrl+U to scroll back up
		stdin.write('\u0015'); // Ctrl+U
		await delay(100);

		// Should have scrolled back up
		frame = lastFrame();
		expect(frame).toContain('Line 1:');
	});

	test('should scroll subtask details when in subtask view', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Navigate to second task (with subtasks)
		stdin.write('j'); // Down arrow to task 2
		await delay(100);

		// Enter task detail view
		stdin.write('s');
		await delay(100);

		// Navigate to subtask (arrow down to select it)
		stdin.write('\u001B[B'); // Down arrow
		await delay(100);

		// Enter subtask detail view
		stdin.write('s');
		await delay(100);

		// Should show subtask details
		let frame = lastFrame();
		expect(frame).toContain('Subtask:');
		expect(frame).toContain('Line 1:');

		// Press Page Down to scroll subtask details
		stdin.write('\u001B[6~'); // Page Down
		await delay(100);

		// Should have scrolled subtask details
		frame = lastFrame();
		expect(frame).toContain('Subtask:'); // Still in subtask view
		expect(frame).not.toContain('Line 1:'); // Should have scrolled past first line
	});

	test('should not scroll when details fit in available space', async () => {
		// Create a task with short details that don't need scrolling
		const shortProjectRoot = setupMockProject({
			tasks: [
				{
					id: 1,
					title: 'Task with short details',
					description: 'Task with brief implementation details',
					status: 'pending',
					priority: 'high',
					details: 'Line 1: Short implementation\nLine 2: Another short line',
					subtasks: []
				}
			]
		});

		app = render(<App projectRoot={shortProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view
		stdin.write('s');
		await delay(100);

		// Should show task details without scroll indicator
		let frame = lastFrame();
		expect(frame).toContain('Implementation Details:');
		expect(frame).toContain('Line 1: Short implementation');
		expect(frame).toContain('Line 2: Another short line');
		expect(frame).not.toContain('(Lines '); // No scroll indicator

		// Store initial frame
		const initialFrame = frame;

		// Press Page Down - should not change anything
		stdin.write('\u001B[6~'); // Page Down
		await delay(100);

		// Should be the same
		frame = lastFrame();
		expect(frame).toContain('Line 1: Short implementation');
		expect(frame).toContain('Line 2: Another short line');

		cleanupMockProject(shortProjectRoot);
	});

	test('should show correct scroll position indicators', async () => {
		app = render(<App projectRoot={mockProjectRoot} />);
		const { lastFrame, stdin } = app;

		await delay(100);

		// Enter task detail view
		stdin.write('s');
		await delay(100);

		// Should show beginning position
		let frame = lastFrame();
		expect(frame).toContain('(Lines 1-');
		expect(frame).toContain('of 30'); // Total number of lines

		// Scroll down
		stdin.write('\u001B[6~'); // Page Down
		await delay(100);

		// Should show different position
		frame = lastFrame();
		expect(frame).not.toContain('(Lines 1-'); // No longer at beginning
		expect(frame).toContain('of 30'); // Still shows total
	});
});