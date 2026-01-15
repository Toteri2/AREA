# Security Watch

**Last Updated:** January 2026
**Maintained By:** AREA Team

---

## Monitoring Sources

### Primary Sources

**OWASP** (https://owasp.org)
- OWASP Top 10 (2025 update)
- OWASP Cheat Sheets
- Monthly newsletters

**Snyk Vulnerability Database** (https://snyk.io)
- Automatic npm dependency scanning
- Real-time CVE alerts
- Remediation guidance

**GitHub Security Advisories**
- Dependabot alerts
- Repository security tab
- Automated email notifications

**npm audit**
- Daily dependency audits
- Vulnerability reports
- Update suggestions

**CVE Details** (https://cvedetails.com)
- NestJS: https://www.cvedetails.com/vulnerability-list/vendor_id-29920/opec-1/Nestjs.html
- Node.js: https://www.cvedetails.com/product/30417/Nodejs-Node.js.html
- React 19.2.0: https://www.cvedetails.com/version/2055948/Facebook-React-19.2.0.html
- PostgreSQL: https://www.cvedetails.com/product/575/Postgresql-Postgresql.html
- TypeORM: https://www.cvedetails.com/product/60956/Typeorm-Typeorm.html
- Axios: https://www.cvedetails.com/vulnerability-list/vendor_id-20146/product_id-49279/Axios-Axios.html

**NestJS Security Updates**
- Official NestJS blog
- GitHub releases
- Community Discord

**Node.js Security Releases**
- https://nodejs.org/en/blog/vulnerability/
- Security mailing list

---

## Recent Security Actions

### November 2025

**CVE-2023-45857 - Axios SSRF Vulnerability**
- Severity: Medium (CVSS 6.5)
- Impact: Axios < 1.6.0 - SSRF via proxy configuration
- Action: Updated to axios@1.13.2 (backend + frontend)
- Date: November 15, 2025
- Source: GitHub Security Advisory GHSA-wf5p-g6vw-rhxx

**Bcrypt Rounds Recommendation**
- Source: OWASP Password Storage Cheat Sheet
- Recommendation: Minimum 12 rounds (currently using 10)
- Decision: Maintained at 10 rounds (performance/security trade-off)
- Date: November 20, 2025

### December 2025

**npm Audit - Minor Dependencies**
- Result: 0 critical vulnerabilities, 0 high
- Action: Updated minor dependencies
  - @nestjs/common 11.0.0 → 11.0.1
  - @nestjs/core 11.0.0 → 11.0.1
- Date: December 5, 2025

**OWASP Top 10 2025 Review**
- Action: Complete code audit against OWASP Top 10 2025
- Result: 8.6/10 (see SECURITY_AUDIT.md)
- Date: December 10, 2025

### January 2026

**React 19.2.0 CVE Assessment**
- Source: CVE Details
- Identified: 3 CVEs in React 19.2.0
- Assessment: Low to Medium severity, non-critical for our usage
- Action: Monitoring, no immediate action required
- Date: January 15, 2026

**NestJS CVE Review**
- CVE-2025-54782: @nestjs/devtools-integration RCE (CVSS 9.4)
  - Assessment: Not affected (package not used)
- CVE-2024-29409: File upload in v10.3.2 (CVSS 5.5)
  - Assessment: Not affected (using v11.0.1)
- Date: January 15, 2026

**PostgreSQL 16 Security Patch**
- Source: PostgreSQL Security page
- Impact: No critical CVEs for our usage
- Action: Maintained PostgreSQL 16 up-to-date
- Date: January 15, 2026

---

## Observed Security Trends (2025-2026)

### Supply Chain Attacks

**Trend:** Increased attacks on npm packages

**Recent Examples:**
- Event-stream incident (2018, still relevant)
- Colors.js sabotage (2022)
- UA-parser-js malware (2021)

**Mitigations:**
- Lock files (package-lock.json)
- Regular npm audit
- Minimal dependencies
- Package review before installation

### OAuth2 Vulnerabilities

**Trend:** Attacks on poorly implemented OAuth2 flows

**Identified Risks:**
- CSRF via missing state parameter
- Open redirect on redirect_uri
- Token leakage via logs

**Mitigations:**
- State parameter implemented
- Redirect URI whitelist
- Server-side only tokens
- HTTPS required

### JWT Attacks

**Trend:** Exploitation of poor JWT validation

**Known Attacks:**
- Algorithm confusion (alg: none)
- Weak secret brute-force
- Ignored token expiry

**Mitigations:**
- Fixed algorithm (HS256)
- Strong secret (256+ bits)
- Expiration validation (passport-jwt)
- Refresh token rotation

### Container Security

**Trend:** Attacks on Docker images

**Risks:**
- Images with CVEs
- Root user in containers
- Secrets in plaintext in images

**Mitigations:**
- Official images (node:20-alpine, postgres:16)
- Multi-stage builds
- Environment variables for secrets
- Non-root user (to implement)

---

## CVE Watch List

### High Priority

| CVE            | Package                      | Severity | Status       | Notes             |
| -------------- | ---------------------------- | -------- | ------------ | ----------------- |
| CVE-2025-54782 | @nestjs/devtools-integration | 9.4      | Not affected | Package not used  |
| CVE-2024-29409 | nestjs                       | 5.5      | Not affected | Fixed in v11.0.1  |
| CVE-2023-45857 | axios                        | 6.5      | Patched      | Updated to 1.13.2 |

### Medium Priority (Monitoring)

| Package      | Issue                 | Status     | Action                 |
| ------------ | --------------------- | ---------- | ---------------------- |
| React 19.2.0 | 3 CVEs (Low-Medium)   | Monitoring | Non-critical for usage |
| bcrypt       | Rounds recommendation | OK         | 10 rounds acceptable   |
| typeorm      | Query builder edges   | OK         | Parameterized queries  |

### Currently Monitoring

**NestJS (v11.0.1)**
- Vendor: Nestjs
- Last Check: January 2026
- Status: 2 CVEs in ecosystem, none affecting v11.0.1

**Node.js (v20 LTS)**
- Vendor: Nodejs
- Last Check: January 2026
- Status: 0 critical in LTS

**React (v19.2.0)**
- Vendor: Facebook
- Last Check: January 2026
- Status: 3 CVEs (Low-Medium severity, non-critical)

**PostgreSQL (v16)**
- Vendor: Postgresql
- Last Check: January 2026
- Status: 0 affecting our usage

---

## Continuous Monitoring Plan

### Daily
- Check GitHub Dependabot alerts
- Review npm security emails

### Weekly
- npm audit on backend + frontend
- Review new CVEs (Snyk dashboard, CVE Details)
- Read OWASP blog

### Monthly
- Complete dependency audit
- Update non-breaking packages
- Review GitHub/npm security advisories

### Quarterly
- Complete security audit (OWASP Top 10 2025)
- Internal penetration testing
- Team security training

---

## Security Training Resources

### Certifications
- OWASP Top 10 (2025)
- CWE Top 25 Most Dangerous Software Weaknesses

### Recommended Training
- OWASP Secure Coding Practices
- Node.js Security Best Practices
- OAuth2 and OpenID Connect Security

### Tools
- npm audit
- Snyk CLI
- GitHub Dependabot
- Biome (secure linter)
