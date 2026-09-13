context('Button Block', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');

    cy.setupDeepL();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-link-target',
      contentTitle: 'Link Target',
      path: '/en',
    });
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'Hello',
      path: '/en',
    });
  });

  it('create a button block (title + href) and translate it', () => {
    cy.visit('/en/my-link-target');
    cy.createTranslation();
    cy.url().should('include', '/de');
    cy.get('#toolbar-save').click();

    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('Button');

    cy.get(
      '#blockform-fieldset-default .field-wrapper-title #field-title',
    ).type('Read more');

    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Link Target');
    cy.wait(500);
    cy.get('[aria-label="Select Link Target"]').dblclick();

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    // translate the page to German
    cy.createTranslation();

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.block.__button a')
      .should('have.attr', 'href')
      .and('include', '/de');
  });
});
