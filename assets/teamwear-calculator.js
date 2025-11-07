/**
 * Teamwear Calculator JavaScript
 * Handles all interactions and cart integration
 */

class TeamwearCalculator {
  constructor(sectionId) {
    this.section = document.querySelector(`[data-section="${sectionId}"]`);
    if (!this.section) return;
    
    this.config = window.teamwearConfig || {};
    this.productCache = {};
    
    this.state = {
      selectedProduct: null,
      selectedVariantId: null,
      selectedColor: null,
      selectedQuantity: 0,
      selectedDiscount: 0,
      basePrice: 0,
      finalPrice: 0,
      discountSettings: null,
      productVariants: [],
      productImages: [],
      availableColors: [],
      personalization: [],
      teamLogo: null,
      teamName: ''
    };
    
    this.elements = {
      designs: this.section.querySelectorAll('.teamwear-design__input'),
      colorSelection: this.section.querySelector('.teamwear-color-selection'),
      colorsContainer: this.section.querySelector('.teamwear-colors'),
      colorsPlaceholder: this.section.querySelector('.teamwear-colors__placeholder'),
      colorPreviewImage: this.section.querySelector('[data-color-preview]'),
      teamSection: this.section.querySelector('.teamwear-team-section'),
      teamLogoInput: this.section.querySelector('[data-team-logo]'),
      teamNameInput: this.section.querySelector('[data-team-name]'),
      quantitySection: this.section.querySelector('.teamwear-quantity-section'),
      quantityInput: this.section.querySelector('[data-quantity-input]'),
      personalizationContent: this.section.querySelector('.teamwear-personalization__content'),
      personalizationList: this.section.querySelector('[data-players-body]'),
      totalPrice: this.section.querySelector('[data-total-price]'),
      priceDetails: this.section.querySelector('[data-price-details]'),
      submitButton: this.section.querySelector('.teamwear-submit'),
      messages: this.section.querySelector('.teamwear-messages')
    };
    
    this.init();
  }
  
  init() {
    this.preloadAllProducts();
    this.attachEventListeners();
    this.initializeDynamicDiscounts();
    
    const checkedDesign = this.section.querySelector('.teamwear-design__input:checked');
    if (checkedDesign) {
      setTimeout(() => checkedDesign.dispatchEvent(new Event('change')), 100);
    } else if (this.elements.designs.length > 0) {
        this.elements.designs[0].checked = true;
      setTimeout(() => this.elements.designs[0].dispatchEvent(new Event('change')), 100);
    }
    
    this.updateUI();
  }
  
  initializeDynamicDiscounts() {
    this.state.useDynamicDiscounts = this.section.dataset.useDynamicDiscounts === 'true';
    this.state.maxDiscountLimit = parseInt(this.section.dataset.maxDiscountLimit) || 25;
    
    try {
      const tiersData = this.section.dataset.discountTiers;
      if (tiersData) {
        this.state.discountTiers = JSON.parse(tiersData.trim().replace(/&quot;/g, '"'));
        if (!Array.isArray(this.state.discountTiers)) throw new Error('Invalid tiers');
        this.state.discountTiers.sort((a, b) => b.quantity - a.quantity);
        if (!this.state.useDynamicDiscounts && this.state.discountTiers.length > 0) {
          this.state.useDynamicDiscounts = true;
        }
      }
    } catch (error) {
      console.error('Error parsing discount tiers:', error);
      this.state.useDynamicDiscounts = false;
      this.state.discountTiers = [];
    }
  }
  
