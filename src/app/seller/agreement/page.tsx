"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useSeller } from "@/context/SellerContext";

export default function SellerAgreementPage() {
  const [agreed, setAgreed] = useState(false);
  const [signature, setSignature] = useState("");
  const [saving, setSaving] = useState(false);
  const router = useRouter();
  const { sellerUser, sellerProfile } = useSeller();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed || !signature.trim() || !sellerUser) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "sellers", sellerUser.uid), {
        agreementSigned: true,
        agreementSignature: signature.trim(),
        agreementSignedAt: new Date().toISOString(),
      });
      router.push("/seller/dashboard");
    } catch (err) {
      alert("حدث خطأ أثناء حفظ التوقيع. حاول مرة أخرى.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f4ef] px-4 py-10">
      <div className="bg-white rounded-3xl shadow-xl p-8 max-w-2xl w-full border border-[#efe7da]">
        <h1 className="text-2xl font-bold text-center mb-6 text-[#6B6A61]">عقد تقديم خدمات تسويق وتوزيع (متجر لوما)</h1>
        <div className="text-right text-gray-800 leading-8 text-sm mb-8" dir="rtl">
          <p><b>أطراف العقد:</b></p>
          <p>الطرف الأول: متجر لوما (Luma)، ويمثله الأستاذ/ سعيد الشهراني، بصفته صاحب المنصة ومفوضاً بموجب وثيقة العمل الحر رقم: (1087774012)، ويشار إليه بـ (المتجر).</p>
          <p>الطرف الثاني: {sellerProfile?.storeName || "[اسم التاجر أو المؤسسة]"}، ويمثله {sellerProfile?.name || "[اسم المسؤول]"}، ويشار إليه بـ (التاجر).</p>
          <p><b>البند الأول: مدة العقد</b><br/>يسري هذا العقد لمدة شهرين (60 يوماً) من تاريخ التوقيع، وتعتبر هذه المدة فترة تشغيلية أولية لتقييم التعاون والنتائج بين الطرفين.</p>
          <p><b>البند الثاني: آلية العمل المستقبلي (نظام الباقات)</b><br/>يقر الطرفان بأنه بعد انتهاء مدة الشهرين المحددة، سيتم الانتقال إلى نظام باقات اشتراك شهرية يتم الاتفاق على شروطها وأسعارها في ملحق عقد جديد، وذلك لضمان استمرارية خدمات التسويق المتقدمة التي يقدمها متجر لوما.</p>
          <p><b>البند الثالث: العمولات المالية</b><br/>يستحق متجر لوما عمولة تسويقية وتوزيعية قدرها 20% من إجمالي قيمة كل عملية بيع تتم من خلال المنصة. يتم تحويل مستحقات التاجر بعد خصم هذه العمولة وفق الجدول الزمني المتفق عليه [أسبوعياً/كل أسبوعين].</p>
          <p><b>البند الرابع: سياسة الاسترجاع وتحمل التكاليف</b><br/>يلتزم التاجر بالمسؤولية الكاملة عن جودة المنتج ومطابقته للوصف والصور المعروضة، وفي حال طلب العميل الاسترجاع بسبب (عيب مصنعي، نقص، أو اختلاف عن المعروض) فإن التاجر يلتزم بالآتي:<br/>- إعادة كامل المبلغ المدفوع للمتجر أو العميل.<br/>- تحمل كافة تكاليف الشحن (ذهاباً وإياباً) وأي رسوم إدارية أو بنكية ناتجة عن عملية الاسترجاع.</p>
          <p><b>البند الخامس: التزامات التاجر</b><br/>يضمن التاجر جاهزية المنتجات في مستودعاته وسرعة تجهيزها فور استلام الطلب من متجر لوما، مع الالتزام بتحديث توفر المخزون لتجنب إلغاء الطلبات.</p>
          <div className="mt-8 border-t pt-4">
            <p><b>توقيع الطرف الأول (متجر لوما):</b><br/>سعيد الشهراني رقم الوثيقة: 1087774012 التوقيع: ............................</p>
            <p className="mt-4"><b>توقيع الطرف الثاني (التاجر):</b></p>
            <div className="flex flex-col gap-2 mt-2">
              <label className="text-sm">اسم التاجر أو المؤسسة:</label>
              <input type="text" className="border rounded px-3 py-2" placeholder="اسم التاجر أو المؤسسة" disabled value={sellerProfile?.storeName || "[اسم التاجر أو المؤسسة]"} />
              <label className="text-sm">اسم المسؤول:</label>
              <input type="text" className="border rounded px-3 py-2" placeholder="اسم المسؤول" disabled value={sellerProfile?.name || "[اسم المسؤول]"} />
              <label className="text-sm">الختم/التوقيع:</label>
              <input type="text" className="border rounded px-3 py-2" placeholder="اكتب اسمك هنا كالتوقيع" value={signature} onChange={e => setSignature(e.target.value)} />
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col items-end gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            أوافق على جميع بنود الاتفاقية
          </label>
          <button
            type="submit"
            disabled={!agreed || !signature.trim() || saving}
            className={`px-6 py-2 rounded-full font-semibold transition ${!agreed || !signature.trim() ? "bg-gray-300 text-gray-500" : "bg-[#6B6A61] text-white hover:bg-[#B3B0A6]"}`}
          >
            {saving ? "جاري الحفظ..." : "إتمام التسجيل"}
          </button>
        </form>
      </div>
    </div>
  );
}
