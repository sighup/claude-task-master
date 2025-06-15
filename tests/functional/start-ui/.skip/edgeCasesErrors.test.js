import React from 'react';
import { render } from 'ink-testing-library';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject,
	getMockTasksData,
	updateMockTaskStatus
} from './helpers/mockFileSystem.js';
import fs from 'fs';
import path from 'path';

describe('Edge Cases and Error Handling Tests', () => {
	let mockProjectRoot;
	let app;
	let stdin;
	let lastFrame;

	afterEach(() => {
		if (app) app.unmount();
		if (mockProjectRoot) cleanupMockProject(mockProjectRoot);
	});

	describe('Empty Project State', () => {
		test('should handle empty task list gracefully', async () => {
			mockProjectRoot = setupMockProject({ tasks: [] });
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			const frame = lastFrame();
			expect(frame).toContain('No tasks found');
			expect(frame).toContain('Getting Started');
			expect(frame).toContain('Press [M] to configure AI models');
			expect(frame).toContain('Press [P] to parse a PRD document');
			expect(frame).toContain('Press [A] to add a task manually');
		});

		test('should allow adding first task', async () => {
			mockProjectRoot = setupMockProject({ tasks: [] });
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Add New Task');

			// Add task
			await stdin.write('First task');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			expect(lastFrame()).toContain('First task');
		});

		test('should handle navigation in empty list', async () => {
			mockProjectRoot = setupMockProject({ tasks: [] });
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Try navigation keys
			await stdin.write('j');
			await new Promise((resolve) => setTimeout(resolve, 50));
			await stdin.write('k');
			await new Promise((resolve) => setTimeout(resolve, 50));

			// Should not crash
			const frame = lastFrame();
			expect(frame).toContain('No tasks found');
		});
	});

	describe('Large Task Lists', () => {
		test('should handle 100+ tasks efficiently', async () => {
			const largeTasks = {
				tasks: Array.from({ length: 150 }, (_, i) => ({
					id: i + 1,
					title: `Task ${i + 1}`,
					description: `Description for task ${i + 1}`,
					status: ['pending', 'in-progress', 'done'][i % 3],
					priority: ['high', 'medium', 'low'][i % 3]
				}))
			};

			mockProjectRoot = setupMockProject(largeTasks);
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			const frame = lastFrame();
			// Should show task count
			expect(frame).toMatch(/150.*tasks/i);

			// Should paginate or virtualize
			const visibleTasks = (frame.match(/Task \d+/g) || []).length;
			expect(visibleTasks).toBeLessThan(150);
		});

		test('should search efficiently in large lists', async () => {
			const largeTasks = {
				tasks: Array.from({ length: 200 }, (_, i) => ({
					id: i + 1,
					title: i === 150 ? 'Special unique task' : `Task ${i + 1}`,
					description: `Description ${i + 1}`,
					status: 'pending',
					priority: 'medium'
				}))
			};

			mockProjectRoot = setupMockProject(largeTasks);
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Open search
			await stdin.write('?');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Search for unique task
			await stdin.write('unique');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			expect(frame).toContain('Special unique task');
			expect(frame).not.toContain('Task 1');
		});

		test('should handle batch operations on many tasks', async () => {
			const tasks = {
				tasks: Array.from({ length: 50 }, (_, i) => ({
					id: i + 1,
					title: `Task ${i + 1}`,
					description: `Description ${i + 1}`,
					status: 'pending',
					priority: 'medium'
				}))
			};

			mockProjectRoot = setupMockProject(tasks);
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Batch update
			await stdin.write('U');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Update first 10 tasks
			await stdin.write('1,2,3,4,5,6,7,8,9,10');
			await stdin.write('\t');
			await stdin.write('\u001b[B'); // Select done
			await stdin.write('\u001b[B');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Verify updates
			const data = getMockTasksData(mockProjectRoot);
			for (let i = 1; i <= 10; i++) {
				expect(data.tasks.find((t) => t.id === i).status).toBe('done');
			}
		});
	});

	describe('Long Task Titles and Descriptions', () => {
		test('should truncate long titles appropriately', async () => {
			const tasks = {
				tasks: [
					{
						id: 1,
						title:
							'This is an extremely long task title that should be truncated when displayed in the list view to prevent layout issues and maintain readability',
						description: 'Short description',
						status: 'pending',
						priority: 'high'
					}
				]
			};

			mockProjectRoot = setupMockProject(tasks);
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			const frame = lastFrame();
			// Should show truncated title with ellipsis
			expect(frame).toMatch(/This is an extremely.*\.\.\./);
			expect(frame).not.toContain('maintain readability');
		});

		test('should show full content in detail view', async () => {
			const longContent = 'A'.repeat(500);
			const tasks = {
				tasks: [
					{
						id: 1,
						title: 'Task with very long description',
						description: longContent,
						status: 'pending',
						priority: 'high'
					}
				]
			};

			mockProjectRoot = setupMockProject(tasks);
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Enter detail view
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should show scrollable content or pagination
			expect(frame).toContain('Task with very long description');
			expect(frame.includes('A'.repeat(50))).toBe(true);
		});

		test('should handle multiline descriptions', async () => {
			const tasks = {
				tasks: [
					{
						id: 1,
						title: 'Multiline task',
						description: `Line 1: Introduction
Line 2: Main content
Line 3: Additional details
Line 4: Conclusion`,
						status: 'pending',
						priority: 'medium'
					}
				]
			};

			mockProjectRoot = setupMockProject(tasks);
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Line 1');
			expect(frame).toContain('Line 2');
		});
	});

	describe('Invalid User Inputs', () => {
		test('should handle invalid task IDs gracefully', async () => {
			const tasks = {
				tasks: [
					{ id: 1, title: 'Task 1', status: 'pending', priority: 'medium' },
					{ id: 2, title: 'Task 2', status: 'pending', priority: 'medium' }
				]
			};

			mockProjectRoot = setupMockProject(tasks);
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Try batch update with invalid IDs
			await stdin.write('U');
			await new Promise((resolve) => setTimeout(resolve, 100));

			await stdin.write('1,99,invalid,2');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			expect(frame).toMatch(/invalid.*id|not found/i);
		});

		test('should validate required fields', async () => {
			mockProjectRoot = setupMockProject({ tasks: [] });
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Try to add task without title
			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Just press enter without title
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toMatch(/required|enter.*title/i);
		});

		test('should handle special characters in input', async () => {
			mockProjectRoot = setupMockProject({ tasks: [] });
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Input with special characters
			await stdin.write('Task with <special> & "characters" \'quotes\'');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			// Should handle gracefully
			const data = getMockTasksData(mockProjectRoot);
			expect(data.tasks[0].title).toContain('special');
			expect(data.tasks[0].title).toContain('characters');
		});
	});

	describe('File System Errors', () => {
		test('should handle read-only file system', async () => {
			mockProjectRoot = setupMockProject({ tasks: [] });

			// Make tasks file read-only
			const tasksFile = path.join(
				mockProjectRoot,
				'.taskmaster',
				'tasks',
				'tasks.json'
			);
			fs.chmodSync(tasksFile, 0o444);

			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Try to add task
			await stdin.write('a');
			await new Promise((resolve) => setTimeout(resolve, 100));
			await stdin.write('New task');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 200));

			const frame = lastFrame();
			expect(frame).toMatch(/error|failed|permission/i);

			// Restore permissions
			fs.chmodSync(tasksFile, 0o644);
		});

		test('should handle missing config files', async () => {
			mockProjectRoot = setupMockProject({ tasks: [] });

			// Remove config file
			const configFile = path.join(
				mockProjectRoot,
				'.taskmaster',
				'config.json'
			);
			fs.unlinkSync(configFile);

			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Should still function with defaults
			const frame = lastFrame();
			expect(frame).toContain('All Tasks');
		});

		test('should handle corrupted JSON files', async () => {
			mockProjectRoot = setupMockProject({ tasks: [] });

			// Corrupt tasks file
			const tasksFile = path.join(
				mockProjectRoot,
				'.taskmaster',
				'tasks',
				'tasks.json'
			);
			fs.writeFileSync(tasksFile, '{ invalid json }');

			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			const frame = lastFrame();
			expect(frame).toMatch(/error|failed to load/i);
		});
	});

	describe('API Failures', () => {
		test('should handle AI service unavailability', async () => {
			mockProjectRoot = setupMockProject({
				tasks: [
					{
						id: 1,
						title: 'Test task',
						description: 'Test',
						status: 'pending',
						priority: 'high'
					}
				]
			});

			// Mock AI service failure
			const configFile = path.join(
				mockProjectRoot,
				'.taskmaster',
				'config.json'
			);
			const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
			config.models.main.modelId = 'invalid-model';
			fs.writeFileSync(configFile, JSON.stringify(config));

			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Try to expand task (uses AI)
			await stdin.write('v');
			await new Promise((resolve) => setTimeout(resolve, 100));
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 500));

			const frame = lastFrame();
			expect(frame).toMatch(/error|failed|unavailable/i);
		});

		test('should fallback gracefully when AI fails', async () => {
			mockProjectRoot = setupMockProject({
				tasks: [
					{
						id: 1,
						title: 'Parse this PRD',
						description: 'PRD parsing test',
						status: 'pending',
						priority: 'high'
					}
				]
			});

			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Try PRD parsing with missing file
			await stdin.write('P');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should show helpful error instead of crashing
			expect(frame).toMatch(/no.*prd|create.*prd/i);
		});
	});

	describe('Concurrent Operations', () => {
		test('should handle rapid key presses', async () => {
			const tasks = {
				tasks: Array.from({ length: 10 }, (_, i) => ({
					id: i + 1,
					title: `Task ${i + 1}`,
					status: 'pending',
					priority: 'medium'
				}))
			};

			mockProjectRoot = setupMockProject(tasks);
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Rapid navigation
			for (let i = 0; i < 20; i++) {
				await stdin.write('j');
			}

			// Should not crash or show errors
			await new Promise((resolve) => setTimeout(resolve, 200));
			const frame = lastFrame();
			expect(frame).toContain('Task');
		});

		test('should handle file updates during operation', async () => {
			mockProjectRoot = setupMockProject({
				tasks: [
					{
						id: 1,
						title: 'Original task',
						status: 'pending',
						priority: 'medium'
					}
				]
			});

			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Simulate external file update
			await updateMockTaskStatus(mockProjectRoot, 1, 'done');

			// Wait for auto-refresh
			await new Promise((resolve) => setTimeout(resolve, 6000)); // Default refresh interval

			const frame = lastFrame();
			// Should show updated status
			expect(frame).toMatch(/✓.*Original task/);
		});
	});

	describe('Memory and Performance', () => {
		test('should not leak memory with repeated operations', async () => {
			mockProjectRoot = setupMockProject({
				tasks: Array.from({ length: 20 }, (_, i) => ({
					id: i + 1,
					title: `Task ${i + 1}`,
					status: 'pending',
					priority: 'medium'
				}))
			});

			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			// Perform many operations
			for (let i = 0; i < 10; i++) {
				await stdin.write('a');
				await new Promise((resolve) => setTimeout(resolve, 50));
				await stdin.write('\u001b'); // Cancel
				await new Promise((resolve) => setTimeout(resolve, 50));
			}

			// Should still be responsive
			await stdin.write('1');
			await new Promise((resolve) => setTimeout(resolve, 100));
			const frame = lastFrame();
			expect(frame).toContain('All Tasks');
		});
	});
});
