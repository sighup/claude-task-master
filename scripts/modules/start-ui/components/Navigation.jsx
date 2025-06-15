import React, { memo } from 'react';
import { Box, Text } from 'ink';

const VIEWS = [
	{ key: 'all', label: 'All Tasks', shortcut: '1' },
	{ key: 'pending', label: 'Pending', shortcut: '2' },
	{ key: 'in-progress', label: 'In Progress', shortcut: '3' },
	{ key: 'completed', label: 'Completed', shortcut: '4' }
];

/**
 * Navigation component showing available views and keyboard shortcuts
 * @param {Object} props - Component props
 * @param {string} props.currentView - Currently active view ('all', 'pending', 'in-progress', 'done')
 * @param {Function} [props.onViewChange] - Callback when view changes (not used directly)
 * @param {number} props.totalTasks - Total number of tasks
 * @param {number} props.doneTasks - Number of completed tasks
 * @param {number} props.totalNavigableItems - Total number of items being displayed (including subtasks)
 * @param {number} props.selectedIndex - Currently selected index
 * @returns {React.Component} The navigation component
 */
export const Navigation = memo(function Navigation({ 
	currentView, 
	onViewChange, 
	totalTasks = 0,
	doneTasks = 0,
	inProgressTasks = 0,
	pendingTasks = 0,
	totalNavigableItems = 0,
	selectedIndex = 0
}) {
	// Calculate percentage based on current view
	const getPercentage = () => {
		if (currentView === 'all') {
			// For all tasks, show percentage of completed tasks
			return totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
		}
		// For filtered views, always show percentage of total navigable items shown
		return totalNavigableItems > 0 ? Math.round((totalNavigableItems / totalTasks) * 100) : 0;
	};
	
	// Format view label with counts
	const getViewLabel = (view) => {
		switch (view.key) {
			case 'all':
				return `All Tasks (${totalTasks})`;
			case 'pending':
				return `Pending (${pendingTasks})`;
			case 'in-progress':
				return `In Progress (${inProgressTasks})`;
			case 'completed':
				return `Completed (${doneTasks})`;
			default:
				return view.label;
		}
	};
	return (
		<Box flexDirection="row" width="100%" marginBottom={0}>
			<Text>
				{/* View label */}
				<Text bold>{getViewLabel(VIEWS.find(v => v.key === currentView))}</Text>
				{/* Separator */}
				<Text dimColor> - </Text>
				{/* Showing information */}
				<Text dimColor>
					Showing {String(selectedIndex + 1).padStart(3, ' ')}-{String(Math.min(selectedIndex + 1, totalNavigableItems)).padStart(3, ' ')} of {String(totalNavigableItems).padStart(3, ' ')} ({String(getPercentage()).padStart(3, ' ')}%)
				</Text>
			</Text>
		</Box>
	);
});
