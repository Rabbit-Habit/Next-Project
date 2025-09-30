import Link from "next/link";
import Header from "@/app/components/common/header";

type Item = {
    id: string;
    title: string;
    rabbitName: string;
    rabbitStatus: "alive" | "hungry" | "escaped";
    goalDetail: string | null;
    teamName: string | null;
    regDate: string | null;
};

function statusClass(s: Item["rabbitStatus"]) {
    switch (s) {
        case "alive":
            return "bg-green-50 text-green-700 border-green-200";
        case "hungry":
            return "bg-yellow-50 text-yellow-800 border-yellow-200";
        default:
            return "bg-red-50 text-red-700 border-red-200";
    }
}

export default function HabitsList({ items }: { items: Item[] }) {
    return (
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            <Header title="습관 목록" />


            {items.length === 0 ? (
                <div className="p-6 border rounded-2xl text-sm text-gray-600">
                    아직 등록된 습관이 없어요. <Link href="/habits/new" className="underline">여기</Link>에서 만들어보세요.
                </div>
            ) : (
                <ul className="space-y-3">
                    {items.map((h) => (
                        <li key={h.id}>
                            <Link
                                href={`/habits/${h.id}`}
                                className="block p-4 border rounded-2xl hover:bg-gray-50"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="font-semibold">{h.title}</div>
                                        <div className="text-sm text-gray-500 mt-1">
                                            토끼: {h.rabbitName} · 팀: {h.teamName ?? "—"}
                                        </div>
                                        {h.goalDetail && (
                                            <p className="text-sm text-gray-600 mt-2">{h.goalDetail}</p>
                                        )}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusClass(h.rabbitStatus)}`}>
{h.rabbitStatus}
</span>
                                </div>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}


            <div className="pt-2">
                <Link href="/habits/add" className="px-3 py-2 rounded-xl border hover:bg-gray-50">
                    새 습관 등록
                </Link>
            </div>
        </div>
    );
}