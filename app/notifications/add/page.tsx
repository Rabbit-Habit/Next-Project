
"use client";

import { useState } from "react";
import Header from "@/app/components/common/header";
import { Button } from "@/components/ui/button";

const DAYS = ["월", "화", "수", "목", "금", "토", "일"];

export default function NotificationsAddPage() {
    const [selectedHabit, setSelectedHabit] = useState("");
    const [selectedDays, setSelectedDays] = useState<string[]>([]);
    const [time, setTime] = useState("");
    const [memo, setMemo] = useState("");

    const toggleDay = (day: string) => {
        setSelectedDays((prev) =>
            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
        );
    };

    const onSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log({
            habit: selectedHabit,
            days: selectedDays,
            time,
            memo,
        });
        alert("등록됨");
    };

    const disableSubmit =
        !selectedHabit.trim() || selectedDays.length === 0 || !time.trim();

    return (
        <div
            className="
        min-h-screen
        bg-gradient-to-b from-[#FFF5E6] via-[#FAE8CA] to-[#F5D7B0]
        flex flex-col
      "
        >
            <Header title="알림 등록" />

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
                            ⏰ 습관 알림 등록
                        </h2>
                        <p className="text-xs text-[#7A5A46]">
                            원하는 습관, 요일, 시간에
                            <br />
                            알림을 울려드릴게요.
                        </p>
                    </div>

                    {/* 습관 선택 */}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#5C3B28]">
                            어떤 습관에 알림을 줄까?
                        </label>
                        <select
                            value={selectedHabit}
                            onChange={(e) => setSelectedHabit(e.target.value)}
                            className="
                w-full border border-[#F0D4B2]/80 rounded-2xl px-3 py-2
                text-sm bg-[#FFFDF8] text-[#4A2F23]
                focus:outline-none focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent
              "
                        >
                            <option value="">습관을 선택해주세요</option>
                            {/* 여기 습관 목록 연결 */}
                            <option value="water">물 2L 마시기</option>
                            <option value="reading">아침 독서 30분</option>
                            <option value="walk">저녁 산책 20분</option>
                        </select>
                    </div>

                    {/* 요일 선택 */}
                    <div className="space-y-2">
                        <label className="block text-xs font-semibold text-[#5C3B28]">
                            요일
                        </label>
                        <p className="text-[10px] text-[#9B7A63]">
                            여러 요일을 동시에 선택할 수 있음
                        </p>
                        <div
                            className="
                grid grid-cols-7 gap-1
                bg-[#FFF7EC] rounded-2xl px-2 py-2
                border border-[#F0D4B2]/60
              "
                        >
                            {DAYS.map((day) => {
                                const active = selectedDays.includes(day);
                                return (
                                    <button
                                        key={day}
                                        type="button"
                                        onClick={() => toggleDay(day)}
                                        className={`
                      text-xs py-1 rounded-xl border
                      transition-all
                      ${
                                            active
                                                ? "bg-[#F1C9A5] border-[#E0B693] text-[#4A2F23] font-semibold shadow-sm"
                                                : "bg-[#FFFDF8] border-[#E7C8A9] text-[#8C6A54] hover:bg-[#FBEAD4]"
                                        }
                    `}
                                    >
                                        {day}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* 시간 선택 */}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#5C3B28]">
                            알림 시간
                        </label>
                        <p className="text-[10px] text-[#9B7A63] mt-0.5">
                            설정한 요일에 매주 같은 시간으로 알림이 울림
                        </p>
                        <div className="flex items-center gap-2">
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
                    </div>

                    {/* 메모 / 알림 이름 (선택) */}
                    <div className="space-y-1">
                        <label className="block text-xs font-semibold text-[#5C3B28]">
                            알림 메모 (선택)
                        </label>
                        <p className="text-[10px] text-[#9B7A63] mt-0.5">
                            알림에 함께 띄울 문구
                        </p>
                        <input
                            value={memo}
                            onChange={(e) => setMemo(e.target.value)}
                            className="
                w-full border border-[#F0D4B2]/80 rounded-2xl px-3 py-2
                text-sm bg-[#FFFDF8] text-[#4A2F23]
                focus:outline-none focus:ring-2 focus:ring-[#F1C9A5] focus:border-transparent
              "
                            placeholder="예) 지금 물 한 컵 마시자! 💧"
                        />
                    </div>

                    {/* (옵션) 나중에 사용하면 좋을 토글 자리 */}
                    <div className="flex flex-col gap-2 text-xs text-[#6D4B36]">
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="rounded border-[#E0B58C] text-[#D07B4A] focus:ring-[#F1C9A5]"
                                disabled
                            />
                            <span className="opacity-60">
                앱 푸시 알림 사용하기
              </span>
                        </label>
                        <label className="inline-flex items-center gap-2">
                            <input
                                type="checkbox"
                                className="rounded border-[#E0B58C] text-[#D07B4A] focus:ring-[#F1C9A5]"
                                disabled
                            />
                            <span className="opacity-60">
                진동 / 사운드 옵션
              </span>
                        </label>
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
                        알림 등록하기
                    </Button>

                </form>
            </div>
        </div>
    );
}
