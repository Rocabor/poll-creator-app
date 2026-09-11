import { redirect } from "next/navigation";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ about?: string }>;
}) {
  const { about } = await searchParams;
  const user = await getSessionUser();
  redirect(about || !user ? "/landing" : "/dashboard");
}