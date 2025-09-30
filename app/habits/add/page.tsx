
import HabitForm from "@/app/components/habits/habitForm";
import Header from "@/app/components/common/header";

export default function AddHabitPage() {
    return (
            <div className="p-6">
                <Header title="습관 등록" />
                <HabitForm />
            </div>
        )

    }