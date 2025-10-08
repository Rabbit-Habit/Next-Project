import { DefaultSession, DefaultUser, DefaultJWT } from "next-auth";

declare module "next-auth" {
    interface User extends DefaultUser {
        userId: number;
    }

    interface Session {
        user: {
            uid: number;
        } & DefaultSession["user"];
    }
}

declare module "next-auth/jwt" {
    interface JWT extends DefaultJWT {
        uid: number;
    }
}