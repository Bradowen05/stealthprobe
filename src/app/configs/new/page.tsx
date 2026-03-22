import Link from "next/link";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { ConfigForm } from "../config-form";
import { createConfig } from "../actions";

async function createAction(_prevState: string | null, formData: FormData): Promise<string | null> {
  "use server";
  try {
    await createConfig(formData);
    return null;
  } catch (e) {
    if (isRedirectError(e)) throw e;
    return e instanceof Error ? e.message : "Something went wrong";
  }
}

export default function NewConfigPage() {
  return (
    <div>
      <Link
        href="/configs"
        className="text-sm text-zinc-500 hover:text-zinc-300"
      >
        &larr; Back to configurations
      </Link>
      <h2 className="text-2xl font-bold tracking-tight mt-4">
        New Configuration
      </h2>
      <p className="text-zinc-400 mt-1 mb-6">
        Define a Playwright browser configuration to test
      </p>
      <ConfigForm action={createAction} submitLabel="Create Configuration" />
    </div>
  );
}
