// src/components/AskQuestionButton.tsx
"use client"; // <--- This is the most important line!

import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/Auth"; // Make sure path is correct
import { ShimmerButton } from "@/components/magicui/shimmer-button"; // Adjust path if needed

const AskQuestionButton = () => {
    const { user } = useAuthStore();
    const router = useRouter();

    const handleNavigation = () => {
        if (user) {
            router.push("/questions/ask");
        } else {
            // otherwise, redirect to login
            router.push("/login");
        }
    };

    return (
        <ShimmerButton className="shadow-2xl" onClick={handleNavigation}>
            <span className="whitespace-pre-wrap text-center text-sm font-medium leading-none tracking-tight text-white dark:from-white dark:to-slate-900/10 lg:text-lg">
                Ask a question
            </span>
        </ShimmerButton>
    );
};

export default AskQuestionButton;