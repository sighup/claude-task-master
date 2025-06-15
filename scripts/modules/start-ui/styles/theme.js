/**
 * Centralized theme and style system for Task Master UI
 * Provides consistent colors, symbols, and spacing across all components
 */

export const theme = {
	// Color palette
	colors: {
		// Primary colors
		primary: '#3B82F6',      // Blue
		secondary: '#8B5CF6',    // Purple
		accent: '#14B8A6',       // Teal
		
		// Status colors
		pending: '#EAB308',      // Yellow
		'in-progress': '#FFA500', // Orange
		done: '#10B981',         // Green
		blocked: '#EF4444',      // Red
		review: '#8B5CF6',       // Purple
		deferred: '#6B7280',     // Gray
		cancelled: '#991B1B',    // Dark red
		
		// Semantic colors
		success: '#10B981',
		warning: '#EAB308',
		error: '#EF4444',
		info: '#3B82F6',
		
		// UI colors
		text: {
			primary: '#FFFFFF',
			secondary: '#9CA3AF',
			muted: '#6B7280',
			highlight: '#3B82F6'
		},
		background: {
			default: '#000000',
			elevated: '#1F2937',
			selected: '#3B82F6',
			hover: '#374151'
		},
		border: {
			default: '#374151',
			focus: '#3B82F6',
			error: '#EF4444'
		}
	},
	
	// Status symbols
	symbols: {
		// Task status
		done: '✓',
		pending: '○',
		'in-progress': '►',
		blocked: '✗',
		review: '⟳',
		deferred: '⏸',
		cancelled: '⊘',
		
		// UI symbols
		bullet: '•',
		arrow: {
			right: '→',
			left: '←',
			up: '↑',
			down: '↓'
		},
		selection: '▶',
		expand: '▼',
		collapse: '▲',
		
		// Priority symbols
		priority: {
			high: '!!!',
			medium: '!!',
			low: '!'
		},
		
		// Special
		star: '★',
		check: '✓',
		cross: '✗',
		warning: '⚠',
		info: 'ℹ',
		search: '🔍',
		command: '⚡'
	},
	
	// Spacing system (based on 0.5 unit)
	spacing: {
		xs: 0.5,   // 0.5
		sm: 1,     // 1
		md: 2,     // 2
		lg: 3,     // 3
		xl: 4,     // 4
		xxl: 6     // 6
	},
	
	// Border styles
	borders: {
		styles: {
			single: 'single',
			double: 'double',
			round: 'round',
			bold: 'bold',
			classic: 'classic'
		},
		radius: {
			none: 0,
			sm: 2,
			md: 4,
			lg: 8
		}
	},
	
	// Typography
	typography: {
		// Font weights (for text components)
		weight: {
			normal: false,
			bold: true
		},
		// Text decorations
		decoration: {
			underline: true,
			strikethrough: true,
			italic: true,
			dim: true
		}
	},
	
	// Animations (timing in ms)
	animation: {
		fast: 100,
		normal: 200,
		slow: 300,
		verySlow: 500
	},
	
	// Component-specific styles
	components: {
		modal: {
			borderStyle: 'round',
			borderColor: 'primary',
			padding: 'md',
			minWidth: 60,
			maxWidth: 80
		},
		toast: {
			padding: 'sm',
			borderStyle: 'round',
			duration: 3000
		},
		list: {
			itemPadding: 'xs',
			selectedBackground: 'selected',
			hoverBackground: 'hover'
		},
		input: {
			borderStyle: 'single',
			borderColor: 'default',
			focusBorderColor: 'focus',
			padding: 'xs'
		},
		button: {
			padding: 'sm',
			borderStyle: 'round',
			primaryBackground: 'primary',
			secondaryBackground: 'secondary'
		}
	}
};

/**
 * Get status color for a given status
 * @param {string} status - Task status
 * @returns {string} Color code
 */
export function getStatusColor(status) {
	return theme.colors[status] || theme.colors.text.muted;
}

/**
 * Get status symbol for a given status
 * @param {string} status - Task status
 * @returns {string} Symbol
 */
export function getStatusSymbol(status) {
	return theme.symbols[status] || theme.symbols.pending;
}

/**
 * Get priority color
 * @param {string} priority - Task priority
 * @returns {string} Color code
 */
export function getPriorityColor(priority) {
	const priorityColors = {
		high: theme.colors.error,
		medium: theme.colors.warning,
		low: theme.colors.info
	};
	return priorityColors[priority] || theme.colors.text.muted;
}

/**
 * Get priority symbol
 * @param {string} priority - Task priority
 * @returns {string} Symbol
 */
export function getPrioritySymbol(priority) {
	return theme.symbols.priority[priority] || '';
}

/**
 * Format text with color and style
 * @param {string} text - Text to format
 * @param {Object} options - Formatting options
 * @returns {Object} Formatted text properties for Ink Text component
 */
export function formatText(text, options = {}) {
	const {
		color = 'primary',
		bold = false,
		dim = false,
		underline = false,
		italic = false
	} = options;
	
	return {
		color: theme.colors.text[color] || color,
		bold,
		dimColor: dim,
		underline,
		italic
	};
}

/**
 * Get component styles
 * @param {string} component - Component name
 * @param {string} variant - Component variant
 * @returns {Object} Component style properties
 */
export function getComponentStyles(component, variant = 'default') {
	const baseStyles = theme.components[component] || {};
	
	// Apply variant-specific overrides
	if (variant !== 'default') {
		// Add variant logic here as needed
	}
	
	return baseStyles;
}

export default theme;