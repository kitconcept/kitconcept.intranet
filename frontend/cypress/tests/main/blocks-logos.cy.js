context('Blocks Acceptance Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    cy.intercept('GET', '/**/my-page/@types/*').as('schema');
    cy.intercept('PATCH', '/**/my-page').as('save');

    // given a logged in editor and a page in edit mode
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'My Page',
    });
    cy.createContent({
      contentType: 'Image',
      contentId: 'my-image',
      contentTitle: 'My Image',
      path: '/my-page',
    });

    cy.visit('/my-page');
    cy.wait('@content');

    cy.navigate('/my-page/edit');
    cy.wait('@schema');
  });

  it('As editor I can add a Logos block', () => {
    // WHEN I create a logos block

    cy.getSlate().click();
    cy.get('.ui.basic.icon.button.block-add-button').click();
    cy.get('.blocks-chooser .mostUsed .button.logos')
      .contains('Logos')
      .click({ force: true });

    cy.get('.add-item-button-wrapper').click();
    cy.get(
      '.objectbrowser-field[aria-labelledby^="fieldset-default-field-label-logo-0-"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select My Image"]').dblclick();
    cy.get('[id^="field-alt-1-"]').click().clear().type('my image');
    cy.get(
      '.objectbrowser-field[aria-labelledby^="fieldset-default-field-label-href-2-"] .selected-values input ',
    )
      .click()
      .clear()
      .type('https://www.google.com/{enter}');
    // Select the checkbox
    cy.get('[id^="field-openLinkInNewTab-3-"]')
      .check({ force: true })
      .should('be.checked');

    cy.get('[id^="field-openLinkInNewTab-3-"]')
      .uncheck({ force: true })
      .should('not.be.checked');
    // Test the Logos Size button group
    cy.get('input[aria-label="Large"]').click({ force: true });
    cy.get('.buttons-widget-option:has(input[aria-label="Large"])').should(
      'have.attr',
      'data-selected',
      'true',
    );
    cy.get('.buttons-widget-option:has(input[aria-label="Small"])').should(
      'not.have.attr',
      'data-selected',
      'true',
    );

    cy.get('input[aria-label="Small"]').click({ force: true });
    cy.get('.buttons-widget-option:has(input[aria-label="Small"])').should(
      'have.attr',
      'data-selected',
      'true',
    );
    cy.get('.buttons-widget-option:has(input[aria-label="Large"])').should(
      'not.have.attr',
      'data-selected',
      'true',
    );

    // Test the Logos Container Width button group
    cy.get('input[aria-label="Layout"]').click({ force: true });
    cy.get('.buttons-widget-option:has(input[aria-label="Layout"])').should(
      'have.attr',
      'data-selected',
      'true',
    );
    cy.get('.buttons-widget-option:has(input[aria-label="Default"])').should(
      'not.have.attr',
      'data-selected',
      'true',
    );

    cy.get('input[aria-label="Default"]').click({ force: true });
    cy.get('.buttons-widget-option:has(input[aria-label="Default"])').should(
      'have.attr',
      'data-selected',
      'true',
    );
    cy.get('.buttons-widget-option:has(input[aria-label="Layout"])').should(
      'not.have.attr',
      'data-selected',
      'true',
    );

    cy.wait(500);

    cy.get('#toolbar-save').click();

    // Assert the heading is present
    cy.get('.documentFirstHeading').contains('My Page');

    // Assert the logo image is visible, has correct src and alt
    cy.get('.logos-container img')
      .should('be.visible')
      .and('have.attr', 'src')
      .and('include', '/my-page/my-image/@@images');
    cy.get('.logos-container img').should('have.attr', 'alt', 'my image');

    // Assert the link wraps the image and has correct href and target
    cy.get('.logos-container a')
      .should('have.attr', 'href', 'https://www.google.com/')
      .and('have.attr', 'target', '_blank');
  });
});
