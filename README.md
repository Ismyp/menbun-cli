# 🏀 Menbun Teamwear - Shopify Theme

Ein spezialisiertes Shopify Theme für Teamwear und Sportbekleidung mit integrierten Kalkulatoren für verschiedene Sportarten.

## 🚀 Features

### ⚽ Sport-spezifische Kalkulatoren
- **Basketball** 🏀 - Speziell für Basketball-Teams optimiert
- **Fußball** ⚽ - Professionelle Fußball-Teamausstattung
- **Volleyball** 🏐 - Komplette Volleyball-Ausrüstung
- **Handball** 🤾 - Handball-spezifische Konfiguration
- **Tischtennis** 🏓 - Tischtennis-Teamwear Lösungen

### 💡 Technische Features
- ✨ **Responsive Design** - Optimiert für alle Bildschirmgrößen
- 🛒 **Shopify Cart Integration** - Vollständige Warenkorb-Integration
- 🎨 **Sport-spezifisches Theming** - Individuelle Farben und Designs pro Sport
- 🌍 **Multi-Language Support** - Unterstützung für mehrere Sprachen (Deutsch-fokussiert)
- ⚡ **Performance Optimiert** - Schnelle Ladezeiten und optimierte Assets
- 🔧 **Modulares Design** - Einfach erweiterbar und anpassbar

### 🎯 Kalkulator-Features
- **Design-Auswahl** - Verschiedene Teamwear-Designs pro Sport
- **Größen-Konfiguration** - Detaillierte Größenverteilung
- **Mengen-basierte Rabatte** - Automatische Preisberechnung
- **Personalisierung** - Name und Nummer-Optionen
- **Echtzeitpreise** - Live-Preisberechnung basierend auf Menge
- **Warenkorb-Integration** - Direkte Hinzufügung zum Shopify-Warenkorb

## 🛠️ Installation

### Voraussetzungen
- Shopify CLI installiert
- Node.js (falls erforderlich)
- Git

### Setup
```bash
# Repository klonen
git clone https://github.com/Ismyp/menbun-cli.git
cd menbun-cli

# Shopify CLI starten
shopify theme dev
```

## 📁 Projekt-Struktur

```
theme-cli/
├── assets/              # CSS, JavaScript, SVG-Icons
├── blocks/              # Wiederverwendbare Blöcke
├── config/              # Theme-Konfiguration
├── layout/              # Layout-Templates
├── locales/             # Übersetzungen
├── sections/            # Theme-Sections
│   ├── teamwear-calculator-basketball.liquid
│   ├── teamwear-calculator-fussball.liquid
│   ├── teamwear-calculator-volleyball.liquid
│   ├── teamwear-calculator-handball.liquid
│   └── teamwear-calculator-tischtennis.liquid
├── snippets/            # Code-Snippets
└── templates/           # Seiten-Templates
    ├── page.basketball.liquid
    ├── page.fussball.liquid
    ├── page.volleyball.liquid
    ├── page.handball.liquid
    └── page.tischtennis.liquid
```

## 🎨 Anpassung

### Neue Sportart hinzufügen
1. Neue Section-Datei erstellen: `sections/teamwear-calculator-[sport].liquid`
2. Neues Template erstellen: `templates/page.[sport].liquid`
3. Sport-spezifische Konfiguration in der Section anpassen
4. CSS-Variablen für Farben definieren

### Design anpassen
- **CSS**: `assets/teamwear-calculator.css`
- **JavaScript**: `assets/teamwear-calculator.js`
- **Farben**: Sport-spezifische CSS-Variablen in den Templates

## 🧪 Development

### Lokale Entwicklung
```bash
# Development Server starten
shopify theme dev

# Theme zu Shopify hochladen
shopify theme push
```

### Debugging
- Browser-Konsole für JavaScript-Logs aktiviert
- Detaillierte Error-Handling implementiert
- Cache-Busting für Development-Updates

## 📱 Browser-Unterstützung

- ✅ Chrome (neueste Versionen)
- ✅ Firefox (neueste Versionen)
- ✅ Safari (neueste Versionen)
- ✅ Edge (neueste Versionen)
- ✅ Mobile Browser (iOS Safari, Chrome Mobile)

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature-Branch (`git checkout -b feature/neue-funktion`)
3. Committe deine Änderungen (`git commit -am 'Neue Funktion hinzugefügt'`)
4. Push zum Branch (`git push origin feature/neue-funktion`)
5. Erstelle einen Pull Request

## 📄 Lizenz

Dieses Projekt ist unter der MIT-Lizenz lizenziert.

## 🆘 Support

Bei Fragen oder Problemen:
- Erstelle ein Issue in diesem Repository
- Kontaktiere das Entwicklungsteam

---

**Entwickelt mit ❤️ für professionelle Teamwear-Lösungen**

*Menbun Teamwear Theme - Wo Sport auf Technology trifft!* 🚀 