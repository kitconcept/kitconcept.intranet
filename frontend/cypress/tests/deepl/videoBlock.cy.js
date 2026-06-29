context('Video Block', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');

    cy.setupDeepL();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'Hello',
      path: '/en',
    });
  });

  it('create a video block with a title and translate it', () => {
    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.get('.ui.basic.icon.button.block-add-button').click();
    cy.get('.ui.basic.icon.button.video').contains('Video').click();
    cy.get('.toolbar-inner > .ui > input')
      .filter(':visible')
      .click()
      .type('https://youtu.be/T6J3d35oIAY')
      .type('{enter}');

    cy.get('#sidebar-properties #field-title').type('Hello world');

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    cy.createTranslation();
    cy.wait(2000);
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');
  });
});
