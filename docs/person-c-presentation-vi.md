# Person C — Data & Trust

*Đọc chữ thường thành lời. Những dòng in nghiêng trong *[ngoặc]* là thao tác — mở file, chạy lệnh,
hoặc click. Các tham chiếu như `core.ts:123` để người xem có thể mở đúng dòng đó. Mọi số
dòng đã được xác minh trên repo thực tế vào ngày 2026-06-11.*

Mảng của mình là Data & Trust. Mình phụ trách hai `@sys` package: `@sys/consent`, bảo vệ
quyền cho phép của người dùng, và `@sys/warp`, bảo vệ tính đúng đắn của cấu hình. Trước đó
mình sẽ trình bày phần nền tảng về coding standards, vì cả hai package đều được đo lường theo
tiêu chuẩn đó. Sợi chỉ xuyên suốt cả ba bài là trách nhiệm — consent quyết định một technology
có được phép chạy không, còn warp quyết định configuration có đủ chất lượng để ship không.

---

# Bài 1 — Coding Standards

*[Tool cho bài này: Cursor — điều hướng và audit monorepo.]*

Trước khi đi vào hai package của mình, mình muốn giải thích tiêu chuẩn mà chúng phải tuân theo.
Trong Sys, good code không chỉ là code chạy được. Nó còn phải clean, consistent, reviewable,
reusable, và có thể audit — với mỗi khẳng định đều được gắn với một file và một dòng cụ thể.

Tại sao điều đó quan trọng? Các `@sys` package được thiết kế để tái sử dụng trên nhiều application
khác nhau. Nếu không có tiêu chuẩn, package dần dần trượt khỏi mục tiêu ban đầu: nó hấp thụ
giả định từng app cụ thể, ngày càng khó review, và trở nên rủi ro khi deploy. Tiêu chuẩn ngăn
chặn sự trượt đó bằng cách buộc mỗi package phải trả lời cùng một bộ câu hỏi — nó sở hữu trách
nhiệm gì, host inject phần nào, config có được validate không, nó có tránh app-specific imports
không, nó có ship built artifact không, và nó có được classify và drift-gated không.

Tất cả gói lại thành năm quy tắc.

*[Hiển thị: slide năm quy tắc.]*

Một — plane ownership: mỗi package sở hữu một responsibility plane duy nhất, nên trách nhiệm
không bao giờ bị lẫn lộn. Hai — composition root: cấu hình đi qua một hàm rõ ràng,
`defineX(config)`, nên setup minh bạch, không bị rải rác. Ba — runtime validation: config đó
được validate, thường bằng Zod, nên đầu vào sai cấu trúc sẽ fail sớm thay vì rò rỉ xuống dưới.
Bốn — boundary cleanliness: không import app-specific code, nên package giữ được khả năng tái
sử dụng. Và năm — distribution và classification: nó ship built artifact từ `dist`, xuất hiện
trong taxonomy, và pass drift checks — đây là thứ làm cho quá trình release và review đáng tin.

*[Evidence trên màn hình: `syngen-handbook/onboarding/05-SYS-STANDARDS.md` — build/dist/exports
tại :38, defineX + Zod + secrets-free tại :40, zero app-specific imports tại :41, và các
enforcement script tại :14 và :15.]*

Cách nhanh nhất để thấy tại sao mỗi quy tắc quan trọng là nhìn code vi phạm nó, rồi nhìn code đúng.

*[Hiển thị: ví dụ code.]*

**Quy tắc 2 — composition root.** Không có single entry point, setup bị rải rác và reviewer
không thể audit nhanh:

```typescript
// bad: setup rải rác — không có một điểm nào để audit toàn bộ
const svc = new ConsentEngine()
svc.setStore(store)
svc.setPolicyVersion('v1')
svc.setSink(sink)
```

Với composition root, mọi thứ rõ ràng trong một lời gọi:

```typescript
// good: một entry point duy nhất, dễ review
const svc = createConsentService({ store, sink })  // consent.ts:123
```

**Quy tắc 3 — runtime validation.** Không có Zod, config sai rò rỉ im lặng:

