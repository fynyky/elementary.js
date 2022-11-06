/* esline-env browser */
// Manually updated list of valid HTML tags
// Used to know when to create a named tag and when to create a div by default
class Observer {} // TODO fill this out
const validHTMLTags = Object.freeze([
  'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside', 'audio',
  'b', 'bdi', 'base', 'basefont', 'bdo', 'big', 'blockquote', 'body', 'br', 'button',
  'canvas', 'caption', 'center', 'cite', 'code', 'col', 'colgroup', 'command',
  'data', 'datagrid', 'datalist', 'dd', 'del', 'details', 'dfn', 'dir', 'div', 'dl', 'dt',
  'em', 'embed', 'eventsource',
  'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form', 'frame', 'frameset',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html',
  'i', 'iframe', 'img', 'input', 'ins', 'isindex',
  'kbd', 'keygen',
  'label', 'legend', 'li', 'link',
  'mark', 'map', 'menu', 'meta', 'meter',
  'nav',
  'noframes', 'noscript',
  'object', 'ol', 'optgroup', 'option', 'output',
  'p', 'param', 'pre', 'progress',
  'q',
  'ruby', 'rp', 'rt',
  's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strike', 'strong', 'style', 'sub', 'summary', 'sup',
  'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt',
  'u', 'ul',
  'var', 'video',
  'wbr'
])

// Maps normal Elements to their elInterface which enables the magic
const elCache = new WeakMap()

// Setup a mutation observer
// If an element is removed from the document then turn it off
// Have to account for nodes being added to removed outside of the document
const mutationObserver = new MutationObserver((mutationList, mutationObserver) => {
  // Compile a flat set of added/removed elements
  const addedAndRemovedElements = new Set()
  for (const mutationRecord of mutationList) {
    for (const addedNode of Array.from(mutationRecord.addedNodes)) {
      if (addedNode.nodeType === Node.ELEMENT_NODE) {
        addedAndRemovedElements.add(addedNode)
      }
    }
    for (const removedNode of Array.from(mutationRecord.removedNodes)) {
      if (removedNode.nodeType === Node.ELEMENT_NODE) {
        addedAndRemovedElements.add(removedNode)
      }
    }
  }
  // Do stuff to the nodes
  for (const mutatedElement of addedAndRemovedElements) {
    subtreeDo(mutatedElement, (element) => {
      const elementElInterface = elCache.get(element)
      if (elementElInterface) {
        if (document.contains(element)) {
          elementElInterface.observers.forEach(obs => obs.start())
        } else {
          elementElInterface.observers.forEach(obs => obs.stop())
        }
      }
    })
  }

})
mutationObserver.observe(document, { subtree: true, childList: true })

// Cleans up observers which belong to lost elements
const obsCleanup = new FinalizationRegistry((orphanObservers) => {
  for (const orphanObserver of orphanObservers) orphanObserver(null)
})

// Helper function to do things to all elements in a subtree
const subtreeDo = (target, callback) => {
  if (!(target instanceof Element)) throw new TypeError(
    "target is not an instance of Element"
  )
  if (!(typeof callback === 'function')) throw new TypeError(
    "callback is not a function"
  )
  const descendents = target.getElementsByTagName('*')
  callback(target)
  for (const descendent of descendents) callback(descendent)
}

// TODO fill out the query stuff filter
// Problem is that a plain text string is a valid tag search
// Stubbing out with dummy functions for now
const isQuerySelector = () => false

// Main magic element wrapping function
// First argument is the element to create or wrap
// Subsequent arguments are children to attach
// Returns the element with all the stuff attached
export const el = (descriptor, ...children) => {
  // Create the new element or wrap an existing one
  // If its an existing element dont do anything
  let self
  // Trivial case when given an element
  // TODO: Should this be a Node instead of Element?
  if (descriptor instanceof Element) {
    self = descriptor
  // If its a selector then find the thing
  } else if (isQuerySelector(descriptor)) {
    self = document.querySelector(descriptor)
  // If its a valid html tag, then make a new html tag and add classes
  // Default to div otherwise
  } else if (typeof descriptor === 'string') {
    const firstWord = descriptor.split(' ')[0]
    const tag = validHTMLTags.includes(firstWord) ? firstWord : 'div'
    const newElement = document.createElement(tag)
    newElement.className = descriptor
    self = newElement
  } else {
    // TODO write better error message
    throw new TypeError('expects string or Element')
  }

  // Now that we know who we are
  // See if there's already a wrapper
  // Place to store el specific properties and methods
  // without polluting the Element
  let elInterface = elCache.get(self)
  if (typeof elInterface === 'undefined') {
    elInterface = {
      observers: []
    }
    obsCleanup.register(self, elInterface.observers)
    elCache.set(self, elInterface)
  }

  // For the children
  // If its a string, then just append it as a text node child
  // If its an existing element, then append it as a child
  // If its a function, execute it in the context. Append return values
  // If its an observer ???
  // TODO should handle documentFragments?
  function append (child) {
    if (typeof child === 'string') self.appendChild(document.createTextNode(child))
    else if (child instanceof Element) self.appendChild(child)
    else if (child instanceof Observer) {
      // TODO need to rebuild observers to not starting automatically
      // and be able to be given an owner
      // Also have the owner work with both manually passed in as argument
      // As well as implicitly in the this call
      elInterface.observers.push(child)
      child.context = self
      child()
    // Need this to come after cos observers are functions themselves
    // we use call(self, self) to provide this for traditional functions
    // and to provide (ctx) => {...} for arrow functions
    } else if (typeof child === 'function') {
      const result = child.call(self, self)
      // TODO wrap this in a try block (fail cleanly if nothing to append?)
      if (typeof result !== 'undefined') append(result)
    // Arrays are handled recursively
    } else if (child instanceof Array) {
      child.forEach(grandChild => append(grandChild))
    // TODO write better error message
    } else {
      throw new TypeError('expects string, function, or an Element')
    }
  }
  children.forEach(append)

  // TODO: if i'm elling everything from document all the way down, then wont this over trigger?
  // Maybe have the mutation observer defined outside of el? That way it should replace itself?
  // Does it trigger anyway for each subtree?
  // Tested. It does multi trigger even with the same mutation observer observing multiple

  return self
}
