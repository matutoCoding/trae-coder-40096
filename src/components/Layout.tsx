import { NavLink, Outlet } from "react-router-dom";
import { Home, Calendar, Clock, FileText, User } from "lucide-react";

const tabs = [
  { to: "/", icon: Home, label: "首页" },
  { to: "/booking", icon: Calendar, label: "预约" },
  { to: "/waitlist", icon: Clock, label: "候补" },
  { to: "/billing/bills", icon: FileText, label: "账单" },
  { to: "/profile", icon: User, label: "我的" },
];

export default function Layout() {
  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col bg-gray-50">
      <main className="flex-1 overflow-y-auto pb-20">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.06)] pb-[env(safe-area-inset-bottom)]">
        <div className="flex items-center justify-around h-16">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                  isActive ? "text-[#1A365D]" : "text-gray-400"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={22} strokeWidth={isActive ? 2.2 : 1.8} />
                  <span className="text-[10px] leading-tight">{label}</span>
                  {isActive && (
                    <span className="w-1 h-1 rounded-full bg-[#1A365D] mt-0.5" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
