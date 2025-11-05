/**
 * Teamwear Calculator JavaScript
 * Handles all interactions and cart integration
 */

/* global window */

class TeamwearCalculator {
  /**
   * @param {string} sectionId - The section ID
   */
  constructor(sectionId) {
    this.section = document.querySelector(`[data-section="${sectionId}"]`);
    if (!this.section) return;
    
    this.config = (window.teamwearConfig) || {};
    this.state = {
      selectedProduct: null,
      selectedQuantity: 0, // wird nun aus Größenfeldern abgeleitet
      selectedDiscount: 0,
      basePrice: 0,
      finalPrice: 0,
      discountSettings: null,
      sizes: {},
      personalization: []
    };
    
    this.elements = {
      designs: this.section.querySelectorAll('.teamwear-design__input'),
      quantities: this.section.querySelectorAll('.teamwear-quantity'),
      quantitiesContainer: this.section.querySelector('.teamwear-quantities'),
      quantitiesPlaceholder: this.section.querySelector('.teamwear-quantities__placeholder'),
      quantitiesInfo: this.section.querySelector('.teamwear-quantities__info'),
      sizeInputs: this.section.querySelectorAll('.teamwear-size__input'),
      sizeTotal: this.section.querySelector('[data-total]'),
      sizeRequired: this.section.querySelector('[data-required]'),
      sizeValidation: this.section.querySelector('.teamwear-sizes__validation'),
      personalizationToggle: this.section.querySelector('.teamwear-personalization__toggle'),
      personalizationContent: this.section.querySelector('.teamwear-personalization__content'),
      personalizationList: this.section.querySelector('.teamwear-personalization__list'),
      sizeChartToggle: this.section.querySelector('.teamwear-size-chart-toggle'),
      sizeChart: this.section.querySelector('.teamwear-size-chart'),
      totalPrice: this.section.querySelector('[data-total-price]'),
      priceDetails: this.section.querySelector('[data-price-details]'),
      submitButton: this.section.querySelector('.teamwear-submit'),
      messages: this.section.querySelector('.teamwear-messages')
    };
    
    // Debug output
    console.log('TeamwearCalculator initialized:', {
      designs: this.elements.designs.length,
      quantities: this.elements.quantities.length,
      sectionId: this.config.sectionId,
      hasQuantitiesContainer: !!this.elements.quantitiesContainer,
      hasQuantitiesPlaceholder: !!this.elements.quantitiesPlaceholder,
      state: this.state
    });
    
    // Log all design inputs and their data
    this.elements.designs.forEach((input, index) => {
      console.log(`Design ${index}:`, {
        id: input.id,
        checked: input.checked,
        dataset: input.dataset
      });
    });
    
    this.init();
  }
  
  init() {
    console.log('Init called - Design elements found:', {
      designInputs: this.elements.designs.length,
      designContainers: this.section.querySelectorAll('.teamwear-design').length,
      allInputs: this.section.querySelectorAll('input[type="radio"]').length,
      sectionHTML: this.section.innerHTML.substring(0, 500) + '...'
    });
    
    this.attachEventListeners();
    this.initializeDynamicDiscounts();
    
    // Check if fallback design is pre-selected
    const checkedDesign = this.section.querySelector('.teamwear-design__input:checked');
    if (checkedDesign) {
      console.log('Found pre-selected design, triggering change event:', {
        id: checkedDesign.id,
        dataset: checkedDesign.dataset
      });
      checkedDesign.dispatchEvent(new Event('change'));
    } else {
      console.log('No pre-selected design found');
      
      // Try to find any design and select the first one
      if (this.elements.designs.length > 0) {
        console.log('Auto-selecting first design');
        this.elements.designs[0].checked = true;
        this.elements.designs[0].dispatchEvent(new Event('change'));
      } else {
        console.log('No designs available - checking section content');
        console.log('Section selectors found:', {
          '.teamwear-designs': !!this.section.querySelector('.teamwear-designs'),
          '.teamwear-design': this.section.querySelectorAll('.teamwear-design').length,
          '.teamwear-design__input': this.section.querySelectorAll('.teamwear-design__input').length,
          'input[name="teamwear-design"]': this.section.querySelectorAll('input[name="teamwear-design"]').length
        });
      }
    }
    
    this.updateUI();
  }
  
