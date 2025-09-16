describe('a11y tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit('/');
    cy.wait('@content').its('response.statusCode').should('eq', 200);
  });

  // Organisational unit content type
  it('Organisational unit (/features/content-types/institute-of-robotics-and-mechatronics-organisational-unit)', () => {
    cy.navigate(
      '/features/content-types/institute-of-robotics-and-mechatronics-organisational-unit',
    );
    cy.wait('@content').its('response.statusCode').should('eq', 200);
    cy.injectAxe();
    cy.configureAxe();
    cy.checkAccessibility();
  });
});
