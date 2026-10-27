# PZL Return-to-Sport – Etappenplan

Grundlage: `docs/ENTSCHEIDUNGEN.md`. Jede Etappe endet mit einer **Abnahme durch Philipp** (kurz durchklicken). Erst danach beginnt die nächste.

## Technik (Vorschlag, mit Begründung)

| Baustein | Wahl | Warum |
|---|---|---|
| Grundgerüst | Vite + React + TypeScript | Weit verbreitet, gut testbar, erzeugt eine reine Web-App ohne Server – passt zu GitHub Pages |
| Speicher | IndexedDB (über Dexie) | Speichert die Daten nur im Browser des Laptops, funktioniert offline |
| Offline/Installierbar | PWA (vite-plugin-pwa) | „Als App installieren“ in Chrome/Edge/Safari, automatische Updates |
| Berichte | Druckansicht → „Als PDF speichern“ | Funktioniert in allen Browsern ohne Zusatzdienst; Name wird nur in die Druckansicht eingesetzt, nie gespeichert |
| Diagramme | eigene SVG-Grafiken | Keine fremde Lizenz, sieht in Druck und Bildschirm gleich aus |
| Verschlüsselung | Web Crypto (AES-GCM, Passwort über PBKDF2) | Im Browser eingebaut, kein externer Dienst |
| Tests | Vitest | Rechenlogik (LSI, Ampel, Phasen, Scores) wird automatisch geprüft |
| Schwellen/Tests | JSON-Dateien in `config/` mit Quelle je Schwelle | Änderungen nachvollziehbar, beim Start geprüft |

Alles kostenlos. Keine Cloud, keine Pat.-Daten außerhalb des Laptops.

## Etappen

| # | Etappe | Ergebnis zum Abnehmen |
|---|---|---|
| 1 | **Grundgerüst** | App startet lokal, Praxis-Logo, Navigation, Hinweis „Rechenhilfe“ |
| 2 | **Pat.-Liste & Stammdaten** | Kürzel anlegen/suchen, Pflicht- und optionale Felder, Dubletten-Erkennung |
| 2b | **Startseite & Design** (Nachtrag 23.10.2026) | Design Richtung B „Sportwissenschaft-Dashboard“; Startseite als dunkler Live-Monitor mit Logo; Tegner-Auswahlliste; LET-Erklärung |
| 3 | **Testkatalog & Rechenkern** | `config/`-Dateien mit allen Tests, Schwellen, Quellen, Protokollen; LSI, Bestwert, CoV-Warnung, kg↔N, Ns/kg, Frauen-Regel – mit automatischen Tests |
| 4 | **Endtestung erfassen** | Eingabemaske je Block (Klinik, HHD, Platten, Hops, Kraftausdauer, PROM-Score), Protokoll + „Warum?“, Winkel/Boxhöhe ändern, Zwischenspeichern, Ampel live |
| 5 | **Meloq-Metriken nach ODS** | Kern-Satz fix, Zusatzmetriken nach O/D/S wählbar, persönlicher Standard |
| 6 | **RTS-Vorschlag & Entscheidung** | „Kriterien erfüllt / nicht erfüllt“, 9-Monats-Regel, ACL-RSI-Warnung, „Was fehlt noch?“, Bestätigen/Überstimmen mit Begründung, „klinisch anders beurteilt“ |
| 7 | **Phasen & Verlauf** | Phase aus OP-Datum + Übersteuern, Testsets je Phase, Read-Spalten, Verlaufsdiagramme, Normdaten als graue Info |
| 8 | **Fragebogen-Rechner** | Score-Rechner ACL-RSI, IKDC, KOOS, Tampa (ohne Fragebogentexte) |
| 9 | **Berichte** | Arztbericht und Pat./Trainer-Bericht als PDF, Name nur temporär |
| 9b | **Redesign** (Nachtrag 26.10.2026) | Designsystem (`docs/DESIGNKONZEPT.md` 10): Graphit, dunkel + Umschalter hell, Seitenleiste, Bausteine, Korridor-Diagramme, Kürzel-Seite als Dashboard, Testkarten in drei Lautstärken, Listen als Tabellen; Berichte/Druck weiß |
| 10 | **Export, Import, Sicherung** | Datei je Kürzel und Gesamtsicherung mit Passwort, Wochen-Erinnerung |
| 11 | **Veröffentlichen** | PWA/offline, GitHub Pages unter Philipps Account, Installationsanleitung Windows/Mac |
| 12 | **Pilot** | Philipp testet 2–3 echte Pat., Korrekturrunde, Kurzanleitung in der App, dann Kolleg:innen |

**Etappe 12, erledigt (27.10.2026):** Knie-Flexion 60°/30° als optionale Tests, Gurt 10° unter Zielwinkel, H/Q-Quotient als Info, Hinweise je Graft und Begleit-OP (ENTSCHEIDUNGEN 5.1).

**Später:** CSV/Excel-Import (Meloq, VALD), evtl. VALD-API, digitale Fragebögen nach Lizenz, exzentrische Hamstring-Kraft (NordBord).

## Offene Kleinigkeiten (blockieren nichts)

- [ ] Meloq: RSI-Definition beim Drop Jump („i“) – bis dahin RSI-Ampel nur Info
- [ ] Meloq: Einbeinstand – Schwankweg in mm vorhanden?
- [ ] Lizenzanfragen verschicken (`docs/LIZENZANFRAGEN.md`)
- [x] GitHub-Benutzername: rockenschaub11-afk (26.10.2026)
