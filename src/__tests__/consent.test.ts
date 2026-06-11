import { describe, expect, it } from 'vitest'

import {
  bumpPolicyVersion,
  consentNeedsPrompt,
  getPolicyVersion,
  makeDecision,
  recordConsent,
  vendorDecisions,
} from '../consent.js'

// The consent module holds ONE in-memory store and a mutable POLICY_VERSION, exactly like
// the running demo. These tests run in definition order and lock in the demo narrative:
// necessary-only -> grant analytics -> bump policy -> re-prompt.

function byId(decisions: Awaited<ReturnType<typeof vendorDecisions>>) {
  return Object.fromEntries(decisions.map((d) => [d.id, d]))
}

describe('@sys/consent demo seam', () => {
  it('starts necessary-only: required vendor ALLOW, non-essential DENY', async () => {
    expect(await consentNeedsPrompt()).toBe(true) // no decision recorded yet
    const vendors = byId(await vendorDecisions())
    expect(vendors['session-cookie'].choice).toBe('required')
    expect(vendors['session-cookie'].allowed).toBe(true)
    expect(vendors['product-analytics'].allowed).toBe(false)
    expect(vendors['support-widget'].allowed).toBe(false)
  })

  it('makeDecision grants only the requested non-essential categories', () => {
    const decision = makeDecision(['analytics'])
    expect(decision.categories.strictly_necessary).toBe('granted')
    expect(decision.categories.analytics).toBe('granted')
    expect(decision.categories.marketing).toBe('denied')
    expect(decision.policyVersion).toBe(getPolicyVersion())
  })

  it('after granting analytics, product-analytics becomes ALLOW', async () => {
    await recordConsent(['analytics'])
    expect(await consentNeedsPrompt()).toBe(false) // fresh decision under current policy
    const vendors = byId(await vendorDecisions())
    expect(vendors['product-analytics'].allowed).toBe(true)
    expect(vendors['support-widget'].allowed).toBe(false) // support was not granted
  })

  it('bumping the policy version makes the stored decision stale -> re-prompt', async () => {
    const before = getPolicyVersion()
    const after = bumpPolicyVersion()
    expect(after).not.toBe(before)
    expect(await consentNeedsPrompt()).toBe(true)
    // Until the user re-consents, non-essential vendors are blocked again.
    const vendors = byId(await vendorDecisions())
    expect(vendors['product-analytics'].allowed).toBe(false)
  })
})
