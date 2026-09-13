describe('Listing Block Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');

    cy.setupDeepL();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'My Page',
      path: '/en/',
    });

    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page-test',
      contentTitle: 'My Page Test',
      path: '/en/',
    });

    cy.createContent({
      contentType: 'Document',
      contentId: 'my-folder',
      contentTitle: 'My Folder',
      path: '/en/',
    });
  });

  it('listed items and the listing headline are translated', () => {
    ['my-page-test', 'my-folder'].forEach((id) => {
      cy.visit(`/en/${id}`);
      cy.createTranslation();
      cy.url().should('include', '/de');
      cy.get('#toolbar-save').click();
      cy.url().should('include', '/de');
    });

    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');

    cy.clearSlateTitle().type('My title');
    cy.addNewBlock('listing');
    cy.get('#field-headline').type('Hello');

    cy.configureListingWith('Page');

    cy.get('#select-listingblock-sort-on')
      .click()
      .type('Effective date {enter}');
    cy.get('input[name="field-sort_order_boolean-2-querystring"]')
      .check({ force: true })
      .should('be.checked');

    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.createTranslation();
    cy.url().should('include', '/de');
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/mein-titel');
    cy.get('#page-document .block.listing .headline').should(
      'contain',
      'Hallo',
    );

    cy.visit('/de/mein-titel');
    cy.wait('@content');
    cy.get('#page-document .block.listing .listing-item a')
      .should('have.length.greaterThan', 0)
      .each(($a) => {
        const href = $a.attr('href');
        expect(href).to.include('/de');
      });
  });
});
