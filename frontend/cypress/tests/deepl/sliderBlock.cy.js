context('Slider Block', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    cy.viewport('macbook-16');

    cy.setupDeepL();

    cy.fixture('halfdome2022.jpg', 'base64').then((fileContent) => {
      cy.createContent({
        contentType: 'Image',
        contentId: 'my-image',
        contentTitle: 'My Image',
        path: '/en',
        bodyModifier(body) {
          body.image = {
            data: fileContent,
            encoding: 'base64',
            filename: 'image.png',
            'content-type': 'image/png',
          };
          return body;
        },
      });
    });

    cy.createContent({
      contentType: 'Document',
      contentId: 'blue-orchids',
      contentTitle: 'Blue Orchids',
      contentDescription: 'are growing on the mountain tops',
      preview_image_link: {
        '@id': '/en/my-image',
      },
      path: '/en',
    });

    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'Document',
      path: '/en',
    });
  });

  it('add a default variant slider block and translate it', () => {
    cy.visit('/en/blue-orchids');
    cy.createTranslation();
    cy.url().should('include', '/de');
    cy.get('#toolbar-save').click();

    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed .button.slider')
      .contains('Slider')
      .click({ force: true });

    cy.get(
      '.objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Blue Orchids');
    cy.wait(500);
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();

    cy.get('[id^="field-head_title-1-"]')
      .click()
      .clear()
      .type('Hello from Germany');
    cy.get('[id^="field-title-2-"]').click().clear().type('Hello title');
    cy.get('[id^="field-description-3-"]').click().clear().type('Hello world');
    cy.get('[id^="field-buttonText-5-"]').click().clear().type('Read More');

    cy.get(
      '.objectbrowser-field[aria-labelledby^="fieldset-default-field-label-preview_image-4-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('My Image');
    cy.wait(500);
    cy.get('[aria-label="Select My Image"]').dblclick();
    cy.wait(500);

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    // translate the page to German
    cy.createTranslation();
    cy.get('#page-add .block.slider .title h2', { timeout: 10000 }).should(
      'contain',
      'Hallo',
    );
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.block.slider .title h2').should('contain', 'Hallo');
    cy.get('.block.slider p').should('contain', 'Hallo');
    cy.get('.block.slider .highlight-image-wrapper img').should('be.visible');
    cy.get('.block.slider a')
      .first()
      .should('have.attr', 'href')
      .and('include', '/de');
  });
});
