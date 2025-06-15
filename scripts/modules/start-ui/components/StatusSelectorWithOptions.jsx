import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';

const STATUS_CONFIG = {
	'pending': { icon: '○', color: 'yellow' },
	'in-progress': { icon: '►', color: 'blue' },
	'done': { icon: '✓', color: 'green' },
	'deferred': { icon: '⌛', color: 'gray' },
	'cancelled': { icon: '✗', color: 'red' },
	'review': { icon: '👁', color: 'magenta' }
};

/**
 * StatusSelectorWithOptions - Status selector with additional options
 * Combines StatusSelector functionality with subtask options
 * @param {Object} props
 * @param {string} props.currentStatus - Current status
 * @param {string[]} props.availableStatuses - Available status options
 * @param {Function} props.onSelect - Callback when status is selected
 * @param {boolean} props.hasSubtasks - Whether the task has subtasks
 * @param {number} props.subtaskCount - Number of subtasks
 * @param {string} props.taskTitle - Task title for context (optional)
 */
const StatusSelectorWithOptions = ({
	currentStatus,
	availableStatuses,
	onSelect,
	hasSubtasks = false,
	subtaskCount = 0,
	taskTitle = ''
}) => {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [withSubtasks, setWithSubtasks] = useState(false);

	// Total items: statuses + checkbox (if has subtasks)
	const totalItems = availableStatuses.length + (hasSubtasks ? 1 : 0);
	const isOnCheckbox = hasSubtasks && selectedIndex === availableStatuses.length;

	useInput((input, key) => {
		if (key.escape) {
			return; // Let parent handle escape
		}

		// Navigation
		if (key.upArrow) {
			setSelectedIndex(Math.max(0, selectedIndex - 1));
			return;
		}

		if (key.downArrow) {
			setSelectedIndex(Math.min(totalItems - 1, selectedIndex + 1));
			return;
		}

		// Toggle checkbox with space when on checkbox item
		if (key.space && isOnCheckbox) {
			setWithSubtasks(!withSubtasks);
			return;
		}

		// Selection with Enter
		if (key.return) {
			if (selectedIndex < availableStatuses.length) {
				// Selected a status
				onSelect(availableStatuses[selectedIndex], withSubtasks);
			} else if (isOnCheckbox) {
				// Toggle checkbox
				setWithSubtasks(!withSubtasks);
			}
			return;
		}

		// Number key shortcuts for statuses
		const num = parseInt(input);
		if (!isNaN(num) && num >= 1 && num <= availableStatuses.length) {
			onSelect(availableStatuses[num - 1], withSubtasks);
		}
	});

	return (
		<Box flexDirection="column">
			{/* Task Context - only show if taskTitle provided */}
			{taskTitle && (
				<Box marginBottom={1} paddingX={1}>
					<Text color="cyan" bold>Task: </Text>
					<Text color="white">{taskTitle}</Text>
				</Box>
			)}
			
			{/* Status list */}
			<Box flexDirection="column">
				<Box paddingX={1} marginBottom={1}>
					<Text bold color="cyan">Update Status</Text>
					<Text color="gray"> (Current: {currentStatus})</Text>
				</Box>
				
				{availableStatuses.map((status, index) => {
					const isSelected = selectedIndex === index && !isOnCheckbox;
					const config = STATUS_CONFIG[status] || { icon: '?', color: 'white' };
					
					return (
						<Box key={status} paddingX={1}>
							<Text color={isSelected ? 'cyan' : 'gray'}>
								{isSelected ? '▶ ' : '  '}
							</Text>
							<Text color="gray">{index + 1}. </Text>
							<Text color={config.color}>
								{config.icon}{' '}
							</Text>
							<Text bold={isSelected} color={isSelected ? 'white' : undefined}>
								{status}
							</Text>
						</Box>
					);
				})}
			</Box>

			{/* With subtasks option */}
			{hasSubtasks && (
				<Box marginTop={1} paddingX={1}>
					<Box>
						<Text color={isOnCheckbox ? 'cyan' : 'gray'}>
							{isOnCheckbox ? '▶ ' : '  '}
						</Text>
						<Text color="white">[</Text>
						<Text color={withSubtasks ? 'green' : 'gray'}>
							{withSubtasks ? '✓' : ' '}
						</Text>
						<Text color="white">] </Text>
						<Text>Also update {subtaskCount} subtask{subtaskCount !== 1 ? 's' : ''}</Text>
					</Box>
					{isOnCheckbox && (
						<Box paddingLeft={4}>
							<Text color="gray" dimColor>
								(Space to toggle)
							</Text>
						</Box>
					)}
				</Box>
			)}
		</Box>
	);
};

export default StatusSelectorWithOptions;