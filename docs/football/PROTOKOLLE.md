# Football Performance Profiling – Phase 1: Testbatterie und Protokolle

Stand: 17.11.2026 – **Entwurf, Antworten von Philipp (17.11.2026) eingearbeitet**; offen ist noch F14 (Meloq-Beispieldateien). Grundlage: `docs/football/PHASE0.md` (verbindlich).
Phase 1 ist reine Dokumentation – kein Code. Nächster Schritt nach Freigabe: Phase 3 (Kennzahlen und Interpretationsregeln).

**Was dieses Dokument festlegt:** *wie* gemessen wird und *welche Rohwerte* erfasst werden.
**Was es bewusst nicht festlegt:** Kennzahlen, Verhältnisse, Interpretation, Trainingsentscheidungen (→ Phase 3). Es enthält **keine Referenz-, Norm- oder Grenzwerte** und **keine Asymmetrie-Grenzen**.

### Kennzeichnung jeder Festlegung

| Kürzel | Bedeutung |
|---|---|
| **[gesichert]** | gut abgesichert – systematische Übersicht oder mehrere übereinstimmende Primärstudien |
| **[plausibel]** | einzelne Studien oder physikalisch/physiologisch schlüssig, aber nicht direkt für genau dieses Setting geprüft |
| **[Konvention]** | Praxiskonvention – üblich, sinnvoll, aber nicht durch Studien begründet; Hauptzweck: **immer gleich** messen |
| **[offen]** | noch zu klären (Gerät, Philipp, erste Profile) |
| **[Philipp 17.11.]** | Entscheidung von Philipp am 17.11.2026 |

Quellen stehen in Kurzform beim Punkt, vollständig mit Link in Abschnitt 9. „Read“ = Read P., *Practitioner's Guide to ACL*, VALD 2024 (lokales PDF, wie im ACL-Modul). ACL-Begründungen wurden **nicht** übernommen, wenn sie am Transplantat hängen.

---

## 1. Grundsätze für alle Tests

### 1.1 Kraft ist nicht Drehmoment
- Der DynaMo misst **Kraft (N)** am Polster. Erst mit dem **Hebelarm** (Abstand Gelenkachse → Polstermitte, in m) wird daraus **Drehmoment (Nm = N × m)**. **[gesichert]** – Physik; Chamorro 2017 vergleicht HHD mit Isokinetik ausdrücklich über das Drehmoment.
- Warum der Hebelarm bei **jedem** Knie- und Hüfttest gemessen wird: Schon wenige Zentimeter andere Polsterlage verändern die Kraft bei gleichem Drehmoment. Ohne Hebelarm sind Re-Tests und Seitenvergleiche nur gültig, wenn das Polster exakt gleich liegt – das ist in der Praxis nicht garantiert. **[gesichert]** (Physik) / Thorborg (Aspetar-Review) nennt Testposition und Hebelarm als Einflussfaktoren der Reliabilität **[plausibel]**.
- In der App werden **N und Hebelarm getrennt** gespeichert; Nm und Nm/kg rechnet die App (Phase 3). Nie Kraft und Drehmoment im selben Diagramm oder Verhältnis mischen.

### 1.2 Hebelarm-Messung (gilt für alle Knie- und Hüfttests)
1. Spieler liegt/sitzt bereits in der **Testposition**, Polster und Gurt sind angelegt.
2. Maßband (nicht dehnbar) von der **Landmarke** (siehe Test) zur **Mitte des Polsters**.
3. Auf **0,5 cm** ablesen, in **cm** eintragen, **je Seite und bei jeder Testung neu**.
4. Polsterlage zusätzlich in Worten („knapp proximal der Malleolen“) – die Zahl ist entscheidend.

Landmarken: Knie = **Epicondylus lateralis femoris** (Näherung der Kniegelenksachse); Hüfte = **Trochanter major** (Näherung des Hüftgelenkzentrums von lateral). **[Konvention]** – die exakte Gelenkachse liegt nicht unter der Haut; entscheidend ist, dass immer dieselbe Landmarke verwendet wird. Die in Studien verwendeten Landmarken konnte ich für die Hüfttests nicht im Volltext prüfen → **[offen]**, ändert aber nichts an der Messvorschrift „immer gleich“.

### 1.3 Fixierung mit Gurt
- **Alle** DynaMo-Tests mit Gurt (oder fester Unterlage), nie von Hand gehalten. **[gesichert]**: Ohne Fixierung messen Tester mit unterschiedlicher Armkraft systematisch unterschiedlich (Thorborg 2013); mit Gurtfixierung verschwindet dieser Bias bei kräftigen Sportlern (Thorborg 2012). Bei Knie-Extension und Plantarflexion ist HHD ohne Fixierung besonders ungenau (Chamorro 2017).
- Der Gurt läuft möglichst **senkrecht zum Unterschenkel bzw. Oberschenkel** und ist **vor** dem Versuch gespannt (kein Durchhang → sonst ändert sich der Gelenkwinkel und es gibt einen „Ruck“). **[Konvention]**
- **Anker (Philipp 17.11.):** Sprossenwand, Rack/Gestell und Liegenbeine/-rahmen sind vorhanden. Seitlich (Abduktion/Adduktion) an Sprossenwand oder Rack, Gurt waagrecht in Höhe des Unterschenkels; senkrecht nach unten (Hüft-Extension, Hamstrings 90°) um die Liege; Knie-Extension ans hintere Liegenbein. Der gewählte Anker wird je Test einmal festgelegt und bei jeder Testung gleich verwendet. **[Philipp 17.11.]**

### 1.4 Isometrischer Versuch – Ablauf, Instruktion, Dauer
- **Nur Peak Force.** Der DynaMo Plus tastet mit 225 Hz ab; RFD wird in Version 1 **nicht** erfasst (PHASE0).
- **Instruktion (wörtlich, immer gleich, gleiche Lautstärke):**
  > „Wenn ich ‚Los‘ sage, drückst du **so fest du kannst** gegen das Polster und hältst, bis ich ‚Stopp‘ sage. Nicht ruckartig anreißen, aber schnell auf volle Kraft.
  > Bereit? – 3, 2, 1, **Los! Drück, drück, drück, drück – Stopp.**“
- **Dauer:** ca. **1 s Kraftaufbau + 3 s maximal** halten (gesamt 3–5 s, wie ACL-Modul). **[plausibel]** – Maffiuletti 2016 empfiehlt, Maximalkraft mit der Instruktion „so fest wie möglich“ und ausreichend langer Kontraktion (≥ 3 s) zu messen; die Instruktion „so schnell wie möglich“ gehört zu RFD-Messungen und kostet etwas Peak Force. Da wir keine RFD messen, steht „so fest“ im Vordergrund.
- **Anfeuerung:** genau die oben stehenden Worte, bei jedem Versuch und Spieler gleich. **[plausibel]** – Lautstärke und Art der Anfeuerung beeinflussen Maximalkraft; daher standardisieren (McNair 1996, Link ungeprüft).
- **Keine Vorspannung** über ein leichtes Anlegen hinaus, **kein Ausholen**. **[Konvention]**

### 1.5 Familiarisierung, Versuche, Pausen
| Festlegung | Wert | Kennz. | Warum |
|---|---|---|---|
| Probeversuche je Test und Seite | **2 submaximal** (ca. 50 % und ca. 80 % „gefühlt“) | [Konvention] | Spieler lernt Position und Instruktion; ACL-Modul 1 Probeversuch (Read S. 32) – Fußballer kennen die Tests meist nicht, daher 2 |
| Messversuche | **3 gültige** je Seite | [Konvention] | wie ACL-Modul; erlaubt CoV-Berechnung |
| Pause zwischen Maximalversuchen | **30–60 s** | [Konvention] | wie ACL-Modul (Read S. 32); in der Pause wird die andere Seite oder der Hebelarm notiert |
| Zusatzversuch | max. **1** je Seite, wenn CoV-Warnung oder ungültiger Versuch | [Konvention] | Mehr Versuche → Ermüdung und Zeitüberschreitung |
| Erstes Profil | wird als **„Erstprofil“** markiert | [plausibel] | Beim zweiten Profil ist ein Lerneffekt möglich (z. B. höherer Wert beim 2. Termin, beschrieben beim Soleus-Test von Rhodes, zitiert in Glaied & Whiteley 2025). Ein eigener Familiarisierungstermin wäre besser, passt aber nicht in 60 min. **[Philipp 17.11.]**: nur Probeversuche, kein eigener Termin |

