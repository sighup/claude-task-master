import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

/**
 * ViewContext - Manages current view state and available actions
 */
const ViewContext = createContext();

/**
 * View types
 */
export const ViewTypes = {
	TASK_LIST: 'taskList',
	TASK_DETAIL: 'taskDetail',
	EMPTY_PROJECT: 'emptyProject',
	SEARCH: 'search',
	COMMAND: 'command',
	HELP: 'help',
	MODAL: 'modal'
};

/**
 * ViewProvider - Provides view context to children
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function ViewProvider({ children }) {
	const [currentView, setCurrentView] = useState(ViewTypes.TASK_LIST);
	const [viewStack, setViewStack] = useState([ViewTypes.TASK_LIST]);
	const [selection, setSelection] = useState(null);
	const [capabilities, setCapabilities] = useState({});
	
	// Push a new view onto the stack
	const pushView = useCallback((view, options = {}) => {
		setViewStack(prev => [...prev, view]);
		setCurrentView(view);
		if (options.selection) {
			setSelection(options.selection);
		}
		if (options.capabilities) {
			setCapabilities(options.capabilities);
		}
	}, []);
	
	// Pop the current view and return to previous
	const popView = useCallback(() => {
		setViewStack(prev => {
			if (prev.length <= 1) return prev;
			const newStack = prev.slice(0, -1);
			setCurrentView(newStack[newStack.length - 1]);
			return newStack;
		});
	}, []);
	
	// Replace current view
	const replaceView = useCallback((view, options = {}) => {
		setCurrentView(view);
		setViewStack(prev => [...prev.slice(0, -1), view]);
		if (options.selection) {
			setSelection(options.selection);
		}
		if (options.capabilities) {
			setCapabilities(options.capabilities);
		}
	}, []);
	
	// Get available actions for current view
	const getAvailableActions = useCallback(() => {
		const actions = {
			[ViewTypes.TASK_LIST]: [
				{ id: 'navigate', keys: 'j/k', description: 'Navigate tasks' },
				{ id: 'viewDetails', keys: 'Enter', description: 'View details', requiresSelection: true },
				{ id: 'addTask', keys: 'a', description: 'Add new task' },
				{ id: 'updateStatus', keys: 'u', description: 'Update status', requiresSelection: true },
				{ id: 'removeTask', keys: 'r', description: 'Remove task', requiresSelection: true },
				{ id: 'editTask', keys: 'e', description: 'Edit task', requiresSelection: true },
				{ id: 'toggleSubtasks', keys: 's', description: 'Toggle subtasks' },
				{ id: 'search', keys: '?', description: 'Search tasks' },
				{ id: 'command', keys: '/', description: 'Command palette' }
			],
			[ViewTypes.TASK_DETAIL]: [
				{ id: 'navigate', keys: 'j/k', description: 'Navigate' },
				{ id: 'editTask', keys: 'e', description: 'Edit task' },
				{ id: 'addSubtask', keys: 'A', description: 'Add subtask' },
				{ id: 'removeSubtask', keys: 'R', description: 'Remove subtask', requiresSubtaskSelection: true },
				{ id: 'updateSubtask', keys: 'E', description: 'Update subtask', requiresSubtaskSelection: true },
				{ id: 'expandTask', keys: 'v', description: 'Expand task', disabled: capabilities.hasSubtasks },
				{ id: 'updateStatus', keys: 'u', description: 'Update status' },
				{ id: 'back', keys: 'ESC', description: 'Back to list' }
			],
			[ViewTypes.EMPTY_PROJECT]: [
				{ id: 'configureModels', keys: 'M', description: 'Configure models' },
				{ id: 'parsePRD', keys: 'P', description: 'Parse PRD' },
				{ id: 'addTask', keys: 'a', description: 'Add first task' },
				{ id: 'help', keys: 'h', description: 'Show help' }
			],
			[ViewTypes.SEARCH]: [
				{ id: 'search', keys: 'Enter', description: 'Search' },
				{ id: 'complete', keys: 'Tab', description: 'Auto-complete' },
				{ id: 'history', keys: '↑↓', description: 'Search history' },
				{ id: 'cancel', keys: 'ESC', description: 'Cancel' }
			],
			[ViewTypes.COMMAND]: [
				{ id: 'execute', keys: 'Enter', description: 'Execute' },
				{ id: 'complete', keys: 'Tab', description: 'Complete command' },
				{ id: 'history', keys: '↑↓', description: 'Command history' },
				{ id: 'cancel', keys: 'ESC', description: 'Cancel' }
			]
		};
		
		const viewActions = actions[currentView] || [];
		
		// Filter based on current state
		return viewActions.filter(action => {
			if (action.requiresSelection && !selection) return false;
			if (action.requiresSubtaskSelection && !selection?.isSubtask) return false;
			if (action.disabled) return false;
			return true;
		});
	}, [currentView, selection, capabilities]);
	
	// Context value
	const value = useMemo(() => ({
		currentView,
		viewStack,
		selection,
		capabilities,
		pushView,
		popView,
		replaceView,
		setSelection,
		setCapabilities,
		getAvailableActions,
		isInView: (view) => currentView === view,
		canGoBack: viewStack.length > 1
	}), [
		currentView,
		viewStack,
		selection,
		capabilities,
		pushView,
		popView,
		replaceView,
		getAvailableActions
	]);
	
	return (
		<ViewContext.Provider value={value}>
			{children}
		</ViewContext.Provider>
	);
}

/**
 * useView - Hook to access view context
 * @returns {Object} View context
 */
export function useView() {
	const context = useContext(ViewContext);
	if (!context) {
		throw new Error('useView must be used within ViewProvider');
	}
	return context;
}

/**
 * useViewActions - Hook to get current view's available actions
 * @returns {Array} Available actions
 */
export function useViewActions() {
	const { getAvailableActions } = useView();
	return getAvailableActions();
}

/**
 * useViewNavigation - Hook for view navigation
 * @returns {Object} Navigation functions
 */
export function useViewNavigation() {
	const { pushView, popView, replaceView, canGoBack } = useView();
	
	return {
		goTo: pushView,
		goBack: popView,
		replace: replaceView,
		canGoBack
	};
}

export default ViewContext;