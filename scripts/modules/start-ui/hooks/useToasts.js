import { useState, useCallback, useRef } from 'react';

/**
 * Hook for managing toast notifications
 * @returns {Object} Toast management functions and state
 */
export function useToasts() {
	const [toasts, setToasts] = useState([]);
	const toastIdRef = useRef(0);

	// Generate unique toast ID
	const generateId = () => {
		toastIdRef.current += 1;
		return `toast-${toastIdRef.current}`;
	};

	// Add a new toast
	const addToast = useCallback((message, type = 'info', duration = 3000) => {
		const id = generateId();
		const newToast = {
			id,
			message,
			type,
			duration,
			createdAt: Date.now()
		};

		setToasts(prev => {
			// Limit to max 5 toasts
			const updated = [...prev, newToast];
			if (updated.length > 5) {
				return updated.slice(-5);
			}
			return updated;
		});

		return id;
	}, []);

	// Dismiss a toast by ID
	const dismissToast = useCallback((id) => {
		setToasts(prev => prev.filter(toast => toast.id !== id));
	}, []);

	// Clear all toasts
	const clearToasts = useCallback(() => {
		setToasts([]);
	}, []);

	return {
		toasts,
		addToast,
		dismissToast,
		clearToasts
	};
}