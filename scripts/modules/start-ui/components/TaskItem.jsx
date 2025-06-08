import React from 'react';
import { Box, Text } from 'ink';

// Match exact colors from CLI task-master list command
const STATUS_COLORS = {
	done: '#10B981', // green - matches chalk.green
	completed: '#10B981', // green - matches chalk.green
	pending: '#EAB308', // yellow - matches chalk.yellow
	'in-progress': '#FFA500', // orange - matches chalk.hex('#FFA500')
	blocked: '#EF4444', // red - matches chalk.red
	review: '#D946EF', // magenta - matches chalk.magenta
	deferred: '#6B7280', // gray - matches chalk.gray
	cancelled: '#6B7280' // gray - matches chalk.gray
};

const STATUS_SYMBOLS = {
	done: '✓', // matches CLI
	completed: '✓', // matches CLI
	pending: '○', // matches CLI (changed from ◦)
	'in-progress': '►', // matches CLI (changed from ⧗)
	blocked: '!', // matches CLI
	review: '?', // matches CLI (changed from ⟳)
	deferred: 'x', // matches CLI (changed from ⏸)
	cancelled: '✗' // matches CLI
};

const PRIORITY_COLORS = {
	high: '#EF4444', // red - matches chalk.red.bold
	medium: '#EAB308', // yellow - matches chalk.yellow
	low: '#6B7280' // gray - matches chalk.gray
};

// Separate component for subtask rows
export function SubtaskRow({ parentId, subtask, isLast = false }) {
	const subtaskStatusColor = STATUS_COLORS[subtask.status] || '#6B7280';
	const subtaskSymbol = STATUS_SYMBOLS[subtask.status] || '?';

	// Build simple string to avoid text wrapping issues
	const subtaskString = `  ${isLast ? '└─' : '├─'} ${subtaskSymbol} ${parentId}.${subtask.id} ${subtask.title}`;

	return (
		<Box paddingX={1} width="100%">
			<Text color={subtaskStatusColor}>{subtaskString}</Text>
		</Box>
	);
}

export function TaskItem({
	task,
	isSelected = false,
	showSubtasks = false,
	isNextEligible = false
}) {
	const statusColor = STATUS_COLORS[task.status] || 'white';
	const statusSymbol = STATUS_SYMBOLS[task.status] || '?';
	const priorityColor = PRIORITY_COLORS[task.priority] || 'white';

	// Debug: Track which tasks are missing subtasks
	if (
		showSubtasks &&
		task.id >= 4 &&
		task.id <= 11 &&
		(!task.subtasks || task.subtasks.length === 0)
	) {
		// Task should have subtasks but doesn't - data loading issue
	}

	// Complexity indicators (from CLI interface inspiration)
	const getComplexityIndicator = (complexity) => {
		if (!complexity) return { symbol: '○', color: '#6B7280' };
		if (complexity <= 3) return { symbol: '●', color: '#10B981' }; // Green
		if (complexity <= 6) return { symbol: '●', color: '#EAB308' }; // Yellow
		if (complexity <= 8) return { symbol: '●', color: '#F59E0B' }; // Orange
		return { symbol: '●', color: '#EF4444' }; // Red
	};

	const complexityInfo = getComplexityIndicator(task.complexity);

	// No truncation - let text use full available width
	const truncateText = (text) => text;

	// Build a simple string instead of nested Text components to avoid wrapping issues
	let taskString = `${statusSymbol} ${task.id} ${task.priority ? task.priority.charAt(0).toUpperCase() : 'M'} ${task.title}`;
	if (task.complexity) {
		taskString += ` ${complexityInfo.symbol}${task.complexity}`;
	}
	if (task.dependencies && task.dependencies.length > 0) {
		taskString += ` (deps: ${task.dependencies.length})`;
	}

	const taskContent = (
		<Text color={statusColor} wrap="truncate">
			{taskString}
		</Text>
	);

	// TaskItem only renders the parent task - no subtasks here
	if (isSelected) {
		return (
			<Box
				backgroundColor="#3B82F6"
				paddingX={1}
				width="100%"
				overflow="hidden"
			>
				<Text color="white" bold wrap="truncate">
					{taskString}
				</Text>
			</Box>
		);
	}

	return (
		<Box paddingX={1} width="100%" overflow="hidden">
			{taskContent}
		</Box>
	);
}
