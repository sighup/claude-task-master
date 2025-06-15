import React, { useMemo, memo } from 'react';
import { Box, Text } from 'ink';
import { TreeTaskItem } from './TreeTaskItem.jsx';
import { TaskListSkeleton } from './LoadingStates.jsx';

export const TreeTaskList = memo(function TreeTaskList({
	tasks,
	selectedIndex = -1,
	loading = false,
	showSubtasks = true,
	nextEligibleTasks = [],
	itemAreaHeight = 15
}) {
	// Use the provided height or default
	const VISIBLE_ITEMS = Math.max(5, Math.floor(itemAreaHeight));

	// Transform tasks into a flat list with proper tree structure
	const flattenedTasks = useMemo(() => {
		if (!tasks || tasks.length === 0) return [];
		
		const result = [];
		
		tasks.forEach(task => {
			// Add parent task
			result.push({
				...task,
				depth: 0,
				isSubtask: false
			});
			
			// Add subtasks if showing
			if (showSubtasks && task.subtasks && task.subtasks.length > 0) {
				task.subtasks.forEach((subtask, index) => {
					result.push({
						...subtask,
						isSubtask: true,
						parentId: task.id,
						subtaskIndex: index + 1,  // 1-based index for display
						depth: 1,
						isLastSubtaskInGroup: index === task.subtasks.length - 1
					});
				});
			}
		});
		
		return result;
	}, [tasks, showSubtasks]);

	// Calculate window based on selected index
	const { displayItems, startIndex, showTopIndicator, showBottomIndicator } = useMemo(() => {
		const totalItems = flattenedTasks.length;
		
		if (totalItems === 0) {
			return { displayItems: [], startIndex: 0, showTopIndicator: false, showBottomIndicator: false };
		}
		
		// Calculate the window to keep selected item visible
		let start = 0;
		
		if (selectedIndex >= 0) {
			// Keep selected item in the middle of the view when possible
			const halfVisible = Math.floor(VISIBLE_ITEMS / 2);
			start = Math.max(0, selectedIndex - halfVisible);
			
			// Adjust if we're near the end
			if (start + VISIBLE_ITEMS > totalItems) {
				start = Math.max(0, totalItems - VISIBLE_ITEMS);
			}
		}
		
		const end = Math.min(start + VISIBLE_ITEMS, totalItems);
		const items = flattenedTasks.slice(start, end);
		
		return {
			displayItems: items,
			startIndex: start,
			showTopIndicator: start > 0,
			showBottomIndicator: end < totalItems
		};
	}, [flattenedTasks, selectedIndex, VISIBLE_ITEMS]);

	if (loading && (!tasks || tasks.length === 0)) {
		return <TaskListSkeleton />;
	}

	return (
		<Box flexDirection="column" width="100%" flexGrow={1}>
			{/* Scroll indicator - top */}
			{showTopIndicator && (
				<Box width="100%" justifyContent="center" paddingY={0}>
					<Text color="gray" dimColor>▲ More tasks above ▲</Text>
				</Box>
			)}
			
			{/* Task list */}
			<Box flexDirection="column" width="100%" flexGrow={1}>
				{displayItems.map((item, index) => {
					const actualIndex = startIndex + index;
					const isSelected = actualIndex === selectedIndex;
					const isNextEligible = nextEligibleTasks.some(t => t.id === item.id);
					const uniqueKey = item.isSubtask ? `${item.parentId}-${item.id}` : item.id;

					return (
						<TreeTaskItem
							key={uniqueKey}
							task={item}
							isSelected={isSelected}
							isNextEligible={isNextEligible}
							depth={item.depth}
						/>
					);
				})}
			</Box>
			
			{/* Scroll indicator - bottom */}
			{showBottomIndicator && (
				<Box width="100%" justifyContent="center" paddingY={0}>
					<Text color="gray" dimColor>▼ More tasks below ▼</Text>
				</Box>
			)}
		</Box>
	);
}, (prevProps, nextProps) => {
	// Custom comparison function - only re-render if these specific props change
	return (
		prevProps.selectedIndex === nextProps.selectedIndex &&
		prevProps.loading === nextProps.loading &&
		prevProps.showSubtasks === nextProps.showSubtasks &&
		prevProps.itemAreaHeight === nextProps.itemAreaHeight &&
		// Deep compare tasks array
		JSON.stringify(prevProps.tasks) === JSON.stringify(nextProps.tasks) &&
		// Deep compare nextEligibleTasks
		JSON.stringify(prevProps.nextEligibleTasks) === JSON.stringify(nextProps.nextEligibleTasks)
	);
});