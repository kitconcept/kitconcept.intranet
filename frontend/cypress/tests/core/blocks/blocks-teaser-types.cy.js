context('Blocks Acceptance Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    cy.viewport('macbook-16');
    cy.createContent({
      contentType: 'Document',
      contentId: 'document',
      contentTitle: 'Document',
    });
    cy.autologin();
    cy.visit('/');
    cy.wait('@content');
  });

  it('As editor I can add a (standalone) Teaser block for a Document', () => {
    // GIVEN a Document with the title document and a Document to reference with the title Blue Orchids
    cy.createContent({
      contentType: 'Image',
      contentId: 'my-image',
      contentTitle: 'My Image',
      path: 'document',
    });

    cy.createContent({
      contentType: 'Document',
      contentId: 'blue-orchids',
      contentTitle: 'Blue Orchids',
      contentDescription: 'are growing on the mountain tops',
      bodyModifier(body) {
        body.preview_image_link = {
          '@id': '/document/my-image',
        };
        return body;
      },
      path: '/document',
    });
    cy.visit('/document/edit');
    cy.wait('@schema');

    // WHEN I create a Teaser block
    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed .button.teaser')
      .contains('Teaser')
      .click({ force: true });
    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get('.align-buttons .ui.buttons button[aria-label="Center"]').click();
    cy.get('#toolbar-save').click();

    // THEN I can see the Teaser block
    cy.visit('/document');
    cy.get('.block.teaser').should('have.class', 'has--align--center');
    cy.get('.block.teaser .image-wrapper img')
      .should('have.attr', 'src')
      .and('include', '/document/my-image/@@images/image-215-');
    cy.get('.block.teaser .card-summary h2').contains('Blue Orchids');
    cy.get('.block.teaser .card-summary p').contains(
      'are growing on the mountain tops',
    );
  });

  it('As editor I can add a (standalone) Teaser block for an Event', () => {
    // GIVEN a Document with the title document and a Document to reference with the title Blue Orchids

    cy.createContent({
      contentType: 'Image',
      contentId: 'my-image',
      contentTitle: 'My Image',
      path: 'document',
    });

    cy.createContent({
      contentType: 'Event',
      contentId: 'blue-orchids',
      contentTitle: 'Blue Orchids',
      contentDescription: 'are growing on the mountain tops',
      bodyModifier(body) {
        body.preview_image_link = {
          '@id': '/document/my-image',
        };
        return body;
      },
      path: '/document',
    });
    cy.navigate('/document/edit');
    cy.wait('@schema');

    // WHEN I create a Teaser block
    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed .button.teaser')
      .contains('Teaser')
      .click({ force: true });
    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get('.align-buttons .ui.buttons button[aria-label="Center"]').click();
    cy.get('#toolbar-save').click();

    // THEN I can see the Teaser block
    cy.visit('/document');
    cy.get('.block.teaser').should('have.class', 'has--align--center');

    // No preview_image in Events by default
    cy.get('.block.teaser .image-wrapper img')
      .should('have.attr', 'src')
      .and('include', '/document/my-image/@@images/image-215-');
    cy.get('.block.teaser .card-summary h2').contains('Blue Orchids');
    cy.get('.headline .day').should('exist');

    // The createContent command has to be improved
    // cy.get('.block.teaser .card-summary p').contains(
    //   'are growing on the mountain tops',
    // );
  });

  it('As editor I can add a (standalone) Teaser block for a News Item', () => {
    // GIVEN a Document with the title document and a Document to reference with the title Blue Orchids

    cy.createContent({
      contentType: 'Image',
      contentId: 'my-image',
      contentTitle: 'My Image',
      path: 'document',
    });

    cy.createContent({
      contentType: 'News Item',
      contentId: 'blue-orchids',
      contentTitle: 'Blue Orchids',
      contentDescription: 'are growing on the mountain tops',
      transition: 'publish',
      bodyModifier(body) {
        body.preview_image_link = {
          '@id': '/document/my-image',
        };
        return body;
      },
      path: '/document',
    });
    cy.navigate('/document/edit');
    cy.wait('@schema');

    // WHEN I create a Teaser block
    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed .button.teaser')
      .contains('Teaser')
      .click({ force: true });
    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get('.align-buttons .ui.buttons button[aria-label="Center"]').click();
    cy.get('#toolbar-save').click();

    // THEN I can see the Teaser block
    cy.visit('/document');
    cy.get('.block.teaser').should('have.class', 'has--align--center');

    // No preview_image in News Items by default
    cy.get('.block.teaser .image-wrapper img')
      .should('have.attr', 'src')
      .and('include', '/document/my-image/@@images/image-215-');

    cy.get('.block.teaser .card-summary h2').contains('Blue Orchids');
    cy.get('.headline .day').should('exist');
    cy.get('.block.teaser .card-summary p').contains(
      'are growing on the mountain tops',
    );
  });

  it('As editor I can add a (standalone) Teaser block for a File', () => {
    // GIVEN a Document with the title document and a Document to reference with the title Blue Orchids

    cy.createContent({
      contentType: 'Image',
      contentId: 'my-image',
      contentTitle: 'My Image',
      path: 'document',
    });

    cy.createContent({
      contentType: 'File',
      contentId: 'blue-orchids',
      contentTitle: 'Blue Orchids',
      contentDescription: 'are growing on the mountain tops',
      transition: 'publish',
      bodyModifier(body) {
        body.preview_image_link = {
          '@id': '/document/my-image',
        };
        return body;
      },
      path: '/document',
    });
    cy.visit('/document/edit');
    cy.wait('@schema');

    // WHEN I create a Teaser block
    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed .button.teaser')
      .contains('Teaser')
      .click({ force: true });
    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get('.align-buttons .ui.buttons button[aria-label="Center"]').click();
    cy.get('#toolbar-save').click();

    // THEN I can see the Teaser block
    cy.visit('/document');
    cy.get('.block.teaser').should('have.class', 'has--align--center');

    // No preview_image in Files by default
    cy.get('.block.teaser .image-wrapper img')
      .should('have.attr', 'src')
      .and('include', '/document/my-image/@@images/image-215-');
    cy.get('.headline').should('exist');
    cy.get('.block.teaser .card-summary h2').contains('Blue Orchids');
    cy.get('.block.teaser .card-summary p').contains(
      'are growing on the mountain tops',
    );
  });
});
