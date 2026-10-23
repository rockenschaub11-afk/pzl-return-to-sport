# PZL Return-to-Sport – Entscheidungsprotokoll

Stand: 23.10.2026 – Ergebnis der Fragerunde (F1–F41) mit Philipp, Physio Zentrum Linz.
Dieses Dokument ist die **verbindliche Grundlage** für den Bau. Änderungen nur mit Philipps Zustimmung und mit Datum hier nachtragen.

---

## 1. Rahmen

| Thema | Entscheidung | Frage |
|---|---|---|
| Zweck | Return-to-Sport-Testungen nach VKB-Verletzung (v. a. post-OP). Schwerpunkt **Endtestung**, Verlaufstests möglich | F2 |
| Produkt | **Eigenständige App**, nicht Teil von CRUX | F6 |
| Name | **PZL Return-to-Sport** | F14 |
| Nutzer | Jede Therapeut:in auf **eigenem Laptop**, nur eigene Pat. | F1 |
| Geräte | Laptops, Windows **und** Mac; Chrome, Edge, Safari | F6, F16 |
| Auslieferung | Webadresse über **GitHub Pages**, als App installierbar (PWA), offline, Auto-Updates. Repository **öffentlich** (nur Code, nie Pat.-Daten) | F12, F34 |
| Daten | Nur lokal im Browser (IndexedDB) des jeweiligen Laptops. Kein Server, keine Cloud | F1, F12 |
| Sprache | Deutsch | F17 |
| Pseudonym | Nur **Kürzel** (Vorschlag `Initialen-Geburtsjahr`, z. B. `MH-1998`); doppelte Kürzel werden erkannt. Name nur beim PDF-Export eintippen, **nie speichern** | F9 |
| Übergabe | Export/Import-Datei **je Kürzel** (z. B. an Kolleg:in) | F7 |
| Sicherung | Button „Sicherung exportieren“ + Erinnerung 1× pro Woche | F8 |
| Verschlüsselung | Export- und Sicherungsdateien **standardmäßig mit Passwort** (AES) | F35 |
| Branding | „Physio Zentrum Linz“ + Logo (`public/logo-pzl.svg`, Original von physio-linz.at, Rechte bei der Praxis) | F10, F13 |
| Rechtliches | App ist **Dokumentations- und Rechenhilfe**: Formulierung „Kriterien erfüllt / nicht erfüllt“, nie „Freigabe“. Jeder Bericht: „Ersetzt keine ärztliche Freigabe.“ Vor Weitergabe an andere Praxen MDR-Prüfung | F36 |
| Einführung | Etappenweise bauen, Philipp nimmt jede Etappe ab → **Pilot** (Philipp, 2–3 echte Testungen) → Korrektur → Kolleg:innen, Kurzanleitung in der App | F37 |

## 2. Stammdaten je Kürzel

| Feld | Pflicht? | Wozu |
|---|---|---|
| Operierte/verletzte Seite | **Pflicht** | LSI |
| OP-Datum | **Pflicht** | Phase, Mindestzeit |
| Körpergewicht (je Testung) | **Pflicht** | N/kg, Ns/kg |
| Niveau Wettkampf / Freizeit | **Pflicht** | 9- vs. 12-Monats-Hinweis |
| Geschlecht | optional | Frauen-Regel Absolutwerte, Normdaten |
| Geburtsjahr | optional | Normdaten-Altersband (16–20 / 20–30 / 30+) |
| Beinlänge | optional | Hops in % Beinlänge (Normdaten) |
| Graft (BPTB / Hamstring / Quadrizeps) | optional | Interpretation |
| Begleit-OP (Meniskus, Knorpel, LET, …) | optional | Interpretation |
| Revision ja/nein, konservativ behandelt | optional | Interpretation |
| Sportart, Tegner vor Verletzung | optional | Info, Normdaten |

## 3. Bewertungslogik

