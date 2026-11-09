# Transactional email implementation plan

Preserve the current artwork, application features and saved recovery-code fallback. Real public delivery requires SMTP credentials and an authorized sender, which are absent from the local and hosted configuration. Do not invent or substitute credentials.

1. Add failing socket-level SMTP/API tests for signup verification, resend, recovery, one-use/expired tokens, mail failures and old-session invalidation. Use a loopback SMTP capture server in tests; never deploy it.
2. Extend the existing SMTP adapter with explicit transport configuration, multipart branded templates, Date/Message-ID headers and safe delivery diagnostics. Require encrypted transport in production. Preserve account privacy on recovery requests and make globally missing delivery explicit.
3. Send verification during signup when configured, report actual send status, update the signed-in account after verification, handle missing verification tokens, and invalidate pending reset links after password changes.
4. Run backend and frontend checks plus the existing real-stack browser suite. If credentials become available, configure encrypted hosting settings and test actual provider acceptance plus a recipient-owned inbox/link flow.
5. Deploy the tested changes and verify the public application. Report separately whether provider delivery is activated; a capture-server test is not evidence of public inbox delivery.
