context('Heading Block', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');

    cy.setupDeepL();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'Hello',
      path: '/en',
    });
  });

  it('create a heading block and translate it', () => {
    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('heading');
    cy.get('.block.heading .editable').click().type('Hello world');

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    cy.get('.block.heading .heading').should('contain', 'Hello world');

    // translate the page to German
    cy.createTranslation();

    cy.get('#page-add .block.heading .heading', { timeout: 10000 }).should(
      'contain',
      'Hallo',
    );
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.block.heading .heading').should('contain', 'Hallo');
  });
});
