# TODO

- [x] **Security / Auth**: The `/api/admin/check` endpoint currently returns `{ isAdmin: true }` for all authenticated users to allow for UI testing of the Admin Dashboard. This needs to be reverted to properly check the `role` field on the `User` model before deploying to production.
- [ ] **Security / Auth**: Revert the temporary frontend authentication bypass in `useAuth.tsx` before production deployment.
