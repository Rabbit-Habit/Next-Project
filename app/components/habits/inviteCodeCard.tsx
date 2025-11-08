"use client";
import { useState } from "react";

export default function InviteCodeCard({
                                           habitId,
                                           initialInviteCode,
                                           onRegenerate,
                                       }: {
    habitId: string;
    initialInviteCode: string | null;
    onRegenerate: (habitId: string) => Promise<string | null>;
}) {
    const [invite, setInvite] = useState<string | null>(initialInviteCode);
    const [msg, setMsg] = useState<string | null>(null);
    const [err, setErr] = useState<string | null>(null);
    const [pending, setPending] = useState(false);

    const copy = async () => {
        if (!invite) return;
        try {
            await navigator.clipboard.writeText(invite);
            setMsg("초대코드가 복사되었습니다.");
            setErr(null);
        } catch {
            setErr("복사에 실패했어요. 수동으로 복사해주세요.");
            setMsg(null);
        }
    };

    const regen = async () => {
        try {
            setPending(true);
            const code = await onRegenerate(habitId);
            setInvite(code);
            setMsg(code ? "새 초대코드를 발급했습니다." : "초대코드 발급에 실패했습니다.");
            setErr(null);
        } catch (e: any) {
            setErr(e?.message || "초대코드 발급 오류");
            setMsg(null);
        } finally {
            setPending(false);
        }
    };

    return (
        <div className="p-4 ">
            <h2 className="font-semibold mb-2">초대코드</h2>
            {invite ? (
                <div className="flex items-center gap-2 text-sm text-[#6B4B37] bg-[#FFF2E0] rounded-2xl px-3 py-2">
                    <span className="font-mono">{invite}</span>
                    <button type="button" onClick={copy} className="ml-auto px-2 py-1 border rounded-lg">
                        복사
                    </button>
                    <button
                        type="button"
                        onClick={regen}
                        disabled={pending}
                        className="px-2 py-1 border rounded-lg disabled:opacity-50"
                    >
                        {pending ? "발급중…" : "재발급"}
                    </button>
                </div>
            ) : (
                <div className="flex items-center gap-2 text-sm bg-gray-50 border rounded-xl px-3 py-2">
                    <span className="text-gray-500">초대코드가 없습니다.</span>
                    <button
                        type="button"
                        onClick={regen}
                        disabled={pending}
                        className="ml-auto px-2 py-1 border rounded-lg disabled:opacity-50"
                    >
                        {pending ? "발급중…" : "발급"}
                    </button>
                </div>
            )}

            {msg && <p className="text-green-600 text-sm mt-2">{msg}</p>}
            {err && <p className="text-red-600 text-sm mt-2">{err}</p>}
        </div>
    );
}