import { redirect } from "next/navigation";

type Props = { params: Promise<{ slug: string }> };

/** 舊路徑 /a/:slug → /:slug */
export default async function LegacyAskRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(`/${slug}`);
}
