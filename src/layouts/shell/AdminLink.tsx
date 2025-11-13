import { cn } from "@/functions/utils.ts";
import { Link } from "@/components/Link";
import { UseWallet } from "@/hooks/useWallet";
import { UseQuery } from "@/hooks/useQuery.tsx";
import { useAdmin } from "@/hooks/useAdmin.ts";

export type AdminLinkProps = {
  className?: string;
  path: string;
};
export function AdminLink({ path, className = '' }: AdminLinkProps) {
  return (
    <Link
      data-testid="header-admin-link"
      className={cn(
        className ? '' : path === "/admin" ? "bg-algo-black/10" : "",
        className ? className : "px-2 py-1 hover:bg-white/10 dark:hover:bg-algo-black/10 rounded-md"
      )}
      to="/admin"
    >
      Admin
    </Link>
  );
}

export function AdminLinkController({ path, className = '' }: AdminLinkProps) {
  const showAdmin = useAdmin();
  if (!showAdmin) {
    return null;
  }
  return <AdminLink path={path} className={className} />;
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
