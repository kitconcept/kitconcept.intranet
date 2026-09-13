context('Search Block', () => {
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

  it('create a search block with a headline and translate it', () => {
    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('search');

    cy.get('#sidebar-properties #field-headline').type('Hello world');

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    // translate the page to German
    cy.createTranslation();

    cy.get('#page-add .searchBlock-container .headline', {
      timeout: 10000,
    }).should('contain', 'Hallo');
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.searchBlock-container .headline').should('contain', 'Hallo');
  });
});
