context('Table of Contents Block', () => {
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

  it('create a toc block with a title and translate it', () => {
    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click().type('## Hello heading{enter}');
    cy.getSlate().click().type('### Hello world subheading{enter}');

    cy.getSlate().click().type('/table{downarrow}{enter}');

    cy.get('#blockform-fieldset-default #field-title').type('Hello world');

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    cy.createTranslation();

    cy.get('#page-add .table-of-contents h2', { timeout: 10000 }).should(
      'contain',
      'Hallo',
    );
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.table-of-contents h2').should('contain', 'Hallo');
    cy.get('.table-of-contents li').should('contain', 'Hallo');
    cy.get('.table-of-contents li ul li').should('contain', 'Hallo');
  });
});
