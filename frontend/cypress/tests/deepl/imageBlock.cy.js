context('Image Block', () => {
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

  it('create /en page with an image block and translate it', () => {
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
    cy.get('.ui.basic.icon.button.block-add-button').click();
    cy.get('.ui.basic.icon.button.image').contains('Image').click();
    cy.get('input[type="file"]').attachFile('halfdome2022.jpg', {
      subjectType: 'input',
      encoding: 'utf8',
    });
    cy.get('.block.image figure img').should('exist');
    cy.get('.field-wrapper-alt #field-alt').type('Volto Logo');
    cy.get(
      '#blockform-fieldset-default .field-wrapper-title #field-title',
    ).type('Hello');
    cy.get(
      '#blockform-fieldset-default .field-wrapper-description #field-description',
    ).type('Hello world');
    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Link Target');
    cy.wait(500);
    cy.get('[aria-label="Select Link Target"]').dblclick();
    cy.get('#toolbar-save').click();

    cy.get('.block.image figcaption .title').should('contain', 'Hello');
    cy.get('.block.image figcaption .description').should(
      'contain',
      'Hello world',
    );
    cy.get('.block.image a')
      .should('have.attr', 'href')
      .and('include', '/en/my-link-target');

    cy.createTranslation();

    cy.get('#page-add .block.image figcaption .title', {
      timeout: 10000,
    }).should('contain', 'Hallo');
    cy.get('#page-add .block.image figcaption .description').should(
      'contain',
      'Hallo',
    );

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');
    cy.get('.block.image a').should('have.attr', 'href').and('include', '/de');
  });
});