### 1.6 Seitenreihenfolge
- **Immer mit dem Nicht-Schussbein beginnen**, dann Schussbein; bei jedem Test und jedem Re-Test gleich. **[Konvention]** – Es gibt keine verletzte Seite, die man schützen müsste (Unterschied zum ACL-Modul). Wichtig ist nur, dass die Reihenfolge fix ist, damit ein Lerneffekt sich bei Re-Tests gleich auswirkt. **[Philipp 17.11.]** bestätigt.

### 1.7 Ungültige Versuche (gilt für alle DynaMo-Tests, testspezifische Zusätze beim Test)
Ein Versuch ist **ungültig** und wird wiederholt (zählt nicht zu den 3), wenn:
1. Ausweichbewegung sichtbar ist (Becken hebt ab oder rotiert, Rumpf lehnt sich, Hände drücken/ziehen mit, wo nicht erlaubt). **[Konvention]**
2. Polster oder Gurt verrutscht oder der Gurt hatte Durchhang (Ruck am Beginn). **[Konvention]**
3. Der Gelenkwinkel während des Versuchs **sichtbar** vom Zielwinkel abweicht. Eine Gradgrenze wird nicht erfunden; bei den ersten Profilen beobachten und notieren, wie groß die Abweichung unter Last tatsächlich ist → **[offen]**.
4. Die maximale Anstrengung kürzer als ca. 2 s gehalten wurde oder der Spieler zu früh losließ. **[Konvention]**
5. Schmerz auftrat (dann zusätzlich Abbruchkriterien prüfen). **[Konvention]**
6. Der Wert offensichtlich ein Bedien-/Gerätefehler ist (z. B. Messung nicht gestartet). **[Konvention]**

Ungültige Versuche werden **mit Grund gespeichert, aber nicht gewertet** (nachvollziehbar, ehrliche Messqualität).

### 1.8 Abbruchkriterien (Test bzw. ganzes Profiling)
- Schmerz, den der Spieler als Schmerz (nicht als Anstrengung/Ziehen) beschreibt → Test auf dieser Seite abbrechen, Grund notieren. **[Konvention]** – Bei Spielern mit Leistenschmerzen korrelierte der Schmerz während der Testung bei den meisten Hüfttests nicht mit der Kraft (Rafn 2016); für ein Leistungsprofil gesunder Spieler gilt trotzdem: kein Test unter Schmerz.
- Akute Verletzung, Krampf, Schwindel, Unwohlsein → Abbruch. **[Konvention]**
- Kein Profiling bei aktueller Verletzung oder Beschwerden, die das Maximalkrafttesten verbieten – dann ist es keine Leistungsdiagnostik, sondern ein klinischer Termin. **[Konvention]**

### 1.9 Datenauswahl und CoV-Warnung
- **Gewertet wird der Bestwert** (höchste Peak Force bzw. bei Sprüngen der Versuch mit größter Sprunghöhe) der gültigen Versuche – wie im ACL-Modul. **Alle** gültigen Versuche werden gespeichert. **[Konvention]**
  - Hinweis aus der Literatur: Für den **CMJ** war in einer Meta-Analyse der **Mittelwert** empfindlicher für Veränderungen als der Bestwert (Claudino 2017, **[gesichert]** für Monitoring von Ermüdung/Superkompensation). Ob das für Off-Season-Profile mit Wochen Abstand gleich gilt, ist **[offen]**. Da alle Versuche gespeichert werden, kann Phase 3 das entscheiden. **[Philipp 17.11.]**: Bestwert anzeigen, alle Versuche speichern.
- **CoV-Warnung – nur bei den Krafttests (DynaMo, Soleus auf der Platte):** Variationskoeffizient (Stichproben-SD / Mittelwert × 100) der gültigen Versuche; Warnung „Messung wiederholen?“ bei **> 10 %** – wie ACL-Modul (Read S. 32). **[Konvention]** – Die 10 % sind eine Praxisgrenze aus dem ACL-Guide, keine für jeden Test validierte Grenze.
- **Bei CMJ und Drop Jump keine CoV-Warnung.** **[Philipp 17.11.]** Der CoV wird trotzdem aus den gespeicherten Versuchen berechenbar bleiben (nur nicht als Warnung angezeigt).
- Keine Literaturwerte für Typical Error, keine automatischen Messpaare (PHASE0).

### 1.10 Erfasste Stammwerte je Testung
| Wert | Einheit | Kennz. | Warum |
|---|---|---|---|
| Körpermasse | kg (0,1) | [Konvention] | Für N/kg und Nm/kg. **Immer mit demselben Gerät** (Vorschlag: Meloq-Platte im ruhigen Stand, zu Beginn) |
| Schussbein | links/rechts | PHASE0 | Seitenbeschreibung |
| Zeitpunkt seit letztem Spiel / intensivem Training | Stunden (Auswahl) | [plausibel] | Hamstringkraft im isometrischen Posterior-Chain-Test war 48 h nach einem Spiel noch nicht erholt, der CMJ schon (Franceschi 2025). **Voraussetzung ≥ 48 h** Abstand; Abstand immer dokumentieren **[Philipp 17.11.]** |
| Uhrzeit, Schuhwerk | – | [Konvention] | Re-Tests unter gleichen Bedingungen. Sprünge in **eigenen Trainings-/Hallenschuhen ohne Stollen**, beim Re-Test dieselben **[Philipp 17.11.]** |
| Testende Person | Kürzel | [Konvention] | Nachvollziehbarkeit |
| Abweichungen vom Protokoll | Freitext | [Konvention] | ehrliche Dokumentation |

---

## 2. Standard-Warm-up (für das ganze Profiling, ca. 10 min)

| Block | Inhalt | Dauer | Kennz. |
|---|---|---|---|
| 1. Allgemein | Ergometer oder lockeres Laufen, subjektiv locker bis mittel | 5 min | [gesichert] – aktives Aufwärmen verbessert die Leistung in der Mehrzahl der untersuchten Kriterien (Fradkin 2010) |
| 2. Dynamische Mobilisation | je 6–8 Wdh.: Beinpendel vor/zurück und seitlich, Ausfallschritt mit Rumpfrotation, Hüftöffner („Gate“), Wadenpumpe an der Wand | 3 min | [plausibel] – dynamisches Dehnen kurz vor Belastung: kleine Leistungsverbesserung; **kein statisches Dehnen ≥ 60 s pro Muskel** (Leistungsabfall dosisabhängig; Behm 2016) |
| 3. Aktivierung | 5 Kniebeugen ohne Last, 2 × 5 Pogo-Hops, 3 CMJ mit ca. 50 / 75 / 90 % | 2 min | [Konvention] – Aufbau nach dem RAMP-Prinzip (Jeffreys 2007, Fachartikel ohne DOI); die CMJ dienen zugleich als Familiarisierung für den ersten Test |

- Immer **dasselbe** Warm-up, auch beim Re-Test; Abweichungen notieren. **[Konvention]**
- Zwischen Warm-up und erstem CMJ **max. 2–3 min** (Körpermasse messen, Instruktion). **[plausibel]** – Effekte von Aufwärmen und dynamischem Dehnen sind zeitlich begrenzt (Behm 2016).
- Die isometrischen Tests brauchen kein eigenes Aufwärmen, weil jede Seite 2 submaximale Probeversuche hat (1.5). **[Konvention]**

---

## 3. Reihenfolge und Zeitplan (60 min, eine testende Person)

### 3.1 Reihenfolge und Begründung

