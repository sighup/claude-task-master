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
import { TaskListContainer } from './components/TaskListContainer.jsx';
import { ShowTask } from './components/ShowTask.jsx';
import ModalDialog from './components/ModalDialog.jsx';
import StatusSelectorWithOptions from './components/StatusSelectorWithOptions.jsx';
import ProjectSetup from './components/ProjectSetup.jsx';
import { QuickSearchCommandPalette } from './components/QuickSearchCommandPalette.jsx';
import { HelpOverlay } from './components/HelpOverlay.jsx';
import { Toast, ToastContainer } from './components/Toast.jsx';
import { LoadingSpinner } from './components/ProgressIndicator.jsx';
import { useTaskData } from './hooks/useTaskData.js';
import { useNavigation } from './hooks/useNavigation.js';
import { useToasts } from './hooks/useToasts.js';
import commandRegistry from './services/CommandRegistry.js';

// Import modal components
import TaskForm from './components/TaskForm.jsx';
import ConfirmDialog from './components/ConfirmDialog.jsx';
import UpdatePromptEnhanced from './components/UpdatePromptEnhanced.jsx';
import BatchUpdateModal from './components/BatchUpdateModal.jsx';
import UpdateSubtaskPrompt from './components/UpdateSubtaskPrompt.jsx';
import SubtaskManager from './components/SubtaskManager.jsx';
import RemoveSubtaskDialog from './components/RemoveSubtaskDialog.jsx';
import ClearSubtasksDialog from './components/ClearSubtasksDialog.jsx';
import PrdParser from './components/PrdParser.jsx';
import ComplexityAnalysis from './components/ComplexityAnalysis.jsx';
import { ComplexityReport } from './components/ComplexityReport.jsx';
import { TaskExpander } from './components/TaskExpander.jsx';
import { DependencyManager } from './components/DependencyManager.jsx';
import { DependencyValidator } from './components/DependencyValidator.jsx';
import { ModelManager } from './components/ModelManager.jsx';
import ProjectInitializer from './components/ProjectInitializer.jsx';
import { OnboardingFlow } from './components/OnboardingFlow.jsx';
import { checkProjectStatus } from './utils/projectChecks.js';

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
	const [showTaskDetailId, setShowTaskDetailId] = useState(null);
	const [showStatusModal, setShowStatusModal] = useState(false);
	const [statusModalTaskId, setStatusModalTaskId] = useState(null);
	const [showProjectSetup, setShowProjectSetup] = useState(false);
	const [showCommandPalette, setShowCommandPalette] = useState(false);
	const [commandPaletteMode, setCommandPaletteMode] = useState('command');
	const [showHelpOverlay, setShowHelpOverlay] = useState(false);
	const [recentCommands, setRecentCommands] = useState([]);
	const [displayedTasks, setDisplayedTasks] = useState([]);
	const [suggestionCount, setSuggestionCount] = useState(0);
	const [loadingMessage, setLoadingMessage] = useState('');
	
	// Modal states
	const [showAddTaskModal, setShowAddTaskModal] = useState(false);
	const [addTaskInitialData, setAddTaskInitialData] = useState({});
	const [addTaskLoading, setAddTaskLoading] = useState(false);
	const [showRemoveTaskModal, setShowRemoveTaskModal] = useState(false);
	const [removeTaskId, setRemoveTaskId] = useState(null);
	const [showUpdateTaskModal, setShowUpdateTaskModal] = useState(false);
	const [updateTaskId, setUpdateTaskId] = useState(null);
	const [showBatchUpdateModal, setShowBatchUpdateModal] = useState(false);
	const [showUpdateSubtaskModal, setShowUpdateSubtaskModal] = useState(false);
	const [updateSubtaskData, setUpdateSubtaskData] = useState(null);
	const [showAddSubtaskModal, setShowAddSubtaskModal] = useState(false);
	const [addSubtaskData, setAddSubtaskData] = useState(null);
	const [showRemoveSubtaskModal, setShowRemoveSubtaskModal] = useState(false);
	const [removeSubtaskData, setRemoveSubtaskData] = useState(null);
	const [showClearSubtasksModal, setShowClearSubtasksModal] = useState(false);
	const [showPrdParserModal, setShowPrdParserModal] = useState(false);
	const [showComplexityAnalysisModal, setShowComplexityAnalysisModal] = useState(false);
	const [showComplexityReportModal, setShowComplexityReportModal] = useState(false);
	const [showTaskExpanderModal, setShowTaskExpanderModal] = useState(false);
	const [expandTaskId, setExpandTaskId] = useState(null);
	const [showDependencyManagerModal, setShowDependencyManagerModal] = useState(false);
	const [dependencyManagerMode, setDependencyManagerMode] = useState('add');
	const [showDependencyValidatorModal, setShowDependencyValidatorModal] = useState(false);
	const [showModelManager, setShowModelManager] = useState(false);
	const [showOnboarding, setShowOnboarding] = useState(false);
	const [projectStatus, setProjectStatus] = useState(null);
	const [hasCheckedProject, setHasCheckedProject] = useState(false);
	
	const { exit } = useApp();
	const isExitingRef = useRef(false);
	const { stdout } = useStdout();
	const { toasts, addToast, dismissToast } = useToasts();

	// Calculate available terminal height
	const terminalHeight = stdout?.rows || 24;
	const availableHeight = Math.max(10, terminalHeight - 10);

	// Memoize filters to prevent unnecessary re-renders
	const filters = useMemo(
		() => ({
			status: currentView === 'all' ? null : 
			        currentView === 'completed' ? 'done' : 
			        currentView
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
		getNextTask,
		generateTaskFiles,
		addTask,
		removeTask,
		updateTask,
		syncReadme,
		batchUpdate,
		updateSubtask,
		addSubtask,
		removeSubtask,
		clearSubtasks,
		parsePrd,
		analyzeComplexity,
		expandTask,
		expandAll,
		getComplexityReport,
		addDependency,
		removeDependency,
		validateDependencies,
		fixDependencies
	} = useTaskData(projectRoot, {
		refreshInterval: 5000,
		filters,
		autoRefresh: true
	});

	const [nextEligibleTasks, setNextEligibleTasks] = useState([]);

	// Check project status on mount
	useEffect(() => {
		if (!hasCheckedProject) {
			const status = checkProjectStatus(projectRoot);
			setProjectStatus(status);
			setHasCheckedProject(true);
			
			// Show onboarding if project is not initialized or missing components
			if (!status.isInitialized || status.warnings.length > 0) {
				setShowOnboarding(true);
			}
		}
	}, [projectRoot, hasCheckedProject]);

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

	// Restore selection when tasks update
	const isRestoringSelectionRef = useRef(false);
	useEffect(() => {
		if (
			isRestoringSelectionRef.current ||
			!selectedTaskIdRef.current ||
			tasks.length === 0
		) {
			return;
		}

		let newIndex = -1;

		if (!showSubtasks) {
			newIndex = tasks.findIndex(
				(task) => task.id === selectedTaskIdRef.current
			);
		} else {
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

		if (newIndex >= 0 && newIndex !== selectedIndex && newIndex < totalItems) {
			isRestoringSelectionRef.current = true;
			selectItem(newIndex);
			setTimeout(() => {
				isRestoringSelectionRef.current = false;
			}, 100);
		}
	}, [tasks.length, showSubtasks]);

	// Exit handler with proper cleanup
	const handleExit = useCallback(() => {
		if (isExitingRef.current) return;
		isExitingRef.current = true;

		exit();
		
		setTimeout(() => {
			process.exit(0);
		}, 10);
	}, [exit]);

	// Get current selected task
	const getSelectedTask = useCallback(() => {
		if (displayedTasks.length === 0) return null;
		const selectedItem = displayedTasks[selectedIndex];
		if (!selectedItem) return null;
		
		// If it's a subtask, return the parent task with subtask info
		if (selectedItem.isSubtask) {
			const parentTask = tasks.find(t => t.id === selectedItem.parentId);
			return {
				...parentTask,
				selectedSubtask: selectedItem
			};
		}
		
		return selectedItem;
	}, [displayedTasks, selectedIndex, tasks]);

	// Command execution handler
	const executeCommand = useCallback(async (commandId, mode, params) => {
		// Track recent commands
		setRecentCommands(prev => {
			const filtered = prev.filter(id => id !== commandId);
			return [commandId, ...filtered].slice(0, 5);
		});

		const selectedTask = getSelectedTask();
		const context = {
			selectedTask,
			selectedSubtask: selectedTask?.selectedSubtask,
			projectRoot,
			tasks,
			metadata
		};

		try {
			// Get the command object
			const command = commandRegistry.getCommandById(commandId);
			if (!command) {
				addToast(`Unknown command: ${commandId}`, 'error');
				return;
			}
			
			// Execute the command
			const result = commandRegistry.executeCommand(command, params, context);
			
			if (result.success) {
				// Handle UI state changes based on command
				switch (commandId) {
					case 'add-task':
						setShowAddTaskModal(true);
						break;
					case 'remove-task':
						if (selectedTask) {
							setRemoveTaskId(selectedTask.id);
							setShowRemoveTaskModal(true);
						}
						break;
					case 'update-task':
						if (selectedTask) {
							setUpdateTaskId(selectedTask.id);
							setShowUpdateTaskModal(true);
						}
						break;
					case 'batch-update':
						setShowBatchUpdateModal(true);
						break;
					case 'add-subtask':
						if (selectedTask) {
							setAddSubtaskData({ parentId: selectedTask.id });
							setShowAddSubtaskModal(true);
						}
						break;
					case 'update-subtask':
						if (selectedTask?.selectedSubtask) {
							setUpdateSubtaskData({
								parentId: selectedTask.id,
								subtaskId: selectedTask.selectedSubtask.id
							});
							setShowUpdateSubtaskModal(true);
						}
						break;
					case 'remove-subtask':
						if (selectedTask?.selectedSubtask) {
							setRemoveSubtaskData({
								parentId: selectedTask.id,
								subtaskId: selectedTask.selectedSubtask.id
							});
							setShowRemoveSubtaskModal(true);
						}
						break;
					case 'clear-subtasks':
						setShowClearSubtasksModal(true);
						break;
					case 'show-task':
						// Handle show-task from search mode with params
						if (params && params.taskId) {
							setShowTaskDetail(true);
							setShowTaskDetailId(params.taskId);
						} else if (selectedTask) {
							setShowTaskDetail(true);
							setShowTaskDetailId(selectedTask.id);
						}
						break;
					case 'next-task':
						if (nextEligibleTasks.length > 0) {
							const nextTask = nextEligibleTasks[0];
							let targetIndex = -1;
							
							if (!showSubtasks) {
								targetIndex = tasks.findIndex(t => t.id === nextTask.id);
							} else {
								let lineIndex = 0;
								for (let i = 0; i < tasks.length; i++) {
									if (tasks[i].id === nextTask.id) {
										targetIndex = lineIndex;
										break;
									}
									lineIndex++;
									if (tasks[i].subtasks && tasks[i].subtasks.length > 0) {
										lineIndex += tasks[i].subtasks.length;
									}
								}
							}
							
							if (targetIndex >= 0 && targetIndex < totalItems) {
								selectItem(targetIndex);
							}
						}
						break;
					case 'update-status':
						if (selectedTask) {
							setStatusModalTaskId(selectedTask.id);
							setShowStatusModal(true);
						}
						break;
					case 'toggle-subtasks':
						setShowSubtasks(!showSubtasks);
						break;
					case 'refresh':
						await refreshTasks();
						addToast('Tasks refreshed', 'success');
						break;
					case 'generate-files':
						setLoadingMessage('Generating task files...');
						const genSuccess = await generateTaskFiles();
						setLoadingMessage('');
						if (genSuccess) {
							addToast('Task files generated successfully', 'success');
						} else {
							addToast('Failed to generate task files', 'error');
						}
						break;
					case 'sync-readme':
						setLoadingMessage('Syncing README...');
						const syncResult = await syncReadme();
						setLoadingMessage('');
						if (syncResult.success) {
							addToast('README synced successfully', 'success');
						} else {
							addToast(`Failed to sync README: ${syncResult.error}`, 'error');
						}
						break;
					case 'parse-prd':
						setShowPrdParserModal(true);
						break;
					case 'analyze-complexity':
						setShowComplexityAnalysisModal(true);
						break;
					case 'show-complexity-report':
						setShowComplexityReportModal(true);
						break;
					case 'expand-task':
						if (selectedTask) {
							setExpandTaskId(selectedTask.id);
							setShowTaskExpanderModal(true);
						}
						break;
					case 'expand-all':
						setLoadingMessage('Expanding all tasks...');
						const expandSuccess = await expandAll();
						setLoadingMessage('');
						if (expandSuccess) {
							addToast('All tasks expanded successfully', 'success');
						} else {
							addToast('Failed to expand all tasks', 'error');
						}
						break;
					case 'add-dependency':
						setDependencyManagerMode('add');
						setShowDependencyManagerModal(true);
						break;
					case 'remove-dependency':
						setDependencyManagerMode('remove');
						setShowDependencyManagerModal(true);
						break;
					case 'validate-dependencies':
						setShowDependencyValidatorModal(true);
						break;
					case 'project-setup':
						setShowProjectSetup(true);
						break;
					case 'model-manager':
					case 'configure-models':
						setShowModelManager(true);
						break;
					case 'help':
						setShowHelpOverlay(true);
						break;
					case 'quit':
						handleExit();
						break;
				}
				
				// Show success message if provided
				if (result.message) {
					addToast(result.message, 'success');
				}
			} else {
				// Show error message
				addToast(result.message || 'Command failed', 'error');
			}
		} catch (error) {
			addToast(`Error: ${error.message}`, 'error');
		}
	}, [getSelectedTask, projectRoot, tasks, metadata, showSubtasks, nextEligibleTasks, totalItems]);

	// Throttle input to prevent rapid firing
	const lastInputTime = useRef(0);

	useInput((input, key) => {
		const now = Date.now();
		if (now - lastInputTime.current < 50) {
			return;
		}
		lastInputTime.current = now;

		// Exit commands
		if (key.ctrl && input === 'c') {
			handleExit();
			return;
		}

		// Don't handle inputs when modals are open
		if (showTaskDetail || showStatusModal || showProjectSetup || 
			showCommandPalette || showHelpOverlay || showAddTaskModal ||
			showRemoveTaskModal || showUpdateTaskModal || showBatchUpdateModal ||
			showUpdateSubtaskModal || showAddSubtaskModal || showRemoveSubtaskModal ||
			showClearSubtasksModal || showPrdParserModal || showComplexityAnalysisModal ||
			showComplexityReportModal || showTaskExpanderModal || showDependencyManagerModal ||
			showDependencyValidatorModal || showModelManager) {
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

		// Command palette triggers
		if (input === '/') {
			setCommandPaletteMode('command');
			setShowCommandPalette(true);
			return;
		}

		if (input === '?') {
			setCommandPaletteMode('search');
			setShowCommandPalette(true);
			return;
		}

		// Direct keyboard shortcuts
		if (input === 'a') {
			setShowAddTaskModal(true);
			return;
		}

		if (input === 'r') {
			refreshTasks();
			return;
		}

		if (input === 'g') {
			executeCommand('generate-files', 'command');
			return;
		}

		if (input === 'n') {
			executeCommand('next-task', 'command');
			return;
		}

		if (input === 'u' && selectedIndex >= 0) {
			const selectedTask = getSelectedTask();
			if (selectedTask) {
				setStatusModalTaskId(selectedTask.id);
				setShowStatusModal(true);
			}
			return;
		}

		if (input === 's' && selectedIndex >= 0) {
			const selectedTask = getSelectedTask();
			if (selectedTask) {
				setShowTaskDetail(true);
				setShowTaskDetailId(selectedTask.id);
			}
			return;
		}

		if (key.tab) {
			setShowSubtasks(!showSubtasks);
			return;
		}

		if (input === 'p') {
			setShowProjectSetup(true);
			return;
		}

		if (input === 'h') {
			setShowHelpOverlay(true);
			return;
		}

		// View switching
		const viewMap = {
			1: 'all',
			2: 'pending',
			3: 'in-progress',
			4: 'completed'
		};

		if (viewMap[input] && viewMap[input] !== currentView) {
			setCurrentView(viewMap[input]);
			return;
		}
	});

	// Calculate which task to show based on selectedIndex and subtask mode
	const getTaskForSelectedIndex = () => {
		if (!showSubtasks) {
			return tasks[selectedIndex];
		}

		let currentLineIndex = 0;
		for (const task of tasks) {
			if (currentLineIndex === selectedIndex) {
				return task;
			}
			currentLineIndex++;

			if (task.subtasks && Array.isArray(task.subtasks)) {
				if (selectedIndex < currentLineIndex + task.subtasks.length) {
					return task;
				}
				currentLineIndex += task.subtasks.length;
			}
		}
		return null;
	};

	// Loading message overlay
	const renderLoadingOverlay = () => {
		if (!loadingMessage) return null;
		
		return (
			<Box
				position="absolute"
				top="50%"
				left="50%"
				borderStyle="round"
				borderColor="cyan"
				paddingX={2}
				paddingY={1}
			>
				<LoadingSpinner />
				<Text color="cyan"> {loadingMessage}</Text>
			</Box>
		);
	};

	if (error) {
		return (
			<Box flexDirection="column" height="100%" width="100%">
				<Box flexShrink={0} flexDirection="column" width="100%">
					<StatusBar
						projectRoot={projectRoot}
						metadata={metadata}
						error={error}
						nextTask={nextEligibleTasks[0]}
						selectedIndex={selectedIndex}
						projectStatus={projectStatus}
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

	// If showing help overlay, render it on top of everything
	if (showHelpOverlay) {
		return (
			<HelpOverlay
				onClose={() => setShowHelpOverlay(false)}
				selectedTask={getSelectedTask()}
			/>
		);
	}

	// If showing project setup, render only the ProjectSetup component
	if (showProjectSetup) {
		return (
			<ProjectSetup
				projectRoot={projectRoot}
				onBack={() => setShowProjectSetup(false)}
			/>
		);
	}

	// If showing task detail, render only the ShowTask component
	if (showTaskDetail && showTaskDetailId) {
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
						const findNextTaskIndex = (currentIndex, dir) => {
							if (!showSubtasks) {
								const newIndex =
									dir === 'next' ? currentIndex + 1 : currentIndex - 1;
								return Math.max(0, Math.min(newIndex, tasks.length - 1));
							}

							let lineIndex = 0;
							let currentTaskIndex = -1;

							for (let i = 0; i < tasks.length; i++) {
								if (lineIndex === currentIndex) {
									currentTaskIndex = i;
									break;
								}
								lineIndex++;

								if (tasks[i].subtasks?.length > 0) {
									if (currentIndex < lineIndex + tasks[i].subtasks.length) {
										currentTaskIndex = i;
										break;
									}
									lineIndex += tasks[i].subtasks.length;
								}
							}

							const targetTaskIndex =
								dir === 'next' ? currentTaskIndex + 1 : currentTaskIndex - 1;
							if (targetTaskIndex < 0 || targetTaskIndex >= tasks.length) {
								return currentIndex;
							}

							lineIndex = 0;
							for (let i = 0; i < targetTaskIndex; i++) {
								lineIndex++;
								if (tasks[i].subtasks?.length > 0) {
									lineIndex += tasks[i].subtasks.length;
								}
							}

							return lineIndex;
						};

						const newIndex = findNextTaskIndex(selectedIndex, direction);
						if (
							newIndex !== selectedIndex &&
							newIndex >= 0 &&
							newIndex < totalItems
						) {
							selectItem(newIndex);
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
					onOpenStatusModal={(taskId) => {
						setStatusModalTaskId(taskId);
						setShowStatusModal(true);
					}}
				/>
			);
		}
	}

	// Calculate space for command palette suggestions
	const commandPaletteHeight = showCommandPalette ? (suggestionCount > 0 ? suggestionCount + 3 : 2) : 0;
	const adjustedTaskListHeight = Math.max(5, terminalHeight - 12 - commandPaletteHeight);

	// Show onboarding flow if needed
	if (showOnboarding) {
		return (
			<OnboardingFlow
				projectRoot={projectRoot}
				parsePrd={parsePrd}
				onComplete={() => {
					setShowOnboarding(false);
					refreshTasks();
				}}
				onSkip={() => {
					setShowOnboarding(false);
				}}
			/>
		);
	}

	// If Add Task modal is open, render it in fullscreen to ensure visibility
	if (showAddTaskModal) {
		return (
			<Box
				flexDirection="column"
				width="100%"
				height={terminalHeight}
				alignItems="center"
				justifyContent="center"
			>
				<ModalDialog
					isOpen={true}
					title="Add New Task"
					width={90}
					height={Math.min(35, terminalHeight - 4)}
					onClose={() => {
						setShowAddTaskModal(false);
						setAddTaskInitialData({});
						setAddTaskLoading(false);
					}}
				>
					<TaskForm
						initialValues={addTaskInitialData}
						loading={addTaskLoading}
						onSubmit={async (taskData) => {
							// Check if this is an AI-generated task
							const isAiTask = taskData.prompt && !taskData.title;
							
							if (isAiTask) {
								setAddTaskLoading(true);
							}
							
							try {
								const success = await addTask(taskData);
								if (success) {
									addToast('Task added successfully', 'success');
									setShowAddTaskModal(false);
									setAddTaskInitialData({});
									// Refresh tasks to update the list
									await refreshTasks();
								} else {
									addToast('Failed to add task', 'error');
								}
								return success;
							} finally {
								if (isAiTask) {
									setAddTaskLoading(false);
								}
							}
						}}
						onCancel={() => {
							setShowAddTaskModal(false);
							setAddTaskInitialData({});
							setAddTaskLoading(false);
						}}
						isEdit={false}
						simplified={false}
					/>
				</ModalDialog>
			</Box>
		);
	}

	// If Task Expander modal is open, render it in fullscreen to ensure visibility
	if (showTaskExpanderModal) {
		return (
			<Box
				flexDirection="column"
				width="100%"
				height={terminalHeight}
				alignItems="center"
				justifyContent="center"
			>
				<ModalDialog
					isOpen={true}
					title="Expand Task"
					width={90}
					height={Math.min(35, terminalHeight - 4)}
					onClose={() => {
						setShowTaskExpanderModal(false);
						setExpandTaskId(null);
					}}
				>
					<TaskExpander
						tasks={tasks}
						complexityReport={null}
						onExpand={async (options) => {
							setLoadingMessage('Expanding task...');
							const success = await expandTask(options.taskId, options.numSubtasks, options);
							setLoadingMessage('');
							if (success) {
								addToast(`Task ${options.taskId} expanded`, 'success');
								setShowTaskExpanderModal(false);
								setExpandTaskId(null);
								// Force immediate refresh
								await refreshTasks();
							} else {
								addToast('Failed to expand task', 'error');
							}
							return success;
						}}
						onExpandAll={async (options) => {
							setLoadingMessage('Expanding all tasks...');
							const success = await expandAll(options);
							setLoadingMessage('');
							if (success) {
								addToast('All tasks expanded successfully', 'success');
								setShowTaskExpanderModal(false);
								setExpandTaskId(null);
								// Force immediate refresh
								await refreshTasks();
							} else {
								addToast('Failed to expand all tasks', 'error');
							}
							return success;
						}}
						onClose={() => {
							setShowTaskExpanderModal(false);
							setExpandTaskId(null);
						}}
					/>
				</ModalDialog>
			</Box>
		);
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
					projectStatus={projectStatus}
				/>
			</Box>

			{/* Main content area - uses flex to fill available space */}
			<Box flexGrow={1} overflow="hidden" width="100%" flexDirection="column">
				<TaskListContainer
					tasks={tasks}
					currentView={currentView}
					showSubtasks={showSubtasks}
					isLoading={loading}
					selectedTask={getSelectedTask()}
					selectedIndex={selectedIndex}
					handleViewChange={setCurrentView}
					toggleSubtasks={() => setShowSubtasks(!showSubtasks)}
					totalTasks={metadata?.totalTasks || 0}
					doneTasks={metadata?.completedTasks || 0}
					inProgressTasks={metadata?.inProgressTasks || 0}
					pendingTasks={metadata?.pendingTasks || 0}
					totalNavigableItems={totalItems}
					onDisplayedTasksChange={setDisplayedTasks}
					nextEligibleTasks={nextEligibleTasks}
					taskListItemAreaHeight={adjustedTaskListHeight}
				/>
			</Box>


			{/* Command palette - appears above footer when active */}
			<Box flexShrink={0} width="100%">
				<QuickSearchCommandPalette
					isActive={showCommandPalette}
					onClose={() => setShowCommandPalette(false)}
					mode={commandPaletteMode}
					onExecute={executeCommand}
					context={{
						selectedTask: getSelectedTask(),
						selectedSubtask: getSelectedTask()?.selectedSubtask,
						projectRoot,
						tasks,
						metadata,
						recentCommands
					}}
					tasks={tasks}
					onSuggestionsChange={(hasVisible, count) => setSuggestionCount(hasVisible ? count : 0)}
				/>
			</Box>

			{/* Consolidated footer with task details and shortcuts */}
			{tasks.length > 0 && !showCommandPalette && (
				<Box flexShrink={0} width="100%" flexDirection="column">
					<Box
						borderStyle="single"
						borderColor="gray"
						paddingX={1}
						width="100%"
						flexDirection="column"
					>
						{/* Task details row - only show when task is selected */}
						{(() => {
							const currentTask = getTaskForSelectedIndex();
							if (selectedIndex >= 0 && currentTask) {
								return (
									<Box flexDirection="row" width="100%" marginBottom={1}>
										<Box flexShrink={0}>
											<Text color="cyan" bold>Task {currentTask.id}</Text>
											<Text color="gray"> • </Text>
											<Text color={
												currentTask.status === 'done' ? 'green' :
												currentTask.status === 'in-progress' ? 'yellow' :
												'gray'
											}>{currentTask.status}</Text>
											<Text color="gray"> • </Text>
											<Text color={
												currentTask.priority === 'high' ? 'red' :
												currentTask.priority === 'medium' ? 'yellow' :
												'gray'
											}>{currentTask.priority}</Text>
											{currentTask.dependencies?.length > 0 && (
												<>
													<Text color="gray"> • </Text>
													<Text color="#F59E0B">deps: {currentTask.dependencies.length}</Text>
												</>
											)}
											{currentTask.subtasks?.length > 0 && (
												<>
													<Text color="gray"> • </Text>
													<Text color="cyan">subtasks: {currentTask.subtasks.length}</Text>
												</>
											)}
										</Box>
										<Box flexGrow={1} marginLeft={2}>
											<Text color="gray" dimColor wrap="truncate">
												{currentTask.description ? 
													(currentTask.description.length > 60 ? 
														currentTask.description.substring(0, 57) + '...' : 
														currentTask.description) :
													'No description'}
											</Text>
										</Box>
									</Box>
								);
							}
							return null;
						})()}
						
						{/* Keyboard shortcuts row */}
						<Box flexDirection="row" width="100%">
							<Text color="gray" dimColor>
								↑/↓: Navigate • Enter: Toggle • S: Show • /: Cmd • ?: Search • Tab: Subtasks {showSubtasks ? '✓' : '✗'} • Q: Quit
							</Text>
						</Box>
					</Box>
				</Box>
			)}

			{/* Toast notifications */}
			<ToastContainer toasts={toasts} onDismiss={dismissToast} />

			{/* Loading overlay */}
			{renderLoadingOverlay()}

			{/* Modals */}
			
			{/* Status Update Modal */}
			{showStatusModal && statusModalTaskId && (() => {
				const taskToUpdate = tasks.find(t => t.id === statusModalTaskId);
				if (!taskToUpdate) return null;
				
				const availableStatuses = ['pending', 'in-progress', 'done', 'blocked', 'deferred', 'cancelled'];
				
				return (
					<ModalDialog
						isOpen={true}
						title={`Update Status: ${taskToUpdate.title}`}
						width={60}
						height={20}
						onClose={() => setShowStatusModal(false)}
					>
						<StatusSelectorWithOptions
							currentStatus={taskToUpdate.status}
							availableStatuses={availableStatuses}
							onSelect={async (newStatus, options) => {
								const success = await updateTaskStatus(String(taskToUpdate.id), newStatus);
								if (success) {
									addToast(`Task ${taskToUpdate.id} status updated to ${newStatus}`, 'success');
									// Force immediate refresh
									await refreshTasks();
								} else {
									addToast('Failed to update task status', 'error');
								}
								setShowStatusModal(false);
							}}
							hasSubtasks={taskToUpdate.subtasks && taskToUpdate.subtasks.length > 0}
							subtaskCount={taskToUpdate.subtasks ? taskToUpdate.subtasks.length : 0}
							taskTitle={taskToUpdate.title}
						/>
					</ModalDialog>
				);
			})()}

			{/* Add Task Modal */}
			{/* Add Task Modal is now rendered in fullscreen mode above */}

			{/* Remove Task Modal */}
			{showRemoveTaskModal && removeTaskId && (
				<ConfirmDialog
					isOpen={showRemoveTaskModal}
					title="Remove Task"
					message={`Are you sure you want to remove task ${removeTaskId}?`}
					confirmText="Remove"
					cancelText="Cancel"
					onConfirm={async () => {
						const success = await removeTask(removeTaskId);
						if (success) {
							addToast(`Task ${removeTaskId} removed`, 'success');
							// Force immediate refresh
							await refreshTasks();
						} else {
							addToast('Failed to remove task', 'error');
						}
						setShowRemoveTaskModal(false);
						setRemoveTaskId(null);
					}}
					onCancel={() => {
						setShowRemoveTaskModal(false);
						setRemoveTaskId(null);
					}}
				/>
			)}

			{/* Update Task Modal */}
			{showUpdateTaskModal && updateTaskId && (
				<ModalDialog
					isOpen={true}
					title="Update Task"
					width={80}
					height={12}
					onClose={() => {
						setShowUpdateTaskModal(false);
						setUpdateTaskId(null);
					}}
				>
					<UpdatePromptEnhanced
						taskId={updateTaskId}
						taskTitle={tasks.find(t => t.id === updateTaskId)?.title || ''}
						currentStatus={tasks.find(t => t.id === updateTaskId)?.status || ''}
						onCancel={() => {
							setShowUpdateTaskModal(false);
							setUpdateTaskId(null);
						}}
						onSubmit={async (prompt) => {
							setLoadingMessage('Updating task...');
							const success = await updateTask(updateTaskId, prompt.prompt);
							setLoadingMessage('');
							if (success) {
								addToast(`Task ${updateTaskId} updated`, 'success');
								setShowUpdateTaskModal(false);
								setUpdateTaskId(null);
								// Force immediate refresh
								await refreshTasks();
							} else {
								addToast('Failed to update task', 'error');
							}
						}}
					/>
				</ModalDialog>
			)}

			{/* Batch Update Modal */}
			{showBatchUpdateModal && (
				<BatchUpdateModal
					tasks={tasks}
					onClose={() => setShowBatchUpdateModal(false)}
					onUpdate={async (fromId, prompt) => {
						setLoadingMessage('Updating tasks...');
						const success = await batchUpdate(fromId, prompt);
						setLoadingMessage('');
						if (success) {
							addToast('Tasks updated successfully', 'success');
							setShowBatchUpdateModal(false);
							// Force immediate refresh
							await refreshTasks();
						} else {
							addToast('Failed to update tasks', 'error');
						}
					}}
				/>
			)}

			{/* Update Subtask Modal */}
			{showUpdateSubtaskModal && updateSubtaskData && (
				<UpdateSubtaskPrompt
					parentId={updateSubtaskData.parentId}
					subtaskId={updateSubtaskData.subtaskId}
					tasks={tasks}
					onClose={() => {
						setShowUpdateSubtaskModal(false);
						setUpdateSubtaskData(null);
					}}
					onUpdate={async (prompt) => {
						const subtaskFullId = `${updateSubtaskData.parentId}.${updateSubtaskData.subtaskId}`;
						setLoadingMessage('Updating subtask...');
						const success = await updateSubtask(subtaskFullId, prompt);
						setLoadingMessage('');
						if (success) {
							addToast(`Subtask ${subtaskFullId} updated`, 'success');
							setShowUpdateSubtaskModal(false);
							setUpdateSubtaskData(null);
							// Force immediate refresh
							await refreshTasks();
						} else {
							addToast('Failed to update subtask', 'error');
						}
					}}
				/>
			)}

			{/* Add Subtask Modal */}
			{showAddSubtaskModal && addSubtaskData && (
				<SubtaskManager
					parentTaskId={addSubtaskData.parentId}
					parentTaskTitle={tasks.find(t => t.id === addSubtaskData.parentId)?.title || 'Unknown Task'}
					onCancel={() => {
						setShowAddSubtaskModal(false);
						setAddSubtaskData(null);
					}}
					onSubmit={async (subtaskData) => {
						setLoadingMessage('Adding subtask...');
						const success = await addSubtask(addSubtaskData.parentId, subtaskData);
						setLoadingMessage('');
						if (success) {
							addToast('Subtask added successfully', 'success');
							setShowAddSubtaskModal(false);
							setAddSubtaskData(null);
							// Force immediate refresh
							await refreshTasks();
						} else {
							addToast('Failed to add subtask', 'error');
						}
						return success;
					}}
				/>
			)}

			{/* Remove Subtask Modal */}
			{showRemoveSubtaskModal && removeSubtaskData && (
				<RemoveSubtaskDialog
					parentTaskId={removeSubtaskData.parentId}
					parentTaskTitle={tasks.find(t => t.id === removeSubtaskData.parentId)?.title || 'Unknown Task'}
					subtaskId={removeSubtaskData.subtaskId}
					subtaskTitle={(() => {
						const parent = tasks.find(t => t.id === removeSubtaskData.parentId);
						const subtask = parent?.subtasks?.find(st => st.id === removeSubtaskData.subtaskId);
						return subtask?.title || 'Unknown Subtask';
					})()}
					onCancel={() => {
						setShowRemoveSubtaskModal(false);
						setRemoveSubtaskData(null);
					}}
					onConfirm={async (convert) => {
						const success = await removeSubtask(
							removeSubtaskData.parentId,
							removeSubtaskData.subtaskId,
							convert
						);
						if (success) {
							addToast(
								convert ? 'Subtask converted to task' : 'Subtask removed',
								'success'
							);
							// Force immediate refresh
							await refreshTasks();
						} else {
							addToast('Failed to remove subtask', 'error');
						}
						setShowRemoveSubtaskModal(false);
						setRemoveSubtaskData(null);
					}}
				/>
			)}

			{/* Clear Subtasks Modal */}
			{showClearSubtasksModal && (
				<ClearSubtasksDialog
					onClose={() => setShowClearSubtasksModal(false)}
					onConfirm={async (all) => {
						setLoadingMessage('Clearing subtasks...');
						const success = await clearSubtasks(all);
						setLoadingMessage('');
						if (success) {
							addToast(
								all ? 'All subtasks cleared' : 'Selected subtasks cleared',
								'success'
							);
							// Force immediate refresh
							await refreshTasks();
						} else {
							addToast('Failed to clear subtasks', 'error');
						}
						setShowClearSubtasksModal(false);
					}}
				/>
			)}

			{/* PRD Parser Modal */}
			{showPrdParserModal && (
				<PrdParser
					projectRoot={projectRoot}
					onClose={() => setShowPrdParserModal(false)}
					onComplete={async (options) => {
						setLoadingMessage('Parsing PRD...');
						const success = await parsePrd(options);
						setLoadingMessage('');
						if (success) {
							addToast('PRD parsed successfully', 'success');
							setShowPrdParserModal(false);
						} else {
							addToast('Failed to parse PRD', 'error');
						}
					}}
				/>
			)}

			{/* Complexity Analysis Modal */}
			{showComplexityAnalysisModal && (
				<ComplexityAnalysis
					tasks={tasks}
					onClose={() => setShowComplexityAnalysisModal(false)}
					onAnalyze={async (options) => {
						setLoadingMessage('Analyzing complexity...');
						const success = await analyzeComplexity(options);
						setLoadingMessage('');
						if (success) {
							addToast('Complexity analysis complete', 'success');
							setShowComplexityAnalysisModal(false);
							// Optionally show the report
							setShowComplexityReportModal(true);
						} else {
							addToast('Failed to analyze complexity', 'error');
						}
					}}
				/>
			)}

			{/* Complexity Report Modal */}
			{showComplexityReportModal && (
				<ComplexityReport
					projectRoot={projectRoot}
					onClose={() => setShowComplexityReportModal(false)}
					getComplexityReport={getComplexityReport}
				/>
			)}


			{/* Dependency Manager Modal */}
			{showDependencyManagerModal && (
				<DependencyManager
					mode={dependencyManagerMode}
					tasks={tasks}
					selectedTask={getSelectedTask()}
					onClose={() => setShowDependencyManagerModal(false)}
					onAdd={async (taskId, dependsOn) => {
						const success = await addDependency(taskId, dependsOn);
						if (success) {
							addToast('Dependency added', 'success');
						} else {
							addToast('Failed to add dependency', 'error');
						}
						setShowDependencyManagerModal(false);
					}}
					onRemove={async (taskId, dependsOn) => {
						const success = await removeDependency(taskId, dependsOn);
						if (success) {
							addToast('Dependency removed', 'success');
						} else {
							addToast('Failed to remove dependency', 'error');
						}
						setShowDependencyManagerModal(false);
					}}
				/>
			)}

			{/* Dependency Validator Modal */}
			{showDependencyValidatorModal && (
				<DependencyValidator
					onClose={() => setShowDependencyValidatorModal(false)}
					onValidate={validateDependencies}
					onFix={async () => {
						setLoadingMessage('Fixing dependencies...');
						const success = await fixDependencies();
						setLoadingMessage('');
						if (success) {
							addToast('Dependencies fixed', 'success');
						} else {
							addToast('Failed to fix dependencies', 'error');
						}
					}}
				/>
			)}

			{/* Model Manager Modal */}
			{showModelManager && (
				<ModelManager
					projectRoot={projectRoot}
					onClose={() => setShowModelManager(false)}
				/>
			)}
		</Box>
	);
}