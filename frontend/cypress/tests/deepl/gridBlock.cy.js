context('Grid Block', () => {
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

  it('create a grid block (image, teaser, text + headline) and translate it', () => {
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
    cy.addNewBlock('grid');
    cy.findByText('3 columns').click();

    cy.get('#field-headline').type('Hello');

    cy.get('button[aria-label="Add block in position 0"]').click();
    cy.get('.blocks-chooser .mostUsed .button.image').click();
    cy.findAllByLabelText('Enter a URL to an image').filter(':visible').click();
    cy.get('.ui.input.editor-link.input-anchorlink-theme input').type(
      `https://github.com/plone/volto/raw/main/logos/volto-colorful.png{enter}`,
    );
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

    cy.get('button[aria-label="Add block in position 1"]').click();
    cy.get('.blocks-chooser .mostUsed .button.teaser').click();
    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Link Target');
    cy.wait(500);
    cy.get('[aria-label="Select Link Target"]').dblclick();

    // column 2: text (slate) block
    cy.get('button[aria-label="Add block in position 2"]').click();
    cy.get('.blocks-chooser [aria-label="Unfold Text blocks"]').click();
    cy.wait(200);
    cy.get('.blocks-chooser .text .button.slate').click();
    cy.getSlateEditorSelectorAndType(
      '.block.gridBlock.selected .slate-editor [contenteditable=true]',
      'Hello world',
    );

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    // translate the page to German
    cy.createTranslation();

    cy.get('#page-add .block.gridBlock .block.image figcaption .title', {
      timeout: 10000,
    }).should('contain', 'Hallo');
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.block.gridBlock h2.headline').should('contain', 'Hallo');
    cy.get('.block.gridBlock .block.image figcaption .title').should(
      'contain',
      'Hallo',
    );
    cy.get('.block.gridBlock .slate').should('contain', 'Hallo');
    cy.get('.block.gridBlock .block.image a')
      .should('have.attr', 'href')
      .and('include', '/de');
    cy.get('.block.gridBlock .block.teaser a')
      .should('have.attr', 'href')
      .and('include', '/de');
  });
});
