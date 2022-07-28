import { sanitize } from 'domiso'

test('Remove listeners and scripts', () => {
  expect(
    sanitize(/* HTML */ `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta
            http-equiv="X-UA-Compatible"
            content="IE=edge"
          />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>Document</title>
        </head>
        <body>
          <img
            src="/whatever-error"
            onload="alert('onload xss')"
            onerror="alert('onerror xss')"
          />
          <script>
            console.log('XSS')
          </script>
        </body>
      </html>`),
  ).toMatchInlineSnapshot(`
        "<html lang=\\"en\\"><head>
                  <meta charset=\\"UTF-8\\">
                  <meta http-equiv=\\"X-UA-Compatible\\" content=\\"IE=edge\\">
                  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\">
                  <title>Document</title>
                </head>
                <body>
                  <img src=\\"/whatever-error\\">
                  
                
              </body></html>"
      `)
})
