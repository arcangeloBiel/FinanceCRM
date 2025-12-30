import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
            <AuthForm type="login" />
        </div>
    );
}
