/* esline-env browser */
/* globals  el */

import { el } from "./elementary.js"
import { observe as ob, Reactor } from "./reactor.js"

describe("Element creation", () => {
    
  it('can create a basic div', () => {
    const result = el("foo")
    assert.equal(result.outerHTML,'<div class="foo"></div>')
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
    const result = el("foo", 'bar')
    assert.equal(result.outerHTML, '<div class="foo">bar</div>')
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
  it('can take an observer', (done) => {
    const result = el("foo", ob(() => {}))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take an observer modifying a property', (done) => {
    console.log('can take')
    const result = el("foo", ob(($) =>  {
      $.setAttribute('name', 'bar')
    }))
    assert.equal(
      result.outerHTML, 
      '<div class="foo" name="bar"><!--observerStart--><!--observerEnd--></div>'
    )
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo" name="bar"><!--observerStart--><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take an observer returning a string', (done) => {
    const result = el("foo", ob(() => 'bar'))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->bar<!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->bar<!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take an observer returning an element', (done) => {
    const result = el("foo", ob(() => el('bar', 'baz')))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><div class="bar">baz</div><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><div class="bar">baz</div><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take an observer returning an array', (done) => {
    const result = el("foo", ob(() => ['bar', 'baz', 'qux']))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->barbazqux<!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->barbazqux<!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take ested observers', (done) => {
    const result = el("foo", ob(() => {
      return ob(() => {
        return 'bar'
      })
    }))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerStart-->bar<!--observerEnd--><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerStart-->bar<!--observerEnd--><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('can take a complex nested set of observers', (done) => {
    const result = el("foo", ob(() => {
      return [
        ob(() => {
          return [
            ob(() => {
              return 'bar'
            }),
            ob(() => {
              return 'baz'
            })
          ]
        }),
        ob(() => {
          return ob(() => {
            return 'qux'
          })
        }),
      ]
    }))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerStart--><!--observerStart-->bar<!--observerEnd--><!--observerStart-->baz<!--observerEnd--><!--observerEnd--><!--observerStart--><!--observerStart-->qux<!--observerEnd--><!--observerEnd--><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart--><!--observerStart--><!--observerStart-->bar<!--observerEnd--><!--observerStart-->baz<!--observerEnd--><!--observerEnd--><!--observerStart--><!--observerStart-->qux<!--observerEnd--><!--observerEnd--><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  // it('updates an observer property', () => { throw 'test not defined'})
  // it('updates an observer string', () => { throw 'test not defined'})
  // it('updates an observer element', () => { throw 'test not defined'})
})

describe("Clean up", () => {
  
})