  initializeDynamicDiscounts() {
    // Read dynamic discount settings from DOM
    this.state.useDynamicDiscounts = this.section.dataset.useDynamicDiscounts === 'true';
    this.state.maxDiscountLimit = parseInt(this.section.dataset.maxDiscountLimit) || 25;
    
    console.log('🔧 Reading discount settings from DOM:', {
      'data-use-dynamic-discounts': this.section.dataset.useDynamicDiscounts,
      'data-discount-tiers': this.section.dataset.discountTiers,
      'data-max-discount-limit': this.section.dataset.maxDiscountLimit,
      parsed: {
        useDynamicDiscounts: this.state.useDynamicDiscounts,
        maxDiscountLimit: this.state.maxDiscountLimit
      }
    });
    
    // Parse discount tiers JSON
    try {
      const tiersData = this.section.dataset.discountTiers;
      if (tiersData) {
        // Clean up the JSON string (remove any escaping issues)
        const cleanedTiersData = tiersData.trim().replace(/&quot;/g, '"');
        console.log('🧹 Cleaning JSON data:', {
          original: tiersData,
          cleaned: cleanedTiersData
        });
        
        this.state.discountTiers = JSON.parse(cleanedTiersData);
        
        // Validate that we have an array
        if (!Array.isArray(this.state.discountTiers)) {
          throw new Error('Discount tiers must be an array');
        }
        
        // Sort tiers by quantity in descending order for easier lookup
        this.state.discountTiers.sort((a, b) => b.quantity - a.quantity);
        
        console.log('🎯 Dynamic discounts initialized:', {
          enabled: this.state.useDynamicDiscounts,
          rawTiersData: tiersData,
          cleanedTiersData: cleanedTiersData,
          parsedTiers: this.state.discountTiers,
          maxLimit: this.state.maxDiscountLimit
        });
        
        // FORCE ENABLE for testing - remove this later
        if (!this.state.useDynamicDiscounts && this.state.discountTiers.length > 0) {
          console.log('🚨 FORCING dynamic discounts ON for testing');
          this.state.useDynamicDiscounts = true;
        }
      } else {
        console.log('💡 No tiers data found, using legacy discount system');
      }
    } catch (error) {
      console.error('❌ Error parsing discount tiers:', error, 'Raw data:', this.section.dataset.discountTiers);
      this.state.useDynamicDiscounts = false;
      this.state.discountTiers = [];
    }
  }
  
  // Debug helper method
  debugState() {
    console.log('=== TEAMWEAR CALCULATOR DEBUG ===');
    console.log('State:', this.state);
    console.log('Elements found:');
    console.log('- Designs:', this.elements.designs.length);
    console.log('- Quantities:', this.elements.quantities.length);
    console.log('- Size inputs:', this.elements.sizeInputs.length);
    console.log('Current validation:', this.validateForm());
    console.log('=== END DEBUG ===');
  }
  
  // Test method to manually trigger design selection
  testSelectFirstDesign() {
    if (this.elements.designs.length > 0) {
      const firstDesign = this.elements.designs[0];
      console.log('Manually selecting first design:', firstDesign);
      firstDesign.checked = true;
      firstDesign.dispatchEvent(new Event('change'));
    }
  }
  
