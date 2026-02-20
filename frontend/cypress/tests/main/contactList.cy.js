context('Contact List Block Acceptance Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    cy.visit('/');
    cy.viewport('macbook-16');
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'contacts',
      contentTitle: 'Contacts',
      path: '/',
    });
    cy.createContent({
      contentType: 'Person',
      contentId: 'leonardo-da-vinci',
      path: '/contacts',
      bodyModifier(body) {
        body.first_name = 'Leonardo';
        body.last_name = 'da Vinci';
        body.contact_email = 'test@test.com';
        return body;
      },
    });
  });

  it('As editor I can add a Contact List block', () => {
    cy.visit('/contacts');
    cy.findByLabelText('Add').click();
    cy.get('#toolbar-add-document').click();

    cy.get('.documentFirstHeading')
      .type('My Page')
      .get('.documentFirstHeading')
      .contains('My Page');

    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .content.common .button.contactList').click({
      force: true,
    });

    // Set headline
    cy.get('input[name="headline"]').type('Contact');

    // Add a contact
    cy.get(
      '#sidebar-properties .object-list-widget [aria-labelledby^="fieldset-default-field-label-href-0"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Select Leonardo da Vinci').dblclick();
    cy.get('#toolbar-save').click();
    cy.wait('@content');
    cy.url().should('eq', Cypress.config().baseUrl + '/contacts/my-page');
    cy.get('#page-document').should('contain', 'Leonardo da Vinci');
  });

  it('As an editor, I can add a Contact List block, and changing the name should be reflected in the block.', () => {
    cy.visit('/contacts');
    cy.findByLabelText('Add').click();
    cy.get('#toolbar-add-document').click();

    cy.get('.documentFirstHeading')
      .type('My Page')
      .get('.documentFirstHeading')
      .contains('My Page');

    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .content.common .button.contactList').click({
      force: true,
    });

    // Set headline
    cy.get('input[name="headline"]').type('Contact');

    // Add a contact
    cy.get(
      '#sidebar-properties .object-list-widget [aria-labelledby^="fieldset-default-field-label-href-0"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Select Leonardo da Vinci').dblclick();
    cy.get('#toolbar-save').click();
    cy.wait('@content');
    cy.url().should('eq', Cypress.config().baseUrl + '/contacts/my-page');
    cy.get('#page-document').should('contain', 'Leonardo da Vinci');

    // Edit contact name
    cy.navigate('/contacts/leonardo-da-vinci/edit');
    cy.get('input[name="first_name"]').clear().type('Leonardo Edited');
    cy.get('#toolbar-save').click();
    cy.wait('@content');
    cy.url().should(
      'eq',
      Cypress.config().baseUrl + '/contacts/leonardo-da-vinci',
    );

    // Verify change is reflected in contact list block
    cy.visit('/contacts/my-page');
    cy.get('#page-document').should('contain', 'Leonardo Edited');
  });

  it('As an editor, I can add a Contact List block and send a message.', () => {
    cy.visit('/controlpanel/mail');
    cy.get('#field-email_from_address').type('test@cypress.com');
    cy.get('#toolbar-save').click();
    cy.visit('/contacts');
    cy.wait('@content');

    cy.findByLabelText('Add').click();
    cy.get('#toolbar-add-document').click();

    cy.get('.documentFirstHeading')
      .type('My Page')
      .get('.documentFirstHeading')
      .contains('My Page');

    cy.get('.block .slate-editor [contenteditable=true]').click();
    cy.get('.button .block-add-button').click({ force: true });
    cy.get('.blocks-chooser .content.common .button.contactList').click({
      force: true,
    });

    // Set headline
    cy.get('input[name="headline"]').type('Contact');

    // Add a contact
    cy.get(
      '#sidebar-properties .object-list-widget [aria-labelledby^="fieldset-default-field-label-href-0"] button[aria-label="Open object browser"]',
    ).click();
    cy.findByLabelText('Select Leonardo da Vinci').dblclick();
    cy.get('#toolbar-save').click();
    cy.wait('@content');
    cy.url().should('eq', Cypress.config().baseUrl + '/contacts/my-page');
    cy.get('#page-document').should('contain', 'Leonardo da Vinci');

    // Open contact form
    cy.get('.block.contact-list .contact-detail button')
      .contains('Contact')
      .click();
    cy.get('.contact-form-modal').should('exist');
    cy.get('.contact-form-overlay #heading').contains(
      'Contact: Write a Message',
    );

    // fill the contact-detail form

    cy.get('.contact-form-container input[name="subject"]').type(
      'Test Subject',
    );
    cy.get('.contact-form-container textarea[name="message"]').type(
      'This is a test message.',
    );
    cy.get('.contact-form-container input[name="name"]').type('John Doe');
    cy.get('.contact-form-container input[name="email"]').type(
      'johndoe@example.com',
    );

    // Select salutation
    cy.get('.dropdown').click();
    cy.get('.react-aria-Popover .react-aria-ListBoxItem')
      .contains('Mr')
      .click();

    // Check the required checkboxes
    cy.get('.contact-form-container #privacy-consent-label').click({
      force: true,
    });
    cy.get('.contact-form-container #age-consent-label').click({ force: true });

    // Submit the form
    cy.get('.contact-form-container button[name="submit"]').click();
    // Verify success message
    cy.get(
      '.contact-form-modal .contact-form-container .contact-form legend.sent',
    ).should(
      'contain',
      'Your message has been successfully, delivered to "Leonardo da Vinci"',
    );
  });
});
