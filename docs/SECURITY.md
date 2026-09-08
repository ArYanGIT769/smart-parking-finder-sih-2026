# Security & Privacy Notes

SPF is currently a prototype and should not represent demo controls as production security.

## Production controls planned

- Authenticated operator accounts and role-based access control
- TLS for all network traffic
- Input validation for booking and vehicle-event APIs
- API rate limiting and abuse protection
- Audit trail for occupancy-changing events
- Secrets stored as environment variables, never committed to Git
- Restricted database credentials and least-privilege service roles
- Number-plate data retention limited to the minimum operational period
- Raw video storage disabled by default unless explicitly required
- Aggregated occupancy data used wherever personal vehicle identity is unnecessary

## Repository hygiene

Never commit:

- `.env` files
- API keys
- database passwords
- private certificates
- personal access tokens
- private customer/vehicle datasets