| # | Test | Position | Begründung |
|---|---|---|---|
| 0 | Ankommen, Kontextformular, Körpermasse | – | Nicht ermüdend zuerst |
| 1 | Warm-up | – | |
| 2 | **CMJ** | Platte | Schnellkraft-/Sprungtests **vor** Maximalkraft- und ermüdenden Tests: Sprungleistung reagiert empfindlich auf Ermüdung (Claudino 2017 – CMJ wird gerade deshalb als Ermüdungsmarker verwendet). **[plausibel]**; übliche Testreihenfolge „nicht ermüdend → Schnellkraft → Maximalkraft → Ausdauer“ (NSCA-Lehrbuch Haff & Triplett) **[Konvention]** |
| 3 | **Drop Jump** | Box + Platte | Nach CMJ: höhere exzentrische Belastung; Box steht schon bereit, Platte bleibt liegen |
| (4) | *IMTP (wünschenswert)* | Platte + Zuggestell | **Nicht im 60-min-Core** **[Philipp 17.11.]** – eigener Termin oder Advanced (Rack vorhanden, siehe 6) |
| 5 | **Hamstrings 30°** | Rückenlage | Beginn des Liegeblocks – alle Rückenlage-Tests am Stück (ein Positionswechsel) |
| 6 | **Hüft-Abduktion** | Rückenlage | |
| 7 | **Hüft-Adduktion** | Rückenlage | |
| 8 | **Hüft-Extension** | Bauchlage | Absichtlich **nicht direkt nach** Hamstrings 30°: beide belasten die Hamstrings (bei Hüft-Extension mit gebeugtem Knie weniger). Dazwischen liegen ca. 10 min Abduktion/Adduktion. **[plausibel]** |
| 9 | **Knie-Extension 60°** | Sitz | Sitzblock am Ende |
| 10 | **Soleus Knie 90°** | Sitz | Gleiche Sitzposition, Aufbau auf der **Meloq-Platte** **[Philipp 17.11.]** |

Warum nicht die Krafttests zuerst? Isometrische Maximalversuche an 6 Muskelgruppen × 2 Seiten × 5 Versuche (inkl. Probe) erzeugen lokale Ermüdung genau in den Muskeln, die den Sprung tragen. Die umgekehrte Reihenfolge (Sprünge zuletzt) würde die Sprungwerte stärker verfälschen als umgekehrt. **[plausibel]**

### 3.2 Zeitplan (Schätzung – bei den ersten Profilen mit der Stoppuhr prüfen)

| Block | Inhalt | min | kumuliert |
|---|---|---|---|
| Ankommen | Aufklärung, Kontextformular, Körpermasse | 5 | 5 |
| Warm-up | Abschnitt 2 | 10 | 15 |
| CMJ | Instruktion, 1–2 Probe, 3 gültige (Pause 30–60 s) | 4 | 19 |
| Drop Jump | Instruktion, 2 Probe, 3 gültige (Pause 60 s) | 5 | 24 |
| Wechsel | auf die Liege, Gurte | 1 | 25 |
| Hamstrings 30° | je Seite: Aufbau + Hebelarm 1 min, 2 Probe, 3 gültige | 5 | 30 |
| Hüft-Abduktion | dto. | 5 | 35 |
| Hüft-Adduktion | dto. | 5 | 40 |
| Hüft-Extension | dto. + Umlagern | 5 | 45 |
| Knie-Extension 60° | dto. + Umsetzen | 5 | 50 |
| Soleus 90° | dto. + Aufbau | 6 | 56 |
| Abschluss | Kontrolle Vollständigkeit, Abmelden | 4 | **60** |

**Ergebnis:** Die Core-Batterie passt **knapp** in 60 min – **nur** wenn
- Liege, Gurte, Box und Platte **vor** dem Termin aufgebaut sind,
- Werte direkt während der Pausen eingetragen werden (die 30–60 s Pause reicht dafür),
- kein Test wiederholt werden muss (Puffer nur ca. 3–4 min).

Die Rechnung ist eine **Schätzung** (pro Seite: ca. 1 min Aufbau/Hebelarm + 2 Probeversuche + 3 × (5 s + 45 s Pause) ≈ 3–3,5 min; zwei Seiten werden teilweise verschränkt). **[offen]** – Es gibt **keinen Pilot** vorab **[Philipp 17.11.]**. Deshalb bei den **ersten 3 Profilen** die Zeit je Block stoppen und hier nachtragen; bis dahin gilt die Schätzung.

**IMTP passt nicht zusätzlich hinein** (Aufbau Gestell + Probe + 2–3 Versuche mit längeren Pausen ≈ 6–8 min). **Entscheidung: nicht im Core-60-min** **[Philipp 17.11.]**; eigener Termin oder Advanced-Stufe.

---

## 4. Krafttests mit DynaMo Plus (Core)

Für alle gilt Abschnitt 1. Hier nur das Testspezifische.

### 4.1 Knie-Extension 60° Knieflexion (sitzend)

| Punkt | Festlegung | Kennz. | Warum / Quelle |
|---|---|---|---|
| Ausgangsposition | Sitz am Liegenende, Kniekehle ca. 2 Finger vor der Kante, Hüfte ca. 90°, **Knie 60° Flexion** (Goniometer: Trochanter – Epicondylus lat. – Malleolus lat.), Hände an der Liegenkante seitlich neben dem Gesäß, anderes Bein hängt frei | [Konvention] | Gleich wie ACL-Modul, damit Testaufbau im Haus einheitlich ist. Hand- und Hüftposition beeinflussen das Ergebnis → fixieren |
| Warum 60° (geprüft 17.11.2026, F17) | **Entschieden: 60° bleibt** **[Philipp 17.11.]** | [plausibel] / [Konvention] | Die ACL-Begründung (Defizite nach VKB-OP bei 50–80°, Read S. 24) gilt für Fußballer ohne OP **nicht** und wird nicht übertragen. Geprüft wurden stattdessen: **(1) Kraft-Winkel-Kurve:** Bei Männern lag das isometrische Drehmoment-Maximum bei ca. 80°, bei 60° wurden im Mittel rund 94 % davon erreicht, bei 20–40° deutlich weniger (Marginson & Eston 2001, kleine Stichprobe). In gestreckteren Positionen ist die willkürliche Aktivierung des Quadrizeps geringer (Lanza 2017). 60° liegt also im Bereich hoher Kraft und ist nicht stark von der Aktivierung abhängig. **[plausibel]** **(2) Alternative 90°:** ebenfalls nahe am Maximum und vom Aufbau her einfacher (Unterschenkel senkrecht, Gurt waagrecht zum Liegenbein). Aber dann gäbe es zwei verschiedene Knie-Extensions-Tests im Haus. **(3) Ausschlaggebend:** Verletzt sich ein Spieler später am Knie, ist ein **Wert vor der Verletzung bei 60°** im ACL-Modul direkt als Ausgangswert nutzbar. Bei 90° wäre er das nicht. **[Konvention]** mit nachvollziehbarem Nutzen |
| Polster | Vorderseite Unterschenkel, **knapp proximal der Malleolen** | [Konvention] | langer Hebel, gut reproduzierbar; genaue Lage → Hebelarm |
| Gurt | um Unterschenkel und Polster, verankert hinten am Liegenbein, möglichst senkrecht zum Unterschenkel | [gesichert] Fixierung (1.3) / Anker [Philipp 17.11.] | |
| Winkel unter Last | Gurtdehnung lässt das Knie unter Last etwas strecken. Bei den ersten Profilen messen, ob der Winkel unter Last bei ca. 60° bleibt; ggf. Ausgangswinkel anpassen und dokumentieren | [offen] | Im ACL-Modul wird bei Knie-**Flexion** der Gurt 10° unter dem Zielwinkel gesetzt – diese Begründung (Transplantatschutz) trägt hier nicht |
| **Hebelarm** | Epicondylus lateralis femoris → Polstermitte | [Konvention] | 1.2 |
| Testspezifisch ungültig | Gesäß hebt ab, Oberkörper lehnt zurück, Hände ziehen an der Liege mehr als zum Abstützen | [Konvention] | |
| Rohwerte | Peak Force je Versuch (**N**), Hebelarm (**cm**), Kniewinkel Soll/Ist (°), Seite | | Nm, Nm/kg → Phase 3 |

