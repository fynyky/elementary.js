/* esline-env browser */
/* globals  el */

describe("Element creation", () => {
    
  it('can create a basic div', () => {
    const result = el("foo")
    assert(result.outerHTML === '<div class="foo"></div>')
  })

  it('can create a valid HTML tag', () => {
    const result = el("h1")
    assert(result.outerHTML === '<h1 class="h1"></h1>')
  })

  it('can wrap an existing element', () => {
    const base = document.createElement("div")
    const result = el(base)
    assert(result === base)
    assert(result.outerHTML === '<div></div>')
  })

  it('can fill an element with text', () => {
    const result = el("foo", "bar")
    assert(result.outerHTML === '<div class="foo">bar</div>')
  })

  it('can fill an element with another element', () => {
    const innerElement = el("foo")
    const result = el("bar", innerElement)
    assert(result.outerHTML === '<div class="bar"><div class="foo"></div></div>')
  })

  it('can fill an element with a function', () => {
    const result = el("foo", $ => {
      $.innerHTML = "bar"
    })
    assert(result.outerHTML === '<div class="foo">bar</div>')
  })

  it('can fill an element with a function using this', () => {
    const result = el("foo", function() {
      this.innerHTML = "bar"
    })
    assert(result.outerHTML === '<div class="foo">bar</div>')
  })

  it('can fill an element with a function return', () => {
    const result = el("foo", () => 'bar')
    assert(result.outerHTML === '<div class="foo">bar</div>')
  })

  it('can fill an element with arrays', () => {
    const result = el("foo", [
      'bar',
      'baz',
      'qux'
    ])
    assert(result.outerHTML === '<div class="foo">barbazqux</div>')
  })


  it('can fill an element with nested arrays', () => {
    const result = el("foo", [
      'bar', [
        'baz', [
          'qux'
        ]
      ]
    ])
    assert(result.outerHTML === '<div class="foo">barbazqux</div>')
  })

  it('can fill an element with multiple arguments', () => {
    const result = el("foo",
      "bar",
      "baz",
      "qux"
    )
    assert(result.outerHTML === '<div class="foo">barbazqux</div>')
  })

  it('can do all of the above', () => {
    const base = document.createElement("div")
    const result = el("foo", [
      el("h1"), [
        el(base),
        "bar"
      ],
      $ => { $.setAttribute("name", 'baz') },
      function() { this.id = 'qux' },
      $ => 'corge'
    ])
    assert(result.outerHTML === '<div class="foo" name="baz" id="qux"><h1 class="h1"></h1><div></div>barcorge</div>')
  })

  it('can nest el elegantly', () => {
    const result = el('foo',
      el('bar', 
        el('baz', $ => {
          el($, 'qux')
        })
      )
    )  
    assert(result.outerHTML === '<div class="foo"><div class="bar"><div class="baz">qux</div></div></div>')
  })

})

describe("Reactivity", () => {

})

describe("Clean up", () => {
  
})