describe('Preview Image Link Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    cy.intercept('POST', '*').as('saveImage');
    cy.intercept('GET', '/**/image.png/@@images/image-*').as('getImage');
    cy.viewport('macbook-16');
    cy.createContent({
      contentType: 'Document',
      contentId: 'document',
      contentTitle: 'Document',
    });
    cy.createContent({
      contentType: 'Image',
      contentId: 'image',
      contentTitle: 'My Image',
    });

    cy.autologin();
    cy.visit('/');
    cy.wait('@content');
  });
  it('Add preview image via upload', function () {
    cy.navigate('/document/edit');
    cy.wait('@schema');
    cy.get('#metadataform-fieldset-preview_image').within(() => {
      cy.get('input[type="file"]').attachFile('image.png', {
        subjectType: 'input',
        encoding: 'utf8',
      });
    });
    cy.waitForResourceToLoad('image.png/@@images/image');
    cy.get('#toolbar-save').click();

    cy.wait('@saveImage');
    cy.wait('@getImage');
    cy.wait('@content');

    cy.get("#toolbar-body a[aria-label='Edit']").click();
    cy.url().should('include', '/document/edit');
    cy.wait('@schema');

    cy.get('#metadataform-fieldset-preview_image').within(() => {
      cy.get('.image-upload-widget-image img')
        .should('have.attr', 'src')
        .and('contains', '/document/image.png/@@images/image-');
      cy.get('.image-upload-widget-image img').should('be.visible');
    });
    cy.get('#toolbar-save').click();
  });

  it('Add preview image from existing Image Content', function () {
    cy.navigate('/document/edit');
    cy.wait('@schema');
    cy.get('#metadataform-fieldset-preview_image');
    cy.get('.toolbar-inner button.ui.basic.icon.button').first().click();
    cy.findByLabelText('Search SVG').click();
    cy.get('.ui.input.search').type('My Image');
    cy.findByLabelText('Select My Image').dblclick();

    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.get("#toolbar-body a[aria-label='Edit']").click();
    cy.url().should('include', '/document/edit');
    cy.wait('@schema');
    cy.get('#metadataform-fieldset-preview_image').within(() => {
      cy.get('.image-upload-widget-image img')
        .should('have.attr', 'src')
        .and('contains', '/image/@@images/image-');
      cy.get('.image-upload-widget-image img').should('be.visible');
    });
    cy.get('#toolbar-save').click();
  });
  it('Add preview image from url, only internal URLs allowed', function () {
    cy.navigate('/document/edit');
    cy.url().should('include', '/document/edit');
    cy.wait('@schema');
    cy.get('#metadataform-fieldset-preview_image')
      .findByLabelText('Enter a URL to an image')
      .click();

    cy.get('.ui.input.editor-link.input-anchorlink-theme input').type(
      `https://github.com/plone/volto/raw/main/logos/volto-colorful.png{enter}`,
    );

    cy.get('#metadataform-fieldset-preview_image');
    cy.get('.image-upload-widget-image img').should('not.exist');

    cy.get('#toolbar-save').click();
  });
});
