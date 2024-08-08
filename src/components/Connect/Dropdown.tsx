import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export interface ConnectDropdownProps {
    activeAddress: string | null;
    children: React.ReactNode;
    onLogOut: () => void;
}


export function ConnectDropdown({ activeAddress, children, onLogOut }: ConnectDropdownProps) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
                <DropdownMenuGroup>
                    <DropdownMenuItem
                        onSelect={() => {
                            // TODO: navigate to profile
                        }}
                    >
                        Profile
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onLogOut()}>
                    Log out
                    <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
