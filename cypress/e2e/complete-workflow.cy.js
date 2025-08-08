describe('Photoevents - Workflow Complet', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('devrait permettre le workflow complet utilisateur', () => {
    // 1. Page d'accueil
    cy.get('h1, h2').should('contain', /Photoevents|Bienvenue/i);
    cy.get('a, button').contains(/événements|events/i).should('be.visible');

    // 2. Navigation vers les événements
    cy.get('a, button').contains(/événements|events/i).click();
    cy.url().should('include', '/events');

    // Vérifier que la page se charge
    cy.waitForPageLoad();
    
    // Vérifier la présence d'événements ou le message "aucun événement"
    cy.get('body').then($body => {
      if ($body.find('[data-testid="event-card"], .event-card, .event-item').length > 0) {
        cy.get('[data-testid="event-card"], .event-card, .event-item').first().click();
        cy.url().should('match', /\/events\/[a-f0-9]+\/photos|\/eventsphotos/);
      } else {
        cy.contains(/aucun événement|no events/i).should('be.visible');
      }
    });
  });

  it('devrait permettre l\'authentification admin et gestion d\'événements', () => {
    // 1. Login admin
    cy.login();
    
    // 2. Navigation vers admin
    cy.get('a, button').contains(/admin|administration/i).click();
    cy.url().should('include', '/admin');

    // 3. Gestion des événements
    cy.get('a, button').contains(/événements|events/i).click();
    cy.url().should('include', '/admin/events');

    // 4. Créer un nouvel événement
    cy.get('button, a').contains(/créer|nouveau|ajouter/i).click();
    
    // Remplir le formulaire
    cy.get('input[name="name"]').type('Test E2E Event');
    cy.get('input[name="date"], input[type="date"]').type('2024-06-15');
    cy.get('input[name="location"]').type('Paris Test Location');
    cy.get('textarea[name="description"], input[name="description"]').type('Description test E2E');
    
    // Soumettre le formulaire
    cy.get('button[type="submit"]').click();

    // Vérifier la création
    cy.contains('Test E2E Event').should('be.visible');
    cy.expectToast(/succès|créé|ajouté/i);

    // 5. Modifier l'événement
    cy.get('[data-testid="edit-button"], button').contains(/modifier|edit/i).first().click();
    cy.get('input[name="name"]').clear().type('Test E2E Event - Modifié');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Test E2E Event - Modifié').should('be.visible');
    cy.expectToast(/mis à jour|modifié/i);

    // 6. Supprimer l'événement
    cy.get('[data-testid="delete-button"], button').contains(/supprimer|delete/i).first().click();
    cy.get('button').contains(/confirmer|oui|yes/i).click();
    
    cy.expectToast(/supprimé|deleted/i);
  });

  it('devrait permettre l\'upload et la gestion de photos', () => {
    cy.login();
    
    // Navigation vers upload
    cy.visit('/upload');
    cy.url().should('include', '/upload');

    // Test d'upload (simulé)
    cy.get('input[type="file"]').should('be.visible');
    
    // Si le composant d'upload est présent, tester la fonctionnalité
    cy.get('body').then($body => {
      if ($body.find('.upload-zone, [data-testid="upload-zone"]').length > 0) {
        // Simuler le drag and drop ou l'upload
        cy.get('.upload-zone, [data-testid="upload-zone"]').should('be.visible');
        
        // Test de validation des formats de fichiers
        cy.get('input[type="file"]').selectFile('cypress/fixtures/test-image.jpg', { force: true });
        
        // Vérifier le feedback d'upload
        cy.get('[data-testid="upload-progress"], .upload-progress').should('be.visible');
      }
    });
  });

  it('devrait gérer la recherche de photos par reconnaissance faciale', () => {
    cy.login();
    cy.visit('/my-photos');

    // Vérifier la présence d'une fonctionnalité de recherche
    cy.get('body').then($body => {
      if ($body.find('input[placeholder*="recherche"], input[type="search"]').length > 0) {
        cy.get('input[placeholder*="recherche"], input[type="search"]').type('test');
        cy.get('button').contains(/rechercher|search/i).click();
        
        // Vérifier les résultats ou le message "aucun résultat"
        cy.waitForPageLoad();
      }
    });
  });

  it('devrait être responsive sur mobile', () => {
    cy.viewport('iphone-x');
    cy.visit('/');

    // Vérifier que la navigation mobile fonctionne
    cy.get('[data-testid="mobile-menu"], .mobile-menu, .hamburger').click();
    cy.get('[data-testid="mobile-nav"], .mobile-nav').should('be.visible');
    
    // Tester la navigation mobile
    cy.get('a').contains(/événements|events/i).click();
    cy.url().should('include', '/events');
    
    // Vérifier que le contenu s'adapte au mobile
    cy.get('body').should('have.css', 'overflow-x', 'hidden');
  });

  it('devrait gérer les erreurs réseau', () => {
    // Intercept les requêtes API pour simuler des erreurs
    cy.intercept('GET', '/api/events', { statusCode: 500 }).as('getEventsError');
    
    cy.visit('/events');
    cy.wait('@getEventsError');
    
    // Vérifier l'affichage d'un message d'erreur
    cy.contains(/erreur|error|problème/i).should('be.visible');
    
    // Vérifier la présence d'un bouton de retry
    cy.get('button').contains(/réessayer|retry/i).click();
  });

  it('devrait maintenir l\'état d\'authentification après rechargement', () => {
    cy.login();
    cy.url().should('not.include', '/login');
    
    // Recharger la page
    cy.reload();
    
    // Vérifier que l'utilisateur reste connecté
    cy.url().should('not.include', '/login');
    cy.get('button, a').contains(/déconnexion|logout/i).should('be.visible');
  });

  it('devrait respecter les permissions utilisateur', () => {
    // Test avec utilisateur non-admin (si applicable)
    // cy.login('user@test.com', 'userpassword');
    
    // Tentative d'accès à une page admin
    cy.visit('/admin');
    
    // Devrait être redirigé ou voir un message d'erreur
    cy.url().should('satisfy', url => 
      url.includes('/login') || 
      url.includes('/unauthorized') || 
      url === Cypress.config().baseUrl + '/'
    );
  });

  it('devrait permettre la déconnexion', () => {
    cy.login();
    
    // Déconnexion
    cy.logout();
    
    // Vérifier la redirection vers la page de connexion ou d'accueil
    cy.url().should('satisfy', url => 
      url.includes('/login') || 
      url === Cypress.config().baseUrl + '/'
    );
    
    // Tentative d'accès à une page protégée
    cy.visit('/my-photos');
    cy.url().should('include', '/login');
  });
});
