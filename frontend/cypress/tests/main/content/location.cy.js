describe('Add Content Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');

    // give a logged in editor and the site root
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'My Page',
    });
    cy.visit('/');
    cy.wait('@content');
  });

  it('As editor I can add a location content type', function () {
    cy.get('#toolbar-add').click();
    cy.get('#toolbar-add-location').click();
    cy.getSlateTitle()
      .focus()
      .click()
      .type('Headquarters (Bonn)')
      .contains('Headquarters (Bonn)');
    cy.get('#toolbar-save').focus().click();
    cy.wait('@content');
    cy.url().should('eq', Cypress.config().baseUrl + '/headquarters-bonn');
  });
  it('As editor I can add a location to Document content type and find it in listing block', function () {
    cy.intercept('PATCH', '/**/my-page').as('save');

    cy.createContent({
      contentType: 'Location',
      contentId: 'headquarters-bonn-page',
      contentTitle: 'Headquarters (Bonn)',
    });
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-second-page',
      contentTitle: 'My Second Page',
    });
    cy.navigate('/my-page/edit');
    cy.wait('@schema');
    cy.get('#field-location_reference').click();
    cy.get(
      '#field-location_reference .react-select__menu .react-select__option',
    )
      .contains('Headquarters (Bonn)')
      .click();
    cy.get('#toolbar-save').focus().click();
    cy.wait('@content');
    cy.url().should('eq', Cypress.config().baseUrl + '/my-page');
    cy.navigate('/my-second-page/edit');
    cy.wait('@schema');
    cy.addNewBlock('listing');
    cy.get('.sidebar-container .tabs-wrapper .menu .item')
      .contains('Block')
      .click();
    cy.get('.querystring-widget .fields').contains('Add criteria').click();

    cy.get(
      '.querystring-widget .fields:first-of-type .field:first-of-type .react-select__menu .react-select__option',
    )
      .contains('Place')
      .click();
    cy.get('.querystring-widget .fields:first-of-type > .field').click();
    cy.get(
      '.querystring-widget .fields:first-of-type > .field .react-select__menu .react-select__option',
    )
      .contains('Headquarters (Bonn)')
      .click();
    //verify before save
    cy.get(`.block.listing .listing-item:first-of-type`).contains('My Page');

    cy.get('#toolbar-save').focus().click();
    cy.wait('@save');
    cy.get('#page-document .listing-item:first-of-type').contains('My Page');
    cy.url().should('eq', Cypress.config().baseUrl + '/my-second-page');
  });
});
