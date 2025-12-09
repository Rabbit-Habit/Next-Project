"use server"

import { submitCheckAction } from "@/app/habits/[habitId]/actions";

export async function habitCheckAction(formData: FormData) {
    const hid = String(formData.get("habitId") ?? "")
    if (!hid) return

    const newForm = new FormData()
    newForm.append("habitId", hid)

    await submitCheckAction(newForm)
}