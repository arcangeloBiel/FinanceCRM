import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import Card from "@/components/Card";
import OverviewChart from "@/components/Charts";
import { ArrowUpCircle, ArrowDownCircle, Wallet, Plus, Minus } from "lucide-react";
import Link from "next/link";
import clsx from "clsx";

export default async function DashboardPage() {
    // Fetch data from Supabase
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { get: (name) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Should be handled by middleware but double check
        return <div>Redirecting...</div>;
    }

    // Fetch real data
    const { data: receitasData, error: receitasError } = await supabase
        .from('receitas')
        .select('*')
        .order('data', { ascending: false });

    const { data: despesasData, error: despesasError } = await supabase
        .from('despesas')
        .select('*')
        .order('data', { ascending: false });

    if (receitasError) console.error("Error fetching receitas:", receitasError);
    if (despesasError) console.error("Error fetching despesas:", despesasError);

    const receitas = receitasData || [];
    const despesas = despesasData || [];

    // Calculate Totals
    const totalReceitas = receitas.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const totalDespesas = despesas.reduce((acc, curr) => acc + Number(curr.valor), 0);
    const balanco = totalReceitas - totalDespesas;

    // Calculate Chart Data (Last 6 Months)
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const today = new Date();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        last6Months.push({
            monthIndex: d.getMonth(),
            year: d.getFullYear(),
            label: months[d.getMonth()]
        });
    }

    const chartData = last6Months.map(m => {
        const monthReceitas = receitas
            .filter(r => {
                const d = new Date(r.data);
                return d.getMonth() === m.monthIndex && d.getFullYear() === m.year;
            })
            .reduce((acc, r) => acc + Number(r.valor), 0);

        const monthDespesas = despesas
            .filter(d => {
                const date = new Date(d.data);
                return date.getMonth() === m.monthIndex && date.getFullYear() === m.year;
            })
            .reduce((acc, d) => acc + Number(d.valor), 0);

        return {
            name: m.label,
            receitas: monthReceitas,
            despesas: monthDespesas
        };
    });

    // Recent Transactions (Combine, Sort, Slice)
    const combinedTransactions = [
        ...receitas.map(r => ({ ...r, type: 'income' as const, desc: r.descricao })),
        ...despesas.map(d => ({ ...d, type: 'expense' as const, desc: d.descricao }))
    ].sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())
        .slice(0, 5)
        .map(t => ({
            id: t.id,
            desc: t.descricao,
            val: Number(t.valor),
            type: t.type,
            date: t.data
        }));

    const recentTransactions = combinedTransactions;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
                <span className="text-sm text-gray-500">{new Date().toLocaleDateString('pt-BR')}</span>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-green-500 to-emerald-600 text-white border-none relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-green-100 text-sm font-medium mb-1">Total Receitas</p>
                        <h3 className="text-3xl font-bold">R$ {totalReceitas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <ArrowUpCircle className="absolute right-4 bottom-4 w-12 h-12 text-white/20" />
                </Card>

                <Card className="bg-gradient-to-br from-red-500 to-rose-600 text-white border-none relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-red-100 text-sm font-medium mb-1">Total Despesas</p>
                        <h3 className="text-3xl font-bold">R$ {totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                    <ArrowDownCircle className="absolute right-4 bottom-4 w-12 h-12 text-white/20" />
                </Card>

                <Card className="bg-white dark:bg-gray-800 relative overflow-hidden border-l-4 border-l-blue-500">
                    <div className="relative z-10">
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mb-1">Balanço Geral</p>
                        <h3 className={clsx("text-3xl font-bold", balanco >= 0 ? "text-green-600" : "text-red-600")}>
                            R$ {balanco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                        <span className={clsx("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-2",
                            balanco >= 0 ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                        )}>
                            {balanco >= 0 ? "Empresa positiva 🟢" : "Empresa no vermelho 🔴"}
                        </span>
                    </div>
                    <Wallet className="absolute right-4 bottom-4 w-12 h-12 text-gray-200 dark:text-gray-700" />
                </Card>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/receitas" className="flex items-center justify-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-xl hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors font-semibold border border-green-200 dark:border-green-800">
                    <Plus className="w-5 h-5" /> Nova Receita
                </Link>
                <Link href="/despesas" className="flex items-center justify-center gap-2 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors font-semibold border border-red-200 dark:border-red-800">
                    <Minus className="w-5 h-5" /> Nova Despesa
                </Link>
            </div>

            {/* Chart */}
            <Card title="Fluxo de Caixa">
                <OverviewChart data={chartData} />
            </Card>

            {/* Recent Transactions */}
            <Card title="Últimos Lançamentos">
                <div className="space-y-4">
                    {recentTransactions.map((t) => ( // Fixed variable name case from 'recent transactions' to 'recentTransactions'
                        <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                            <div className="flex items-center gap-3">
                                <div className={clsx("p-2 rounded-full", t.type === 'income' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600")}>
                                    {t.type === 'income' ? <ArrowUpCircle className="w-5 h-5" /> : <ArrowDownCircle className="w-5 h-5" />}
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">{t.desc}</p>
                                    <p className="text-xs text-gray-500">{new Date(t.date).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>
                            <span className={clsx("font-semibold", t.type === 'income' ? "text-green-600" : "text-red-600")}>
                                {t.type === 'income' ? '+' : '-'} R$ {t.val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    ))}
                </div>
            </Card>
        </div>
    );
}


