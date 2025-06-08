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

/**
 * A stable task service that provides file watching with debouncing and self-change detection.
 * This service prevents rapid file system polling and circular update loops when the service
 * itself modifies the tasks file.
 */
export class StableTaskService {
	/**
	 * Creates a new StableTaskService instance
	 * @param {string} projectRoot - The root directory of the Task Master project
	 */
	constructor(projectRoot) {
		this.projectRoot = projectRoot;
		this.tasksFile = path.join(projectRoot, TASKMASTER_TASKS_FILE);
		this.lastModified = null;
		this.lastFileSize = null;
		this.lastCheckTime = 0;
		this.lastDataHash = null;
		this.updateInProgress = false;
		this.minUpdateInterval = 3000; // Minimum 3 seconds between updates
		this.lastUpdateTime = 0;
	}

	/**
	 * Fetches tasks from the tasks file with optional filtering
	 * @param {Object} filters - Filter options
	 * @param {string} [filters.status] - Filter by task status
	 * @returns {Promise<Array>} Array of tasks
	 */
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

	/**
	 * Updates a task's status with self-change detection
	 * @param {string|number} taskId - The ID of the task to update
	 * @param {string} newStatus - The new status value
	 * @returns {Promise<boolean>} True if update succeeded, false otherwise
	 */
	async updateTaskStatus(taskId, newStatus) {
		try {
			// Set flag to prevent file watch from triggering during our own write
			this.updateInProgress = true;

			// Pass mcpLog option to prevent process.exit on error
			await setTaskStatus(this.tasksFile, taskId, newStatus, { mcpLog: true });

			// Update our cached modification time to prevent detecting our own change
			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			// Silent error - don't interfere with Ink rendering
			return false;
		} finally {
			// Clear the flag after a delay to account for filesystem delays
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Retrieves a specific task by ID
	 * @param {string|number} taskId - The ID of the task to retrieve
	 * @returns {Promise<Object|null>} The task object or null if not found
	 */
	async getTaskById(taskId) {
		try {
			return await findTaskById(taskId, this.tasksFile);
		} catch (error) {
			// Silent error - don't interfere with Ink rendering
			return null;
		}
	}

	/**
	 * Finds the next available task based on dependencies and status
	 * @returns {Promise<Object|null>} The next task or null if none available
	 */
	async getNextTask() {
		try {
			const nextTask = await findNextTask(this.tasksFile);
			return nextTask;
		} catch (error) {
			// Silent error - don't interfere with Ink rendering
			return null;
		}
	}

	/**
	 * Retrieves all tasks data with computed metadata
	 * @returns {Promise<Object>} Object containing tasks array and metadata
	 */
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

	/**
	 * Checks if the tasks file has been modified since last check
	 * Implements rate limiting and self-change detection
	 * @returns {boolean} True if file has changed, false otherwise
	 */
	hasTasksFileChanged() {
		// Skip if we're in the middle of our own update
		if (this.updateInProgress) {
			return false;
		}

		if (!fs.existsSync(this.tasksFile)) {
			return false;
		}

		try {
			const now = Date.now();

			// Enforce minimum interval between checks
			if (now - this.lastCheckTime < 1000) {
				return false;
			}
			this.lastCheckTime = now;

			const stats = fs.statSync(this.tasksFile);
			const currentModified = stats.mtime.getTime();
			const currentSize = stats.size;

			// Always return true on first check
			if (this.lastModified === null) {
				this.lastModified = currentModified;
				this.lastFileSize = currentSize;
				return true;
			}

			// Check if file actually changed
			const hasChanged =
				currentModified !== this.lastModified ||
				currentSize !== this.lastFileSize;

			if (hasChanged) {
				// Additional check: ensure minimum time between updates
				if (now - this.lastUpdateTime < this.minUpdateInterval) {
					return false; // Too soon, ignore this change
				}

				this.lastModified = currentModified;
				this.lastFileSize = currentSize;
				this.lastUpdateTime = now;
				return true;
			}

			return false;
		} catch (error) {
			// If we can't stat the file, assume no change
			return false;
		}
	}

	/**
	 * Watches for changes to the tasks file and calls callback when changes are detected
	 * @param {Function} callback - Function to call with updated task data
	 * @param {number} [interval=1000] - Polling interval in milliseconds (minimum 2000ms)
	 * @returns {Promise<Function>} Cleanup function to stop watching
	 */
	async watchForChanges(callback, interval = 1000) {
		// Ensure minimum interval
		interval = Math.max(interval, 2000);

		// Initial data load
		const initialData = await this.getTasksData();
		callback(initialData);
		this.lastUpdateTime = Date.now();

		// Simple polling with robust checks
		const checkAndUpdate = async () => {
			// Skip if we're updating or it's too soon
			if (
				this.updateInProgress ||
				Date.now() - this.lastUpdateTime < this.minUpdateInterval
			) {
				return;
			}

			if (this.hasTasksFileChanged()) {
				try {
					const data = await this.getTasksData();
					callback(data);
				} catch (err) {
					// Silently ignore errors
				}
			}
		};

		// Use polling interval
		const intervalId = setInterval(checkAndUpdate, interval);

		// Return cleanup function
		return () => {
			clearInterval(intervalId);
		};
	}
}

/**
 * Factory function to create a StableTaskService instance
 * @param {string|null} [projectRoot=null] - The project root directory, or null to auto-detect
 * @returns {StableTaskService} A new StableTaskService instance
 * @throws {Error} If no project root is found
 */
export function createStableTaskService(projectRoot = null) {
	const root = projectRoot || findProjectRoot();
	if (!root) {
		throw new Error(
			'No task-master project found. Run "task-master init" to initialize a project.'
		);
	}
	return new StableTaskService(root);
}
