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

  it('As editor I can add a location and organisational unit to person content type.', function () {
    cy.createContent({
      contentType: 'Location',
      contentId: 'headquarters-bonn-page',
      contentTitle: 'Headquarters (Bonn)',
    });
    cy.createContent({
      contentType: 'Organisational Unit',
      contentId: 'institute-of-robotics-and-mechatronics-organisational-unit',
      contentTitle:
        'Institute of Robotics and Mechatronics(Organisational unit)',
    });
    cy.get('#toolbar-add').click();
    cy.get('#toolbar-add-person').click();
    cy.get('input#field-first_name').type('Dr. Ayla');
    cy.get('input#field-last_name').type('Demir');
    cy.get('textarea#field-description').type(
      'Dr. Ayla Demir ist Projektkoordinatorin für Internationale Zusammenarbeit in der Abteilung Wissenschaftspolitische Beziehungen. Sie koordiniert internationale Partnerschaften, begleitet das Antragsmanagement für EU- und Drittmittelprojekte und organisiert Fachkonferenzen. ',
    );
    cy.get('#field-location_reference').click();
    cy.get(
      '#field-location_reference .react-select__menu .react-select__option',
    )
      .contains('Headquarters (Bonn)')
      .click();

    cy.get('#field-organisational_unit_reference').click();
    cy.get(
      '#field-organisational_unit_reference .react-select__menu .react-select__option',
    )
      .contains('Institute of Robotics and Mechatronics(Organisational unit)')
      .click();
    cy.get('#toolbar-save').focus().click();
    cy.wait('@content');
  });
});
