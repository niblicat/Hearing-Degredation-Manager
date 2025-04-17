import { writable } from "svelte/store";

export function createDarkModeStore() {
    const { subscribe, set } = writable(false);

    if (import.meta.env.SSR) {
        // If we're on the server, don't do anything
        // Document doesn't exist on the server
        return { subscribe };
    }

    const updateDarkMode = () => {
        set(document.documentElement.classList.contains('dark'));
    };

    const interval = setInterval(updateDarkMode, 500); // check every 500 ms for changes

    updateDarkMode();

    return {
        subscribe,
        stop: () => clearInterval(interval)
    };
}

export const isDark = createDarkModeStore();