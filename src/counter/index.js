import render from './index.twig';
import { createElement } from '../api/melody-ce';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/mapTo';
import 'rxjs/add/operator/do';
import 'rxjs/add/operator/ignoreElements';
import { combineEpics } from 'redux-observable';

export default createElement({
    tagName: 'x-counter',
    render,
    props: ['count'],
    initialState: {
        count: 0,
        modified: false
    },
    refs: component => ({
        incrementButton: el =>
            Observable.fromEvent(el, 'click').mapTo({ type: 'INCREMENT' }),
        decrementButton: {
            click: { type: 'DECREMENT' }
        }
    }),
    epic: combineEpics(
        actions =>
            actions
                .ofType('INCREMENT')
                .do(_ => console.log('Counter incremented'))
                .ignoreElements(),
        actions =>
            actions
                .ofType('REF_CHANGED')
                .do(_ => console.log('refChanged ', _))
                .ignoreElements()
    ),
    reducer(state, action) {
        switch (action.type) {
            case 'PROPERTY_CHANGED':
                const { name, value, oldValue } = action.payload;
                if (name === 'count' && !state.modified) {
                    return { count: +value };
                }
                return state;
            case 'INCREMENT':
                return { count: state.count + 1, modified: true };
            case 'DECREMENT':
                return { count: state.count - 1, modified: true };
        }
        return state;
    }
});