  attachEventListeners() {
    // Design (Product) selection
    if (this.elements.designs) {
      this.elements.designs.forEach(input => {
        input.addEventListener('change', (e) => {
          const target = e.target;
          if (target instanceof HTMLInputElement && target.checked) {
            const designElement = target.closest('.teamwear-design');
            const nameElement = designElement ? designElement.querySelector('.teamwear-design__name') : null;
            const designName = nameElement ? nameElement.textContent : '';
            
            // Debug: Log all dataset attributes
            console.log('Design selected, dataset:', target.dataset);
            
            // Get product and discount data from input attributes
            console.log('🔍 Raw dataset values:', {
              productId: target.dataset.productId,
              productHandle: target.dataset.productHandle,
              basePrice: target.dataset.basePrice,
              discountPerTier: target.dataset.discountPerTier,
              tierSize: target.dataset.tierSize,
              maxDiscount: target.dataset.maxDiscount
            });
            
            console.log('🏷️ Complete dataset object:', target.dataset);
            
            this.state.selectedProduct = {
              id: target.dataset.productId,
              handle: target.dataset.productHandle,
              name: designName || ''
            };
            
            // Validate that we have required data
            if (!this.state.selectedProduct.id) {
              console.error('❌ Product ID is missing from dataset!', target.dataset);
              this.showMessage('Fehler: Produkt-ID fehlt. Bitte lade die Seite neu.', 'error');
              return;
            }
            
            this.state.basePrice = parseFloat(target.dataset.basePrice) || 0;
            this.state.discountSettings = {
              discountPerTier: parseInt(target.dataset.discountPerTier) || 5,
              tierSize: parseInt(target.dataset.tierSize) || 10,
              maxDiscount: parseInt(target.dataset.maxDiscount) || 50
            };
            
            console.log('State after design selection:', {
              selectedProduct: this.state.selectedProduct,
              basePrice: this.state.basePrice,
              discountSettings: this.state.discountSettings
            });
            
            // Bei Wegfall der manuellen Mengenwahl: Preise nach Größenänderungen aktualisieren
            this.updateQuantityFromSizes();
            this.updateQuantityPrices();
            
            this.updateUI();
          }
        });
      });
    }
    
    // Entfernt: Manuelle Mengenwahl. Menge wird dynamisch aus Größen berechnet.
    
    // Size inputs
    if (this.elements.sizeInputs) {
      this.elements.sizeInputs.forEach(input => {
        input.addEventListener('input', () => {
          // Menge aus Größen neu berechnen
          this.updateQuantityFromSizes();
          this.updateSizeValidation();
          // Preis neu kalkulieren
          this.calculateDiscountAndPrice();
          // Personalisierungsliste neu aufbauen (abhängig von Gesamtmenge)
          this.buildPersonalizationList();
          this.updateUI();
        });
      });
    }
    
    // Size chart toggle
    if (this.elements.sizeChartToggle && this.elements.sizeChart) {
      this.elements.sizeChartToggle.addEventListener('click', () => {
        const isVisible = this.elements.sizeChart.style.display === 'block';
        this.elements.sizeChart.style.display = isVisible ? 'none' : 'block';
        this.elements.sizeChartToggle.textContent = isVisible 
          ? this.elements.sizeChartToggle.textContent.replace('ausblenden', 'anzeigen')
          : this.elements.sizeChartToggle.textContent.replace('anzeigen', 'ausblenden');
      });
    }
    
    // Personalization toggle
    if (this.elements.personalizationToggle && this.elements.personalizationContent) {
      this.elements.personalizationToggle.addEventListener('click', () => {
        const isExpanded = this.elements.personalizationToggle.getAttribute('aria-expanded') === 'true';
        this.elements.personalizationToggle.setAttribute('aria-expanded', !isExpanded);
        this.elements.personalizationContent.style.display = isExpanded ? 'none' : 'block';
        
        if (!isExpanded) {
          this.buildPersonalizationList();
        }
      });
    }
    
    // Submit button
    if (this.elements.submitButton) {
      this.elements.submitButton.addEventListener('click', () => {
        this.handleSubmit();
      });
    }
  }
  
  showQuantityOptions() {
    // Deaktiviert: keine manuelle Mengenanzeige mehr
    if (this.elements.quantitiesContainer) {
      this.elements.quantitiesContainer.style.display = 'none';
    }
    if (this.elements.quantitiesPlaceholder) {
      this.elements.quantitiesPlaceholder.style.display = 'none';
    }
    if (this.elements.quantitiesInfo) {
      this.elements.quantitiesInfo.style.display = 'block';
    }
  }
  
