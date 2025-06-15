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
	const docsDir = path.join(taskMasterDir, 'docs');
	fs.mkdirSync(docsDir, { recursive: true });

	// Write initial tasks.json with proper structure
	const tasksFile = path.join(tasksDir, 'tasks.json');
	const tasksData = {
		default: initialData
	};
	fs.writeFileSync(tasksFile, JSON.stringify(tasksData, null, 2));

	// Create config.json
	const configFile = path.join(taskMasterDir, 'config.json');
	const configData = {
		models: {
			main: {
				provider: 'anthropic',
				modelId: 'claude-3-5-sonnet-20241022',
				maxTokens: 100000
			},
			research: {
				provider: 'perplexity',
				modelId: 'sonar-pro',
				maxTokens: 50000
			},
			fallback: {
				provider: 'openai',
				modelId: 'gpt-4o',
				maxTokens: 50000
			}
		},
		settings: {}
	};
	fs.writeFileSync(configFile, JSON.stringify(configData, null, 2));

	// Create supported-models.json
	const modelsFile = path.join(taskMasterDir, 'supported-models.json');
	const modelsData = [
		{
			id: 'claude-3-5-sonnet-20241022',
			provider: 'anthropic',
			swe_score: 49.0,
			cost_per_1m_tokens: { input: 3.0, output: 15.0 },
			allowed_roles: ['main', 'fallback']
		},
		{
			id: 'gpt-4o',
			provider: 'openai',
			swe_score: 38.2,
			cost_per_1m_tokens: { input: 2.5, output: 10.0 },
			allowed_roles: ['main', 'fallback']
		},
		{
			id: 'sonar-pro',
			provider: 'perplexity',
			swe_score: null,
			cost_per_1m_tokens: { input: 3.0, output: 15.0 },
			allowed_roles: ['research']
		}
	];
	fs.writeFileSync(modelsFile, JSON.stringify(modelsData, null, 2));

	// Create PRD document to prevent onboarding flow
	const prdFile = path.join(docsDir, 'prd.txt');
	const prdContent = `Product Requirements Document

This is a test project for automated testing.

Features:
- Feature A implementation
- Bug B fix
- Documentation updates
- Code review process

Goals:
- Ensure robust testing
- Maintain code quality
`;
	fs.writeFileSync(prdFile, prdContent);

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

	// Update task status (handle tag structure)
	const tag = Object.keys(data)[0]; // Get first tag (usually 'default')
	const task = data[tag].tasks.find((t) => t.id === taskId);
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

	// Add new task (handle tag structure)
	const tag = Object.keys(data)[0]; // Get first tag (usually 'default')
	data[tag].tasks.push(newTask);

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
	const data = JSON.parse(fs.readFileSync(tasksFile, 'utf8'));
	// Return the data for the first tag (usually 'default')
	const tag = Object.keys(data)[0];
	return data[tag];
}
