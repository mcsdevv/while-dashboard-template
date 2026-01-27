import { redirect } from "next/navigation";

/**
 * Base setup route - redirects to step 1.
 * The actual setup wizard is rendered at /setup/[step].
 */
export default function SetupPage() {
  redirect("/setup/1");
}
