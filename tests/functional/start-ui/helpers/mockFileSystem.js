import fs from 'fs';
import path from 'path';
import os from 'os';

/**
 * Sets up a mock Task Master project with initial task data
 * @param {Object} initialData - Initial tasks data
 * @param {Array} initialData.tasks - Array of task objects
 * @returns {string} Path to the temporary project directory
 */
export function setupMockProject(initialData) {
	// Create temporary directory
	const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'taskmaster-test-'));
	const taskMasterDir = path.join(tmpDir, '.taskmaster');
	const tasksDir = path.join(taskMasterDir, 'tasks');

	// Create directory structure
	fs.mkdirSync(taskMasterDir, { recursive: true });
	fs.mkdirSync(tasksDir, { recursive: true });

	// Write initial tasks.json
	const tasksFile = path.join(tasksDir, 'tasks.json');
	fs.writeFileSync(tasksFile, JSON.stringify(initialData, null, 2));

	return tmpDir;
}

/**
 * Updates a task's status in the mock file system
 * @param {string} projectRoot - Project root directory
 * @param {number} taskId - ID of task to update
 * @param {string} newStatus - New status value
 */
export async function updateMockTaskStatus(projectRoot, taskId, newStatus) {
	const tasksFile = path.join(
		projectRoot,
		'.taskmaster',
		'tasks',
		'tasks.json'
	);
	const data = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));

	// Update task status
	const task = data.tasks.find((t) => t.id === taskId);
	if (task) {
		task.status = newStatus;

		// Write file with small delay to simulate real file system
		await new Promise((resolve) => setTimeout(resolve, 50));
		fs.writeFileSync(tasksFile, JSON.stringify(data, null, 2));
	}
}

/**
 * Adds a new task to the mock file system
 * @param {string} projectRoot - Project root directory
 * @param {Object} newTask - Task object to add
 */
export async function addMockTask(projectRoot, newTask) {
	const tasksFile = path.join(
		projectRoot,
		'.taskmaster',
		'tasks',
		'tasks.json'
	);
	const data = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));

	// Add new task
	data.tasks.push(newTask);

	// Write file
	await new Promise((resolve) => setTimeout(resolve, 50));
	fs.writeFileSync(tasksFile, JSON.stringify(data, null, 2));
}

/**
 * Cleans up a mock project directory
 * @param {string} projectRoot - Project root directory to clean up
 */
export function cleanupMockProject(projectRoot) {
	if (projectRoot && projectRoot.includes('taskmaster-test-')) {
		fs.rmSync(projectRoot, { recursive: true, force: true });
	}
}

/**
 * Gets the current tasks data from the mock file system
 * @param {string} projectRoot - Project root directory
 * @returns {Object} Current tasks data
 */
export function getMockTasksData(projectRoot) {
	const tasksFile = path.join(
		projectRoot,
		'.taskmaster',
		'tasks',
		'tasks.json'
	);
	return JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
}