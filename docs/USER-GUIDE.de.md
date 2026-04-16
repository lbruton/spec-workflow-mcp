# Benutzerhandbuch

Ein umfassender Leitfaden zur Verwendung von Spec Workflow MCP für KI-gestützte Softwareentwicklung.

## Erste Schritte

### Was ist Spec Workflow MCP?

Spec Workflow MCP ist ein Model Context Protocol Server, der KI-Assistenten strukturierte, spezifikationsgetriebene Entwicklungstools bereitstellt. Es hilft Ihnen:

- Detaillierte Spezifikationen vor dem Coding zu erstellen
- Implementierungsfortschritt zu verfolgen
- Freigaben und Revisionen zu verwalten
- Projektdokumentation zu pflegen

### Grundlegender Workflow

1. **Spec erstellen** - Definieren, was Sie bauen möchten
2. **Überprüfen und freigeben** - Sicherstellen, dass Spezifikationen die Anforderungen erfüllen
3. **Aufgaben implementieren** - Implementierungsplan ausführen
4. **Fortschritt verfolgen** - Fertigstellungsstatus überwachen

## Spezifikationen erstellen

### Einfache Spec-Erstellung

Bitten Sie Ihren AI-Assistenten, eine Spec zu erstellen:

```
"Erstelle eine Spec für Benutzerauthentifizierung"
```

Die AI wird automatisch:

1. Ein Anforderungsdokument erstellen
2. Den technischen Ansatz entwerfen
3. Die Implementierung in Aufgaben aufteilen

### Detaillierte Spec-Erstellung

Mehr Kontext für bessere Spezifikationen bereitstellen:

```
"Erstelle eine Spec namens payment-gateway mit den folgenden Features:
- Kreditkartenverarbeitung
- PayPal-Integration
- Abonnementverwaltung
- Webhook-Behandlung für Zahlungsereignisse"
```

### Aus bestehenden Dokumenten

Verwenden Sie Ihre bestehenden PRD- oder Design-Dokumente:

```
"Erstelle eine Spec aus @product-requirements.md"
```

## Spezifikationen verwalten

### Alle Specs auflisten

```
"Liste alle meine Specs auf"
```

Gibt zurück:

- Spec-Namen
- Aktueller Status
- Fortschrittsprozentsatz
- Dokumentzustände

### Spec-Status prüfen

```
"Zeige mir den Status der user-auth Spec"
```

Bietet:

- Freigabestatus der Anforderungen
- Freigabestatus des Designs
- Aufgabenerledigungsfortschritt
- Detaillierte Aufgabenaufschlüsselung

### Spec-Dokumente anzeigen

Verwenden Sie das Dashboard oder die VSCode Extension, um:

- Anforderungsdokumente zu lesen
- Design-Dokumente zu überprüfen
- Aufgabenlisten zu durchsuchen
- Implementierungsfortschritt zu verfolgen

## Mit Aufgaben arbeiten

### Aufgabenstruktur

Aufgaben sind hierarchisch organisiert:

- **1.0** - Hauptabschnitte
  - **1.1** - Unteraufgaben
  - **1.2** - Unteraufgaben
    - **1.2.1** - Detaillierte Schritte

### Aufgaben implementieren

#### Methode 1: Direkte Implementierung

```
"Implementiere Aufgabe 1.2 aus der user-auth Spec"
```

#### Methode 2: Aus Dashboard kopieren

1. Dashboard öffnen
2. Zu Ihrer Spec navigieren
3. "Aufgaben"-Tab klicken
4. "Prompt kopieren"-Schaltfläche neben beliebiger Aufgabe klicken
5. In Ihr AI-Gespräch einfügen

#### Methode 3: Batch-Implementierung

```
"Implementiere alle Datenbank-Setup-Aufgaben aus user-auth Spec"
```

### Aufgabenstatus

Aufgaben haben drei Zustände:

- ⏳ **Ausstehend** - Nicht begonnen
- 🔄 **In Bearbeitung** - Wird derzeit bearbeitet
- ✅ **Abgeschlossen** - Fertig

## Freigabe-Workflow

### Freigabe anfordern

Wenn Dokumente zur Überprüfung bereit sind:

1. Die AI fordert automatisch Freigabe an
2. Dashboard zeigt Benachrichtigung
3. Dokument überprüfen
4. Feedback geben oder genehmigen

### Freigabeaktionen

- **Genehmigen** - Dokument so akzeptieren
- **Änderungen anfordern** - Feedback für Revision geben
- **Ablehnen** - Mit neuen Anforderungen von vorne beginnen

### Revisionsprozess

1. Spezifisches Feedback geben
2. AI überarbeitet das Dokument
3. Aktualisierte Version überprüfen
4. Genehmigen oder weitere Änderungen anfordern

## Bug-Workflow

### Bugs melden

```
"Erstelle einen Fehlerbericht für Login-Fehler bei Verwendung von SSO"
```

Erstellt:

- Bug-Beschreibung
- Reproduktionsschritte
- Erwartetes vs. tatsächliches Verhalten
- Priorität und Schweregrad

### Bug-Behebung

```
"Erstelle einen Fix für Bug #123 in user-auth Spec"
```

Generiert:

- Ursachenanalyse
- Fix-Implementierungsplan
- Testanforderungen
- Deployment-Schritte

## Template-System

### Templates verwenden

Spec Workflow enthält Templates für:

- Anforderungsdokumente
- Design-Dokumente
- Aufgabenlisten
- Fehlerberichte
- Steering-Dokumente

