import render from './index.twig';
import { createElement } from '../api/melody-ce';
import '../counter/index.js';

createElement({
    tagName: 'x-home',
    render,
    initialState: {
        message: 'Hello Melody'
    }
});