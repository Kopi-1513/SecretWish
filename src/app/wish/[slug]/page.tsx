
import { Suspense } from "react";
import WishExperience from "./WishExperience";

type PageProps = {
  params: Promise<{
    slug: string;
  }>;
};

async function RecipientWishContent({ params }: PageProps) {
  const { slug } = await params;

  return <WishExperience slug={slug} />;
}

export default function RecipientWishPage({ params }: PageProps) {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#08070d] text-[#d4af72]">
          <p className="animate-pulse text-sm tracking-widest">
            OPENING YOUR SECRET WISH...
          </p>
        </main>
      }
    >
      <RecipientWishContent params={params} />
    </Suspense>
  );
}
