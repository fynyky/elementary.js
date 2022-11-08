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

  it('updates an observer property', (done) => {
    const rx = new Reactor()
    rx.bar = 'baz'
    const result = el("foo", ob(($) =>  {
      $.setAttribute('name', rx.bar)
    }))
    assert.equal(
      result.outerHTML, 
      '<div class="foo" name="baz"><!--observerStart--><!--observerEnd--></div>'
    )
    rx.bar = 'qux'
    assert.equal(
      result.outerHTML, 
      '<div class="foo" name="baz"><!--observerStart--><!--observerEnd--></div>'
    )
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(
        result.outerHTML, 
        '<div class="foo" name="qux"><!--observerStart--><!--observerEnd--></div>'
      )
      rx.bar = 'corge'
      assert.equal(
        result.outerHTML, 
        '<div class="foo" name="corge"><!--observerStart--><!--observerEnd--></div>'
      )
      result.remove()
      done()
    }, 10)
  })

  it('updates an observer string', (done) => { 
    const rx = new Reactor()
    rx.bar = 'baz'  
    const result = el("foo", ob(() => rx.bar))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    rx.bar = 'qux'
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->qux<!--observerEnd--></div>')
      rx.bar = 'corge'
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->corge<!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)
  })

  it('updates an observer element', (done) => { 
    const rx = new Reactor()
    rx.foo = 'foo'
    rx.bar = 'bar'
    const result = el("div", ob(() => el(rx.foo, rx.bar)))
    assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="foo">bar</div><!--observerEnd--></div>')
    rx.foo = 'baz'
    rx.bar = 'qux'
    assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="foo">bar</div><!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="baz">qux</div><!--observerEnd--></div>')
      rx.foo = 'corge'
      assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="corge">qux</div><!--observerEnd--></div>')
      rx.bar = 'grault'
      assert.equal(result.outerHTML, '<div class="div"><!--observerStart--><div class="corge">grault</div><!--observerEnd--></div>')
      result.remove()
      done()
    }, 10)  
  })

  it('updates a complex element', (done) => { 
    const rx = new Reactor()
    rx.title = 'foo'
    rx.paragraphs = [
      { id: 'bar', content: 'Lorem ipsum dolor sit amet', time: '1'},
      { id: 'baz', content: 'Ut enim ad minim veniam', time: '2'},
      { id: 'qux', content: 'Duis aute irure dolor in reprehenderit', time: '3'}
    ]
    const result = el("article",
      el('h1', ob(() => rx.title )),
      ob(() => rx.paragraphs.map((paragraph) => [
        el('p', ob(($) => {
          $.setAttribute('id', paragraph.id)
          return paragraph.content
        })),
        ob(() => el('h3', ob(() => paragraph.time)))
      ]))
    )
    assert.equal(
      result.outerHTML,
      '<article class="article"><h1 class="h1"><!--observerStart-->foo<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->Lorem ipsum dolor sit amet<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->1<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->2<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->3<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
    )
    document.body.appendChild(result)
    rx.title = 'corge'
    assert.equal(
      result.outerHTML,
      '<article class="article"><h1 class="h1"><!--observerStart-->foo<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->Lorem ipsum dolor sit amet<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->1<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->2<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->3<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
    )
    setTimeout(() => {
      assert.equal(
        result.outerHTML,
        '<article class="article"><h1 class="h1"><!--observerStart-->corge<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->Lorem ipsum dolor sit amet<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->1<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->2<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->3<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
      )
      rx.paragraphs[0].content = 'bloop bloop bloop'
      assert.equal(
        result.outerHTML,
        '<article class="article"><h1 class="h1"><!--observerStart-->corge<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->bloop bloop bloop<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->1<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->2<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->3<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
      )
      rx.paragraphs[2].time = '987'
      assert.equal(
        result.outerHTML,
        '<article class="article"><h1 class="h1"><!--observerStart-->corge<!--observerEnd--></h1><!--observerStart--><p class="p" id="bar"><!--observerStart-->bloop bloop bloop<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->1<!--observerEnd--></h3><!--observerEnd--><p class="p" id="baz"><!--observerStart-->Ut enim ad minim veniam<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->2<!--observerEnd--></h3><!--observerEnd--><p class="p" id="qux"><!--observerStart-->Duis aute irure dolor in reprehenderit<!--observerEnd--></p><!--observerStart--><h3 class="h3"><!--observerStart-->987<!--observerEnd--></h3><!--observerEnd--><!--observerEnd--></article>'
      )
      result.remove()
      done()
    }, 10)  
  })

})

describe("Clean up", () => {

  it('disables observer when removed from DOM', (done) => {
    const rx = new Reactor()
    rx.bar = 'baz'  
    const result = el("foo", ob(() => rx.bar))
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    rx.bar = 'qux'
    assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->baz<!--observerEnd--></div>')
    document.body.appendChild(result)
    setTimeout(() => {
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->qux<!--observerEnd--></div>')
      rx.bar = 'corge'
      assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->corge<!--observerEnd--></div>')
      result.remove()
      setTimeout(() => {
        rx.bar = 'grault'
        assert.equal(result.outerHTML, '<div class="foo"><!--observerStart-->corge<!--observerEnd--></div>')
        done()
      }, 10)
    }, 10)
  })

  
})