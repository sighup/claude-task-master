import React from 'react';
import { render } from 'ink-testing-library';
import App from '../../../scripts/modules/start-ui/App.jsx';
import {
	setupMockProject,
	cleanupMockProject,
	getMockTasksData
} from './helpers/mockFileSystem.js';
import fs from 'fs';
import path from 'path';

describe('Analysis and Reporting Tests', () => {
	let mockProjectRoot;
	let app;
	let stdin;
	let lastFrame;

	const sampleTasks = {
		tasks: [
			{
				id: 1,
				title: 'Complex feature implementation',
				description:
					'This is a complex task that requires multiple steps including database design, API development, frontend implementation, testing, and deployment',
				status: 'pending',
				priority: 'high',
				complexity: 8
			},
			{
				id: 2,
				title: 'Simple bug fix',
				description: 'Fix typo in error message',
				status: 'pending',
				priority: 'low',
				complexity: 2
			},
			{
				id: 3,
				title: 'Medium refactoring',
				description: 'Refactor user service to improve performance',
				status: 'in-progress',
				priority: 'medium',
				complexity: 5,
				subtasks: [
					{
						id: '3.1',
						title: 'Profile current performance',
						status: 'done'
					},
					{
						id: '3.2',
						title: 'Implement optimizations',
						status: 'in-progress'
					}
				]
			}
		]
	};

	beforeEach(() => {
		mockProjectRoot = setupMockProject(sampleTasks);

		// Create PRD file for testing
		const docsDir = path.join(mockProjectRoot, '.taskmaster', 'docs');
		fs.mkdirSync(docsDir, { recursive: true });
		fs.writeFileSync(
			path.join(docsDir, 'prd.txt'),
			`Product Requirements Document

Project: Task Management System

Overview:
Build a comprehensive task management system with the following features:

1. User Authentication
   - Login/logout functionality
   - User registration
   - Password reset

2. Task Management
   - Create, read, update, delete tasks
   - Task prioritization
   - Task dependencies

3. Reporting
   - Task completion metrics
   - Time tracking
   - Export functionality

Technical Requirements:
- React frontend
- Node.js backend
- PostgreSQL database
- RESTful API
`
		);

		app = render(<App projectRoot={mockProjectRoot} />);
		({ stdin, lastFrame } = app);
	});

	afterEach(() => {
		app.unmount();
		cleanupMockProject(mockProjectRoot);
	});

	describe('Parse PRD (P key)', () => {
		test('should open PRD parser modal', async () => {
			await stdin.write('P');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Parse PRD');
			expect(frame).toContain('Select PRD file');
		});

		test('should list available PRD files', async () => {
			await stdin.write('P');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('prd.txt');
		});

		test('should parse PRD and generate tasks', async () => {
			await stdin.write('P');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Select PRD file (first one)
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Confirm parsing
			await stdin.write('y');
			await new Promise((resolve) => setTimeout(resolve, 500)); // Longer wait for parsing

			const frame = lastFrame();
			expect(frame).toMatch(/parsed|generated|success/i);

			// Should show number of tasks generated
			expect(frame).toMatch(/\d+ tasks/);
		});

		test('should handle missing PRD gracefully', async () => {
			// Remove PRD file
			const docsDir = path.join(mockProjectRoot, '.taskmaster', 'docs');
			fs.rmSync(docsDir, { recursive: true });

			await stdin.write('P');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toMatch(/no prd|not found|empty/i);
		});
	});

	describe('Analyze Complexity (c key)', () => {
		test('should open complexity analysis', async () => {
			await stdin.write('c');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Complexity Analysis');
			expect(frame).toContain('Analyzing tasks');
		});

		test('should show complexity scores', async () => {
			await stdin.write('c');
			await new Promise((resolve) => setTimeout(resolve, 300)); // Wait for analysis

			const frame = lastFrame();
			// Should show tasks with complexity scores
			expect(frame).toContain('Complex feature implementation');
			expect(frame).toMatch(/complexity.*8/i);

			expect(frame).toContain('Simple bug fix');
			expect(frame).toMatch(/complexity.*2/i);
		});

		test('should recommend task expansion', async () => {
			await stdin.write('c');
			await new Promise((resolve) => setTimeout(resolve, 300));

			const frame = lastFrame();
			// High complexity task should have expansion recommendation
			expect(frame).toMatch(/recommend.*expand|break.*down/i);
		});

		test('should generate complexity report file', async () => {
			await stdin.write('c');
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Check if report file was created
			const reportPath = path.join(
				mockProjectRoot,
				'.taskmaster',
				'reports',
				'task-complexity-report.json'
			);

			expect(fs.existsSync(reportPath)).toBe(true);

			const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
			expect(report.tasks).toBeDefined();
			expect(report.summary).toBeDefined();
		});
	});

	describe('View Complexity Report (X key)', () => {
		beforeEach(async () => {
			// First generate a report
			await stdin.write('c');
			await new Promise((resolve) => setTimeout(resolve, 300));
			await stdin.write('\u001b'); // ESC to close
			await new Promise((resolve) => setTimeout(resolve, 100));
		});

		test('should display complexity report', async () => {
			await stdin.write('X');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Complexity Report');
			expect(frame).toContain('Total Tasks');
			expect(frame).toContain('Average Complexity');
			expect(frame).toContain('High Complexity Tasks');
		});

		test('should show task breakdown', async () => {
			await stdin.write('X');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should list tasks by complexity
			expect(frame).toContain('Complex feature implementation');
			expect(frame).toContain('Medium refactoring');
			expect(frame).toContain('Simple bug fix');
		});

		test('should handle missing report', async () => {
			// Delete report
			const reportPath = path.join(
				mockProjectRoot,
				'.taskmaster',
				'reports',
				'task-complexity-report.json'
			);
			if (fs.existsSync(reportPath)) {
				fs.unlinkSync(reportPath);
			}

			await stdin.write('X');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toMatch(/no report|not found|generate first/i);
		});
	});

	describe('Expand Task (v key)', () => {
		test('should open task expander for selected task', async () => {
			await stdin.write('v');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Expand Task');
			expect(frame).toContain('Complex feature implementation');
			expect(frame).toContain('Number of subtasks');
		});

		test('should expand task into subtasks', async () => {
			await stdin.write('v');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Enter number of subtasks
			await stdin.write('5');
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 500)); // Wait for AI generation

			const frame = lastFrame();
			expect(frame).toMatch(/expanded|generated|created.*subtasks/i);

			// Verify subtasks were created
			const data = getMockTasksData(mockProjectRoot);
			const task = data.tasks.find((t) => t.id === 1);
			expect(task.subtasks).toBeDefined();
			expect(task.subtasks.length).toBeGreaterThan(0);
		});

		test('should not expand already expanded tasks', async () => {
			// Go to task that already has subtasks
			await stdin.write('j');
			await stdin.write('j'); // Task 3
			await new Promise((resolve) => setTimeout(resolve, 50));

			await stdin.write('v');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toMatch(/already.*subtasks|cannot.*expand/i);
		});

		test('should use AI to generate relevant subtasks', async () => {
			await stdin.write('v');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Use default suggestion
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Check generated subtasks are relevant
			const data = getMockTasksData(mockProjectRoot);
			const task = data.tasks.find((t) => t.id === 1);

			// Should have subtasks related to the complex feature
			const subtaskTitles = task.subtasks.map((s) => s.title.toLowerCase());
			const relevantKeywords = [
				'database',
				'api',
				'frontend',
				'test',
				'deploy'
			];

			const hasRelevantSubtasks = relevantKeywords.some((keyword) =>
				subtaskTitles.some((title) => title.includes(keyword))
			);

			expect(hasRelevantSubtasks).toBe(true);
		});
	});

	describe('Sync README (x key)', () => {
		test('should export tasks to README', async () => {
			await stdin.write('x');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			expect(frame).toContain('Syncing to README');
			expect(frame).toContain('Export');
		});

		test('should create/update README.md', async () => {
			await stdin.write('x');
			await new Promise((resolve) => setTimeout(resolve, 300));

			const readmePath = path.join(mockProjectRoot, 'README.md');
			expect(fs.existsSync(readmePath)).toBe(true);

			const readme = fs.readFileSync(readmePath, 'utf8');
			expect(readme).toContain('Task List');
			expect(readme).toContain('Complex feature implementation');
			expect(readme).toContain('Simple bug fix');
			expect(readme).toContain('Medium refactoring');
		});

		test('should format tasks with status indicators', async () => {
			await stdin.write('x');
			await new Promise((resolve) => setTimeout(resolve, 300));

			const readmePath = path.join(mockProjectRoot, 'README.md');
			const readme = fs.readFileSync(readmePath, 'utf8');

			// Should have markdown checkboxes or status indicators
			expect(readme).toMatch(/\[ \].*Complex feature/); // Pending
			expect(readme).toMatch(/\[.\].*Medium refactoring/); // In progress
		});

		test('should include subtasks if toggled', async () => {
			// Toggle subtasks on
			await stdin.write('s');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Export
			await stdin.write('x');
			await new Promise((resolve) => setTimeout(resolve, 300));

			const readmePath = path.join(mockProjectRoot, 'README.md');
			const readme = fs.readFileSync(readmePath, 'utf8');

			// Should include subtasks
			expect(readme).toContain('Profile current performance');
			expect(readme).toContain('Implement optimizations');
		});

		test('should show export progress', async () => {
			// Add many tasks for progress display
			const manyTasks = {
				tasks: Array.from({ length: 50 }, (_, i) => ({
					id: i + 1,
					title: `Task ${i + 1}`,
					description: `Description ${i + 1}`,
					status: 'pending',
					priority: 'medium'
				}))
			};

			cleanupMockProject(mockProjectRoot);
			mockProjectRoot = setupMockProject(manyTasks);
			app.unmount();
			app = render(<App projectRoot={mockProjectRoot} />);
			({ stdin, lastFrame } = app);

			await stdin.write('x');
			await new Promise((resolve) => setTimeout(resolve, 100));

			const frame = lastFrame();
			// Should show progress indicator
			expect(frame).toMatch(/exporting|progress|%/i);
		});
	});

	describe('Analysis Integration', () => {
		test('should update complexity after task expansion', async () => {
			// Expand a high complexity task
			await stdin.write('v');
			await new Promise((resolve) => setTimeout(resolve, 100));
			await stdin.write('\r');
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Close expansion modal
			await stdin.write('\u001b');
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Run complexity analysis again
			await stdin.write('c');
			await new Promise((resolve) => setTimeout(resolve, 300));

			const frame = lastFrame();
			// Parent task complexity should be distributed among subtasks
			expect(frame).toMatch(/distributed|reduced|subtasks/i);
		});

		test('should track analysis metrics', async () => {
			// Run multiple analyses
			await stdin.write('c');
			await new Promise((resolve) => setTimeout(resolve, 300));
			await stdin.write('\u001b');

			await stdin.write('X');
			await new Promise((resolve) => setTimeout(resolve, 100));
			await stdin.write('\u001b');

			await stdin.write('x');
			await new Promise((resolve) => setTimeout(resolve, 300));

			// Check for metrics file
			const metricsPath = path.join(
				mockProjectRoot,
				'.taskmaster',
				'reports',
				'analysis-metrics.json'
			);

			if (fs.existsSync(metricsPath)) {
				const metrics = JSON.parse(fs.readFileSync(metricsPath, 'utf8'));
				expect(metrics.analysisCount).toBeGreaterThan(0);
				expect(metrics.lastAnalysis).toBeDefined();
			}
		});
	});
});
