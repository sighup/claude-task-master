/**
 * Helper functions for task selection and manipulation
 */

/**
 * Get the selected task or subtask based on the current selection index
 * @param {Array} tasks - Array of tasks
 * @param {number} selectedIndex - Current selected index
 * @param {boolean} showSubtasks - Whether subtasks are being displayed
 * @returns {Object} Object containing task and subtask information
 */
export function getSelectedTaskInfo(tasks, selectedIndex, showSubtasks) {
	if (!tasks || tasks.length === 0 || selectedIndex < 0) {
		return { task: null, subtask: null, isSubtask: false };
	}

	if (!showSubtasks) {
		// Simple case - direct task selection
		return {
			task: tasks[selectedIndex] || null,
			subtask: null,
			isSubtask: false
		};
	}

	// Complex case - need to account for subtasks
	let currentLineIndex = 0;
	
	for (const task of tasks) {
		// Check if we're on the parent task line
		if (currentLineIndex === selectedIndex) {
			return {
				task,
				subtask: null,
				isSubtask: false
			};
		}
		
		currentLineIndex++;
		
		// Check subtasks
		if (task.subtasks && task.subtasks.length > 0) {
			for (let i = 0; i < task.subtasks.length; i++) {
				if (currentLineIndex === selectedIndex) {
					return {
						task,
						subtask: task.subtasks[i],
						isSubtask: true,
						subtaskIndex: i
					};
				}
				currentLineIndex++;
			}
		}
	}
	
	return { task: null, subtask: null, isSubtask: false };
}

/**
 * Format subtask ID in the expected format
 * @param {string} parentId - Parent task ID
 * @param {number} subtaskIndex - Subtask index (0-based)
 * @returns {string} Formatted subtask ID like "5.1"
 */
export function formatSubtaskId(parentId, subtaskIndex) {
	return `${parentId}.${subtaskIndex + 1}`;
}