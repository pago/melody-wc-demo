import { enqueueComponent, patchInner } from 'melody-idom';
import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';
import 'rxjs/add/operator/distinctUntilChanged';

// base class to extend, same trick as before
export class HTMLCustomElement extends HTMLElement {
    constructor(_) { return (_ = super(_)).init(), _; }
    init() { /* override as you like */ }
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

            props.forEach(prop => {
                Object.defineProperty(this, prop, {
                    set(value) {
                        const oldValue = this.props[name];
                        if (oldValue === value) {
                            return value;
                        }
                        this.props[name] = value;
                        this.dispatch({
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
                        return this.props[name];
                    }
                });
            });
            this.props = props.reduce(
                (props, prop) => {
                    props[prop] = this.getAttribute(prop);
                    this.dispatch({
                        // TODO: Should this really use the same action?
                        type: 'PROPERTY_CHANGED',
                        payload: {
                            name: prop,
                            oldValue: undefined,
                            value: props[prop]
                        },
                        meta: {
                            source: 'attribute'
                        }
                    });
                    return props;
                },
                {}
            );

            Observable.from(store)
                // TODO: follow current shallow-equals comparison
                .distinctUntilChanged()
                // TODO: Integrate with scheduler
                .subscribe(() => this.render());

            // TODO: Implement full feature
            this.refs = refs(this);
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
                }
            });
        }

        connectedCallback() {
            this.dispatch({
                type: 'CONNECTED'
            });
            this.render();
        }

        detachedCallback() {
            this.dispatch({
                type: 'DETACHED'
            });
        }

        // Melody Component API
        get el() {
            return this;
        }

        apply(props) {
            Object.keys(props).forEach(name => {
                this[name] = props[name];
            });
        }

        notify() {
            this.dispatch({
                type: 'UPDATED'
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