```typescript
// bad: PORT có thể là "abc", SUPABASE_URL có thể là rác — không có lỗi sớm
const port = Number(process.env.PORT ?? 4173)
const url = process.env.SUPABASE_URL
```

Với Zod tại composition root — chính xác là điều demo làm tại `src/env.ts:3`:

```typescript
// good: config sai sẽ throw ngay với message rõ ràng
const { PORT: port } = parseEnv()
// PORT là number đã validate; SUPABASE_URL là URL hợp lệ hoặc undefined
```

**Quy tắc 4 — boundary cleanliness.** Package import app-specific code không bao giờ tái
sử dụng được:

```typescript
// bad: package cắm vào internals của host — không thể dùng lại ở app khác
import { supabaseClient } from '../../app/db'
import { analyticsTracker } from '../../app/mixpanel'
```

Package clean định nghĩa contract và để host inject:

```typescript
// good: package export interface; host cung cấp implementation
export interface ConsentStore { save(r: ConsentRecord): Promise<void> }
// host: createConsentService({ store: new SupabaseConsentStore(db) })
```

Pattern giống nhau cho cả năm quy tắc: code xấu giấu phức tạp trong scattered state hoặc
untrusted input; code tốt làm mọi thứ rõ ràng và reviewable tại một điểm.

Thói quen bắt buộc đằng sau tất cả điều này là evidence-first. "Package này reusable" không
phải là một khẳng định — đó là một kỳ vọng. "Public entry của package chỉ export core và service
của chính nó, tại `index.ts:5-6`" mới là khẳng định, vì bạn có thể mở ra và kiểm tra. Mọi thứ
mình trình bày hôm nay đều gắn với một file và một dòng, và mình đã xác minh từng cái trước
bài nói này.

Vậy hai package của mình đứng ở đâu so với tiêu chuẩn: cả hai đều pass về plane ownership,
clean boundaries, distribution, và tests. Cả hai package cùng có một gap thật sự — cả hai đều
chưa validate config bằng Zod tại composition root; code đó nằm trong monorepo, ngoài lane của
mình kỳ này. Nhưng demo host tự lấp gap đó: vendor registry được Zod-validate tại module init,
toàn bộ env config được parse qua Zod schema trước khi server khởi động, và mình sẽ chỉ ra cả
hai trong mỗi bài. Nêu gap của package là việc của mình; demo cho thấy fix trông như thế nào.

Đó là thước đo. Giờ đến hai package.

---

# Bài 2 — @sys/consent

*[Tool cho bài này: Vercel — deploy consent surface và đọc runtime logs.]*

Package đầu tiên là `@sys/consent`. Nó bảo vệ lựa chọn của người dùng. Nó trả lời một câu hỏi:
liệu technology này — một cookie, một script, một vendor — có được phép chạy trong consent
context hiện tại không? Câu trả lời là ALLOW hoặc DENY, không có gì thêm.

Quy tắc làm nó an toàn là safe default. Nếu người dùng chưa quyết định, hoặc nếu quyết định của
họ đã stale, chỉ strictly necessary technology được chạy; mọi thứ khác chờ đến khi có consent
rõ ràng.

*[Evidence trên màn hình: decision engine thuần túy trong `sys/packages/consent/src/core.ts` —
vocabulary category tại :9 và :27, contract vendor tại :74, contract decision tại :104,
context tại :112, `requiresReprompt` tại :123, `canUse` tại :132, stale-decision fallback về
necessary-only tại :134, `canLoadVendor` tại :139, delegation của nó về category decision tại
:146, và category-map builder tại :153.]*

Nó nằm ở đâu trong taxonomy? Đây là governance package — đó là primary plane của nó — và nó
chạm control và data là secondary plane. Nó là governance vì nó quyết định technology có được
phép chạy không; nó chạm data vì nó định nghĩa consent records, và control vì nó ảnh hưởng đến
runtime behavior.

*[Hiển thị: `sys/taxonomy.yaml:538` cho primary plane, `:539` cho secondary planes, và entry tại
`:519`; core module được liệt kê tại `:547`.]*

