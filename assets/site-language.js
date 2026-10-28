(() => {
  const dictionaries = JSON.parse(document.getElementById('language-data').textContent);
  const root = document.documentElement;
  const selector = document.getElementById('language-select');
  const themeButton = document.getElementById('theme-toggle');
  const systemTheme = matchMedia('(prefers-color-scheme: light)');
  let language = 'tr';
  const validLanguage = value => Object.prototype.hasOwnProperty.call(dictionaries, value);
  const t = key => dictionaries[language][key] || dictionaries.tr[key] || key;

  function themeLabel() {
    const label = t(root.dataset.theme === 'light' ? 'themeDark' : 'themeLight');
    themeButton.setAttribute('aria-label', label);
    themeButton.title = label;
  }

  function setLanguage(value, save = false) {
    language = validLanguage(value) ? value : 'tr';
    root.lang = language;
    selector.value = language;
    document.querySelectorAll('[data-i18n]').forEach(element => {
      element.textContent = t(element.getAttribute('data-i18n'));
    });
    ['aria', 'alt'].forEach(attribute => {
      document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
        element.setAttribute(attribute === 'aria' ? 'aria-label' : attribute,
          t(element.getAttribute(`data-i18n-${attribute}`)));
      });
    });
    document.querySelector('meta[name="description"]').content = t('description');
    themeLabel();
    if (save) {
      try { localStorage.setItem('miracsoft-language', language); } catch (_) {}
      try {
        const url = new URL(location.href);
        url.searchParams.set('lang', language);
        history.replaceState(null, '', url);
      } catch (_) {}
    }
  }

  let preferredLanguage = 'tr';
  try {
    const queryLanguage = new URL(location.href).searchParams.get('lang');
    const savedLanguage = localStorage.getItem('miracsoft-language');
    preferredLanguage = validLanguage(queryLanguage) ? queryLanguage :
      validLanguage(savedLanguage) ? savedLanguage : 'tr';
  } catch (_) {}
  setLanguage(preferredLanguage);
  selector.addEventListener('change', () => setLanguage(selector.value, true));
  window.miracsoftI18n = { t, setLanguage };

  function setTheme(value) {
    root.dataset.theme = value;
    document.querySelector('meta[name="theme-color"]').content =
      value === 'light' ? '#eaece8' : '#161b19';
    themeLabel();
  }
  setTheme(root.dataset.theme || 'dark');
  themeButton.addEventListener('click', () => {
    const value = root.dataset.theme === 'dark' ? 'light' : 'dark';
    setTheme(value);
    try { localStorage.setItem('miracsoft-theme', value); } catch (_) {}
  });
  systemTheme.addEventListener('change', event => {
    try {
      if (!localStorage.getItem('miracsoft-theme')) setTheme(event.matches ? 'light' : 'dark');
    } catch (_) {}
  });

  const downloadButton = document.getElementById('dna-source-download');
  const downloadLabel = downloadButton.querySelector('[data-i18n]');
  function downloadState(key) {
    downloadLabel.setAttribute('data-i18n', key);
    downloadLabel.textContent = t(key);
  }
  downloadButton.addEventListener('click', async event => {
    event.preventDefault();
    if (downloadButton.dataset.busy) return;
    downloadButton.dataset.busy = '1';
    downloadButton.setAttribute('aria-busy', 'true');
    let failed = false;
    downloadState('downloading');
    try {
      const buffers = [];
      for (let i = 0; i < 9; i++) {
        const path = `downloads/dna-source/part-${String(i).padStart(2, '0')}.bin`;
        const response = await fetch(path);
        if (!response.ok) throw new Error('download');
        buffers.push(await response.arrayBuffer());
      }
      const url = URL.createObjectURL(new Blob(buffers, { type: 'application/zip' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'dna_analyse-main.zip';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (_) {
      failed = true;
    } finally {
      delete downloadButton.dataset.busy;
      downloadButton.removeAttribute('aria-busy');
      downloadState(failed ? 'downloadFailed' : 'download');
    }
  });
  document.querySelectorAll('[data-ipa-parts]').forEach(button => {
    button.addEventListener('click', async event => {
      event.preventDefault();
      if (button.dataset.busy) return;
      button.dataset.busy = '1';
      button.setAttribute('aria-busy', 'true');
      const label = button.querySelector('[data-i18n]');
      const update = key => { label.dataset.i18n = key; label.textContent = t(key); };
      update('downloading');
      let failed = false;
      try {
        const buffers = [];
        for (let i = 0; i < Number(button.dataset.ipaParts); i++) {
          const response = await fetch(`${button.dataset.ipaBase}/part-${String(i).padStart(2, '0')}.bin`);
          if (!response.ok) throw new Error('download');
          buffers.push(await response.arrayBuffer());
        }
        const objectUrl = URL.createObjectURL(new Blob(buffers, {type:'application/octet-stream'}));
        const link = document.createElement('a');
        link.href = objectUrl;
        link.download = button.dataset.ipaName;
        document.body.appendChild(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      } catch (_) { failed = true; if (button.dataset.ipaFallback) location.assign(button.dataset.ipaFallback); }
      finally {
        delete button.dataset.busy;
        button.removeAttribute('aria-busy');
        update(failed ? 'downloadFailed' : 'downloadIpa');
      }
    });
  });

})();
