context('Blocks configuration TTW - Acceptance Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Plone%20Site').as('schema');
    cy.intercept('/**/@logout').as('logout');

    // given a logged in editor and a page in edit mode
    cy.autologin();
    cy.viewport('macbook-16');
    cy.visit('/');
  });

  it('I can restrict a block TTW', function () {
    cy.wait('@content');
    cy.navigate('/edit');
    cy.wait('@schema');

    cy.findByLabelText('Open configuration').click();
    cy.get('.block-config-json-editor-dialog textarea')
      .clear()
      .type(JSON.stringify({ teaser: { disable: true } }), {
        parseSpecialCharSequences: false,
      });
    cy.findByLabelText('Close').click();
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.navigate('/edit');
    cy.wait('@schema');

    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed  .button.teaser').should('not.exist');
  });

  it('I can define themes for a block TTW', function () {
    cy.wait('@content');
    cy.navigate('/edit');
    cy.wait('@schema');

    cy.findByLabelText('Open configuration').click();
    cy.get('.block-config-json-editor-dialog textarea')
      .clear()
      .type(
        JSON.stringify({
          teaser: {
            themes: [
              {
                style: {
                  '--theme-color': '#fff',
                  '--theme-high-contrast-color': '#ecebeb',
                  '--theme-foreground-color': '#000',
                  '--theme-low-contrast-foreground-color': '#555555',
                },
                name: 'default',
                label: 'Default',
              },
              {
                style: {
                  '--theme-color': 'red',
                  '--theme-high-contrast-color': '#fff',
                  '--theme-foreground-color': '#000',
                  '--theme-low-contrast-foreground-color': '#555555',
                },
                name: 'red',
                label: 'Red',
              },
            ],
          },
        }),
        {
          parseSpecialCharSequences: false,
        },
      );
    cy.findByLabelText('Close').click();
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.navigate('/edit');
    cy.wait('@schema');

    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed  .button.teaser').click({ force: true });
    cy.get('.field-wrapper-theme .red').should('exist');
  });

  it('I can define enabled variations for a block TTW', function () {
    cy.wait('@content');
    cy.navigate('/edit');
    cy.wait('@schema');

    cy.findByLabelText('Open configuration').click();
    cy.get('.block-config-json-editor-dialog textarea')
      .clear()
      .type(
        JSON.stringify({
          listing: {
            variations: ['default', 'summary'],
          },
        }),
        {
          parseSpecialCharSequences: false,
        },
      );
    cy.findByLabelText('Close').click();
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.navigate('/edit');
    cy.wait('@schema');

    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed  .button.listing').click({ force: true });
    cy.get('#field-variation').click();
    cy.get('.react-select__menu').contains('List');
    cy.get('.react-select__menu').contains('List with images');
    cy.get('.react-select__menu').should('not.contain', 'Grid');
    cy.get('.react-select__menu').should('not.contain', 'Event Calendar');
    cy.get('.react-select__menu').should('not.contain', 'Image Gallery');
  });

  it('I can define themes for a block TTW and a non-logged user can access', function () {
    cy.createContent({
      contentType: 'Document',
      contentId: 'document',
      contentTitle: 'Document',
      path: '/',
    });

    cy.wait('@content');
    cy.navigate('/edit');
    cy.wait('@schema');

    cy.findByLabelText('Open configuration').click();
    cy.get('.block-config-json-editor-dialog textarea')
      .clear()
      .type(
        JSON.stringify({
          teaser: {
            themes: [
              {
                style: {
                  '--theme-color': '#fff',
                  '--theme-high-contrast-color': '#ecebeb',
                  '--theme-foreground-color': '#000',
                  '--theme-low-contrast-foreground-color': '#555555',
                },
                name: 'default',
                label: 'Default',
              },
              {
                style: {
                  '--theme-color': 'red',
                  '--theme-high-contrast-color': '#fff',
                  '--theme-foreground-color': '#000',
                  '--theme-low-contrast-foreground-color': '#555555',
                },
                name: 'red',
                label: 'Red',
              },
            ],
          },
        }),
        {
          parseSpecialCharSequences: false,
        },
      );
    cy.findByLabelText('Close').click();
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.navigate('/edit');
    cy.wait('@schema');

    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .mostUsed  .button.teaser').click({ force: true });
    cy.get(
      '.objectbrowser-field[aria-labelledby="fieldset-default-field-label-href"] button[aria-label="Open object browser"]',
    ).click();
    cy.get('[aria-label="Select Document"]').dblclick();
    cy.wait(500);
    cy.get('.field-wrapper-theme .red').click();
    cy.get('#toolbar-save').click();
    cy.get('.blocks-group-wrapper.red')
      .should('have.attr', 'style')
      .and('contain', '--theme-color: red');

    cy.get('#toolbar-personal').click();
    cy.get('#toolbar-logout').click();
    cy.wait('@logout');

    cy.visit('/');

    cy.get('.blocks-group-wrapper.red')
      .should('have.attr', 'style')
      .and('contain', '--theme-color:red');
  });
});
