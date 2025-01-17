import { MoonIcon } from "@/components/icons/MoonIcon";
import { SunIcon } from "@/components/icons/SunIcon";
import { toggleTheme } from "@/stores/themeStore";

export function ThemeToggle() {
    return (
        <button
        className="p-1"
            onClick={() => toggleTheme()}
        >
            <SunIcon className="dark:hidden stroke-white dark:stroke-algo-black size-6"/>
            <MoonIcon className="hidden dark:block stroke-white dark:stroke-algo-black size-6"/>
        </button>
    )
}