import {
	listTasks,
	setTaskStatus,
	findNextTask,
	analyzeTaskComplexity,
	findTaskById,
	taskExists
} from '../../task-manager.js';
import { readJSON } from '../../utils.js';
import { TASKMASTER_TASKS_FILE } from '../../../../src/constants/paths.js';
import { findProjectRoot } from '../../utils.js';
import path from 'path';
import fs from 'fs';

export class TaskService {
	constructor(projectRoot) {
		this.projectRoot = projectRoot;
		this.tasksFile = path.join(projectRoot, TASKMASTER_TASKS_FILE);
		this.lastModified = null;
		this.lastFileSize = null;
		this.lastCheckTime = 0;
	}

	async fetchTasks(filters = {}) {
		try {
			// Use 'json' format to suppress banner output
			// Always include subtasks - this is required for proper display
			const result = await listTasks(
				this.tasksFile,
				filters.status,
				null,
				true,
				'json'
			);
			return result.tasks || [];
		} catch (error) {
			// Silent error - don't interfere with Ink rendering
			return [];
		}
	}

	async updateTaskStatus(taskId, newStatus) {
		try {
			// Pass mcpLog option to prevent process.exit on error
			await setTaskStatus(this.tasksFile, taskId, newStatus, { mcpLog: true });
			return true;
		} catch (error) {
			// Silent error - don't interfere with Ink rendering
			return false;
		}
	}

	async getTaskById(taskId) {
		try {
			return await findTaskById(taskId, this.tasksFile);
		} catch (error) {
			// Silent error - don't interfere with Ink rendering
			return null;
		}
	}

	async getNextTask() {
		try {
			const nextTask = await findNextTask(this.tasksFile);
			return nextTask;
		} catch (error) {
			// Silent error - don't interfere with Ink rendering
			return null;
		}
	}

	async getTasksData() {
		try {
			if (!fs.existsSync(this.tasksFile)) {
				return {
					tasks: [],
					metadata: {
						totalTasks: 0,
						pendingTasks: 0,
						completedTasks: 0,
						inProgressTasks: 0
					}
				};
			}

			// Use listTasks to get tasks with subtasks included
			// Always pass true for withSubtasks to ensure consistent display
			const result = await listTasks(this.tasksFile, null, null, true, 'json');
			const tasks = result.tasks || [];

			const metadata = {
				totalTasks: tasks.length,
				pendingTasks: tasks.filter((t) => t.status === 'pending').length,
				completedTasks: tasks.filter((t) => t.status === 'done').length,
				inProgressTasks: tasks.filter((t) => t.status === 'in-progress').length,
				lastUpdated: new Date().toISOString()
			};

			return { tasks, metadata };
		} catch (error) {
			// Silent error - don't interfere with Ink rendering
			return {
				tasks: [],
				metadata: {
					totalTasks: 0,
					pendingTasks: 0,
					completedTasks: 0,
					inProgressTasks: 0
				}
			};
		}
	}

	hasTasksFileChanged() {
		if (!fs.existsSync(this.tasksFile)) {
			return false;
		}

		try {
			const now = Date.now();

			// Rate limit checks to prevent rapid firing
			if (now - this.lastCheckTime < 500) {
				return false;
			}
			this.lastCheckTime = now;

			const stats = fs.statSync(this.tasksFile);
			const currentModified = stats.mtime.getTime();
			const currentSize = stats.size;

			// Always return true on first check to ensure initial data has subtasks
			if (this.lastModified === null) {
				this.lastModified = currentModified;
				this.lastFileSize = currentSize;
				return true;
			}

			// Check both modification time AND file size
			// This helps detect real changes vs spurious filesystem events
			if (
				currentModified !== this.lastModified ||
				currentSize !== this.lastFileSize
			) {
				// Additional guard: ensure the change is significant
				const timeSinceLastChange = Math.abs(
					currentModified - this.lastModified
				);
				const sizeChanged = currentSize !== this.lastFileSize;

				// Only consider it a real change if:
				// 1. File size actually changed, OR
				// 2. More than 100ms has passed since last modification
				if (sizeChanged || timeSinceLastChange > 100) {
					this.lastModified = currentModified;
					this.lastFileSize = currentSize;
					return true;
				}
			}

			return false;
		} catch (error) {
			// If we can't stat the file, assume no change
			return false;
		}
	}

	async watchForChanges(callback, interval = 1000) {
		// Initial data load
		const initialData = await this.getTasksData();
		callback(initialData);

		// Track last update time to prevent rapid updates
		let lastUpdateTime = Date.now();
		let updateTimer = null;
		let isUpdating = false;

		const checkAndUpdate = async () => {
			const now = Date.now();

			// Skip if we're already updating or updated less than 1.5 seconds ago
			if (isUpdating || now - lastUpdateTime < 1500) {
				return;
			}

			if (this.hasTasksFileChanged()) {
				// Clear any pending update
				clearTimeout(updateTimer);

				// Schedule update with a delay to batch multiple changes
				updateTimer = setTimeout(async () => {
					// Double-check we're not in a rapid update loop
					const currentTime = Date.now();
					if (currentTime - lastUpdateTime < 1000) {
						return;
					}

					isUpdating = true;
					lastUpdateTime = currentTime;

					try {
						const data = await this.getTasksData();
						callback(data);
					} finally {
						// Ensure we reset the flag even if there's an error
						setTimeout(() => {
							isUpdating = false;
						}, 500); // Give it 500ms cooldown
					}
				}, 300);
			}
		};

		// Use simple polling with file modification check
		const intervalId = setInterval(checkAndUpdate, interval);

		// Return cleanup function
		return () => {
			clearInterval(intervalId);
			clearTimeout(updateTimer);
		};
	}
}

export function createTaskService(projectRoot = null) {
	const root = projectRoot || findProjectRoot();
	if (!root) {
		throw new Error(
			'No task-master project found. Run "task-master init" to initialize a project.'
		);
	}
	return new TaskService(root);
}
