# PZL Return-to-Sport – Designkonzept (Etappe 9b)

Stand: 26.10.2026, **3. Fassung mit Designsystem (Abschnitt 10) – von Philipp freigegeben am 26.10.2026.** Bei Widersprüchen gilt Abschnitt 10. Nach der Abnahme ersetzt es die Abschnitte 10a (Stil, Dunkler Modus D3, Schrift S8) in `ENTSCHEIDUNGEN.md`; die Startseite „Live-Monitor“ bleibt in ihrer Idee erhalten.
Musterseite zum Ansehen: `docs/muster.html` (im Entwicklungsserver unter `/docs/muster.html`), mit Fantasiewerten angelehnt an DEMO-1990.

Referenz: Sport-Science-Dashboard (Screenshot von Philipp, 26.10.2026) – graphitgrau, Seitenleiste, Pillen-Reiter, Kurven mit grauem Korridor, dunkles Info-Fenster.

---

## 1. Leitidee

**„Der Korridor“.** Die Verlaufskurve des betroffenen Beins läuft durch einen ruhigen grauen **Zielkorridor**; jeder Messpunkt trägt seine **Ampel** (✓ ~ ✗). Das ist dieselbe Information wie in der Erfassung, nur über die Zeit gezeigt. Alles andere bleibt ruhig.

Grundsätze:
1. **Farbe heißt genau eines:** Blau/Türkis = **Seite** (betroffen/gesund), Grün/Gelb/Rot = **Bewertung**, Graphit-Stufen = alles andere. Status („in Arbeit“) bekommt **nie** eine Ampelfarbe.
2. **Ampel nie nur Farbe** – immer mit Zeichen und/oder Wort (✓ erfüllt, ~ knapp, ✗ nicht erfüllt, ○ offen).
3. **Keine erfundenen Aussagen.** Gezeigt wird nur, was die App schon rechnet (LSI, Schwellen, Phase, Vorschlag, „Was fehlt noch?“). Keine Risiko-Scores, keine Durchschnitte, keine Prognosen.
4. **Fehlend ist sichtbar fehlend:** Lücken in Linien, „nicht gemessen“ als leerer Kreis, nie stillschweigend verbunden.
5. **Das Wichtigste zuerst:** Status der letzten Testung vor Verlauf, Verlauf vor Stammdaten.
6. **Druck bleibt weiß** (Berichte wie Etappe 9).

## 2. Farben

Kontraste geprüft (WCAG; Text ≥ 4,5 : 1, Linien/Flächen ≥ 3 : 1).

| Rolle | Dunkel (Standard) | Hell | Wofür |
|---|---|---|---|
| Grund | `#22252b` | `#eceff3` | Seitenhintergrund |
| Fläche | `#2d3138` | `#ffffff` | Karten |
| Feld | `#25292f` | `#f3f5f8` | Eingabefelder, Kärtchen in Karten |
| Tief | `#191b20` | `#1f2329` | Seitenleiste, Info-Fenster (immer dunkel) |
| Linie | `#3b4048` | `#d9dee5` | Raster, Trennlinien |
| Text | `#eef1f4` (11,5) | `#1c222b` (16,0) | |
| Text leise | `#a4adb8` (5,8) | `#56606d` (6,4) | Beschriftungen |
| Text sehr leise | `#8e97a3` (4,4) | `#6c7683` (4,6) | Achsen, Fußnoten (nie unter 12 px) |
| **Betroffen** | `#5ea8ea` (5,1) | `#1d71b8` (5,1) | Linie durchgezogen – nur Daten (Hauptknopf: siehe 10.1 `--aktion`) |
| **Gesund** | `#36c5d6` (6,3) | `#00808f` (4,7) | Linie gestrichelt |
| ✓ erfüllt | `#4fc48d` (6,0) | `#2a7f50` (4,9) | nur Bewertung |
| ~ knapp | `#e9b23f` (6,8) | `#9a6400` (5,0) | nur Bewertung |
| ✗ nicht erfüllt | `#f7765f` (4,8) | `#c62828` (5,6) | nur Bewertung |
| Korridor | Text-Farbe 9–13 % | Text-Farbe 8 % | Zielbereich, einziges Grau im Diagramm |

Logo bleibt auf **weißem Chip**. Umschalter Dunkel/Hell (Mond/Sonne) unten in der Seitenleiste; Standard dunkel, der Laptop merkt sich die Wahl.

