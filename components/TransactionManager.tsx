"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabaseClient";
import Card from "@/components/Card";
import { Plus, Search, Trash2, Edit2, Filter, X, Save, CheckCircle2, Circle } from "lucide-react";
import clsx from "clsx";

interface Transaction {
    id: string;
    descricao: string;
    valor: number;
    categoria: string;
    data: string;
    pago: boolean;
}

interface TransactionManagerProps {
    type: "receita" | "despesa";
}

export default function TransactionManager({ type }: TransactionManagerProps) {
    const supabase = createClient();
    const [items, setItems] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<Transaction | null>(null);

    // Filters
    const [filterCategory, setFilterCategory] = useState("");
    // const [filterDate, setFilterDate] = useState("");

    // Form State
    const [formData, setFormData] = useState({
        descricao: "",
        valor: "",
        categoria: "",
        data: new Date().toISOString().split('T')[0],
        pago: false,
    });

    const tableName = type === "receita" ? "receitas" : "despesas";
    const title = type === "receita" ? "Receitas" : "Despesas";
    const colorClass = type === "receita" ? "text-green-600" : "text-red-600";
    const bgClass = type === "receita" ? "bg-green-600" : "bg-red-600";

    useEffect(() => {
        fetchItems();
    }, [type]);

    const fetchItems = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        let query = supabase
            .from(tableName)
            .select("*")
            .eq("user_id", user.id)
            .order("data", { ascending: false });

        // Client side filtering for simplicity or add .eq if filter active
        const { data, error } = await query;
        if (error) {
            console.error("Error fetching:", error);
        } else {
            setItems(data || []);
        }
        setLoading(false);
    };

    const toggleStatus = async (item: Transaction) => {
        const newStatus = !item.pago;

        // Optimistic update
        setItems(items.map(i => i.id === item.id ? { ...i, pago: newStatus } : i));

        const { error } = await supabase
            .from(tableName)
            .update({ pago: newStatus })
            .eq("id", item.id);

        if (error) {
            console.error("Error updating status:", error);
            // Revert on error
            setItems(items.map(i => i.id === item.id ? { ...i, pago: item.pago } : i));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const payload = {
            descricao: formData.descricao,
            valor: parseFloat(formData.valor),
            categoria: formData.categoria,
            data: formData.data,
            pago: formData.pago,
            user_id: user.id
        };

        if (editingItem) {
            const { error } = await supabase
                .from(tableName)
                .update(payload)
                .eq("id", editingItem.id);
            if (!error) {
                setItems(items.map(i => i.id === editingItem.id ? { ...i, ...payload, id: i.id } : i));
                closeModal();
            }
        } else {
            const { data, error } = await supabase
                .from(tableName)
                .insert([payload])
                .select();
            if (!error && data) {
                setItems([data[0] as Transaction, ...items]);
                closeModal();
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir?")) return;
        const { error } = await supabase.from(tableName).delete().eq("id", id);
        if (!error) {
            setItems(items.filter(i => i.id !== id));
        }
    };

    const openModal = (item?: Transaction) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                descricao: item.descricao,
                valor: item.valor.toString(),
                categoria: item.categoria,
                data: item.data,
                pago: item.pago,
            });
        } else {
            setEditingItem(null);
            setFormData({
                descricao: "",
                valor: "",
                categoria: "",
                data: new Date().toISOString().split('T')[0],
                pago: false,
            });
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingItem(null);
    };

    const filteredItems = items.filter(item => {
        if (filterCategory && !item.categoria.toLowerCase().includes(filterCategory.toLowerCase())) return false;
        return true;
    });

    return (
        <div className="pb-20 space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <button
                    onClick={() => openModal()}
                    className={clsx("flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium shadow-sm transition-all hover:opacity-90", bgClass)}
                >
                    <Plus className="w-4 h-4" /> Nova {type === "receita" ? "Receita" : "Despesa"}
                </button>
            </div>

            {/* Filters */}
            <Card className="p-4">
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Filtrar por categoria..."
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <button className="p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                        <Filter className="w-5 h-5" />
                    </button>
                </div>
            </Card>

            {/* List */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-10 text-gray-500">Carregando...</div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-10 text-gray-500 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                        Nenhum lançamento encontrado.
                    </div>
                ) : (
                    filteredItems.map((item) => (
                        <div key={item.id} className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 transition-all hover:shadow-md">
                            <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                                {type === "despesa" && (
                                    <button
                                        onClick={() => toggleStatus(item)}
                                        className={clsx(
                                            "mt-1 sm:mt-0 p-1.5 sm:p-2 rounded-full transition-colors flex-shrink-0",
                                            item.pago
                                                ? "text-green-500 bg-green-50 dark:bg-green-900/20"
                                                : "text-gray-300 hover:text-gray-400 bg-gray-50 dark:bg-gray-700/50"
                                        )}
                                        title={item.pago ? "Pago" : "Pendente"}
                                    >
                                        {item.pago ? (
                                            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
                                        ) : (
                                            <Circle className="w-5 h-5 sm:w-6 sm:h-6" />
                                        )}
                                    </button>
                                )}
                                <div className="min-w-0 flex-1">
                                    <p className={clsx("font-semibold text-gray-900 dark:text-white truncate pr-2 text-sm sm:text-base", item.pago && "line-through text-gray-400 dark:text-gray-500")}>
                                        {item.descricao}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 mt-0.5 sm:mt-1">
                                        <span className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300 whitespace-nowrap">
                                            {item.categoria}
                                        </span>
                                        <span className="whitespace-nowrap">{new Date(item.data).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 pl-9 sm:pl-0">
                                <span className={clsx("font-bold whitespace-nowrap text-sm sm:text-base", colorClass, item.pago && "opacity-60")}>
                                    R$ {item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                                <div className="flex items-center gap-1">
                                    <button onClick={() => openModal(item)} className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => handleDelete(item.id)} className="p-1.5 sm:p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal / Form */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4 sm:p-0">
                    <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-2xl sm:rounded-xl shadow-2xl p-6 animate-in slide-in-from-bottom-10 sm:slide-in-from-bottom-0 sm:zoom-in-95 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingItem ? "Editar" : "Nova"} {type === "receita" ? "Receita" : "Despesa"}
                            </h3>
                            <button onClick={closeModal} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descrição</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.descricao}
                                    onChange={e => setFormData({ ...formData, descricao: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="Ex: Salário, Aluguel..."
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Valor (R$)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.valor}
                                        onChange={e => setFormData({ ...formData, valor: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        placeholder="0,00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">Data</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.data}
                                        onChange={e => setFormData({ ...formData, data: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Categoria</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.categoria}
                                    onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    placeholder="Ex: Alimentação, Transporte..."
                                />
                            </div>

                            {type === "despesa" && (
                                <div className="flex items-center gap-2 pt-2">
                                    <input
                                        type="checkbox"
                                        id="pago"
                                        checked={formData.pago}
                                        onChange={e => setFormData({ ...formData, pago: e.target.checked })}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                    <label htmlFor="pago" className="text-sm font-medium dark:text-gray-300">
                                        Pago
                                    </label>
                                </div>
                            )}

                            <div className="pt-4">
                                <button
                                    type="submit"
                                    className={clsx("w-full py-3 rounded-xl text-white font-bold shadow-lg shadow-blue-500/20 transition-transform active:scale-95 flex items-center justify-center gap-2", bgClass)}
                                >
                                    <Save className="w-5 h-5" /> Salvar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