  updateQuantityPrices() {
    if (!this.state.basePrice || !this.state.discountSettings) return;
    
    this.elements.quantities.forEach(button => {
      const quantity = parseInt(button.dataset.quantity || '0');
      const discount = this.calculateDiscount(quantity);
      const discountedPrice = this.state.basePrice * (1 - discount / 100);
      
      const discountElement = button.querySelector('[data-discount-info]');
      const priceElement = button.querySelector('[data-price-display]');
      
      if (discountElement) {
        if (discount > 0) {
          discountElement.textContent = `-${discount}% ${this.config.translations.discount}`;
        } else {
          discountElement.textContent = this.config.translations.basePrice;
        }
      }
      
      if (priceElement) {
        priceElement.textContent = `${this.formatMoney(discountedPrice * 100)} ${this.config.translations.perPiece}`;
      }
    });
  }
  
  selectDefaultQuantity() {
    // Nicht mehr erforderlich, Menge kommt aus Größenfeldern
  }
  
  calculateDiscount(quantity) {
    console.log('🔢 Calculating discount for quantity:', quantity, {
      useDynamicDiscounts: this.state.useDynamicDiscounts,
      hasTiers: !!this.state.discountTiers,
      discountTiers: this.state.discountTiers,
      hasDiscountSettings: !!this.state.discountSettings
    });
    
    // Check if dynamic discounts are enabled
    if (this.state.useDynamicDiscounts && this.state.discountTiers && this.state.discountTiers.length > 0) {
      const dynamicDiscount = this.calculateDynamicDiscount(quantity);
      console.log('💰 Using dynamic discount:', dynamicDiscount, '% for quantity:', quantity);
      return dynamicDiscount;
    }
    
    // Fallback to legacy tier-based system
    if (!this.state.discountSettings) {
      console.log('⚠️ No discount settings available, returning 0');
      return 0;
    }
    
    const { discountPerTier, tierSize, maxDiscount } = this.state.discountSettings;
    const tiers = Math.floor(quantity / tierSize);
    const discount = Math.min(tiers * discountPerTier, maxDiscount);
    
    console.log('🔄 Using legacy discount system:', discount, '% for quantity:', quantity);
    return discount;
  }
  
  calculateDynamicDiscount(quantity) {
    let applicableDiscount = 0;
    let applicableTier = null;
    
    console.log('🎯 Finding dynamic discount for quantity:', quantity, 'in tiers:', this.state.discountTiers);
    
    // Find the highest applicable discount for the given quantity
    for (const tier of this.state.discountTiers) {
      console.log('   Checking tier:', tier, 'quantity>=', tier.quantity, '?', quantity >= tier.quantity);
      if (quantity >= tier.quantity && tier.discount > applicableDiscount) {
        applicableDiscount = tier.discount;
        applicableTier = tier;
        console.log('   ✅ New best discount:', applicableDiscount, '% from tier:', tier);
      }
    }
    
    // Apply maximum discount limit
    const maxLimit = this.state.maxDiscountLimit || 25;
    const finalDiscount = Math.min(applicableDiscount, maxLimit);
    
    console.log('🎉 Final dynamic discount result:', {
      quantity: quantity,
      applicableTier: applicableTier,
      applicableDiscount: applicableDiscount,
      maxLimit: maxLimit,
      finalDiscount: finalDiscount
    });
    
    return finalDiscount;
  }
  
  calculateDiscountAndPrice() {
    if (!this.state.basePrice || !this.state.selectedQuantity) {
      console.log('Cannot calculate price:', {
        basePrice: this.state.basePrice,
        selectedQuantity: this.state.selectedQuantity
      });
      return;
    }
    
    this.state.selectedDiscount = this.calculateDiscount(this.state.selectedQuantity);
    const discountMultiplier = 1 - (this.state.selectedDiscount / 100);
    this.state.finalPrice = this.state.basePrice * discountMultiplier;
    
    console.log('Price calculated:', {
      basePrice: this.state.basePrice,
      quantity: this.state.selectedQuantity,
      discount: this.state.selectedDiscount,
      finalPrice: this.state.finalPrice
    });
  }
  
