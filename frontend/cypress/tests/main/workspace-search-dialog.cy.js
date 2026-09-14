// Tests for the workspace search dialog scope switch (tickets #426 and
// #570): inside a workspace the Workspace chip scopes the livesearch
// and the Enter results page to the workspace subtree by default; the
// chip's dropdown offers "Everywhere" plus every workspace the user
// can access. Result rows carry a location label, and an empty scoped
// search offers a one-click "Search everywhere" escape.
//
// The AI parts ("Ask AI") are not covered here: the acceptance backend
// has no LLM configured, so rag_available is false and the button is
// hidden by design (graceful degradation).
//
// The solr setup follows the style of search-persons.cy.js.

context('Workspace search dialog (scope dropdown)', () => {
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
    // a second workspace, to pick from the scope dropdown
    cy.createContent({
      contentType: 'Workspace',
      contentId: 'quantum',
      contentTitle: 'Quantum Workspace',
    });
    cy.createContent({
      contentType: 'WikiPage',
      contentId: 'vacation-quantum',
      contentTitle: 'Vacation policy of the Quantum group',
      path: '/quantum',
    });
    // content outside the workspaces, matching the same search term
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

  it('scopes the livesearch to the workspace and can widen to everywhere', () => {
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

    // the dropdown lists Everywhere plus all workspaces
    cy.get('.header-search-chip').contains('Workspace:').click();
    cy.get('.header-search-scope-menu').contains('Search in all areas');
    cy.get('.header-search-scope-menu').contains('GreenCat Workspace');
    cy.get('.header-search-scope-menu').contains('Quantum Workspace');

    // switch to Everywhere -> global results with location labels
    cy.get('.header-search-scope-menu .react-aria-MenuItem')
      .contains('Everywhere')
      .click();
    cy.get('.header-search-result-title').should('have.length.at.least', 3);
    cy.get('.header-search-chip').contains('Workspace: Everywhere');
    cy.contains('.header-search-result', 'Vacation request form')
      .find('.header-search-result-location')
      .contains('Intranet Portal');
    cy.contains('.header-search-result', 'Vacation rules of the GreenCat team')
      .find('.header-search-result-location')
      .contains('GreenCat Workspace');
  });

  it('scopes the livesearch to another workspace picked from the dropdown', () => {
    cy.visit('/greencat');
    cy.get('.header-search-button').click();
    cy.get('.header-search-input-row input').type('vacation');
    cy.get('.header-search-result-title').should('have.length', 1);

    cy.get('.header-search-chip').contains('Workspace:').click();
    cy.get('.header-search-scope-menu .react-aria-MenuItem')
      .contains('Quantum Workspace')
      .click();

    cy.get('.header-search-result-title').should('have.length', 1);
    cy.get('.header-search-result-title').contains(
      'Vacation policy of the Quantum group',
    );
    cy.get('.header-search-chip.is-active').contains(
      'Workspace: Quantum Workspace',
    );

    // Enter goes to the picked workspace's scoped results page
    cy.get('.header-search-input-row input').type('{enter}');
    cy.url().should('include', '/quantum/@@search');
    cy.url().should('include', 'local=true');
    cy.contains('Vacation policy of the Quantum group');
    cy.contains('Vacation rules of the GreenCat team').should('not.exist');
  });

  it('offers "Search everywhere" when the scoped search is empty', () => {
    cy.visit('/greencat');
    cy.get('.header-search-button').click();
    // "request" only matches the portal document, not the workspace
    cy.get('.header-search-input-row input').type('request');

    cy.get('.header-search-no-results').contains(
      'No results in “GreenCat Workspace”.',
    );
    cy.get('.header-search-widen').contains('Search everywhere').click();

    cy.get('.header-search-result-title').contains('Vacation request form');
    cy.get('.header-search-chip').contains('Workspace: Everywhere');
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

  it('Enter searches globally when Everywhere is selected', () => {
    cy.visit('/greencat');
    cy.get('.header-search-button').click();
    cy.get('.header-search-input-row input').type('vacation');
    cy.get('.header-search-chip').contains('Workspace:').click();
    cy.get('.header-search-scope-menu .react-aria-MenuItem')
      .contains('Everywhere')
      .click();
    cy.get('.header-search-input-row input').type('{enter}');

    cy.url().should('include', '/search?SearchableText=vacation');
    cy.contains('Vacation request form');
  });
});

// Filter chips (ticket 585): the Type / Created by / Updated / Status
// chips filter the livesearch, and on Enter the active filters travel
// as the extra_conditions URL parameter to the results page, where a
// reload reproduces them.
context('Search dialog filter chips', () => {
  const openDialogEverywhere = (term) => {
    cy.visit('/greencat');
    cy.get('.header-search-button').click();
    cy.get('.header-search-input-row input').type(term);
    cy.get('.header-search-chip').contains('Workspace:').click();
    cy.get('.header-search-scope-menu .react-aria-MenuItem')
      .contains('Everywhere')
      .click();
  };

  const pickFilter = (chipLabel, optionLabel) => {
    cy.get('.header-search-chip').contains(`${chipLabel}:`).click();
    cy.get('.header-search-chip-menu .react-aria-MenuItem')
      .contains(optionLabel)
      .click();
  };

  beforeEach(() => {
    cy.setRegistry('collective.solr.active', true);
    cy.reindexSolr();

    cy.createContent({
      contentType: 'Workspace',
      contentId: 'greencat',
      contentTitle: 'GreenCat Workspace',
    });
    // two matching items of different type and review state
    cy.createContent({
      contentType: 'Document',
      contentId: 'vacation-guide',
      contentTitle: 'Vacation guide',
      transition: 'publish',
    });
    cy.createContent({
      contentType: 'News Item',
      contentId: 'vacation-news',
      contentTitle: 'Vacation news',
    });

    cy.autologin();
  });
  afterEach(() => {
    cy.clearSolr();
  });

  it('filters the livesearch by type', () => {
    openDialogEverywhere('vacation');
    cy.get('.header-search-result-title').should('have.length', 2);

    pickFilter('Type', 'News Item');
    cy.get('.header-search-result-title').should('have.length', 1);
    cy.get('.header-search-result-title').contains('Vacation news');
    cy.get('.header-search-chip.is-active').contains('Type: News Item');

    pickFilter('Type', 'Page');
    cy.get('.header-search-result-title').should('have.length', 1);
    cy.get('.header-search-result-title').contains('Vacation guide');
  });

  it('filters the livesearch by status', () => {
    openDialogEverywhere('vacation');
    cy.get('.header-search-result-title').should('have.length', 2);

    pickFilter('Status', 'Published');
    cy.get('.header-search-result-title').should('have.length', 1);
    cy.get('.header-search-result-title').contains('Vacation guide');

    pickFilter('Status', 'Private');
    cy.get('.header-search-result-title').should('have.length', 1);
    cy.get('.header-search-result-title').contains('Vacation news');
  });

  it('keeps fresh content with the Today filter', () => {
    openDialogEverywhere('vacation');
    cy.get('.header-search-result-title').should('have.length', 2);

    pickFilter('Updated', 'Today');
    // everything was just created, so nothing is filtered out
    cy.get('.header-search-result-title').should('have.length', 2);
    cy.get('.header-search-chip.is-active').contains('Updated: Today');
  });

  it('filters by creator with the multi-select checkbox rows', () => {
    openDialogEverywhere('vacation');
    cy.get('.header-search-result-title').should('have.length', 2);

    // the test content is created by admin; checking admin keeps it
    cy.get('.header-search-chip').contains('Created by:').click();
    // the popover's livesearch prefix-filters the user list
    cy.get('.header-search-creator-search').type('adm');
    cy.get('.header-search-creator-row').should('have.length', 1);
    cy.get('.header-search-creator-search').clear();
    cy.get('.header-search-creator-row').contains('admin').click();
    // a selected entry stays visible even when the query hides it
    cy.get('.header-search-creator-search').type('zzz');
    cy.get('.header-search-creator-row').should('have.length', 1);
    cy.get('.header-search-creator-row input:checked').should('have.length', 1);
    cy.get('.header-search-creator-search').clear();
    // multi-select: the popover stays open after toggling
    cy.get('.header-search-creator-popover').should('exist');
    cy.get('.header-search-creator-row input:checked').should('have.length', 1);
    cy.get('body').type('{esc}');

    cy.get('.header-search-result-title').should('have.length', 2);
    cy.get('.header-search-chip.is-active').contains('Created by: admin');
  });

  it('Enter carries the filters to the results page and reload keeps them', () => {
    openDialogEverywhere('vacation');
    pickFilter('Type', 'News Item');
    cy.get('.header-search-result-title').should('have.length', 1);
    cy.get('.header-search-input-row input').type('{enter}');

    cy.url().should('include', '/search?SearchableText=vacation');
    cy.url().should('include', 'extra_conditions=');
    // scope to the result list: the logged-in toolbar's navigation
    // tree also lists all content titles, so a bare cy.contains would
    // match the filtered-out document there
    cy.get('.search-items').should('contain', 'Vacation news');
    cy.get('.search-items').should('not.contain', 'Vacation guide');

    // reloading the URL reproduces the filtered results
    cy.reload();
    cy.get('.search-items').should('contain', 'Vacation news');
    cy.get('.search-items').should('not.contain', 'Vacation guide');
  });
});
