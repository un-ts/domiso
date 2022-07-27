import { sanitizeSvg } from 'domiso'

test('Remove listeners and scripts', () => {
  expect(
    sanitizeSvg(/* HTML */ `<svg onload="alert('xss listener')">
      <text>Hello World!</text>
      <script>
        alert('xss script')
      </script>
    </svg>`),
  ).toMatchInlineSnapshot(`
      "<svg>
            <text>Hello World!</text>
            
          </svg>"
    `)
})
