import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { TaskItem, SubtaskRow } from './TaskItem.jsx';

// Match exact colors from CLI task-master list command
const STATUS_COLORS = {
	done: '#10B981', // green
	completed: '#10B981', // green
	pending: '#EAB308', // yellow
	'in-progress': '#FFA500', // orange
	blocked: '#EF4444', // red
	review: '#D946EF', // magenta
	deferred: '#6B7280', // gray
	cancelled: '#6B7280' // gray
};

const STATUS_SYMBOLS = {
	done: '✓',
	completed: '✓',
	pending: '○',
	'in-progress': '►',
	blocked: '!',
	review: '?',
	deferred: 'x',
	cancelled: '✗'
};

export function TaskList({
	tasks,
	selectedIndex = -1,
	loading = false,
	view = 'all',
	showSubtasks = true,
	nextEligibleTasks = [],
	maxHeight = 15
}) {
	// Calculate visible window for scrolling - based on actual terminal height
	// Use consistent calculation for both subtask and non-subtask views
	const VISIBLE_ITEMS = Math.max(5, maxHeight - 2);

	const visibleTasks = useMemo(() => {
		if (!tasks || tasks.length === 0) {
			return { tasks: tasks || [], startIndex: 0 };
		}

		// Debug: Check for duplicate task IDs
		const taskIds = tasks.map((t) => t.id);
		const uniqueIds = new Set(taskIds);
		if (taskIds.length !== uniqueIds.size) {
			// Filter out duplicates
			const seenIds = new Set();
			const uniqueTasks = tasks.filter((task) => {
				if (seenIds.has(task.id)) {
					return false;
				}
				seenIds.add(task.id);
				return true;
			});
			// Use deduped tasks
			tasks = uniqueTasks;
		}

		// Debug: Log tasks without subtasks when subtasks should be shown
		if (showSubtasks) {
			const tasksWithoutSubtasks = tasks.filter(
				(t) => !t.subtasks || !Array.isArray(t.subtasks)
			);
			if (tasksWithoutSubtasks.length > 0) {
				// Silently note which tasks are missing subtasks
				// This might indicate a data loading issue
			}
		}

		// When showing subtasks, disable pagination to avoid missing parent tasks
		// The subtasks create too many visual rows for the pagination logic to handle correctly
		if (showSubtasks) {
			return { tasks, startIndex: 0 };
		}

		// For small lists, show all items
		if (tasks.length <= VISIBLE_ITEMS) {
			return { tasks, startIndex: 0 };
		}

		// On initial load (no selection), start from the top
		if (selectedIndex < 0) {
			return {
				tasks: tasks.slice(0, VISIBLE_ITEMS),
				startIndex: 0
			};
		}

		// Calculate scroll window to keep selected item visible
		const safeSelectedIndex = Math.max(
			0,
			Math.min(selectedIndex, tasks.length - 1)
		);

		// Calculate the window bounds
		let startIndex = 0;
		let endIndex = tasks.length;

		if (tasks.length > VISIBLE_ITEMS) {
			// Calculate ideal window centered on selected item
			const halfWindow = Math.floor(VISIBLE_ITEMS / 2);
			const idealStart = safeSelectedIndex - halfWindow;
			const idealEnd = safeSelectedIndex + halfWindow + (VISIBLE_ITEMS % 2);

			// Adjust for boundaries
			if (idealStart < 0) {
				// At the beginning
				startIndex = 0;
				endIndex = VISIBLE_ITEMS;
			} else if (idealEnd > tasks.length) {
				// At the end
				startIndex = Math.max(0, tasks.length - VISIBLE_ITEMS);
				endIndex = tasks.length;
			} else {
				// In the middle
				startIndex = idealStart;
				endIndex = idealEnd;
			}

			// Final safety check - ensure selected item is in window
			if (safeSelectedIndex < startIndex || safeSelectedIndex >= endIndex) {
				// Force selected item to be visible
				if (safeSelectedIndex < VISIBLE_ITEMS / 2) {
					startIndex = 0;
					endIndex = VISIBLE_ITEMS;
				} else if (safeSelectedIndex >= tasks.length - VISIBLE_ITEMS / 2) {
					startIndex = tasks.length - VISIBLE_ITEMS;
					endIndex = tasks.length;
				} else {
					startIndex = safeSelectedIndex - Math.floor(VISIBLE_ITEMS / 2);
					endIndex = startIndex + VISIBLE_ITEMS;
				}
			}
		}

		return {
			tasks: tasks.slice(startIndex, endIndex),
			startIndex
		};
	}, [tasks, selectedIndex, showSubtasks, VISIBLE_ITEMS]);
	if (loading) {
		return (
			<Box flexDirection="column" width="100%" flexGrow={1} overflow="hidden">
				<Box
					padding={1}
					flexGrow={1}
					justifyContent="center"
					alignItems="center"
				>
					<Text color="yellow">Loading tasks...</Text>
				</Box>
			</Box>
		);
	}

	if (!tasks || tasks.length === 0) {
		const emptyMessage =
			{
				all: 'No tasks found. Use "task-master add-task" to create your first task.',
				pending: 'No pending tasks! All caught up.',
				done: 'No completed tasks yet.',
				'in-progress': 'No tasks currently in progress.'
			}[view] || 'No tasks found.';

		return (
			<Box flexDirection="column" width="100%" flexGrow={1} overflow="hidden">
				<Box paddingX={1} marginBottom={1} flexShrink={0}>
					<Text bold color="white">
						{view === 'all'
							? 'All Tasks'
							: view === 'pending'
								? 'Pending Tasks'
								: view === 'done'
									? 'Completed Tasks'
									: view === 'in-progress'
										? 'In Progress Tasks'
										: 'Tasks'}
					</Text>
					<Text color="gray"> (0)</Text>
				</Box>
				<Box
					padding={1}
					flexGrow={1}
					justifyContent="center"
					alignItems="center"
				>
					<Text color="gray">{emptyMessage}</Text>
				</Box>
			</Box>
		);
	}

	return (
		<Box flexDirection="column" width="100%" flexGrow={1} overflow="hidden">
			<Box paddingX={1} marginBottom={1} flexShrink={0}>
				<Text bold color="white">
					{view === 'all'
						? 'All Tasks'
						: view === 'pending'
							? 'Pending Tasks'
							: view === 'done'
								? 'Completed Tasks'
								: view === 'in-progress'
									? 'In Progress Tasks'
									: 'Tasks'}
				</Text>
				<Text color="gray"> ({tasks?.length || 0})</Text>
				{tasks && tasks.length > VISIBLE_ITEMS && (
					<Text color="gray" dimColor>
						{' '}
						- Showing {visibleTasks.startIndex + 1}-
						{Math.min(
							visibleTasks.startIndex + visibleTasks.tasks.length,
							tasks.length
						)}{' '}
						of {tasks.length} (
						{Math.round(
							((visibleTasks.startIndex + visibleTasks.tasks.length) /
								tasks.length) *
								100
						)}
						%)
					</Text>
				)}
				{tasks && tasks.length <= VISIBLE_ITEMS && tasks.length > 0 && (
					<Text color="gray" dimColor>
						{' '}
						- All tasks visible ({showSubtasks ? 'with' : 'without'} subtasks) |
						Max: {VISIBLE_ITEMS}
					</Text>
				)}
			</Box>

			{/* Main task list - flexible height */}
			<Box flexDirection="column" flexGrow={1} overflow="hidden" width="100%">
				{showSubtasks
					? // When showing subtasks, render with line-by-line highlighting
						(() => {
							// Build flat array of all lines (tasks + subtasks) for navigation
							const allLines = [];

							// Use the original tasks array, not visibleTasks.tasks to ensure all tasks are included
							tasks.forEach((task) => {
								// Add parent task line
								allLines.push({
									type: 'task',
									taskId: task.id,
									text: `${STATUS_SYMBOLS[task.status] || '?'} ${task.id} ${task.priority ? task.priority.charAt(0).toUpperCase() : 'M'} ${task.title}`,
									task: task,
									status: task.status
								});

								// Add subtask lines
								if (
									task.subtasks &&
									Array.isArray(task.subtasks) &&
									task.subtasks.length > 0
								) {
									task.subtasks.forEach((subtask, index) => {
										const isLast = index === task.subtasks.length - 1;
										const subtaskSymbol = STATUS_SYMBOLS[subtask.status] || '?';
										allLines.push({
											type: 'subtask',
											taskId: task.id,
											subtaskId: subtask.id,
											text: `  ${isLast ? '└─' : '├─'} ${subtaskSymbol} ${task.id}.${subtask.id} ${subtask.title}`,
											task: task,
											subtask: subtask,
											status: subtask.status
										});
									});
								}
							});

							// Calculate visible window for scrolling
							const maxVisibleLines = Math.max(10, maxHeight - 4); // Reserve less space for indicators since they're outside content
							let startLine = 0;
							let endLine = Math.min(allLines.length, maxVisibleLines);

							// Adjust scroll window if a line is selected
							if (selectedIndex >= 0 && selectedIndex < allLines.length) {
								// Center the selected line in the viewport
								const centerOffset = Math.floor(maxVisibleLines / 2);
								startLine = Math.max(0, selectedIndex - centerOffset);
								endLine = Math.min(
									allLines.length,
									startLine + maxVisibleLines
								);

								// Adjust if we're near the end
								if (endLine - startLine < maxVisibleLines) {
									startLine = Math.max(0, endLine - maxVisibleLines);
								}
							} else if (
								selectedIndex === -1 &&
								allLines.length > maxVisibleLines
							) {
								// No selection - ensure we show the beginning of the list
								startLine = 0;
								endLine = Math.min(allLines.length, maxVisibleLines);
							}

							const visibleLines = allLines.slice(startLine, endLine);

							// Show scroll indicators if needed
							const showTopIndicator = startLine > 0;
							const showBottomIndicator = endLine < allLines.length;

							return (
								<>
									{/* Scroll indicator - more tasks above */}
									{showTopIndicator && (
										<Box
											justifyContent="center"
											marginBottom={1}
											paddingX={1}
											flexShrink={0}
										>
											<Text color="#EAB308" dimColor>
												⬆ {startLine} more lines above ⬆
											</Text>
										</Box>
									)}

									{/* Main content */}
									<Box flexDirection="column" width="100%" flexGrow={1}>
										{visibleLines.map((line, index) => {
											const globalIndex = startLine + index;
											const isSelected = globalIndex === selectedIndex;

											return (
												<Box
													key={`line-${line.type}-${line.taskId}-${line.subtaskId || ''}-${globalIndex}`}
													width="100%"
												>
													{isSelected ? (
														<Box
															backgroundColor="#3B82F6"
															paddingX={1}
															width="100%"
															overflow="hidden"
														>
															<Text color="white" bold wrap="truncate">
																{line.text}
															</Text>
														</Box>
													) : (
														<Box paddingX={1} width="100%" overflow="hidden">
															<Text
																color={STATUS_COLORS[line.status] || 'white'}
																wrap="truncate"
															>
																{line.text}
															</Text>
														</Box>
													)}
												</Box>
											);
										})}
									</Box>

									{/* Scroll indicator - more tasks below */}
									{showBottomIndicator && (
										<Box
											justifyContent="center"
											marginTop={1}
											paddingX={1}
											flexShrink={0}
										>
											<Text color="#EAB308" dimColor>
												⬇ {allLines.length - endLine} more lines below ⬇
											</Text>
										</Box>
									)}
								</>
							);
						})()
					: // Original individual component rendering for tasks without subtasks
						visibleTasks.tasks.map((task, index) => {
							const actualIndex = visibleTasks.startIndex + index;
							const isNextEligible = nextEligibleTasks.some(
								(nextTask) =>
									nextTask.id === task.id.toString() ||
									nextTask.id === `${task.id}.${nextTask.subtaskId}`
							);

							return (
								<TaskItem
									key={`task-${task.id}`}
									task={task}
									isSelected={actualIndex === selectedIndex}
									showSubtasks={false}
									isNextEligible={isNextEligible}
								/>
							);
						})}

				{/* Fill remaining space when there are fewer tasks */}
				{tasks && tasks.length < VISIBLE_ITEMS && <Box flexGrow={1} />}
			</Box>
		</Box>
	);
}