Một điểm thiết kế quan trọng: consent không sở hữu database. Nó định nghĩa contract — interface
`ConsentStore` tại `core.ts:184` và `ConsentEventSink` tại `:212` — còn host application inject
persistence thật sự. Service composition nhận store và sink tùy chọn, tại `service.ts:17-19`,
và public entry chỉ export core và service của chính nó, tại `index.ts:5-6`. Đó là quy tắc bốn,
clean boundaries, trong thực tế.

Bây giờ là contract audit thật sự.

*[Hiển thị: audit. Plane ownership: pass — `taxonomy.yaml:538`. Clean boundaries: pass —
`index.ts:5-6`. Ship từ dist với side-effects off: pass — `package.json:7`, với dist exports tại
:8, :10, :14, :22. Tests: pass — 10 file, 43 test.]*

Hai điểm trong package mình sẽ không bỏ qua. Composition function là `createConsentService`,
không phải tên `defineConsent` mà tiêu chuẩn ưu tiên — nên mình đánh dấu composition là Partial.
Và package bản thân không có Zod validation config tại root — đó là Gap. Code đó nằm trong
monorepo, ngoài lane của mình.

Điều demo host tự làm được: `VendorSchema` tại `consent.ts:20` định nghĩa shape của vendor, và
`z.array(VendorSchema).min(1).parse(vendors)` tại `:119` chạy tại module init — nếu bất kỳ
vendor entry nào sai shape, app throw ngay với Zod error rõ ràng. Toàn bộ env startup được parse
qua `EnvSchema` tại `src/env.ts:3` thông qua `parseEnv()` tại `:15`. Đó là Rule 3 được áp dụng
ở nơi mình sở hữu code.

*[Hiển thị: ví dụ code consent.]*

**Quyết định chỉ là một lời gọi hàm.** `canUse` đã tích hợp safe default — nếu chưa có
decision hoặc decision đã stale, nó tự trả `false`:

```typescript
// core.ts:132 — toàn bộ consent gate trong một dòng
if (canUse('analytics', ctx)) {
  loadAnalytics()
}
// ctx.decision === null        → false (chưa có consent)
// policyVersion không khớp    → false (requiresReprompt tại :123)
// category 'analytics' granted → true
```

**Host wires hai seam.** Package định nghĩa contract; host cung cấp implementation tại
composition time:

```typescript
// service.ts:17-19 — host inject store + optional event sink
const service = createConsentService({
  store: new SupabaseConsentStore(db),  // implements ConsentStore tại core.ts:184
  sink:  new SentinelEventSink(),       // implements ConsentEventSink tại core.ts:212
})
```

**Zod validate vendor registry tại module init** — demo tự áp dụng Rule 3. Bất kỳ entry
sai shape nào sẽ throw trước khi nhận request đầu tiên:

```typescript
// consent.ts:119
z.array(VendorSchema).min(1).parse(vendors)
// nếu reviewedAt thiếu hoặc category bị typo → ZodError thrown ngay khi startup
```

Để mình chạy demo.

*[Chạy: `pnpm start`, mở `http://localhost:4173`.]*

Đây là trạng thái ban đầu: Session Cookie là ALLOW, vì nó strictly necessary và được yêu cầu.
Product Analytics và Support Widget đều là DENY, vì chưa có consent nào được cấp — đó là
safe default.

*[Click "Grant analytics".]*

Product Analytics vừa chuyển thành ALLOW — người dùng đã cấp category đó — trong khi Support
Widget vẫn DENY, vì support chưa được cấp.

*[Click "Bump policy version".]*

Mình vừa giả lập một thay đổi policy. Decision đã lưu giờ cũ hơn policy version hiện tại, nên
`requiresReprompt` trả về true, và mọi non-essential vendor bị block lại cho đến khi người dùng
re-consent. Đó là toàn bộ ý nghĩa: khi quy tắc thay đổi, quyền cũ không được ngầm duy trì.

*[Evidence trong demo: policy version tại `sys-demo-product/src/consent.ts:32`, bump tại `:37`,
vendor registry tại `:46`, Zod vendor validation tại `:119`, in-memory store tại `:80`,
`recordConsent` tại `:142`, `vendorDecisions` tại `:175`, và dashboard routes tại
`server.ts:151`, `:157`, `:163`.]*

