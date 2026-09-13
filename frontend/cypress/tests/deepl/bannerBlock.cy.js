context('Banner Block', () => {
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

  it('create a banner block (text + additionalText) and translate it', () => {
    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('Banner');

    cy.get('input[type="file"]').attachFile('halfdome2022.jpg', {
      subjectType: 'input',
      encoding: 'utf8',
    });
    cy.wait(500);

    cy.get('.field-wrapper-text #field-text').type('Hello');
    cy.get('.field-wrapper-additionalText #field-additionalText').type(
      'Hello world',
    );

    cy.get('#toolbar-save').click();

    // translate the page to German
    cy.createTranslation();

    cy.get('#page-add .block.banner .banner-inner-container .text p', {
      timeout: 10000,
    })
      .eq(0)
      .should('contain', 'Hallo');
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.block.banner .banner-inner-container .text p')
      .eq(0)
      .should('contain', 'Hallo');
    cy.get('.block.banner .banner-inner-container .text p')
      .eq(1)
      .should('contain', 'Hallo');
  });
});
