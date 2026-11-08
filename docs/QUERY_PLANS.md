# Query index coverage

Production indexes are provisioned explicitly with scripts.migrate. Unique users.email, contacts(user_id,phone), refresh/reset/share token hashes, session family and alert idempotency indexes protect integrity. TTL indexes expire refresh/reset/family/share records and rate-limit buckets; public authorization still checks expiry immediately rather than relying on asynchronous TTL deletion.

Owner lists sort by user_id + created_at desc + _id desc; matching compound indexes exist. Report status filtering has user_id + status + created_at. Search uses escaped bounded regex within the owner partition; it can require scanning matching owner records and is not represented as an Atlas Search implementation. A report text index is available for future text-query expansion.

The supplied URI supports index creation, but per-endpoint explain artifacts have not all been captured. Do not interpret this document as proof that every filter/search produces a pure IXSCAN without a sort or fetch. Capture actual explain plans and tune observed workloads before substantial production scale.