  updateSizeValidation() {
    const total = Array.from(this.elements.sizeInputs).reduce((sum, input) => {
      const value = parseInt(input.value) || 0;
      this.state.sizes[input.dataset.size] = value;
      return sum + value;
    }, 0);
    
    if (this.elements.sizeTotal) {
      this.elements.sizeTotal.textContent = total;
    }
    
    const isValid = total > 0; // Menge ergibt sich aus Summe, daher nur > 0 prüfen
    
    // Update validation styling
    if (this.elements.sizeValidation) {
      this.elements.sizeValidation.classList.toggle('valid', isValid);
      this.elements.sizeValidation.classList.toggle('invalid', !isValid && total > 0);
    }
    
    // Update input styling
    if (this.elements.sizeInputs) {
      this.elements.sizeInputs.forEach(input => {
        input.classList.toggle('error', !isValid && total > 0);
      });
    }
    
    return isValid;
  }

  updateQuantityFromSizes() {
    // Summe der Größen als aktuelle Menge setzen
    const total = Array.from(this.elements.sizeInputs || []).reduce((sum, input) => {
      const value = parseInt(input.value) || 0;
      return sum + value;
    }, 0);
    this.state.selectedQuantity = total;
    if (this.elements.sizeRequired) {
      this.elements.sizeRequired.textContent = total.toString();
    }
  }
  
