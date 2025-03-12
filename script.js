// Configuration state
const config = {
    usBandwidth: 100,
    dsBandwidth: 100,
    connectionType: 'Tcont type_4',
    upstreamPbits: 0,
    downstreamPbits: 0,
    univlan: 250,
    cvlan: 252,
    svlan: 251,
    macAntiSpoofing: false,
    ipAntiSpoofing: false,
    hairPinning: false,
    multicase: false
  };
  
  // Animation state
  let isAnimating = false;
  let animationSpeed = 1;
  let packetPosition = 0;
  let direction = 'upstream'; // 'upstream' or 'downstream'
  let animationFrame = null;
  
  // DOM Elements - initialize after DOM content loaded
  let usBandwidthInput, dsBandwidthInput, connectionTypeSelect, upstreamPbitsInput, downstreamPbitsInput;
  let univlanInput, cvlanInput, svlanInput;
  let macAntiSpoofingCheckbox, ipAntiSpoofingCheckbox, hairPinningCheckbox, multicaseCheckbox;
  let dataPacket, packetStatus, currentAction, tagsContainer;
  let devices = {};
  
  // Initialize DOM elements
  function initDOMElements() {
    usBandwidthInput = document.getElementById('usBandwidth');
    dsBandwidthInput = document.getElementById('dsBandwidth');
    connectionTypeSelect = document.getElementById('connectionType');
    upstreamPbitsInput = document.getElementById('upstreamPbits');
    downstreamPbitsInput = document.getElementById('downstreamPbits');
    univlanInput = document.getElementById('univlan');
    cvlanInput = document.getElementById('cvlan');
    svlanInput = document.getElementById('svlan');
    macAntiSpoofingCheckbox = document.getElementById('macAntiSpoofing');
    ipAntiSpoofingCheckbox = document.getElementById('ipAntiSpoofing');
    hairPinningCheckbox = document.getElementById('hairPinning');
    multicaseCheckbox = document.getElementById('multicase');
    dataPacket = document.getElementById('dataPacket');
    packetStatus = document.getElementById('packetStatus');
    currentAction = document.getElementById('currentAction');
    tagsContainer = document.getElementById('tagsContainer');
    devices = {
      uni: document.getElementById('uniPortDevice'),
      ont: document.getElementById('ontDevice'),
      olt: document.getElementById('oltDevice'),
      bng: document.getElementById('bngDevice')
    };
  }
  
  // Initialize form values with config data
  function initFormValues() {
    usBandwidthInput.value = config.usBandwidth;
    dsBandwidthInput.value = config.dsBandwidth;
    connectionTypeSelect.value = config.connectionType;
    upstreamPbitsInput.value = config.upstreamPbits;
    downstreamPbitsInput.value = config.downstreamPbits;
    univlanInput.value = config.univlan;
    cvlanInput.value = config.cvlan;
    svlanInput.value = config.svlan;
    macAntiSpoofingCheckbox.checked = config.macAntiSpoofing;
    ipAntiSpoofingCheckbox.checked = config.ipAntiSpoofing;
    hairPinningCheckbox.checked = config.hairPinning;
    multicaseCheckbox.checked = config.multicase;
  }
  
  // Set up form event listeners
  function initFormListeners() {
    usBandwidthInput.addEventListener('input', e => {
      config.usBandwidth = parseInt(e.target.value);
    });
  
    dsBandwidthInput.addEventListener('input', e => {
      config.dsBandwidth = parseInt(e.target.value);
    });
  
    connectionTypeSelect.addEventListener('change', e => {
      config.connectionType = e.target.value;
    });
  
    upstreamPbitsInput.addEventListener('input', e => {
      const value = parseInt(e.target.value);
      config.upstreamPbits = value < 0 ? 0 : (value > 7 ? 7 : value);
      e.target.value = config.upstreamPbits; // Ensure valid range is displayed
    });
  
    downstreamPbitsInput.addEventListener('input', e => {
      const value = parseInt(e.target.value);
      config.downstreamPbits = value < 0 ? 0 : (value > 7 ? 7 : value);
      e.target.value = config.downstreamPbits; // Ensure valid range is displayed
    });
  
    univlanInput.addEventListener('input', e => {
      config.univlan = parseInt(e.target.value);
      updatePacketVisualization();
    });
  
    cvlanInput.addEventListener('input', e => {
      config.cvlan = parseInt(e.target.value);
      updatePacketVisualization();
    });
  
    svlanInput.addEventListener('input', e => {
      config.svlan = parseInt(e.target.value);
      updatePacketVisualization();
    });
  
    macAntiSpoofingCheckbox.addEventListener('change', e => {
      config.macAntiSpoofing = e.target.checked;
    });
  
    ipAntiSpoofingCheckbox.addEventListener('change', e => {
      config.ipAntiSpoofing = e.target.checked;
    });
  
    hairPinningCheckbox.addEventListener('change', e => {
      config.hairPinning = e.target.checked;
    });
  
    multicaseCheckbox.addEventListener('change', e => {
      config.multicase = e.target.checked;
    });
  }
  
  // Toggle animation state
  function toggleAnimation() {
    if (isAnimating) {
      isAnimating = false;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
      
      // Update compact play button
      const compactPlayButton = document.getElementById('compactPlayButton');
      if (compactPlayButton) {
        compactPlayButton.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18">
            <polygon points="5 3 19 12 5 21" fill="currentColor"></polygon>
          </svg>
        `;
      }
    } else {
      isAnimating = true;
      
      // Reset packet state when starting animation
      const packet = document.getElementById('dataPacket');
      packet.classList.remove('fade-out');
      
      // Set initial position based on direction
      packetPosition = direction === 'upstream' ? 0 : 100;
      packet.style.left = `${packetPosition}%`;
      
      // Start animation
      animatePacket();
      
      // Update compact play button
      const compactPlayButton = document.getElementById('compactPlayButton');
      if (compactPlayButton) {
        compactPlayButton.innerHTML = `
          <svg viewBox="0 0 24 24" width="18" height="18">
            <rect x="6" y="4" width="4" height="16" fill="currentColor"></rect>
            <rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>
          </svg>
        `;
      }
    }
  }
  
  // Toggle direction of animation
  function toggleDirection() {
    direction = direction === 'upstream' ? 'downstream' : 'upstream';
    
    // Reset packet state when changing direction
    const packet = document.getElementById('dataPacket');
    packet.classList.remove('fade-out');
    
    // Set initial position based on new direction
    packetPosition = direction === 'upstream' ? 0 : 100;
    packet.style.left = `${packetPosition}%`;
    
    // Update the packet direction indicator
    if (direction === 'upstream') {
      packet.querySelector('.packet-indicator').classList.remove('downstream-packet');
      packet.querySelector('.packet-indicator').classList.add('upstream-packet');
      packet.querySelector('.packet-indicator').textContent = '↑';
    } else {
      packet.querySelector('.packet-indicator').classList.remove('upstream-packet');
      packet.querySelector('.packet-indicator').classList.add('downstream-packet');
      packet.querySelector('.packet-indicator').textContent = '↓';
    }
    
    // Update direction toggle
    updateDirectionToggle();
    
    // Update visualization
    updatePacketVisualization();
  }
  
  // Animate packet movement
  function animatePacket() {
    if (!isAnimating) return;
    
    // Get the data packet element
    const packet = document.getElementById('dataPacket');
    
    // Check if packet has the fade-out class and if the opacity transition has completed
    if (packet.classList.contains('fade-out') && parseFloat(getComputedStyle(packet).opacity) < 0.1) {
      // Reset packet position and remove fade-out class
      packet.classList.remove('fade-out');
      
      // Reset position based on direction
      if (direction === 'upstream') {
        packetPosition = 0;
      } else {
        packetPosition = 100;
      }
      
      // Update packet position immediately
      packet.style.left = `${packetPosition}%`;
      
      // Wait a brief moment before continuing animation (gives a pause between packets)
      setTimeout(() => {
        animationFrame = requestAnimationFrame(animatePacket);
      }, 500);
      
      return;
    }
    
    // Move the packet based on direction
    if (direction === 'upstream') {
      packetPosition += 0.2 * animationSpeed;
      if (packetPosition >= 100) {
        // Instead of resetting position, add fade-out class
        packet.classList.add('fade-out');
      }
    } else {
      packetPosition -= 0.2 * animationSpeed;
      if (packetPosition <= 0) {
        // Instead of resetting position, add fade-out class
        packet.classList.add('fade-out');
      }
    }
    
    // Update packet position
    packet.style.left = `${packetPosition}%`;
    
    // Update visualization
    updatePacketVisualization();
    
    // Continue animation
    animationFrame = requestAnimationFrame(animatePacket);
  }
  
  // Get current packet tags based on position
  function getCurrentPacketTags() {
    const pos = packetPosition;
    
    if (direction === 'upstream') {
      if (pos < 17) return { label: 'Untagged Data', tags: [] };
      if (pos < 37) return { label: 'UNIVLAN Added', tags: [`UNIVLAN: ${config.univlan}`] };
      if (pos < 62) return { label: 'CVLAN Added', tags: [`UNIVLAN: ${config.univlan}`, `CVLAN: ${config.cvlan}`] };
      if (pos < 83) return { label: 'SVLAN Added', tags: [`UNIVLAN: ${config.univlan}`, `CVLAN: ${config.cvlan}`, `SVLAN: ${config.svlan}`] };
      return { label: 'UNIVLAN Removed', tags: [`CVLAN: ${config.cvlan}`, `SVLAN: ${config.svlan}`] };
    } else {
      if (pos > 83) return { label: 'Double-tagged', tags: [`SVLAN: ${config.svlan}`, `CVLAN: ${config.cvlan}`] };
      if (pos > 62) return { label: 'UNIVLAN Added', tags: [`SVLAN: ${config.svlan}`, `CVLAN: ${config.cvlan}`, `UNIVLAN: ${config.univlan}`] };
      if (pos > 37) return { label: 'SVLAN Removed', tags: [`CVLAN: ${config.cvlan}`, `UNIVLAN: ${config.univlan}`] };
      if (pos > 17) return { label: 'CVLAN Removed', tags: [`UNIVLAN: ${config.univlan}`] };
      return { label: 'Untagged Data', tags: [] };
    }
  }
  
  // Get active device based on packet position
  function getActiveDevice() {
    if (direction === 'upstream') {
      if (packetPosition < 17) return 'uni';
      if (packetPosition < 37) return 'uni';
      if (packetPosition < 62) return 'ont';
      if (packetPosition < 83) return 'olt';
      return 'bng';
    } else {
      if (packetPosition > 83) return 'bng';
      if (packetPosition > 62) return 'olt';
      if (packetPosition > 37) return 'ont';
      if (packetPosition > 17) return 'uni';
      return 'uni';
    }
  }
  
  // Get current action description
  function getCurrentAction() {
    if (direction === 'upstream') {
      if (packetPosition < 17) return "Subscriber data entering UNI port";
      if (packetPosition < 37) return "UNI port (VEIP) adding UNIVLAN tag";
      if (packetPosition < 62) return "ONT adding CVLAN tag";
      if (packetPosition < 83) return "OLT adding SVLAN tag";
      return "OLT removing UNIVLAN tag before sending to BNG";
    } else {
      if (packetPosition > 83) return "BNG sending double-tagged traffic";
      if (packetPosition > 62) return "OLT adding UNIVLAN tag before passing to ONT";
      if (packetPosition > 37) return "ONT removing SVLAN tag";
      if (packetPosition > 17) return "UNI port removing CVLAN tag";
      return "UNI port removing UNIVLAN tag before delivery to subscriber";
    }
  }
  
  // Update packet visualization based on current state
  function updatePacketVisualization() {
    const packetInfo = getCurrentPacketTags();
    const activeDevice = getActiveDevice();
    
    // Update packet status
    packetStatus.textContent = packetInfo.label;
    
    // Update current action
    currentAction.textContent = getCurrentAction();
    
    // Update device highlighting
    for (const [device, element] of Object.entries(devices)) {
      if (device === activeDevice) {
        element.classList.add('device-active');
        
        // Add tooltip if not already present
        if (!element.querySelector('.device-tooltip')) {
          const tooltip = document.createElement('div');
          tooltip.className = 'device-tooltip';
          tooltip.innerHTML = getCurrentActionForDevice(device);
          element.appendChild(tooltip);
        } else {
          element.querySelector('.device-tooltip').innerHTML = getCurrentActionForDevice(device);
        }
      } else {
        element.classList.remove('device-active');
        const tooltip = element.querySelector('.device-tooltip');
        if (tooltip) {
          element.removeChild(tooltip);
        }
      }
    }
    
    // Update tags display
    tagsContainer.innerHTML = '';
    if (packetInfo.tags.length === 0) {
      const untaggedElement = document.createElement('div');
      untaggedElement.className = 'tag untagged';
      untaggedElement.textContent = 'Untagged Data';
      tagsContainer.appendChild(untaggedElement);
    } else {
      packetInfo.tags.forEach(tag => {
        const tagElement = document.createElement('div');
        tagElement.textContent = tag;
        
        if (tag.includes('UNIVLAN')) {
          tagElement.className = 'tag univlan-tag';
        } else if (tag.includes('CVLAN')) {
          tagElement.className = 'tag cvlan-tag';
        } else {
          tagElement.className = 'tag svlan-tag';
        }
        
        tagsContainer.appendChild(tagElement);
      });
    }
  }
  
  // Get current action description for a specific device
  function getCurrentActionForDevice(device) {
    if (direction === 'upstream') {
      switch (device) {
        case 'uni':
          return 'Adding UNIVLAN tag';
        case 'ont':
          return 'Adding CVLAN tag';
        case 'olt':
          return 'Adding SVLAN tag,<br>removing UNIVLAN';
        case 'bng':
          return 'Receiving<br>SVLAN+CVLAN data';
        default:
          return '';
      }
    } else {
      switch (device) {
        case 'bng':
          return 'Sending<br>SVLAN+CVLAN data';
        case 'olt':
          return 'Adding UNIVLAN tag';
        case 'ont':
          return 'Removing SVLAN tag';
        case 'uni':
          return 'Removing<br>UNIVLAN tag';
        default:
          return '';
      }
    }
  }
  
  // Handle ONT search functionality
  function initOntSearch() {
    document.getElementById('ontSearch').addEventListener('input', function(e) {
      const searchValue = e.target.value.toLowerCase();
      const options = document.getElementById('ontSelector').options;
      
      for (let i = 0; i < options.length; i++) {
        const optionText = options[i].text.toLowerCase();
        if (i === 0 || optionText.includes(searchValue)) {
          options[i].style.display = '';
        } else {
          options[i].style.display = 'none';
        }
      }
    });
  }
  
  // Handle ONT selection
  function initOntSelector() {
    document.getElementById('ontSelector').addEventListener('change', function(e) {
      const selectedOntId = e.target.value;
      if (selectedOntId) {
        document.getElementById('emptyState').style.display = 'none';
        // Enable the Add Service button
        document.getElementById('addServiceBtn').disabled = false;
      }
    });
  }
  
  // Handle Add Service button click
  function initAddServiceButton() {
    document.getElementById('addServiceBtn').addEventListener('click', function() {
      // Show the service form
      document.getElementById('serviceForm').style.display = 'block';
      document.getElementById('emptyState').style.display = 'none';
    });
  }
  
  // Handle Cancel button click
  function initCancelButton() {
    document.getElementById('cancelBtn').addEventListener('click', function() {
      // Hide the service form
      document.getElementById('serviceForm').style.display = 'none';
      document.getElementById('emptyState').style.display = 'block';
    });
  }
  
  // Handle tab switching
  function initTabSwitching() {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', function() {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Add active class to the clicked tab
        this.classList.add('active');
        
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
          content.classList.remove('active');
        });
        
        // Show the corresponding tab content
        const tabId = this.getAttribute('data-tab');
        document.getElementById(tabId + 'Tab').classList.add('active');
      });
    });
  }
  
  // Set up Create Template button functionality
  function initCreateTemplateButton() {
    document.getElementById('templateBtn').addEventListener('click', function() {
      // Reuse the existing submit functionality but mark as a template
      createService(true);
    });
  }
  
  // Set up Create Service button functionality
  function initCreateServiceButton() {
    document.getElementById('createBtn').addEventListener('click', function() {
      createService(false);
    });
  }
  
  // Unified function for creating service or template
  function createService(isTemplate) {
    // Create an object with all configuration settings
    const formData = {
      usBandwidth: config.usBandwidth,
      dsBandwidth: config.dsBandwidth,
      connectionType: config.connectionType,
      upstreamPbits: config.upstreamPbits,
      downstreamPbits: config.downstreamPbits,
      vlanConfig: {
        univlan: config.univlan,
        cvlan: config.cvlan,
        svlan: config.svlan
      },
      security: {
        macAntiSpoofing: config.macAntiSpoofing,
        ipAntiSpoofing: config.ipAntiSpoofing,
        hairPinning: config.hairPinning,
        multicase: config.multicase
      },
      isTemplate: isTemplate
    };
    
    // Create a formatted security settings text
    const securitySettings = `Security Settings:
    - MAC Anti-Spoofing: ${config.macAntiSpoofing ? 'Enabled' : 'Disabled'}
    - IP Anti-Spoofing: ${config.ipAntiSpoofing ? 'Enabled' : 'Disabled'}
    - Hair Pinning: ${config.hairPinning ? 'Enabled' : 'Disabled'}
    - Multicast: ${config.multicase ? 'Enabled' : 'Disabled'}\n`;
  
    // Generate a service name using the convention
    const serviceName = `SVC-${config.usBandwidth}U${config.dsBandwidth}D-T${config.connectionType.slice(-1)}-P${config.upstreamPbits}${config.downstreamPbits}-V${config.univlan}-${config.cvlan}-${config.svlan}`;
    
    // Display alert with different text based on whether it's a template
    const typeText = isTemplate ? "Template" : "Service";
    alert(`${typeText} created successfully with the following configuration:\n` + 
          `Name: ${serviceName}\n` +
          `Upstream: ${config.usBandwidth} Mbps\n` +
          `Downstream: ${config.dsBandwidth} Mbps\n` +
          `Connection Type: ${config.connectionType}\n` +
          `Upstream Pbits: ${config.upstreamPbits}\n` +
          `Downstream Pbits: ${config.downstreamPbits}\n` +
          `VLAN IDs: UNIVLAN ${config.univlan}, CVLAN ${config.cvlan}, SVLAN ${config.svlan}\n` +
          securitySettings);
    
    if (!isTemplate) {
      // Add the service to the sidebar
      addServiceToSidebar(serviceName, formData);
      
      // Hide the form
      document.getElementById('serviceForm').style.display = 'none';
      document.getElementById('emptyState').style.display = 'block';
    }
  }
  
  // Function to add a service to the sidebar
  function addServiceToSidebar(serviceName, serviceData) {
    const serviceList = document.getElementById('serviceList');
    
    // Create service item container
    const serviceItem = document.createElement('div');
    serviceItem.className = 'service-item';
    serviceItem.dataset.service = JSON.stringify(serviceData);
    
    // Create service name element
    const serviceNameEl = document.createElement('span');
    serviceNameEl.className = 'service-name';
    serviceNameEl.textContent = serviceName;
    
    // Create delete button
    const deleteButton = document.createElement('button');
    deleteButton.className = 'delete-service-btn';
    deleteButton.innerHTML = '×';
    deleteButton.title = 'Delete Service';
    
    // Add event listener to delete button
    deleteButton.addEventListener('click', function(event) {
      // Prevent the click from bubbling up to the service item
      event.stopPropagation();
      
      // Confirm before deleting
      if (confirm(`Are you sure you want to delete the service "${serviceName}"?`)) {
        serviceList.removeChild(serviceItem);
        
        // If this service was selected, hide the form
        if (serviceItem.classList.contains('active')) {
          document.getElementById('serviceForm').style.display = 'none';
          document.getElementById('emptyState').style.display = 'block';
        }
        
        // If no services left, show empty state
        if (serviceList.children.length === 0) {
          document.getElementById('emptyState').style.display = 'block';
        }
      }
    });
    
    // Add elements to service item
    serviceItem.appendChild(serviceNameEl);
    serviceItem.appendChild(deleteButton);
    
    // Add click event to service item
    serviceItem.addEventListener('click', function() {
      // Remove active class from all services
      document.querySelectorAll('.service-item').forEach(item => {
        item.classList.remove('active');
      });
      
      // Add active class to the clicked service
      this.classList.add('active');
      
      // Load this service data
      const data = JSON.parse(this.dataset.service);
      loadServiceData(data);
      
      // Show the form
      document.getElementById('serviceForm').style.display = 'block';
      document.getElementById('emptyState').style.display = 'none';
    });
    
    serviceList.appendChild(serviceItem);
  }
  
  // Function to load service data into the form
  function loadServiceData(data) {
    // Set values in the form
    document.getElementById('usBandwidth').value = data.usBandwidth;
    document.getElementById('dsBandwidth').value = data.dsBandwidth;
    document.getElementById('connectionType').value = data.connectionType;
    document.getElementById('upstreamPbits').value = data.upstreamPbits;
    document.getElementById('downstreamPbits').value = data.downstreamPbits;
    document.getElementById('univlan').value = data.vlanConfig.univlan;
    document.getElementById('cvlan').value = data.vlanConfig.cvlan;
    document.getElementById('svlan').value = data.vlanConfig.svlan;
    
    // Update config object
    config.usBandwidth = data.usBandwidth;
    config.dsBandwidth = data.dsBandwidth;
    config.connectionType = data.connectionType;
    config.upstreamPbits = data.upstreamPbits;
    config.downstreamPbits = data.downstreamPbits;
    config.univlan = data.vlanConfig.univlan;
    config.cvlan = data.vlanConfig.cvlan;
    config.svlan = data.vlanConfig.svlan;
    
    // Set checkboxes
    document.getElementById('macAntiSpoofing').checked = data.security.macAntiSpoofing;
    document.getElementById('ipAntiSpoofing').checked = data.security.ipAntiSpoofing;
    document.getElementById('hairPinning').checked = data.security.hairPinning;
    document.getElementById('multicase').checked = data.security.multicase;
    
    // Update config security settings
    config.macAntiSpoofing = data.security.macAntiSpoofing;
    config.ipAntiSpoofing = data.security.ipAntiSpoofing;
    config.hairPinning = data.security.hairPinning;
    config.multicase = data.security.multicase;
    
    // Update visualization
    updatePacketVisualization();
    
    // Show the basic tab by default when loading a service
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector('.tab[data-tab="basic"]').classList.add('active');
    
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById('basicTab').classList.add('active');
  }
  
  // Initialize compact controls with existing animation functions
  function initCompactControls() {
    // Connect compact controls to existing animation functionality
    if (document.getElementById('compactPlayButton')) {
      document.getElementById('compactPlayButton').addEventListener('click', function() {
        toggleAnimation();
        updateCompactPlayButton();
      });
    }
  
    if (document.getElementById('directionToggle')) {
      document.getElementById('directionToggle').addEventListener('change', function() {
        if (this.checked) {
          // Set to downstream
          if (direction !== 'downstream') {
            toggleDirection();
          }
        } else {
          // Set to upstream
          if (direction !== 'upstream') {
            toggleDirection();
          }
        }
      });
    }
  
    if (document.getElementById('compactSpeedSlider')) {
      document.getElementById('compactSpeedSlider').addEventListener('input', function() {
        animationSpeed = parseFloat(this.value);
      });
    }
  }
  
  // VLAN Info Tooltip functionality
  function initVlanInfoTooltip() {
    const vlanInfoIcon = document.getElementById('vlanInfoIcon');
    const vlanInfoTooltip = document.getElementById('vlanInfoTooltip');
    const closeInfoTooltip = document.getElementById('closeInfoTooltip');
  
    if (vlanInfoIcon && vlanInfoTooltip && closeInfoTooltip) {
      vlanInfoIcon.addEventListener('click', function(e) {
        // Stop event propagation to prevent document click from closing it immediately
        e.stopPropagation();
        
        // Toggle the visible class
        vlanInfoTooltip.classList.toggle('visible');
        
        // Update the example tags with current values
        const univlanExample = vlanInfoTooltip.querySelector('.info-tooltip-section:nth-child(3) .tag-example');
        const cvlanExample = vlanInfoTooltip.querySelector('.info-tooltip-section:nth-child(4) .tag-example');
        const svlanExample = vlanInfoTooltip.querySelector('.info-tooltip-section:nth-child(5) .tag-example');
        
        if (univlanExample && cvlanExample && svlanExample) {
          univlanExample.textContent = `UNIVLAN: ${config.univlan}`;
          cvlanExample.textContent = `CVLAN: ${config.cvlan}`;
          svlanExample.textContent = `SVLAN: ${config.svlan}`;
        }
      });
  
      closeInfoTooltip.addEventListener('click', function(e) {
        e.stopPropagation();
        vlanInfoTooltip.classList.remove('visible');
      });
  
      // Close the tooltip when clicking outside
      document.addEventListener('click', function(e) {
        if (!vlanInfoTooltip.contains(e.target) && e.target !== vlanInfoIcon) {
          vlanInfoTooltip.classList.remove('visible');
        }
      });
  
      // Prevent clicks inside the tooltip from closing it
      vlanInfoTooltip.addEventListener('click', function(e) {
        e.stopPropagation();
      });
    }
  }
  
  
  // Function to update compact play button icon
  function updateCompactPlayButton() {
    const compactPlayButton = document.getElementById('compactPlayButton');
    if (!compactPlayButton) return;
    
    if (isAnimating) {
      compactPlayButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18">
          <rect x="6" y="4" width="4" height="16" fill="currentColor"></rect>
          <rect x="14" y="4" width="4" height="16" fill="currentColor"></rect>
        </svg>
      `;
    } else {
      compactPlayButton.innerHTML = `
        <svg viewBox="0 0 24 24" width="18" height="18">
          <polygon points="5 3 19 12 5 21" fill="currentColor"></polygon>
        </svg>
      `;
    }
  }
  
  // Update the direction toggle based on current direction
  function updateDirectionToggle() {
    const directionToggle = document.getElementById('directionToggle');
    if (!directionToggle) return;
    
    directionToggle.checked = (direction === 'downstream');
  }
  
  // Update all compact controls to match current state
  function updateCompactControls() {
    updateCompactPlayButton();
    updateDirectionToggle();
    
    const compactSpeedSlider = document.getElementById('compactSpeedSlider');
    if (compactSpeedSlider) {
      compactSpeedSlider.value = animationSpeed;
    }
  }
  
  // Initialize application
  document.addEventListener('DOMContentLoaded', function() {
    // Initialize DOM elements
    initDOMElements();
    
    // Initialize form with config values
    initFormValues();
    
    // Set up event listeners for form inputs
    initFormListeners();
    
    // Initialize visualization
    updatePacketVisualization();
    
    // Initialize ONT search
    initOntSearch();
    
    // Initialize ONT selector
    initOntSelector();
    
    // Initialize Add Service button
    initAddServiceButton();
    
    // Initialize Cancel button
    initCancelButton();
    
    // Initialize tab switching
    initTabSwitching();
    
    // Initialize Create Template button
    initCreateTemplateButton();
    
    // Initialize Create Service button
    initCreateServiceButton();
    
    // Initialize compact controls
    initCompactControls();
    
    // Initialize VLAN info tooltip
    initVlanInfoTooltip();
    
    // Initialize compact controls state
    updateCompactControls();
    
    // Hide the service form initially
    document.getElementById('serviceForm').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
    
    // Disable Add Service button until an ONT is selected
    document.getElementById('addServiceBtn').disabled = true;
  });

  document.addEventListener('DOMContentLoaded', function() {
  // For debugging purposes
  console.log('Initializing VLAN info tooltip');
  const vlanInfoIcon = document.getElementById('vlanInfoIcon');
  const vlanInfoTooltip = document.getElementById('vlanInfoTooltip');
  console.log('Info icon exists:', !!vlanInfoIcon);
  console.log('Info tooltip exists:', !!vlanInfoTooltip);
  
  if (vlanInfoIcon && vlanInfoTooltip) {
    // Add a manual test event to check tooltip visibility
    window.testTooltip = function() {
      vlanInfoTooltip.classList.toggle('visible');
      console.log('Tooltip visibility toggled. Current class list:', vlanInfoTooltip.classList);
    };
  }
});