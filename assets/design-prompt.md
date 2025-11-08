# 🎨 Modern Shopify Frontend Setup Prompt

Ziel:
Bringe das aktuelle Shopify-Projekt auf den modernen Design-Stand von Lovable.ai, mit folgenden Merkmalen:
- Hintergrundbilder mit Overlays und weichen Übergängen
- Blur- und Glassmorphism-Effekte
- Gradient-Texturen, Blob-Animationen, Parallax
- Weiche Scroll- & Reveal-Animationen
- Moderne UI-Komponenten wie Buttons, Cards, Modals im Apple / Vercel / Lovable-Stil

## Schritte, die du automatisch ausführen sollst:

1. **Installiere oder initialisiere moderne Frontend-Tools:**
   - Prüfe, ob TailwindCSS vorhanden ist. Falls nicht, installiere und konfiguriere es für das Shopify-Theme.
   - Füge Framer Motion oder AOS hinzu für Animationen (`npm install aos` oder `npm install framer-motion` je nach Setup).
   - Integriere `MagicUI` oder `shadcn/ui` Komponenten, wenn das Projekt es erlaubt. Verwende sie für Buttons, Cards etc.

2. **Füge Utility-Stile hinzu:**
   - Aktiviere `backdrop-filter` und `blur` in der Tailwind Config.
   - Erweitere Tailwind um Farbverläufe, Radial-Gradients und Glassmorphism-Utilities.
   - Ergänze globale Styles um:
     - Blur-Klassen (`bg-white/10 backdrop-blur-lg`)
     - Sanfte Schattierungen
     - Rounded Corners (`rounded-2xl` bis `rounded-3xl`)

3. **Optimiere bestehende Sektionen:**
   - Ersetze langweilige statische Layouts durch moderne Komponenten:
     - Hero-Section → mit Bild, Gradient-Overlay, animierten Blobs
     - Buttons → mit Hover Glow und Gradient Fill
     - Cards → mit Blur und Soft Shadow
   - Lass dabei bestehende Shopify-Datenstrukturen (Liquid-Templates, Schema-Settings) unverändert.

4. **Implementiere Animationen & Scroll-Effekte:**
   - Nutze IntersectionObserver oder AOS, um Inhalte beim Scrollen dezent einblenden zu lassen.
   - Parallax für Hintergrundbilder hinzufügen.
   - Sanftes Fade-in oder Slide-up für Hero-Text & CTAs.

5. **Globale Verbesserung:**
   - Entferne unnötige Inline-Stile.
   - Nutze konsistente Tailwind-Klassen für Layout & Farben.
   - Verwende Responsive Breakpoints für Mobilgeräte.

6. **Ziel-Style-Vorgabe:**
   - Ästhetik: Vercel, Lovable, Apple.
   - Farben: dunkle Hintergründe mit hellen Akzenten oder umgekehrt.
   - Bewegungen: Smooth, Low-Contrast, High-Depth.

## Wichtig:
- Führe die Installation direkt im integrierten Terminal aus.
- Wenn Dependencies fehlen, richte `package.json` automatisch ein.
- Verwende keine neuen Themes – arbeite auf der bestehenden Shopify-Struktur.
- Nach Abschluss generiere eine kurze Zusammenfassung, was geändert wurde und wo sich die neuen Styles befinden.
