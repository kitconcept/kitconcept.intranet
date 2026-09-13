context('Accordion Block', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');

    cy.setupDeepL();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-link-target',
      contentTitle: 'Link Target',
      path: '/en',
    });

    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'Hello',
      path: '/en',
    });
  });

  it('create an accordion block (headline, panel title, nested text) and translate it', () => {
    cy.visit('/en/my-link-target');
    cy.createTranslation();
    cy.url().should('include', '/de');
    cy.get('#toolbar-save').click();

    cy.visit('/en/my-page');
    cy.wait('@content');
    cy.navigate('/en/my-page/edit');
    cy.wait('@schema');
    cy.url().should('include', '/en');

    cy.getSlate().click();
    cy.addNewBlock('accordion');

    cy.get('.accordion:nth-child(2) > .title input').type('Same Title');
    cy.get('.accordion:nth-child(3) > .title input').type('Same Title');
    cy.get('.accordion:nth-child(4) > .title input').type('Different Title');
    cy.get('.text-slate-editor-inner')
      .eq(0)
      .click()
      .type('Hello world{enter}', {
        delay: 50,
      });

    cy.focused().type('/image{enter}');
    cy.findAllByLabelText('Enter a URL to an image').filter(':visible').click();
    cy.get('.ui.input.editor-link.input-anchorlink-theme input').type(
      'https://github.com/plone/volto/raw/main/logos/volto-colorful.png{enter}',
    );
    cy.get('.accordion:nth-child(2) .content .block.image figure img').should(
      'exist',
    );

    cy.get(
      '#blockform-fieldset-default .field-wrapper-title #field-title',
    ).type('Hello image title');
    cy.get(
      '#blockform-fieldset-default .field-wrapper-description #field-description',
    ).type('Hello image description');
    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('Link Target');
    cy.wait(500);
    cy.get('[aria-label="Select Link Target"]').dblclick();

    cy.get('#toolbar-save').click();
    cy.createTranslation();
    cy.wait(2000);
    cy.get('#toolbar-save').click();
    cy.url().should('include', '/de/');

    cy.get('.accordion-block .block.image figcaption .title').should(
      'contain',
      'Hallo',
    );
    cy.get('.accordion-block .block.image figcaption .description').should(
      'contain',
      'Hallo',
    );
    cy.get('.accordion-block .block.image a')
      .should('have.attr', 'href')
      .and('include', '/de');
  });
});
