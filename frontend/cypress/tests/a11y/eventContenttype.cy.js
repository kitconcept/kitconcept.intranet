describe('a11y tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/');
    cy.wait('@content');
  });

  //Event
  it('Event (/features/examples/content-types/event)', () => {
    cy.navigate('/features/examples/content-types/event');
    cy.wait('@content');
    cy.injectAxe();
    cy.configureAxe({
      rules: [
        // TODO: investigate why there are several h2 with the same id
        // Probably a Volto bug
        {
          id: 'duplicate-id',
          enabled: false,
        },
        {
          id: 'duplicate-id-active',
          enabled: false,
        },
        {
          id: 'region',
          enabled: false,
        },
      ],
    });
    cy.checkAccessibility();
  });
});
