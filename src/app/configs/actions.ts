"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { Prisma } from "@/generated/prisma/client";

function parseConfigJson(raw: string): Prisma.InputJsonValue {
  const parsed = JSON.parse(raw);
  if (parsed === null || typeof parsed !== "object") {
    throw new Error("Config JSON must be an object");
  }
  return parsed as Prisma.InputJsonValue;
}

export async function createConfig(formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const configJsonRaw = formData.get("configJson") as string;

  if (!name?.trim()) throw new Error("Name is required");
  if (!configJsonRaw?.trim()) throw new Error("Config JSON is required");

  let configJson: Prisma.InputJsonValue;
  try {
    configJson = parseConfigJson(configJsonRaw);
  } catch {
    throw new Error("Invalid JSON in config");
  }

  const config = await prisma.browserConfig.create({
    data: { name: name.trim(), description, configJson },
  });

  revalidatePath("/configs");
  redirect(`/configs/${config.id}`);
}

export async function updateConfig(id: string, formData: FormData) {
  const name = formData.get("name") as string;
  const description = (formData.get("description") as string) || null;
  const configJsonRaw = formData.get("configJson") as string;

  if (!name?.trim()) throw new Error("Name is required");
  if (!configJsonRaw?.trim()) throw new Error("Config JSON is required");

  let configJson: Prisma.InputJsonValue;
  try {
    configJson = parseConfigJson(configJsonRaw);
  } catch {
    throw new Error("Invalid JSON in config");
  }

  await prisma.browserConfig.update({
    where: { id },
    data: { name: name.trim(), description, configJson },
  });

  revalidatePath("/configs");
  revalidatePath(`/configs/${id}`);
  redirect(`/configs/${id}`);
}

export async function deleteConfig(id: string) {
  await prisma.browserConfig.delete({ where: { id } });
  revalidatePath("/configs");
  redirect("/configs");
}
