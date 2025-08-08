// Custom commands for Photoevents app

Cypress.Commands.add('uploadFile', (fixture, selector) => {
  cy.get(selector).then(subject => {
    cy.fixture(fixture, 'base64').then(content => {
      const el = subject[0];
      const testFile = new File([content], fixture, { type: 'image/jpeg' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(testFile);
      el.files = dataTransfer.files;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    });
  });
});

Cypress.Commands.add('waitForPageLoad', (timeout = 10000) => {
  cy.get('body', { timeout }).should('be.visible');
});

Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y();
});

Cypress.Commands.add('selectDropdownOption', (selector, option) => {
  cy.get(selector).click();
  cy.get(`option`).contains(option).click();
});

Cypress.Commands.add('expectToast', (message, type = 'success') => {
  cy.get('[data-testid="toast"], .toast, .notification')
    .should('contain', message)
    .and('have.class', type);
});
