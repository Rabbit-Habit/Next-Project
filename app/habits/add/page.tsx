// import HabitAddComponent from '@/app/components/habits/habitAddComponent'
// import { addHabitAction } from './actions'

import HabitForm from "@/app/components/habits/habitForm";

export default function AddHabitPage() {
    return (
            <div className="p-6">
                <h1 className="text-xl mb-4"> 습관 등록 페이지</h1>
                {/*<HabitAddComponent addHabitAction={addHabitAction}/>*/}
                <HabitForm />
            </div>
        )

    }