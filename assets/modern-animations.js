/**
 * MODERNE ANIMATIONS & EFFECTS HANDLER
 * Lovable.ai / Vercel / Apple Style Animationen
 */

class ModernAnimations {
  constructor() {
    this.init();
  }

  init() {
    this.initScrollAnimations();
    this.initParallax();
    this.initSmoothScroll();
    this.initHoverEffects();
  }

  /**
   * Scroll Animationen mit IntersectionObserver
   */
  initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          // Delay basierend auf Index für gestaffelte Animationen
          setTimeout(() => {
            entry.target.classList.add('is-visible');
          }, index * 100);
          
          // Optional: Observer deaktivieren nach Animation
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Alle Elemente mit data-animate beobachten
    document.querySelectorAll('[data-animate]').forEach(element => {
      element.classList.add('animate-on-scroll');
      observer.observe(element);
    });
  }

  /**
   * Parallax Effekt für Hintergründe
   */
  initParallax() {
    const parallaxElements = document.querySelectorAll('[data-parallax]');
    
    if (parallaxElements.length === 0) return;

    let ticking = false;

    const updateParallax = () => {
      const scrolled = window.pageYOffset;

      parallaxElements.forEach(element => {
        const speed = parseFloat(element.dataset.parallax) || 0.5;
        const offset = scrolled * speed;
        element.style.setProperty('--parallax-offset', `${offset}px`);
      });

      ticking = false;
    };

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(updateParallax);
        ticking = true;
      }
    }, { passive: true });
  }

  /**
   * Smooth Scroll für Anker-Links
   */
  initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        const target = document.querySelector(href);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      });
    });
  }

  /**
   * Hover Effekte mit Cursor-Tracking
   */
  initHoverEffects() {
    const cards = document.querySelectorAll('[data-hover-effect="glow"]');
    
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        card.style.setProperty('--mouse-x', `${x}px`);
        card.style.setProperty('--mouse-y', `${y}px`);
      });
    });
  }
}

/**
 * Blob Animationen Generator
 */
class BlobAnimation {
  constructor(container) {
    this.container = container;
    this.createBlobs();
  }

  createBlobs() {
    const blobCount = 3;
    const colors = [
      'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)',
      'linear-gradient(135deg, #84cc16 0%, #4d7c0f 100%)',
      'linear-gradient(135deg, #65a30d 0%, #3f6212 100%)'
    ];

    for (let i = 0; i < blobCount; i++) {
      const blob = document.createElement('div');
      blob.className = `blob blob-${i + 1}`;
      blob.style.background = colors[i];
      this.container.appendChild(blob);
    }
  }
}

/**
 * Glassmorphism Effect Handler
 */
class GlassMorphism {
  static apply(element) {
    element.style.background = 'rgba(255, 255, 255, 0.1)';
    element.style.backdropFilter = 'blur(20px) saturate(150%)';
    element.style.webkitBackdropFilter = 'blur(20px) saturate(150%)';
    element.style.border = '1px solid rgba(255, 255, 255, 0.2)';
    element.style.borderRadius = '24px';
    element.style.boxShadow = '0 8px 32px 0 rgba(31, 38, 135, 0.37)';
  }
}

/**
 * Reveal Text Animation
 */
class RevealText {
  constructor(element) {
    this.element = element;
    this.text = element.textContent;
    this.animate();
  }

  animate() {
    this.element.innerHTML = '';
    const chars = this.text.split('');
    
    chars.forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.opacity = '0';
      span.style.transform = 'translateY(20px)';
      span.style.display = 'inline-block';
      span.style.transition = `all 0.5s ease ${index * 0.03}s`;
      this.element.appendChild(span);
      
      setTimeout(() => {
        span.style.opacity = '1';
        span.style.transform = 'translateY(0)';
      }, 50);
    });
  }
}

/**
 * Gradient Animation für Buttons
 */
class GradientButton {
  constructor(button) {
    this.button = button;
    this.init();
  }

  init() {
    this.button.addEventListener('mouseenter', () => {
      this.button.style.background = 'linear-gradient(135deg, #84cc16 0%, #4d7c0f 100%)';
      this.button.style.transform = 'translateY(-2px)';
      this.button.style.boxShadow = '0 0 30px rgba(163, 230, 53, 0.6)';
    });

    this.button.addEventListener('mouseleave', () => {
      this.button.style.background = 'linear-gradient(135deg, #a3e635 0%, #65a30d 100%)';
      this.button.style.transform = 'translateY(0)';
      this.button.style.boxShadow = '0 0 20px rgba(163, 230, 53, 0.5)';
    });
  }
}

/**
 * Initialisierung
 */
document.addEventListener('DOMContentLoaded', () => {
  // Haupt-Animationen initialisieren
  new ModernAnimations();

  // Blob Animationen für Hero-Sections
  document.querySelectorAll('[data-blob-container]').forEach(container => {
    new BlobAnimation(container);
  });

  // Glassmorphism auf Elemente anwenden
  document.querySelectorAll('[data-glass]').forEach(element => {
    GlassMorphism.apply(element);
  });

  // Text Reveal Animationen
  document.querySelectorAll('[data-reveal-text]').forEach(element => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          new RevealText(element);
          observer.unobserve(element);
        }
      });
    }, { threshold: 0.5 });
    
    observer.observe(element);
  });

  // Gradient Buttons
  document.querySelectorAll('[data-gradient-button]').forEach(button => {
    new GradientButton(button);
  });
});

/**
 * Utility: Stagger Animation Helper
 */
function staggerAnimation(elements, delay = 100) {
  elements.forEach((element, index) => {
    setTimeout(() => {
      element.classList.add('is-visible');
    }, index * delay);
  });
}

/**
 * Export für Verwendung in anderen Scripts
 */
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    ModernAnimations,
    BlobAnimation,
    GlassMorphism,
    RevealText,
    GradientButton,
    staggerAnimation
  };
}