## 3. Schrift – 7 Stufen

| Stufe | Größe | Schrift | Wofür |
|---|---|---|---|
| 1 | 34 px | Montserrat 600 | Kennzahl |
| 2 | 28 px | Montserrat 600 | Seitentitel |
| 3 | 22 px | Montserrat 600 | Abschnitt, Status-Aussage |
| 4 | 17 px | Montserrat 600 | Karten-Titel |
| 5 | 15 px | Barlow 400/500 | Fließtext, Eingaben, Tabellen |
| 6 | 13 px | Barlow 500 | Beschriftungen, Chips |
| 7 | 12 px | Barlow 500 | Achsen, Fußnoten – **Untergrenze** |

- Beide offline eingebaut (`@fontsource`, OFL). Ziffern überall gleich breit (`tabular-nums`).
- **Keine GROSSBUCHSTABEN** für Beschriftungen (ersetzt die Regel aus S8). Einheiten immer direkt am Wert oder in der Überschrift („Knie-Extension, N/kg“).
- Diagrammtexte werden in echter Pixelgröße gezeichnet (Diagramm passt sich der Kartenbreite an) – kein Verkleinern der Schrift.

## 4. Form, Abstand, Bewegung

- Abstände 4 / 8 / 12 / 16 / 24 / 32 px. **Rundung nur drei Werte:** Karte 14 px, Feld/Knopf 10 px, Chip/Pille rund.
- Dunkler Modus: Karten ohne Rand (Abgrenzung über Fläche); heller Modus: 1 px Linie. Schatten nur beim Info-Fenster.
- Bewegung nur bei Daten: Kurve zeichnet sich einmal (~0,6 s), Balken füllt sich. Bei „weniger Bewegung“ aus.
- **Fokus-Ring** (`--fokus`, Textfarbe, 2 px mit 2 px Abstand) an *allen* anklickbaren Elementen inkl. Diagrammpunkte, Kärtchen, Tabellenzeilen, Reiter.

## 5. Bausteine

| Baustein | Regel | Ersetzt |
|---|---|---|
| **Seitenleiste** | 88 px, tief; Logo-Chip; 6 Einträge mit Symbol + Text; aktiv = hell + Türkis-Strich; unten Mond/Sonne + „i“. **Handy:** Leiste unten mit Start, Pat.-Liste, Testung, Berichte, **Mehr** (→ Sicherung, Info, Dunkel/Hell) | `.kopf`, `.navigation` |
| **Seitenkopf** | Zurück + Titel + Kontext (Art, Phase, Speicherstatus) + Aktionen (Bericht, Neue Testung). **Bleibt beim Scrollen stehen**, kompakt | `.seitenkopf` |
| **Reiter** | Pillen; aktiv = helle Pille | neu |
| **Mini-Umschalter** | kleine Pillen im Kartenkopf | neu |
| **Karte** | zwei Lautstärken: *laut* (Status, Ergebnis) mit Akzentkante links in der passenden Farbe, *normal* | `.karte` |
| **Chips – genau drei Arten** | **Ampel:** Zeichen + Wort, Ampelfarbe, Fläche 12 %. **Status:** neutral mit Punkt (● in Arbeit = Blau, ● abgeschlossen = leise). **Merkmal:** Pille mit Linie (Phase, Seite, ODS) | `.ampel-marke`, `.ampel-punkt`, `.chip`, `.block-marke`, `.phase-marke`, `.seiten-marke`, `.ods-marke` … |
| **Kennzahl** | Zahl (Stufe 1) + Einheit + Beschriftung + Bezug („Endtestung 24.10.“) + Ladebalken | neu |
| **Ladebalken** | Skala **0–120 %**, Strich bei 90 % (Ziel) und feiner bei 100 %, Farbe = Ampel, Wert > 120 % am Rand mit „›“ | `Ladebalken` |
| **Info-Fenster** | tief; Datum-Pille; Monate seit OP, Phase, gesund, betroffen, LSI, Ampel-Chip | neu |
| **Eingabefeld** | Feld-Fläche, Einheit leise rechts im Feld | `.feld`, `.zahl-feld` |
| **Leerzustand** | ein Satz, was fehlt + eine Handlung („Noch keine Testung“ → *Neue Testung*) | graue Sätze |
| **Lade-Platzhalter** | ruhige Flächen in Kartenform statt leerer Seite | `return null` |
| **Seiten-Symbol** | kleines Bein-Symbol mit markiertem Knie in der Kopfkarte (statt eigener Karte) | – |

