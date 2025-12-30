"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import Link from "next/link";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

interface AuthFormProps {
    type: "login" | "register";
}

export default function AuthForm({ type }: AuthFormProps) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (type === "register") {
                const { error: signUpError } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            nome: name,
                        },
                    },
                });
                if (signUpError) throw signUpError;
                // Auto login or redirect to confirmation? Supabase might require email confirmation.
                // For this demo, assuming auto-confirm or user manually confirms.
                // If "Enable email confirmations" is OFF in Supabase, they get a session.
                router.push("/dashboard");
            } else {
                const { error: signInError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (signInError) throw signInError;
                router.push("/dashboard");
            }
        } catch (err: any) {
            setError(err.message || "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
            <div className="flex flex-col items-center mb-8">
                <div className="bg-blue-600 p-3 rounded-xl mb-4">
                    <span className="text-white font-bold text-2xl">FC</span>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {type === "login" ? "Bem-vindo de volta" : "Crie sua conta"}
                </h2>
                <p className="text-gray-500 text-sm mt-2 text-center">
                    {type === "login"
                        ? "Entre para gerenciar suas finanças"
                        : "Comece a organizar seu dinheiro hoje"}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                {type === "register" && (
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Nome
                        </label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="Seu nome completo"
                        />
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="seu@email.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Senha
                    </label>
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white transition-all"
                        placeholder="••••••••"
                    />
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all flex items-center justify-center"
                >
                    {loading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : type === "login" ? (
                        "Entrar"
                    ) : (
                        "Cadastrar"
                    )}
                </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-500">
                {type === "login" ? (
                    <>
                        Não tem uma conta?{" "}
                        <Link href="/register" className="text-blue-600 hover:underline font-medium">
                            Criar conta
                        </Link>
                    </>
                ) : (
                    <>
                        Já tem uma conta?{" "}
                        <Link href="/login" className="text-blue-600 hover:underline font-medium">
                            Entrar
                        </Link>
                    </>
                )}
            </div>
        </div>
    );
}
