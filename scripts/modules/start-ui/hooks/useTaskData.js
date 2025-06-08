import { useState, useEffect, useRef, useCallback } from 'react';
import { createStableTaskService } from '../services/StableTaskService.js';

/**
 * React hook for managing task data with optional auto-refresh
 * @param {string} projectRoot - The root directory of the Task Master project
 * @param {Object} [options={}] - Configuration options
 * @param {boolean} [options.autoRefresh=true] - Enable automatic refresh on file changes
 * @param {number} [options.refreshInterval=1000] - Refresh interval in milliseconds
 * @param {Object} [options.filters={}] - Task filters to apply
 * @param {string} [options.filters.status] - Filter tasks by status
 * @returns {Object} Hook state and methods
 * @returns {Array} returns.tasks - Array of tasks
 * @returns {boolean} returns.loading - Loading state
 * @returns {string|null} returns.error - Error message if any
 * @returns {Object} returns.metadata - Task statistics metadata
 * @returns {Function} returns.refreshTasks - Manual refresh function
 * @returns {Function} returns.updateTaskStatus - Update task status function
 * @returns {Function} returns.getTaskById - Get task by ID function
 * @returns {Function} returns.getNextTask - Get next available task function
 */
export function useTaskData(projectRoot, options = {}) {
	const { refreshInterval = 1000, filters = {}, autoRefresh = true } = options;

	const [tasks, setTasks] = useState([]);
	const [metadata, setMetadata] = useState({
		totalTasks: 0,
		pendingTasks: 0,
		completedTasks: 0,
		inProgressTasks: 0
	});
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const taskServiceRef = useRef(null);
	const cleanupRef = useRef(null);
	const isUnmountingRef = useRef(false);
	const allTasksRef = useRef([]);
	const hasInitialDataRef = useRef(false);
	const isChangingFilterRef = useRef(false);

	// Helper function to apply filters
	const applyFilter = useCallback((tasksToFilter, status) => {
		if (!status) return tasksToFilter;

		return tasksToFilter.filter((task) => {
			// Include task if it matches the status
			if (task.status === status) return true;

			// Also include task if any of its subtasks match the status
			if (task.subtasks && task.subtasks.length > 0) {
				return task.subtasks.some((subtask) => subtask.status === status);
			}

			return false;
		});
	}, []);

	useEffect(() => {
		try {
			taskServiceRef.current = createStableTaskService(projectRoot);
			setError(null);
		} catch (err) {
			setError(err.message);
			setLoading(false);
			return;
		}

		// Remove duplicate - use the one defined outside

		const loadTasksData = async (skipLoadingState = false) => {
			try {
				// Only show loading on initial load or refresh, not filter changes
				if (!skipLoadingState && !hasInitialDataRef.current) {
					setLoading(true);
				}

				const data = await taskServiceRef.current.getTasksData();
				allTasksRef.current = data.tasks; // Store all tasks

				// Apply filter to the loaded data
				const filteredTasks = applyFilter(data.tasks, filters.status);

				setTasks(filteredTasks);
				setMetadata(data.metadata);
				hasInitialDataRef.current = true;
				setLoading(false);
				setError(null);
			} catch (err) {
				setError(`Failed to load tasks: ${err.message}`);
				setLoading(false);
			}
		};

		// Always load initial data
		loadTasksData();

		if (autoRefresh) {
			try {
				cleanupRef.current = taskServiceRef.current.watchForChanges((data) => {
					// Store all tasks and let the filter effect handle filtering
					allTasksRef.current = data.tasks;
					setMetadata(data.metadata);

					// Apply current filter
					const filteredTasks = applyFilter(data.tasks, filters.status);
					setTasks(filteredTasks);
					setLoading(false);
				}, refreshInterval);
			} catch (err) {
				// Silent error - don't interfere with Ink rendering
				cleanupRef.current = null;
				setError(`Failed to setup file watching: ${err.message}`);
			}
		} else {
			cleanupRef.current = null; // Ensure cleanup ref is properly set
		}

		return () => {
			isUnmountingRef.current = true;
			if (cleanupRef.current && typeof cleanupRef.current === 'function') {
				try {
					cleanupRef.current();
				} catch (err) {
					// Ignore cleanup errors during unmount
				}
			}
			cleanupRef.current = null;
		};
	}, [projectRoot, refreshInterval, autoRefresh]); // Removed applyFilter to prevent re-runs

	// Separate effect for filter changes
	useEffect(() => {
		// Skip on initial mount or if we haven't loaded any data yet
		if (!hasInitialDataRef.current || allTasksRef.current.length === 0) {
			return;
		}

		// Mark that we're changing filters
		isChangingFilterRef.current = true;

		// Apply filter using the shared function
		const filteredTasks = applyFilter(allTasksRef.current, filters.status);
		setTasks(filteredTasks);

		// Reset flag after a delay
		setTimeout(() => {
			isChangingFilterRef.current = false;
		}, 1000);
	}, [filters.status, applyFilter]);

	const updateTaskStatus = async (taskId, newStatus) => {
		if (!taskServiceRef.current) return false;

		try {
			const success = await taskServiceRef.current.updateTaskStatus(
				taskId,
				newStatus
			);
			if (success && !autoRefresh) {
				const data = await taskServiceRef.current.getTasksData();
				allTasksRef.current = data.tasks; // Store all tasks

				// Apply filter
				const filteredTasks = applyFilter(data.tasks, filters.status);
				setTasks(filteredTasks);
				setMetadata(data.metadata);
			}
			return success;
		} catch (err) {
			setError(`Failed to update task: ${err.message}`);
			return false;
		}
	};

	const getTaskById = async (taskId) => {
		if (!taskServiceRef.current) return null;
		return await taskServiceRef.current.getTaskById(taskId);
	};

	const getNextTask = useCallback(async () => {
		if (!taskServiceRef.current) return null;
		return await taskServiceRef.current.getNextTask();
	}, []);

	const refreshTasks = async () => {
		if (!taskServiceRef.current) return;

		// Don't show loading state for manual refresh to avoid flashing
		try {
			const data = await taskServiceRef.current.getTasksData();
			allTasksRef.current = data.tasks; // Store all tasks

			let filteredTasks = data.tasks;
			if (filters.status) {
				filteredTasks = filteredTasks.filter((task) => {
					// Include task if it matches the status
					if (task.status === filters.status) return true;

					// Also include task if any of its subtasks match the status
					if (task.subtasks && task.subtasks.length > 0) {
						return task.subtasks.some(
							(subtask) => subtask.status === filters.status
						);
					}

					return false;
				});
			}
			setTasks(filteredTasks);
			setMetadata(data.metadata);
			setError(null);
		} catch (err) {
			setError(`Failed to refresh tasks: ${err.message}`);
		}
	};

	return {
		tasks,
		metadata,
		loading: loading && !hasInitialDataRef.current, // Only show loading on initial load
		error,
		updateTaskStatus,
		getTaskById,
		getNextTask,
		refreshTasks
	};
}
