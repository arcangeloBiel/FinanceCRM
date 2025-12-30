"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, TrendingUp, TrendingDown, User } from "lucide-react";
import clsx from "clsx";

export default function Navbar() {
    const pathname = usePathname();

    const navItems = [
        { name: "Home", href: "/dashboard", icon: Home },
        { name: "Receitas", href: "/receitas", icon: TrendingUp },
        { name: "Despesas", href: "/despesas", icon: TrendingDown },
        // For simplicity, mapping Perfil to settings or just a placeholder for now. 
        // If admin, maybe /usuarios. For now, let's point to a profile page or just logout area.
        // User requested "Perfil". I'll point to /dashboard for now or make a /profile page later.
        { name: "Perfil", href: "/perfil", icon: User },
    ];

    // Don't show navbar on login/register
    if (pathname === "/login" || pathname === "/register") return null;

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 pb-safe z-50">
            <div className="flex justify-around items-center h-16">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={clsx(
                                "flex flex-col items-center justify-center w-full h-full space-y-1",
                                isActive
                                    ? "text-blue-600 dark:text-blue-400"
                                    : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                            )}
                        >
                            <Icon className="w-6 h-6" />
                            <span className="text-xs">{item.name}</span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
