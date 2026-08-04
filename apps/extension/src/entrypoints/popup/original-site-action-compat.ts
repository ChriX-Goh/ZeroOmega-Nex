const COMPAT_MARK = 'originalSiteActionCompat';

function icon(kind: 'plus' | 'filter'): HTMLSpanElement {
  const wrapper = document.createElement('span');
  wrapper.className = 'original-site-action-icon';
  wrapper.dataset.originalPopupIcon = kind;
  wrapper.dataset.originalPopupIconPosition = 'leading';
  wrapper.setAttribute('aria-hidden', 'true');
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.setAttribute('viewBox', '0 0 14 14');
  svg.setAttribute('focusable', 'false');
  const path = document.createElementNS(namespace, 'path');
  path.setAttribute('d', kind === 'plus' ? 'M7 2v10M2 7h10' : 'M1.2 2h11.6L8.4 7v4.2l-2.8 1.4V7Z');
  svg.append(path);
  wrapper.append(svg);
  return wrapper;
}

function domainFrom(source: string): string {
  return source.match(/(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,63}/iu)?.[0] ?? source;
}

function visibleAddConditionLabel(source: string): string {
  if (/^Add condition for /u.test(source)) return 'Add condition';
  if (/^为 .+ 添加条件$/u.test(source)) return '添加条件';
  if (/^為 .+ 加入條件$/u.test(source)) return '加入條件';
  return source;
}

function createTemporaryMenu(
  section: HTMLElement,
  select: HTMLSelectElement,
  manage: HTMLButtonElement | null,
): HTMLUListElement {
  const menu = document.createElement('ul');
  menu.className = 'original-temporary-rule-menu';
  menu.dataset.popupTemporaryRuleMenu = '';
  menu.setAttribute('role', 'menu');
  menu.hidden = true;

  for (const option of [...select.options]) {
    const item = document.createElement('li');
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('role', 'menuitem');
    button.textContent = option.textContent ?? option.label;
    button.dataset.popupTemporaryRuleOption = option.value;
    button.classList.toggle('active', option.value === select.value);
    button.addEventListener('click', () => {
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    });
    item.append(button);
    menu.append(item);
  }

  if (manage) {
    const divider = document.createElement('li');
    divider.className = 'original-temporary-rule-menu-divider';
    divider.setAttribute('role', 'separator');
    const item = document.createElement('li');
    manage.classList.add('original-temporary-rule-manage');
    manage.setAttribute('role', 'menuitem');
    item.append(manage);
    menu.append(divider, item);
  }

  section.append(menu);
  return menu;
}

function applyOriginalSiteActionCompatibility(): void {
  const addSection = document.querySelector<HTMLElement>('.current-site-action');
  const addButton = addSection?.querySelector<HTMLButtonElement>('[data-popup-add-current-site]');
  const temporarySection = document.querySelector<HTMLElement>('[data-popup-temporary-rule]');
  const label = temporarySection?.querySelector<HTMLLabelElement>('label');
  const select = temporarySection?.querySelector<HTMLSelectElement>('select');

  if (!addSection || !addButton || !temporarySection || !label || !select) return;
  if (
    temporarySection.dataset[COMPAT_MARK] === 'true' &&
    temporarySection.querySelector('[data-popup-temporary-rule-toggle]')
  )
    return;

  const sourceLabel = addButton.textContent?.replace(/\s+/gu, ' ').trim() ?? '';
  const visibleLabel = visibleAddConditionLabel(sourceLabel);
  addButton.dataset.originalSourceLabel = sourceLabel;
  addButton.dataset.visibleLabel = visibleLabel;
  addButton.setAttribute('aria-label', visibleLabel);
  addButton.classList.add('original-site-action-row');
  addButton.replaceChildren(icon('plus'));
  const source = document.createElement('span');
  source.className = 'original-site-action-source-label';
  source.setAttribute('aria-hidden', 'true');
  source.textContent = sourceLabel;
  addButton.append(source);

  const domain = domainFrom(select.getAttribute('aria-label') ?? label.textContent ?? sourceLabel);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'original-temporary-rule-toggle';
  toggle.dataset.popupTemporaryRuleToggle = '';
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', domain);
  toggle.append(icon('filter'));
  const domainLabel = document.createElement('span');
  domainLabel.className = 'original-temporary-rule-domain';
  domainLabel.textContent = domain;
  const caret = document.createElement('span');
  caret.className = 'om-caret';
  caret.setAttribute('aria-hidden', 'true');
  toggle.append(domainLabel, caret);

  select.classList.add('original-temporary-rule-compat-select');
  select.dataset.popupTemporaryRuleCompatSelect = '';
  label.replaceWith(toggle, select);

  const manage = temporarySection.querySelector<HTMLButtonElement>('[data-popup-manage-temporary-rules]');
  const menu = createTemporaryMenu(temporarySection, select, manage);
  toggle.addEventListener('click', () => {
    menu.hidden = !menu.hidden;
    toggle.setAttribute('aria-expanded', String(!menu.hidden));
    temporarySection.classList.toggle('open', !menu.hidden);
  });

  if (addSection.nextElementSibling !== temporarySection) {
    temporarySection.before(addSection);
  }
  temporarySection.dataset[COMPAT_MARK] = 'true';
}

export function installOriginalSiteActionCompatibility(): void {
  let scheduled = false;
  const apply = () => {
    if (scheduled) return;
    scheduled = true;
    queueMicrotask(() => {
      scheduled = false;
      applyOriginalSiteActionCompatibility();
    });
  };
  const observer = new MutationObserver(apply);
  observer.observe(document.body, { childList: true, subtree: true });
  apply();
}
