import { mount } from 'svelte';

import { localizeDocument } from '../../lib/i18n';
import App from './App.svelte';
import './style.css';
import './original-compat.css';

if (!window.location.hash) window.history.replaceState(null, '', '#/about');

const target = document.getElementById('app');
if (!target) {
  throw new Error('Options mount target was not found.');
}

mount(App, { target });
localizeDocument();
