import { MoonIcon } from "@components/icons/MoonIcon";
import { SunIcon } from "@components/icons/SunIcon";
import { useStore } from "@nanostores/react";
import { $themeStore, toggleTheme } from "@stores/themeStore";

export function ThemeToggle() {
    const theme = useStore($themeStore);
    return (
        <button
        className="p-1"
            onClick={() => toggleTheme()}
        >
            { theme === 'light' 
                ? <SunIcon className="stroke-algo-black dark:stroke-white size-6"/>
                : <MoonIcon className="stroke-algo-black dark:stroke-white size-6"/>
            }
            
        </button>
    )
}