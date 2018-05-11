import render from './index.twig';
import { createElement } from '../api/melody-ce';
import { ofType } from '../api/epics';
import '../counter/index.js';

import { map } from 'rxjs/operators';

createElement({
    tagName: 'x-home',
    render,
    initialState: {
        message: 'Hello Melody'
    },
    effects: (actions, component) =>
        actions.pipe(
            ofType('connected'),
            map(action => {
                return {
                    type: 'propertyChanged',
                    payload: {
                        name: 'message',
                        value: action.payload.getAttribute('message'),
                        oldValue: component.getState().message
                    }
                };
            })
        )
});
