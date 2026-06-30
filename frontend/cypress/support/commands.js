import '@plone/volto/cypress/add-commands';

// --- DEEPL -------------------------------------------------------------------
// Configure the DeepL control panel with the API key and log in.
// Common setup for all block translation acceptance tests.
Cypress.Commands.add('setupDeepL', () => {
  const apiKey = Cypress.env('DEEPL_API_KEY');
  if (!apiKey) {
    throw new Error('DEEPL_API_KEY environment variable is not set');
  }

  cy.request({
    url: '/++api++/@controlpanels/DeepLSettings',
    method: 'PATCH',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic YWRtaW46c2VjcmV0',
    },
    body: {
      deepl_api_auth_token: apiKey,
      deepl_api_timeout: 10,
    },
  }).then((response) => {
    expect(response.status).to.eq(204);
  });

  cy.autologin();
});

// Open "Manage Translations" and trigger the automatic translation,
// landing on the German (/de) add form. Common to all block tests.
Cypress.Commands.add('createTranslation', () => {
  cy.get('#toolbar-more').click();
  cy.findByText('Manage Translations').should('be.visible').click();
  cy.get('.manage-multilingual-tools .buttons a').eq(1).click();
});

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
