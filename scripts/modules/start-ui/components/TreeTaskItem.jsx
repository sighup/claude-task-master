import React, { memo } from 'react';
import { Box, Text } from 'ink';

// Match exact colors from CLI task-master list command
const STATUS_COLORS = {
	done: '#10B981',
	completed: '#10B981',
	pending: '#EAB308',
	'in-progress': '#FFA500',
	blocked: '#EF4444',
	review: '#D946EF',
	deferred: '#6B7280',
	cancelled: '#6B7280'
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

const PRIORITY_INDICATORS = {
	high: 'H',
	medium: 'M',
	low: 'L'
};

const PRIORITY_COLORS = {
	high: '#EF4444',
	medium: '#EAB308',
	low: '#6B7280'
};

export const TreeTaskItem = memo(function TreeTaskItem({ task, isSelected, isNextEligible, depth = 0 }) {
	const statusIcon = STATUS_SYMBOLS[task.status] || '?';
	const statusColor = STATUS_COLORS[task.status] || '#6B7280';
	const isSubtask = task.isSubtask || false;
	const priority = task.priority || 'medium';
	const priorityIndicator = PRIORITY_INDICATORS[priority] || 'M';
	const priorityColor = PRIORITY_COLORS[priority];

	let titleColor = 'white';
	if (isSelected) {
		titleColor = 'white';
	} else if (task.status === 'done' || task.status === 'completed') {
		titleColor = '#6B7280';
	} else if (isNextEligible) {
		titleColor = '#EAB308';
	}

	const title = task.title || 'No title';
	
	// Format dependencies count if present
	const depsInfo = task.dependencies && task.dependencies.length > 0 
		? ` (deps: ${task.dependencies.length})` 
		: '';

	if (isSubtask) {
		// Simplified subtask rendering
		return (
			<Box>
				<Text>
					<Text color={isSelected ? 'cyan' : 'default'}>{isSelected ? '>' : ' '}</Text>
					<Text color={statusColor}>{statusIcon}</Text>
					<Text>    </Text>
					<Text color="gray">{task.isLastSubtaskInGroup ? '└─ ' : '├─ '}</Text>
					<Text color="gray" dimColor>{String(task.parentId).padStart(2, ' ')}.{String(task.subtaskIndex || task.id).padStart(1, ' ')}</Text>
					<Text> </Text>
					<Text color={titleColor}>{title}</Text>
					{depsInfo && <Text color="gray" dimColor>{depsInfo}</Text>}
				</Text>
			</Box>
		);
	}

	// Parent task rendering
	return (
		<Box>
			<Text>
				<Text color={isSelected ? 'cyan' : 'default'}>{isSelected ? '>' : ' '}</Text>
				<Text color={statusColor}>{statusIcon}</Text>
				<Text> </Text>
				<Text>{String(task.id).padStart(2, ' ')}</Text>
				<Text> </Text>
				<Text color={priorityColor}>{priorityIndicator}</Text>
				<Text> </Text>
				<Text color={titleColor}>{title}</Text>
				{depsInfo && <Text color="gray" dimColor>{depsInfo}</Text>}
			</Text>
		</Box>
	);
});