
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Plus,
  Trash2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  HelpCircle,
} from "lucide-react";

type Question = {
  id: number;
  question: string;
  answer: string;
};

export default function SecretQuestionsPage() {
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([
    { id: 1, question: "", answer: "" },
    { id: 2, question: "", answer: "" },
  ]);

  const [draftLoaded, setDraftLoaded] = useState(false);

  useEffect(() => {
    const savedDraft = sessionStorage.getItem("secretwish_draft");

    if (!savedDraft) {
      router.replace("/dashboard/create");
      return;
    }

    try {
      const draft = JSON.parse(savedDraft);

      if (Array.isArray(draft.questions) && draft.questions.length > 0) {
        setQuestions(draft.questions);
      }
    } catch {
      sessionStorage.removeItem("secretwish_draft");
      router.replace("/dashboard/create");
      return;
    }

    setDraftLoaded(true);
  }, [router]);

  function addQuestion() {
    setQuestions((current) => [
      ...current,
      {
        id: Date.now(),
        question: "",
        answer: "",
      },
    ]);
  }

  function removeQuestion(id: number) {
    if (questions.length <= 1) return;

    setQuestions((current) =>
      current.filter((question) => question.id !== id)
    );
  }

  function updateQuestion(
    id: number,
    field: "question" | "answer",
    value: string
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === id
          ? { ...question, [field]: value }
          : question
      )
    );
  }

  function handleContinue(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const validQuestions = questions.every(
      (question) =>
        question.question.trim().length > 0 &&
        question.answer.trim().length > 0
    );

    if (!validQuestions) {
      alert("Please complete every question and answer.");
      return;
    }

    const savedDraft = sessionStorage.getItem("secretwish_draft");

    if (!savedDraft) {
      alert("Your birthday wish draft was not found. Please start again.");
      router.replace("/dashboard/create");
      return;
    }

    try {
      const draft = JSON.parse(savedDraft);

      sessionStorage.setItem(
        "secretwish_draft",
        JSON.stringify({
          ...draft,
          questions: questions.map(({ question, answer }) => ({
            question: question.trim(),
            answer: answer.trim(),
          })),
        })
      );

      alert("Secret questions saved to your temporary draft!");
      router.push("/dashboard/create/photos");
    } catch {
      alert("Unable to save your draft. Please try again.");
    }
  }

  if (!draftLoaded) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#08090d] text-[#d4af70]">
        Loading your secret wish...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#08090d] px-5 py-10 text-[#f5e8d0]">
      <div className="mx-auto max-w-3xl">

        <button
          type="button"
          onClick={() => router.push("/dashboard/create")}
          className="mb-10 flex items-center gap-2 text-sm text-[#a6a0ad] transition hover:text-[#d4af70]"
        >
          <ArrowLeft size={17} />
          Back to birthday details
        </button>

        {/* Page Heading */}
        <div className="mb-9">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.35em] text-[#d4af70]">
            Keep the surprise secret
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Secret <span className="text-[#d4af70]">Questions</span>
          </h1>

          <p className="mt-4 text-[#a6a0ad]">
            Create special questions that only your recipient can answer.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-9 flex items-center gap-3">
          <div className="h-1.5 flex-1 rounded-full bg-[#d4af70]" />
          <div className="h-1.5 flex-1 rounded-full bg-[#d4af70]" />
          <div className="h-1.5 flex-1 rounded-full bg-[#292630]" />
          <span className="ml-2 text-xs text-[#a6a0ad]">
            Step 2 of 3
          </span>
        </div>

        {/* Security Information */}
        <div className="mb-7 flex gap-4 rounded-2xl border border-[#d4af70]/20 bg-[#d4af70]/5 p-5">
          <LockKeyhole className="mt-1 shrink-0 text-[#d4af70]" size={23} />

          <div>
            <h3 className="font-semibold">A surprise worth unlocking</h3>
            <p className="mt-1 text-sm leading-6 text-[#a6a0ad]">
              Your recipient must answer these questions correctly
              before accessing the birthday surprise.
            </p>
          </div>
        </div>

        <form onSubmit={handleContinue}>
          <div className="space-y-6">

            {questions.map((item, index) => (
              <div
                key={item.id}
                className="rounded-3xl border border-[#302a24] bg-[#111219] p-6 sm:p-8"
              >
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#d4af70]/10 text-[#d4af70]">
                      <HelpCircle size={21} />
                    </div>

                    <div>
                      <h2 className="font-semibold">
                        Question {index + 1}
                      </h2>
                      <p className="text-xs text-[#918b99]">
                        Create a personal memory challenge
                      </p>
                    </div>
                  </div>

                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeQuestion(item.id)}
                      className="rounded-lg p-2 text-[#918b99] transition hover:bg-red-500/10 hover:text-red-400"
                      aria-label={`Remove question ${index + 1}`}
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="mb-2 block text-sm text-[#d8cdbb]">
                      Your question *
                    </label>

                    <input
                      required
                      value={item.question}
                      onChange={(e) =>
                        updateQuestion(item.id, "question", e.target.value)
                      }
                      placeholder="e.g. Where did we first meet?"
                      className="w-full rounded-xl border border-[#38343b] bg-[#090a10] px-4 py-3.5 outline-none transition focus:border-[#d4af70]"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm text-[#d8cdbb]">
                      Correct answer *
                    </label>

                    <input
                      required
                      value={item.answer}
                      onChange={(e) =>
                        updateQuestion(item.id, "answer", e.target.value)
                      }
                      placeholder="Enter the correct answer"
                      className="w-full rounded-xl border border-[#38343b] bg-[#090a10] px-4 py-3.5 outline-none transition focus:border-[#d4af70]"
                    />

                    <p className="mt-2 text-xs text-[#77717f]">
                      Remember: choose an answer your recipient will know.
                    </p>
                  </div>
                </div>
              </div>
            ))}

          </div>

          {/* Add Question */}
          <button
            type="button"
            onClick={addQuestion}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#d4af70]/40 bg-[#d4af70]/5 px-5 py-4 font-medium text-[#d4af70] transition hover:bg-[#d4af70]/10"
          >
            <Plus size={19} />
            Add Another Question
          </button>

          {/* Security Note */}
          <div className="mt-7 flex gap-3 rounded-2xl border border-[#38343b] bg-[#111219] p-5">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#d4af70]" size={21} />

            <div>
              <h3 className="text-sm font-semibold">
                Your answers stay private
              </h3>

              <p className="mt-1 text-xs leading-6 text-[#918b99]">
                Answers are temporarily stored in your browser draft
                during this development stage. Secure server-side
                hashing and verification will be implemented before
                production.
              </p>
            </div>
          </div>

          {/* Continue */}
          <button
            type="submit"
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#d4af70] to-[#a77b40] px-6 py-4 font-semibold text-[#111019] transition hover:brightness-110"
          >
            Continue to photos
            <ArrowRight size={19} />
            <Sparkles size={17} />
          </button>

          <p className="mt-4 text-center text-xs text-[#77717f]">
            You can review your questions before publishing your wish.
          </p>
        </form>
      </div>
    </main>
  );
}
