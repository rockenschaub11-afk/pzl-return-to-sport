# PZL Return-to-Sport

Browser-App des **Physio Zentrum Linz** für Return-to-Sport-Testungen nach Kreuzband-Verletzung (VKB).
Sie ist eine **Dokumentations- und Rechenhilfe – sie ersetzt keine ärztliche Freigabe.**

- Daten bleiben später nur im Browser des jeweiligen Laptops (pseudonym, nur Kürzel). Kein Server, keine Cloud.
- Dieses Repository enthält nur den Programmcode, nie Pat.-Daten.
- Fachliche Grundlage: [`docs/ENTSCHEIDUNGEN.md`](docs/ENTSCHEIDUNGEN.md), Bauplan: [`docs/ETAPPENPLAN.md`](docs/ETAPPENPLAN.md).

Aktueller Stand: **Etappe 3 – Testkatalog & Rechenkern** (Schwellen, Quellen und Protokolle in `config/`, Rechenregeln mit automatischen Tests, Übersicht unter Einstellungen/Info).

## App am eigenen Laptop starten

Einmalig vorbereiten:

1. **Node.js** installieren (kostenlos, Version „LTS“): <https://nodejs.org>
2. Den Ordner `pzl-return-to-sport` im Terminal öffnen
   (Windows: im Explorer in den Ordner gehen, in die Adresszeile `cmd` tippen, Enter).
3. Einmal eingeben: `npm install` – lädt die benötigten Bausteine (dauert ca. 1 Minute).

Jedes Mal zum Starten:

1. Im Terminal im Ordner eingeben: `npm run dev`
2. Im Browser öffnen: <http://localhost:5173>
3. Beenden: im Terminal `Strg + C` drücken.

## Für Entwickler:innen

| Befehl | Wozu |
|---|---|
| `npm run dev` | Entwicklungsserver auf Port 5173 |
| `npm test` | Automatische Tests (Vitest) |
| `npm run build` | Fertige Web-App in `dist/` erzeugen |
| `npm run preview` | Den Build lokal ansehen |

Für GitHub Pages (Etappe 11) wird beim Build der Unterordner gesetzt, z. B.
`BASE_PATH=/pzl-return-to-sport/ npm run build`.
