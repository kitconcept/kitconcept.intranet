context('Logos Block', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    cy.viewport('macbook-16');

    cy.setupDeepL();

    // The intranet is a multilingual site: all content lives under `/en`.
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

    // The Document the logo links to.
    cy.createContent({
      contentType: 'Document',
      contentId: 'blue-orchids',
      contentTitle: 'Blue Orchids',
      path: '/en',
    });

    // The Document that hosts the logos block.
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'Hello',
      path: '/en',
    });
  });

  it('create a logos block (alt + href) and translate it', () => {
    // Translate the link target first so the logo href is rewritten on translation.
    cy.visit('/en/blue-orchids');
    cy.createTranslation();
    cy.url().should('include', '/de');
    cy.get('#toolbar-save').click();

    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('logos');

    // Add a logo item.
    cy.get(
      '#sidebar-properties .field-wrapper-logos .add-item-button-wrapper button[aria-label="Add logo"]',
    ).click();

    // Logo image (object browser opens on the page folder, use site-wide search).
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-logo-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('My Image');
    cy.wait(500);
    cy.get('[aria-label="Select My Image"]').dblclick();

    // Alt text (translatable).
    cy.get('.olw-item-wrapper.active [id^="field-alt-"]').type('Hello world');

    // Link target (translatable href).
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Blue Orchids');
    cy.wait(500);
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    // translate the page to German
    cy.createTranslation();
    cy.wait(2000);
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.block.logos img.logo-image')
      .should('have.attr', 'alt')
      .and('include', 'Hallo');
    cy.get('.block.logos a.logo-link')
      .should('have.attr', 'href')
      .and('include', '/de');
  });
});
