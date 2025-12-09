import {create} from "zustand/react";

interface LoginStore {
    uid: number;
    save: (uid: number) => void;
}

export const useLoginStore = create<LoginStore>((set) => ({
    uid: -1,
    save: (uid) => set({ uid }),
}))