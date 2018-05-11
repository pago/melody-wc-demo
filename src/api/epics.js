import { fromEvent } from 'rxjs/observable/fromEvent';
import { pipe } from 'rxjs/util/pipe';
import {
    tap,
    filter,
    map,
    pluck,
    switchMap,
    mergeMap,
    takeUntil,
    ignoreElements
} from 'rxjs/operators';
import { combineEpics } from 'redux-observable';

export const ofType = type => filter(action => action.type === type);
/*
export const eventToActionStream = (eventName, handler) => element =>
    map(handler)(fromEvent(element, eventName));
*/
export const eventHandler = (refName, eventName, handler) => (
    actions,
    component
) =>
    actions.pipe(
        ofType('refChanged'),
        filter(action => action.payload.name === refName),
        pluck('payload', 'element'),
        mergeMap(element =>
            fromEvent(element, eventName).pipe(
                map(handler),
                takeUntil(
                    actions.pipe(
                        ofType('refRemoved'),
                        filter(
                            action =>
                                action.payload.element === element &&
                                action.payload.name === refName
                        )
                    )
                )
            )
        )
    );

export const mapEventToAction = (refName, eventName, actionName) =>
    eventHandler(refName, eventName, () => ({ type: actionName }));

export const effect = (actionType, handler) =>
    pipe(ofType(actionType), tap(handler), ignoreElements());

export const compose = combineEpics;

export const sideEffects = desc =>
    compose(
        ...Object.keys(desc).map(actionType =>
            effect(actionType, desc[actionType])
        )
    );

const createEventHandler = (handler, refName, eventName) =>
    typeof handler === 'function'
        ? eventHandler(refName, eventName, handler)
        : typeof handler === 'string'
            ? mapEventToAction(refName, eventName, handler)
            : eventHandler(refName, eventName, () => handler);

export const events = desc =>
    compose(
        ...Object.keys(desc).reduce((epics, refName) => {
            const [realRefName, eventName] = refName.split(':');
            if (realRefName !== refName) {
                epics.push(
                    createEventHandler(desc[refName], realRefName, eventName)
                );
                return epics;
            }
            const ref = desc[refName];
            Object.keys(ref).reduce((epics, eventName) => {
                epics.push(
                    createEventHandler(ref[eventName], refName, eventName)
                );
                return epics;
            }, epics);
            return epics;
        }, [])
    );
