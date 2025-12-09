"use client";

import { useState } from "react";
import Header from "@/app/components/common/header";
import { Button } from "@/components/ui/button";
import {createNotificationAction} from "@/app/notifications/add/actions";
import SuccessModal from "@/app/components/modal/successModal";
import FailModal from "@/app/components/modal/failModal";
import {useRouter} from "next/navigation";
import CustomSelect from "@/app/components/notifications/customSelect";

const DAYS = [
    { key: "MON", label: "월" },
    { key: "TUE", label: "화" },
    { key: "WED", label: "수" },
    { key: "THU", label: "목" },
    { key: "FRI", label: "금" },
    { key: "SAT", label: "토" },
    { key: "SUN", label: "일" },
];

export default function NotificationsAddComponent({
                                                       habits,
                                                       userId,
                                                   }: {
    habits: { habitId: bigint; title: string | null; rabbitName: string }[];
    userId: number;
}) {


    const [selectedHabit, setSelectedHabit] = useState("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [time, setTime] = useState("");
    const [memo, setMemo] = useState("");

    //알람 정보
    const router = useRouter();
    const [openSuccess, setOpenSuccess] = useState(false);
    const [openFail, setOpenFail] = useState(false);
    const [errMsg, setErrMsg] = useState<string | null>(null);


    const toggleDay = (day: string) => {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    async function onSubmit(e: React.FormEvent) {
        e.preventDefault();

        const formData = new FormData();
        formData.append("userId", String(userId));
        formData.append("habitId", selectedHabit);
        formData.append("sendTime", time);
        formData.append("memo", memo);

        selectedDays.forEach((day) => {
            formData.append("daysOfWeek", day);
        });

        // 알람 등록 액션
        const result = await createNotificationAction(formData);

        if (result.ok) {
            setOpenSuccess(true);
        } else {
            setErrMsg(result.error || "알림 등록 실패");
            setOpenFail(true);
        }
    }

    const disableSubmit = !selectedHabit || selectedDays.length === 0 || !time;

    return (
        <div
            className="
                min-h-screen
                bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]
                flex flex-col
              "
        >
            <Header title="알람 등록" />

            {/* 성공 모달 */}
            <SuccessModal
                open={openSuccess}
                onClose={() => {
                    setOpenSuccess(false);
                    router.push(`/notifications`); // 저장 후 이동
                }}
                title="저장 완료!"
                description="알람이 성공적으로 등록되었어요 ⏰✨"
            />

            {/* 실패 모달 */}
            <FailModal
                open={openFail}
                onOpenChange={() => setOpenFail(false)}
                title="실패"
                description={errMsg ?? "문제가 발생했어요."}
            />

            <div className="flex-1 flex justify-center items-start px-4 py-6">
                <form
                    onSubmit={onSubmit}
                    className="
                        mt-2 w-full max-w-md
                        rounded-3xl border border-[#F0D4B2]
                        bg-gradient-to-b from-[#FFF9F1] to-[#F7E4CC]
                        shadow-md px-6 py-7 space-y-6
                      "
                >
                    {/* 타이틀 */}
                    <div className="space-y-1 text-center">
                        <h2 className="text-lg font-bold text-[#4A2F23]">
                            ⏰ 습관 알람 등록
                        </h2>
                        <p className="text-xs text-[#7A5A46]">
                            원하는 습관, 요일, 시간에
                            <br />
                            알람을 울려드릴게요.
                        </p>
                    </div>

                    {/* 습관 선택 */}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#5C3B28]">
                            어떤 습관에 알림을 줄까?
                        </label>
                        <CustomSelect
                            value={selectedHabit}
                            onChange={(v) => setSelectedHabit(v)}
                            items={habits.map((h) => ({
                                label: `${h.title || "(제목 없음)"} — 🐰 ${h.rabbitName}`,
                                value: h.habitId.toString(),
                            }))}
                        />
                    </div>

                    {/* 요일 선택 */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[#5C3B28]">
                            요일
                        </label>
                        <p className="text-[10px] text-[#9B7A63]">
                            여러 요일 동시 선택 가능
                        </p>

                        <div
                            className="
                                grid grid-cols-7 gap-1
                                bg-[#FFF7EC] rounded-2xl px-2 py-2
                                border border-[#F0D4B2]/60
                              "
                        >
                            {DAYS.map((d) => {
                                const active = selectedDays.includes(d.key);
                                return (
                                    <button
                                        key={d.key}
                                        type="button"
                                        onClick={() => toggleDay(d.key)}
                                        className={`
                                          text-xs py-1 rounded-xl border transition-all
                                          ${
                                                active
                                                    ? "bg-[#F1C9A5] border-[#E0B693] text-[#4A2F23] font-semibold shadow-sm"
                                                    : "bg-[#FFFDF8] border-[#E7C8A9] text-[#8C6A54] hover:bg-[#FBEAD4]"
                                            }
                                        `}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 시간 선택 */}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#5C3B28]">
                            시간
                        </label>
                        <p className="text-[10px] text-[#9B7A63] mt-0.5"> 원하는 시간 선택 </p>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="
                                w-full border border-[#F0D4B2]/80 rounded-2xl px-3 py-2
                                text-sm bg-[#FFFDF8] text-[#4A2F23]
                                focus:outline-none focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent
                              "
                        />
                    </div>

                    {/* 메모 */}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#5C3B28]">
                            알람 메모 (선택)
                        </label>
                        <p className="text-[10px] text-[#9B7A63] mt-0.5"> 알림에 함께 띄울 문구 </p>
                        <input
                            name="memo"
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            placeholder="예) 지금 물 한 컵 마시자! 💧"
                            className="
                                w-full border border-[#F0D4B2]/80 rounded-2xl px-3 py-2
                                text-sm bg-[#FFFDF8] text-[#4A2F23]
                                focus:outline-none focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent
                              "
                        />
                    </div>

                    {/* 제출 버튼 */}
                    <Button
                        type="submit"
                        disabled={disableSubmit}
                        className={`
                          w-full py-3 rounded-2xl text-sm font-semibold shadow-sm border border-[#E0B693]/60
                          ${
                                disableSubmit
                                    ? "bg-[#F3DEC6] text-[#B39A82] cursor-not-allowed"
                                    : "bg-[#F1C9A5] hover:bg-[#E4B88F] text-[#4A2F23]"
                            }
                        `}
                    >
                        알람 등록하기
                    </Button>
                </form>
            </div>
        </div>
    );
}
