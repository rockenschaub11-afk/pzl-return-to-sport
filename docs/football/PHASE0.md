# Football Performance Profiling – Phase 0 (Klärung)

Stand: 12.11.2026. Ergebnis der Fragerunde mit Philipp. Grundlage: Projekt-Briefing „Football Performance Profiling“ und Konzeptanalyse vom 12.11.2026.
Phase 0 ist reine Klärung – kein Code. Nächster Schritt: Phase 1 (Testbatterie und Protokolle, `docs/football/PROTOKOLLE.md`).

## Rahmen

| Thema | Entscheidung |
|---|---|
| Name | **Football Performance Profiling** – eigenständiges Modul in der bestehenden App |
| Architektur | Gemeinsamer Kern (Design, Rechen-Grundfunktionen, Sicherung, Berichtsrahmen), Fachlogik getrennt (`src/football/` importiert nie aus der ACL-Logik). Kern herauslösen ohne Verhaltensänderung – ACL-Tests müssen unverändert grün bleiben |
| Zielgruppe | Einzelspieler (Schwerpunkt) und Vereine |
| Datenschutz | Kürzel wie bei ACL, Name nur vorübergehend im Bericht. Einwilligung zur Weitergabe regelt Philipp selbst |
| Sprachmodell | Kein Sprachmodell zur Laufzeit; Interpretationen sind feste, versionierte Regeltexte mit Quelle |
| Normwerte | Keine passenden Normwerte → Version 1 **ipsativ** (Verlauf beim selben Spieler), keine Perzentile oder Ränge, kein Gesamtscore |
| Stufen | Core / Advanced / Comprehensive anfangs nur **Messtiefe**; Version 1 = Core; jeder Test hat ein Feld „Stufe“ |
| Zeit | 60 Minuten je Core-Profiling, eine testende Person |
| Ablage | `docs/football/` im Repository |

## Geräte

| Gerät | Fakten | Folge |
|---|---|---|
| VALD **DynaMo Plus** | 225 Hz (VALD-Angabe); Gurte vorhanden | Nur **Peak Force**, **keine RFD**. **Hebelarm bei jedem Knie- und Hüfttest messen** → Drehmoment (Nm, Nm/kg) und H/Q möglich |
| Meloq **EasyBase** | 400 Hz, ±1 %, 1 N je Platte; Rohdaten-Export laut Datenblatt; **Standard-Abo** | Methode der Sprunghöhe (Flugzeit oder Impuls), RSI-Definition und Exportformat werden mit Philipps Beispieldateien geklärt |
| T-APEX | Laut Hersteller Sprint mit Widerstand oder Unterstützung; keine unabhängige Validierung der Zeitmessung gefunden; wird nicht geprüft | **Sprint nicht in Version 1** |

## Testauswahl Core (Protokolle folgen in Phase 1)

| Test | Stufe | Begründung |
|---|---|---|
| Knie-Extension, 60° Knieflexion | Core | Wie ACL-Modul |
| **Hamstrings, 30°** (Rückenlage, Hüfte und Knie je 30°) | Core | Lange Muskellänge, stärkere Aktivierung des Biceps femoris, Seitenunterschiede besser sichtbar; Normdaten an Profis in dieser Position. 90° ist reproduzierbarer, aber ACL-Begründung (Hamstring-Graft) trägt hier nicht |
| Hamstrings, 90° | Advanced | Kraftprofil über die Muskellänge |
| Hüft-Abduktion | Core | „Gluteal“ laut Philipp = Abduktion **und** Extension |
| Hüft-Extension | Core | dto. |
| Hüft-Adduktion | Core | Im Fußball Standard (Leiste); neu gegenüber Briefing |
| Soleus, sitzend, Knie 90°, mit Gurt | Core | Kraft übersteigt das Halten von Hand → nur fixiert |
| Gastrocnemius, Knie gestreckt | Advanced | Fixierung schwieriger, Zusatznutzen ungeklärt |
| CMJ (beidbeinig) | Core | Schnellkraft; Interpretation nach ODS, nicht nur Sprunghöhe |
| Drop Jump (eine feste Boxhöhe) | Core | Reaktivkraft; Höhe und Kontaktzeit immer zusammen mit RSI |
| IMTP | wünschenswert | Ganzkörper-Maximalkraft, Voraussetzung für DSI (nur beschreibend, Trainingsgrenzen nicht validiert) |
| Sprint, COD, Ausdauer | später | Sprint erst mit validierter Zeitmessung |

## Bewertung und Messqualität

- **Seitenvergleich:** links/rechts; Schussbein wird erfasst. Unterschiede mit Richtung beschreiben („rechts 8 % höher“), keine pauschalen Asymmetrie-Grenzen, keine Diagnose.
- **Messqualität:** nur die **Streuung der Versuche** innerhalb der Sitzung (CoV-Warnung wie im ACL-Modul). Keine Literaturwerte für Typical Error, keine automatischen Messpaare. Veränderungen beim Re-Test werden **beschreibend** ausgewiesen.
- **Kontext pro Assessment:** kurzes Formular mit Auswahllisten (Trainingsalter, Belastungsverträglichkeit, Verletzungsgeschichte, Trainingszustand, Position, Zeitrahmen, Umfang des Mannschaftstrainings, Länge der Off-Season). Pflicht für Trainingsprioritäten, sonst „Kontext fehlt – keine Priorisierung möglich“.

## Offen

- [ ] Meloq-Beispieldateien (CMJ, Drop Jump, SL-CMJ mit Fantasiekürzel; CSV, Excel, Rohdaten), Methode der Sprunghöhe, RSI-Definition
- [ ] Was mit dem fertigen, nicht committeten P1-Code (ACL-Kapazitäten-Modell) passiert
- [ ] Name der Gesamt-App (bleibt vorerst „PZL Return-to-Sport“)
