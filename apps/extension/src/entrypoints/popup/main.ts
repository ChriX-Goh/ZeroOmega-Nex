import { mount } from 'svelte';

import { localizeDocument } from '../../lib/i18n';
import App from './App.svelte';
import { installOriginalSiteActionCompatibility } from './original-site-action-compat';
import './style.css';
import './original-compat.css';
import './original-site-action-compat.css';

const target = document.getElementById('app');
if (!target) {
  throw new Error('Popup mount target was not found.');
}

mount(App, { target });
installOriginalSiteActionCompatibility();
localizeDocument();