## 6. Diagramme

**Verlauf („Korridor“)**
- **Zeitachse in Monaten seit OP** (0, 3, 6, 9, 12 …); Phasen nur als dünne senkrechte Linien mit Namen oben – keine Flächen. Datum steht im Info-Fenster.
- **Linien = Seite:** betroffen Blau durchgezogen, gesund Türkis gestrichelt. Linienfarbe ändert sich nie.
- **Punkte = Bewertung:** gefüllter Punkt in Ampelfarbe + Zeichen ✓ ~ ✗ daneben, nach der *tatsächlichen* Ampel des Kriteriums (LSI dreistufig, Absolutwert erfüllt/nicht erfüllt). Gesund-Punkte klein und hohl.
- **Korridor** = Zielbereich: LSI 90–110 %; Absolutwerte ab der Read-Schwelle der jeweiligen Phase (stufig, nach oben auslaufend). Gibt es kein Absolutziel (z. B. Hops), gibt es keinen Korridor und einen Satz dazu.
- **Lücken:** fehlt ein Wert, wird die Linie unterbrochen und an der Stelle ein leerer, gestrichelter Kreis „nicht gemessen“ gezeigt. Nur ein Wert → Punkt + Satz „Verlauf ab zwei Testungen“.
- Überschrift trägt Test und Einheit; Achsentexte 12 px; Raster nur waagrecht und leise.
- Diagrammpunkte sind per Tastatur erreichbar; das Info-Fenster erscheint auch beim Fokus.

**Ladebalken, Spinnennetz**: Farben aus dem Set; Spinnennetz wie Etappe 9.
**Druck**: Berichtsdiagramme bleiben hell (Etappe 9).

## 7. Seitenaufbau

### Seite eines Kürzels

```
┌────┬──────────────────────────────────────────────────────────────────────┐
│Logo│ ‹ DEMO-1990   Endtestung · > 9 Mo · in Arbeit      [Bericht] [Neue T.]│ ← bleibt stehen
│    │ ( Übersicht )  Testungen   Stammdaten                                  │
│ ⌂  │ ┌─ Status der letzten Testung (laut) ───────────────────────────────┐ │
│ 👥 │ │ Kriterien (noch) nicht erfüllt          Was fehlt noch?           │ │
│ ⏱  │ │ Vorschlag der App, 24.10.2026           ✗/~ SL-Drop-Jump: LSI …   │ │
│ ⎙  │ │ ⚠ ACL-RSI 52 – unter 55                 [Zur Testung]             │ │
│ ⛁  │ └───────────────────────────────────────────────────────────────────┘ │
│ ⚙  │ ┌ Kopfkarte ──────┐ ┌ Verlauf: Knie-Extension, N/kg ▾  Werte | LSI ┐ │
│    │ │ 🦵 links  12 Mo  │ │ ░░░░░░░ Korridor ░░░░░░░░░░░░░░░░░░░░░░░░░░ │ │
│    │ │ Fußball, Wettk.  │ │  ✗•────✗•──────────────────✓•               │ │
│ ☾☀ │ │ Hamstring, Men.  │ │ 0    3 Mitte 5 Spät  8 9 > 9 Mo   12 Mo     │ │
│ i  │ └─────────────────┘ └──────────────────────────────────────────────┘ │
│    │ [Kennzahl LSI Knie-Ext]  [Kennzahl LSI Single Hop]  [Testungen ▸ 3]   │
└────┴──────────────────────────────────────────────────────────────────────┘
```
- Status-Karte zeigt nur vorhandene Texte (Vorschlag, „Was fehlt noch?“, ACL-RSI-Warnung). Bei Verlaufstests: Phase + „x von y Tests“ + Pflicht-Kriterien, die nicht erfüllt sind.
- Kennzahlen nur aus vorhandenen Einzelwerten (kein Durchschnitt).

### Testung erfassen – Testkarte in drei Lautstärken
1. **Ergebnis (laut):** Name, Ampel-Chip, Bestwerte gesund/betroffen, LSI mit Ladebalken, relativer Wert.
2. **Eingabe (normal):** Versuchstabelle mit Einheit im Feld.
3. **Mehr (leise, zugeklappt):** Protokoll & Warum, Normdaten, Meloq-Metriken, Vorverletzung, „klinisch anders beurteilt“ (aufgeklappt, sobald ausgefüllt).

