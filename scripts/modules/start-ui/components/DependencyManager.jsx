import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNavigation } from '../hooks/useNavigation.js';
import { addDependency, removeDependency } from '../../dependency-manager.js';
import path from 'path';
import { TASKMASTER_TASKS_FILE } from '../../../../src/constants/paths.js';

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

/**
 * Multi-stage dependency management component
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether the component is visible
 * @param {Array} props.tasks - All tasks in the project
 * @param {string} props.projectRoot - Project root directory
 * @param {string} props.mode - 'add' or 'remove'
 * @param {Function} props.onClose - Callback when closing the component
 * @param {Function} props.onComplete - Callback when operation completes
 */
export function DependencyManager({
	isOpen,
	tasks,
	projectRoot,
	mode = 'add',
	onClose,
	onComplete
}) {
	const [stage, setStage] = useState('selectSource'); // selectSource, selectTarget, confirm
	const [sourceTask, setSourceTask] = useState(null);
	const [targetTask, setTargetTask] = useState(null);
	const [filter, setFilter] = useState('');
	const [error, setError] = useState('');
	const [isProcessing, setIsProcessing] = useState(false);

	// Get tasks file path
	const tasksFile = path.join(projectRoot, TASKMASTER_TASKS_FILE);

	// Filter tasks based on current filter
	const filteredTasks = useMemo(() => {
		if (!filter) return tasks;

		const lowerFilter = filter.toLowerCase();
		return tasks.filter(task => {
			const idMatch = task.id.toString().includes(filter);
			const titleMatch = task.title.toLowerCase().includes(lowerFilter);
			return idMatch || titleMatch;
		});
	}, [tasks, filter]);

	// Determine available tasks for each stage
	const availableTasks = useMemo(() => {
		if (stage === 'selectSource') {
			return filteredTasks;
		}

		if (stage === 'selectTarget' && sourceTask) {
			if (mode === 'add') {
				// Can't add self as dependency
				return filteredTasks.filter(task => task.id !== sourceTask.id);
			} else {
				// Only show tasks that are current dependencies
				return filteredTasks.filter(task => 
					sourceTask.dependencies && sourceTask.dependencies.includes(task.id)
				);
			}
		}

		return [];
	}, [stage, sourceTask, filteredTasks, mode]);

	// Navigation hook for the task list
	const navigation = useNavigation(availableTasks, {
		initialIndex: 0,
		loop: true,
		onSelect: (task) => {
			if (stage === 'selectSource') {
				setSourceTask(task);
				setStage('selectTarget');
				setFilter(''); // Reset filter for next stage
				navigation.selectItem(0); // Reset selection
			} else if (stage === 'selectTarget') {
				setTargetTask(task);
				setStage('confirm');
			}
		}
	});

	// Reset state when component opens/closes
	useEffect(() => {
		if (!isOpen) {
			setStage('selectSource');
			setSourceTask(null);
			setTargetTask(null);
			setFilter('');
			setError('');
			setIsProcessing(false);
		}
	}, [isOpen]);

	// Handle dependency operation
	const handleConfirm = async () => {
		if (!sourceTask || !targetTask) return;

		setIsProcessing(true);
		setError('');

		try {
			if (mode === 'add') {
				await addDependency(tasksFile, sourceTask.id, targetTask.id);
			} else {
				await removeDependency(tasksFile, sourceTask.id, targetTask.id);
			}

			// Success - trigger refresh and close
			if (onComplete) {
				onComplete();
			}
			if (onClose) {
				onClose();
			}
		} catch (err) {
			setError(err.message || 'Operation failed');
			setIsProcessing(false);
		}
	};

	// Input handling
	useInput((input, key) => {
		if (!isOpen) return;

		// Always allow ESC to close
		if (key.escape) {
			if (stage === 'selectSource') {
				onClose();
			} else {
				// Go back one stage
				if (stage === 'selectTarget') {
					setStage('selectSource');
					setTargetTask(null);
				} else if (stage === 'confirm') {
					setStage('selectTarget');
				}
			}
			return;
		}

		// During processing, only allow ESC
		if (isProcessing) return;

		// Handle different stages
		if (stage === 'selectSource' || stage === 'selectTarget') {
			// Navigation keys
			if (key.upArrow) {
				navigation.navigateUp();
				return;
			}
			if (key.downArrow) {
				navigation.navigateDown();
				return;
			}
			if (key.return) {
				navigation.selectCurrent();
				return;
			}

			// Filter input
			if (key.backspace || key.delete) {
				setFilter(filter.slice(0, -1));
				return;
			}
			if (input && !key.ctrl && !key.meta && input.length === 1) {
				setFilter(filter + input);
				return;
			}
		} else if (stage === 'confirm') {
			// Confirm stage
			if (key.return || input === 'y') {
				handleConfirm();
				return;
			}
			if (input === 'n') {
				setStage('selectTarget');
				return;
			}
		}
	});

	if (!isOpen) return null;

	// Render different stages
	const renderStage = () => {
		if (stage === 'selectSource') {
			return (
				<Box flexDirection="column" width="100%">
					<Box marginBottom={1}>
						<Text bold color="cyan">
							Select the task that will {mode === 'add' ? 'depend on' : 'stop depending on'} another task
						</Text>
					</Box>

					{filter && (
						<Box marginBottom={1}>
							<Text>Filter: {filter}</Text>
						</Box>
					)}

					<Box flexDirection="column" height={15}>
						{availableTasks.length === 0 ? (
							<Text color="gray">No tasks match the filter</Text>
						) : (
							availableTasks.map((task, index) => (
								<Box
									key={task.id}
									paddingX={1}
									backgroundColor={
										index === navigation.selectedIndex ? '#3B82F6' : undefined
									}
								>
									<Text
										color={
											index === navigation.selectedIndex
												? 'white'
												: STATUS_COLORS[task.status] || 'white'
										}
										bold={index === navigation.selectedIndex}
									>
										{STATUS_SYMBOLS[task.status] || '?'} {task.id} {task.title}
										{task.dependencies && task.dependencies.length > 0 && (
											<Text color="gray"> ({task.dependencies.length} deps)</Text>
										)}
									</Text>
								</Box>
							))
						)}
					</Box>

					<Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
						<Text color="gray">
							↑↓ Navigate • Enter Select • Type to filter • ESC Cancel
						</Text>
					</Box>
				</Box>
			);
		}

		if (stage === 'selectTarget') {
			return (
				<Box flexDirection="column" width="100%">
					<Box marginBottom={1}>
						<Text bold color="cyan">
							Select the task that "{sourceTask.title}" will {mode === 'add' ? 'depend on' : 'stop depending on'}
						</Text>
					</Box>

					{mode === 'remove' && sourceTask.dependencies && sourceTask.dependencies.length === 0 && (
						<Box marginBottom={1}>
							<Text color="yellow">This task has no dependencies to remove</Text>
						</Box>
					)}

					{filter && (
						<Box marginBottom={1}>
							<Text>Filter: {filter}</Text>
						</Box>
					)}

					<Box flexDirection="column" height={15}>
						{availableTasks.length === 0 ? (
							<Text color="gray">
								{mode === 'add' 
									? 'No tasks available to depend on' 
									: 'No dependencies to remove'}
							</Text>
						) : (
							availableTasks.map((task, index) => (
								<Box
									key={task.id}
									paddingX={1}
									backgroundColor={
										index === navigation.selectedIndex ? '#3B82F6' : undefined
									}
								>
									<Text
										color={
											index === navigation.selectedIndex
												? 'white'
												: STATUS_COLORS[task.status] || 'white'
										}
										bold={index === navigation.selectedIndex}
									>
										{STATUS_SYMBOLS[task.status] || '?'} {task.id} {task.title}
									</Text>
								</Box>
							))
						)}
					</Box>

					<Box marginTop={1} borderStyle="single" borderColor="gray" paddingX={1}>
						<Text color="gray">
							↑↓ Navigate • Enter Select • Type to filter • ESC Back
						</Text>
					</Box>
				</Box>
			);
		}

		if (stage === 'confirm') {
			return (
				<Box flexDirection="column" width="100%">
					<Box marginBottom={2}>
						<Text bold color="cyan">
							Confirm Dependency {mode === 'add' ? 'Addition' : 'Removal'}
						</Text>
					</Box>

					<Box flexDirection="column" marginBottom={2}>
						<Box marginBottom={1}>
							<Text>
								Task {sourceTask.id}: {sourceTask.title}
							</Text>
						</Box>
						
						<Box marginLeft={2}>
							<Text color={mode === 'add' ? 'green' : 'red'}>
								{mode === 'add' ? '└─ will depend on →' : '└─ will stop depending on →'}
							</Text>
						</Box>

						<Box marginTop={1}>
							<Text>
								Task {targetTask.id}: {targetTask.title}
							</Text>
						</Box>
					</Box>

					{sourceTask.dependencies && sourceTask.dependencies.length > 0 && (
						<Box flexDirection="column" marginBottom={2}>
							<Text bold>Current dependencies:</Text>
							{sourceTask.dependencies.map(depId => {
								const depTask = tasks.find(t => t.id === depId);
								return (
									<Box key={depId} marginLeft={2}>
										<Text color="gray">
											• {depId}{depTask ? `: ${depTask.title}` : ' (not found)'}
										</Text>
									</Box>
								);
							})}
						</Box>
					)}

					{error && (
						<Box marginBottom={1}>
							<Text color="red">{error}</Text>
						</Box>
					)}

					{isProcessing ? (
						<Box>
							<Text color="yellow">Processing...</Text>
						</Box>
					) : (
						<Box borderStyle="single" borderColor="gray" paddingX={1}>
							<Text color="gray">
								Y/Enter Confirm • N/ESC Cancel
							</Text>
						</Box>
					)}
				</Box>
			);
		}
	};

	return (
		<Box
			flexDirection="column"
			width="100%"
			height="100%"
			alignItems="center"
			justifyContent="center"
		>
			<Box
				borderStyle="round"
				borderColor="cyan"
				width={80}
				height={25}
				flexDirection="column"
				paddingX={2}
				paddingY={1}
			>
				{/* Title bar */}
				<Box
					borderStyle="single"
					borderBottom
					borderTop={false}
					borderLeft={false}
					borderRight={false}
					marginBottom={1}
					paddingBottom={1}
				>
					<Text bold color="cyan">
						{mode === 'add' ? 'Add Dependency' : 'Remove Dependency'}
					</Text>
				</Box>

				{/* Content */}
				<Box flexGrow={1} flexDirection="column">
					{renderStage()}
				</Box>
			</Box>
		</Box>
	);
}