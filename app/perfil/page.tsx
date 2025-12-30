"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { LogOut, User as UserIcon, Settings, Moon, Sun } from "lucide-react";
import Card from "@/components/Card";

export default function PerfilPage() {
    const [user, setUser] = useState<any>(null);
    const supabase = createClient();
    const router = useRouter();

    useEffect(() => {
        getUser();
    }, []);

    const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    return (
        <div className="pb-20 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Perfil</h2>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4">
                <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-full">
                    <UserIcon className="w-8 h-8 text-gray-500 dark:text-gray-300" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {user?.user_metadata?.nome || "Usuário"}
                    </h3>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                </div>
            </div>

            <div className="space-y-4">
                <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <Settings className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">Configurações da Conta</span>
                    </div>
                </button>

                <button className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="flex items-center gap-3">
                        <Moon className="w-5 h-5 text-gray-500" />
                        <span className="font-medium text-gray-700 dark:text-gray-200">Modo Escuro (Sistema)</span>
                    </div>
                </button>

                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-semibold"
                >
                    <LogOut className="w-5 h-5" />
                    Sair do Sistema
                </button>
            </div>

            <div className="text-center text-xs text-gray-400 mt-8">
                FinanceCRM v1.0.0
            </div>
        </div>
    );
}
