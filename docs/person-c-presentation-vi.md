# Bộ thuyết trình Person C - Data & Trust

File này là bản tiếng Việt cho phần **Person C - Data & Trust**.

Phần của Person C nên được chia thành **3 bài thuyết trình**, không chỉ 2 bài package:

1. **Foundation Talk:** Coding Standards
2. **Package Deep Dive:** `@sys/consent`
3. **Package Deep Dive:** `@sys/warp`

Thông điệp chính:

> Data & Trust là phần giúp hệ thống có trách nhiệm hơn: consent bảo vệ quyền cho phép của người dùng, còn warp bảo vệ tính đúng đắn của cấu hình và schema.

---

## Tổng quan

| Bài | Chủ đề | Mục tiêu chính | Demo |
|---|---|---|---|
| 1 | Coding Standards | Giải thích "good code" trong Sys nghĩa là gì | Audit package bằng file:line evidence |
| 2 | `@sys/consent` | Giải thích consent governance ALLOW/DENY | Web surface deploy bằng Vercel |
| 3 | `@sys/warp` | Giải thích config/schema cross-validation | Supabase schema + broken/fixed checks |

Person C được giao:

| Person | Focus | Week 1 | Week 2 |
|---|---|---|---|
| C | Data & Trust | `@sys/consent` | `@sys/warp` |

Tool phải dạy:

| Package | Tool |
|---|---|
| `@sys/consent` | Vercel |
| `@sys/warp` | Supabase |

---

# Bài 1 - Coding Standards

## Mục tiêu

Đây là bài nền tảng. Bài này giải thích Sys định nghĩa "good code" như thế nào.

Script mở đầu:

> Trước khi đi vào hai package của mình, mình muốn trình bày chuẩn đánh giá mà các Sys package phải tuân theo. Trong Sys, good code không chỉ là code chạy được. Nó còn phải clean, consistent, reviewable, reusable, và có thể audit bằng file:line evidence.

---

## Tại sao cần coding standards?

Sys packages được thiết kế để tái sử dụng qua nhiều application khác nhau.

Nếu không có standards, package rất dễ bị:

- Dính logic riêng của một app.
- Khó review.
- Khó deploy an toàn.
- Khó chứng minh trách nhiệm rõ ràng.

Coding standards buộc mỗi package phải trả lời:

- Package này thuộc plane nào?
- Host application inject phần nào?
- Contract có được validate không?
- Package có tránh app-specific imports không?
- Package có ship built artifact từ `dist` không?
- Package có được classify trong taxonomy không?
- Mọi claim có file:line evidence không?

---

## Five Sys Rules

Slide chính cho phần standards:

| Rule | Ý nghĩa | Tại sao quan trọng |
|---|---|---|
| 1. Plane ownership | Package phải sở hữu một responsibility plane chính | Tránh trộn nhiều trách nhiệm |
| 2. Composition root | Config nên đi qua `defineX(config)` hoặc một composition function rõ ràng | Setup rõ ràng, dễ review |
| 3. Runtime validation | Config nên được validate runtime, thường bằng Zod | Bắt lỗi config sớm |
| 4. Boundary cleanliness | Không import app-specific code | Giữ package tái sử dụng được |
| 5. Distribution + classification | Xuất qua `dist`, có taxonomy, có drift gate | Release và review đáng tin hơn |

Evidence từ standards:

| Claim | Evidence |
|---|---|
| Standards có nhắc build structure, `tsup`, `dist`, và exports | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:38` |
| Standards có nhắc `defineX(config)`, Zod validation, và secrets-free config | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:40` |
| Standards có nhắc zero app-specific imports | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:41` |
| Boundary check được enforce bằng script | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:14` |
| Taxonomy và path drift được enforce bằng script | `syngen-handbook/onboarding/05-SYS-STANDARDS.md:15` |

---

## Evidence-First Rule

Điểm mentor rất dễ hỏi:

> Every claim must have file:line evidence.

Không nên nói:

```text
Package này reusable.
```

Nên nói:

