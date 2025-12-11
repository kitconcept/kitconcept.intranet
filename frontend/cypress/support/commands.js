import '@plone/volto/cypress/add-commands';

Cypress.Commands.add(
  'addPathQuerystring',
  (option = 'Relative path', value) => {
    cy.get('.block-editor-listing').click();
    cy.get('.querystring-widget .fields').contains('Add criteria').click();
    cy.get('.querystring-widget .react-select__menu .react-select__option')
      .contains('Path')
      .click();

    cy.get('.querystring-widget .fields').contains('Absolute path').click();
    cy.get(
      '.querystring-widget .fields .react-select__menu .react-select__option',
    )
      .contains(option)
      .click();
    if (value) {
      cy.get('.querystring-widget .fields .input')
        .click()
        .type(`${value}{enter}`);
    }
  },
);
