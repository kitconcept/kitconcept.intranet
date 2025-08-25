context('IFrame block Acceptance Tests', () => {
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

  it('As editor I can add an IFrame block', () => {
    cy.navigate('/document/edit');
    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser div[aria-label="Unfold Common blocks"]').click();
    cy.get('.blocks-chooser .button.iframe').click();

    cy.get(".block-editor-iframe .toolbar-inner input").type(
      'https://plone.org',
    );

    cy.get(".block-editor-iframe .toolbar-inner button:not(.cancel)").click();

    cy.get("#blockform-fieldset-default #field-description").type(
      'Plone is an open-source content management system (CMS).'
    );

   cy.get("#blockform-fieldset-default #field-height").type(
      '400'
    );

    //save
    cy.get('#toolbar-save').click();
    cy.url().should('eq', Cypress.config().baseUrl + '/document');
    cy.reload();
    cy.wait(1000);

    //test after save
    cy.get('#page-document .block.iframe iframe[src="https://plone.org"]').should('be.visible');
  });
});