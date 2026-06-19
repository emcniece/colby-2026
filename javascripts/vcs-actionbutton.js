/**
 * ActionButton Advocacy Page Template Handler
 * 
 * This script handles:
 * 1. Wrapping all ActionButton iframes with styled wrapper divs
 * 2. Moving the first ActionButton to the top of basic pages (unless disabled)
 * 3. Applying responsive styling and positioning
 */

document.addEventListener("DOMContentLoaded", function () {
  const iframes = document.querySelectorAll("iframe.actionbutton");
  
  // Exit early if no ActionButtons found
  if (iframes.length === 0) return;
  
  // Check if we're on a basic page
  const isBasicPage = document.body.classList.contains('page-pages-show-basic') || 
                     document.body.classList.contains('page-pages-show-basic-wide');
  
  // Check if basic page has "disable ab template" tag
  const hasDisableTag = checkForDisableTag();
  
  let firstActionButtonMoved = false;
  
  // Process each ActionButton iframe
  iframes.forEach(function (iframe, index) {
    // Create wrapper div for ALL ActionButtons (universal styling)
    const wrapper = document.createElement("div");
    
    // Insert wrapper before the iframe
    const parent = iframe.parentNode;
    parent.insertBefore(wrapper, iframe);
    
    // Move iframe into the wrapper
    wrapper.appendChild(iframe);
    
    // Move FIRST ActionButton to top of basic pages (if not disabled)
    if (isBasicPage && !hasDisableTag && index === 0 && !firstActionButtonMoved) {
      moveActionButtonToTop(wrapper);
      firstActionButtonMoved = true;
    }
  });
  
  /**
   * Check if page has "disable ab template" tag
   * @returns {boolean} True if tag is found
   */
  function checkForDisableTag() {
    // Use the tags_list variable from layout.html that contains all page tags in lowercase
    if (typeof NB !== 'undefined' && NB.appConfig && NB.appConfig.pageTagsList) {
      const tagsList = NB.appConfig.pageTagsList.toLowerCase();
      return tagsList.includes('disable ab template');
    }
    
    // Fallback method: Check page tags section (for backward compatibility)
    const pageTags = document.querySelector('#page-tags');
    if (pageTags) {
      const tagLinks = pageTags.querySelectorAll('a');
      for (let tag of tagLinks) {
        if (tag.textContent.toLowerCase().trim() === 'disable ab template') {
          return true;
        }
      }
    }
    
    return false;
  }
  
  /**
   * Move ActionButton wrapper to the top of the page content
   * @param {HTMLElement} wrapper - The ActionButton wrapper element
   */
  function moveActionButtonToTop(wrapper) {
    // Find the best insertion point in order of preference
    let insertionPoint = null;
    let targetContainer = null;
    
    // Option 1: Before the intro div (main content area)
    const introDiv = document.querySelector('#intro');
    if (introDiv) {
      insertionPoint = introDiv;
      targetContainer = introDiv.parentNode;
    }
    
    // Option 2: Before the first content in basic-page-content container
    if (!insertionPoint) {
      const basicPageContent = document.querySelector('#basic-page-content');
      if (basicPageContent && basicPageContent.firstChild) {
        insertionPoint = basicPageContent.firstChild;
        targetContainer = basicPageContent;
      }
    }
    
    // Option 3: Beginning of the main content column
    if (!insertionPoint) {
      const contentColumn = document.querySelector('.col-12.col-lg-9') || 
                           document.querySelector('.col-12.col-md');
      if (contentColumn && contentColumn.firstChild) {
        insertionPoint = contentColumn.firstChild;
        targetContainer = contentColumn;
      }
    }
    
    // Option 4: Fallback to container or body
    if (!insertionPoint) {
      const container = document.querySelector('.container') || document.body;
      if (container.firstChild) {
        insertionPoint = container.firstChild;
        targetContainer = container;
      }
    }
    
    // Perform the move if we found a valid insertion point
    if (insertionPoint && targetContainer) {
      targetContainer.insertBefore(wrapper, insertionPoint);
    }
  }
});
