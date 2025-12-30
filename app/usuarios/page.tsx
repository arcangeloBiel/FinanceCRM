"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { User } from "@/types";
import { Trash2, UserPlus, Shield } from "lucide-react";

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        // Only works if RLS allows or if we are admin
        const { data, error } = await supabase.from('users').select('*');
        if (data) {
            setUsers(data as unknown as User[]);
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        // This requires Server Action with Service Role to truly delete from auth.
        // For now, we'll just try to delete from public.users
        if (!confirm("Atenção: Excluir um usuário é uma ação irreversível. Continuar?")) return;
        const { error } = await supabase.from('users').delete().eq('id', id);
        if (!error) {
            setUsers(users.filter(u => u.id !== id));
        } else {
            alert("Erro ao excluir. Verifique suas permissões (apenas Admins).");
        }
    };

    return (
        <div className="pb-20 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Usuários</h2>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium shadow-sm hover:bg-blue-700">
                    <UserPlus className="w-4 h-4" /> Novo Usuário
                </button>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Carregando usuários...</div>
                ) : users.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">Nenhum usuário encontrado.</div>
                ) : (
                    <table className="w-full text-left bg-transparent">
                        <thead className="bg-gray-50 dark:bg-gray-700/50">
                            <tr>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nome</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Função</th>
                                <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{user.nome || "Sem nome"}</td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{user.email}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                                            }`}>
                                            {user.role === 'admin' && <Shield className="w-3 h-3" />}
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(user.id)}
                                            className="text-red-400 hover:text-red-600 transition-colors"
                                            title="Excluir Usuário"
                                        >
                                            <Trash2 className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