  attachEventListeners() {
    this.initDesignImageSliders();
    
    // Design selection - SOFORTIGES visuelles Feedback!
      this.elements.designs.forEach(input => {
        input.addEventListener('change', (e) => {
          const target = e.target;
        if (!(target instanceof HTMLInputElement && target.checked)) return;
        
        // NUR State-Update - KEINE DOM-Operationen! Radio-Button wird durch CSS sofort visuell angezeigt
        const productId = target.dataset.productId;
        const productHandle = target.dataset.productHandle;
        if (!productId || !productHandle) return;
        
        this.state.selectedProduct = { id: productId, handle: productHandle, name: '' };
        this.state.selectedColor = null;
        this.state.selectedVariantId = null;
            this.state.basePrice = parseFloat(target.dataset.basePrice) || 0;
            this.state.discountSettings = {
              discountPerTier: parseInt(target.dataset.discountPerTier) || 5,
              tierSize: parseInt(target.dataset.tierSize) || 10,
              maxDiscount: parseInt(target.dataset.maxDiscount) || 50
            };
            
        // SOFORT Ladezeichen anzeigen - ohne Verzögerung!
        this.showColorLoading();
        
        // Alle DOM-Operationen komplett asynchron - Event-Handler ist fertig!
        Promise.resolve().then(() => {
          const designElement = target.closest('.teamwear-design');
          if (designElement) {
            const firstImage = designElement.querySelector('.teamwear-design__image');
            if (firstImage && this.elements.colorPreviewImage) {
              this.elements.colorPreviewImage.src = firstImage.src;
              this.elements.colorPreviewImage.alt = firstImage.alt;
            }
            const nameElement = designElement.querySelector('.teamwear-design__name');
            if (nameElement) this.state.selectedProduct.name = nameElement.textContent;
          }
          
          if (this.productCache[productHandle]) {
            this.applyProductDataFromCache(productHandle);
          } else {
            this.loadProductVariants(productHandle).catch(err => console.error('Error:', err));
          }
          this.updateUI();
        });
      });
    });
    
    // Team section
    if (this.elements.teamSection) {
      const logoCheckbox = this.elements.teamSection.querySelector('[data-team-option="logo"]');
      const logoUpload = this.elements.teamSection.querySelector('.teamwear-team-section__logo-upload');
      if (logoCheckbox && logoUpload) {
        logoCheckbox.addEventListener('change', (e) => {
          logoUpload.style.display = e.target.checked ? 'block' : 'none';
          this.calculateDiscountAndPrice();
          this.updateUI();
        });
      }
      
      const teamnameCheckbox = this.elements.teamSection.querySelector('[data-team-option="teamname"]');
      const teamnameInput = this.elements.teamSection.querySelector('.teamwear-team-section__teamname-input');
      if (teamnameCheckbox && teamnameInput) {
        teamnameCheckbox.addEventListener('change', (e) => {
          teamnameInput.style.display = e.target.checked ? 'block' : 'none';
          this.calculateDiscountAndPrice();
          this.updateUI();
        });
      }
      
      if (this.elements.teamLogoInput) {
        this.elements.teamLogoInput.addEventListener('click', (e) => {
          e.preventDefault();
          this.openCloudinaryUpload();
        });
      }
      
      if (this.elements.teamNameInput) {
        this.elements.teamNameInput.addEventListener('input', (e) => {
          this.state.teamName = e.target.value;
        });
      }
    }
    
    // Quantity input
    if (this.elements.quantitySection && this.elements.quantityInput) {
      if (this.elements.teamSection && this.elements.teamSection.style.display !== 'none') {
        this.elements.quantitySection.style.display = 'block';
      }
      
      this.elements.quantityInput.addEventListener('input', (e) => {
        this.state.selectedQuantity = parseInt(e.target.value) || 10;
        this.calculateDiscountAndPrice();
          this.updateUI();
          this.buildPersonalizationList();
        });
      
      this.state.selectedQuantity = parseInt(this.elements.quantityInput.value) || 10;
      this.buildPersonalizationList();
    }
    
    // Personalization checkboxes
    this.section.querySelectorAll('[data-personalization-option]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
          this.buildPersonalizationList();
        this.calculateDiscountAndPrice();
        this.updateUI();
      });
    });
    
    // Color selection
    if (this.elements.colorsContainer) {
      this.elements.colorsContainer.addEventListener('change', (e) => {
        if (e.target.classList.contains('teamwear-color__input')) {
          const color = this.state.availableColors.find(c => 
            c.name.toLowerCase().trim() === e.target.dataset.colorName.toLowerCase().trim() ||
            c.variantId.toString() === e.target.dataset.variantId
          );
          if (color) {
            this.selectColor(color);
          } else {
            const variant = this.state.productVariants.find(v => v.id.toString() === e.target.dataset.variantId);
            this.selectColor({ name: e.target.dataset.colorName, value: e.target.dataset.colorValue, variantId: e.target.dataset.variantId, variant });
          }
        }
      });
    }
    
    // Submit button
    if (this.elements.submitButton) {
      this.elements.submitButton.addEventListener('click', () => this.handleSubmit());
    }
  }
  
  calculateDiscount(quantity) {
    if (this.state.useDynamicDiscounts && this.state.discountTiers?.length > 0) {
      return this.calculateDynamicDiscount(quantity);
    }
    if (!this.state.discountSettings) return 0;
    const { discountPerTier, tierSize, maxDiscount } = this.state.discountSettings;
    return Math.min(Math.floor(quantity / tierSize) * discountPerTier, maxDiscount);
  }
  
  calculateDynamicDiscount(quantity) {
    let applicableDiscount = 0;
    for (const tier of this.state.discountTiers) {
      if (quantity >= tier.quantity && tier.discount > applicableDiscount) {
        applicableDiscount = tier.discount;
      }
    }
    return Math.min(applicableDiscount, this.state.maxDiscountLimit || 25);
  }
  
  calculateAdditionalPrices() {
    let additionalPricePerPiece = 0;
    
    // Team-Logo Preis pro Stück
    const teamLogoCheckbox = this.section.querySelector('[data-team-option="logo"]');
    if (teamLogoCheckbox && teamLogoCheckbox.checked) {
      const price = parseFloat(teamLogoCheckbox.dataset.price) || 0;
      additionalPricePerPiece += price;
    }
    
    // Teamname Preis pro Stück
    const teamNameCheckbox = this.section.querySelector('[data-team-option="teamname"]');
    if (teamNameCheckbox && teamNameCheckbox.checked) {
      const price = parseFloat(teamNameCheckbox.dataset.price) || 0;
      additionalPricePerPiece += price;
    }
    
    // Personalisierungs-Preise pro Stück
    const numberChestCheckbox = this.section.querySelector('[data-personalization-option="number-chest"]');
    if (numberChestCheckbox && numberChestCheckbox.checked) {
      const price = parseFloat(numberChestCheckbox.dataset.price) || 0;
      additionalPricePerPiece += price;
    }
    
    const numberBackCheckbox = this.section.querySelector('[data-personalization-option="number-back"]');
    if (numberBackCheckbox && numberBackCheckbox.checked) {
      const price = parseFloat(numberBackCheckbox.dataset.price) || 0;
      additionalPricePerPiece += price;
    }
    
    const playerNamesCheckbox = this.section.querySelector('[data-personalization-option="playernames"]');
    if (playerNamesCheckbox && playerNamesCheckbox.checked) {
      const price = parseFloat(playerNamesCheckbox.dataset.price) || 0;
      additionalPricePerPiece += price;
    }
    
    return additionalPricePerPiece;
  }
  
  calculateDiscountAndPrice() {
    if (!this.state.basePrice || !this.state.selectedQuantity) return;
    this.state.selectedDiscount = this.calculateDiscount(this.state.selectedQuantity);
    this.state.finalPrice = this.state.basePrice * (1 - this.state.selectedDiscount / 100);
    
    // Zusätzliche Preise pro Stück hinzufügen
    const additionalPricePerPiece = this.calculateAdditionalPrices();
    this.state.finalPrice += additionalPricePerPiece;
  }
  
  showColorLoading() {
    // Zeige Ladezeichen SOFORT - ohne Verzögerung!
    if (this.elements.colorSelection) this.elements.colorSelection.style.display = 'none';
    if (this.elements.colorsPlaceholder) {
      this.elements.colorsPlaceholder.style.display = 'block';
      this.elements.colorsPlaceholder.classList.add('loading');
      const placeholderText = this.elements.colorsPlaceholder.querySelector('.teamwear-placeholder-text');
      if (placeholderText) placeholderText.textContent = 'Farben werden geladen...';
    }
    if (this.elements.colorsContainer) this.elements.colorsContainer.innerHTML = '';
  }
  
  applyProductDataFromCache(productHandle) {
    const product = this.productCache[productHandle];
    if (!product) return;
    
    this.state.productVariants = product.variants || [];
    this.state.productImages = product.images || [];
    this.state.availableColors = this.extractColorsFromVariants(product.variants, product.images);
    
    // Farben geladen - verstecke Ladezeichen, zeige Farben
    if (this.elements.colorSelection) this.elements.colorSelection.style.display = 'grid';
    if (this.elements.colorsPlaceholder) {
      this.elements.colorsPlaceholder.style.display = 'none';
      this.elements.colorsPlaceholder.classList.remove('loading');
    }
    
    this.renderColorOptions(this.state.availableColors);
    
    if (this.elements.quantitySection) {
      this.elements.quantitySection.style.display = 'block';
      if (this.state.selectedQuantity === 0 && this.elements.quantityInput) {
        this.state.selectedQuantity = parseInt(this.elements.quantityInput.value) || 10;
      }
    }
    
    if (this.elements.teamSection) this.elements.teamSection.style.display = 'block';
    
    // Personalisierung-Sektion anzeigen und initialisieren
    if (this.elements.personalizationContent) {
      this.elements.personalizationContent.style.display = 'block';
      if (this.state.selectedQuantity > 0) {
        this.buildPersonalizationList();
      }
    }
    
    if (this.state.availableColors.length > 0) {
      const firstColor = this.state.availableColors[0];
      this.selectColor(firstColor);
      const firstColorInput = this.elements.colorsContainer.querySelector('.teamwear-color__input');
      if (firstColorInput) firstColorInput.checked = true;
    }
    
  }
  
  async preloadAllProducts() {
    const productHandles = new Set();
    this.elements.designs.forEach(input => {
      if (input.dataset.productHandle) productHandles.add(input.dataset.productHandle);
    });
    
    Promise.all(Array.from(productHandles).map(async (handle) => {
      try {
        const response = await fetch(`/products/${handle}.js`);
        if (response.ok) this.productCache[handle] = await response.json();
      } catch (error) {
        console.error(`Failed to preload ${handle}:`, error);
      }
    }));
  }
  
  async loadProductVariants(productHandle) {
    if (!productHandle) return;
    if (this.productCache[productHandle]) {
      this.applyProductDataFromCache(productHandle);
      return;
    }
    
    try {
      const response = await fetch(`/products/${productHandle}.js`);
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      const product = await response.json();
      this.productCache[productHandle] = product;
      this.applyProductDataFromCache(productHandle);
      this.updateUI();
    } catch (error) {
      console.error('Error loading variants:', error);
      // Zeige Fehler im Placeholder
      if (this.elements.colorsPlaceholder) {
        this.elements.colorsPlaceholder.style.display = 'block';
        const placeholderText = this.elements.colorsPlaceholder.querySelector('.teamwear-placeholder-text');
        if (placeholderText) placeholderText.textContent = 'Fehler beim Laden der Farboptionen';
      }
      this.showMessage('Fehler beim Laden der Farboptionen', 'error');
    }
  }
  
  selectColor(color) {
    this.state.selectedColor = color;
    
    const colorVariants = this.state.productVariants.filter(v => {
      const normalizedColor = color.name.toLowerCase().trim();
      return [v.option1, v.option2, v.option3].some(opt => 
        opt && opt.toLowerCase().trim() === normalizedColor
      );
    });
    
    const variant = colorVariants[0] || color.variant;
    if (!variant) {
      console.error('Keine Variante gefunden für Farbe:', color);
      return;
    }
    
    if (!variant.id) {
      console.error('Variante hat keine ID:', variant);
      return;
    }
    
    this.state.selectedVariantId = variant.id.toString();
    this.state.basePrice = variant.price / 100.0;
    
    console.log('Farbe ausgewählt:', color.name, 'Variant ID:', this.state.selectedVariantId);
    
    let foundImage = null;
    for (const v of colorVariants) {
      if (v.featured_image) {
        foundImage = typeof v.featured_image === 'string' ? v.featured_image : (v.featured_image.src || v.featured_image);
        break;
      }
      if (v.image_id) {
        const variantImage = this.state.productImages.find(img => {
          const imgObj = typeof img === 'string' ? { id: null } : img;
          return imgObj.id === v.image_id;
        });
        if (variantImage) {
          foundImage = typeof variantImage === 'string' ? variantImage : (variantImage.src || variantImage);
          break;
        }
      }
      if (this.state.productImages?.length > 0) {
        for (const img of this.state.productImages) {
          const imgObj = typeof img === 'string' ? { variant_ids: [], src: img } : img;
          if (imgObj.variant_ids?.includes(v.id)) {
            foundImage = imgObj.src || imgObj.url || (typeof img === 'string' ? img : null);
            break;
          }
        }
        if (foundImage) break;
      }
    }
    
    if (foundImage && this.elements.colorPreviewImage) {
      const imageUrl = typeof foundImage === 'object' ? (foundImage.src || foundImage.url || foundImage) : foundImage;
      this.elements.colorPreviewImage.src = imageUrl;
      this.elements.colorPreviewImage.alt = color.name;
      this.elements.colorPreviewImage.style.opacity = '0';
      setTimeout(() => this.elements.colorPreviewImage.style.opacity = '1', 50);
    } else {
      const colorImage = this.findImageByColor(color.name);
      if (colorImage && this.elements.colorPreviewImage) {
        this.elements.colorPreviewImage.src = colorImage.src;
        this.elements.colorPreviewImage.alt = colorImage.alt || color.name;
        this.elements.colorPreviewImage.style.opacity = '0';
        setTimeout(() => this.elements.colorPreviewImage.style.opacity = '1', 50);
      }
    }
    
    this.calculateDiscountAndPrice();
    this.updateUI();
  }
  
  findImageByColor(colorName) {
    if (!this.state.productImages?.length) return null;
    
    const normalizedColor = colorName.toLowerCase().trim();
    for (const image of this.state.productImages) {
      const imageObj = typeof image === 'string' ? { src: image } : image;
      const altText = imageObj.alt || '';
      if (altText && (altText.toLowerCase().trim() === normalizedColor || altText.toLowerCase().includes(normalizedColor))) {
        return { src: imageObj.src || image, alt: altText };
      }
    }
    
    const firstImage = this.state.productImages[0];
    const firstImageObj = typeof firstImage === 'string' ? { src: firstImage } : firstImage;
    return { src: firstImageObj.src || firstImage, alt: firstImageObj.alt || colorName };
  }
  
  extractColorsFromVariants(variants, images) {
    if (!variants?.length) return [];
    
    const colorMap = new Map();
    const sizeKeywords = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl', 'größe', 'size'];
    
    const optionSet1 = new Set();
    const optionSet2 = new Set();
    const optionSet3 = new Set();
    
    variants.forEach(v => {
      if (v.option1) optionSet1.add(v.option1.toLowerCase().trim());
      if (v.option2) optionSet2.add(v.option2.toLowerCase().trim());
      if (v.option3) optionSet3.add(v.option3.toLowerCase().trim());
    });
    
    let colorOptionIndex = 1;
    if (optionSet1.size > 1 && !Array.from(optionSet1).some(v => sizeKeywords.includes(v))) {
      colorOptionIndex = 1;
    } else if (optionSet2.size > 1 && !Array.from(optionSet2).some(v => sizeKeywords.includes(v))) {
      colorOptionIndex = 2;
    } else if (optionSet3.size > 1 && !Array.from(optionSet3).some(v => sizeKeywords.includes(v))) {
      colorOptionIndex = 3;
    }
    
    variants.forEach(variant => {
      let colorOption = colorOptionIndex === 1 ? variant.option1 : 
                       (colorOptionIndex === 2 ? variant.option2 : variant.option3);
      
      if (colorOption && !sizeKeywords.includes(colorOption.toLowerCase().trim())) {
        const normalizedColor = colorOption.toLowerCase().trim();
        if (!colorMap.has(normalizedColor)) {
          colorMap.set(normalizedColor, {
            name: colorOption,
            value: this.getColorValue(colorOption),
            variantId: variant.id,
            variant: variant
          });
        }
      }
    });
    
    let colors = Array.from(colorMap.values());
    
    if (colors.length === 0 && variants.length > 0) {
      const uniqueOptions = new Set();
      variants.forEach(v => {
        if (v.option1 && !sizeKeywords.includes(v.option1.toLowerCase().trim())) {
          uniqueOptions.add(v.option1);
        }
      });
      colors = Array.from(uniqueOptions).map(option => {
        const variant = variants.find(v => v.option1 === option) || variants[0];
        return {
          name: option,
          value: this.getColorValue(option),
          variantId: variant.id,
          variant: variant
        };
      });
    }
    
    return colors;
  }
  
  getColorValue(colorName) {
    const colorMap = {
      'schwarz': '#000000', 'weiß': '#ffffff', 'rot': '#ef4444', 'blau': '#3b82f6',
      'grün': '#22c55e', 'gelb': '#eab308', 'orange': '#f97316', 'lila': '#a855f7',
      'grau': '#6b7280', 'pink': '#ec4899', 'türkis': '#14b8a6', 'braun': '#a16207',
      'navy': '#1e3a8a', 'maroon': '#7f1d1d'
    };
    return colorMap[colorName.toLowerCase().trim()] || '#f3f4f6';
  }
  
  renderColorOptions(colors) {
    if (!this.elements.colorsContainer) return;
    
    this.elements.colorsContainer.innerHTML = '';
    
    if (colors.length === 0) {
      if (this.elements.colorsPlaceholder) {
        this.elements.colorsPlaceholder.style.display = 'block';
        this.elements.colorsContainer.style.display = 'none';
      }
      return;
    }
    
    if (this.elements.colorsPlaceholder) this.elements.colorsPlaceholder.style.display = 'none';
    this.elements.colorsContainer.style.display = 'flex';
    
    colors.forEach((color, index) => {
      const colorId = `color-${color.variantId}-${index}`;
      const colorElement = document.createElement('div');
      colorElement.className = 'teamwear-color';
      colorElement.innerHTML = `
        <input type="radio" name="teamwear-color" id="${colorId}" class="teamwear-color__input"
               data-variant-id="${color.variantId}" data-color-name="${color.name}" data-color-value="${color.value}"
               ${index === 0 ? 'checked' : ''}>
        <label for="${colorId}" class="teamwear-color__label">
          <div class="teamwear-color__swatch" style="--color-value: ${color.value}; background-color: ${color.value};"></div>
          <span class="teamwear-color__name">${color.name}</span>
        </label>
      `;
      this.elements.colorsContainer.appendChild(colorElement);
    });
  }
  
  buildPersonalizationList() {
    if (!this.elements.personalizationList) return;
    
    // Hole aktuelle Menge
    const count = Math.max(this.state.selectedQuantity || 0, 1);
    const availableSizes = this.getAvailableSizes();
    
    // Leere Tabelle
    this.elements.personalizationList.innerHTML = '';
    this.state.personalization = [];
    
    // Erstelle Zeilen
    for (let i = 1; i <= count; i++) {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${i}</td>
        <td data-cell-name><input type="text" placeholder="Name" data-index="${i - 1}" data-type="name"></td>
        <td data-cell-number><input type="text" placeholder="Nr." data-index="${i - 1}" data-type="number"></td>
        <td><select data-index="${i - 1}" data-type="size">${availableSizes.map(s => `<option value="${s}">${s}</option>`).join('')}</select></td>
      `;
      this.elements.personalizationList.appendChild(tr);
      this.state.personalization.push({ name: '', number: '', size: '' });
    }
    
    // Spalten-Sichtbarkeit basierend auf Checkboxen
    const showName = !!this.section.querySelector('[data-personalization-option="playernames"]')?.checked;
    const showNumber = !!this.section.querySelector('[data-personalization-option="number-chest"]')?.checked || 
                      !!this.section.querySelector('[data-personalization-option="number-back"]')?.checked;
    
    const nameCol = this.section.querySelector('[data-col-name]');
    const numberCol = this.section.querySelector('[data-col-number]');
    
    if (nameCol) nameCol.style.display = showName ? '' : 'none';
    if (numberCol) numberCol.style.display = showNumber ? '' : 'none';
    
    this.elements.personalizationList.querySelectorAll('[data-cell-name]').forEach(td => {
      td.style.display = showName ? '' : 'none';
    });
    
    this.elements.personalizationList.querySelectorAll('[data-cell-number]').forEach(td => {
      td.style.display = showNumber ? '' : 'none';
    });
    
    // Event-Listener für Inputs
    this.elements.personalizationList.querySelectorAll('input, select').forEach(input => {
      input.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        const type = e.target.dataset.type;
        if (this.state.personalization[index]) {
        this.state.personalization[index][type] = e.target.value;
        }
      });
      
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        const type = e.target.dataset.type;
        if (this.state.personalization[index]) {
        this.state.personalization[index][type] = e.target.value;
        }
      });
    });
  }
  
  getAvailableSizes() {
    const sizes = new Set();
    const sizeKeywords = ['xs', 's', 'm', 'l', 'xl', 'xxl', 'xxxl'];
    
    if (this.state.productVariants?.length > 0) {
      this.state.productVariants.forEach(variant => {
        [variant.option1, variant.option2, variant.option3].forEach(option => {
          if (option) {
            const normalized = option.toLowerCase().trim();
            if (sizeKeywords.includes(normalized) || /^\d+$/.test(normalized)) {
              sizes.add(option);
            }
          }
        });
      });
    }
    
    if (sizes.size === 0) return ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    
    const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
    return Array.from(sizes).sort((a, b) => {
      const aIndex = sizeOrder.indexOf(a.toUpperCase());
      const bIndex = sizeOrder.indexOf(b.toUpperCase());
      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;
      return a.localeCompare(b);
    });
  }
  
  updateUI() {
    const isValid = this.validateForm();
    
    if (this.state.selectedQuantity > 0 && this.state.finalPrice > 0) {
      // finalPrice ist bereits der Preis pro Stück (inklusive Zusatzoptionen)
      const totalPrice = this.state.finalPrice * this.state.selectedQuantity * 100;
      
      if (this.elements.totalPrice) {
        this.elements.totalPrice.textContent = this.formatMoney(totalPrice);
      }
      if (this.elements.priceDetails) {
        const basePriceWithoutAddons = this.state.basePrice * (1 - this.state.selectedDiscount / 100);
        const additionalPricePerPiece = this.calculateAdditionalPrices();
        let detailsText = `(${this.state.selectedQuantity} × ${this.formatMoney(basePriceWithoutAddons * 100)}`;
        if (this.state.selectedDiscount > 0) {
          detailsText += ` mit ${this.state.selectedDiscount}% Rabatt`;
        }
        if (additionalPricePerPiece > 0) {
          detailsText += ` + ${this.formatMoney(additionalPricePerPiece * 100)} Zusatzoptionen pro Stück`;
        }
        detailsText += ')';
        this.elements.priceDetails.textContent = detailsText;
      }
    }
    
    if (this.elements.submitButton) {
      this.elements.submitButton.disabled = !isValid;
    }
    
    // Personalisierungs-Tabelle aktualisieren
    if (this.elements.personalizationList && this.state.selectedQuantity > 0) {
      this.buildPersonalizationList();
    }
  }
  
  validateForm() {
    const hasProduct = this.state.selectedProduct !== null;
    const hasColor = this.state.selectedColor !== null && this.state.selectedVariantId !== null;
    const hasQuantity = this.state.selectedQuantity > 0;
    return hasProduct && hasColor && hasQuantity;
  }
  
  formatMoney(cents) {
    if (window.Shopify?.formatMoney) {
      return window.Shopify.formatMoney(cents, this.config.moneyFormat);
    }
    return `€${(cents / 100).toFixed(2)}`;
  }
  
  async handleSubmit() {
    if (!this.state.selectedProduct) {
      this.showMessage(this.config.translations.selectDesign || 'Bitte wähle ein Design aus', 'error');
      return;
    }
    
    if (!this.state.selectedVariantId) {
      this.showMessage(this.config.translations.selectColor || 'Bitte wähle eine Farbe aus', 'error');
      return;
    }
    
    if (!this.state.selectedQuantity || this.state.selectedQuantity <= 0) {
      this.showMessage(this.config.translations.correctSizes || 'Bitte gib mindestens eine Größe an', 'error');
      return;
    }
    
    if (!this.validateForm()) {
      this.showMessage(this.config.translations.correctSizes || 'Bitte korrigiere die Größenangaben', 'error');
      return;
    }
    
    this.elements.submitButton.disabled = true;
    this.elements.submitButton.classList.add('loading');
    this.elements.submitButton.textContent = this.config.translations.addingToCart || 'Wird hinzugefügt...';
    
    try {
      // Sammle Personalisierungsdaten
      const personalProps = this.formatPersonalizationProperties();
      
      let properties = {
        '_teamwear_set': 'true',
        'Design': this.state.selectedProduct.name || 'Unbekanntes Design',
        'Farbe': this.state.selectedColor ? this.state.selectedColor.name : 'Nicht ausgewählt',
        'Menge': this.state.selectedQuantity.toString(),
        'Basispreis pro Stück': this.formatMoney(this.state.basePrice * 100),
        'Rabatt': this.state.selectedDiscount > 0 ? `${this.state.selectedDiscount}%` : 'Kein Rabatt',
        'Preis pro Stück (nach Rabatt)': this.formatMoney((this.state.basePrice * (1 - this.state.selectedDiscount / 100)) * 100),
        ...personalProps
      };
      
      // Zusätzliche Preise hinzufügen (nur wenn aktiviert)
      const additionalPricePerPiece = this.calculateAdditionalPrices();
      if (additionalPricePerPiece > 0) {
        properties['Zusatzoptionen pro Stück'] = this.formatMoney(additionalPricePerPiece * 100);
        properties['Zusatzoptionen gesamt'] = this.formatMoney(additionalPricePerPiece * this.state.selectedQuantity * 100);
        
        // Einzelne aktivierte Optionen mit Preisen auflisten
        const teamLogoCheckbox = this.section.querySelector('[data-team-option="logo"]');
        if (teamLogoCheckbox && teamLogoCheckbox.checked) {
          const price = parseFloat(teamLogoCheckbox.dataset.price) || 0;
          if (price > 0) {
            properties['Logo hinzufügen Preis'] = `${this.formatMoney(price * 100)} pro Stück`;
          }
        }
        
        const teamNameCheckbox = this.section.querySelector('[data-team-option="teamname"]');
        if (teamNameCheckbox && teamNameCheckbox.checked) {
          const price = parseFloat(teamNameCheckbox.dataset.price) || 0;
          if (price > 0) {
            properties['Teamname Preis'] = `${this.formatMoney(price * 100)} pro Stück`;
          }
        }
        
        const numberChestCheckbox = this.section.querySelector('[data-personalization-option="number-chest"]');
        if (numberChestCheckbox && numberChestCheckbox.checked) {
          const price = parseFloat(numberChestCheckbox.dataset.price) || 0;
          if (price > 0) {
            properties['Nummer Brust Preis'] = `${this.formatMoney(price * 100)} pro Stück`;
          }
        }
        
        const numberBackCheckbox = this.section.querySelector('[data-personalization-option="number-back"]');
        if (numberBackCheckbox && numberBackCheckbox.checked) {
          const price = parseFloat(numberBackCheckbox.dataset.price) || 0;
          if (price > 0) {
            properties['Nummer Rücken Preis'] = `${this.formatMoney(price * 100)} pro Stück`;
          }
        }
        
        const playerNamesCheckbox = this.section.querySelector('[data-personalization-option="playernames"]');
        if (playerNamesCheckbox && playerNamesCheckbox.checked) {
          const price = parseFloat(playerNamesCheckbox.dataset.price) || 0;
          if (price > 0) {
            properties['Spielernamen Preis'] = `${this.formatMoney(price * 100)} pro Stück`;
          }
        }
      }
      
      properties['Gesamtpreis pro Stück'] = this.formatMoney(this.state.finalPrice * 100);
      properties['Gesamtpreis'] = this.formatMoney(this.state.finalPrice * this.state.selectedQuantity * 100);
      
      // Varianten-ID validieren
      const variantId = parseInt(this.state.selectedVariantId);
      if (!variantId || isNaN(variantId)) {
        throw new Error(`Ungültige Varianten-ID: ${this.state.selectedVariantId}`);
      }
      
      // Menge validieren
      const quantity = parseInt(this.state.selectedQuantity);
      if (!quantity || quantity <= 0 || isNaN(quantity)) {
        throw new Error(`Ungültige Menge: ${this.state.selectedQuantity}`);
      }
      
      // Properties validieren (Shopify Limits: max 100 Properties, max 100 Zeichen pro Property-Wert)
      const propertyKeys = Object.keys(properties);
      if (propertyKeys.length > 100) {
        console.warn('Zu viele Properties:', propertyKeys.length);
        // Reduziere auf die wichtigsten Properties
        const importantKeys = ['_teamwear_set', 'Design', 'Farbe', 'Menge', 'Team Logo', 'Teamname', ...propertyKeys.filter(k => k.startsWith('Trikot'))];
        const limitedProperties = {};
        importantKeys.forEach(key => {
          if (properties[key]) {
            const value = String(properties[key]);
            limitedProperties[key] = value.length > 100 ? value.substring(0, 97) + '...' : value;
          }
        });
        properties = limitedProperties;
      }
      
      // Validiere Property-Werte Länge
      Object.keys(properties).forEach(key => {
        const value = String(properties[key]);
        if (value.length > 100) {
          console.warn(`Property "${key}" ist zu lang (${value.length} Zeichen), wird gekürzt`);
          properties[key] = value.substring(0, 97) + '...';
        }
      });
      
      // Debug: Logge alle wichtigen Daten vor dem Request
      console.log('=== Warenkorb Request Debug ===');
      console.log('Variant ID:', variantId);
      console.log('Variant ID Type:', typeof variantId);
      console.log('Menge:', quantity);
      console.log('Menge Type:', typeof quantity);
      console.log('Properties:', properties);
      console.log('Properties Count:', Object.keys(properties).length);
      console.log('Properties Size (approx):', JSON.stringify(properties).length, 'bytes');
      
      const requestBody = { id: variantId, quantity: quantity, properties };
      console.log('Request Body:', requestBody);
      
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(requestBody)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Shopify Error Response:', errorText);
        console.error('Response Status:', response.status);
        console.error('Request Body that failed:', requestBody);
        
        // Versuche, die Fehlermeldung zu parsen
        let errorMessage = 'Ungültige Produktkonfiguration.';
        try {
          const errorData = JSON.parse(errorText);
          if (errorData.message) {
            errorMessage = errorData.message;
            // Übersetze häufige Shopify-Fehlermeldungen
            if (errorData.message.includes('sold out') || errorData.message.includes('already sold out')) {
              errorMessage = 'Dieses Produkt ist leider ausverkauft. Bitte wähle eine andere Farbe oder Variante.';
            } else if (errorData.message.includes('not available')) {
              errorMessage = 'Dieses Produkt ist derzeit nicht verfügbar.';
            } else if (errorData.message.includes('quantity')) {
              errorMessage = 'Die gewünschte Menge ist nicht verfügbar.';
            }
          } else if (errorData.description) {
            errorMessage = errorData.description;
          }
        } catch (e) {
          // Wenn Parsing fehlschlägt, verwende Standard-Fehlermeldung
          if (response.status === 422) {
            errorMessage = 'Ungültige Produktkonfiguration. Bitte überprüfe deine Auswahl.';
          } else if (response.status === 404) {
            errorMessage = 'Produkt nicht gefunden.';
          }
        }
        
        throw new Error(`Failed: ${response.status} - ${errorMessage}`);
      }
      
      const cartData = await response.json();
      
      // Hole Cart-Sections für Drawer Update
      const sectionsToRender = ['cart-drawer', 'cart-icon-bubble'];
      const sectionsResponse = await fetch(`${window.Shopify.routes.root}?sections=${sectionsToRender.join(',')}`);
      const sectionsData = await sectionsResponse.json();
      
      // Dispatche korrektes CartAddEvent (richtiger Event-Name!)
      const cartAddEvent = new CustomEvent('cart:update', {
        bubbles: true,
        detail: {
          resource: cartData,
          sourceId: this.state.selectedVariantId.toString(),
          data: {
            source: 'teamwear-calculator',
            itemCount: this.state.selectedQuantity,
            productId: this.state.selectedProduct?.id.toString(),
            sections: sectionsData
          }
        }
      });
      document.dispatchEvent(cartAddEvent);
      
      this.showMessage(this.config.translations.addedToCart || 'Erfolgreich hinzugefügt!', 'success');
      this.updateCartCount();
      
      // Öffne Cart Drawer nach Update
      const cartDrawer = document.querySelector('cart-drawer-component');
      if (cartDrawer && typeof cartDrawer.open === 'function') {
        setTimeout(() => cartDrawer.open(), 500);
      }
      
      setTimeout(() => this.resetForm(), 2000);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      let errorMessage = this.config.translations.error || 'Es ist ein Fehler aufgetreten.';
      
      // Extrahiere die benutzerfreundliche Fehlermeldung aus dem Error-Objekt
      if (error.message && error.message.includes('Failed: 422')) {
        // Die Fehlermeldung wurde bereits in der Response-Behandlung formatiert
        const messageMatch = error.message.match(/Failed: \d+ - (.+)/);
        if (messageMatch && messageMatch[1]) {
          errorMessage = messageMatch[1];
        } else {
          errorMessage = 'Ungültige Produktkonfiguration. Bitte überprüfe deine Auswahl.';
        }
      } else if (error.message && error.message.includes('404')) {
        errorMessage = 'Produkt nicht gefunden.';
      } else if (error.message && error.message.includes('Failed to fetch')) {
        errorMessage = 'Netzwerkfehler. Bitte versuche es erneut.';
      } else if (error.message && error.message.includes('Ungültige Varianten-ID')) {
        errorMessage = 'Bitte wähle eine Farbe aus.';
      } else if (error.message && error.message.includes('Ungültige Menge')) {
        errorMessage = 'Bitte gib eine gültige Menge ein.';
      }
      
      this.showMessage(errorMessage, 'error');
    } finally {
      this.elements.submitButton.disabled = false;
      this.elements.submitButton.classList.remove('loading');
      this.elements.submitButton.textContent = this.elements.submitButton.getAttribute('data-original-text') || 'In den Warenkorb';
    }
  }
  
  collectPersonalizationData() {
    // Sammle Daten direkt aus den Input-Feldern, um sicherzustellen, dass alle aktuellen Werte erfasst werden
    const personalData = [];
    
    if (this.elements.personalizationList) {
      const rows = this.elements.personalizationList.querySelectorAll('tr');
      rows.forEach((row, index) => {
        const nameInput = row.querySelector('[data-type="name"]');
        const numberInput = row.querySelector('[data-type="number"]');
        const sizeSelect = row.querySelector('[data-type="size"]');
        
        const item = {
          name: nameInput ? nameInput.value.trim() : '',
          number: numberInput ? numberInput.value.trim() : '',
          size: sizeSelect ? sizeSelect.value.trim() : ''
        };
        
        personalData.push(item);
      });
    }
    
    return personalData;
  }
  
  formatPersonalizationProperties() {
    const personalProps = {};
    
    // Team-Optionen nur hinzufügen, wenn Checkboxen aktiviert sind
    const teamLogoCheckbox = this.section.querySelector('[data-team-option="logo"]');
    if (teamLogoCheckbox && teamLogoCheckbox.checked && this.state.teamLogo) {
      // Speichere Logo-URL statt nur Dateiname
      if (this.state.teamLogo.url) {
        personalProps['Team Logo'] = this.state.teamLogo.url;
        personalProps['Team Logo Name'] = this.state.teamLogo.name || 'Logo';
      } else {
        personalProps['Team Logo'] = this.state.teamLogo.name || 'Logo hochgeladen';
      }
    }
    
    const teamNameCheckbox = this.section.querySelector('[data-team-option="teamname"]');
    if (teamNameCheckbox && teamNameCheckbox.checked && this.state.teamName?.trim()) {
      personalProps['Teamname'] = this.state.teamName.trim();
    }
    
    // Personalisierungsdaten direkt aus den Input-Feldern sammeln
    const personalData = this.collectPersonalizationData();
    
    // Prüfe, ob überhaupt Personalisierungsdaten vorhanden sind
    const hasPersonalizationData = personalData.some(item => 
      item.name || item.number || item.size
    );
    
    if (hasPersonalizationData) {
      personalData.forEach((item, index) => {
        const num = index + 1;
        const itemProps = [];
        
        if (item.name) {
          itemProps.push(`Name: ${item.name}`);
        }
        if (item.number) {
          itemProps.push(`Nummer: ${item.number}`);
        }
        if (item.size) {
          itemProps.push(`Größe: ${item.size}`);
        }
        
        // Nur hinzufügen, wenn mindestens ein Wert vorhanden ist
        if (itemProps.length > 0) {
          personalProps[`Trikot ${num}`] = itemProps.join(', ');
        }
      });
    }
    
    return personalProps;
  }
  
  openCloudinaryUpload() {
    // Cloudinary Upload Widget konfigurieren
    if (typeof cloudinary === 'undefined') {
      this.showMessage('Upload-Service nicht verfügbar. Bitte Seite neu laden.', 'error');
      return;
    }
    
    const widget = cloudinary.createUploadWidget({
      cloudName: 'dr2vjuzvh',
      uploadPreset: 'teamwear-logos',
      folder: 'teamwear-logos',
      clientAllowedFormats: ['png', 'jpg', 'jpeg', 'svg', 'pdf', 'ai'],
      maxFileSize: 10485760, // 10MB
      maxFiles: 1,
      multiple: false,
      sources: ['local'],
      language: 'de',
      text: {
        de: {
          or: 'oder',
          back: 'Zurück',
          advanced: 'Erweitert',
          close: 'Schließen',
          no_results: 'Keine Ergebnisse',
          search_placeholder: 'Dateien durchsuchen',
          about_uw: 'Über den Upload Widget',
          menu: {
            files: 'Meine Dateien',
            web: 'Web-Adresse',
            camera: 'Kamera'
          },
          local: {
            browse: 'Durchsuchen',
            dd_title_single: 'Datei hier ablegen',
            dd_title_multi: 'Dateien hier ablegen',
            drop_title_single: 'Datei ablegen zum Hochladen',
            drop_title_multi: 'Dateien ablegen zum Hochladen'
          },
          actions: {
            upload: 'Hochladen',
            clear_all: 'Alle löschen',
            log_out: 'Abmelden'
          },
          queue: {
            title: 'Upload-Warteschlange',
            title_uploading_with_counter: 'Lade {{num}} Dateien hoch',
            title_processing_with_counter: 'Verarbeite {{num}} Dateien',
            mini_title: 'Hochgeladen',
            mini_title_uploading: 'Wird hochgeladen',
            mini_title_processing: 'Wird verarbeitet',
            show_completed: 'Abgeschlossene anzeigen',
            retry_failed: 'Fehlgeschlagene wiederholen',
            abort_all: 'Alle abbrechen',
            upload_more: 'Weitere hochladen',
            done: 'Fertig',
            mini_upload_count: '{{num}} hochgeladen',
            mini_failed: '{{num}} fehlgeschlagen',
            statuses: {
              uploading: 'Wird hochgeladen...',
              processing: 'Wird verarbeitet...',
              timeout: 'Zeitüberschreitung',
              error: 'Fehler',
              uploaded: 'Fertig',
              aborted: 'Abgebrochen'
            }
          }
        }
      }
    }, (error, result) => {
      if (error) {
        console.error('Cloudinary Upload Error:', error);
        this.showMessage('Fehler beim Hochladen. Bitte versuche es erneut.', 'error');
        return;
      }
      
      if (result.event === 'success') {
        const logoUrl = result.info.secure_url;
        const fileName = result.info.original_filename + '.' + result.info.format;
        
        // Speichere Logo-URL und Dateiname
        this.state.teamLogo = {
          url: logoUrl,
          name: fileName,
          publicId: result.info.public_id
        };
        
        // Zeige Dateinamen im UI
        const fileNameElement = this.elements.teamSection.querySelector('.teamwear-team-section__file-name');
        if (fileNameElement) {
          fileNameElement.textContent = fileName;
        }
        
        this.showMessage('Logo erfolgreich hochgeladen!', 'success');
        console.log('Logo hochgeladen:', logoUrl);
      }
    });
    
    widget.open();
  }
  
  updateCartCount() {
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        // Update Cart Count in allen Cart-Icon Elementen
        document.querySelectorAll('.cart-count, .cart-icon__count, [data-cart-count]').forEach(element => {
          element.textContent = cart.item_count;
        });
        
        // Update Cart Drawer, falls vorhanden
        const cartDrawer = document.querySelector('cart-drawer-component');
        if (cartDrawer && typeof cartDrawer.renderCart === 'function') {
          cartDrawer.renderCart(cart);
        }
      })
      .catch(error => {
        console.error('Error updating cart count:', error);
      });
  }
  
  showMessage(text, type = 'info') {
    if (!this.elements.messages) return;
    this.elements.messages.textContent = text;
    this.elements.messages.className = `teamwear-messages show ${type}`;
    setTimeout(() => this.elements.messages.classList.remove('show'), 5000);
  }
  
  initDesignImageSliders() {
    this.section.querySelectorAll('.teamwear-design__image-wrapper').forEach(wrapper => {
      const slider = wrapper.querySelector('.teamwear-design__image-slider');
      if (!slider) return;
      
      const images = slider.querySelectorAll('.teamwear-design__image');
      if (images.length <= 1) return;
      
      const prevBtn = slider.querySelector('.teamwear-design__slider-btn--prev');
      const nextBtn = slider.querySelector('.teamwear-design__slider-btn--next');
      let currentIndex = 0;
      
      const showImage = (index) => {
        images.forEach((img, i) => {
          img.classList.toggle('visually-hidden', i !== index);
        });
        if (prevBtn) prevBtn.style.display = index === 0 ? 'none' : 'flex';
        if (nextBtn) nextBtn.style.display = index === images.length - 1 ? 'none' : 'flex';
      };
      
      if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          currentIndex = Math.max(0, currentIndex - 1);
          showImage(currentIndex);
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          e.preventDefault();
          currentIndex = Math.min(images.length - 1, currentIndex + 1);
          showImage(currentIndex);
        });
      }
      
      showImage(0);
    });
  }
  
  resetForm() {
    this.state = {
      selectedProduct: null,
      selectedVariantId: null,
      selectedColor: null,
      selectedQuantity: 0,
      selectedDiscount: 0,
      basePrice: 0,
      finalPrice: 0,
      discountSettings: null,
      productVariants: [],
      productImages: [],
      availableColors: [],
      personalization: [],
      teamLogo: null,
      teamName: ''
    };
    
    if (this.elements.designs) {
      this.elements.designs.forEach(input => input.checked = false);
    }
    
    if (this.elements.colorSelection) this.elements.colorSelection.style.display = 'none';
    if (this.elements.colorsPlaceholder) this.elements.colorsPlaceholder.style.display = 'block';
    if (this.elements.colorsContainer) this.elements.colorsContainer.innerHTML = '';
    if (this.elements.colorPreviewImage) {
      this.elements.colorPreviewImage.src = '';
      this.elements.colorPreviewImage.alt = '';
    }
    
     this.updateUI();
  }
}

// Initialize
if (typeof window.teamwearCalculatorInitialized === 'undefined') {
  window.teamwearCalculatorInitialized = false;
}

if (!window.teamwearCalculatorInitialized) {
  window.teamwearCalculatorInitialized = true;
  
  const initCalculator = () => {
    if (window.teamwearConfig?.sectionId && !window.teamwearCalculator) {
      try {
        window.teamwearCalculator = new TeamwearCalculator(window.teamwearConfig.sectionId);
        } catch (error) {
        console.error('TeamwearCalculator initialization failed:', error);
        }
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculator);
  } else {
    initCalculator();
  }
}
