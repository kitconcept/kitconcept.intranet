context('Event Calendar Block', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    cy.intercept('GET', '**/@querystring-search**').as('querySearch');

    const now = new Date();
    const formatDate = (date) => date.toISOString().replace('.000Z', '+00:00');
    const eventStart = new Date(now.getFullYear(), now.getMonth(), 11);
    const eventEnd = new Date(now.getFullYear(), now.getMonth(), 12);

    cy.setupDeepL();

    cy.createContent({
      contentType: 'Event',
      contentId: 'my-first-event',
      contentTitle: 'My First Event',
      path: '/en',
      bodyModifier(body) {
        body.start = formatDate(eventStart);
        body.end = formatDate(eventEnd);
        return body;
      },
    });
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'Hello',
      path: '/en',
    });
  });

  it('create an event calendar block (headline + facets title) and translate it', () => {
    cy.visit('/en/my-first-event');
    cy.createTranslation();
    cy.url().should('include', '/de');
    cy.get('#toolbar-save').click();

    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@content');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('event');

    cy.get('#sidebar-properties #field-headline').type('Hello headline');

    cy.get('#sidebar-properties .field-wrapper-facets button')
      .findByText('Add Facet')
      .click({ force: true });
    cy.get('[id^="field-field-1-"] .react-select__value-container').click();
    cy.get('.react-select__option').contains('Review state').click();

    cy.get('#toolbar-save').click();
    cy.wait('@content');
    cy.url().should('include', '/en/my-page');

    // translate the page to German
    cy.createTranslation();

    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.search-block-event .headline').should('contain', 'Hallo');
    cy.get('.card-primary-link')
      .should('have.attr', 'href')
      .and('include', '/de');
  });
});
