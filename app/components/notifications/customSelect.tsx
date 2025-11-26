"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function CustomSelect({
                                         items,
                                         value,
                                         onChange,
                                         placeholder = "습관을 선택해주세요",
                                     }: {
    items: { label: string; value: string }[];
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);

    const handleSelect = (v: string) => {
        onChange(v);
        setOpen(false);
    };

    return (
        <div className="relative w-full">
            {/* 선택된 값 */}
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="
                  w-full flex items-center justify-between
                  border border-[#F0D4B2] px-4 py-3 rounded-2xl
                  bg-[#FFFDF8] text-[#4A2F23] text-sm
                  focus:outline-none focus:ring-2 focus:ring-[#F1C9A5]
                "
            >
                {value
                    ? items.find((i) => i.value === value)?.label
                    : <span className="text-[#8C6A54]">{placeholder}</span>}
                <ChevronDown className="h-4 w-4 text-[#8C6A54]" />
            </button>

            {/* 드롭다운 메뉴 */}
            {open && (
                <div
                    className="
                        absolute z-50 mt-2 w-full
                        bg-[#FFF9F1] border border-[#E7C8A9] rounded-2xl shadow-md
                        max-h-52 overflow-y-auto
                      "
                >
                    {items.map((item) => (
                        <button
                            key={item.value}
                            type="button"
                            onClick={() => handleSelect(item.value)}
                            className={`
                                w-full text-left px-4 py-3 text-sm
                                border-b border-[#F3E3D4]
                                ${item.value === value
                                    ? "bg-[#F1C9A5] text-[#4A2F23] font-semibold"
                                    : "text-[#6F4E37] hover:bg-[#F5E2CA]"
                                }
                            `}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
