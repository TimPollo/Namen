'use strict';

// NameQueue: Alle Einträge bleiben im lokalen Arbeitsspeicher des Browsers.
// Kein Backend, keine Datenübertragung und keine dauerhafte Speicherung.
const $ = id => document.getElementById(id);
const ui = {
  fileInput: $('fileInput'), fileName: $('fileName'), importNote: $('importNote'),
  nameList: $('nameList'), emptyState: $('emptyState'), listViewport: $('listViewport'),
  remainingCount: $('remainingCount'), status: $('status'), clearBtn: $('clearBtn'), toast: $('toast')
};
const MAX_CHARS = 29;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_LINES = 10000;
let queue = [];
let totalLoaded = 0;
let copiedCount = 0;
let activeCopy = false;
let importVersion = 0;
let toastTimer = null;

function setStatus(text, type = '') {
  ui.status.textContent = text;
  ui.status.className = `footer-state ${type}`.trim();
}
function showToast(text) {
  clearTimeout(toastTimer);
  ui.toast.textContent = text;
  ui.toast.hidden = false;
  toastTimer = setTimeout(() => { ui.toast.hidden = true; }, 1300);
}
function parseNames(text) {
  const lines = String(text).replace(/^\uFEFF/, '').split(/\r\n|\n|\r/);
  if (lines.length > MAX_LINES) throw new Error(`Maximal ${MAX_LINES} Zeilen erlaubt.`);
  const names = [];
  let invalid = 0;
  for (const original of lines) {
    let name = original.trim();
    if (!name) continue;
    // Optional vorangestellte Nummerierung entfernen, nie mitkopieren.
    name = name.replace(/^\d{1,5}[.)\-:]\s+/, '').trim().normalize('NFC');
    if (!name || Array.from(name).length > MAX_CHARS || /[\p{Cc}\p{Cf}]/u.test(name)) {
      invalid++;
      continue;
    }
    // Gleiche Namen bleiben bewusst erhalten: jede Zeile ist ein eigener Eintrag.
    names.push(name);
  }
  return { names, invalid };
}
function setEmpty(message, detail) {
  ui.emptyState.replaceChildren();
  const symbol = document.createElement('div');
  symbol.className = 'empty-glyph';
  symbol.textContent = totalLoaded ? '✓' : '◌';
  const title = document.createElement('strong');
  title.textContent = message;
  const subtitle = document.createElement('span');
  subtitle.textContent = detail;
  ui.emptyState.append(symbol, title, subtitle);
  ui.emptyState.hidden = false;
}
function render() {
  ui.nameList.replaceChildren();
  ui.remainingCount.textContent = String(queue.length);
  ui.clearBtn.disabled = queue.length === 0;
  if (!queue.length) {
    ui.nameList.hidden = true;
    setEmpty(totalLoaded ? 'Alle Namen kopiert' : 'Noch keine Namen',
             totalLoaded ? 'Wähle oben eine neue TXT-Datei aus.' : 'Wähle oben eine TXT-Datei aus, um zu starten.');
    return;
  }
  ui.emptyState.hidden = true;
  ui.nameList.hidden = false;
  const fragment = document.createDocumentFragment();
  queue.forEach((name, index) => {
    const row = document.createElement('li');
    row.className = 'name-row';
    const value = document.createElement('span');
    value.className = 'name-value';
    value.textContent = name; // keine Nummerierung im Namen oder beim Kopieren
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'copy-button';
    button.textContent = 'Kopieren';
    button.setAttribute('aria-label', `Namen ${name} kopieren`);
    button.addEventListener('click', () => copyName(index));
    row.append(value, button);
    fragment.appendChild(row);
  });
  ui.nameList.appendChild(fragment);
}
async function copyText(text) {
  if (navigator.clipboard?.writeText) {
    try { await navigator.clipboard.writeText(text); return; }
    catch (_) { /* Alternativer Kopiervorgang unten */ }
  }
  const area = document.createElement('textarea');
  area.value = text;
  area.readOnly = true;
  area.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;';
  document.body.appendChild(area);
  try {
    area.focus({ preventScroll: true });
    area.select();
    area.setSelectionRange(0, area.value.length);
    if (!document.execCommand('copy')) throw new Error('Kopieren nicht möglich');
  } finally { area.remove(); }
}
async function copyName(index) {
  if (activeCopy || index < 0 || index >= queue.length) return;
  const name = queue[index];
  const version = importVersion;
  activeCopy = true;
  try {
    await copyText(name);
    // Inzwischen neu geladene Dateien dürfen nicht verändert werden.
    if (version !== importVersion || queue[index] !== name) return;
    queue.splice(index, 1);
    copiedCount++;
    render();
    ui.listViewport.scrollTop = 0;
    setStatus(queue.length ? `${copiedCount} kopiert · ${queue.length} übrig` : `Fertig! ${copiedCount} Namen kopiert.`, 'success');
    showToast('Name kopiert ✓');
  } catch (_) {
    setStatus('Kopieren fehlgeschlagen – der Name bleibt in der Liste.', 'error');
    showToast('Bitte erneut versuchen');
  } finally { activeCopy = false; }
}
async function importFile(file) {
  if (!file) return;
  if (!/\.txt$/i.test(file.name) && file.type !== 'text/plain') {
    setStatus('Bitte eine TXT-Datei auswählen.', 'error');
    return;
  }
  if (file.size > MAX_FILE_BYTES) {
    setStatus('Die Datei ist zu groß (maximal 2 MB).', 'error');
    return;
  }
  const version = ++importVersion;
  setStatus('Datei wird eingelesen …');
  try {
    const result = parseNames(await file.text());
    if (version !== importVersion) return;
    queue = result.names;
    totalLoaded = queue.length;
    copiedCount = 0;
    ui.fileName.textContent = file.name;
    ui.fileName.title = file.name;
    ui.importNote.textContent = result.invalid
      ? `${result.invalid} Zeile(n) übersprungen (mehr als 29 Zeichen oder ungültig).`
      : 'Maximal 29 Zeichen pro Name · Verarbeitung nur auf deinem Gerät';
    render();
    ui.listViewport.scrollTop = 0;
    setStatus(queue.length
      ? `${queue.length} Namen geladen${result.invalid ? ` · ${result.invalid} übersprungen` : ''}.`
      : 'Keine gültigen Namen in der Datei gefunden.', queue.length ? 'success' : 'error');
  } catch (error) {
    setStatus(error.message || 'Datei konnte nicht gelesen werden.', 'error');
  }
}
ui.fileInput.addEventListener('change', event => {
  const file = event.target.files?.[0];
  if (file) importFile(file);
  event.target.value = '';
});
ui.clearBtn.addEventListener('click', () => {
  if (activeCopy) return;
  importVersion++;
  queue = [];
  totalLoaded = 0;
  copiedCount = 0;
  ui.fileName.textContent = 'Keine Datei geladen';
  ui.fileName.title = 'Keine Datei ausgewählt';
  ui.importNote.textContent = 'Maximal 29 Zeichen pro Name · Verarbeitung nur auf deinem Gerät';
  setStatus('Liste geleert. Bereit für eine neue Datei.');
  render();
});
// Zoomgesten in der mobilen Web-App unterbinden; Scrollen innerhalb der Liste bleibt möglich.
document.addEventListener('gesturestart', e => e.preventDefault(), { passive: false });
document.addEventListener('gesturechange', e => e.preventDefault(), { passive: false });
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
render();
