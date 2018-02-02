import render from './index.twig';
import { createElement, ref } from '../api/melody-ce';
import { compose, events, sideEffects } from '../api/epics';

export default createElement({
    // (optional) The tag name is the name of the custom HTML element
    tagName: 'x-counter',
    // (optional) render is just a template
    render,
    // Initial state is the top-level state object,
    // all of its properties can be modified as HTML element properties
    // and will cause the following to happen:
    // 1. The validator is executed to ensure a valid value for the property
    // 2. An action of type 'propertyChanged' is dispatched (if value changed)
    // 3. The component is re-rendered (if value changed)
    initialState: {
        count: 0,
        modified: false,
        incrementButton: ref,
        decrementButton: ref
    },
    // validators are executed whenever the state property of the same name
    // is changed externally (but not internally)
    // The value it returns is compared to the previous value to identify if it changed
    // It must be a pure function.
    validators: {
        count(value, oldValue, state) {
            // don't accept outside definition under some condition
            if (state.modified) {
                return state.value;
            }
            // ensure number
            return +value;
        },
        modified(value, oldValue, state) {
            // disallow external modification for this property
            return state.modified;
        }
    },
    // Side effects are handled through epics
    effects: compose(
        events({
            'decrementButton:click': 'decrement',
            incrementButton: {
                click: event => ({ type: 'increment' })
            }
        }),
        sideEffects({
            increment() {
                console.log('Counter incremented');
            },
            refChanged(action) {
                console.log('refChanged', action);
            }
        })
    ),
    // actions are reducers - they accept state and the payload property of the action
    // no need to access the actual action since the type is specified through the action key
    // and access to "meta" or similar properties should not be done within a reducer
    // the purpose of this is to reduce the overhead and to provide a nicer and more ergonomic API
    actions: {
        increment(state) {
            return {
                ...state,
                count: state.count + 1
            };
        },
        decrement(state) {
            return {
                ...state,
                count: state.count - 1
            };
        }
    }
});