- **Schwellen-Quelle: PZL-Mix** (F18) – Read/VALD-Absolutwerte, wo vorhanden; zusätzlich LSI für alles mit Seitenvergleich; Hops und PROM-Grenzen aus dem Handbook. Jede Schwelle trägt ihre Quelle.
- Test ist **grün**, wenn Absolutwert **und** LSI erfüllt (sofern beide definiert).
- **LSI** = betroffen / gesund × 100; bei Zeittests (6 m Hop) gesund / betroffen × 100 (F22).
- **Ampel LSI** einheitlich: grün ≥ 90 %, gelb 80–89 %, rot < 80 % (F22).
- **Vorverletzungswert** optional; wenn vorhanden, zeigt die App beide Vergleiche (F22).
- **Frauen:** Read-Absolutwerte nur *wünschenswert*, LSI bleibt Pflicht; Hinweis „Read-Benchmarks nicht geschlechtsspezifisch“ (F26).
- **Versuche:** 3 Messversuche je Seite, **Bestwert zählt**; Warnung „Messung wiederholen?“ bei Variationskoeffizient > 10 % (Read S. 32) (F21).
- **Einheiten:** Eingabe in kg (Standard, wie Meloq/DynaMo) oder N; Umrechnung × 9,81. Hebelarm optional → zusätzlich Nm/kg. Ampel nach N/kg (F20).
- **Schwellen sind fix im Code** (Änderung nur per Update, zentral durch Philipp). Einzelfall: „klinisch anders beurteilt“ mit Pflichtbegründung (F33).
- **Normdaten-Report** nur als graue Zusatzinfo „typisch nach VKB-OP“ bei Hops, SL-Drop-Jump, CMJ-Höhe, PROMs; ohne Einfluss auf die Ampel; fehlerhafte Tabellen weglassen (F24).

### 3.1 RTS-Vorschlag (F25)
„**Kriterien erfüllt**“ nur wenn:
1. alle **Pflicht**-Tests grün, **und**
2. ≥ **9 Monate** seit OP (Handbook S. 22–23, Read S. 4). Bei Freizeit-Niveau Hinweis „Read empfiehlt 12 Monate“.

Sonst: Liste „Was fehlt noch?“. ACL-RSI < 55 → eigene Warnung (blockiert nicht).
Therapeut:in **bestätigt oder überstimmt** mit Begründung (F10).

## 4. Endtestung – Tests, Schwellen, Status (F19, F26)

Phase „Return to Competition“ (> 9 Monate).

| Block | Test | Schwelle | Status | Quelle |
|---|---|---|---|---|
| Klinik | Erguss (Stroke-Test) | 0 oder Spur | **Pflicht** | Aspetar S. 12 |
| | Extension | Defizit 0° | **Pflicht** | Aspetar S. 12, Read S. 59 |
| | Flexion | ≥ 95 % Gegenseite | **Pflicht** | Read S. 13, Handbook S. 22 |
| | SLR | kein Extensionslag | **Pflicht** | Read S. 59 |
| HHD | Knie-Extension | > 7,5 N/kg **und** LSI ≥ 90 % | **Pflicht** | Read S. 59 |
| | Knie-Flexion | > 2,8 N/kg **und** LSI ≥ 90 % | **Pflicht** | Read S. 59 |
| | Hüft-Abduktion | LSI ≥ 90 % | wünschenswert | Aspetar S. 39 |
| | Plantarflexion (optional) | > 18 N/kg, LSI ≥ 90 % | wünschenswert | Read S. 59 |
| Platten | CMJ | Impuls-Asymmetrie < 10 % (**Pflicht**); Höhe > 33,9 cm (wünschenswert); Net Impulse > 2,6 Ns/kg (wünschenswert) | s. links | Read S. 59 |
| | SL-CMJ | > 18 cm **und** LSI ≥ 90 % | **Pflicht** | Read S. 59 |
| | SL-Drop-Jump | > 17 cm, RSI > 0,57 (vorerst nur Info, s. 6.3), LSI ≥ 90 % | **Pflicht** | Read S. 59 |
| | IMTP | > 37 N/kg | wünschenswert | Read S. 59 |
| Hops (Maßband) | Single, Triple, Crossover, 6 m auf Zeit | LSI ≥ 90 % | **Pflicht** | Aspetar S. 39, Handbook S. 21 |
| | Side Hop 30 s (optional) | LSI ≥ 90 % | wünschenswert | Handbook S. 9 |
| Kraftausdauer | SL Calf Raise, SL Bridge | > 25 Wdh., LSI ≥ 90 % | wünschenswert | Read S. 59, Handbook S. 17 |
| | SL Sit-to-Stand | ≥ 15 Wdh., LSI ≥ 90 % | wünschenswert | Read S. 59 |
| PROM | ACL-RSI | ≥ 55, sonst Warnung | Warnung | Handbook S. 20 |
| | IKDC | keine Endschwelle → Info + Normwert | Info | Normdaten-Report |
| | KOOS, Tampa (optional) | keine Schwelle → Info | Info | – |

Feldtests (5-0-5, Sprint, CMAS) sind **nicht** Teil der App (F19).

## 5. Protokolle (F27) – Standard, änderbar; tatsächlicher Wert wird gespeichert