### 4.2 Hamstrings 30° (Rückenlage, Hüfte 30°, Knie 30°)

| Punkt | Festlegung | Kennz. | Warum / Quelle |
|---|---|---|---|
| Ausgangsposition | Rückenlage, **Hüfte 30° Flexion, Knie 30° Flexion** (Goniometer), **Ferse** des Testbeins auf dem DynaMo, DynaMo liegt auf einer **stabilen Box/Erhöhung**; anderes Bein gestreckt auf der Liege; Arme vor der Brust verschränkt | [Konvention] Details; Position aus PHASE0 | In dieser Geometrie liegt der Unterschenkel etwa waagrecht, die Druckrichtung der Ferse (senkrecht nach unten) steht damit ungefähr senkrecht zum Unterschenkel |
| Warum 30/30 | Hamstrings in langer Muskellänge; Varianten „30-30“ und „90-90“ sind im Fußball verbreitet | [plausibel] | Systematische Übersicht zu isometrischen Posterior-Chain-Tests: 5 Testvarianten, darunter 30-30; Methoden **uneinheitlich**, klare Standardisierung empfohlen (Fahey 2025 – dort mit Kraftmessplatte, nicht DynaMo). Fixierte Dynamometrie der Hamstrings bei Nachwuchs-Fußballern war reliabel (Wollin 2016, andere Position). Begründung zur stärkeren Biceps-femoris-Aktivierung: aus PHASE0 übernommen, Primärquelle hier nicht erneut geprüft → **[offen]** |
| Fixierung | Box + DynaMo bilden die feste Unterlage (Spieler drückt nach unten); kein Gurt nötig, **DynaMo darf nicht rutschen** (rutschfeste Matte) | [Konvention] | |
| Instruktion zusätzlich | „Drück die Ferse **gerade nach unten** in das Gerät, Gesäß bleibt auf der Liege.“ | [Konvention] | |
| **Hebelarm** | Epicondylus lateralis femoris → Mitte der Ferse auf dem Polster | [Konvention] | Pflicht laut PHASE0 |
| Achtung Drehmoment | Der Test ist ein **Mehrgelenkstest**: Hüftextensoren arbeiten mit. Ein daraus berechnetes „Knie-Flexions-Drehmoment“ ist nur eine **Näherung**. Ein H/Q aus „Hamstrings 30° (mehrgelenkig)“ und „Quadrizeps 60° (eingelenkig)“ ist **kein klassischer H/Q** (verschiedene Winkel, verschiedene Tests) | [offen] → Phase 3 | Kraft ≠ Drehmoment; nicht als H/Q nach Isokinetik-Konvention verkaufen |
| Testspezifisch ungültig | Gesäß hebt ab (Brücke), Ferse rutscht vom Polster, Knie streckt sich sichtbar | [Konvention] | |
| Rohwerte | Peak Force (**N**), Hebelarm (**cm**), Hüft- und Kniewinkel Soll/Ist (°), Boxhöhe (cm) | | Boxhöhe nötig für Reproduzierbarkeit |

### 4.3 Hüft-Abduktion (Rückenlage, langer Hebel)

| Punkt | Festlegung | Kennz. | Warum / Quelle |
|---|---|---|---|
| Ausgangsposition | Rückenlage, Beine gestreckt, Hüfte neutral (0° Abd., 0° Rot. – Zehen zur Decke), Hände an der Liegenkante | [Konvention] | Wie ACL-Modul (Read S. 35); Rückenlage gut standardisierbar |
| Polster | lateral am Unterschenkel, **knapp proximal des Malleolus lateralis** | [Konvention] | langer Hebel, wie ACL-Modul |
| Gurt | horizontal, senkrecht zum Bein, an **Sprossenwand oder Rack seitlich** (nicht am Untersucher) | [gesichert] Fixierung / Anker [Philipp 17.11.] | Thorborg 2012/2013 |
| **Hebelarm** | Trochanter major → Polstermitte | [Konvention] | 1.2 |
| Testspezifisch ungültig | Becken kippt/hebt seitlich, Bein rotiert nach außen (Hüftflexoren übernehmen), Knie beugt sich | [Konvention] | |
| Rohwerte | Peak Force (**N**), Hebelarm (**cm**), Seite | | |
| Reliabilität | Isometrische Hüftkraft mit Gurt-fixiertem HHD bei Sportlern inter-tester reliabel (ICC 0,76–0,95) | [gesichert] (Thorborg 2012) | Werte aus der Studie werden **nicht** als Grenze übernommen |

### 4.4 Hüft-Adduktion (Rückenlage, langer Hebel, einseitig)

| Punkt | Festlegung | Kennz. | Warum / Quelle |
|---|---|---|---|
| Ausgangsposition | Rückenlage, Testbein gestreckt in Neutralstellung; das andere Bein so gelagert, dass Polster und Gurt Platz haben (z. B. leicht abgespreizt oder aufgestellt – **beim ersten Profil festlegen, notieren und dann fix**) | [offen] | |
| Polster | medial am Unterschenkel, **knapp proximal des Malleolus medialis** | [Konvention] | |
| Gurt | horizontal zu **Sprossenwand oder Rack auf der Gegenseite** | Anker [Philipp 17.11.] | |
| **Hebelarm** | Trochanter major → Polstermitte | [Konvention] | 1.2 |
| Warum einseitig | PHASE0 verlangt Seitenvergleich. Der beidseitige **Long-Lever-Squeeze** (beide Beine drücken gegen das Gerät) ist sehr präzise und erzeugt das höchste Drehmoment der üblichen Squeeze-Tests (Light & Thorborg 2016), **liefert aber keinen Seitenwert** | [gesichert] für die Squeeze-Eigenschaften; Wahl einseitig = [Konvention] | **[Philipp 17.11.]**: einseitig mit Gurt; Squeeze ggf. später als Advanced |
| Testspezifisch ungültig | Becken rotiert, Bein rotiert/beugt, Gegenbein drückt mit | [Konvention] | |
| Rohwerte | Peak Force (**N**), Hebelarm (**cm**), Lagerung Gegenbein (Text) | | |

### 4.5 Hüft-Extension (Bauchlage, Knie 90°)

| Punkt | Festlegung | Kennz. | Warum / Quelle |
|---|---|---|---|
| Ausgangsposition | Bauchlage, Becken auf der Liege, **Knie des Testbeins 90° gebeugt**, Hüfte 0°, Arme neben dem Kopf oder an der Liege | [plausibel] | Gebeugtes Knie verkürzt die Hamstrings → mehr Gluteus-Anteil; passt zu PHASE0 („Gluteal = Abduktion und Extension“). In Thorborgs Hüftkraft-Tests als Standardposition beschrieben (Volltext nicht geprüft → Details [offen]) |
| Polster | Rückseite Oberschenkel, **knapp proximal der Kniekehle** | [Konvention] | |
| Gurt | um Oberschenkel + Polster und **um die Liege** (Gurt läuft senkrecht nach unten – hier gut machbar) | [gesichert] Fixierung | |
| **Hebelarm** | Trochanter major → Polstermitte | [Konvention] | 1.2 |
| Testspezifisch ungültig | Lendenwirbelsäule geht ins Hohlkreuz / Becken hebt ab, Knie streckt sich, Oberkörper stemmt sich hoch | [Konvention] | |
| Rohwerte | Peak Force (**N**), Hebelarm (**cm**), Kniewinkel (°) | | |

### 4.6 Soleus, sitzend, Knie 90°, mit Gurt

Zwei Aufbauten waren denkbar; PHASE0 legt nur „sitzend, Knie 90°, mit Gurt“ fest. **Entscheidung: Variante A, Meloq-Platte** **[Philipp 17.11.]**. Variante B bleibt zur Dokumentation stehen.

