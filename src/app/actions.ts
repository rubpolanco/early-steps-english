"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { clearSessionCookie } from "@/lib/auth";
import { LOCALE_COOKIE, isLocale } from "@/lib/i18n/types";

export async function logout() {
  await clearSessionCookie();
  redirect("/login");
}

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale");
  const store = await cookies();
  store.set(LOCALE_COOKIE, isLocale(locale) ? locale : "en", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  revalidatePath("/", "layout");

  // Send the user back to whichever page they were on. `redirect()` works
  // by throwing, so it must be called outside any try/catch — parse the
  // URL first, then redirect unconditionally after.
  const referer = (await headers()).get("referer");
  let target = "/";
  if (referer) {
    try {
      const url = new URL(referer);
      target = url.pathname + url.search;
    } catch {
      // not a valid absolute URL — fall back to "/"
    }
  }
  redirect(target);
}