| Test | Position / Winkel | Warum (erscheint in der App) |
|---|---|---|
| Knie-Extension (HHD) | Sitzend, **60° Knieflexion**, Dynamometer distal am Unterschenkel, mit Gurt, isometrisch 3–5 s | Quadrizeps-Defizite nach VKB-OP sind bei 50–80° am größten (Read S. 24); entspricht Aspetar (S. 11). Gurt: misst die Kraft der Pat., nicht der Therapeut:in |
| Knie-Flexion (HHD) | Bauchlage, **90° Knieflexion**, Gurt, isometrisch | Hamstring-Defizite v. a. bei > 75° Flexion, besonders nach Hamstring-Graft (Read S. 25) |
| Hüft-Abduktion (HHD) | Rückenlage, langer Hebel, Dynamometer knapp proximal des Malleolus lateralis, isometrisch | Read-Referenzsetting (S. 35), gut standardisierbar |
| Plantarflexion | Sitzend, Knie 90°, auf der Platte (Soleus) | Read S. 36 |
| CMJ / SL-CMJ | Hände an den Hüften | Read S. 39 – keine Armschwung-Effekte |
| SL-Drop-Jump | Box **30 cm** | Read-Konvention (S. 47); Normdaten-Report nutzt 15 cm → Boxhöhe immer mitspeichern |
| Kraftausdauer | Metronom 60 bpm, bis Ausbelastung/Technikverlust | Standardisiertes Tempo → vergleichbar über Testungen |
| Allgemein | Gesundes Bein zuerst, 1 Probeversuch, 3 Messversuche, 30–60 s Pause | Betroffenes Bein nicht durch Lerneffekt benachteiligt; Read empfiehlt Familiarisierung (S. 32) |

HHD-Krafttests erst ab ca. **8 Wochen** post-OP (Read: 6–12 Wochen Wartezeit, S. 24).

## 6. Kraftmessplatte Meloq EasyBase (F31, F40)

### 6.1 Was die Meloq-App anzeigt (Screenshots CMJ, 23.10.2026)
Sprunghöhe (aus Flugzeit), Flugzeit, Peak Force (Propulsion) L/R in kg, Peak Power (Propulsion) L/R in W, Peak Velocity, **Net Impulse (Propulsion) L/R in kg·s**, Peak Power (Braking) L/R, Net Peak Braking Force (kg), RFD 0–100 ms (Braking) L/R in kg/s, RSI, Total Contraction Time. Export: PDF-Bericht, CSV, Excel.

### 6.2 Umrechnungen und Eigenheiten
- **Net Impulse → Ns/kg:** `kg·s × 9,81 / Körpergewicht`. Beispiel: 13,3 × 9,81 / 59,15 = 2,21 Ns/kg.
- **Meloq-Asymmetrie** = (stärker − schwächer) / stärker × 100. Die App rechnet LSI selbst aus L/R.
- **Bremsimpuls (eccentric deceleration impulse) wird nicht angezeigt** → Read-Schwellen dazu entfallen, Hinweis „mit Meloq nicht messbar“.
- **Meloq-„RSI“ beim CMJ** = Flugzeit / Kontraktionszeit (448/815 = 0,549) – **nicht** vergleichbar mit Read-RSI-mod (Höhe/Zeit). Keine Read-Schwelle darauf anwenden.
- **Sprunghöhe:** Meloq über Flugzeit, VALD (Read-Referenz) über Impuls → Abweichungen möglich; Hinweis beim Test, Ampel bleibt aktiv.

### 6.3 Offen
- **RSI-Definition beim Drop Jump** in der Meloq-App prüfen („i“-Symbol). Bis dahin RSI-Ampel beim Drop Jump nur „Info“.
- Zeigt Meloq beim Einbeinstand den Gesamt-Schwankweg in mm? Falls nein → Feld nur Info ohne Schwelle.

### 6.4 ODS-Framework (Output / Driver / Strategy)

| ODS | Meloq-Metriken |
|---|---|
| Output | Sprunghöhe, Flugzeit, RSI (Drop Jump) |
| Driver | Net Impulse (Propulsion) L/R, Peak Force (Propulsion) L/R, Peak Power L/R, Net Peak Braking Force, Peak Power (Braking) L/R, RFD 0–100 ms (Braking) L/R, Peak Velocity |
| Strategy | Total Contraction Time, Meloq-RSI (CMJ), Kontaktzeit (Drop Jump) |

**Kern-Satz (fix, bestimmt die Ampel):**
- CMJ: Sprunghöhe (O), Net Impulse L/R → Ns/kg + LSI (D), Contraction Time (S)
- SL-CMJ: Höhe je Bein (O), Net Impulse je Bein (D), Contraction Time je Bein (S)
- SL-Drop-Jump: Höhe + RSI (O), Kontaktzeit (S)

