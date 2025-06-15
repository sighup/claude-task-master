import {
	listTasks,
	setTaskStatus,
	findNextTask,
	analyzeTaskComplexity,
	findTaskById,
	taskExists,
	generateTaskFiles,
	addTask,
	removeTask
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
	 * Generates individual task files from the tasks.json
	 * @returns {Promise<boolean>} True if generation succeeded, false otherwise
	 */
	async generateTaskFiles() {
		try {
			const outputDir = path.dirname(this.tasksFile);
			await generateTaskFiles(this.tasksFile, outputDir, { mcpLog: true });
			return true;
		} catch (error) {
			// Silent error - don't interfere with Ink rendering
			return false;
		}
	}

	/**
	 * Adds a new task
	 * @param {Object} taskData - Task data object
	 * @param {string} taskData.title - Task title
	 * @param {string} taskData.description - Task description
	 * @param {string} taskData.priority - Task priority
	 * @param {Array<number>} taskData.dependencies - Task dependencies
	 * @returns {Promise<boolean>} True if task was added successfully
	 */
	async addTask(taskData) {
		try {
			// Set flag to prevent file watch from triggering during our own write
			this.updateInProgress = true;

			// Determine if this is manual mode (has title and description)
			const isManualMode = taskData.title && taskData.description;
			let manualTaskData = null;

			if (isManualMode) {
				// Prepare manual task data
				manualTaskData = {
					title: taskData.title,
					description: taskData.description,
					details: taskData.details || '',
					testStrategy: taskData.testStrategy || ''
				};
			}

			// Create a logger object (silent to not interfere with Ink rendering)
			const mcpLog = {
				info: () => {},
				warn: () => {},
				error: () => {},
				debug: () => {},
				success: () => {}
			};

			// Use addTask from task-manager
			const context = {
				mcpLog,
				projectRoot: this.projectRoot
			};

			await addTask(
				this.tasksFile,
				taskData.prompt || '', // prompt for AI generation (empty for manual)
				taskData.dependencies || [],
				taskData.priority || 'medium',
				context,
				'json', // outputFormat
				manualTaskData, // manual task data if applicable
				taskData.research || false // useResearch flag
			);

			// Update our cached modification time to prevent detecting our own change
			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			// Log error for debugging (only in non-test environments)
			if (process.env.NODE_ENV !== 'test') {
				console.error('[StableTaskService.addTask] Error:', error.message);
				console.error('[StableTaskService.addTask] Stack:', error.stack);
			}
			return false;
		} finally {
			// Clear the flag after a delay to account for filesystem delays
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Removes a task
	 * @param {string|number} taskId - ID of task to remove
	 * @returns {Promise<boolean>} True if task was removed successfully
	 */
	async removeTask(taskId) {
		try {
			// Set flag to prevent file watch from triggering during our own write
			this.updateInProgress = true;

			// Create a logger object (silent to not interfere with Ink rendering)
			const mcpLog = {
				info: () => {},
				warn: () => {},
				error: () => {},
				debug: () => {},
				success: () => {}
			};

			// Use removeTask from task-manager
			// removeTask expects a comma-separated string of task IDs
			const result = await removeTask(this.tasksFile, String(taskId));
			
			// Check if removal was successful
			if (!result.success) {
				throw new Error(result.errors.join(', '));
			}

			// Update our cached modification time to prevent detecting our own change
			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			// Log error for debugging (only in non-test environments)
			if (process.env.NODE_ENV !== 'test') {
				console.error('[StableTaskService.removeTask] Error:', error.message);
			}
			return false;
		} finally {
			// Clear the flag after a delay to account for filesystem delays
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Updates an existing task
	 * @param {string|number} taskId - ID of task to update
	 * @param {Object} taskData - Updated task data
	 * @returns {Promise<boolean>} True if task was updated successfully
	 */
	async updateTask(taskId, taskData) {
		try {
			// Set flag to prevent file watch from triggering during our own write
			this.updateInProgress = true;

			// Use updateTaskById from task-manager
			const { updateTaskById } = await import('../../task-manager/update-task-by-id.js');
			await updateTaskById(
				this.tasksFile,
				taskId,
				taskData.prompt || taskData.title,
				{ mcpLog: true }
			);

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

	/**
	 * Sync tasks to README file
	 * @returns {Promise<Object>} Result object with success status and path
	 */
	async syncReadme() {
		try {
			const { syncTasksToReadme } = await import('../../sync-readme.js');
			const result = await syncTasksToReadme(this.projectRoot, {
				withSubtasks: false,
				tasksPath: this.tasksFile
			});
			return {
				success: result,
				path: path.join(this.projectRoot, 'README.md')
			};
		} catch (error) {
			return {
				success: false,
				error: error.message
			};
		}
	}

	/**
	 * Batch update multiple tasks
	 * @param {string|number} fromId - Starting task ID
	 * @param {string} prompt - Update prompt
	 * @returns {Promise<boolean>} True if successful
	 */
	async batchUpdate(fromId, prompt) {
		try {
			this.updateInProgress = true;
			const { updateTasks } = await import('../../task-manager/update-tasks.js');
			await updateTasks(this.tasksFile, fromId, prompt, { mcpLog: true });

			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Update a subtask
	 * @param {string} subtaskId - Subtask ID in format "parentId.subtaskId"
	 * @param {string} prompt - Update prompt
	 * @returns {Promise<boolean>} True if successful
	 */
	async updateSubtask(subtaskId, prompt) {
		try {
			this.updateInProgress = true;
			const { updateSubtaskById } = await import('../../task-manager/update-subtask-by-id.js');
			await updateSubtaskById(this.tasksFile, subtaskId, prompt, { mcpLog: true });

			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Add a subtask to a parent task
	 * @param {string|number} parentId - Parent task ID
	 * @param {Object} subtaskData - Subtask data
	 * @returns {Promise<boolean>} True if successful
	 */
	async addSubtask(parentId, subtaskData) {
		try {
			this.updateInProgress = true;
			const { default: addSubtask } = await import('../../task-manager/add-subtask.js');
			
			// Prepare subtask data in the format expected by addSubtask
			const newSubtaskData = {
				title: subtaskData.title,
				description: subtaskData.description || '',
				details: subtaskData.details || '',
				status: subtaskData.status || 'pending',
				dependencies: subtaskData.dependencies || []
			};
			
			await addSubtask(
				this.tasksFile,
				parentId,
				subtaskData.taskId || null,  // existingTaskId (if converting)
				newSubtaskData,               // newSubtaskData
				true                          // generateFiles
			);

			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			// Log error for debugging
			if (process.env.NODE_ENV !== 'test') {
				console.error('[StableTaskService.addSubtask] Error:', error.message);
				console.error('[StableTaskService.addSubtask] Stack:', error.stack);
			}
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Remove a subtask
	 * @param {string|number} parentId - Parent task ID
	 * @param {string|number} subtaskId - Subtask ID (just the number)
	 * @param {boolean} convert - Whether to convert to standalone task
	 * @returns {Promise<boolean>} True if successful
	 */
	async removeSubtask(parentId, subtaskId, convert = false) {
		try {
			this.updateInProgress = true;
			const { removeSubtask } = await import('../../task-manager/remove-subtask.js');
			const fullSubtaskId = `${parentId}.${subtaskId}`;
			await removeSubtask(
				this.tasksFile,
				fullSubtaskId,
				convert,
				true // generateFiles
			);

			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Clear subtasks from tasks
	 * @param {boolean} all - Whether to clear all subtasks
	 * @returns {Promise<boolean>} True if successful
	 */
	async clearSubtasks(all = true) {
		try {
			this.updateInProgress = true;
			const { clearSubtasks } = await import('../../task-manager/clear-subtasks.js');
			
			if (all) {
				const data = readJSON(this.tasksFile);
				if (!data || !data.tasks) return false;

				const tasksWithSubtasks = data.tasks
					.filter(t => t.subtasks && t.subtasks.length > 0)
					.map(t => t.id);

				if (tasksWithSubtasks.length === 0) return true;

				await clearSubtasks(this.tasksFile, tasksWithSubtasks.join(','));
			} else {
				throw new Error('Clearing specific tasks not yet implemented');
			}

			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Parse a PRD document to generate tasks
	 * @param {Object} options - Parse options
	 * @returns {Promise<boolean>} True if successful
	 */
	async parsePrd(options) {
		try {
			this.updateInProgress = true;
			const parsePRD = (await import('../../task-manager/parse-prd.js')).default;
			const { input, numTasks = 10, research = false, append = false, force = true } = options;
			
			if (process.env.NODE_ENV !== 'test') {
				console.error(`[StableTaskService.parsePrd] Parsing PRD to: ${this.tasksFile}`);
			}

			// Create a logger object that captures messages
			const logMessages = [];
			const mcpLog = {
				info: (msg) => {
					logMessages.push(`[INFO] ${msg}`);
				},
				warn: (msg) => {
					logMessages.push(`[WARN] ${msg}`);
				},
				error: (msg) => {
					logMessages.push(`[ERROR] ${msg}`);
				},
				debug: (msg) => {
					logMessages.push(`[DEBUG] ${msg}`);
				},
				success: (msg) => {
					logMessages.push(`[SUCCESS] ${msg}`);
				}
			};

			await parsePRD(
				input,
				this.tasksFile,
				numTasks,
				{
					force,
					append,
					research,
					mcpLog,
					projectRoot: this.projectRoot
				}
			);
			

			// Verify the file was created
			if (!fs.existsSync(this.tasksFile)) {
				return false;
			}
			
			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;
			

			return true;
		} catch (error) {
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Analyze task complexity
	 * @param {Object} options - Analysis options
	 * @returns {Promise<boolean>} True if successful
	 */
	async analyzeComplexity(options) {
		try {
			const { threshold = 5, research = false, id } = options;
			const complexityOptions = {
				file: this.tasksFile,
				threshold,
				research,
				output: path.join(this.projectRoot, '.taskmaster/reports/task-complexity-report.json')
			};

			if (id) {
				complexityOptions.id = id;
			}

			await analyzeTaskComplexity(complexityOptions, {
				mcpLog: {
					info: () => {},
					warn: () => {},
					error: () => {},
					debug: () => {},
					success: () => {}
				}
			});

			return true;
		} catch (error) {
			return false;
		}
	}

	/**
	 * Expand a task into subtasks
	 * @param {string|number} taskId - Task ID to expand
	 * @param {number} numSubtasks - Number of subtasks to generate
	 * @param {Object} options - Expansion options
	 * @returns {Promise<boolean>} True if successful
	 */
	async expandTask(taskId, numSubtasks, options = {}) {
		try {
			this.updateInProgress = true;
			const expandTask = (await import('../../task-manager/expand-task.js')).default;
			const { research = false, prompt = '' } = options;

			// Create a logger object (silent to not interfere with Ink rendering)
			const mcpLog = {
				info: () => {},
				warn: () => {},
				error: () => {},
				debug: () => {},
				success: () => {}
			};

			await expandTask(
				this.tasksFile,
				taskId,
				numSubtasks,
				research,
				prompt,
				{ mcpLog, projectRoot: this.projectRoot },
				false // force parameter
			);

			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			// Log error details for debugging (only in non-production)
			if (process.env.NODE_ENV !== 'production') {
				console.error('[StableTaskService.expandTask] Error:', error.message);
			}
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Expand all tasks based on complexity
	 * @param {Object} options - Expansion options
	 * @returns {Promise<boolean>} True if successful
	 */
	async expandAll(options = {}) {
		try {
			this.updateInProgress = true;
			const expandAllTasks = (await import('../../task-manager/expand-all-tasks.js')).default;
			const { threshold = 5, research = false, prompt = '' } = options;

			// Create a logger object (silent to not interfere with Ink rendering)
			const mcpLog = {
				info: () => {},
				warn: () => {},
				error: () => {},
				debug: () => {},
				success: () => {}
			};

			await expandAllTasks(
				this.tasksFile,
				null, // numSubtasks - let it use defaults/complexity
				research,
				prompt,
				false, // force
				threshold,
				{ mcpLog, projectRoot: this.projectRoot }
			);

			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			// Log error details for debugging (only in non-production)
			if (process.env.NODE_ENV !== 'production') {
				console.error('[StableTaskService.expandAll] Error:', error.message);
			}
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Get complexity report
	 * @returns {Promise<Object|null>} Complexity report or null
	 */
	async getComplexityReport() {
		try {
			const { readComplexityReport } = await import('../../task-manager.js');
			const { COMPLEXITY_REPORT_FILE } = await import('../../../../src/constants/paths.js');
			const reportPath = path.join(this.projectRoot, COMPLEXITY_REPORT_FILE);

			if (!fs.existsSync(reportPath)) {
				return null;
			}

			const report = await readComplexityReport(reportPath);
			return report;
		} catch (error) {
			return null;
		}
	}

	/**
	 * Add a dependency to a task
	 * @param {string|number} taskId - Task ID
	 * @param {string|number} dependsOn - Dependency task ID
	 * @returns {Promise<boolean>} True if successful
	 */
	async addDependency(taskId, dependsOn) {
		try {
			this.updateInProgress = true;
			const { addDependency } = await import('../../dependency-manager.js');
			await addDependency(this.tasksFile, taskId, dependsOn);

			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Remove a dependency from a task
	 * @param {string|number} taskId - Task ID
	 * @param {string|number} dependsOn - Dependency task ID to remove
	 * @returns {Promise<boolean>} True if successful
	 */
	async removeDependency(taskId, dependsOn) {
		try {
			this.updateInProgress = true;
			const { removeDependency } = await import('../../dependency-manager.js');
			await removeDependency(this.tasksFile, taskId, dependsOn);

			const stats = fs.statSync(this.tasksFile);
			this.lastModified = stats.mtime.getTime();
			this.lastFileSize = stats.size;

			return true;
		} catch (error) {
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
	}

	/**
	 * Validate task dependencies
	 * @returns {Promise<Object|null>} Validation result
	 */
	async validateDependencies() {
		try {
			const { validateTaskDependencies } = await import('../../dependency-manager.js');
			const data = readJSON(this.tasksFile);
			if (!data || !data.tasks) {
				return {
					valid: false,
					issues: [{
						type: 'error',
						message: 'No valid tasks found in tasks.json'
					}]
				};
			}

			const validationResult = validateTaskDependencies(data.tasks);
			return validationResult;
		} catch (error) {
			return {
				valid: false,
				issues: [{
					type: 'error',
					message: `Error validating dependencies: ${error.message}`
				}]
			};
		}
	}

	/**
	 * Fix invalid dependencies
	 * @returns {Promise<boolean>} True if successful
	 */
	async fixDependencies() {
		try {
			this.updateInProgress = true;
			const { fixDependenciesCommand } = await import('../../dependency-manager.js');
			
			// Temporarily override process.exit to prevent it
			const originalExit = process.exit;
			let exitCalled = false;

			process.exit = (code) => {
				exitCalled = true;
				throw new Error(`Process exit called with code: ${code}`);
			};

			try {
				await fixDependenciesCommand(this.tasksFile, { mcpLog: true });
				const stats = fs.statSync(this.tasksFile);
				this.lastModified = stats.mtime.getTime();
				this.lastFileSize = stats.size;
				return !exitCalled;
			} finally {
				process.exit = originalExit;
			}
		} catch (error) {
			return false;
		} finally {
			setTimeout(() => {
				this.updateInProgress = false;
			}, 1000);
		}
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