| Punkt | Variante A: **Meloq-Platte** (Empfehlung) | Variante B: DynaMo |
|---|---|---|
| Aufbau | Fuß auf der Platte, **Oberschenkel waagrecht, Knie 90°**, Sprunggelenk leicht in Dorsalextension; Gurt/Bügel über dem distalen Oberschenkel, **an einem Anker, der nicht an der Messplatte selbst hängt** | Vorfuß auf festem Untergrund, DynaMo auf dem distalen Oberschenkel, Gurt über DynaMo zu einem Anker am Boden |
| Warum | So im ACL-Modul (Read S. 36) bereits im Haus etabliert. Ein sehr ähnlicher Aufbau (Kraftmessplatte, Knie über dem Vorfuß, Oberschenkel waagrecht, Vorspannung) zeigte **exzellente Test-Retest-Reliabilität** (Glaied & Whiteley 2025) **[plausibel]** – andere Vorrichtung als bei uns | Kein Platten-Aufbau nötig; aber Plantarflexion per HHD hat in der Meta-Analyse schlechte Übereinstimmung mit Referenzgeräten (Chamorro 2017) **[gesichert]** – Gurt mildert das, ist aber für diesen Test nicht geprüft **[offen]** |
| Physik-Falle | Wird der Gurt **um die Platte** gelegt, hebt sich die Kraft in der Platte auf (innere Kraft) → Messwert falsch. Anker muss **unter/außerhalb** der Messfläche sein **[gesichert]** (Physik) | – |
| Vorspannung | Gurt so spannen, dass in Ruhe eine kleine, **jedes Mal gleiche** Last auf der Platte liegt; Ruhewert notieren. Glaied & Whiteley nutzen eine feste Vorspannung, um Bewegung im Sprunggelenk zu verhindern **[plausibel]**. Den Ruhewert speichern wir, damit Phase 3 entscheiden kann, ob er abgezogen wird **[offen]** | – |
| Meloq-Funktion | Ob die Meloq-App im Standard-Abo einen isometrischen Test mit Peak Force speichert, ist **[offen]** (im ACL-Modul wird der Wert bereits erfasst – Philipp weiß, wie) | – |

Für beide Varianten:

| Punkt | Festlegung | Kennz. |
|---|---|---|
| Instruktion zusätzlich | „Drück über den **Fußballen** nach unten, als wolltest du die Ferse heben – das Knie drückt gegen den Gurt. Ferse bleibt dabei möglichst am Boden.“ | [Konvention] |
| Warum Knie 90° | Gebeugtes Knie entspannt den Gastrocnemius (zweigelenkig) → mehr Soleus-Anteil. Es misst trotzdem **alle** Plantarflexoren, „Soleus-Test“ ist eine Bezeichnung der Einfachheit halber (so auch Glaied & Whiteley 2025) | [plausibel] |
| Hebelarm | Laut Auftrag nur bei Knie- und Hüfttests Pflicht. Hier wird **Kraft (N)** gespeichert, **kein Drehmoment**. Optional später: Abstand Malleolus lat. → Metatarsalköpfchen, falls Phase 3 ein Sprunggelenks-Drehmoment will | [offen] |
| Testspezifisch ungültig | Gesäß hebt ab, Spieler drückt mit Oberkörper/Händen auf das Knie, Ferse hebt deutlich ab (Winkel ändert sich), Gurt verrutscht | [Konvention] |
| Rohwerte | Peak Force (**N**), Ruhewert/Vorspannung (**N**), Variante (A/B), Kniewinkel (°), Seite | |

---

## 5. Sprungtests mit Meloq EasyBase (Core)

**Was offen ist (darf nicht vorweggenommen werden):** Welche **Methode der Sprunghöhe** Meloq verwendet (Flugzeit oder Impuls bzw. Abfluggeschwindigkeit), wie Meloq den **RSI** beim Drop Jump definiert und welche Rohdaten der Export liefert → **[offen]**, Klärung mit Philipps Beispieldateien (PHASE0). Hinweis: Im ACL-Modul (ENTSCHEIDUNGEN 6.1/6.2) ist aus App-Screenshots „Sprunghöhe aus Flugzeit“ notiert – für das Football-Modul wird das erst mit den Exportdateien bestätigt.

**Stand 17.11.2026 – ein CMJ-Export liegt vor** (CSV, Meloq-App 1.2.4, vom 07.10.2026; bleibt außerhalb des Repos):
- **Exportformat geklärt:** Die CSV enthält **keine Kennzahlen**, nur die **Kraftkurve**: Kopfzeile mit Datum, App-Version, Körpermasse (in g), Abtastrate **400 Hz**, Bein; danach je Zeile die vier Kraftsensoren und die Summe je Seite (links/rechts) **in kg**. Sprunghöhe, Flugzeit, RSI usw. stehen **nicht** in der CSV, sie werden nur in der App angezeigt (oder im PDF/Excel-Export – noch nicht gesehen). **[gesichert]** (Datei geprüft)
- **Probeberechnung aus der Kurve:** Flugzeit ca. 445 ms (die App zeigte bei einem CMJ derselben Körpermasse 448 ms, ENTSCHEIDUNGEN 6.2) → Höhe nach Flugzeit ca. 24 cm; nach Impuls ca. 24 cm. **Bei diesem Sprung liegen beide Methoden so nahe beieinander, dass die Datei allein nicht zeigt, welche Methode die App verwendet.** **[offen]**
- **Was zur Klärung noch fehlt:** (1) die in der App angezeigte **Sprunghöhe** zu **genau diesem** Sprung (Screenshot) – dann lässt sich die Methode eindeutig zuordnen; (2) ein **Drop-Jump-Export** mit App-Screenshot (Kontaktzeit, RSI) für die RSI-Definition; (3) ob der **Excel-Export** die Kennzahlen enthält.
Warum das wichtig ist: Je nach Formel kann sich die berechnete Sprunghöhe **desselben** Sprungs um bis zu 15 cm unterscheiden (Eythorsdottir 2024, Systematische Übersicht) **[gesichert]**; Flugzeit- und Impulsmethode liefern systematisch verschiedene Werte (Moir 2008) **[gesichert]**. Deshalb: **Methode immer mitspeichern**, Werte verschiedener Methoden nie vergleichen.

### 5.1 Countermovement Jump (CMJ, beidbeinig)

| Punkt | Festlegung | Kennz. | Warum / Quelle |
|---|---|---|---|
| Vorbereitung | Platte auf hartem, ebenem Boden; Nullung laut Meloq-Anleitung, Spieler **nicht** auf der Platte | [Konvention] | Herstellerablauf; keine Funktion erfunden |
| Ausgangsposition | Je ein Fuß auf einer Platte, hüftbreit, **Hände an den Hüften** (bleiben dort), aufrecht | [gesichert] für den Effekt der Arme (vielfach belegt; die zitierte Einzelstudie ist ungeprüft) | Armschwung erhöht die Sprunghöhe deutlich; Hände an den Hüften isoliert die Beinleistung (Heishman 2020, Link ungeprüft); ACL-Modul gleich (Read S. 39) |
| Ruhiger Stand | **mind. 1 s völlig ruhig** stehen, bevor er springt (bzw. so lange, wie die Meloq-App verlangt) | [plausibel] | Aus der ruhigen Phase werden Körpergewicht und Bewegungsbeginn bestimmt; Unruhe verfälscht Impuls-basierte Werte (McMahon 2018) |
| Tiefe | **selbst gewählt**, nicht vorgegeben | [Konvention] | Üblich in der Literatur; vorgegebene Tiefe verändert die Strategie. Die Kontraktionszeit (Strategie) wird ohnehin gemessen |
| Instruktion (wörtlich) | „Hände an die Hüften. Steh ganz ruhig. Wenn du bereit bist: **schnell runter und so hoch wie möglich springen**. Beine in der Luft gestreckt lassen, auf beiden Platten landen.“ | [Konvention] | Instruktion beeinflusst Sprungstrategie → immer gleich |
| Probe | 3 CMJ im Warm-up (50/75/90 %) + **1 maximaler Probesprung** | [Konvention] | |
| Messversuche | **3 gültige**, max. 1 Zusatzversuch | [Konvention] | wie Krafttests |
| Pause | **30–60 s** (Spieler steht ab) | [Konvention] | |
| Ungültig | Hände lösen sich von den Hüften; **Beine in der Flugphase angezogen** oder Landung mit stark gebeugten Knien/auf der Ferse (verlängert die Flugzeit → **Flugzeitmethode überschätzt die Höhe**, Linthorne 2001/Moir 2008 **[gesichert]**); Landung neben der Platte; kein ruhiger Stand vor dem Sprung; Doppelbewegung (zweimal ausholen) | [Konvention] / [gesichert] wo angegeben | |
| Datenauswahl | Bestwert = Versuch mit größter Sprunghöhe; **alle Metriken dieses Versuchs** gespeichert; alle Versuche gespeichert | [Konvention] | siehe 1.9 / F8 |
| Rohwerte (je Versuch) | Sprunghöhe (cm) + **Methode** [offen]; Flugzeit (ms); Kontraktionszeit (ms); Net Impulse Propulsion L/R (Meloq-Einheit, Umrechnung in Ns erst nach Export-Klärung); Peak Force Propulsion L/R; alle weiteren Metriken, die der Export liefert | [offen] | ODS-Einordnung (Output/Driver/Strategy) wie im ACL-Modul – **Auswahl der Kennzahlen = Phase 3** |

