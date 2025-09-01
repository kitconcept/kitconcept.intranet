describe('Feedback form', () => {
  beforeEach(() => {
    cy.intercept('GET', `/**/*?expand*`).as('content');
    cy.intercept('GET', '/**/Document').as('schema');
    // given a logged in editor and a page in edit mode
    cy.autologin();
    cy.createContent({
      contentType: 'Document',
      contentId: 'my-page',
      contentTitle: 'My Page',
    });
    cy.visit('/my-page');
    cy.wait('@content');
  });

  it('Add feedback form', () => {
    // Add sending email address in control panel
    cy.visit('/controlpanel/mail');
    cy.get('#field-email_from_address').type('test@cypress.com');
    cy.get('#toolbar-save').click();
    cy.visit('/my-page');
    cy.wait('@content');
    cy.get('#toolbar-add').click();
    cy.get('#toolbar-add-person').click();
    cy.get('input#field-first_name').type('Dr. Ayla');
    cy.get('input#field-last_name').type('Demir');
    cy.get('textarea#field-description').type(
      'Dr. Ayla Demir ist Projektkoordinatorin für Internationale Zusammenarbeit in der Abteilung Wissenschaftspolitische Beziehungen. Sie koordiniert internationale Partnerschaften, begleitet das Antragsmanagement für EU- und Drittmittelprojekte und organisiert Fachkonferenzen. ',
    );
    cy.get('#field-contact_email').type('aylademir@test.com');
    cy.get('#field-roles').click();
    cy.get(
      '#field-roles .react-select__menu .react-select__option:first-of-type',
    ).click();
    cy.get('#toolbar-save').focus().click();
    cy.wait('@content');
    cy.navigate('/my-page/edit');
    cy.wait('@content');
    cy.get('.field-wrapper-feedback_person').click();
    cy.get(
      '.field-wrapper-feedback_person .react-select__control  .react-select__input input',
    ).type('Dr.', { force: true });

    cy.get(
      '.field-wrapper-feedback_person .react-select-container .react-select__menu .react-select__option',
    )
      .contains('Dr. Ayla Demir')
      .click();

    cy.get('#toolbar-save').focus().click();
    cy.wait('@content');

    cy.navigate('/my-page/feedback-form');
    cy.get('.feedback-form textarea[name="feedback"]').type('Test feedback');
    cy.get('.feedback-form input[name="name"]').type('Test Name');
    cy.get('.feedback-form input[name="email"]').type('test@test.com');
    // cy.get('.feedback-form-buttons .send-button').click();
  });
});
