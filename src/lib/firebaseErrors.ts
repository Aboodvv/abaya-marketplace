type AuthError = {
  code?: string;
  message?: string;
};

const messages = {
  en: {
    "auth/invalid-credential": "Invalid credentials. Check email, password, and Firebase auth settings.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-email": "Invalid email address.",
    "auth/email-already-in-use": "This email is already registered.",
    "auth/weak-password": "Password is too weak.",
    "auth/operation-not-allowed": "Email/password sign-in is disabled in Firebase.",
    "auth/network-request-failed": "Network error. Please try again.",
    "auth/invalid-api-key": "Firebase API key is invalid or missing.",
  },
  ar: {
    "auth/invalid-credential": "بيانات الدخول غير صحيحة. تحققي من البريد وكلمة المرور وإعدادات Firebase.",
    "auth/user-not-found": "لا يوجد حساب بهذا البريد.",
    "auth/wrong-password": "كلمة المرور غير صحيحة.",
    "auth/invalid-email": "صيغة البريد غير صحيحة.",
    "auth/email-already-in-use": "البريد مستخدم بالفعل.",
    "auth/weak-password": "كلمة المرور ضعيفة.",
    "auth/operation-not-allowed": "تسجيل الدخول بالبريد غير مفعّل في Firebase.",
    "auth/network-request-failed": "مشكلة في الشبكة. حاولي مرة أخرى.",
    "auth/invalid-api-key": "مفتاح Firebase غير صحيح أو غير موجود.",
  },
} as const;

export const getFirebaseAuthErrorMessage = (
  error: unknown,
  lang: "ar" | "en"
) => {
  const err = error as AuthError | null;
  const code = err?.code || "";
  const fallback = err?.message || (lang === "ar" ? "حدث خطأ" : "Something went wrong");
  return messages[lang][code as keyof typeof messages.en] || fallback;
};
