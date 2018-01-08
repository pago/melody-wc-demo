import { enqueueComponent, patchInner } from 'melody-idom';
import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from './epics';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';

// base class to extend, same trick as before
export class HTMLCustomElement extends HTMLElement {
    constructor(_) { return (_ = super(_)).init(), _; }
    init() { /* override as you like */ }
}

const defineProperty = element => name => {
    Object.defineProperty(element, name, {
        set(value) {
            const oldValue = element.props[name];
            if (oldValue === value) {
                return value;
            }
            element.props[name] = value;
            element.dispatch({
                type: 'PROPERTY_CHANGED',
                payload: {
                    name,
                    oldValue,
                    value
                },
                meta: {
                    source: 'property'
                }
            });
            return value;
        },
        get() {
            return element.props[name];
        }
    });
};

const createEventSubscriber = (def, target) => {
    return el => {
        const subscribers = Object.keys(def).map(
            eventName => {
                const handler = def[eventName];
                return Observable.fromEvent(el, eventName).map(
                    typeof handler === 'function'
                        ? handler
                        : () => handler
                );
            }
        );
        return Observable.merge(...subscribers).subscribe(action => target.dispatch(action));
    };
};

const mapRefs = (refs, element) => {
    const r = typeof refs === 'object' ? refs : refs(element);
    return Object.keys(r).reduce((refs, refName) => {
        const val = r[refName];
        refs[refName] = typeof val === 'function'
            ? el => val(el).subscribe(action => element.dispatch(action))
            : createEventSubscriber(val, element);
        return refs;
    }, {});
}

const defaultReducer = (state, action) => {
    if (action.type === 'PROPERTY_CHANGED') {
        return { ...state, [action.payload.name]: action.payload.value };
    }
    return state;
};

const initReducer = (initialState, reducer) => (state = initialState, action) => reducer(state, action);

export const createElement = ({
    tagName,
    props = [],
    initialState = {},
    render,
    reducer = defaultReducer,
    refs = () => ({}),
    epic
}) => {
    class MelodyElement extends HTMLCustomElement {
        // Custom Element API
        init() {
            const store = epic ? createStore(
                initReducer(initialState, reducer),
                applyMiddleware(createEpicMiddleware(epic))
            ) : createStore(initReducer(initialState, reducer));
            this.dispatch = store.dispatch;
            this.getState = store.getState;
            this.props = {};

            props.forEach(defineProperty(this));

            Observable.from(store)
                // TODO: follow current shallow-equals comparison
                .distinctUntilChanged()
                // TODO: Integrate with scheduler
                .subscribe(() => requestAnimationFrame(() => this.render()));

            this.refs = mapRefs(refs, this);
        }

        // Custom Elements API
        static get observedAttributes() {
            return props;
        }

        attributeChangedCallback(name, oldValue, value) {
            if (oldValue === value) {
                return;
            }
            this.dispatch({
                type: 'PROPERTY_CHANGED',
                payload: {
                    name,
                    oldValue,
                    value
                },
                meta: {
                    source: 'attribute'
                }
            });
        }

        connectedCallback() {
            props.forEach(
                prop => {
                    if (this.hasAttribute(prop)) {
                        this[prop] = this.getAttribute(prop);
                    }
                }
            );
            requestAnimationFrame(() => {
                this.render();
                this.dispatch({
                    type: 'CONNECTED'
                });
            });
        }

        detachedCallback() {
            this.dispatch({
                type: 'DETACHED'
            });
        }

        render() {
            const state = {...this.getState(), ...this.refs};
            patchInner(this, () => render(state), state);
        }
    }
    customElements.define(tagName, MelodyElement);
    return MelodyElement;
};