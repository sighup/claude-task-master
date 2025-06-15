import React, { useState, useEffect } from 'react';
import { Box, Text, useInput, useStdout } from 'ink';

const HELP_SECTIONS = [
	{
		title: 'Navigation',
		shortcuts: [
			{ key: '↑/↓ or j/k', description: 'Navigate up/down through tasks', cli: '' },
			{ key: 'PgUp/PgDn or Ctrl+U/D', description: 'Page up/down in long lists', cli: '' },
			{ key: '←/→', description: 'Navigate between tasks (in detail view)', cli: '' },
			{ key: 'Tab', description: 'Toggle subtasks visibility', cli: '' },
			{ key: 'n', description: 'Jump to next suggested task', cli: 'taskmaster next' },
			{ key: 's', description: 'Show task details', cli: 'taskmaster show [id]' }
		]
	},
	{
		title: 'Task Management',
		shortcuts: [
			{ key: 'Enter or Space', description: 'Toggle task status', cli: 'taskmaster set-status [id] [status]' },
			{ key: 'a', description: 'Add new task', cli: 'taskmaster add' },
			{ key: 'e', description: 'Edit/update task', cli: 'taskmaster update-task [id]' },
			{ key: 'r', description: 'Remove task', cli: 'taskmaster remove [id]' },
			{ key: 'u', description: 'Update task status', cli: 'taskmaster set-status [id]' },
			{ key: 'g', description: 'Generate task files', cli: 'taskmaster generate' }
		]
	},
	{
		title: 'Subtask Management',
		shortcuts: [
			{ key: 'A (Shift+A)', description: 'Add subtask to selected task', cli: 'taskmaster add-subtask [id]' },
			{ key: 'E (Shift+E)', description: 'Edit/update subtask', cli: 'taskmaster update-subtask [id]' },
			{ key: 'R (Shift+R)', description: 'Remove subtask', cli: 'taskmaster remove-subtask [id]' },
			{ key: 'C (Shift+C)', description: 'Clear all subtasks', cli: 'taskmaster clear-subtasks' }
		]
	},
	{
		title: 'Task Analysis',
		shortcuts: [
			{ key: 'c', description: 'Analyze task complexity', cli: 'taskmaster analyze' },
			{ key: 'X (Shift+X)', description: 'View complexity report', cli: 'taskmaster complexity-report' },
			{ key: 'x', description: 'Expand tasks into subtasks', cli: 'taskmaster expand [id]' },
			{ key: 'U (Shift+U)', description: 'Batch update tasks', cli: 'taskmaster update [from-id]' }
		]
	},
	{
		title: 'Dependency Management',
		shortcuts: [
			{ key: 'd', description: 'Add dependency to selected task', cli: 'taskmaster add-dependency [id] [depends-on]' },
			{ key: 'D (Shift+D)', description: 'Remove dependency from selected task', cli: 'taskmaster remove-dependency [id] [depends-on]' },
			{ key: 'V (Shift+V)', description: 'Validate task dependencies', cli: 'taskmaster validate-dependencies' },
			{ key: 'F (Shift+F)', description: 'Fix dependency issues', cli: 'taskmaster fix-dependencies' }
		]
	},
	{
		title: 'Project & Config',
		shortcuts: [
			{ key: 'p', description: 'Project Commands (init, models, parse-prd)', cli: 'taskmaster init/models/parse-prd' },
			{ key: 'X (Shift+X)', description: 'Export tasks to README', cli: 'taskmaster sync-readme' },
			{ key: 'R (Shift+R)', description: 'Refresh task list', cli: '' }
		]
	},
	{
		title: 'Views & Display',
		shortcuts: [
			{ key: '1', description: 'View all tasks', cli: 'taskmaster list' },
			{ key: '2', description: 'View pending tasks', cli: 'taskmaster list --status pending' },
			{ key: '3', description: 'View in-progress tasks', cli: 'taskmaster list --status in-progress' },
			{ key: '4', description: 'View completed tasks', cli: 'taskmaster list --status done' }
		]
	}
];

