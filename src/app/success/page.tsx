import { Suspense } from "react";
import SuccessClient from "@/components/SuccessClient";

export default function SuccessPage() {
  return (
    <Suspense
      fallback={<div className="min-h-screen bg-[#f7f4ef]" aria-busy="true" />}
    >
      <SuccessClient />
    </Suspense>
  );
}
