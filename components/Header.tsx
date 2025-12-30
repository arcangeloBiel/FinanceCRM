"use client";

import { Bell, Menu } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Header() {
    const pathname = usePathname();

    // Hide on auth pages
    if (pathname === "/login" || pathname === "/register") return null;

    return (
        <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <span className="text-white font-bold text-lg">FC</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                    FinanceCRM
                </h1>
            </div>

            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors relative">
                <Bell className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-gray-900"></span>
            </button>
        </header>
    );
}
