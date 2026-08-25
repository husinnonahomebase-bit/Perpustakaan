# Firestore Security Specification

## Data Invariants
1. **User Isolation**: A user can only write their own user profile document `/users/{userId}` where `userId == request.auth.uid`.
2. **Bookmarks Privacy**: Personal bookmarks `/users/{userId}/bookmarks/{bookmarkId}` are readable and writable solely by the owning user (`request.auth.uid == userId`).
3. **Role & Admin Protection**: Regular users cannot elevate their own role to `admin` or modify system-managed RBAC properties.
4. **Library Catalog Integrity**: Any authenticated user can read library book catalogs `/books/{bookId}`. Writes (create, update, delete) require authenticated staff/admin or valid verified credentials.
5. **Transactions Security**: Circulation transactions `/transactions/{transactionId}` can be created by verified users/librarians.

## Dirty Dozen Payloads & Attack Scenarios
1. **Payload 1 (User ID Spoofing)**: Trying to write to `/users/other-user-uid` with `request.auth.uid = victim`. -> Result: PERMISSION_DENIED.
2. **Payload 2 (Bookmark Hijacking)**: Trying to read/write another user's bookmark at `/users/victim-uid/bookmarks/bk1`. -> Result: PERMISSION_DENIED.
3. **Payload 3 (Role Escalation)**: Regular user attempting to set `role: "admin"` on profile creation or update without authorization. -> Result: PERMISSION_DENIED.
4. **Payload 4 (Oversized ID String)**: Document ID with 2KB junk character string. -> Result: PERMISSION_DENIED by `isValidId`.
5. **Payload 5 (Unauthenticated Write)**: Write to `/books/{bookId}` without `request.auth`. -> Result: PERMISSION_DENIED.
6. **Payload 6 (Shadow Field Injection)**: Inserting arbitrary fields like `__isAdmin: true` into a profile. -> Result: PERMISSION_DENIED.
7. **Payload 7 (Immortal Field Mutation)**: Modifying immutable `createdAt` timestamp on an existing document. -> Result: PERMISSION_DENIED.
8. **Payload 8 (Malformed Transaction Code)**: Creating a transaction without required `trxCode`, `memberId`, or `bookId`. -> Result: PERMISSION_DENIED.
9. **Payload 9 (Unauthenticated Listing)**: Trying to scrape all user documents anonymously. -> Result: PERMISSION_DENIED.
10. **Payload 10 (Denial of Wallet Attack)**: Injecting 2MB payload into book description. -> Result: PERMISSION_DENIED by string size constraint.
11. **Payload 11 (Blanket Collection Query)**: Querying `/users/{userId}/bookmarks` across collections without user boundary. -> Result: PERMISSION_DENIED.
12. **Payload 12 (Negative Fine / State Corruption)**: Tampering with `fineAmount` or status illegally. -> Result: PERMISSION_DENIED.
