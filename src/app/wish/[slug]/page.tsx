
import WishExperience from "./WishExperience";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export default async function RecipientWishPage({
  params,
}: PageProps) {
  const { slug } = await params;

  return <WishExperience slug={slug} />;
}
