context('Slate Block', () => {
  beforeEach(() => {
    cy.setupDeepL();
  });

  it('create /en page and translate it', () => {
    cy.visit('/en', {
      headers: {
        Accept: 'application/json',
      },
      failOnStatusCode: false,
      retryOnNetworkFailure: true,
    });
    cy.url().should('include', '/en');

    cy.get('#toolbar-add').click();
    cy.get('#toolbar-add-document').click();
    cy.get('.documentFirstHeading').type('Hello');
    cy.get('.text-slate-editor-inner').type('Hello world');
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/hello');

    cy.createTranslation();
    cy.get('#page-add h1', { timeout: 10000 }).should('contain', 'Hallo');
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/hallo');
  });
});
