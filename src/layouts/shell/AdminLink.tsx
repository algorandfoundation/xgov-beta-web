import { cn } from "@/functions/utils.ts";
import { Link } from "@/components/Link";
import { UseWallet } from "@/hooks/useWallet";
import { UseQuery } from "@/hooks/useQuery.tsx";
import { useAdmin } from "@/hooks/useAdmin.ts";

export type AdminLinkProps = {
  path: string;
};
export function AdminLink({ path }: AdminLinkProps) {
  return (
    <Link
      data-testid="header-admin-link"
      className={cn(
        path === "/admin" ? "bg-algo-black/10" : "",
        "px-2 py-1 hover:bg-white/10 dark:hover:bg-algo-black/10 rounded-md",
      )}
      to="/admin"
    >
      Admin
    </Link>
  );
}

function AdminLinkController({ path }: AdminLinkProps) {
  const showAdmin = useAdmin();
  if (!showAdmin) {
    return null;
  }
  return <AdminLink path={path} />;
}
export function AdminLinkIsland({ path }: AdminLinkProps) {
  return (
    <UseQuery>
      <UseWallet>
        <AdminLinkController path={path} />
      </UseWallet>
    </UseQuery>
  );
}
