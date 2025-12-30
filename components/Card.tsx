import clsx from "clsx";

interface CardProps {
    children: React.ReactNode;
    className?: string;
    title?: string;
}

export default function Card({ children, className, title }: CardProps) {
    return (
        <div className={clsx("bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6", className)}>
            {title && <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{title}</h3>}
            {children}
        </div>
    );
}
