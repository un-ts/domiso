import fixtures from 'DOMPurify/test/fixtures/expect.mjs'
import { sanitize } from 'domiso'

const incorrectOverrides: Partial<Record<string, string>> = {
  'Tests against attribute-based mXSS behavior 1/3':
    '<svg></svg><p><style><g title="</style><img src=\\"x\\" onerror=\\"alert(1)\\">"&gt;</p>',
  'Test against fake-element-based namepsace-confusion abusing mXSS attacks 1/2':
    'a<svg></svg>',
  'Test against fake-element-based namepsace-confusion abusing mXSS attacks 2/2':
    '<math><mtext><option></option></mtext></math>',
  'mXSS Variation II': '<img src="x" id="">',
  68: `<div id="14"><input pattern="^((a+.)a)+$" value="aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa!">//["'\`--&gt;]]&gt;]</div>`,
  91: `<div id="38">//["'\`--&gt;]]&gt;]</div><div id="39"></div>`,
  97: `<div id="42"><base><a href="/. /,alert(42)//#">XXX</a>//["'\`--&gt;]]&gt;]</div>`,
}

describe('dompurify compatibility', () => {
  let mismatches = 0
  for (const [index, { title, payload, expected }] of Object.entries(
    fixtures,
  )) {
    const name = title ?? index
    test(name, () => {
      const result = sanitize(payload, true)
      const expects =
        incorrectOverrides[name] ??
        (Array.isArray(expected) ? expected : [expected])
      try {
        expect(expects).toContain(result)
      } catch {
        mismatches++
        expect({
          payload,
          result,
          expected,
        }).toMatchSnapshot(name)
      }
    })
  }

  test('mismatches', () => {
    expect(mismatches).toMatchInlineSnapshot(`73`)
  })
})