Về tests, package ship 43 test trên 10 file — decision engine, category builder, service,
lifecycle, governance policy, negative inputs, và adversarial replay và protocol cases. Và vì
demo product trước đây không có test nào, mình đã thêm 4 test của riêng mình tại
`sys-demo-product/src/__tests__/consent.test.ts` — lock in chính xác flow vừa demo: necessary-only,
grant, bump, re-prompt — chạy offline.

Gap trong package: không có Zod và tên không phải `defineConsent` — trong monorepo, không phải
lane của mình. Trong demo host: persistence là in-memory — thiết kế cố ý, nhưng có hậu quả thực
tế trên serverless mà mình đã gặp, sẽ nói lại ở phần lessons.

Nếu ai hỏi: analytics không bật mặc định vì nó không strictly necessary — necessary-only là
safe default. Chúng ta re-prompt sau khi policy thay đổi vì consent cũ không còn đại diện cho
lựa chọn của user dưới policy mới. Consent không lưu gì cả — nó sở hữu contract, host sở hữu
database. Và nó không phải UI package — nó là decision engine; dashboard chỉ là surface của demo.

---

# Bài 3 — @sys/warp

*[Tool cho bài này: Supabase — Postgres, schema, và validate nó.]*

Package thứ hai là `@sys/warp`. Nếu consent bảo vệ permission, warp bảo vệ correctness. Nó không
chạm database và không chạy migration. Nó validate schema và configuration, và report những gì
sai. Đó là toàn bộ contract: validate và report, không bao giờ tự fix.

Model của nó là một check runner. Host đăng ký các check có tên; mỗi check trả về danh sách
error string; warp chạy tất cả và tổng hợp thành một report.

*[Evidence trên màn hình: `sys/packages/warp/src/core.ts` — contract `Check` tại :5, report type
tại :12, config type tại :17, `defineWarp` tại :22, `runWarp` tại :27, `isClean` tại :36. Các
reusable check builder nằm trong `checks.ts` — `referentialCheck` tại :8, `requiredKeysCheck`
tại :30, `hasBannedToken` tại :56, `findBannedColumns` tại :67, và `bannedColumnsCheck` tại :105.]*

Plane: giống consent, warp là governance — primary plane tại `sys/taxonomy.yaml:179`, với data
là secondary plane tại :180, và entry tại :160. Taxonomy còn ghi rõ checks là project-specific
và injected, tại :185, và liệt kê các module core, checks, và CLI tại :187, :190, và :193.

Contract audit trông giống consent.

*[Hiển thị: audit. Plane, clean boundaries (`checks.ts:5` chỉ import type từ `./core`;
`index.ts:4-6` chỉ export package files), dist (`package.json:8`, :13, :17, :30), CLI artifact
(:10), side-effects off (:7): tất cả pass. Tests: pass — 11 file, 45 test.]*

Gap của package giống consent: `defineWarp` tồn tại, tại `core.ts:22`, nhưng nó là identity-style
helper — không có Zod validation config tại root. Cùng monorepo, cùng lane restriction. Demo host
bù đắp phần env: `parseEnv()` tại `src/env.ts:15` validate `WARP_DEMO_CASE`, `SUPABASE_URL`, và
tất cả required key qua Zod trước khi server khởi động.

Trong demo, warp chạy ba check trên schema orders của mình. Thứ nhất, schema genericity — một
banned-token scan phát hiện currency bị hard-code vào tên column. Thứ hai, vendor registry
integrity — một referential check xác nhận mọi feature-flag vendor đều tồn tại trong approved
registry. Thứ ba, required environment config — kiểm tra các key mà product cần đều có mặt.

*[Hiển thị: ví dụ code warp.]*

**Check runner model.** Host đăng ký named checks; warp chạy tất cả và tổng hợp một
report — supabase.ts:140:

```typescript
const report = await runWarp({
  checks: [
    bannedColumnsCheck('schema-genericity',  { sql, banned: ['usd','vnd','aed'] }),
    referentialCheck('vendor-integrity',      { from: featureFlags, to: registry }),
    requiredKeysCheck('env-config',           { required: KEYS, present: presentKeys }),
  ]
})
isClean(report)  // true = zero errors trên cả ba check
```