### 5.2 Drop Jump (beidbeinig, eine feste Boxhöhe)

#### Vorschlag Boxhöhe: **30 cm effektive Fallhöhe**

- **Effektive Fallhöhe = Oberkante Box − Oberkante Platte.** Steht die Box am Boden und die Platten liegen am Boden, ist die Box um die Plattenhöhe **höher** zu wählen: **Boxhöhe = 30 cm + Plattenhöhe**. **[gesichert]** (Geometrie)
- **Erfassung während des Tests [Philipp 17.11.]:** Bei jeder Testung werden **Boxhöhe (cm)** und **Plattenhöhe (cm)** eingetragen; die App berechnet daraus die **effektive Fallhöhe** und zeigt sie an (Ziel: 30 cm). So bleibt jede Testung nachvollziehbar, auch wenn einmal eine andere Box verwendet wird.
- **Warum 30 cm:**
  - Read nennt für den **beidbeinigen** Drop Jump 30 cm, bezeichnet die Höhe aber selbst als „not well established“ (Read S. 48; im ACL-Modul so dokumentiert). **[Konvention]**
  - In Sport-Studien sind 30–40 cm üblich; höhere Fallhöhen erhöhen die exzentrische Belastung. Reliabilitätsdaten liegen u. a. für 30 cm vor (Handball, tragbare Kraftmessplatte), wobei bei American-Football-Spielern einzelne Metriken bei 30 und 45 cm CoV > 10 % zeigten. **[plausibel]** (Studien nur über Websuche gesichtet, Volltexte nicht geprüft)
  - Eine **individuelle optimale Fallhöhe** (stufenweise 30/40/50/60 cm) ist reliabel bestimmbar, kostet aber 10+ min → passt nicht in 60 min. **[plausibel]**
  - Die Höhe ist **nicht** mit dem einbeinigen Drop Jump des ACL-Moduls (15 cm) vergleichbar und soll es auch nicht sein.
- Die **effektive Fallhöhe wird bei jeder Testung gespeichert** (wie im ACL-Modul), damit eine spätere Änderung nachvollziehbar bleibt. **[Konvention]**

| Punkt | Festlegung | Kennz. | Warum / Quelle |
|---|---|---|---|
| Aufbau | Box stabil, rutschfest, Vorderkante ca. 10–20 cm hinter den Platten (so, dass beim Abtreten beide Füße auf den Platten landen) – beim ersten Profil festlegen und am Boden markieren | [Konvention] | |
| Ausgangsposition | Auf der Box, **Hände an den Hüften**, Zehen an der Kante | [Konvention] | wie CMJ |
| Absprung von der Box | **Abtreten** (ein Fuß nach vorne, „fallen lassen“), **nicht** hochspringen und **nicht** hinunterklettern | [plausibel] | Hochspringen erhöht die tatsächliche Fallhöhe, Hinuntersteigen senkt sie → Fallhöhe nicht mehr standardisiert |
| Instruktion (wörtlich) | „Hände an die Hüften. Lass dich von der Box fallen – nicht abspringen. Landen und **sofort so hoch wie möglich** springen, **mit so kurzem Bodenkontakt wie möglich**. Stell dir vor, der Boden ist heiß.“ | [plausibel] | Die Instruktion verändert Kontaktzeit und Höhe deutlich; „hoch **und** kurz“ ist die übliche Instruktion für RSI (Young 1995, Flanagan & Comyns 2008 – Links ungeprüft) |
| Probe | **2 Probesprünge** (der erste locker) | [Konvention] | Technik ist für viele Spieler neu |
| Messversuche | **3 gültige**, max. 1 Zusatzversuch | [Konvention] | |
| Pause | **60 s** | [Konvention] | höhere Belastung als CMJ |
| Ungültig | von der Box gesprungen oder gestiegen; Hände gelöst; Landung nicht mit beiden Füßen auf den Platten; **Beine in der Flugphase angezogen**; sichtbar langer Bodenkontakt mit „Absitzen“ (Spieler hat die Instruktion nicht umgesetzt – ein Hinweis, kein fixer ms-Wert); Ferse knallt / Spieler kann Landung nicht kontrollieren | [Konvention] | |
| Datenauswahl | Bestwert: **Versuch mit höchstem RSI** – aber RSI-Definition ist **[offen]**; bis zur Klärung Versuch mit dem höchsten Meloq-RSI, alle Versuche gespeichert | [offen] | Höhe und Kontaktzeit werden **immer zusammen** mit dem RSI gezeigt (PHASE0) |
| Rohwerte (je Versuch) | Sprunghöhe (cm) + Methode [offen]; Bodenkontaktzeit (ms); RSI (Meloq) + **Definition** [offen]; effektive Fallhöhe (cm); weitere Export-Metriken | [offen] | |

---

## 6. IMTP – Isometric Mid-Thigh Pull (wünschenswert, nicht im Core-60-min-Plan)

| Punkt | Festlegung | Kennz. | Warum / Quelle |
|---|---|---|---|
| Voraussetzung | **Festes Zuggestell** (Rack mit fixierbarer Stange über den Platten), Zughilfen (Straps). Ohne Gestell kein IMTP. Rack ist vorhanden **[Philipp 17.11.]**; ob es sich über den Platten fixieren lässt, beim ersten IMTP prüfen | [offen] | Comfort 2019 |
| Position | Stange auf Höhe Mitte Oberschenkel; **Knie ca. 125–145°, Hüfte ca. 140–150°** (Streckung = 180°), aufrechter Rumpf, Schultern über/knapp hinter der Stange | [gesichert] als Empfehlung der Standardisierungs-Übersicht (Comfort 2019) | Gelenkwinkel verändern Peak Force → Winkel je Spieler messen und speichern |
| Vorspannung | Leichte Vorspannung, ruhig; Körpergewicht in ruhigem Stand vorher | [plausibel] (Comfort 2019) | |
| Instruktion | „Drück mit den Beinen den Boden weg und zieh so **fest** du kannst – **Los** … Stopp.“ | [plausibel] | Nur Peak Force, keine RFD-Auswertung in V1 |
| Probe / Versuche | 2 submaximal (ca. 50 / 75 %), dann **2–3 maximal**, ca. 5 s | [plausibel] (Comfort 2019; Detailzahlen beim Schreiben nicht erneut im Volltext geprüft) | |
| Meloq-Funktion | Ob der Standard-Abo-Umfang eine IMTP-Auswertung (Peak Force, Nettokraft) bietet | [offen] | keine Gerätefunktion erfinden |
| Rohwerte | Peak Force (**N**, brutto) und Körpergewicht (N) → Nettokraft in Phase 3; Knie- und Hüftwinkel (°); Stangenhöhe (cm) | | |
| DSI | Nur **beschreibend**, keine Trainingsgrenzen (PHASE0) | – | |

