context('RSS block Acceptance Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');

    // given a logged in editor and a page in edit mode
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'document',
      contentTitle: 'Document',
    });
    cy.visit('/');
    cy.wait('@content');
  });

  it('As editor I can add an RSS block', () => {
    cy.navigate('/document/edit');
    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed  .button.rssBlock').click({
      force: true,
    });
    cy.get('#field-template', { timeout: 10000 }).should('be.visible').click();

    cy.get('#field-template').findByText('List').click();

    cy.get('.object-list-widget .react-aria-Button').click();

    cy.get(".olw-item-wrapper .olw-item-content .inline.field.text[class*='field-wrapper-url'] input[type='text']").type(
      'https://www.mozilla.org/en-US/firefox/nightly/notes/feed/',
    );

    cy.get(".olw-item-wrapper .olw-item-content .inline.field.text[class*='field-wrapper-source'] input[type='text']").type(
      'Mozilla',
    );

    //save
    cy.get('#toolbar-save').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/document');
    cy.reload();
    cy.wait(1000);

    //test after save
    cy.get('#page-document .listing-item.rss-item').contains('Mozilla');
  });
});
