# Performance evidence and limits

Production smoke checks are performed against the public Vercel hostname, including real Atlas readiness. Original cold-instance reads measured roughly 10–16 seconds despite subsecond handler logs; review identified 25 sequential startup index commands as a substantial contributor. The release moves index DDL to explicit migrations and selects the Mumbai function region. Standard request latency and cold-start latency must be measured separately.

Frontend build: about 115 KB gzip JavaScript and 22 KB gzip CSS before final release. Fourteen WebP illustrations, each approximately 200–330 KB, replace multi-megabyte PNGs. Below-fold section backgrounds use lazy loading. Parallax updates DOM CSS variables through requestAnimationFrame and passive listeners rather than React state. Offscreen sections are skipped. Reduced-motion disables animation and displacement.

No claim is made that the requested p95 <300ms under load or Lighthouse thresholds are met without a reproducible measurement. Cold starts and provider requests have separate budgets. See final test report for the checks actually executed.

Final public smoke sample after the cold-start fix and Mumbai deployment: /health 157ms, /ready 57ms, /version 94ms; these are individual warm end-to-end HTTP samples, not a p95 load result. Full production Playwright suite: two tests passed in 32.9s.
