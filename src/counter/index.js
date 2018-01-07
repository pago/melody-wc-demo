import render from './index.twig';
import { createElement } from '../api/melody-ce';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/fromEvent';
import 'rxjs/add/operator/mapTo';

export default createElement({
  tagName: 'x-counter',
  render,
  props: ['count'],
  initialState: {
    count: 0
  },
  refs: component => ({
    incrementButton: el => Observable.fromEvent(el, 'click').mapTo({ type: 'INCREMENT' }).subscribe(component.dispatch),
    decrementButton: el => Observable.fromEvent(el, 'click').mapTo({ type: 'DECREMENT' }).subscribe(component.dispatch)
  }),
  reducer(state, action) {
    switch (action.type) {
      case 'PROPERTY_CHANGED':
        const { name, value, oldValue } = action.payload;
        if (name === 'count' && value === 0) {
          return { count: value };
        }
        return state;
      case 'INCREMENT':
        return { count: state.count + 1 };
      case 'DECREMENT':
        return { count: state.count - 1 };
    }
    return state;
  }
});