Seitenkopf mit Kürzel, Art, Phase, Speicherstatus und „Bericht“ bleibt stehen; die Übersicht rechts nutzt dieselben Ampel-Chips.

### Listen
Tabellen mit Suche, Kürzel-Kreis, Status-Chip (neutral), ganze Zeile anklickbar und fokussierbar; Leerzustand mit Handlung.

### Startseite
Live-Monitor bleibt, Farben auf Graphit.

## 8. Was sich nicht ändert

Formeln, Grenzwerte, Kriterientexte, Datenbank, alle Funktionen, Berichte/Druck (weiß), Wortwahl „Kriterien erfüllt / nicht erfüllt“, Hinweis „Ersetzt keine ärztliche Freigabe“. Sichtbare Texte, an denen die automatischen Tests hängen („Neue Testung“, „Bericht“, Überschriften), bleiben gleich.

## 9. Review-Punkte (26.10.2026) und wo sie umgesetzt sind

| # | Punkt | Abschnitt |
|---|---|---|
| 1 | Diagramm: Punktfarbe = tatsächliche Ampel, Linien = Seite, keine Übergangsstriche | 6 |
| 2 | Status der letzten Testung zuerst; Knie als Symbol in der Kopfkarte | 7 |
| 3 | Drei Chip-Arten statt neun; Status ohne Ampelfarbe | 5 |
| 4 | Typo-Skala mit 7 Stufen, Untergrenze 12 px | 3 |
| 5 | Zeitachse in Monaten, Phasen als Linien, Korridor einziges Grau | 6 |
| 6 | Lücken und „nicht gemessen“ sichtbar; Leerzustände mit Handlung | 1, 5, 6 |
| 7 | Testkarte in drei Lautstärken | 7 |
| 8 | Seitenkopf mit Kontext bleibt stehen | 5, 7 |
| 9 | Ladebalken 0–120 % mit Zielmarke 90 % | 5 |
| 10 | Lade-Platzhalter, Fokus überall, Handy-Leiste mit „Mehr“ | 4, 5 |

## 10. Designsystem (freigegeben 26.10.2026)

Prinzipien: Präzision statt Dekoration · klare Hierarchie statt Kartenflut · dezente, konsistente Akzente · Messwerte und Diagramme hervorragend lesbar · alle Seiten einheitlich · Platz sinnvoll nutzen · zurückhaltende Bewegung · Messdaten ohne zusätzliche medizinische Interpretation.

**Wichtigste Entscheidungen:** (1) Farbe = Information, jede Farbe genau eine Rolle. (2) Hauptknöpfe neutral (`--aktion`), Blau/Türkis nur für Messdaten. (3) Fokus-Ring in Textfarbe, nicht Türkis. (4) Eingabefehler mit eigener Farbe `--fehler` + „!“, getrennt von „✗ nicht erfüllt“. (5) Weniger Karten, keine Karte in der Karte. (6) Einzige neue Abhängigkeit: `@fontsource/montserrat`.

### 10.1 Farbrollen (CSS-Variablen)

| Variable | Dunkel | Hell | Rolle |
|---|---|---|---|
| `--grund` | #22252b | #eceff3 | Seitenhintergrund |
| `--flaeche` | #2d3138 | #ffffff | Karten |
| `--flaeche-hoch` | #353a42 | #f7f8fa | Hover |
| `--feld` | #25292f | #f3f5f8 | Eingabefelder, eingebettete Bereiche |
| `--tief` | #191b20 | #1f2329 | Seitenleiste, Info-Fenster |
| `--linie` / `--linie-stark` | #3b4048 / #4a505a | #d9dee5 / #c2cad4 | Trennlinien / Feldränder |
| `--text` / `--text-leise` / `--text-sehr-leise` | #eef1f4 / #a4adb8 / #8e97a3 | #1c222b / #56606d / #6c7683 | Text |
| `--aktion` / `--aktion-text` | #eef1f4 / #191b20 | #1f2329 / #ffffff | Hauptknopf, aktive Pille |
| `--seite-betroffen` / `--seite-gesund` | #5ea8ea / #36c5d6 | #1d71b8 / #00808f | nur Daten |
| `--erfuellt` / `--knapp` / `--nicht-erfuellt` | #4fc48d / #e9b23f / #f7765f | #2a7f50 / #9a6400 / #c62828 | nur Bewertung, immer mit ✓ ~ ✗ |
| `--fehler` | #ff8fb1 | #b3124e | Eingabe-/Systemfehler, immer mit „!“ |
| `--korridor` | Text 11 % | Text 8 % | Zielbereich |
| `--fokus` | #eef1f4 | #1c222b | Fokus-Ring |

