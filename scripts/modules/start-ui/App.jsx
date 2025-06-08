import React, {
	useState,
	useMemo,
	useEffect,
	useRef,
	useCallback
} from 'react';
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { StatusBar } from './components/StatusBar.jsx';
import { Navigation } from './components/Navigation.jsx';
import { TaskList } from './components/TaskList.jsx';
import { ShowTask } from './components/ShowTask.jsx';
import { useTaskData } from './hooks/useTaskData.js';
import { useNavigation } from './hooks/useNavigation.js';

/**
 * Main start-ui application component
 * Provides an interactive terminal UI for task management
 * @param {Object} props - Component props
 * @param {string} props.projectRoot - The root directory of the Task Master project
 * @returns {React.Component} The main app component
 */
export default function App({ projectRoot }) {
	const [currentView, setCurrentView] = useState('all');
	const [showSubtasks, setShowSubtasks] = useState(true);
	const [showTaskDetail, setShowTaskDetail] = useState(false);
	const [showTaskDetailId, setShowTaskDetailId] = useState(null); // Track task ID being shown
	const { exit } = useApp();
	const isExitingRef = useRef(false);
	const { stdout } = useStdout();

	// Calculate available terminal height
	const terminalHeight = stdout?.rows || 24;
	// Reserve space for: StatusBar(3) + Navigation(2) + TaskDetails(3) + Footer(2) = 10 lines
	const availableHeight = Math.max(10, terminalHeight - 10);

	// Memoize filters to prevent unnecessary re-renders
	const filters = useMemo(
		() => ({
			status: currentView === 'all' ? null : currentView
		}),
		[currentView]
	);

	const {
		tasks,
		metadata,
		loading,
		error,
		updateTaskStatus,
		refreshTasks,
		getNextTask
	} = useTaskData(projectRoot, {
		refreshInterval: 5000, // Check every 5 seconds (increased from 3)
		filters,
		autoRefresh: true
	});

	const [nextEligibleTasks, setNextEligibleTasks] = useState([]);

	// Get next eligible tasks - only when task count changes
	useEffect(() => {
		let isMounted = true;

		const fetchNextTasks = async () => {
			if (tasks && tasks.length > 0) {
				try {
					const nextTask = await getNextTask();
					if (isMounted) {
						if (nextTask) {
							setNextEligibleTasks([nextTask]);
						} else {
							setNextEligibleTasks([]);
						}
					}
				} catch (err) {
					if (isMounted) {
						setNextEligibleTasks([]);
					}
				}
			} else {
				if (isMounted) {
					setNextEligibleTasks([]);
				}
			}
		};

		// Debounce the fetch to prevent rapid calls
		const timeoutId = setTimeout(fetchNextTasks, 100);

		return () => {
			isMounted = false;
			clearTimeout(timeoutId);
		};
	}, [tasks?.length, metadata?.completedTasks, metadata?.inProgressTasks]);

	// Track the currently selected task ID to preserve selection across updates
	const selectedTaskIdRef = useRef(null);

	// Calculate total navigable items based on whether subtasks are shown
	const getTotalNavigableItems = () => {
		if (!showSubtasks) {
			return tasks.length;
		}

		// Count parent tasks + all subtasks
		let totalLines = 0;
		tasks.forEach((task) => {
			totalLines++; // Parent task
			if (task.subtasks && Array.isArray(task.subtasks)) {
				totalLines += task.subtasks.length; // Subtasks
			}
		});
		return totalLines;
	};

	const totalItems = getTotalNavigableItems();

	const {
		selectedIndex,
		selectedItem,
		selectItem,
		navigateUp,
		navigateDown,
		pageUp,
		pageDown,
		selectCurrent
	} = useNavigation(
		{ length: totalItems },
		{
			initialIndex: 0,
			onSelect: async (item) => {
				// Navigation selection logic will be handled in TaskList
				console.log('Selected line index:', selectedIndex);
			},
			onExit: () => exit()
		}
	);

	// Update selected task ID when selection changes (no state, just ref)
	useEffect(() => {
		if (!showSubtasks && tasks[selectedIndex]) {
			selectedTaskIdRef.current = tasks[selectedIndex].id;
		} else if (showSubtasks) {
			// Find which task corresponds to the selected line
			let currentLineIndex = 0;
			for (const task of tasks) {
				if (currentLineIndex === selectedIndex) {
					selectedTaskIdRef.current = task.id;
					break;
				}
				currentLineIndex++;
				if (task.subtasks && Array.isArray(task.subtasks)) {
					if (selectedIndex < currentLineIndex + task.subtasks.length) {
						selectedTaskIdRef.current = task.id;
						break;
					}
					currentLineIndex += task.subtasks.length;
				}
			}
		}
	}, [selectedIndex, tasks, showSubtasks]);

	// Restore selection when tasks update - use ref to track if we're already updating
	const isRestoringSelectionRef = useRef(false);
	useEffect(() => {
		// Skip if we're already restoring or don't have a saved selection
		if (
			isRestoringSelectionRef.current ||
			!selectedTaskIdRef.current ||
			tasks.length === 0
		) {
			return;
		}

		let newIndex = -1;

		if (!showSubtasks) {
			// Find the task index
			newIndex = tasks.findIndex(
				(task) => task.id === selectedTaskIdRef.current
			);
		} else {
			// Find the line index for the task
			let currentLineIndex = 0;
			for (let i = 0; i < tasks.length; i++) {
				if (tasks[i].id === selectedTaskIdRef.current) {
					newIndex = currentLineIndex;
					break;
				}
				currentLineIndex++;
				if (tasks[i].subtasks && Array.isArray(tasks[i].subtasks)) {
					currentLineIndex += tasks[i].subtasks.length;
				}
			}
		}

		// Only update if the index changed and is valid
		if (newIndex >= 0 && newIndex !== selectedIndex && newIndex < totalItems) {
			isRestoringSelectionRef.current = true;
			selectItem(newIndex);
			// Reset flag after a short delay
			setTimeout(() => {
				isRestoringSelectionRef.current = false;
			}, 100);
		}
	}, [tasks.length, showSubtasks]); // Only depend on things that indicate structural changes

	// Exit handler with proper cleanup
	const handleExit = useCallback(() => {
		if (isExitingRef.current) return; // Prevent multiple exit calls
		isExitingRef.current = true;

		// Use the Ink exit function to trigger cleanup
		exit();
		
		// Force immediate process exit after a small delay to allow cleanup
		setTimeout(() => {
			process.exit(0);
		}, 10);
	}, [exit]);

	// Throttle input to prevent rapid firing
	const lastInputTime = useRef(0);

	useInput((input, key) => {
		const now = Date.now();
		if (now - lastInputTime.current < 50) {
			// 50ms throttle
			return;
		}
		lastInputTime.current = now;

		// Exit commands
		if (key.ctrl && input === 'c') {
			handleExit();
			return;
		}

		// Don't handle inputs here when showing task detail
		// Let the ShowTask component handle its own inputs
		if (showTaskDetail) {
			return;
		}

		if (input === 'q') {
			handleExit();
			return;
		}

		// Navigation commands
		if (key.upArrow || input === 'k') {
			navigateUp();
			return;
		}

		if (key.downArrow || input === 'j') {
			navigateDown();
			return;
		}

		// Page navigation for large lists
		if (key.pageUp || (key.ctrl && input === 'u')) {
			pageUp();
			return;
		}

		if (key.pageDown || (key.ctrl && input === 'd')) {
			pageDown();
			return;
		}

		if (key.return || input === ' ') {
			selectCurrent();
			return;
		}

		// App commands
		if (input === 'r') {
			refreshTasks();
			return;
		}

		// S key now shows task detail
		if (input === 's' && selectedIndex >= 0) {
			// When subtasks are shown, we need to map the selectedIndex (line number) to actual task
			let taskToShow = null;

			if (!showSubtasks) {
				// Direct mapping when subtasks are OFF
				taskToShow = tasks[selectedIndex];
			} else {
				// When subtasks are ON, we need to find which task the selectedIndex corresponds to
				let currentLineIndex = 0;
				for (const task of tasks) {
					if (currentLineIndex === selectedIndex) {
						taskToShow = task;
						break;
					}
					currentLineIndex++;

					// Count subtask lines
					if (task.subtasks && Array.isArray(task.subtasks)) {
						if (selectedIndex < currentLineIndex + task.subtasks.length) {
							// Selected line is a subtask
							taskToShow = task; // Show parent task for now
							break;
						}
						currentLineIndex += task.subtasks.length;
					}
				}
			}

			if (taskToShow) {
				setShowTaskDetail(true);
				setShowTaskDetailId(taskToShow.id); // Store the task ID
			}
			return;
		}

		// Tab key now toggles subtasks
		if (key.tab) {
			setShowSubtasks(!showSubtasks);
			return;
		}

		// View switching
		const viewMap = {
			1: 'all',
			2: 'pending',
			3: 'in-progress',
			4: 'done'
		};

		if (viewMap[input] && viewMap[input] !== currentView) {
			setCurrentView(viewMap[input]);
			return;
		}
	});

	if (error) {
		return (
			<Box flexDirection="column" height="100%" width="100%">
				{/* Show StatusBar even in error state */}
				<Box flexShrink={0} flexDirection="column" width="100%">
					<StatusBar
						projectRoot={projectRoot}
						metadata={metadata}
						error={error}
						nextTask={nextEligibleTasks[0]}
						selectedIndex={selectedIndex}
					/>
				</Box>
				<Box flexGrow={1} padding={1}>
					<Text color="red" bold>
						Error: {error}
					</Text>
					<Text color="gray">
						Make sure you're in a task-master project directory.
					</Text>
					<Text color="gray">Press Ctrl+C to exit</Text>
				</Box>
			</Box>
		);
	}

	// Calculate which task to show based on selectedIndex and subtask mode
	const getTaskForSelectedIndex = () => {
		if (!showSubtasks) {
			return tasks[selectedIndex];
		}

		// When subtasks are ON, map line index to task
		let currentLineIndex = 0;
		for (const task of tasks) {
			if (currentLineIndex === selectedIndex) {
				return task;
			}
			currentLineIndex++;

			if (task.subtasks && Array.isArray(task.subtasks)) {
				if (selectedIndex < currentLineIndex + task.subtasks.length) {
					return task; // Return parent task for subtask lines
				}
				currentLineIndex += task.subtasks.length;
			}
		}
		return null;
	};

	// If showing task detail, render only the ShowTask component
	if (showTaskDetail && showTaskDetailId) {
		// Find the task by ID to ensure we always show the same task even after data refreshes
		// Convert both to string for comparison as task IDs might be numbers or strings
		const taskToShow = tasks.find(t => String(t.id) === String(showTaskDetailId)) || getTaskForSelectedIndex();
		if (taskToShow) {
			return (
				<ShowTask
					task={taskToShow}
					onClose={() => {
						setShowTaskDetail(false);
						setShowTaskDetailId(null);
					}}
					onExit={handleExit}
					onNavigateTask={(direction) => {
						// Find next/previous actual task index, handling subtasks correctly
						const findNextTaskIndex = (currentIndex, dir) => {
							if (!showSubtasks) {
								// Simple case - direct task navigation
								const newIndex =
									dir === 'next' ? currentIndex + 1 : currentIndex - 1;
								return Math.max(0, Math.min(newIndex, tasks.length - 1));
							}

							// Complex case - find next actual task when subtasks are shown
							let lineIndex = 0;
							let currentTaskIndex = -1;

							// First, find which task index we're currently on
							for (let i = 0; i < tasks.length; i++) {
								if (lineIndex === currentIndex) {
									currentTaskIndex = i;
									break;
								}
								lineIndex++; // Parent task line

								if (tasks[i].subtasks?.length > 0) {
									if (currentIndex < lineIndex + tasks[i].subtasks.length) {
										currentTaskIndex = i; // We're on a subtask of this task
										break;
									}
									lineIndex += tasks[i].subtasks.length;
								}
							}

							// Calculate target task index
							const targetTaskIndex =
								dir === 'next' ? currentTaskIndex + 1 : currentTaskIndex - 1;
							if (targetTaskIndex < 0 || targetTaskIndex >= tasks.length) {
								return currentIndex; // Can't navigate further
							}

							// Calculate line index for target task
							lineIndex = 0;
							for (let i = 0; i < targetTaskIndex; i++) {
								lineIndex++; // Parent task
								if (tasks[i].subtasks?.length > 0) {
									lineIndex += tasks[i].subtasks.length;
								}
							}

							return lineIndex; // Line index of the target task
						};

						const newIndex = findNextTaskIndex(selectedIndex, direction);
						if (
							newIndex !== selectedIndex &&
							newIndex >= 0 &&
							newIndex < totalItems
						) {
							selectItem(newIndex);
							// Update the task ID when navigating
							const newTask = showSubtasks ? 
								(() => {
									let lineIdx = 0;
									for (const task of tasks) {
										if (lineIdx === newIndex) return task;
										lineIdx++;
										if (task.subtasks?.length > 0) {
											if (newIndex < lineIdx + task.subtasks.length) return task;
											lineIdx += task.subtasks.length;
										}
									}
									return null;
								})() : 
								tasks[newIndex];
							if (newTask) {
								setShowTaskDetailId(newTask.id);
							}
						}
					}}
					onUpdateTaskStatus={updateTaskStatus}
					tasks={tasks}
				/>
			);
		}
	}

	return (
		<Box
			flexDirection="column"
			width="100%"
			height={terminalHeight}
			overflow="hidden"
		>
			{/* Fixed header - always visible at top */}
			<Box flexShrink={0} flexDirection="column" width="100%">
				<StatusBar
					projectRoot={projectRoot}
					metadata={metadata}
					error={error}
					nextTask={nextEligibleTasks[0]}
					selectedIndex={selectedIndex}
				/>

				<Navigation currentView={currentView} onViewChange={setCurrentView} />
			</Box>

			{/* Main content area - uses flex to fill available space */}
			<Box flexGrow={1} overflow="hidden" width="100%">
				<TaskList
					tasks={tasks}
					selectedIndex={selectedIndex}
					loading={loading}
					view={currentView}
					showSubtasks={showSubtasks}
					nextEligibleTasks={nextEligibleTasks}
					maxHeight={terminalHeight - 10}
				/>
			</Box>

			{/* Horizontal task details strip - above footer */}
			{(() => {
				const currentTask = getTaskForSelectedIndex();
				if (tasks.length > 0 && selectedIndex >= 0 && currentTask) {
					return (
						<Box flexShrink={0} width="100%" maxHeight={3}>
							<Box
								borderStyle="single"
								borderColor="gray"
								paddingX={1}
								width="100%"
								height={3}
							>
								<Box flexDirection="row" width="100%">
									{/* Left side - task metadata */}
									<Box flexShrink={0}>
										<Text bold color="white">
											Task Details:{' '}
										</Text>
										<Text color="gray">ID: {currentTask.id} | </Text>
										<Text color="gray">Status: {currentTask.status} | </Text>
										<Text color="gray">Priority: {currentTask.priority}</Text>

										{/* Dependencies */}
										{currentTask.dependencies &&
											currentTask.dependencies.length > 0 && (
												<Text color="#F59E0B">
													{' '}
													| Deps: {currentTask.dependencies.length}
												</Text>
											)}

										{/* Subtasks count */}
										{currentTask.subtasks &&
											currentTask.subtasks.length > 0 && (
												<Text color="cyan">
													{' '}
													| Subtasks: {currentTask.subtasks.length}
												</Text>
											)}
									</Box>

									{/* Right side - description with smart truncation */}
									<Box flexGrow={1} marginLeft={2}>
										{currentTask.description ? (
											<Text color="white" dimColor>
												{currentTask.description.length > 70
													? currentTask.description.substring(0, 67) + '...'
													: currentTask.description}
											</Text>
										) : (
											<Text color="gray" dimColor>
												No description
											</Text>
										)}
									</Box>
								</Box>
							</Box>
						</Box>
					);
				}
				return null;
			})()}

			{/* Fixed footer - always visible at bottom */}
			{tasks.length > 0 && (
				<Box flexShrink={0} width="100%">
					<Box
						borderStyle="single"
						borderColor="gray"
						paddingX={1}
						width="100%"
					>
						<Text color="gray">
							↑/↓: Navigate | PgUp/PgDn: Fast scroll | Enter: Toggle | [S] Show
							| Tab: Subtasks {showSubtasks ? 'ON' : 'OFF'} | R: Refresh | Q:
							Quit
						</Text>
					</Box>
				</Box>
			)}
		</Box>
	);
}
