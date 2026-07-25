import { mount } from 'svelte';

import { localizeDocument } from '../../lib/i18n';
import App from './App.svelte';
import './style.css';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Popup mount target was not found.');
}

mount(App, { target });
localizeDocument();
