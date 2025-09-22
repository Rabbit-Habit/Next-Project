import {jwtVerify, SignJWT} from "jose";

const SECRET_KEY = process.env.JWT_SECRET;

const encoder = new TextEncoder;

const secret = encoder.encode(SECRET_KEY);

// JWT 생성하기
export async function createJWT(payload: any, expireIn: string = "1h") {
    return new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(expireIn)
        .sign(secret)
}

// JWT 검증하기
export async function verifyJWT(token: string) {
    try {
        const { payload } = await jwtVerify(token, secret)
        return payload as unknown as {uid: number, exp: number}
    } catch (error) {
        return null
    }
}