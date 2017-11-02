import template from './index.twig';
import { patchInner } from 'melody-idom';

const attachEvent = (eventName, handler) => el => {
  el.addEventListener(eventName, handler);
  return {
    unsubscribe() {
      el.removeEventListener(eventName, handler);
    }
  }
};

class CounterElement extends HTMLElement {
  static get observedAttributes() {
    return ['count'];
  }
  constructor() {
    super();
    this.attachShadow({mode: 'open'});
    this.incrementButton = attachEvent('click', event => {
      this.count++;
    });
    this.decrementButton = attachEvent('click', event => {
      this.count--;
    });
    this._count = 0;
  }
  attributeChangedCallback(attributeName, oldValue, newValue, namespace) {
    console.log(attributeName, oldValue, newValue, namespace);
    this.update();
  }
  get count() {
    return this._count;
  }
  set count(value) {
    this._count = value;
    this.update();
  }
  connectedCallback() {
    this.update();
  }
  update() {
    patchInner(this.shadowRoot, template, this);
  }
}
customElements.define('x-counter', CounterElement);