```text
Package này chỉ export từ core/service của chính nó:
sys/packages/consent/src/index.ts:5
sys/packages/consent/src/index.ts:6
```

Trong bài này, các claim kỹ thuật quan trọng đều được gắn với file và line cụ thể.

## YÊU CẦU BẮT BUỘC VÀ LƯU Ý KHI TRÌNH BÀY

- **Evidence-first (bắt buộc):** Mỗi khẳng định kỹ thuật phải kèm bằng một bằng chứng file:line. Ví dụ: phân loại trong taxonomy — [sys/taxonomy.yaml](sys/taxonomy.yaml#L388-L408).
- **Plane ownership (bắt buộc):** Luôn nêu `primary_plane` và `secondary_planes` từ `taxonomy.yaml` cho mỗi package bạn trình bày.
- **Composition & injection (bắt buộc):** Chỉ rõ API composition và phần host inject (store/sink). Cite ví dụ: `createConsentService` — [sys/packages/consent/src/service.ts](sys/packages/consent/src/service.ts#L17-L19), `defineWarp` — [sys/packages/warp/src/core.ts](sys/packages/warp/src/core.ts#L22).
- **Tests & typecheck (bắt buộc):** Hiển thị trạng thái test và typecheck với bằng chứng (test files). Ví dụ tests consent: [sys/packages/consent/src/__tests__/service.test.ts](sys/packages/consent/src/__tests__/service.test.ts).
- **Gaps / Risks (bắt buộc):** Rõ ràng liệt kê gap audit (ví dụ: thiếu Zod validation tại composition root) và đề xuất hành động.
- **Demo requirements (bắt buộc):** Ghi rõ các lệnh để chạy demo và endpoints (ví dụ: `pnpm start` → `http://localhost:4173`, JSON endpoints: `/api/vendors`, `/api/supabase`, `/health`). Xem host demo endpoints: [sys-demo-product/src/server.ts](sys-demo-product/src/server.ts#L164-L210).
- **Privacy / security (bắt buộc):** Không bao giờ hiển thị secrets trong slide — dùng fixtures hoặc redaction.
- **Slide evidence formatting (bắt buộc):** Trên mỗi slide, đặt 1 dòng evidence dưới dạng: "Claim — [file](path#Lxx)" để người review có thể kiểm tra nhanh.

## Slide-ready snippets (1–2 câu + evidence) — chèn trực tiếp vào slide

- **`@sys/consent` (slide):** Engine quyết định ALLOW/DENY cho cookie/script; host inject persistence/UI. Evidence: [sys/packages/consent/src/core.ts](sys/packages/consent/src/core.ts#L120-L136) — composition + `canUse()` contract.
- **`@sys/warp` (slide):** Check-runner cho config/schema: chạy checks (referential, banned columns, required keys) và trả report. Evidence: [sys/packages/warp/src/core.ts](sys/packages/warp/src/core.ts#L22-L36) — `defineWarp()` / `runWarp()`.
- **Demo host (slide):** `sys-demo-product` cung cấp dashboard demo consent + warp + sentinel; endpoints JSON để reproduce. Evidence: [sys-demo-product/src/server.ts](sys-demo-product/src/server.ts#L120-L210).

Giữ format evidence ngắn gọn ngay dưới claim để reviewer dễ truy vết.

---

## Checklist audit package

Dùng checklist này khi review bất kỳ `@sys/*` package nào:

| Check | Câu hỏi |
|---|---|
| Plane | Package có được classify trong `taxonomy.yaml` không? |
| Composition | Có `defineX(config)` hoặc composition API rõ ràng không? |
| Validation | Config có runtime validation, tốt nhất bằng Zod không? |
| Boundaries | Package có tránh app-specific imports không? |
| Build | `package.json` có export `dist` artifacts không? |
| Tests | Có unit, integration, negative, governance tests không? |
| Gaps | Có điểm nào chưa đạt chuẩn không? |

---

## Lộ trình slide cho Bài 1

Gợi ý 15 slide:

1. Title: Coding Standards
2. Vì sao standards tồn tại
3. "Good code" ở đây nghĩa là gì
4. Five Sys Rules
5. Rule 1: plane ownership
6. Rule 2: composition root
7. Rule 3: runtime validation
8. Rule 4: zero app-specific imports
9. Rule 5: dist + taxonomy + drift gate
10. Evidence-first review culture
11. Audit checklist
12. Consent audit preview
13. Warp audit preview
14. Tests and gaps
15. Chuyển sang Person C packages

---

# Bài 2 - `@sys/consent`

## Mục tiêu

`@sys/consent` là package Week 1 của Person C.

Domain:

```text
Cookie/script consent engine
```

Câu hỏi chính:

```text
May this technology run here?
```

Kết quả:

```text
ALLOW hoặc DENY
```

Tool phải dạy:

```text
Vercel
```

Artifact yêu cầu:

```text
Một consent banner/surface đã deploy, thể hiện ALLOW vs DENY và version-bump re-prompt.
```

---

## Script thuyết trình Consent

Mở đầu:

> Package đầu tiên mình trình bày là `@sys/consent`. Package này bảo vệ quyền lựa chọn của người dùng. Nó quyết định liệu một browser technology, ví dụ cookie hoặc script, có được phép chạy trong consent context hiện tại hay không.

Giải thích chính:

> Safe default là necessary-only. Nếu người dùng chưa chọn gì, hoặc decision cũ đã stale, chỉ strictly necessary technology được phép chạy.

Giải thích demo:

> Mình sẽ demo ba trạng thái: trước khi có consent, sau khi grant analytics, và sau khi bump policy version.

---

## Consent Plane Ownership

| Claim | Evidence |
|---|---|
| `@sys/consent` được classify là governance | `sys/taxonomy.yaml:388`, `sys/taxonomy.yaml:399` |
| Package này có secondary planes là control và data | `sys/taxonomy.yaml:400` |
| Core module được khai báo trong taxonomy | `sys/taxonomy.yaml:408` |

Cách nói:

> Consent thuộc Governance Plane vì nó đưa ra quyết định technology có được phép chạy hay không. Nó chạm tới Data Plane vì định nghĩa consent records, và Control Plane vì quyết định này ảnh hưởng tới runtime behavior.

---

## Consent Core Evidence

| Claim | Evidence |
|---|---|
| Có vocabulary cho consent category | `sys/packages/consent/src/core.ts:9`, `sys/packages/consent/src/core.ts:27` |
| Có contract cho vendor | `sys/packages/consent/src/core.ts:71` |
| Có contract cho consent decision | `sys/packages/consent/src/core.ts:101` |
| Có consent context | `sys/packages/consent/src/core.ts:109` |
| Có `requiresReprompt()` | `sys/packages/consent/src/core.ts:120` |
| Có `canUse()` | `sys/packages/consent/src/core.ts:129` |
| Stale decision fallback về necessary-only | `sys/packages/consent/src/core.ts:131` |
| Có `canLoadVendor()` | `sys/packages/consent/src/core.ts:136` |
| Vendor loading delegate về category decision | `sys/packages/consent/src/core.ts:143` |
| Có category map builder | `sys/packages/consent/src/core.ts:150` |

---

## Consent Host Injection Evidence

| Claim | Evidence |
|---|---|
| Package định nghĩa `ConsentStore` interface | `sys/packages/consent/src/core.ts:181` |
| Package định nghĩa `ConsentEventSink` interface | `sys/packages/consent/src/core.ts:209` |
| Service composition nhận `store` và optional `sink` | `sys/packages/consent/src/service.ts:17`, `sys/packages/consent/src/service.ts:18`, `sys/packages/consent/src/service.ts:19` |
| Public entry chỉ export core và service | `sys/packages/consent/src/index.ts:5`, `sys/packages/consent/src/index.ts:6` |

Cách nói:

> Consent package không sở hữu database. Nó định nghĩa contract, còn host application inject persistence thông qua `ConsentStore`.

---

## Consent Contract Audit

| Standard Check | Kết quả | Evidence |
|---|---|---|
| Plane ownership | Pass | `sys/taxonomy.yaml:399` |
| Composition API | Partial | `createConsentService()` tồn tại ở `sys/packages/consent/src/service.ts:17`, nhưng không tên là `defineConsent` |
| Zod/runtime config validation | Gap | Không tìm thấy Zod validation trong consent package |
| Zero app-specific imports | Pass | Public entry chỉ export `./core` và `./service` tại `sys/packages/consent/src/index.ts:5-6` |
| Dist output | Pass | `sys/packages/consent/package.json:8`, `sys/packages/consent/package.json:10`, `sys/packages/consent/package.json:14`, `sys/packages/consent/package.json:22` |
| Side effects disabled | Pass | `sys/packages/consent/package.json:7` |
| Tests | Pass | 10 test files, 43 tests passed |

Nên nói thật rõ:

> Consent đủ tốt về functional demo, nhưng khi audit theo standards thì có một gap: composition có tồn tại qua `createConsentService`, nhưng chưa theo naming pattern `defineX(config)` và chưa validate config bằng Zod.

---

## Consent Demo Flow

Mở dashboard:

```text
http://localhost:4173
```

Trạng thái ban đầu:

```text
Session Cookie       -> ALLOW
Product Analytics    -> DENY
Support Widget       -> DENY
```

Click:

```text
Grant analytics
```

Kết quả mong đợi:

```text
Session Cookie       -> ALLOW
Product Analytics    -> ALLOW
Support Widget       -> DENY
```

Click:

```text
Bump policy version
```

Giải thích:

```text
Consent decision cũ đã stale.
requiresReprompt() trả về true.
Non-essential vendors bị block lại cho tới khi user xác nhận policy mới.
```

---

## Consent Demo Evidence trong Host App

| Demo Claim | Evidence |
|---|---|
| Demo policy version tồn tại | `sys-demo-product/src/consent.ts:18` |
| Có policy bump | `sys-demo-product/src/consent.ts:23` |
| Có vendor registry | `sys-demo-product/src/consent.ts:32` |
| In-memory store là host persistence demo | `sys-demo-product/src/consent.ts:66` |
| `recordConsent()` ghi decision | `sys-demo-product/src/consent.ts:126` |
| `vendorDecisions()` gọi consent engine | `sys-demo-product/src/consent.ts:159` |
| Dashboard consent routes tồn tại | `sys-demo-product/src/server.ts:150`, `sys-demo-product/src/server.ts:156`, `sys-demo-product/src/server.ts:162` |

---

## Consent Tests And Gaps

Commands đã chạy:

```powershell
pnpm --filter @sys/consent test
pnpm --filter @sys/consent typecheck
```

Kết quả:

```text
Test Files: 10 passed
Tests: 43 passed
Typecheck: passed
```

Những gì đã được test:

- Decision engine behavior
- Category builder
- Service behavior
- Lifecycle integration
- Governance policy behavior
- Negative inputs
- Unsupported cases
- Replay/adversarial protocol cases

Evidence files:

```text
sys/packages/consent/src/__tests__/engine.test.ts
sys/packages/consent/src/__tests__/unit-decision.test.ts
sys/packages/consent/src/__tests__/unit-build.test.ts
sys/packages/consent/src/__tests__/service.test.ts
sys/packages/consent/src/__tests__/integration-lifecycle.test.ts
sys/packages/consent/src/__tests__/governance-policy.test.ts
sys/packages/consent/src/__tests__/negative-input.test.ts
sys/packages/consent/src/__tests__/negative-unsupported.test.ts
sys/packages/consent/src/__tests__/adversarial-replay.test.ts
sys/packages/consent/src/__tests__/adversarial-protocol.test.ts
```

Gaps nên nói:

- Chưa có Zod validation tại composition time.
- Composition function là `createConsentService`, không phải `defineConsent(config)`.
- Production persistence là trách nhiệm của host, nên demo dùng in-memory store.

---

## Consent Mentor Q&A

### Tại sao không cho analytics chạy mặc định?

Vì safe default là necessary-only. Analytics không phải strictly necessary, nên phải chờ user consent.

### Tại sao phải re-prompt khi policy thay đổi?

Vì consent cũ không còn đại diện cho lựa chọn của user dưới policy mới.

### Consent package có lưu database không?

Không. Package định nghĩa `ConsentStore` contract. Host application sở hữu persistence.

### Consent có phải UI package không?

Không. Package là governance decision engine. Dashboard chỉ là demo surface của host app.

---

## Lộ trình slide Consent

Gợi ý 12 slide:

1. Title: `@sys/consent`
2. Domain: cookie/script consent
3. Main question: may this technology run?
4. ALLOW/DENY model
5. Safe default: necessary-only
6. Policy version và re-prompt
7. Plane ownership
8. Contract audit
9. Tests and gaps
10. Vercel demo surface
11. Live demo
12. Summary

---

# Bài 3 - `@sys/warp`

## Mục tiêu

`@sys/warp` là package Week 2 của Person C.

Domain:

```text
Config cross-validation
```

Tool phải dạy:

```text
Supabase
```

Artifact yêu cầu:

```text
Một warp run trên Supabase schema, bắt được planted integrity/naming issue.
```

---

## Script thuyết trình Warp

Mở đầu:

> Package thứ hai là `@sys/warp`. Nếu consent bảo vệ permission của user, thì warp bảo vệ correctness của configuration. Warp không sửa database và không chạy migration. Nó validate schema/config và report vấn đề.

Giải thích chính:

> Warp là một check runner. Host application inject các check. Warp chạy các check đó và trả về một report.

Giải thích demo:

> Mình sẽ demo broken case trước, nơi warp bắt được `amount_usd` và `unknown-tracker`. Sau đó mình chuyển sang fixed case, nơi schema và config đã được sửa và toàn bộ check pass.

---

## Warp Plane Ownership

| Claim | Evidence |
|---|---|
| `@sys/warp` được classify là governance | `sys/taxonomy.yaml:152`, `sys/taxonomy.yaml:163` |
| Package này có data là secondary plane | `sys/taxonomy.yaml:164` |
| Taxonomy nói checks là project-specific và injected | `sys/taxonomy.yaml:169` |
| Core module được khai báo | `sys/taxonomy.yaml:171` |
| Checks module được khai báo | `sys/taxonomy.yaml:174` |
| CLI module được khai báo | `sys/taxonomy.yaml:177` |

Cách nói:

> Warp thuộc Governance Plane vì nó validate configuration có acceptable hay không. Nó chạm Data Plane vì nhiều check inspect schema hoặc data-shaped config.

---

## Warp Core Evidence

| Claim | Evidence |
|---|---|
| Có Check contract | `sys/packages/warp/src/core.ts:5` |
| Có Report type | `sys/packages/warp/src/core.ts:12` |
| Có Config type | `sys/packages/warp/src/core.ts:17` |
| Có `defineWarp()` | `sys/packages/warp/src/core.ts:22` |
| Có `runWarp()` | `sys/packages/warp/src/core.ts:27` |
| Có `isClean()` | `sys/packages/warp/src/core.ts:36` |
| Có `referentialCheck()` | `sys/packages/warp/src/checks.ts:8` |
| Có `requiredKeysCheck()` | `sys/packages/warp/src/checks.ts:30` |
| Có `hasBannedToken()` | `sys/packages/warp/src/checks.ts:56` |
| Có `findBannedColumns()` | `sys/packages/warp/src/checks.ts:67` |
| Có `bannedColumnsCheck()` | `sys/packages/warp/src/checks.ts:95` |

---

## Warp Contract Audit

| Standard Check | Kết quả | Evidence |
|---|---|---|
| Plane ownership | Pass | `sys/taxonomy.yaml:163` |
| Composition API | Partial | `defineWarp()` tồn tại ở `sys/packages/warp/src/core.ts:22` |
| Zod/runtime config validation | Gap | `defineWarp()` là identity-style helper; không tìm thấy Zod validation |
| Zero app-specific imports | Pass | `checks.ts` chỉ import type từ `./core` tại `sys/packages/warp/src/checks.ts:5`; `index.ts` chỉ export package files tại `sys/packages/warp/src/index.ts:4-5` |
| Dist output | Pass | `sys/packages/warp/package.json:8`, `sys/packages/warp/package.json:13`, `sys/packages/warp/package.json:17`, `sys/packages/warp/package.json:30` |
| CLI built artifact | Pass | `sys/packages/warp/package.json:10` |
| Side effects disabled | Pass | `sys/packages/warp/package.json:7` |
| Tests | Pass | 10 test files, 29 tests passed |

Nên nói thật:

> Warp có package shape khá tốt và có `defineWarp`, nhưng nếu audit strict theo standards thì vẫn có gap: config chưa được Zod-validated tại composition root.

---

## Warp Demo Checks

Demo product chạy 3 checks:

```text
1. Schema genericity check
2. Vendor registry integrity check
3. Required environment config check
```

### Check 1 - Schema Genericity

Broken schema:

```sql
amount_usd integer not null
```

Vấn đề:

```text
Currency bị hard-code vào tên column.
```

Fixed schema:

```sql
amount integer not null,
currency text not null
```

### Check 2 - Vendor Registry Integrity

Broken config:

```text
unknown-tracker
```

Vấn đề:

```text
Feature flag reference một vendor không nằm trong approved registry.
```

### Check 3 - Required Environment Config

Required keys:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
PRODUCT_PUBLIC_URL
```

---

## Warp Demo Evidence trong Host App

| Demo Claim | Evidence |
|---|---|
| Broken/fixed switch tồn tại | `sys-demo-product/src/supabase.ts:6`, `sys-demo-product/src/supabase.ts:20` |
| Broken SQL có `amount_usd` | `sys-demo-product/src/supabase.ts:31` |
| Fixed SQL dùng `amount` + `currency` | `sys-demo-product/src/supabase.ts:42` |
| Broken vendor config có `unknown-tracker` | `sys-demo-product/src/supabase.ts:90` |
| Fixed vendor config bỏ `unknown-tracker` | `sys-demo-product/src/supabase.ts:91` |
| Live Supabase columns được fetch | `sys-demo-product/src/supabase.ts:51` |
| `runWarp()` được gọi với các checks | `sys-demo-product/src/supabase.ts:140` |
| Dashboard hiện current case | `sys-demo-product/src/server.ts:124` |
| CLI in current case | `sys-demo-product/src/demo.ts:38` |

---

## Warp Broken Demo

Run:

```powershell
$env:WARP_DEMO_CASE='broken'
pnpm demo
```

Giải thích mong đợi:

```text
Warp chạy trên broken case.
Nó tìm thấy amount_usd trong schema.
Nó tìm thấy unknown-tracker trong vendor config.
Report không clean.
```

Output mong đợi:

```text
[FAIL] supabase-schema-genericity
[FAIL] vendor-registry-integrity
[PASS] required-env-config

Total errors: 2
clean: false
```

---

## Warp Fixed Demo

Run:

```powershell
$env:WARP_DEMO_CASE='fixed'
pnpm demo
```

Giải thích mong đợi:

```text
Schema đã dùng amount + currency.
Unknown vendor đã bị remove.
Tất cả warp checks pass.
```

Output mong đợi:

```text
[PASS] supabase-schema-genericity
[PASS] vendor-registry-integrity
[PASS] required-env-config

Total errors: 0
clean: true
```

---

## Warp Tests And Gaps

Commands đã chạy:

```powershell
pnpm --filter @sys/warp test
pnpm --filter @sys/warp typecheck
```

Kết quả:

```text
Test Files: 10 passed
Tests: 29 passed
Typecheck: passed
```

Những gì đã được test:

- Core runner aggregation
- Clean report handling
- Referential checks
- Required key checks
- Banned column checks
- Negative cases
- Malformed cases
- Integration cases
- Governance cases
- Adversarial/evasion cases

Evidence files:

```text
sys/packages/warp/src/__tests__/core.test.ts
sys/packages/warp/src/__tests__/checks.test.ts
sys/packages/warp/src/__tests__/integration.test.ts
sys/packages/warp/src/__tests__/integration-clean.test.ts
sys/packages/warp/src/__tests__/governance.test.ts
sys/packages/warp/src/__tests__/governance-clean.test.ts
sys/packages/warp/src/__tests__/negative.test.ts
sys/packages/warp/src/__tests__/negative-malformed.test.ts
sys/packages/warp/src/__tests__/adversarial.test.ts
sys/packages/warp/src/__tests__/adversarial-evasion.test.ts
```

Gaps nên nói:

- `defineWarp()` tồn tại, nhưng chưa có strict Zod validation.
- Warp chỉ report issue; nó không tự fix và không chạy migration.
- Fixed demo dùng corrected SQL fixture để có thể trình bày trạng thái after-fix pass ngay cả khi database thật chưa migrate.

---

## Warp Mentor Q&A

### Warp có sửa schema không?

Không. Warp chỉ validate và report. Human hoặc migration tool mới apply fix.

### Warp có chạy migration không?

Không. Warp không phải migration engine.

### Warp khác unit test thế nào?

Unit test kiểm tra code behavior.

Warp kiểm tra configuration, schema, và runtime structure.

### Tại sao `amount_usd` là xấu?

Vì nó hard-code currency vào schema. Schema generic hơn là `amount` cộng với `currency`.

### Tại sao `unknown-tracker` là xấu?

Vì config reference một vendor không được đăng ký. Điều này làm yếu governance đối với tracking technology.

---

## Lộ trình slide Warp

Gợi ý 12 slide:

1. Title: `@sys/warp`
2. Domain: config cross-validation
3. Warp không phải migration, không auto-fix
4. Check runner model
5. Supabase schema source
6. Check 1: schema genericity
7. Check 2: vendor registry integrity
8. Check 3: required env config
9. Contract audit
10. Tests and gaps
11. Broken/fixed live demo
12. Summary

---

# Live Demo Commands

## Start Local Dashboard

Từ folder `sys-demo-product`:

```powershell
pnpm check
pnpm start
```

Mở:

```text
http://localhost:4173
```

## Consent Demo

Dùng dashboard:

```text
1. Mở /
2. Show bảng ALLOW/DENY
3. Click "Grant analytics"
4. Show Product Analytics chuyển thành ALLOW
5. Click "Bump policy version"
6. Show trạng thái re-prompt
```

## Warp Broken CLI Demo

```powershell
$env:WARP_DEMO_CASE='broken'
pnpm demo
```

## Warp Fixed CLI Demo

```powershell
$env:WARP_DEMO_CASE='fixed'
pnpm demo
```

## Vercel Env

Broken demo:

```env
WARP_DEMO_CASE=broken
SUPABASE_DEBUG=false
```

Fixed demo:

```env
WARP_DEMO_CASE=fixed
SUPABASE_DEBUG=false
```

Chỉ bật debug logs khi cần debug Supabase schema discovery:

```env
SUPABASE_DEBUG=true
```

---

# Slide cuối - Accountable AI

Dùng slide này để kết nối với Alethic/accountable AI.

```text
Consent    = permission
Warp       = validation
Gatekeeper = approval
Sentinel   = observability
```

Kết luận:

```text
Permission + validation + approval + observability
= building blocks for accountable AI systems
```

Script kết:

> Consent đảm bảo technology chỉ chạy khi có permission đúng. Warp đảm bảo configuration và schema được validate trước khi trở thành production risk. Trong bức tranh lớn hơn của Alethic, đây là hai building blocks của accountable AI: user permission và system validation.

---

# Tóm tắt 60 giây

> Person C phụ trách Data & Trust. Mình chuẩn bị ba bài: đầu tiên là coding standards định nghĩa good Sys package; thứ hai là `@sys/consent`, package đưa ra quyết định ALLOW/DENY cho cookies và scripts; thứ ba là `@sys/warp`, package validate schema và configuration. Demo thể hiện consent safe default, policy re-prompt, warp bắt planted issues, và warp pass sau khi fix. Các claim đều có file-and-line evidence, cả hai package đều pass tests và typecheck, đồng thời mình cũng nêu rõ gap còn lại là strict Zod validation tại composition root.

