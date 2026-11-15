
import Link from "next/link";
import {
  Gift,
  LayoutDashboard,
  Sparkles,
  BookOpen,
  ShieldCheck,
  CircleHelp,
  LogOut,
} from "lucide-react";

const navigation = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "How It Works",
    href: "/dashboard/how-it-works",
    icon: Sparkles,
  },
  {
    label: "User Guide",
    href: "/dashboard/user-guide",
    icon: BookOpen,
  },
  {
    label: "Security",
    href: "/dashboard/security",
    icon: ShieldCheck,
  },
  {
    label: "FAQ",
    href: "/dashboard/faq",
    icon: CircleHelp,
  },
];

export default function DashboardNav({
  active,
}: {
  active: string;
}) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.07] bg-[#08090d]/95 backdrop-blur-xl">
      <div className="section-container">
        <div className="flex h-20 items-center justify-between">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4af70]/30 bg-[#d4af70]/10">
              <Gift className="h-5 w-5 text-[#d4af70]" />
            </div>

            <span className="text-xl font-bold text-[#f5e8d0]">
              Secret<span className="gold-text">Wish</span>
            </span>
          </Link>

          <form action="/auth/signout" method="post">
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-[#aaa2b2] transition hover:border-red-400/40 hover:text-red-400"
            >
              <LogOut size={16} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </form>
        </div>

        <nav className="-mb-px flex gap-2 overflow-x-auto pb-0 scrollbar-hide">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition ${
                  isActive
                    ? "border-[#d4af70] text-[#d4af70]"
                    : "border-transparent text-[#898391] hover:border-white/20 hover:text-[#f5e8d0]"
                }`}
              >
                <Icon size={17} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
