/* esline-env browser */
// Manually updated list of valid HTML tags
// Used to know when to create a named tag and when to create a div by default
import { isObserver, observe, shuck } from './reactor.js'

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
// Used to stop the observers when disconnected from the document
const elCache = new WeakMap()

// Setup a mutation observer
// If an element is removed from the document then turn it off
// Have to account for nodes being added to removed outside of the document
const documentObserver = new MutationObserver((mutationList, mutationObserver) => {
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
          for (const obs of elementElInterface.observers) {
            obs.start()
          }
        } else {
          for (const obs of elementElInterface.observers) {
            obs.stop()
          }
        }
      }
    })
  }

})
documentObserver.observe(document, { subtree: true, childList: true })

// Tracks when observer comment placeholders are removed
// When they are remove their partner as well and deactivate their observer
// Maps the observer start end and observer itself to each other
const observerTrios = new WeakMap()
const commentObserver = new MutationObserver((mutationList, mutationObserver) => {
  for (const mutationRecord of mutationList) {
    for (const removedNode of Array.from(mutationRecord.removedNodes)) {
      const observerTrio = observerTrios.get(removedNode)
      if (observerTrio) {
        observerTrio.start.remove()
        observerTrio.end.remove()
        observerTrio.observer.stop() // Should this be clear? possibility for reattachment?
      }
    }
  }
})


// Helper function to do things to all elements in a subtree
function subtreeDo (target, callback) {
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

// Helper function to get all nodes between 2 nodes
function getNodesBetween(startNode, endNode) {
  if (
    startNode.parentNode === null ||
    endNode.parentNode === null ||
    startNode.parentNode !== endNode.parentNode
  ) throw new RangeError('endNode could not be reached from startNode')
  let result = []
  let currentNode = startNode.nextSibling
  while(currentNode !== endNode) {
    if (currentNode === null) {
      throw new RangeError('endNode could not be reached from startNode')
    }
    result.push(currentNode)
    currentNode = currentNode.nextSibling
  }
  return result
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
      // Map of observers to a Set of elements they create
      // Should this be weakrefmap?
      observers: new Set() 
    }
    elCache.set(self, elInterface)
  }
  commentObserver.observe(self, { subtree: false, childList: true })

  // For the children
  // If its a string, then just append it as a text node child
  // If its an existing element, then append it as a child
  // If its a function, execute it in the context. Append return values
  // If its an observer ???
  // TODO should handle documentFragments?
  function append (child, insertionPoint) {
    // TODO consider span wrapping -> This will allow observers to clear themselves better?
    if (typeof child === 'string') {
      const textNode = document.createTextNode(child)
      if (insertionPoint) self.insertBefore(textNode, insertionPoint)
      else self.appendChild(textNode)
    } else if (child instanceof Element || child instanceof DocumentFragment) {
      if (insertionPoint) self.insertBefore(shuck(child), insertionPoint)
      else {
        try {
          self.appendChild(shuck(child))
        } catch (error) {
          throw error
        }
      }
    // Observers work similarly to functions
    // but with comment "bookends" on to demark their position
    // On initial commitment. Observers work like normal functions
    // On subsequent triggers. Observers first clear everything
    // between bookends
    } else if (isObserver(child)) {
      let observerStartNode, observerEndNode
      elInterface.observers.add(child)
      // Start with the opening bookend
      observerStartNode = document.createComment('observerStart')
      if (insertionPoint) self.insertBefore(observerStartNode, insertionPoint)
      else self.appendChild(observerStartNode)
      // Observe the observer to append the results
      observe(() => {
        const result = child.value
        if (typeof result !== 'undefined') {
          // If there is no end node yet then just continue to append like normal
          // This is to allow for the use of $.appendChild in the observer like 
          // you would in a normal function
          if (typeof observerEndNode === 'undefined') {
            append(result, insertionPoint)
          // Check if the bookmarks are still attached before appending
          // Clear everything in between the bookmarks
          // Then insert between them
          } else if (observerEndNode.parentNode === self) {
            const oldChildren = getNodesBetween(observerStartNode, observerEndNode)
            // Clean up the old nodes
            // Any missing nodes 
            for (const oldChild of oldChildren) {
              oldChild.remove()
              // If we remove an inner observer marker clear it up
              const oldObserverTrio = observerTrios.get(oldChild)
              if (oldObserverTrio) {
                oldObserverTrio.observer.stop()
                elInterface.observers.delete(oldObserverTrio.observer)
              }
            }
            append(result, observerEndNode)
          // Anchors no longer attached can discard the observer
          } else {
            child.stop()
            elInterface.observers.delete(child)
          }
        }
      })()
      // Kickoff the observer with a context of self
      child.setContext(self)
      child.stop()
      child.start()
      // If it is not yet in the document then stop observer from triggering further
      if (!document.contains(self)) child.stop()
      // Close with a bookend to mark the range of children owned
      observerEndNode = document.createComment('observerEnd')
      if (insertionPoint) self.insertBefore(observerEndNode, insertionPoint)
      else self.appendChild(observerEndNode)
      // Keep a mapping of the end comment to the observer
      // Lets the observer be cleaned up when the owning comment is removed
      const observerTrio = {
        start: observerStartNode,
        end: observerEndNode,
        observer: child
      }
      observerTrios.set(observerStartNode, observerTrio)
      observerTrios.set(observerEndNode, observerTrio)
      observerTrios.set(child, observerTrio)

    // Need this to come after cos observers are functions themselves
    // we use call(self, self) to provide this for traditional functions
    // and to provide (ctx) => {...} for arrow functions
    } else if (typeof child === 'function') {
      const result = child.call(self, self)
      // TODO wrap this in a try block (fail cleanly if nothing to append?)
      if (typeof result !== 'undefined') append(result, insertionPoint)
    // Arrays are handled recursively
    } else if (child instanceof Array) {
      child.forEach(grandChild => append(grandChild, insertionPoint))
    } else {
      throw new TypeError('expects string, function, an Element, or an Array of them')
    }
  }
  children.forEach((child) => append(child))

  // Return the raw DOM element
  // Magic wrapping held in a pocket dimension outside of time and space
  return self
}


// shorthand for attribute setting
// el('foo', attribute('id', 'bar'))
export function attr (attribute, value) {
  return ($) => {
    $.setAttribute(attribute, value)
  }
}

// shorthand for binding 
// el('input', attribute('type', 'text'), bind(rx, 'foo'))
export function bind (reactor, key) {
  return ($) => {
    $.oninput = () => reactor[key] = $.value
    return observe(() => $.value = reactor[key] )
  }
}

export * from './reactor.js'