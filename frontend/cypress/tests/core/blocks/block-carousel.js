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

  it('As editor I can add a carousel block', () => {
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
      path: '/',
    });
    cy.visit('/edit');
    cy.wait(1000);

    // WHEN I create a carousel block

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
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get(
      '.olw-item-wrapper .olw-item-title-bar[aria-label="Show item #2"]',
    ).click();
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get(
      '.olw-item-wrapper .olw-item-title-bar[aria-label="Show item #3"]',
    ).click();
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get(
      '.olw-item-wrapper .olw-item-title-bar[aria-label="Show item #4"]',
    ).click();
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.wait(500);
    cy.get(
      '.olw-item-wrapper .olw-item-title-bar[aria-label="Show item #5"]',
    ).click();
    cy.get(
      '.olw-item-wrapper.active .objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select Blue Orchids"]').dblclick();
    cy.get('#field-headline').click().clear().type('Carousel Block');
    cy.get('#field-items_to_show').click().clear().type('2');
    // Select the checkbox
    cy.get('#field-hide_description')
      .check({ force: true })
      .should('be.checked');

    cy.get('#field-hide_description')
      .uncheck({ force: true })
      .should('not.be.checked');
    cy.get('#toolbar-save').click();

    // Assert the heading, description and image is present
    cy.get('h2.headline').contains('Carousel Block');
    cy.get('.block.teaser .image-wrapper img')
      .should('have.attr', 'src')
      .and('include', '/document/my-image/@@images/image-215-');
    cy.get('.block.teaser .card-summary h2').contains('Blue Orchids');
    cy.get('.block.teaser .card-summary p').contains(
      'are growing on the mountain tops',
    );
    cy.get('.carousel-dots button').click({ multiple: true });
  });
});