**`hasBannedToken` là pure** — checks.ts:56. Nó tách tên column theo `_` và kiểm tra
từng segment với banned set:

```typescript
hasBannedToken('amount_usd', new Set(['usd','vnd']))  // true  — segment 'usd' bị ban
hasBannedToken('amount',     new Set(['usd','vnd']))  // false — không có segment bị ban
hasBannedToken('currency',   new Set(['usd','vnd']))  // false — 'currency' không trong set
```

**`referentialCheck` nối bất kỳ hai collection nào** — checks.ts:8. Mỗi item trong
`from()` phải tồn tại trong `to()`; item thiếu tạo ra structured error:

```typescript
referentialCheck('vendor-registry-integrity', {
  from:    () => featureFlagVendorIds,   // ['session-cookie', ..., 'unknown-tracker']
  to:      () => REGISTERED_VENDOR_IDS,  // ['session-cookie', 'product-analytics', ...]
  message: id => `Unregistered vendor "${id}" referenced in feature flags`,
})
// broken case → errors: ['Unregistered vendor "unknown-tracker" ...']
// fixed case  → errors: []
```

Để mình chạy broken case.

*[Chạy: `$env:WARP_DEMO_CASE='broken'; pnpm demo`.]*

Warp bắt được hai vấn đề đã cài sẵn. Schema check fail trên `amount_usd`, vì column đó bake
currency vào schema — *[hiển thị `sys-demo-product/src/supabase.ts:31`]*. Và vendor check fail
trên `unknown-tracker`, một feature flag trỏ đến vendor chưa bao giờ được đăng ký — *[hiển thị
`supabase.ts:90`]*. Report không clean: hai lỗi, còn required keys vẫn pass.

```text
[FAIL] supabase-schema-genericity
[FAIL] vendor-registry-integrity
[PASS] required-env-config
Total errors: 2 — clean: false
```

Bây giờ fix.

*[Chạy: `$env:WARP_DEMO_CASE='fixed'; pnpm demo`.]*

Schema giờ dùng `amount` cộng với column `currency` riêng biệt — *[hiển thị `supabase.ts:42`]* —
unknown vendor đã bị xóa — *[hiển thị `supabase.ts:91`]* — và cả ba check đều pass: zero error,
clean. Cùng warp, cùng check; chỉ config thay đổi. `runWarp` được gọi với ba check tại
`supabase.ts:140`.

```text
[PASS] supabase-schema-genericity
[PASS] vendor-registry-integrity
[PASS] required-env-config
Total errors: 0 — clean: true
```

Về tests, warp ship 45 test trên 11 file — runner, ba loại check, environment-integrity, và
các case negative, malformed, governance, và adversarial-evasion. Mình thêm 6 cái nữa tại
`sys-demo-product/src/__tests__/supabase.test.ts`, bao phủ hành vi broken-catches và fixed-clean
offline trên SQL fixtures — để chính claim của demo được test.

Gap của package: `defineWarp` không có Zod — cùng lane restriction như consent. Trong demo:
warp report nhưng không bao giờ fix hay migrate; fixed case dùng SQL fixture đã sửa, nên mình
có thể demo after-fix pass ngay cả khi database thật chưa migrate.

Nếu ai hỏi: warp không sửa schema và không chạy migration — con người hoặc migration tool làm
điều đó. Nó khác unit test ở chỗ unit test kiểm tra code behavior, còn warp kiểm tra
configuration, schema, và runtime structure. `amount_usd` xấu vì nó hard-code currency vào schema
— `amount` cộng `currency` mới là generic. Và `unknown-tracker` xấu vì config tham chiếu vendor
chưa đăng ký làm suy yếu governance của mình đối với tracking technology.

---

# Kết — tại sao đây là Data & Trust

*[Hiển thị: slide bốn primitive.]*

```text
Consent    = permission
Warp       = validation
Gatekeeper = approval
Sentinel   = observability
```

