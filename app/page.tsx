import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function LanguageRedirect() {
  const preference = (await cookies()).get("school_language")?.value;
  redirect(preference === "en" ? "/en" : "/uz");
}
