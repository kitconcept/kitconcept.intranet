import '@plone/volto/cypress/add-commands';

// --- SOLR --------------------------------------------------------------------
Cypress.Commands.add('reindexSolr', () => {
  const log = Cypress.log({
    name: 'log',
    displayName: `reindexSolr`,
  });
  const api_url = 'http://localhost:55001/plone';
  const auth = {
    user: 'admin',
    pass: 'secret',
  };
  return cy
    .request({
      method: 'GET',
      url: `${api_url}/@@solr-maintenance/reindex`,
      auth: auth,
    })
    .then(() => log.set('message', 'solr reindex complete'));
});

Cypress.Commands.add('clearSolr', () => {
  const log = Cypress.log({
    name: 'log',
    displayName: `clearSolr`,
  });
  const api_url = 'http://localhost:55001/plone';
  const auth = {
    user: 'admin',
    pass: 'secret',
  };
  return cy
    .request({
      method: 'GET',
      url: `${api_url}/@@solr-maintenance/clear`,
      auth: auth,
    })
    .then(() => log.set('message', 'solr clear complete'));
});

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