  buildPersonalizationList() {
    if (!this.elements.personalizationList) return;
    
    this.elements.personalizationList.innerHTML = '';
    this.state.personalization = [];
    
    for (let i = 1; i <= this.state.selectedQuantity; i++) {
      const item = document.createElement('div');
      item.className = 'teamwear-personalization__item';
      item.innerHTML = `
        <span class="teamwear-personalization__number">${i}.</span>
        <input type="text" 
               class="teamwear-personalization__input" 
               placeholder="Name"
               data-index="${i - 1}"
               data-type="name">
        <input type="text" 
               class="teamwear-personalization__input" 
               placeholder="Nummer"
               data-index="${i - 1}"
               data-type="number">
      `;
      
      this.elements.personalizationList.appendChild(item);
      
      // Add to state
      this.state.personalization.push({ name: '', number: '' });
    }
    
    // Attach event listeners to new inputs
    this.elements.personalizationList.querySelectorAll('input').forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        const type = e.target.dataset.type;
        this.state.personalization[index][type] = e.target.value;
      });
    });
  }
  
  updateUI() {
    const isValid = this.validateForm();
    
    console.log('UpdateUI called:', {
      isValid,
      selectedQuantity: this.state.selectedQuantity,
      finalPrice: this.state.finalPrice,
      basePrice: this.state.basePrice,
      selectedProduct: this.state.selectedProduct,
      totalPriceElement: !!this.elements.totalPrice,
      condition1: this.state.selectedQuantity > 0,
      condition2: this.state.finalPrice > 0
    });
    
    // Update price display
    if (this.state.selectedQuantity > 0 && this.state.finalPrice > 0) {
      const totalPrice = this.state.selectedQuantity * this.state.finalPrice * 100; // Convert to cents
      console.log('Updating price display:', {
        totalPrice,
        formattedPrice: this.formatMoney(totalPrice)
      });
      
      if (this.elements.totalPrice) {
        this.elements.totalPrice.textContent = this.formatMoney(totalPrice);
      }
      if (this.elements.priceDetails) {
        const detailsText = this.state.selectedDiscount > 0
          ? `(${this.state.selectedQuantity} × ${this.formatMoney(this.state.finalPrice * 100)} mit ${this.state.selectedDiscount}% Rabatt)`
          : `(${this.state.selectedQuantity} × ${this.formatMoney(this.state.finalPrice * 100)})`;
        this.elements.priceDetails.textContent = detailsText;
      }
    } else {
      console.log('Not updating price display - conditions not met');
    }
    
    // Enable/disable submit button
    if (this.elements.submitButton) {
      this.elements.submitButton.disabled = !isValid;
    }
  }
  
  validateForm() {
    const hasProduct = this.state.selectedProduct !== null;
    const hasQuantity = this.state.selectedQuantity > 0;
    const sizesValid = this.updateSizeValidation();
    
    return hasProduct && hasQuantity && sizesValid;
  }
  
  formatMoney(cents) {
    // Use Shopify's money format if available
    if (window.Shopify && window.Shopify.formatMoney) {
      return window.Shopify.formatMoney(cents, this.config.moneyFormat);
    }
    
    // Fallback formatting
    const amount = (cents / 100).toFixed(2);
    return `€${amount}`;
  }
  
  async handleSubmit() {
    console.log('🛒 HandleSubmit called, current state:', this.state);
    
    // Enhanced validation with detailed error messages
    if (!this.state.selectedProduct) {
      console.error('❌ No product selected');
      this.showMessage(this.config.translations.selectDesign || 'Bitte wähle ein Design aus', 'error');
      return;
    }
    
    if (!this.state.selectedProduct.id) {
      console.error('❌ Product ID missing:', this.state.selectedProduct);
      this.showMessage('Produkt-ID fehlt. Bitte wähle ein Design neu aus.', 'error');
      return;
    }
    
    if (!this.state.selectedQuantity || this.state.selectedQuantity <= 0) {
      console.error('❌ No quantity selected');
      this.showMessage(this.config.translations.selectQuantity || 'Bitte wähle eine Menge aus', 'error');
      return;
    }
    
    if (!this.validateForm()) {
      this.showMessage(this.config.translations.correctSizes || 'Bitte korrigiere die Größenangaben', 'error');
      return;
    }
    
    // Disable button and show loading state
    this.elements.submitButton.disabled = true;
    this.elements.submitButton.classList.add('loading');
    this.elements.submitButton.textContent = this.config.translations.addingToCart || 'Wird hinzugefügt...';
    
    try {
      // Prepare cart item properties
      const properties = {
        '_teamwear_set': 'true',
        'Design': this.state.selectedProduct.name || 'Unbekanntes Design',
        'Gesamtmenge': this.state.selectedQuantity.toString(),
        'Preis pro Stück': this.formatMoney(this.state.finalPrice * 100),
        'Rabatt': this.state.selectedDiscount > 0 ? `${this.state.selectedDiscount}%` : 'Kein Rabatt',
        'Basispreis': this.formatMoney(this.state.basePrice * 100),
        ...this.formatSizeProperties(),
        ...this.formatPersonalizationProperties()
      };
      
      console.log('📦 Adding to cart:', {
        id: this.state.selectedProduct.id,
        quantity: this.state.selectedQuantity,
        properties: properties
      });
      
      console.log('🔢 Validating ID type:', {
        id: this.state.selectedProduct.id,
        idType: typeof this.state.selectedProduct.id,
        idAsNumber: Number(this.state.selectedProduct.id),
        isNaN: isNaN(this.state.selectedProduct.id)
      });
      
      // Add to cart using Shopify Cart API
      const response = await fetch('/cart/add.js', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          id: Number(this.state.selectedProduct.id), // Ensure ID is a number
          quantity: this.state.selectedQuantity,
          properties: properties
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Cart API error:', response.status, errorText);
        throw new Error(`Failed to add to cart: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('✅ Successfully added to cart:', data);
      
      // Success
      this.showMessage(this.config.translations.addedToCart || 'Erfolgreich hinzugefügt!', 'success');
      
      // Update cart bubble/count if exists
      this.updateCartCount();
      
      // Reset form after short delay
      setTimeout(() => {
        this.resetForm();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Error adding to cart:', error);
      
      // More specific error messages
      let errorMessage = this.config.translations.error || 'Es ist ein Fehler aufgetreten.';
      
      if (error.message.includes('404')) {
        errorMessage = 'Produkt nicht gefunden. Bitte wähle ein anderes Design.';
      } else if (error.message.includes('422')) {
        errorMessage = 'Ungültige Produktkonfiguration. Bitte überprüfe deine Auswahl.';
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = 'Netzwerkfehler. Bitte überprüfe deine Internetverbindung.';
      }
      
      this.showMessage(errorMessage, 'error');
    } finally {
      // Reset button state
      this.elements.submitButton.disabled = false;
      this.elements.submitButton.classList.remove('loading');
      this.elements.submitButton.textContent = this.elements.submitButton.getAttribute('data-original-text') || 'In den Warenkorb';
    }
  }
  
  formatSizeProperties() {
    const sizeProps = {};
    Object.entries(this.state.sizes).forEach(([size, quantity]) => {
      if (quantity > 0) {
        sizeProps[`Größe ${size}`] = quantity.toString();
      }
    });
    return sizeProps;
  }
  
  formatPersonalizationProperties() {
    const personalProps = {};
    this.state.personalization.forEach((item, index) => {
      if (item.name || item.number) {
        const num = index + 1;
        if (item.name) personalProps[`Trikot ${num} - Name`] = item.name;
        if (item.number) personalProps[`Trikot ${num} - Nummer`] = item.number;
      }
    });
    return personalProps;
  }
  
  updateCartCount() {
    // Update cart count in header if it exists
    fetch('/cart.js')
      .then(response => response.json())
      .then(cart => {
        const cartCounts = document.querySelectorAll('.cart-count, .cart-icon__count');
        cartCounts.forEach(count => {
          count.textContent = cart.item_count;
        });
        
        // Trigger cart drawer if exists
        const cartDrawer = document.querySelector('cart-drawer');
        if (cartDrawer && cartDrawer.renderCart) {
          cartDrawer.renderCart(cart);
        }
      });
  }
  
  showMessage(text, type = 'info') {
    if (!this.elements.messages) return;
    
    this.elements.messages.textContent = text;
    this.elements.messages.className = `teamwear-messages show ${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      this.elements.messages.classList.remove('show');
    }, 5000);
  }
  
  resetForm() {
    // Reset state
    this.state = {
      selectedProduct: null,
      selectedQuantity: 0,
      selectedDiscount: 0,
      basePrice: 0,
      finalPrice: 0,
      discountSettings: null,
      sizes: {},
      personalization: []
    };
    
    // Reset UI
    if (this.elements.designs) {
      this.elements.designs.forEach(input => input.checked = false);
    }
    if (this.elements.quantities) {
      this.elements.quantities.forEach(btn => btn.classList.remove('active'));
    }
    if (this.elements.sizeInputs) {
      this.elements.sizeInputs.forEach(input => {
        input.value = '0';
        input.classList.remove('error');
      });
    }
    
    // Hide quantities and show placeholder
    if (this.elements.quantitiesContainer && this.elements.quantitiesPlaceholder) {
      this.elements.quantitiesContainer.style.display = 'none';
      this.elements.quantitiesPlaceholder.style.display = 'block';
    }
    
    // Clear quantity displays
    this.elements.quantities.forEach(button => {
      const discountElement = button.querySelector('[data-discount-info]');
      const priceElement = button.querySelector('[data-price-display]');
      if (discountElement) discountElement.textContent = '';
      if (priceElement) priceElement.textContent = '';
    });
    
    if (this.elements.personalizationToggle) {
      this.elements.personalizationToggle.setAttribute('aria-expanded', 'false');
    }
    if (this.elements.personalizationContent) {
      this.elements.personalizationContent.style.display = 'none';
    }
    if (this.elements.personalizationList) {
      this.elements.personalizationList.innerHTML = '';
    }
    
    this.updateUI();
  }
}

// Initialize when DOM is ready (with protection against double loading)
if (typeof window.teamwearCalculatorInitialized === 'undefined') {
  window.teamwearCalculatorInitialized = false;
}

if (!window.teamwearCalculatorInitialized) {
  window.teamwearCalculatorInitialized = true;
  
  // Use setTimeout to ensure DOM is fully loaded
  const initCalculator = () => {
    console.log('🚀 TeamwearCalculator initialization started');
    console.log('Config check:', window.teamwearConfig);
    
    if (window.teamwearConfig && window.teamwearConfig.sectionId) {
      // Double-check if calculator already exists
      if (!window.teamwearCalculator) {
        try {
          const calculator = new TeamwearCalculator(window.teamwearConfig.sectionId);
          
          // Add to global scope for debugging
          window.teamwearCalculator = calculator;
          console.log('✅ TeamwearCalculator successfully initialized');
        } catch (error) {
          console.error('❌ TeamwearCalculator initialization failed:', error);
        }
      } else {
        console.log('⏭️  TeamwearCalculator already exists, skipping');
      }
    } else {
      console.error('❌ TeamwearCalculator config missing or invalid');
    }
  };
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCalculator);
  } else {
    // DOM already loaded
    setTimeout(initCalculator, 100);
  }
}

console.log('🚀 DYNAMIC DISCOUNTS FIX - Version 20250107-185300 - Fixed JSON parsing with proper escaping!');
