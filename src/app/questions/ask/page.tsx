// app/questions/ask/page.tsx
import React from "react";
import QuestionForm from "@/components/QuestionForm";

export default function AskPage() {
  return (
    <div className="container mx-auto px-4 pb-20 pt-36 max-w-3xl">
      <h1 className="mb-6 text-3xl font-bold">Ask a public question</h1>
      <QuestionForm />
    </div>
  );
}
