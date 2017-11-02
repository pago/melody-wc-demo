import template from './index.twig';

import '../counter/index.js';
import { patchInner } from 'melody-idom';

class HomeElement extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({mode: 'open'});
        this.message = 'Hello Melody';
    }
    connectedCallback() {
        patchInner(this.shadowRoot, template, this);
    }
}
window.customElements.define('x-home', HomeElement);