import render from './index.twig';
import { createElement, ref } from '../api/melody-ce';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/pluck';
import 'rxjs/add/operator/switchMap';
import 'rxjs/add/operator/ignoreElements';
import { combineEpics } from 'redux-observable';

const eventHandler = (refName, eventName, handler) => actions =>
    actions
        .ofType('refChanged')
        .filter(action => action.payload.name === refName)
        .pluck('payload', 'element')
        .switchMap(element =>
            Observable.fromEvent(element, eventName).map(handler)
        );

const mapEventToAction = (refName, eventName, actionName) =>
    eventHandler(refName, eventName, () => ({ type: actionName }));

const effect = (actionType, handler) => actions =>
    actions
        .ofType(actionType)
        .do(handler)
        .ignoreElements();

export default createElement({
    // The tag name is the name of the custom HTML element
    tagName: 'x-counter',
    // render is just a template
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
            return +value; // ensure number
        }
    },
    // Side effects are handled through epics
    epic: combineEpics(
        eventHandler('incrementButton', 'click', event => ({
            type: 'increment'
        })),
        mapEventToAction('decrementButton', 'click', 'decrement'),
        effect('increment', _ => console.log('Counter incremented')),
        effect('refChanged', _ => console.log('refChanged', _))
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
