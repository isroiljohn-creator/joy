import { redirect } from "next/navigation";

export default function SavedRedirect() {
  redirect("/profile?tab=saved");
}
