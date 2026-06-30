context('Maps Block', () => {
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

  it('create a maps block with a title and translate it', () => {
    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('maps');
    cy.get('.block.maps .toolbar-inner .ui.input input')
      .type(
        '<iframe src="https://www.google.com/maps/embed?pb=" width="600" height="450" frameborder="0" style="border:0" allowfullscreen></iframe>',
      )
      .type('{enter}');

    // The maps title is rendered as the iframe `title` attribute.
    cy.get('#sidebar-properties #field-title').type('Hello world');

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    cy.createTranslation();
    cy.wait(2000);
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.block.maps iframe.google-map')
      .should('have.attr', 'title')
      .and('include', 'Hallo');
  });
});
