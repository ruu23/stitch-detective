import { NavLink as RouterNavLink } from "react-router-dom";

interface BottomNavLinkProps {
  to: string;
  icon: React.ReactNode;
  label: string;
}

export const BottomNavLink = ({ to, icon, label }: BottomNavLinkProps) => {
  return (
    <RouterNavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center gap-1 px-3 py-2 transition-colors ${
          isActive
            ? "text-primary"
            : "text-muted-foreground hover:text-foreground"
        }`
      }
    >
      <div className="h-6 w-6">{icon}</div>
      <span className="text-xs font-medium">{label}</span>
    </RouterNavLink>
  );
};