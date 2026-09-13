context('Highlight Block', () => {
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

  it('create a highlight block (title, description, buttonText) and translate it', () => {
    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('Highlight');

    cy.get('.block.highlight input[type="file"]').attachFile(
      'halfdome2022.jpg',
      {
        subjectType: 'input',
        encoding: 'utf8',
      },
    );
    cy.get('.block.highlight .highlight-image-wrapper img').should('exist');

    cy.get('.block.highlight .title [contenteditable=true]')
      .click()
      .type('Hello');
    cy.getSlateEditorSelectorAndType(
      '.block.highlight .description [contenteditable=true]',
      'Hello world',
    );

    cy.get('.ui.checkbox:last').click({ force: true });
    cy.get('#field-buttonText').type('Read more');

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    // translate the page to German
    cy.createTranslation();

    cy.get('#page-add .block.highlight .title', { timeout: 10000 }).should(
      'contain',
      'Hallo',
    );
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.block.highlight .title').should('contain', 'Hallo');
    cy.get('.block.highlight .description').should('contain', 'Hallo');
  });
});
