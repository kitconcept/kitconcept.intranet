context('Teaser Block', () => {
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

  it('create a teaser block with customised fields and translate it', () => {
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
    cy.addNewBlock('teaser');
    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Link Target');
    cy.wait(500);
    cy.get('[aria-label="Select Link Target"]').dblclick();
    cy.get('#field-overwrite').check({ force: true });
    cy.get(
      '#blockform-fieldset-default .field-wrapper-title #field-title',
    ).type('Hello');
    cy.get(
      '#blockform-fieldset-default .field-wrapper-head_title #field-head_title',
    ).type('Hello');
    cy.get(
      '#blockform-fieldset-default .field-wrapper-description #field-description',
    ).type('Hello world');
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    cy.get('.block.teaser .headline').should('contain', 'Hello');
    cy.get('.block.teaser .title').should('contain', 'Hello');
    cy.get('.block.teaser .description').should('contain', 'Hello world');
    cy.get('.block.teaser a')
      .should('have.attr', 'href')
      .and('include', '/en/my-link-target');

    cy.createTranslation();

    cy.get('#page-add .block.teaser .title', { timeout: 10000 }).should(
      'contain',
      'Hallo',
    );
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.block.teaser .headline').should('contain', 'Hallo');
    cy.get('.block.teaser .title').should('contain', 'Hallo');
    cy.get('.block.teaser .description').should('contain', 'Hallo');
    cy.get('.block.teaser a').should('have.attr', 'href').and('include', '/de');
  });
});
