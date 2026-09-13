context('Table Block', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    
    cy.on('uncaught:exception', (err) => {
      if (err.message.includes("Failed to execute 'removeChild'")) {
        return false;
      }
      return true;
    });

    cy.setupDeepL();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'Hello',
      path: '/en',
    });
  });

  it('create a table block and translate its cells', () => {
    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('table');
    cy.wait(2000);

    // Fill every cell of the default 2x2 table.
    cy.get(
      '.celled.fixed.table thead tr th:first-child() [contenteditable="true"]',
    )
      .focus()
      .click()
      .type('Hello world one');
    cy.get(
      '.celled.fixed.table thead tr th:nth-child(2) [contenteditable="true"]',
    )
      .focus()
      .click()
      .type('Hello world two');
    cy.get(
      '.celled.fixed.table tbody tr:nth-child(1) td:first-child() [contenteditable="true"]',
    )
      .focus()
      .click()
      .type('Hello world three');
    cy.get(
      '.celled.fixed.table tbody tr:nth-child(1) td:nth-child(2) [contenteditable="true"]',
    )
      .focus()
      .click()
      .type('Hello world four');

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/en/my-page');

    // translate the page to German
    cy.createTranslation();

    cy.get('#page-add .celled.fixed.table thead tr th:first-child()', {
      timeout: 10000,
    }).should('contain', 'Hallo');
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.celled.fixed.table thead tr th:first-child()').should(
      'contain',
      'Hallo',
    );
    cy.get('.celled.fixed.table thead tr th:nth-child(2)').should(
      'contain',
      'Hallo',
    );
    cy.get('.celled.fixed.table tbody tr:nth-child(1) td:first-child()').should(
      'contain',
      'Hallo',
    );
    cy.get('.celled.fixed.table tbody tr:nth-child(1) td:nth-child(2)').should(
      'contain',
      'Hallo',
    );
  });
});