export function HelpOverlay({ onClose }) {
	const [scrollOffset, setScrollOffset] = useState(0);
	const { stdout } = useStdout();

	// Calculate available height for scrollable content
	const terminalHeight = stdout?.rows || 24;
	const terminalWidth = stdout?.columns || 80;

	// Header (3) + Footer (3) + padding = 6 lines reserved
	const maxContentHeight = Math.max(10, terminalHeight - 6);

	// Calculate total content lines needed
	const totalContentLines = HELP_SECTIONS.reduce((total, section) => {
		return total + 2 + section.shortcuts.length; // Title + blank line + shortcuts
	}, 0);

	// Reset scroll when terminal resizes
	useEffect(() => {
		setScrollOffset(0);
	}, [terminalHeight, terminalWidth]);

	useInput((input, key) => {
		if (key.escape || input === 'q' || input === 'h') {
			onClose();
			return;
		}

		// Scroll navigation
		if (key.upArrow && scrollOffset > 0) {
			setScrollOffset(prev => Math.max(0, prev - 1));
		}

		if (key.downArrow && scrollOffset < totalContentLines - maxContentHeight) {
			setScrollOffset(prev => Math.min(totalContentLines - maxContentHeight, prev + 1));
		}

		// Page navigation
		if ((key.pageUp || (key.ctrl && input === 'u')) && scrollOffset > 0) {
			setScrollOffset(prev => Math.max(0, prev - Math.floor(maxContentHeight / 2)));
		}

		if ((key.pageDown || (key.ctrl && input === 'd')) && scrollOffset < totalContentLines - maxContentHeight) {
			setScrollOffset(prev => Math.min(totalContentLines - maxContentHeight, prev + Math.floor(maxContentHeight / 2)));
		}
	});

	// Build content lines for scrolling
	const contentLines = [];
	HELP_SECTIONS.forEach((section, sectionIndex) => {
		// Section title
		contentLines.push({ type: 'title', content: section.title });
		
		// Shortcuts
		section.shortcuts.forEach(shortcut => {
			contentLines.push({ type: 'shortcut', shortcut });
		});
		
		// Add blank line between sections (except after last)
		if (sectionIndex < HELP_SECTIONS.length - 1) {
			contentLines.push({ type: 'blank' });
		}
	});

	// Get visible content based on scroll offset
	const visibleContent = contentLines.slice(scrollOffset, scrollOffset + maxContentHeight);

	// Determine if we should use two-column layout
	const useColumns = terminalWidth >= 100;
	const columnWidth = useColumns ? Math.floor((terminalWidth - 6) / 2) : terminalWidth - 4;

	return (
		<Box
			flexDirection="column"
			width="100%"
			height={terminalHeight}
		>
			{/* Full screen help content */}
			<Box
				width="100%"
				height="100%"
				flexDirection="column"
				borderStyle="double"
				borderColor="cyan"
			>

				{/* Header */}
				<Box
					borderStyle="single"
					borderColor="gray"
					paddingX={1}
					width="100%"
					flexShrink={0}
					justifyContent="center"
				>
					<Text bold color="white">
						Task Master - Keyboard Shortcuts
					</Text>
					{totalContentLines > maxContentHeight && (
						<Text color="gray">
							{' '}(↑/↓ to scroll)
						</Text>
					)}
				</Box>

				{/* Content area */}
				<Box
					flexGrow={1}
					paddingX={1}
					paddingY={0}
					flexDirection="column"
					overflow="hidden"
				>
					{visibleContent.map((line, index) => {
						if (line.type === 'title') {
							return (
								<Box key={index} marginTop={index > 0 ? 1 : 0}>
									<Text bold color="cyan" underline>
										{line.content}
									</Text>
								</Box>
							);
						}

						if (line.type === 'blank') {
							return <Text key={index}> </Text>;
						}

						if (line.type === 'shortcut') {
							const { key, description, cli } = line.shortcut;
							
							if (key === 'Coming Soon') {
								return (
									<Box key={index} paddingLeft={2}>
										<Text dimColor italic color="gray">
											{description}
										</Text>
									</Box>
								);
							}

							// Calculate dynamic widths based on terminal size
							const keyWidth = Math.min(20, Math.floor(terminalWidth * 0.25));
							const descWidth = Math.min(35, Math.floor(terminalWidth * 0.45));
							
							return (
								<Box key={index} paddingLeft={2} flexDirection="row" width="100%">
									<Box width={keyWidth} flexShrink={0} marginRight={1}>
										<Text color="yellow" bold wrap="truncate">
											{key}
										</Text>
									</Box>
									<Box width={descWidth} flexShrink={0} marginRight={1}>
										<Text color="white" wrap="truncate">
											{description}
										</Text>
									</Box>
									{cli && terminalWidth > 80 && (
										<Box flexGrow={1}>
											<Text color="gray" dimColor wrap="truncate">
												{cli}
											</Text>
										</Box>
									)}
								</Box>
							);
						}

						return null;
					})}

					{/* Fill remaining space */}
					{Array.from({ length: Math.max(0, maxContentHeight - visibleContent.length) }, (_, i) => (
						<Text key={`empty-${i}`}> </Text>
					))}
				</Box>

				{/* Footer */}
				<Box
					borderStyle="single"
					borderColor="gray"
					paddingX={1}
					width="100%"
					flexShrink={0}
					justifyContent="center"
				>
					<Text color="yellow" bold>
						Press ESC to close
					</Text>
					<Text color="gray">
						{' | '}
					</Text>
					<Text color="gray">
						Q: Exit app | H: Toggle help
					</Text>
				</Box>
			</Box>
		</Box>
	);
}