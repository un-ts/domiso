declare module 'DOMPurify/test/fixtures/expect.mjs' {
  export interface Fixture {
    title?: string
    payload: string
    expected: string[] | string
  }

  const fixtures: Fixture[]

  export default fixtures
}
