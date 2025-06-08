import React from 'react';
import { Box, Text } from 'ink';

const VIEWS = [
	{ key: 'all', label: 'All Tasks', shortcut: '1' },
	{ key: 'pending', label: 'Pending', shortcut: '2' },
	{ key: 'in-progress', label: 'In Progress', shortcut: '3' },
	{ key: 'done', label: 'Completed', shortcut: '4' }
];

/**
 * Navigation component showing available views and keyboard shortcuts
 * @param {Object} props - Component props
 * @param {string} props.currentView - Currently active view ('all', 'pending', 'in-progress', 'done')
 * @param {Function} [props.onViewChange] - Callback when view changes (not used directly)
 * @returns {React.Component} The navigation component
 */
export function Navigation({ currentView, onViewChange }) {
	return (
		<Box
			borderStyle="single"
			borderColor="gray"
			paddingX={1}
			marginBottom={1}
			width="100%"
		>
			<Box flexDirection="row" justifyContent="space-between" width="100%">
				<Box flexDirection="row">
					{VIEWS.map((view, index) => (
						<Box key={view.key} flexDirection="row">
							{index > 0 && <Text color="gray"> | </Text>}
							<Text color="gray">[{view.shortcut}] </Text>
							<Text
								color={currentView === view.key ? 'cyan' : 'white'}
								bold={currentView === view.key}
							>
								{view.label}
							</Text>
						</Box>
					))}
				</Box>

				<Box flexDirection="row">
					<Text color="gray">
						↑/↓:Navigate (dark grey) | Enter:Toggle Status | Q:Quit | R:Refresh
					</Text>
				</Box>
			</Box>
		</Box>
	);
}
