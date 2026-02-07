import type { UserProfile } from "@/context/AuthContext";

const parseAdminEmails = () =>
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

export const isAdminUser = (userProfile: UserProfile | null) => {
  if (!userProfile?.email) return false;
  const adminEmails = parseAdminEmails();
  if (adminEmails.length === 0) return false;
  return adminEmails.includes(userProfile.email.toLowerCase());
};