Berichte/Druck: eigenes, festes helles Set (der dunkle Modus kommt nie aufs Papier).
Übergang: Bis die Bausteine umgestellt sind (Etappe 9b, Schritt 3), bleiben die alten Namen (`--pzl-blau`, `--rand`, `--fehler` = „nicht erfüllt“ …) als Übersetzung bestehen.

### 10.2 Schrift
Kennzahl 34/40 · Titel 28/34 · Abschnitt 22/28 · Karte 17/24 (Montserrat 600) · Text 15/22 · Klein 13/18 · Mini 12/16 (Barlow 400/500/600). Ziffern gleich breit, Zahlen in Tabellen rechtsbündig, Einheit klein/leise am Wert oder im Spaltenkopf, keine Großbuchstaben-Etiketten.

### 10.3 Raster und Größen
Abstände 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 px (in Karten 16–20, zwischen Karten 20, zwischen Abschnitten 32–48). Bedienelemente 32 / 40 / 44 px (kompakt / Standard / Handy). Symbole 16 / 20 / 24 px, Strich 1,6. Rundung 14 / 10 / rund.

### 10.4 Karten, Tabellen, Formulare
- Karten: dunkel ohne Rand, hell 1 px Linie, kein Schatten; *normal* und *hervorgehoben* (4 px Kante links in `--aktion`, nur Status der letzten Testung und Ergebnis); keine Karte in der Karte.
- Tabellen: Kopf Klein/leise (bei langen Tabellen stehend); Zeilen 44 px (Versuche 36 px); nur waagrechte Linien; ganze Zeile klickbar mit Hover/Fokus; leer = „–“ leise.
- Formulare: Beschriftung oben, Hilfe darunter; Einheit im Feld; „Pflicht“ als Merkmal-Chip; Fehler = `--fehler`-Rand + „!“ + Satz zum Beheben; abgeschlossen = Werte als Text, Hinweis mit „Wieder öffnen“.

### 10.5 Knöpfe
Haupt (`--aktion`, eine pro Bereich) · Normal (Rand `--linie-stark`) · Leise (Text) · Gefahr (`--fehler`, mit Rückfrage) · Reiter/Mini-Umschalter (Pillen). Deaktiviert 45 % mit Grund.

### 10.6 Diagramme
Betroffen Blau durchgezogen 2,5 px · gesund Türkis gestrichelt 2 px · Punkte 6,5 px in Ampelfarbe mit ✓ ~ ✗ · Korridor = Ziel · „nicht gemessen“ = leerer gestrichelter Kreis, Lücke = Unterbrechung · Titel Stufe Karte mit Test + Einheit · Achsen Mini, Raster nur waagrecht · Zeitachse in Monaten seit OP, Phasen als feine Linien · Info-Fenster (Maus + Tastatur) · Ladebalken 0–120 % · Spinnennetz wie Etappe 9.

### 10.7 Zustände
Hover `--flaeche-hoch` (150 ms) · Fokus 2-px-Ring `--fokus` überall · Ausgewählt `--aktion` · Laden: Platzhalter-Flächen ab 300 ms, ohne Flimmern · Speichern „speichert …“ / „✓ gespeichert“ im Seitenkopf · Leer: Satz + Handlung · Fehler Feld/Seite mit `--fehler` + „!“ · Bewegung nur bei Daten (Linie 0,8 s, Balken 0,6 s), bei „weniger Bewegung“ aus.

### 10.8 Responsive
≥ 1280: Leiste 88 px, Inhalt bis 1320 px, Übersicht 1 : 2,4, Erfassung mit stehender Übersicht (320 px) · 1024–1279: Kennzahlen zweispaltig · 720–1023: einspaltig, Übersicht oben zuklappbar · < 720: Leiste unten (Start, Pat.-Liste, Testung, Berichte, Mehr), Tippflächen 44 px, Tabellen waagrecht scrollbar, Seitenkopf zweizeilig.

### 10.9 Umsetzung
Hell/Dunkel über `data-theme` am `<html>`; die Wahl merkt sich der Browser (`localStorage`, keine Pat.-Daten, keine Datenbankänderung), damit beim Start nichts aufblitzt. Standard dunkel.