---

## 7. Advanced-Tests (kurz)

### 7.1 Hamstrings 90° (Bauchlage)
- Bauchlage, **Knie 90°**, Polster an der Ferse/distalem Unterschenkel, Gurt um die Liege, isometrisch nach Abschnitt 1. **[Konvention]** – gleiche Position wie ACL-Test „Knie-Flexion 90°“, damit Aufbau im Haus einheitlich ist.
- **Hebelarm:** Epicondylus lateralis femoris → Polstermitte. Rohwerte: N, cm, Kniewinkel.
- Die ACL-Regel „Gurt 10° unter dem Zielwinkel“ (Transplantatschutz) gilt hier **nicht**; Ziel ist 90° **unter Last** → bei den ersten Messungen prüfen **[offen]**.
- Zweck: zweiter Punkt im Kraftprofil über die Muskellänge (30° vs. 90°). 90° gilt als reproduzierbarer (PHASE0). Ein Verhältnis 30°/90° ist eine Phase-3-Frage **[offen]**.

### 7.2 Gastrocnemius (Knie gestreckt)
- Knie gestreckt → zweigelenkiger Gastrocnemius trägt mehr bei. **[plausibel]**
- Aufbau ungeklärt: Fixierung bei gestrecktem Knie ist schwierig (PHASE0); möglich wäre stehend auf der Platte mit fixer Stange über den Schultern (IMTP-Gestell) – **nur wenn** Gestell vorhanden. **[offen]**
- Zusatznutzen gegenüber dem Soleus-Test ungeklärt (PHASE0) → erst nach den ersten Profilen und Phase 3 entscheiden.

---

## 8. Übersicht erfasste Rohwerte

| Test | Je Versuch | Je Seite/Testung | Einheit |
|---|---|---|---|
| alle DynaMo-Tests | Peak Force, gültig/ungültig + Grund | Hebelarm (Knie/Hüfte), Gelenkwinkel Soll/Ist, Polsterlage | N, cm, ° |
| Hamstrings 30° | dto. | + Boxhöhe unter dem DynaMo | cm |
| Hüft-Adduktion | dto. | + Lagerung Gegenbein | Text |
| Soleus | Peak Force | Variante A/B, Ruhewert/Vorspannung, Kniewinkel | N, ° |
| CMJ | Sprunghöhe, Flugzeit, Kontraktionszeit, Net Impulse L/R, Peak Force L/R, weitere Export-Metriken | Methode der Sprunghöhe | cm, ms, Meloq-Einheiten [offen] |
| Drop Jump | Sprunghöhe, Kontaktzeit, RSI, weitere Export-Metriken | Boxhöhe, Plattenhöhe → effektive Fallhöhe, RSI-Definition, Methode | cm, ms |
| IMTP | Peak Force | Körpergewicht, Knie-/Hüftwinkel, Stangenhöhe | N, ° , cm |
| Testung | – | Körpermasse, Schussbein, Abstand zu Spiel/Training, Uhrzeit, Schuhwerk, Testperson, Erstprofil ja/nein, Abweichungen | kg, h, Text |

Kraftwerte werden **in N** eingetragen. Der DynaMo **bleibt auf kg** **[Philipp 17.11.]**: Eingabe in kg wie angezeigt, die App rechnet mit **9,81** in N um (wie ACL-Modul) und speichert den eingegebenen kg-Wert mit.

---

## 9. Quellen

Geprüft über PubMed (Metadaten, teils Volltext) bzw. Verlagsseite. „Link ungeprüft“ = aus Fachwissen zitiert, DOI/Link in dieser Sitzung nicht verifiziert – vor Verwendung in Regeltexten prüfen.

