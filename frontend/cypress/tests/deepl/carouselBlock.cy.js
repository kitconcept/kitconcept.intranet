context('Carousel Block', () => {
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
        contentDescription: 'A picture of Half Dome',
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

    // The Document that hosts the carousel block.
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'Document',
      path: '/en',
    });
  });

  it('As editor I can add a carousel block and translate it', () => {
    // Translate the image so its own title/description exist in German.
    cy.visit('/en/my-image');
    cy.createTranslation();
    cy.url().should('include', '/de');
    cy.get('#toolbar-save').click();

    cy.visit('/en/blue-orchids');
    cy.createTranslation();
    cy.url().should('include', '/de');
    cy.get('#toolbar-save').click();

    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed .button.carousel')
      .contains('Carousel')
      .click({ force: true });
    cy.get(
      '.field-wrapper-columns .add-item-button-wrapper button[aria-label="Add item"]',
    )
      .should('be.visible')
      .click();

    cy.get(
      '.olw-item-wrapper .olw-item-title-bar[aria-label="Show item #"]',
    ).click();
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Blue Orchids');
    cy.wait(500);
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get(
      '.olw-item-wrapper.active [class*="field-wrapper-overwrite"] input',
    ).check({ force: true });
    cy.get(
      '.olw-item-wrapper.active [class*="field-wrapper-title-"] input',
    ).type(' Hello! Custom Teaser');
    cy.get(
      '.olw-item-wrapper.active [class*="field-wrapper-description"] textarea',
    ).type(' Hello world custom description');

    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-preview_image-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('My Image');
    cy.wait(500);
    cy.get('[aria-label="Select My Image"]').dblclick();

    cy.get(
      '.olw-item-wrapper .olw-item-title-bar[aria-label="Show item #2"]',
    ).click();
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Blue Orchids');
    cy.wait(500);
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get(
      '.olw-item-wrapper .olw-item-title-bar[aria-label="Show item #3"]',
    ).click();
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Blue Orchids');
    cy.wait(500);
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get(
      '.olw-item-wrapper .olw-item-title-bar[aria-label="Show item #4"]',
    ).click();
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Blue Orchids');
    cy.wait(500);
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get(
      '.olw-item-wrapper .olw-item-title-bar[aria-label="Show item #5"]',
    ).click();
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Blue Orchids');
    cy.wait(500);
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.get('#field-headline').click().clear().type('Hello! Carousel Block');
    cy.get('#field-items_to_show').click();
    cy.findByText('2').click();

    cy.get('#field-hide_description')
      .check({ force: true })
      .should('be.checked');

    cy.get('#field-hide_description')
      .uncheck({ force: true })
      .should('not.be.checked');
    cy.get('#toolbar-save').click();

    cy.createTranslation();

    cy.get('#page-add h2.headline', { timeout: 10000 }).should(
      'contain',
      'Hallo',
    );
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('h2.headline').should('contain', 'Hallo');
    cy.get('.block.teaser:first .card-summary .title')
      .should('be.visible')
      .and('contain', 'Hallo')
      .and('not.contain', 'Hello! Custom Teaser');
    cy.get('.block.teaser:first .card-summary p')
      .should('be.visible')
      .and('not.contain', 'Hello world custom description');
    cy.contains('.block.teaser .card-summary .title', 'Blaue Orchideen').should(
      'be.visible',
    );
    cy.get('.block.teaser .image-wrapper img').first().should('be.visible');
    cy.get('.block.teaser a')
      .first()
      .should('have.attr', 'href')
      .and('include', '/de');
  });
});
