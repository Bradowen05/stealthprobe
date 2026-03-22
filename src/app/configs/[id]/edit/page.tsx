import Link from "next/link";
import { notFound } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { prisma } from "@/lib/prisma";
import { ConfigForm } from "../../config-form";
import { updateConfig } from "../../actions";

export default async function EditConfigPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const config = await prisma.browserConfig.findUnique({ where: { id } });
  if (!config) notFound();

  // Bind the config id into the action
  async function editAction(_prevState: string | null, formData: FormData): Promise<string | null> {
    "use server";
    try {
      await updateConfig(id, formData);
      return null;
    } catch (e) {
      if (isRedirectError(e)) throw e;
      return e instanceof Error ? e.message : "Something went wrong";
    }
  }

  return (
    <div>
      <Link
        href={`/configs/${id}`}
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        &larr; Back to {config.name}
      </Link>
      <h2 className="text-2xl font-bold tracking-tight mt-4">
        Edit Configuration
      </h2>
      <p className="text-zinc-400 mt-1 mb-6">Update {config.name}</p>
      <ConfigForm
        action={editAction}
        initialData={config}
        submitLabel="Save Changes"
      />
    </div>
  );
}
