import { enqueueComponent, patchInner } from 'melody-idom';
import { createStore, applyMiddleware } from 'redux';
import { createEpicMiddleware } from 'redux-observable';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/from';
import 'rxjs/add/observable/merge';
import 'rxjs/add/operator/distinctUntilChanged';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/startWith';
import { animationFrame } from 'rxjs/scheduler/animationFrame.js';

// base class to extend, same trick as before
export class HTMLCustomElement extends HTMLElement {
    constructor(_) {
        return (_ = super(_)).init(), _;
    }
    init() {
        /* override as you like */
    }
}

const defineProperty = (element, initialState, validators) => (state, name) => {
    const value = initialState[name];
    if (value === ref) {
        state[name] = value(element, name);
    } else {
        state[name] = value;
        Object.defineProperty(element, name, {
            set(newValue) {
                const oldValue = element.props[name];
                const value = validators[name]
                    ? validators[name](newValue, oldValue, element)
                    : newValue;
                if (oldValue === value) {
                    return value;
                }
                element.props[name] = value;
                element.dispatch({
                    type: 'propertyChanged',
                    payload: {
                        name,
                        oldValue,
                        value
                    }
                });
                return value;
            },
            get() {
                return element.props[name];
            }
        });
    }
    return state;
};

export const ref = (component, name) => element => {
    component.dispatch({
        type: 'refChanged',
        payload: {
            name,
            element
        }
    });
    return {
        unsubscribe() {
            // do nothing, subscriptions handled with switchMap
        }
    };
};

const initReducer = (initialState, actions) => (
    state = initialState,
    action
) => {
    if (actions[action.type]) {
        return actions[action.type](state, action);
    } else if (action.type === 'propertyChanged') {
        return { ...state, [action.payload.name]: action.payload.value };
    }
    return state;
};

export const createElement = ({
    tagName,
    initialState = {},
    render = () => undefined,
    epic,
    actions = {},
    validators = {}
}) => {
    class MelodyElement extends HTMLCustomElement {
        init() {
            this.props = {};
            const initState = Object.keys(initialState).reduce(
                defineProperty(this, initialState, validators),
                {}
            );
            const store = epic
                ? createStore(
                      initReducer(initState, actions),
                      applyMiddleware(createEpicMiddleware(epic))
                  )
                : createStore(initReducer(initState, actions));
            this.dispatch = store.dispatch;
            this.getState = store.getState;

            Observable.from(store, animationFrame)
                // TODO: follow current shallow-equals comparison
                .distinctUntilChanged()
                // TODO: Integrate with scheduler
                .subscribe(() => this.render());
        }

        // Custom Elements API
        static get observedAttributes() {
            return Object.keys(initialState);
        }

        attributeChangedCallback(name, oldValue, value) {
            this[name] = validators[name](value, oldValue, this);
        }

        connectedCallback() {
            this.dispatch({ type: 'connected', payload: this });
            requestAnimationFrame(() => {
                this.render();
            });
        }

        detachedCallback() {
            this.dispatch({ type: 'detached', payload: this });
        }

        render() {
            const state = this.getState();
            patchInner(this, () => render(state), state);
            this.dispatch({ type: 'rendered', payload: this });
        }
    }
    if (tagName) {
        customElements.define(tagName, MelodyElement);
    }
    return MelodyElement;
};
