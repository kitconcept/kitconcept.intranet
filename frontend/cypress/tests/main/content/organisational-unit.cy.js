describe('Add Content Tests', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');

    // give a logged in editor and the site root
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'My Page',
    });
    cy.visit('/');
    cy.wait('@content');
  });

  it('As editor I can add a organisational unit content type', function () {
    cy.get('#toolbar-add').click();
    cy.get('#toolbar-add-organisational-unit').click();
    cy.getSlateTitle()
      .focus()
      .click()
      .type('Institute of Robotics and Mechatronics(Organisational unit)')
      .contains('Institute of Robotics and Mechatronics(Organisational unit)');
    cy.get('#toolbar-save').focus().click();
    cy.wait('@content');
    cy.url().should(
      'eq',
      Cypress.config().baseUrl +
        '/institute-of-robotics-and-mechatronics-organisational-unit',
    );
  });
  it('As editor I can add a organisational unit to Document content type and find it in listing block', function () {
    cy.intercept('PATCH', '/**/my-page').as('save');
    cy.createContent({
      contentType: 'Organisational Unit',
      contentId: 'institute-of-robotics-and-mechatronics-organisational-unit',
      contentTitle:
        'Institute of Robotics and Mechatronics(Organisational unit)',
    });
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-second-page',
      contentTitle: 'My Second Page',
    });
    cy.navigate('/my-page/edit');
    cy.wait('@schema');
    cy.get('#field-organisational_unit_reference').click();
    cy.get(
      '#field-organisational_unit_reference .react-select__menu .react-select__option',
    )
      .contains('Institute of Robotics and Mechatronics(Organisational unit)')
      .click();
    cy.get('#toolbar-save').focus().click();
    cy.wait('@content');
    cy.url().should('eq', Cypress.config().baseUrl + '/my-page');
    cy.navigate('/my-second-page/edit');
    cy.wait('@schema');
    cy.addNewBlock('listing');
    cy.get('.sidebar-container .tabs-wrapper .menu .item')
      .contains('Block')
      .click();
    cy.get('.querystring-widget .fields').contains('Add criteria').click();

    cy.get(
      '.querystring-widget .fields:first-of-type .field:first-of-type .react-select__menu .react-select__option',
    )
      .contains('Organisational Unit')
      .click();
    cy.get('.querystring-widget .fields:first-of-type > .field').click();
    cy.get(
      '.querystring-widget .fields:first-of-type > .field .react-select__menu .react-select__option',
    )
      .contains('Institute of Robotics and Mechatronics(Organisational unit)')
      .click();
    //verify before save
    cy.get(`.block.listing .listing-item:first-of-type`).contains('My Page');

    cy.get('#toolbar-save').focus().click();
    cy.wait('@save');
    cy.get('#page-document .listing-item:first-of-type').contains('My Page');
    cy.url().should('eq', Cypress.config().baseUrl + '/my-second-page');
  });

  it('As normal user I should not be able to add organisational unit and location content type', function () {
    cy.navigate('/controlpanel/users');
    cy.get('#toolbar-add').click();
    cy.get('.ui.active.modal input#field-fullname').type('Test User');
    cy.get('.ui.active.modal input#field-email').type('test@test.com');
    cy.get('.ui.active.modal input#field-username').type('test');
    cy.get('.ui.active.modal input#field-password').type('password');
    cy.get('.ui.active.modal button[aria-label="Save"]').click();
    cy.get('input[value="test&role=Contributor"]').click({ force: true });
    cy.get('input[value="test&role=Editor"]').click({ force: true });
    cy.get('input[value="test&role=Reader"]').click({ force: true });
    cy.get('input[value="test&role=Reviewer"]').click({ force: true });
    cy.get('#toolbar-save').click();
    cy.wait(1000);
    cy.get('.tools-wrapper').findByText('Log out').click();
    cy.autologin('test', 'password');
    cy.visit('/');
    cy.wait('@content');
    cy.get('#toolbar-add').click();
    cy.get('.toolbar-content.show .pastanaga-menu-list')
      .findByText('Location')
      .should('not.exist');
    cy.get('.toolbar-content.show .pastanaga-menu-list')
      .findByText('Organisational Unit')
      .should('not.exist');
    cy.get('.toolbar-content.show .pastanaga-menu-list')
      .findByText('Page')
      .should('exist');
  });
});
