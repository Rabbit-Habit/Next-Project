function toBigint(id: string) {
    try {
        return BigInt(id);
    } catch {
        return null;
    }
}