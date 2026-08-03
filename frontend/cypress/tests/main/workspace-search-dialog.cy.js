// Tests for the workspace search dialog local/global scope switch
// (ticket #426): inside a workspace the Workspace chip scopes the
// livesearch and the Enter results page to the workspace subtree by
// default; selecting "Intranet Portal" widens to a global search.
//
// The AI parts ("Ask AI") are not covered here: the acceptance backend
// has no LLM configured, so rag_available is false and the button is
// hidden by design (graceful degradation).
//
// The solr setup follows the style of search-persons.cy.js.

context('Workspace search dialog (local/global scope)', () => {
  beforeEach(() => {
    // The solr connection parameters are provided by the COLLECTIVE_SOLR_*
    // environment variables (docker compose setup) or by the registry
    // defaults (local setup, solr listening on localhost:8983).
    cy.setRegistry('collective.solr.active', true);
    cy.reindexSolr();

    cy.createContent({
      contentType: 'Workspace',
      contentId: 'greencat',
      contentTitle: 'GreenCat Workspace',
    });
    cy.createContent({
      contentType: 'WikiPage',
      contentId: 'vacation-team-rules',
      contentTitle: 'Vacation rules of the GreenCat team',
      path: '/greencat',
    });
    // content outside the workspace, matching the same search term
    cy.createContent({
      contentType: 'Document',
      contentId: 'vacation-form',
      contentTitle: 'Vacation request form',
      path: '/',
    });

    cy.autologin();
  });
  afterEach(() => {
    cy.clearSolr();
  });

  it('scopes the livesearch to the workspace and can widen to global', () => {
    cy.visit('/greencat');
    cy.get('.header-search-button').click();
    cy.get('.header-search-input-row input').type('vacation');

    // workspace scope (default, chip active): only the workspace page
    cy.get('.header-search-result-title').should('have.length', 1);
    cy.get('.header-search-result-title').contains(
      'Vacation rules of the GreenCat team',
    );
    cy.get('.header-search-chip.is-active').contains(
      'Workspace: GreenCat Workspace',
    );

    // switch the Workspace chip to Intranet Portal -> global results
    cy.get('.header-search-chip').contains('Workspace:').click();
    cy.get('.header-search-chip-menu .react-aria-MenuItem')
      .contains('Intranet Portal')
      .click();
    cy.get('.header-search-result-title').should('have.length.at.least', 2);
    cy.get('.header-search-result-title').contains('Vacation request form');
    cy.get('.header-search-chip').contains('Workspace: Intranet Portal');
  });

  it('Enter opens the workspace-scoped results page without a local toggle', () => {
    cy.visit('/greencat');
    cy.get('.header-search-button').click();
    cy.get('.header-search-input-row input').type('vacation{enter}');

    cy.url().should('include', '/greencat/@@search');
    cy.url().should('include', 'local=true');

    // only the workspace page in the classic results
    cy.contains('Vacation rules of the GreenCat team');
    cy.contains('Vacation request form').should('not.exist');
    // the legacy local/global radio stays hidden (allow_local unset)
    cy.get('.search-localized').should('not.exist');
  });

  it('Enter searches globally when Intranet Portal is selected', () => {
    cy.visit('/greencat');
    cy.get('.header-search-button').click();
    cy.get('.header-search-input-row input').type('vacation');
    cy.get('.header-search-chip').contains('Workspace:').click();
    cy.get('.header-search-chip-menu .react-aria-MenuItem')
      .contains('Intranet Portal')
      .click();
    cy.get('.header-search-input-row input').type('{enter}');

    cy.url().should('include', '/search?SearchableText=vacation');
    cy.contains('Vacation request form');
  });
});