**Kraft, Fixierung, Hebelarm**
- Chamorro C et al. *Absolute Reliability and Concurrent Validity of Hand Held Dynamometry and Isokinetic Dynamometry in the Hip, Knee and Ankle Joint: Systematic Review and Meta-analysis.* Open Med 2017;12:359–375. [doi:10.1515/med-2017-0052](https://doi.org/10.1515/med-2017-0052)
- Thorborg K, Bandholm T, Schick M, Jensen J, Hölmich P. *Hip strength assessment using handheld dynamometry is subject to intertester bias when testers are of different sex and strength.* Scand J Med Sci Sports 2013;23:487–493 (online 2011). [doi:10.1111/j.1600-0838.2011.01405.x](https://doi.org/10.1111/j.1600-0838.2011.01405.x)
- Thorborg K, Bandholm T, Hölmich P. *Hip- and knee-strength assessments using a hand-held dynamometer with external belt-fixation are inter-tester reliable.* Knee Surg Sports Traumatol Arthrosc 2013;21:550–555 (online 2012). [doi:10.1007/s00167-012-2115-2](https://doi.org/10.1007/s00167-012-2115-2)
- Thorborg K. *Strength measurements in athletes with groin pain.* Aspetar Sports Med J (Targeted Topic Groin Pain). [Link](https://journal.aspetar.com/en/journals/volume-3-targeted-topic-groin-pain/strength-measurements-in-athletes-with-groin-pain)
- Light N, Thorborg K. *The precision and torque production of common hip adductor squeeze tests used in elite football.* J Sci Med Sport 2016;19:888–892. [doi:10.1016/j.jsams.2015.12.009](https://doi.org/10.1016/j.jsams.2015.12.009)
- Rafn BS et al. *Hip Strength Testing of Soccer Players With Long-Standing Hip and Groin Pain: What are the Clinical Implications of Pain During Testing?* Clin J Sport Med 2016;26:210–215. [doi:10.1097/JSM.0000000000000227](https://doi.org/10.1097/JSM.0000000000000227)
- Wollin M, Purdam C, Drew MK. *Reliability of externally fixed dynamometry hamstring strength testing in elite youth football players.* J Sci Med Sport 2016;19:93–96. [doi:10.1016/j.jsams.2015.01.012](https://doi.org/10.1016/j.jsams.2015.01.012)
- Fahey JT et al. *Single joint posterior chain isometric testing using force plates: A systematic review of the methodologies and reliability of testing methods.* J Sports Sci 2025;44:797–819. [doi:10.1080/02640414.2025.2606621](https://doi.org/10.1080/02640414.2025.2606621)
- Franceschi A et al. *Post-Match Recovery Responses in Italian Serie A Youth Soccer Players.* Eur J Sport Sci 2025;25:e12297. [doi:10.1002/ejsc.12297](https://doi.org/10.1002/ejsc.12297)
- Glaied M, Whiteley R. *Excellent Reliability for an Instrumented Test of Ankle Plantarflexion Force.* Int J Sports Phys Ther 2025;20:253–264. [doi:10.26603/001c.128591](https://doi.org/10.26603/001c.128591)
- Maffiuletti NA et al. *Rate of force development: physiological and methodological considerations.* Eur J Appl Physiol 2016;116:1091–1116. [doi:10.1007/s00421-016-3346-6](https://doi.org/10.1007/s00421-016-3346-6)
- Marginson V, Eston R. *The relationship between torque and joint angle during knee extension in boys and men.* J Sports Sci 2001;19:875–880. [doi:10.1080/026404101753113822](https://doi.org/10.1080/026404101753113822)
- Lanza MB, Balshaw TG, Folland JP. *Do changes in neuromuscular activation contribute to the knee extensor angle-torque relationship?* Exp Physiol 2017;102:962–973. [doi:10.1113/EP086343](https://doi.org/10.1113/EP086343)
- McNair PJ et al. *Verbal encouragement: effects on maximum effort voluntary muscle action.* Br J Sports Med 1996;30:243–245. (Link ungeprüft)

**Sprünge, IMTP**
- Eythorsdottir I et al. *The Battle of the Equations: A Systematic Review of Jump Height Calculations Using Force Platforms.* Sports Med 2024;54:2771–2791. [doi:10.1007/s40279-024-02098-x](https://doi.org/10.1007/s40279-024-02098-x)
- Moir GL. *Three different methods of calculating vertical jump height from force platform data in men and women.* Meas Phys Educ Exerc Sci 2008;12:207–218. [doi:10.1080/10913670802349766](https://doi.org/10.1080/10913670802349766)
- Linthorne NP. *Analysis of standing vertical jumps using a force platform.* Am J Phys 2001;69:1198–1204. (Link ungeprüft)
- Claudino JG et al. *The countermovement jump to monitor neuromuscular status: A meta-analysis.* J Sci Med Sport 2017;20:397–402. [doi:10.1016/j.jsams.2016.08.011](https://doi.org/10.1016/j.jsams.2016.08.011)
- McMahon JJ et al. *Understanding the key phases of the countermovement jump force-time curve.* Strength Cond J 2018;40(4):96–106. (Link ungeprüft)
- Heishman AD et al. *Countermovement jump reliability performed with and without an arm swing in NCAA Division 1 intercollegiate basketball players.* J Strength Cond Res 2020;34:546–558. (Link ungeprüft)
- Young WB, Pryor JF, Wilson GJ. *Effect of instructions on characteristics of countermovement and drop jump performance.* J Strength Cond Res 1995;9:232–236. (Link ungeprüft)
- Flanagan EP, Comyns TM. *The use of contact time and the reactive strength index to optimize fast stretch-shortening cycle training.* Strength Cond J 2008;30(5):32–38. (Link ungeprüft)
- Drop-Jump-Reliabilität bei 30 cm (Handball, Preprint): [bioRxiv 2022.07.10.499453](https://www.biorxiv.org/content/10.1101/2022.07.10.499453.full.pdf) – nur gesichtet
- Comfort P, Dos'Santos T, Beckham GK, Stone MH, Guppy SN, Haff GG. *Standardization and Methodological Considerations for the Isometric Midthigh Pull.* Strength Cond J 2019;41(2):57–79. [doi:10.1519/SSC.0000000000000433](https://doi.org/10.1519/SSC.0000000000000433)

**Warm-up, Reihenfolge**
- Fradkin AJ, Zazryn TR, Smoliga JM. *Effects of warming-up on physical performance: a systematic review with meta-analysis.* J Strength Cond Res 2010;24:140–148. [doi:10.1519/JSC.0b013e3181c643a0](https://doi.org/10.1519/JSC.0b013e3181c643a0)
- Behm DG, Blazevich AJ, Kay AD, McHugh M. *Acute effects of muscle stretching on physical performance, range of motion, and injury incidence in healthy active individuals: a systematic review.* Appl Physiol Nutr Metab 2016;41:1–11. [doi:10.1139/apnm-2015-0235](https://doi.org/10.1139/apnm-2015-0235)
- Jeffreys I. *Warm-up revisited: the RAMP method of optimising warm-ups.* Professional Strength & Conditioning 2007;6:12–18. (Fachartikel, kein DOI)
- Haff GG, Triplett NT (Hrsg.). *Essentials of Strength Training and Conditioning*, 4. Aufl., NSCA/Human Kinetics 2016 – Kapitel Testreihenfolge. (Lehrbuch)

**Haus-intern**
- Read P. *Practitioner's Guide to ACL*, VALD 2024 (S. 32, 35, 36, 39, 48) – lokales PDF; `docs/ENTSCHEIDUNGEN.md` Abschnitte 5 und 6.

Bewusst **nicht** übernommen: Norm- und Mittelwerte aus den zitierten Studien (z. B. N/kg, Nm/kg, MDC), Asymmetrie-Grenzen (z. B. „> 15 %“), RFD-Empfehlungen.

---

## 10. Fragen an Philipp

Antworten von Philipp am 17.11.2026 eingetragen.

| # | Frage | Antwort / Stand |
|---|---|---|
| F1 | **Liege:** höhenverstellbar? Breit genug für Rückenlage mit Gurt seitlich? Zweite Liege/Bank für den Sitztest? | **Entschieden:** Liege ist **höhenverstellbar** **[Philipp 17.11.]**. Alle Liegetests auf dieser Liege; Sitztests am Liegenende, Füße hängen frei. Liegenhöhe je Test beim ersten Profil festlegen, notieren und dann fix |
| F2 | **Gurt-Anker** | **Entschieden:** Sprossenwand, Rack/Gestell und Liegenbeine/-rahmen vorhanden. Seitlich an Sprossenwand oder Rack, nach unten um die Liege, Knie-Extension ans hintere Liegenbein (1.3) |
| F3 | **Soleus:** Platte oder DynaMo? | **Entschieden:** **Meloq-Platte**. Gurt-Anker nicht an der Platte (4.6) |
| F4 | **Plattenhöhe / Box** | **Entschieden:** Boxhöhe und Plattenhöhe werden **bei jeder Testung eingetragen**, die App berechnet die effektive Fallhöhe (Ziel 30 cm) (5.2) |
| F5 | **Hüft-Adduktion** | **Entschieden:** einseitig mit Gurt; Lagerung des Gegenbeins beim ersten Profil festlegen (4.4) |
| F6 | **Reihenfolge der Tests** | **Entschieden:** wie in 3.1 |
| F7 | **Seitenreihenfolge** | **Entschieden:** immer Nicht-Schussbein zuerst |
| F8 | **Datenauswahl** | **Entschieden:** Bestwert anzeigen, alle Versuche speichern; Mittelwert ggf. in Phase 3 |
| F9 | **CoV-Warnung bei Sprüngen** | **Entschieden:** **keine** CoV-Warnung bei CMJ und Drop Jump; nur bei den Krafttests (1.9) |
| F10 | **IMTP** | **Entschieden:** nicht im 60-min-Core. Ein Rack ist vorhanden → IMTP später als eigener Termin/Advanced möglich; ob die Meloq-App IMTP im Standard-Abo kann, ist **offen** |
| F11 | **Abstand zu Spiel/Training** | **Entschieden:** ≥ 48 h, immer dokumentieren |
| F12 | **Familiarisierung** | **Entschieden:** nur Probeversuche, Erstprofil wird markiert |
| F13 | **Schuhwerk** | **Entschieden:** eigene Trainings-/Hallenschuhe ohne Stollen, beim Re-Test dieselben |
| F14 | **Meloq-Exportdateien** (CMJ, Drop Jump; CSV/Excel/Rohdaten) | **Teilweise:** CMJ-CSV vom 07.10. ausgewertet (Format = reine Kraftkurve, 400 Hz, kg; keine Kennzahlen). **Offen:** App-Screenshot zur Sprunghöhe desselben Sprungs, Drop-Jump-Export mit Screenshot, Excel-Export (5) |
| F15 | **DynaMo-Einheit** | **Entschieden:** bleibt **kg**; App rechnet mit 9,81 in N um (8) |
| F16 | **Pilot** | **Entschieden:** **kein Pilot**. Dafür bei den ersten 3 Profilen Zeiten, Gelenkwinkel unter Last, Box-Position und Lagerung Adduktion notieren und hier nachtragen |
| F17 | **Knie-Extension: anderer Winkel?** | **Geprüft** (4.1): **60° bleibt**, weil ein Wert vor einer Verletzung dann im ACL-Modul direkt nutzbar ist und 60° im Bereich hoher Kraft liegt. 90° wäre ebenfalls vertretbar und einfacher aufzubauen. **Entschieden: 60° bleibt** |

---

## 11. Nächste Schritte

1. Meloq-Beispieldateien (F14) → Abschnitt 5 (Methode, RSI, Rohwerte) schließen.
2. Erste 3 Profile → Zeitplan, Winkel unter Last, Box-Position, Lagerung Adduktion hier nachtragen.
3. Danach Phase 3: Kennzahlen (N, N/kg, Nm, Nm/kg, ODS-Auswahl), Interpretationsregeln mit Quelle – getrennt von diesem Messprotokoll.
