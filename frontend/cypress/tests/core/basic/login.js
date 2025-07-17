import { ploneAuth } from '@plone/volto/cypress/support/constants';

describe('Login Tests', () => {
  beforeEach(() => {});
  it('As registered user I can login', function () {
    cy.visit('/login');

    const user = ploneAuth[0];
    const password = ploneAuth[1];

    cy.get('input[placeholder="Login Name"]')
      .type(user)
      .should('have.value', user);

    cy.get('input[placeholder="Password"]')
      .type(password)
      .should('have.value', password);
    cy.get('#login-form-submit').click();
    cy.get('body').should('have.class', 'has-toolbar');
  });
});