### Benutzerdefinierte Templates

Erstellen Sie Ihre eigenen Templates in `.specflow/templates/`:

```markdown
# Benutzerdefiniertes Feature-Template

## Überblick

[Feature-Beschreibung]

## User Stories

[User Stories]

## Technische Anforderungen

[Technische Details]
```

## Erweiterte Funktionen

### Steering-Dokumente

Hochrangige Projektleitlinien erstellen:

```
"Erstelle Steering-Dokumente für mein E-Commerce-Projekt"
```

Generiert:

- **Product Steering** - Vision und Ziele
- **Technical Steering** - Architekturentscheidungen
- **Structure Steering** - Projektorganisation

### Archivsystem

Erledigte Specs verwalten:

- Fertige Specs ins Archiv verschieben
- Aktiven Workspace sauber halten
- Jederzeit auf archivierte Specs zugreifen
- Specs bei Bedarf wiederherstellen

### Mehrsprachige Unterstützung

Oberflächensprache ändern:

1. **Dashboard**: Einstellungen → Sprache
2. **VSCode Extension**: Extension-Einstellungen → Sprache
3. **Konfigurationsdatei**: `lang = "de"` (oder anderer Sprachcode)

## Best Practices

### 1. Mit Steering-Dokumenten beginnen

Vor dem Erstellen von Specs:

```
"Erstelle Steering-Dokumente zur Projektleitung"
```

### 2. In Anforderungen spezifisch sein

Gut:

```
"Erstelle eine Spec für Benutzerauthentifizierung mit:
- E-Mail/Passwort-Login
- OAuth2 (Google, GitHub)
- 2FA-Unterstützung
- Passwort-Reset-Flow"
```

Nicht ideal:

```
"Erstelle eine Login-Spec"
```

### 3. Vor Implementierung überprüfen

Immer überprüfen und genehmigen:

1. Anforderungsdokument
2. Design-Dokument
3. Aufgabenaufschlüsselung

### 4. Inkrementell implementieren

- Aufgaben in Reihenfolge abschließen
- Nach jedem Hauptabschnitt testen
- Aufgabenstatus regelmäßig aktualisieren

### 5. Dashboard verwenden

Das Dashboard bietet:

- Visuelle Fortschrittsverfolgung
- Einfache Dokumentnavigation
- Schnelle Freigabeaktionen
- Echtzeit-Updates

## Häufige Workflows

### Feature-Entwicklung

1. Spec erstellen: `"Erstelle Spec für shopping-cart Feature"`
2. Anforderungen im Dashboard überprüfen
3. Genehmigen oder Änderungen anfordern
4. Design-Dokument überprüfen
5. Design genehmigen
6. Aufgaben sequenziell implementieren
7. Fortschritt im Dashboard verfolgen

### Fehlerkorrektur

1. Bug melden: `"Erstelle Fehlerbericht für Checkout-Fehler"`
2. Analysieren: `"Analysiere Ursache von Bug #45"`
3. Fix planen: `"Erstelle Fix-Plan für Bug #45"`
4. Implementieren: `"Implementiere den Fix"`
5. Verifizieren: `"Erstelle Testplan für Bug #45 Fix"`

### Refactoring

1. Spec erstellen: `"Erstelle Spec für Datenbankoptimierung"`
2. Aktuellen Zustand dokumentieren
3. Verbesserungen entwerfen
4. Migrationsschritte planen
5. Inkrementell implementieren
6. Jeden Schritt verifizieren

## Tipps und Tricks

### Effiziente Aufgabenverwaltung

- Aufgabengruppierung für verwandte Elemente verwenden
- Prompts aus Dashboard für Genauigkeit kopieren
- Aufgaben sofort nach Abschluss als erledigt markieren

### Dokumentverwaltung

- Anforderungen prägnant aber vollständig halten
- Akzeptanzkriterien einschließen
- Technische Einschränkungen im Design hinzufügen
- Externe Dokumente bei Bedarf referenzieren

### Zusammenarbeit

- Freigabekommentare für Feedback verwenden
- Dashboard-URL mit Team teilen
- Dokumente für externe Überprüfung exportieren
- Änderungen durch Revisionsverlauf verfolgen

## Integration mit AI-Assistenten

### Kontextbewusstsein

Der AI-Assistent automatisch:

- Kennt Ihre Projektstruktur
- Versteht Spec-Beziehungen
- Verfolgt Implementierungsfortschritt
- Hält Konsistenz aufrecht

### Natürlichsprachliche Befehle

Natürlich sprechen:

- "Welche Specs habe ich?"
- "Zeige mir, was noch zu tun ist"
- "Beginne mit der nächsten Aufgabe"
- "Aktualisiere das Design für bessere Leistung"

### Kontinuierlicher Workflow

Die AI hält Kontext zwischen Sitzungen:

- Dort weitermachen, wo Sie aufgehört haben
- Frühere Entscheidungen referenzieren
- Auf bestehender Arbeit aufbauen
- Projektkohärenz aufrechterhalten

## Verwandte Dokumentation

- [Workflow-Prozess](WORKFLOW.de.md) - Detaillierter Workflow-Leitfaden
- [Prompting-Leitfaden](PROMPTING-GUIDE.de.md) - Beispiel-Prompts
- [Oberflächen-Leitfaden](INTERFACES.de.md) - Dashboard- und Extension-Details
- [Tools-Referenz](TOOLS-REFERENCE.de.md) - Vollständige Tool-Dokumentation