Alle weiteren Metriken frei wählbar (nach O/D/S gruppiert); Auswahl wird als persönlicher Standard am Laptop gespeichert. Strategy-Werte ohne Ampel, aber mit LSI und Verlauf.
Quellen: Hawkin Dynamics „ODS System“; McMahon et al., Jump Framework (Strength Cond J 2021).

### 6.5 Handdynamometer VALD DynaMo
Anzeige in kg/N, Peak Force, Zeit bis Peak, RFD. Hinweis: Die DynaMo-App verlangt Vor-/Nachname, Geburtsdatum, Geschlecht (VALD-Cloud) – betrifft die VALD-Nutzung, nicht diese App.

## 7. Phasen und Verlaufstests (F28, F32, F39)

- Phase wird **automatisch aus dem OP-Datum** bestimmt, Übersteuern mit kurzer Begründung.
- Teil-Testungen erlaubt, Zwischenspeichern möglich.
- Je Phase gilt die Read-Spalte; wo Read nichts angibt → nur LSI, keine absolute Ampel.

### 7.1 Read-Benchmarks (Practitioner's Guide S. 59, visuell geprüft)

| Test | Früh 0–3 Mo | Mitte 3–5 Mo | Spät 5–8 Mo | RTT 8–9 Mo | RTC > 9 Mo |
|---|---|---|---|---|---|
| Schwellung | keine/minimal | | | | |
| ROM | Ext < 0°, Flex > 130° | | | | |
| SLR | kein Lag | | | | |
| Kniebeuge-Asymmetrie | < 10 % (exz. Bremsimpuls*) | | | | |
| SL-Balance | < 550 mm Schwankweg | | | | |
| Bridge / Calf Raise | 10 Wdh. (beidbeinig) | einbeinig > 25 | | | |
| SL Sit-to-Stand | | 15–25 | | | |
| SL-Squat | > 70° | > 90° | | | |
| Plantarflexion | > 13 N/kg | > 15,5 | > 18 | | |
| Knie-Extension | > 5,5 N/kg | > 7,0 | > 7,5 | | |
| Knie-Flexion | > 2,0 N/kg | > 2,5 | > 2,8 | | |
| CMJ-Höhe | | 27,8–30,1 cm | 30,7–33,4 | 31,8–34,7 | 33,9–35,0 |
| CMJ Net Impulse/BM | | Asym. 9,2–13,4 % | > 2,25 Ns/kg | > 2,4 | > 2,6 |
| CMJ exz. Bremsimpuls/BM* | | | > 1,35 | > 1,5 | > 1,65 |
| SL-CMJ-Höhe | | > 11 cm | > 13,2 | > 15 | > 18 |
| SL-CMJ Net Impulse/BM | | Asym. < 20 % | > 1,5 Ns/kg | > 1,58 | > 1,8 |
| SL-CMJ exz. Bremsimpuls/BM* | | | > 0,6 | > 0,68 | > 0,73 |
| Hop (Platte) | | Impuls-Asym. < 10 % | | | |
| Drop Jump bilateral | | | > 28 cm, Asym. < 10 % | | |
| SL-Drop-Jump | | | | > 14 cm, RSI > 0,38 | > 17 cm, RSI > 0,57 |
| IMTP | | | > 32 N/kg | > 34 | > 37 |

\* Bremsimpuls mit Meloq nicht messbar → entfällt. Bei Kniebeuge-Asymmetrie ersatzweise die von Meloq angezeigte Asymmetrie verwenden (Hinweis).
Hinweis Read: Bereiche sind 95 %-KI, teils unveröffentlichte Daten, „for guidance only“, nicht geschlechtsgetrennt.

### 7.2 Vorgeschlagene Testsets je Phase

| Phase | Tests |
|---|---|
| Früh (0–3 Mo) | Klinik; HHD Ext/Flex **ab ca. 8 Wo**; Bridge + Calf Raise beidbeinig; SL-Squat-Tiefe; Einbeinstand (Platte); Kniebeuge-Asymmetrie |
| Mitte (3–5 Mo) | Klinik; HHD; Kraftausdauer einbeinig; SL-Squat; CMJ; SL-CMJ; Hops (Asymmetrie) |
| Spät (5–8 Mo) | wie Mitte + bilateraler Drop Jump + IMTP |
| 8–9 Mo / > 9 Mo | volle Endtestung (Abschnitt 4) mit der jeweiligen Spalte |

## 8. Fragebögen (F29, F38)

