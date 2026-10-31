# NameQueue – Namen kopieren und direkt entfernen

Eine eigenständige statische GitHub-Pages-App im reduzierten lila Design, separat von MailSnap, CodeSnap und KeyQueue.

## So funktioniert es

1. `BEISPIEL_120_NAMEN.txt` oder eine eigene UTF-8-TXT-Datei mit **einem Namen pro Zeile** auswählen.
2. Die App zeigt die Namen **in der Reihenfolge der Datei** an.
3. Rechts auf **„Kopieren“** drücken. **Nur der eigentliche Name** wird in die Zwischenablage geschrieben, keine Nummerierung und kein Zusatztext.
4. Erst wenn das Kopieren erfolgreich war, verschwindet dieser Name. Der nächste rückt hoch.
5. Nach der letzten Zeile erscheint eine Fertigmeldung; oben kann erneut eine TXT-Datei geladen werden.

**Maximal 29 Zeichen pro Eintrag**, einschließlich aller Leerzeichen. Längere Einträge und Zeilen mit Steuerzeichen werden beim Import ausgelassen. Leere Zeilen werden ignoriert. Optionale Nummerierungen wie `12. Anna Muster` oder `12) Anna Muster` werden automatisch entfernt. Doppelte Namen bleiben, weil jede Zeile ein eigener Listeneintrag ist. Die App verarbeitet bis zu 10.000 Zeilen bei maximal 2 MB Dateigröße.

Die Oberfläche wird auf Mobilgeräten nicht beim Tippen vergrößert; die Seite selbst scrollt nicht. Bei längeren Listen scrollt ausschließlich der Listenbereich. Eine vollständig browserseitige Verhinderung jeder denkbaren Zoomfunktion kann jedoch nicht auf allen Geräten garantiert werden.

## Dateien in diesem Projekt

- `index.html` – App-Struktur
- `styles.css` – responsive Oberfläche
- `app.js` – Einlesen, Validieren, Kopieren, Entfernen
- `favicon.svg`, `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` – eigenständiges Namen-/Listen-Icon
- `manifest.webmanifest` – Startbildschirm-Metadaten
- `BEISPIEL_120_NAMEN.txt` – gültige TXT-Probedatei
- `AGENT_PROMPT.txt` – Generator-Prompt für weitere Namen

## Kostenlos über GitHub Pages veröffentlichen

1. Auf https://github.com/new ein öffentliches Repository mit dem Namen `namequeue` anlegen.
2. `index.html`, `styles.css`, `app.js`, die Icons und `manifest.webmanifest` aus dieser ZIP **entpackt** hochladen. Beispiel-Datei und Prompt dürfen mit hochgeladen werden, sind aber nicht nötig.
3. Unter **Settings → Pages → Build and deployment** die Option **Deploy from a branch** auswählen. `main` und `/(root)` einstellen, dann speichern.
4. Die App erscheint unter `https://DEIN-NAME.github.io/namequeue/`.

Wichtig: Wenn du persönliche oder vertrauliche Namenslisten hast, solltest du **diese nicht** in ein öffentliches Repository hochladen. Wähle die TXT-Datei ausschließlich innerhalb der geöffneten App aus. Der Inhalt bleibt im Arbeitsspeicher des Browsers und wird von dieser App nicht an einen Server übertragen oder dauerhaft gespeichert.

### Technische Grenzen

Beim Kopieren muss der Browser Zugriff auf die Zwischenablage erlauben. Auf GitHub Pages steht dafür HTTPS zur Verfügung. Wenn das Kopieren scheitert, bleibt der betreffende Name erhalten.
