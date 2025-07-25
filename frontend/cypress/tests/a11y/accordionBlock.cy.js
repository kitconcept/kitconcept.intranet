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

  // Accordion Block
  it('Accordion Block (/features/examples/block/block-accordion)', () => {
    cy.navigate('/features/examples/block/block-accordion');
    cy.wait('@content');
    cy.injectAxe();
    cy.configureAxe({
      rules: [
        // the example page intentionally omits the h1
        {
          id: 'page-has-heading-one',
          enabled: false,
        },
        {
          id: 'duplicate-id',
          enabled: false,
        },
        {
          id: 'region',
          enabled: false,
        },
      ],
    });
    // To prevent color contrast error during css transition
    cy.wait(200);
    cy.checkAccessibility();
  });
});