- **Start: nur Score-Eingabe** (Papier). Zusätzlich **Score-Rechner** (Einzelantworten vom Papier abtippen, App rechnet) – **ohne** Fragebogentext.
- Digitale Ausfüllversion erst nach Erlaubnis (Anfragen: `docs/LIZENZANFRAGEN.md`).

| Fragebogen | Lizenz | Deutsch | Scoring |
|---|---|---|---|
| ACL-RSI | keine offizielle Lizenzseite; Rechte Webster/Feller (La Trobe) | **keine validierte** Version gefunden → Hinweis „deutsche Übersetzung, nicht validiert“ | 12 Items à 0–100, Mittelwert, 0–100 |
| IKDC | frei nur für akademische Forschung; Healthcare → AOSSM anfragen; keine Änderungen | validiert (Kümmel 2018) | 18 bewertete Items (10a nicht), Rohsumme / max. der beantworteten × 100; max. 2 fehlend |
| KOOS | immer Erlaubnis via Mapi ePROVIDE | ja (Kessler 2003) | 5 Subskalen, je 100 − (Mittel × 100/4); ≥ 50 % Items je Subskala; kein Gesamtscore |
| Tampa (TSK-11) | meist als frei angeführt, keine Rechte-Erklärung | TSK-GV (Rusu 2014) | 11 Items à 1–4, Summe 11–44 |

## 9. Normdaten (Zusatzinfo, grau) – Auszug Research Normative Data Report (VALD)

Mittelwert (−1 SD / +1 SD), nur für die freigegebenen Bereiche (F24):

| Zeitpunkt / Gruppe | Wert |
|---|---|
| 6 Mo, w 16–20 | ACL-RSI 68,7 (47,8–89,6); IKDC 83,2 (72–94,5); Hop-LSI Single 92 %, Triple 94 %, Crossover 96 % |
| 6 Mo, m 16–20 | ACL-RSI 74 (55–94); IKDC 85 (75–94); Hop-LSI Single 94 %, Triple 93 %, Crossover 95 % |
| 6 Mo, m 20–30 | CMJ-Höhe 29,7 cm (24,6–34,8); SL-CMJ 13,1 / 16,7 cm (betr./gesund); SL-DJ 15 cm: 13 / 16,5 cm, RSI 0,34 / 0,51 |
| 9 Mo, m 20–30 | ACL-RSI 74,5 (58–90,9); IKDC 84,9 (75,2–94,5); CMJ 29,7 cm; SL-DJ 15 cm: 9,2 / 12,5 cm, RSI 0,35 / 0,47 |
| 12 Mo, w 16–20 | Hop-LSI 6 m 103 %, Single 99 %, Triple 87 %, Crossover 95 % |
| 12 Mo, m 20–30 | CMJ 30,7 / 34,5 cm; SL-DJ 14 / 16 cm, RSI 0,37 / 0,46 |

Achtung: Report hat Fehler (KOOS > 100, doppelte Seiten, Einheitenfehler) – nur obige, plausible Werte verwenden. SL-DJ im Report mit 15 cm Box (PZL-Standard 30 cm) → Hinweis.

## 10. Ausgaben (F5, F30, F41)

| Ausgabe | Inhalt |
|---|---|
| Bildschirm | Alles Ausgewählte + Rohdaten der Versuche |
| Arztbericht (PDF) | Kopf mit Logo/Praxis, Kürzel (+ Name nur temporär), Stammdaten, Kern-Satz + ausgewählte Metriken mit Wert, LSI, Ampel, Quelle; Vorschlag + Entscheidung mit Begründung; Verlauf; Unterschriftfeld; Hinweis „Ersetzt keine ärztliche Freigabe“ |
| Pat./Trainer-Bericht | 1 Seite, nur Output-Werte + Ampeln, Spinnennetz L/R, „Was fehlt noch?“ in Alltagssprache |

## 11. Später (nicht in Version 1)

1. CSV/Excel-Import aus Meloq und VALD Hub (Beispieldateien mit Fantasiekürzel nötig) (F11 b)
2. Eventuell VALD-API (Lizenzvertrag mit VALD nötig) (F11 c)
3. Digitale Fragebögen nach Lizenz-Freigabe (F38)

## 12. Quellen

- Read P. *Practitioner's Guide to ACL*, VALD 2024 (`Documents\Physiotherapie\Practitioner's Guide to ACL.pdf`)
- Read P. *ACL Phase Progression & Benchmarks* (Poster)
- Aspetar ACL Rehabilitation Protocol
- ACL Injuries Part 2 Handbook (Clinical Physio)
- VALD *Research Normative Data Report — ACL*
- Hawkin Dynamics, ODS System; McMahon et al. 2021, Strength Cond J (Jump Framework)
