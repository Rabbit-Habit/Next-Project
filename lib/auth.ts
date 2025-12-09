import {AuthOptions} from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import KakaoProvider from "next-auth/providers/kakao";
import { adjectives, colors, animals, uniqueNamesGenerator, Config } from 'unique-names-generator';
import prisma from "@/lib/prisma";
import bcrypt from "bcrypt";

const customConfig: Config = {
    dictionaries: [adjectives, colors, animals],
    separator: '_',
    length: 3,
}

export const authOptions: AuthOptions = {
    providers: [
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                id: { label: "아이디", type: "text" },
                password: { label: "비밀번호", type: "password" },
            },
            async authorize(credentials) {
                const { id, password } = credentials ?? {}

                if (!id || !password) {
                    throw new Error("아이디와 비밀번호를 입력해주세요.");
                }

                const user = await prisma.user.findUnique({
                    where: { id },
                })

                if (!user || !user.id) {
                    throw new Error("아이디가 존재하지 않습니다.")
                }

                const isMatch = await bcrypt.compare(password, user.password!)

                if (!isMatch) {
                    throw new Error("비밀번호가 올바르지 않습니다.")
                }

                return {
                    userId: user.userId,
                    id: user.id,
                    password: user.password,
                    isSocial: user.isSocial,
                    imageUrl: user.imageUrl,
                    nickname: user.nickname,
                    isDeleted: user.isDeleted,
                    regDate: user.regDate,
                    modDate: user.modDate,
                }
            },
        }),
        KakaoProvider({
            clientId: process.env.KAKAO_CLIENT_ID!,
            clientSecret: process.env.KAKAO_CLIENT_SECRET!,
        }),
    ],
    pages: {
        signIn: "/auth/login",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async signIn({ user, account }) {
            if (account?.provider === 'kakao') {
                const email = user.email

                if (!email) { return false }

                const existingUser = await prisma.user.findUnique({
                    where: { id: email },
                })

                if (!existingUser) {
                    const now = new Date()
                    const randomNickname = uniqueNamesGenerator(customConfig)

                    await prisma.user.create({
                        data: {
                            id: email,
                            password: null,
                            nickname: randomNickname,
                            isSocial: true,
                            isDeleted: false,
                            regDate: now,
                            modDate: now,
                        },
                    });
                }
                return true
            }
            return true
        },
        async jwt({ token, user }) {
            if (user && user.userId) {
                token.uid = user.userId
            }

            if (user && !user.userId) {
                const dbUser = await prisma.user.findUnique({
                    where: { id: user.email! },
                })

                if (dbUser) {
                    token.uid = dbUser.userId
                }
            }
            return token
        },

        async session({ session, token }) {
            session.user.uid = token.uid
            return session
        }
    },
}