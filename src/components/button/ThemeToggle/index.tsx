import { MoonIcon } from "@/components/icons/MoonIcon";
import { SunIcon } from "@/components/icons/SunIcon";
import { useStore } from "@nanostores/react";
import { $themeStore, toggleTheme } from "@/stores/themeStore";

export function ThemeToggle() {
    const theme = useStore($themeStore);
    return (
        <button
        className="p-1"
            onClick={() => toggleTheme()}
        >
            <SunIcon className="dark:hidden stroke-algo-black size-6"/>
            <MoonIcon className="hidden dark:block stroke-white size-6"/>
        </button>
    )
}