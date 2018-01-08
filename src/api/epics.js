import { Subject } from 'rxjs/Subject';
import 'rxjs/add/operator/map';
import { ActionsObservable, EPIC_END } from 'redux-observable';

const defaultOptions = {};

export function createEpicMiddleware(rootEpic, options = defaultOptions) {
  if (typeof rootEpic !== 'function') {
    throw new TypeError('You must provide a root Epic to createEpicMiddleware');
  }

  // even though we used default param, we need to merge the defaults
  // inside the options object as well in case they declare only some
  options = { ...defaultOptions, ...options };
  const input$ = new Subject();
  const action$ = new ActionsObservable(input$);
  const epic$ = new Subject();
  let store;

  const epicMiddleware = _store => {
    store = _store;

    return next => {
        const output$ = ('dependencies' in options)
            ? rootEpic(action$, store, options.dependencies)
            : rootEpic(action$, store);

        if (!output$) {
            throw new TypeError(`Your root Epic "${epic.name || '<anonymous>'}" does not return a stream. Double check you\'re not missing a return statement!`);
        }

        output$.subscribe(action => {
          try {
            store.dispatch(action);
          } catch (err) {
            console.error(err);
          }
        });

        return action => {
            const result = next(action);
            input$.next(action);
            return result;
        };
    };
  };
  return epicMiddleware;
}
