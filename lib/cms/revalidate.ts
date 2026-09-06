import { revalidatePath } from "next/cache";

export function revalidateCatalogPaths() {
  revalidatePath("/", "layout");
}
