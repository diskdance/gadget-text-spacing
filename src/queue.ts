type DomMutationFunc = (element: Element) => void;

const pendingActions = new WeakMap<Element, DomMutationFunc[]>();
const observer = new IntersectionObserver(onIntersection);

function onIntersection(entries: IntersectionObserverEntry[]): void {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const element = entry.target;
      observer.unobserve(element);

      const callbacks = pendingActions.get(element);
      if (callbacks !== undefined) {
        while (true) {
          const callback = callbacks.shift(); // FIFO
          if (callback === undefined) {
            break;
          }
          callback(element);
        }
      }
    }
  });
}

function queueDomMutation(element: Element, callback: DomMutationFunc): void {
  if (!pendingActions.has(element)) {
    pendingActions.set(element, []);
  }

  pendingActions.get(element)?.push(callback);
  observer.observe(element);
}

export default queueDomMutation;
