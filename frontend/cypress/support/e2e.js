import 'cypress-axe';
import 'cypress-file-upload';
import './commands';
import 'cypress-axe';
import { setup, teardown } from '@plone/volto/cypress/support/reset-fixture';

beforeEach(function () {
  cy.log('Setting up API fixture');
  if (!Cypress.env('a11y')) {
    setup();
  }
});

afterEach(function () {
  cy.log('Tearing down API fixture');
  if (!Cypress.env('a11y')) {
    teardown();
  }
});