Nhìn lại toàn cục, hai package này là những mảnh ghép của một điều lớn hơn. Consent là
permission. Warp là validation. Thêm gatekeeper cho approval và sentinel cho observability, và
bạn có building blocks của accountable AI: permission, validation, approval, và observability.
Consent đảm bảo technology chỉ chạy khi có đúng permission. Warp đảm bảo configuration và schema
được validate trước khi trở thành production risk. Trong bức tranh Alethic, đó chính xác là
những primitive cho phép AI agent hoạt động trong môi trường kinh doanh thực tế và vẫn giữ được
trách nhiệm.

Về con số: 43 test cho consent, 45 cho warp, cộng thêm 10 mình tự thêm vào demo vốn không có
test nào — 98 test tổng, tất cả green — và mọi số dòng trong bài này đều đã xác minh trên repo.

---

# Bài học từ tuần của mình

*(Tự nhiên, không slide.)*

Bài học lớn nhất: repo là nguồn sự thật, không phải AI. AI đưa ra evidence tự tin, cụ thể —
file và line number chính xác — và rất nhiều cái sai. Khi mình xác minh lại bài này so với repo
thật, line number của consent sai lệch ba dòng từ một điểm nhất định, tham chiếu taxonomy sai
hơn một trăm dòng, và mình đã viết là warp có 29 test trong khi suite thật sự chạy ra 45. Không
có gì trông sai cho đến khi mình mở file ra. Vậy nên quy tắc đó thật sự đúng theo nghĩa đen:
dùng AI để draft, sau đó xác minh trên repo trước khi nói thành lời.

Thứ hai: "connected" không phải lúc nào cũng đồng nghĩa với "working." Mình đã kết nối Supabase
và Vercel connector. CLI nói connected, nhưng các tool không dùng được cho đến khi reload — và
một connector ở trạng thái "Requested", đang chờ admin, đó là chuyện hoàn toàn khác. Có nhiều
lớp — transport, authentication, tool-loading — và green ở một lớp không có nghĩa là lớp mình
thật sự cần đã sẵn sàng.

Thứ ba: serverless phá vỡ một giả định mình không biết là mình đang có. Demo consent giữ store
trong memory. Locally điều đó vô hình, vì chỉ có một process. Ngay khi mình nhìn vào việc
deploy lên Vercel, mình nhận ra mỗi serverless invocation có thể là một fresh instance — nên
một consent đã được grant có thể không sống sót qua request tiếp theo. Package đúng khi biến
persistence thành host-injected seam; demo của mình chỉ chưa điền vào đó bằng thứ gì thật. Đó
là honest gap mình mang sang tuần tới: chuyển store sang Supabase.

Và điều duy nhất mình muốn nói với bản thân hôm thứ Hai: đừng tin vào một con số hay một tham
chiếu dòng mà mình chưa tự mở ra kiểm tra. Draft thì nhanh; verify mới là công việc thật sự.

---

# Lightning talk frontier của mình (slot 15 phút riêng)

Ngoài ra, mình có một lightning talk frontier 15 phút, và mình chọn Accountable AI — vấn đề
Alethic — vì nó là phần mở rộng tự nhiên của consent và warp: permission và validation là hai
trong số những primitive làm cho AI agent đủ trách nhiệm để thực hiện công việc thực tế. Nhẹ
nhàng và tò mò, nghiên cứu bằng Perplexity và Claude.

---

# Bản 60 giây

Person C phụ trách Data & Trust. Ba bài: coding standards định nghĩa một Sys package tốt là gì;
`@sys/consent`, đưa ra quyết định ALLOW/DENY cho cookies và scripts; và `@sys/warp`, validate
schema và configuration. Demo thể hiện safe default của consent và policy re-prompt, warp bắt
planted issues, và warp clean sau khi fix. Mỗi khẳng định đều được gắn với file và dòng —
43 test cho consent, 45 cho warp, và 10 mình tự thêm vào demo, 98 test tổng tất cả green. Cả
hai package cùng có một honest gap: chưa có Zod tại composition root — trong monorepo, ngoài
lane của mình. Demo host tự áp dụng Rule 3: vendor registry Zod-validate tại `consent.ts:119`,
env config qua `EnvSchema` tại `env.ts:3`.
