describe('Folder Contents Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    // given a logged in editor
    // and a folder that contains a document
    // and the folder contents view
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-folder',
      contentTitle: 'My Folder',
    });
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-document',
      contentTitle: 'My Document',
      path: 'my-folder',
    });
    cy.visit('/');
    cy.wait('@content');
    cy.navigate('/my-folder/my-document');
    cy.wait('@content');
  });

  it('Should render Summary template', () => {
    // when inserting image and selecting summary listing
    cy.createContent({
      contentType: 'Image',
      path: '/my-folder/my-document',
      contentId: 'my-image',
      contentTitle: 'My Image',
    });

    cy.visit('/my-folder/my-document');
    cy.get('.edit').click();
    cy.addNewBlock('listing');
    cy.get('#field-variation').click().type('summary{enter}');
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.url().should('eq', Cypress.config().baseUrl + '/my-folder/my-document');
    cy.get('.listing-item img')
      .should('have.attr', 'src')
      .and('contain', '/my-folder/my-document/my-image/@@images/image-');
    cy.get('.listing-item img')
      .should('be.visible')
      .and(($img) => {
        // "naturalWidth" and "naturalHeight" are set when the image loads
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });

    // check SSR rendering by adding query parameters
    cy.get('.edit').click();
    cy.get('.block-editor-listing').click();
    cy.configureListingWith('Image');
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.isInHTML({ parent: '.listing-item:eq(0)', content: 'My Image' });
  });

  it('Summary listing should render default preview images', () => {
    // when inserting document without a preview image/image
    cy.createContent({
      contentType: 'Document',
      path: '/my-folder/my-document',
      contentId: 'my-document',
      contentTitle: 'My Document',
    });

    cy.visit('/my-folder/my-document');
    cy.get('.edit').click();
    cy.addNewBlock('listing');
    cy.get('#field-variation').click().type('summary{enter}');
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.url().should('eq', Cypress.config().baseUrl + '/my-folder/my-document');
    cy.get('.listing-item img')
      .should('have.attr', 'src')
      .and('contain', '/static/media/default-image');
    cy.get('.listing-item img')
      .should('be.visible')
      .and(($img) => {
        // "naturalWidth" and "naturalHeight" are set when the image loads
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });

    cy.get('.edit').click();

    // test that the same query shows up in the rendered html when using query params
    cy.get('.block-editor-listing').click();
    cy.configureListingWith('Page');
    cy.addPathQuerystring();
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.isInHTML({ parent: '.listing-item:eq(0)', content: 'My Document' });
  });

  it('Should render Image gallery listing view', () => {
    // when inserting image and selecting image gallery listing
    cy.createContent({
      contentType: 'Image',
      path: '/my-folder/my-document',
      contentId: 'my-image',
      contentTitle: 'My Image',
    });

    cy.visit('/my-folder/my-document');
    cy.get('.edit').click();
    cy.addNewBlock('listing');
    cy.get('#field-variation').click().type('imageGallery{enter}');
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.url().should('eq', Cypress.config().baseUrl + '/my-folder/my-document');

    // then we should have a slide play or pause button
    cy.get('.image-gallery-play-button')
      .should('have.attr', 'aria-label')
      .and('eq', 'Play or Pause Slideshow');

    cy.get('.image-gallery-slides img.image-gallery-image')
      .should('be.visible')
      .and(($img) => {
        // "naturalWidth" and "naturalHeight" are set when the image loads
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });

    // test that the same markup shows up in the rendered html when using query params
    cy.get('.edit').click();
    cy.addPathQuerystring();
    cy.get('#toolbar-save').click();
    cy.wait('@content');

    cy.isInHTML({
      parent: '.image-gallery-slides',
      content: '.image-gallery-image',
    });
  });

  it('Should render image gallery in edit mode', () => {
    // when inserting image and selecting image gallery listing
    cy.createContent({
      contentType: 'Image',
      path: '/my-folder/my-document',
      contentId: 'my-image',
      contentTitle: 'My Image',
    });

    cy.findByLabelText('Edit').click();
    cy.getSlate().click();
    cy.get('.ui.basic.icon.button.block-add-button').click();
    cy.get('.ui.basic.icon.button.listing').contains('Listing').click();
    cy.get('#field-variation').click().type('imageGallery{enter}');
    // then we should have a slide play or pause button
    cy.get('.image-gallery-play-button')
      .should('have.attr', 'aria-label')
      .and('eq', 'Play or Pause Slideshow');
    cy.get('.image-gallery-slides img.image-gallery-image')
      .should('be.visible')
      .and(($img) => {
        // "naturalWidth" and "naturalHeight" are set when the image loads
        expect($img[0].naturalWidth).to.be.greaterThan(0);
      });
  });
  it('Should render list with date template with Event Content Type', () => {
    let startDate;
    let endDate;
    const now = new Date();
    startDate = new Date(now);
    startDate.setMonth(startDate.getMonth() + 1);
    // End = start + 7 days
    endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const formatDate = (date) => date.toISOString().replace('.000Z', '+00:00');
    const eventStart = new Date((startDate.getTime() + endDate.getTime()) / 2);
    const eventEnd = new Date(eventStart.getTime() + 2 * 24 * 60 * 60 * 1000);
    cy.createContent({
      contentType: 'Event',
      contentId: 'my-event',
      contentTitle: 'My Event',
      bodyModifier(body) {
        body.start = formatDate(eventStart);
        body.end = formatDate(eventEnd);
        return body;
      },
    });
    cy.createContent({
      contentType: 'Event',
      contentId: 'my-next-event',
      contentTitle: 'My Next Event',
      bodyModifier(body) {
        body.start = formatDate(eventStart);
        body.end = formatDate(eventEnd);
        return body;
      },
    });
    cy.visit('/my-folder/my-document');

    cy.get('.edit').click();
    cy.addNewBlock('listing');
    cy.get('#field-variation').click().type('list with date{enter}');

    // set Type criteria filter to Event
    cy.configureListingWith('Event');
    cy.wait('@content');
    cy.get('#toolbar-save').click();
    cy.wait('@content');
    cy.get('.card-inner .date-inset')
      .should('be.visible')
      .and('contain', eventStart.getDate())
      .and('contain', eventEnd.getDate());
  });
});
