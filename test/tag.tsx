/** @jsx JSXSlack.h */
import JSXSlack, {
  Actions,
  Blocks,
  Button,
  Divider,
  Fragment,
  Image,
  jsxslack,
  Option as BlockKitOption,
  Section,
  Select as BlockKitSelect,
} from '../src/index'

describe('Tagged template', () => {
  it('allows converting Block Kit JSX to JSON without transpiler', () => {
    const count = 2
    const template = jsxslack`
      <Blocks>
        <!-- jsx-slack template literal tag can use as like as JSX. -->
        <Section>
          <Image src="https://example.com/example.jpg" alt="example" />
          <b>Tagged template</b><br />
          jsx-slack can use without transpiler by <code>jsxslack</code> tagged template!
        </Section>
        <Divider />
        <Actions>
          <Button actionId="clap${count}">:clap: ${count}</Button>
          <Select actionId="select">
            <Option value="1">one</Option>
            <Option value="2">two</Option>
            <Option value="3">three</Option>
          </Select>
        </Actions>
      </Blocks>
    `

    expect(template).toStrictEqual(
      JSXSlack(
        <Blocks>
          {/* jsx-slack template literal tag can use as like as JSX. */}
          <Section>
            <Image src="https://example.com/example.jpg" alt="example" />
            <b>Tagged template</b>
            <br />
            jsx-slack can use without transpiler by <code>jsxslack</code> tagged
            template!
          </Section>
          <Divider />
          <Actions>
            <Button actionId={`clap${count}`}>:clap: {count}</Button>
            <BlockKitSelect actionId="select">
              <BlockKitOption value="1">one</BlockKitOption>
              <BlockKitOption value="2">two</BlockKitOption>
              <BlockKitOption value="3">three</BlockKitOption>
            </BlockKitSelect>
          </Actions>
        </Blocks>
      )
    )
  })

  it('can use fragmented options in <Select>', () => {
    const template = jsxslack`
      <Blocks>
        <Actions>
          <Select>
            ${[...Array(10)].map(
              (_, i) =>
                jsxslack.fragment`<Option value=${i.toString()}>${i}</Option>`
            )}
          </Select>
        </Actions>
      </Blocks>
    `

    expect(template).toStrictEqual(
      JSXSlack(
        <Blocks>
          <Actions>
            <BlockKitSelect>
              {[...Array(10)].map((_, i) => (
                <BlockKitOption value={i.toString()}>{i}</BlockKitOption>
              ))}
            </BlockKitSelect>
          </Actions>
        </Blocks>
      )
    )
  })

  it('can use interpolations through conditional rendering', () => {
    const template = jsxslack`
      <Blocks>
        <Section>cond${'i'}tio${null}nal</Section>
        ${true && jsxslack.fragment`<Section>rendering</Section>`}
        ${false && jsxslack.fragment`<Section>test</Section>`}
      </Blocks>
    `

    expect(template).toStrictEqual(
      JSXSlack(
        <Blocks>
          <Section>conditional</Section>
          <Section>rendering</Section>
        </Blocks>
      )
    )
  })

  it('has same decode behavior compatible with JSX for HTML entities', () => {
    const [jsxEntitySection] = JSXSlack(
      <Blocks>
        <Section>
          <code>
            &lt;span data-test=&quot;&amp;&quot;&gt;&hearts;&lt;/span&gt;
          </code>
        </Section>
      </Blocks>
    )

    expect(jsxEntitySection.text.text).toBe(
      '`&lt;span data-test="&amp;"&gt;\u2665&lt;/span&gt;`'
    )

    const [jsxRawEntitySection] = JSXSlack(
      <Blocks>
        <Section>
          <code>
            {'&lt;span data-test=&quot;&amp;&quot;&gt;&hearts;&lt;/span&gt;'}
          </code>
        </Section>
      </Blocks>
    )

    // Slack requires double-escapation to ampersand for holding raw string of "&lt;", "&gt;", and "&amp;".
    expect(jsxRawEntitySection.text.text).toBe(
      '`&amp;lt;span data-test=&amp;quot;&amp;amp;&amp;quot;&amp;gt;&amp;hearts;&amp;lt;/span&amp;gt;`'
    )

    const [templateEntitySection] = jsxslack`
      <Blocks>
        <Section>
          <code>
            &lt;span data-test=&quot;&amp;&quot;&gt;&hearts;&lt;/span&gt;
          </code>
        </Section>
      </Blocks>
    `

    expect(templateEntitySection).toStrictEqual(jsxEntitySection)

    const [templateRawEntitySection] = jsxslack`
      <Blocks>
        <Section>
          <code>
            ${'&lt;span data-test=&quot;&amp;&quot;&gt;&hearts;&lt;/span&gt;'}
          </code>
        </Section>
      </Blocks>
    `

    expect(templateRawEntitySection).toStrictEqual(jsxRawEntitySection)
  })

  describe('jsxslack.fragment', () => {
    it('returns raw nodes for reusable as component', () => {
      const func = title => jsxslack.fragment`
        <Section><b>${title}</b></Section>
        <Divider />
      `

      expect(func('test')).toStrictEqual(
        <Fragment>
          <Section>
            <b>test</b>
          </Section>
          <Divider />
        </Fragment>
      )

      const Component = ({ children }) => jsxslack.fragment`
        <Section><b>${children}</b></Section>
        <Divider />
      `

      expect(jsxslack`<Blocks><${Component}>Hello<//></Blocks>`).toStrictEqual(
        JSXSlack(
          <Blocks>
            <Section>
              <b>Hello</b>
            </Section>
            <Divider />
          </Blocks>
        )
      )

      expect(jsxslack.fragment`<${Component}>test<//>`).toStrictEqual(
        func('test')
      )
    })
  })
})
