"use client"

interface DeleteProps {
    password: string | null;
}

function DeleteComponent({ password }: DeleteProps) {
    return(
        <div>
            delete Component
        </div>
    )
}

export default DeleteComponent