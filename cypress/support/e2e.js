// Import commands.js using ES2015 syntax:
import './commands'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Disable auto-scrolling behavior
Cypress.config('scrollBehavior', 'center')

// Custom command to login
Cypress.Commands.add('login', (email = 'admin@photoevents.com', password = 'admin123') => {
  cy.visit('/login')
  cy.get('input[name="email"], input[type="email"]').type(email)
  cy.get('input[name="password"], input[type="password"]').type(password)
  cy.get('button[type="submit"], button').contains(/connexion|login|se connecter/i).click()
  cy.url().should('not.include', '/login')
})

// Custom command to logout
Cypress.Commands.add('logout', () => {
  cy.get('button, a').contains(/déconnexion|logout|se déconnecter/i).click()
})

// Custom command to create test event
Cypress.Commands.add('createTestEvent', (eventData = {}) => {
  const defaultEvent = {
    name: 'Événement Test E2E',
    date: '2024-06-15',
    location: 'Paris Test',
    description: 'Description test E2E',
    ...eventData
  }

  cy.visit('/admin/events')
  cy.get('button, a').contains(/créer|ajouter|nouveau/i).click()
  
  Object.entries(defaultEvent).forEach(([key, value]) => {
    if (key === 'date') {
      cy.get(`input[name="${key}"], input[type="date"]`).type(value)
    } else {
      cy.get(`input[name="${key}"], textarea[name="${key}"]`).type(value)
    }
  })
  
  cy.get('button[type="submit"]').click()
})

// Hide fetch/XHR requests from command log to reduce noise
const app = window.top;
if (!app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = '.command-name-request, .command-name-xhr { display: none }';
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}
